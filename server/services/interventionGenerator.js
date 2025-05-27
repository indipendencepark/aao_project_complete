
const mongoose = require("mongoose");

const {Checklist: Checklist, Gap: Gap} = require("../models/diagnosi");

const {Intervento: Intervento} = require("../models/progettazione");

const {mapArea: mapArea, mapPriorita: mapPriorita, getTiming: getTiming} = require("../utils/mappingHelpers");

const {actionPlanRules: actionPlanRules} = require("../knowledge/actionPlanRules");

const {OpenAI: OpenAI} = require("openai");

const {getFullKnowledgeBase: getFullKnowledgeBase} = require("../utils/kbLoader");

const dotenv = require("dotenv");

const path = require("path");

dotenv.config({
  path: path.join(__dirname, "../../.env")
});

const openaiApiKey = process.env.OPENAI_API_KEY;

const MODEL_FOR_INTERVENTION_ENRICHMENT = process.env.OPENAI_MODEL_FOR_INTERVENTION || "gpt-4o-mini";

const openai = openaiApiKey ? new OpenAI({
  apiKey: openaiApiKey
}) : null;

 async function enrichInterventionSuggestionWithAI(gap, rule, clienteInfo) {
  if (!openai) {
    console.warn("OpenAI client non disponibile per arricchimento intervento.");
    return null;
  }
  console.log(`--- Arricchimento AI (FULL KB) per intervento basato su Gap ${gap.item_id} ---`);
  const kbContent = await getFullKnowledgeBase();

    if (kbContent === "ERRORE_CARICAMENTO_KB_COMPLETA") {
    console.error(`!!! ERRORE CRITICO: Impossibile caricare KB completa per arricchimento intervento Gap ${gap.item_id}`);
    return null;
  }
  const systemPrompt = `Sei un consulente esperto nella pianificazione di interventi aziendali correttivi e di miglioramento, basati su diagnosi e normative. Devi dettagliare un suggerimento di intervento basandoti sull'INTERA Knowledge Base.`;
  let userPrompt = `**INTERA BASE DI CONOSCENZA (Knowledge Base):**\n"""\n${kbContent}\n"""\n\n`;
  userPrompt += `PROFILO CLIENTE:\nNome: ${clienteInfo.nome || "N/D"}\nDimensione: ${clienteInfo.dimensioneStimata || "N/D"}\nSettore: ${clienteInfo.settore || "N/D"}\nObiettivi Strategici Dichiarati: ${clienteInfo.obiettiviStrategici || "Non specificati"}\nCriticità Percepite Dichiarate: ${clienteInfo.criticitaPercepite || "Non specificate"}\n\n`;
  userPrompt += `GAP RILEVATO (già arricchito):\nID: ${gap.item_id}\nDescrizione: ${gap.descrizione}\nImplicazioni: ${(Array.isArray(gap.implicazioni) ? gap.implicazioni.join("; ") : gap.implicazioni) || "N/D"}\nLivello Rischio: ${gap.livello_rischio}\nSuggerimenti AI per il Gap: ${gap.suggerimenti_ai?.join("; ") || "N/D"}\n\n`;
  userPrompt += `INTERVENTO STANDARD DA ACTIONPLANRULES:\nTitolo: ${rule.intervento}\nObiettivo Standard: ${rule.obiettivo_intervento || "Non specificato"}\nKPI Standard: ${rule.kpi_monitoraggio_suggeriti?.join(", ") || "Nessuno"}\n\n`;
  userPrompt += `RICHIESTA:\nFornisci un oggetto JSON con i seguenti campi:\n{\n`;
  userPrompt += `  "titolo_intervento_confermato": "${rule.intervento}",\n`;
  userPrompt += `  "descrizione_dettagliata_intervento": "Descrivi l'intervento in modo più operativo, indicando cosa si dovrebbe fare in pratica per QUESTO cliente, considerando il gap e l'INTERA KB.",\n`;
  userPrompt += `  "motivazione_contestualizzata_ai": "Spiega perché questo intervento è importante e prioritario per questo specifico cliente, collegandolo ai suoi obiettivi/criticità e ai rischi del gap, usando l'INTERA KB.",\n`;
  userPrompt += `  "obiettivo_specifico_intervento_ai": "Riformula o dettaglia l'obiettivo standard dell'intervento rendendolo più specifico per il contesto attuale. Se l'obiettivo standard è già ottimo, confermalo.",\n`;
  userPrompt += `  "kpi_monitoraggio_intervento_ai": ["KPI 1 specifico...", "KPI 2 specifico... (Conferma o adatta i KPI standard, suggerendone di misurabili per questo intervento, basandoti sull'INTERA KB)"],\n`;
  userPrompt += `  "riferimento_generico_kb_usato": "Indica brevemente la sezione/argomento principale della Knowledge Base che hai trovato PIU' utile per definire questo intervento. Es: 'Procedure per la gestione deleghe', 'Principi di segregazione dei compiti'. Se non applicabile, 'Nessun riferimento specifico'."\n`;
  userPrompt += `}\nAssicurati che il JSON sia valido e contenga SOLO questi campi.`;
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL_FOR_INTERVENTION_ENRICHMENT,
      messages: [ {
        role: "system",
        content: systemPrompt
      }, {
        role: "user",
        content: userPrompt
      } ],
      temperature: .4,
      response_format: {
        type: "json_object"
      }
    });
    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("Risposta AI vuota per arricchimento intervento.");
    }
    const enrichedJson = JSON.parse(responseContent);
    console.log(`--- JSON Arricchimento Intervento (FULL KB) VALIDO ricevuto per Gap ${gap.item_id}.`);
    console.log(`    Riferimento KB citato dall'AI: ${enrichedJson.riferimento_generico_kb_usato || "Nessuno"}`);
    return {
      titolo: enrichedJson.titolo_intervento_confermato || rule.intervento,
      descrizione: enrichedJson.descrizione_dettagliata_intervento,
      motivazioneContestualizzataAI: enrichedJson.motivazione_contestualizzata_ai,
      obiettivo_intervento: enrichedJson.obiettivo_specifico_intervento_ai || rule.obiettivo_intervento,
      kpi_monitoraggio_suggeriti: enrichedJson.kpi_monitoraggio_intervento_ai || rule.kpi_monitoraggio_suggeriti,
      riferimentiKbIntervento: enrichedJson.riferimento_generico_kb_usato ? [ {
        estrattoTesto: `Riferimento KB AI: ${enrichedJson.riferimento_generico_kb_usato}`
      } ] : [],
      tempistica_stimata: rule.timings ? `${getTiming(rule.timings, clienteInfo.dimensioneStimata)} giorni (stima)` : null,
      risorse_necessarie: rule.risorse?.join(", ") || null
    };
  } catch (error) {
    console.error(`!!! ERRORE Chiamata OpenAI per arricchimento intervento (Gap ${gap.item_id}):`, error.message);
    return null;

    }
}

 async function generateInterventionsFromGaps(checklistId) {
  console.log(`>>> Servizio interventionGenerator (v3.1 - Utility centralizzate): Avvio per Checklist ID: ${checklistId}`);
  const checklist = await Checklist.findById(checklistId).populate("cliente").lean();
  if (!checklist || !checklist.cliente?.dimensioneStimata || !checklist.cliente?.nome) {
    throw new Error("Checklist o dati cliente (dimensione/nome) mancanti.");
  }
  const clienteInfo = checklist.cliente;
  const riskLevelsToInclude = [ "alto", "medio" ];
  const relevantGaps = await Gap.find({

    checklist_id: checklistId,
    livello_rischio: {
      $in: riskLevelsToInclude
    },
    arricchitoConAI: true
  }).lean();
  console.log(`>>> Cancellazione interventi AI precedenti per checklist ${checklistId}...`);
  const deleteResult = await Intervento.deleteMany({
    checklist_id_origine: checklistId,
    origin: "ai_generated"
  });
  console.log(`>>> Interventi AI precedenti cancellati: ${deleteResult.deletedCount}`);
  if (!relevantGaps || relevantGaps.length === 0) {
    console.log(">>> Nessun gap rilevante (Alto/Medio e già arricchito con AI) trovato. Nessun intervento generato.");
    return 0;
  }
  console.log(`>>> Trovati ${relevantGaps.length} gap rilevanti e arricchiti per generare interventi.`);
  const nuoviInterventiPromises = [];
  for (const gap of relevantGaps) {
    const rule = actionPlanRules.find((r => r.gapId === gap.item_id));
    if (rule) {

      const enrichedInterventionData = await enrichInterventionSuggestionWithAI(gap, rule, clienteInfo);
      if (enrichedInterventionData) {
        const newInterventoData = {
          titolo: enrichedInterventionData.titolo,
          descrizione: enrichedInterventionData.descrizione,
          area: mapArea(gap.item_id),

          priorita: mapPriorita(rule.prioritaDefault),

          gap_correlati: [ gap._id ],
          stato: "suggerito",

          origin: "ai_generated",
          checklist_id_origine: checklistId,
          obiettivo_intervento: enrichedInterventionData.obiettivo_intervento,
          kpi_monitoraggio_suggeriti: enrichedInterventionData.kpi_monitoraggio_suggeriti,
          riferimentiKbIntervento: enrichedInterventionData.riferimentiKbIntervento,
          motivazioneContestualizzataAI: enrichedInterventionData.motivazioneContestualizzataAI,
          tempistica_stimata: enrichedInterventionData.tempistica_stimata,

          risorse_necessarie: enrichedInterventionData.risorse_necessarie
        };
        nuoviInterventiPromises.push(new Intervento(newInterventoData).save());
      } else {
        console.warn(`--- Arricchimento AI per intervento basato su Gap ${gap.item_id} fallito. Intervento standard non creato o creato con dati base.`);
      }
    } else {
      console.warn(`--- Nessuna regola trovata in actionPlanRules per Gap ID: ${gap.item_id}. Intervento non generato.`);
    }
    await new Promise((resolve => setTimeout(resolve, 100)));

    }
  const interventiSalvati = await Promise.all(nuoviInterventiPromises);
  console.log(`>>> ${interventiSalvati.length} nuovi interventi (AI) generati e salvati con successo.`);
  return interventiSalvati.length;
}

module.exports = {
  generateInterventionsFromGaps: generateInterventionsFromGaps
};