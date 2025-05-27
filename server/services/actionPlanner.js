
const mongoose = require("mongoose");

const {Checklist: Checklist, Gap: Gap} = require("../models/diagnosi");

const {PianoAzione: PianoAzione, Intervento: Intervento} = require("../models/progettazione");

const {actionPlanRules: actionPlanRules} = require("../knowledge/actionPlanRules");

const {generateInterventionsFromGaps: generateInterventionsFromGaps} = require("./interventionGenerator");

const {mapArea: mapArea, mapPriorita: mapPriorita, getTiming: getTiming} = require("../utils/mappingHelpers");

const {OpenAI: OpenAI} = require("openai");

const path = require("path");

const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, "../../.env")
});

const openaiApiKey = process.env.OPENAI_API_KEY;

const modelToUse = process.env.OPENAI_MODEL || "gpt-4o-mini";

const openai = openaiApiKey ? new OpenAI({
  apiKey: openaiApiKey
}) : null;

 const suggestActionPlan = async (checklistId, clienteInfo, riskLevelsToInclude = [ "alto", "medio" ]) => {
  console.log(`>>> Servizio actionPlanner (v3.1 - Utility centralizzate): Avvio suggerimento piano per Checklist ID: ${checklistId}`);
  const clienteDimensione = clienteInfo?.dimensioneStimata || "Piccola";
  const relevantGaps = await Gap.find({
    checklist_id: checklistId,
    livello_rischio: {
      $in: riskLevelsToInclude
    }
  }).select("_id item_id descrizione livello_rischio implicazioni suggerimenti_ai domandaText").lean();
  if (!relevantGaps || relevantGaps.length === 0) {
    console.log(">>> Nessun gap rilevante trovato per generare suggerimenti.");
    return [];
  }
  console.log(`>>> Trovati ${relevantGaps.length} gap rilevanti.`);
  const azioniProposteMap = new Map;
  relevantGaps.forEach((gap => {
    const rule = actionPlanRules.find((r => r.gapId === gap.item_id));
    if (rule) {
      const azioneId = `SUGG-${gap.item_id}`;
      const prioritaDefaultRegola = rule.prioritaDefault || "B";

            const mapRiskToPriorityLabel = {
        alto: "A",
        medio: "M",
        basso: "B"
      };
      const prioritaLabelDaRischio = mapRiskToPriorityLabel[gap.livello_rischio] || prioritaDefaultRegola;

            const priorityMapNum = {
        A: 1,
        M: 2,
        B: 3
      };

            const prioritaNum = priorityMapNum[prioritaLabelDaRischio] || 3;

            const tempisticaGiorni = getTiming(rule.timings, clienteDimensione);

            if (typeof tempisticaGiorni === "number" && !isNaN(tempisticaGiorni) && tempisticaGiorni > 0) {
        const azione = {
          id: azioneId,
          gapId: gap.item_id,
          gapDesc: gap.descrizione || "N/D",
          gapImplicazioni: Array.isArray(gap.implicazioni) ? gap.implicazioni.join("; ") : gap.implicazioni,
          gapSuggerimentiAI: gap.suggerimenti_ai || [],
          riskLevel: gap.livello_rischio,
          intervento: rule.intervento,
          obiettivoInterventoKB: rule.obiettivo_intervento || "",
          kpiMonitoraggioKB: rule.kpi_monitoraggio_suggeriti || [],
          prioritaNum: prioritaNum,

          prioritaLabel: prioritaLabelDaRischio,

          tempisticaGiorni: tempisticaGiorni,
          risorse: rule.risorse.join(", "),
          dipendeDaIds: rule.dipendeDa.map((depId => `SUGG-${depId}`)),
          bloccaIds: []
        };
        azioniProposteMap.set(azioneId, azione);
      } else {
        console.log(`--- Intervento per Gap ${gap.item_id} saltato (timing non valido: ${tempisticaGiorni} per dimensione ${clienteDimensione}).`);
      }
    }
  }));

    azioniProposteMap.forEach((azione => {
    azione.dipendeDaIds.forEach((dipendenzaId => {
      const azionePrecedente = azioniProposteMap.get(dipendenzaId);
      if (azionePrecedente) {
        azionePrecedente.bloccaIds.push(azione.id);
      } else {
        azione.dipendeDaIds = azione.dipendeDaIds.filter((id => id !== dipendenzaId));
      }
    }));
  }));
  const listaAzioniOrdinate = Array.from(azioniProposteMap.values());
  listaAzioniOrdinate.sort(((a, b) => {
    if (a.prioritaNum !== b.prioritaNum) {
      return a.prioritaNum - b.prioritaNum;
    }
    if (a.bloccaIds.length !== b.bloccaIds.length) {
      return b.bloccaIds.length - a.bloccaIds.length;
    }
    const riskOrder = {
      alto: 1,
      medio: 2,
      basso: 3
    };
    const riskA = riskOrder[a.riskLevel] || 9;
    const riskB = riskOrder[b.riskLevel] || 9;
    if (riskA !== riskB) {
      return riskA - riskB;
    }
    return a.id.localeCompare(b.id);
  }));
  console.log(`>>> Servizio actionPlanner (suggestActionPlan): Suggerimento piano completato con ${listaAzioniOrdinate.length} azioni.`);
  return listaAzioniOrdinate;
};

async function createAiActionPlan(checklistId) {
  console.log(`>>> Servizio actionPlanner (createAiActionPlan v1.1 - utility centralizzate)`);
  const checklist = await Checklist.findById(checklistId).populate("cliente").lean();
  if (!checklist || !checklist.cliente || !checklist.cliente.nome) throw new Error("Checklist o dati cliente mancanti");

    try {
    console.log(`>>> Chiamata a generateInterventionsFromGaps per assicurare esistenza interventi...`);
    await generateInterventionsFromGaps(checklistId);
    console.log(`>>> generateInterventionsFromGaps completato.`);
  } catch (interventionError) {
    console.error("Errore durante la generazione/verifica degli interventi:", interventionError);
    throw new Error(`Errore nella preparazione degli interventi: ${interventionError.message}`);
  }

    const interventiCorrelati = await Intervento.find({
    checklist_id_origine: checklistId,
    origin: "ai_generated"
  }).select("_id titolo area priorita obiettivo_intervento kpi_monitoraggio_suggeriti").lean();
  if (interventiCorrelati.length === 0) {
    console.warn("Nessun intervento AI generato per questa checklist. Il piano AI potrebbe essere vuoto o non creato.");

    }

    let planJson;
  try {
    planJson = await planActionsWithAI(checklistId, checklist.cliente, interventiCorrelati);
  } catch (plannerError) {
    console.error("Errore durante la chiamata all'AI Planner:", plannerError);
    throw new Error(`Errore nella generazione del piano AI: ${plannerError.message}`);
  }
  if (!planJson || !planJson.interventi_pianificati) {
    throw new Error("L'AI Planner non ha restituito un piano valido o il campo interventi_pianificati è mancante.");
  }
  const interventiIdsNelPiano = planJson.interventi_pianificati.map((p => p.id_intervento_originale)).filter((id => id && mongoose.Types.ObjectId.isValid(id)));

    const dataNuovoPiano = {
    titolo: planJson.titolo_suggerito_piano || `Piano AI - ${checklist.nome}`,
    descrizione: planJson.giudizio_sintetico_ai || `Piano d'azione generato da AI Planner per checklist ${checklist.nome}.`,
    cliente: {
      nome: checklist.cliente.nome
    },
    interventi: interventiIdsNelPiano,
    stato: "bozza",
    origin: "suggerito_ai",
    checklist_id_origine: checklistId
  };
  const nuovoPiano = new PianoAzione(dataNuovoPiano);
  await nuovoPiano.save();
  console.log(">>> Piano d'Azione AI salvato con ID:", nuovoPiano._id);
  return nuovoPiano;
}

async function planActionsWithAI(checklistId, clienteInfo, interventiPreGenerati) {
  if (!openai) {
    console.warn("OpenAI client non configurato. Impossibile chiamare planActionsWithAI.");

        return {
      titolo_suggerito_piano: `Piano Placeholder (AI non attiva) - ${clienteInfo.nome}`,
      giudizio_sintetico_ai: "AI non disponibile. Piano da compilare manualmente.",
      interventi_pianificati: interventiPreGenerati.map(((inter, idx) => ({
        ordine: idx + 1,
        titolo_intervento: inter.titolo,
        id_intervento_originale: inter._id.toString(),
        motivazione_intervento: "Da definire",
        obiettivo_specifico: inter.obiettivo_intervento || "Da definire",
        kpi_monitoraggio_suggeriti: inter.kpi_monitoraggio_suggeriti || [],
        area_funzionale: inter.area || mapArea(inter.item_id)
      })))
    };
  }
  console.warn("La funzione planActionsWithAI necessita di una vera implementazione con chiamata LLM. Attualmente usa dati placeholder.");

    return {
    titolo_suggerito_piano: `Piano AI Placeholder per ${clienteInfo.nome}`,
    giudizio_sintetico_ai: "Analisi preliminare AI.",
    interventi_pianificati: interventiPreGenerati.map(((inter, idx) => ({
      ordine: idx + 1,

      titolo_intervento: inter.titolo,
      id_intervento_originale: inter._id.toString(),

      motivazione_intervento: "Motivazione placeholder AI per piano.",
      obiettivo_specifico: inter.obiettivo_intervento || "Obiettivo placeholder.",
      kpi_monitoraggio_suggeriti: inter.kpi_monitoraggio_suggeriti || [],
      area_funzionale: inter.area || mapArea(inter.item_id)
    })))
  };
}

module.exports = {
  suggestActionPlan: suggestActionPlan,
  createAiActionPlan: createAiActionPlan
};
