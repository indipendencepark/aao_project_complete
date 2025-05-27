// START OF FILE server/services/actionPlanner.js (AGGIORNATO con createAiActionPlan)

const mongoose = require('mongoose');
const { Checklist, Gap } = require('../models/diagnosi');
const { PianoAzione, Intervento } = require('../models/progettazione'); // Assicurati che Intervento sia importato
const { actionPlanRules } = require('../knowledge/actionPlanRules'); // Non esporta più getTiming
const { generateInterventionsFromGaps } = require('./interventionGenerator'); // Importa il generatore interventi
// const { retrieveRelevantChunks } = require('./knowledgeRetriever'); // Commentato se non usato direttamente qui

// --- IMPORTA LE UTILITY ---
const { mapArea, mapPriorita, getTiming } = require('../utils/mappingHelpers');
// -------------------------

// --- NUOVO: Import e Definizione Client AI ---
const { OpenAI } = require('openai');
// const fs = require('fs').promises; // Commentato se non usato per caricare KB qui
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;
const modelToUse = process.env.OPENAI_MODEL || "gpt-4o-mini"; // Aggiornato modello se vuoi
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;


// Le definizioni di mapArea, mapPriorita e priorityMap non servono più localmente se importate

/**
 * Genera una bozza di Piano d'Azione suggerito basato sui gap di una checklist.
 * (La funzione suggestActionPlan ora usa le utility importate)
 */
const suggestActionPlan = async (checklistId, clienteInfo, riskLevelsToInclude = ['alto', 'medio']) => {
    console.log(`>>> Servizio actionPlanner (v3.1 - Utility centralizzate): Avvio suggerimento piano per Checklist ID: ${checklistId}`);
    const clienteDimensione = clienteInfo?.dimensioneStimata || 'Piccola';

    const relevantGaps = await Gap.find({ 
        checklist_id: checklistId,
        livello_rischio: { $in: riskLevelsToInclude }
    }).select('_id item_id descrizione livello_rischio implicazioni suggerimenti_ai domandaText').lean();
    
    if (!relevantGaps || relevantGaps.length === 0) {
        console.log(">>> Nessun gap rilevante trovato per generare suggerimenti.");
        return [];
    }
    console.log(`>>> Trovati ${relevantGaps.length} gap rilevanti.`);

    const azioniProposteMap = new Map();
    relevantGaps.forEach(gap => {
        const rule = actionPlanRules.find(r => r.gapId === gap.item_id);
        if (rule) {
            const azioneId = `SUGG-${gap.item_id}`;
            
            const prioritaDefaultRegola = rule.prioritaDefault || 'B';
            // Determina l'etichetta di priorità (A/M/B) basandoti sul rischio del gap, con fallback alla regola.
            const mapRiskToPriorityLabel = { 'alto': 'A', 'medio': 'M', 'basso': 'B' };
            const prioritaLabelDaRischio = mapRiskToPriorityLabel[gap.livello_rischio] || prioritaDefaultRegola;

            // Usa mapPriorita (importata) per ottenere la label 'alta','media','bassa' se necessario altrove,
            // ma per prioritaNum, usiamo la logica A/M/B direttamente.
            const priorityMapNum = { 'A': 1, 'M': 2, 'B': 3 }; // Mappa A/M/B a numero
            const prioritaNum = priorityMapNum[prioritaLabelDaRischio] || 3; // Default a 3 (Bassa)

            const tempisticaGiorni = getTiming(rule.timings, clienteDimensione); // Usa getTiming importata

            // Verifica se tempisticaGiorni è un numero valido e positivo
            if (typeof tempisticaGiorni === 'number' && !isNaN(tempisticaGiorni) && tempisticaGiorni > 0) {
                const azione = {
                    id: azioneId,
                    gapId: gap.item_id,
                    gapDesc: gap.descrizione || 'N/D',
                    gapImplicazioni: Array.isArray(gap.implicazioni) ? gap.implicazioni.join('; ') : gap.implicazioni,
                    gapSuggerimentiAI: gap.suggerimenti_ai || [],
                    riskLevel: gap.livello_rischio,
                    intervento: rule.intervento,
                    obiettivoInterventoKB: rule.obiettivo_intervento || '',
                    kpiMonitoraggioKB: rule.kpi_monitoraggio_suggeriti || [],
                    prioritaNum: prioritaNum, // Numero per ordinamento
                    prioritaLabel: prioritaLabelDaRischio, // Etichetta A/M/B (o quella da regola)
                    tempisticaGiorni: tempisticaGiorni,
                    risorse: rule.risorse.join(', '),
                    dipendeDaIds: rule.dipendeDa.map(depId => `SUGG-${depId}`),
                    bloccaIds: [],
                };
                azioniProposteMap.set(azioneId, azione);
            } else {
                console.log(`--- Intervento per Gap ${gap.item_id} saltato (timing non valido: ${tempisticaGiorni} per dimensione ${clienteDimensione}).`);
            }
        }
    });
    
    // Costruzione grafico dipendenze (come prima)
    azioniProposteMap.forEach(azione => {
        azione.dipendeDaIds.forEach(dipendenzaId => {
            const azionePrecedente = azioniProposteMap.get(dipendenzaId);
            if (azionePrecedente) {
                azionePrecedente.bloccaIds.push(azione.id);
            } else {
                 azione.dipendeDaIds = azione.dipendeDaIds.filter(id => id !== dipendenzaId);
            }
        });
    });

    const listaAzioniOrdinate = Array.from(azioniProposteMap.values());
    listaAzioniOrdinate.sort((a, b) => { 
        if (a.prioritaNum !== b.prioritaNum) {
            return a.prioritaNum - b.prioritaNum;
        }
        if (a.bloccaIds.length !== b.bloccaIds.length) {
            return b.bloccaIds.length - a.bloccaIds.length;
        }
        const riskOrder = { 'alto': 1, 'medio': 2, 'basso': 3 };
        const riskA = riskOrder[a.riskLevel] || 9;
        const riskB = riskOrder[b.riskLevel] || 9;
        if (riskA !== riskB) {
            return riskA - riskB;
        }
        return a.id.localeCompare(b.id);
    });

    console.log(`>>> Servizio actionPlanner (suggestActionPlan): Suggerimento piano completato con ${listaAzioniOrdinate.length} azioni.`);
    return listaAzioniOrdinate;
};


async function createAiActionPlan(checklistId) {
    console.log(`>>> Servizio actionPlanner (createAiActionPlan v1.1 - utility centralizzate)`);
    const checklist = await Checklist.findById(checklistId).populate('cliente').lean();
    if (!checklist || !checklist.cliente || !checklist.cliente.nome) throw new Error('Checklist o dati cliente mancanti');
    
    // 1. Genera/Aggiorna gli interventi (usa generateInterventionsFromGaps che ora è aggiornato)
    try {
        console.log(`>>> Chiamata a generateInterventionsFromGaps per assicurare esistenza interventi...`);
        await generateInterventionsFromGaps(checklistId);
        console.log(`>>> generateInterventionsFromGaps completato.`);
    } catch (interventionError) {
        console.error("Errore durante la generazione/verifica degli interventi:", interventionError);
        throw new Error(`Errore nella preparazione degli interventi: ${interventionError.message}`);
    }

    // 2. Recupera gli interventi AI per questa checklist
    const interventiCorrelati = await Intervento.find({
        checklist_id_origine: checklistId,
        origin: 'ai_generated'
    }).select('_id titolo area priorita obiettivo_intervento kpi_monitoraggio_suggeriti').lean(); 

    if (interventiCorrelati.length === 0) {
        console.warn("Nessun intervento AI generato per questa checklist. Il piano AI potrebbe essere vuoto o non creato.");
        // Non lanciamo errore, lasciamo che planActionsWithAI gestisca una lista vuota se necessario.
    }
    
    // 3. Chiama l'AI Planner (planActionsWithAI)
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
    
    const interventiIdsNelPiano = planJson.interventi_pianificati
                                    .map(p => p.id_intervento_originale)
                                    .filter(id => id && mongoose.Types.ObjectId.isValid(id)); // Assicura che gli ID siano validi ObjectId

    const dataNuovoPiano = {
        titolo: planJson.titolo_suggerito_piano || `Piano AI - ${checklist.nome}`,
        descrizione: planJson.giudizio_sintetico_ai || `Piano d'azione generato da AI Planner per checklist ${checklist.nome}.`,
        cliente: { nome: checklist.cliente.nome }, 
        interventi: interventiIdsNelPiano, 
        stato: 'bozza',
        origin: 'suggerito_ai',
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
        // Restituisce una struttura base se l'AI non è attiva, per evitare crash a valle
        return {
            titolo_suggerito_piano: `Piano Placeholder (AI non attiva) - ${clienteInfo.nome}`,
            giudizio_sintetico_ai: "AI non disponibile. Piano da compilare manualmente.",
            interventi_pianificati: interventiPreGenerati.map((inter, idx) => ({
                ordine: idx + 1,
                titolo_intervento: inter.titolo,
                id_intervento_originale: inter._id.toString(),
                motivazione_intervento: "Da definire",
                obiettivo_specifico: inter.obiettivo_intervento || "Da definire",
                kpi_monitoraggio_suggeriti: inter.kpi_monitoraggio_suggeriti || [],
                area_funzionale: inter.area || mapArea(inter.item_id) // Usa mapArea se serve (assicurati che inter.item_id esista)
            }))
        };
    }
    console.warn("La funzione planActionsWithAI necessita di una vera implementazione con chiamata LLM. Attualmente usa dati placeholder.");
    // Placeholder per ora, da sostituire con una vera chiamata LLM
    // Il prompt per l'LLM dovrebbe istruire a usare gli `interventiPreGenerati` 
    // e a restituire `id_intervento_originale` per ciascuno.
    // Esempio di struttura del prompt (molto semplificato):
    /*
    const systemPrompt = "Sei un AI Project Manager...";
    let userPrompt = `Cliente: ${clienteInfo.nome}, Dimensione: ${clienteInfo.dimensioneStimata}.\n`;
    userPrompt += `Interventi suggeriti (già arricchiti):
${interventiPreGenerati.map(i => `- ID: ${i._id}, Titolo: ${i.titolo}, Obiettivo: ${i.obiettivo_intervento}`).join('\n')}\n
`;
    userPrompt += `Crea un piano d'azione coerente, restituisci un JSON con titolo_suggerito_piano, giudizio_sintetico_ai e una lista interventi_pianificati. Per ogni intervento in lista, includi: ordine, titolo_intervento (puoi riformularlo brevemente), id_intervento_originale (l'ID dell'intervento suggerito che hai usato), motivazione_intervento (perché nel piano), obiettivo_specifico (se raffinato), kpi_monitoraggio_suggeriti, area_funzionale.";
    
    try {
        const completion = await openai.chat.completions.create({
            model: modelToUse, // o un modello specifico per la pianificazione
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.5
        });
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error("Errore chiamata OpenAI in planActionsWithAI:", error);
        throw error;
    }
    */
    
    // Ritorno placeholder come da tua richiesta precedente
    return {
        titolo_suggerito_piano: `Piano AI Placeholder per ${clienteInfo.nome}`,
        giudizio_sintetico_ai: "Analisi preliminare AI.",
        interventi_pianificati: interventiPreGenerati.map((inter, idx) => ({
            ordine: idx + 1,
            // id_intervento_kb: rule?.gapId, // Questa riga era problematica, `rule` non è definito qui. Rimuoviamola o correggiamola se `inter` ha un riferimento al gapId.
            titolo_intervento: inter.titolo,
            id_intervento_originale: inter._id.toString(), // Assicurati che sia una stringa se l'AI lo richiede
            motivazione_intervento: "Motivazione placeholder AI per piano.",
            obiettivo_specifico: inter.obiettivo_intervento || "Obiettivo placeholder.",
            kpi_monitoraggio_suggeriti: inter.kpi_monitoraggio_suggeriti || [],
            area_funzionale: inter.area || mapArea(inter.item_id) // Esempio di uso di mapArea importata
        }))
    };
}


module.exports = { suggestActionPlan, createAiActionPlan }; 

// END OF FILE server/services/actionPlanner.js (AGGIORNATO con createAiActionPlan)