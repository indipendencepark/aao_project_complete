// START OF FILE server/services/documentGeneratorAI.js (AGGIORNATO con Riferimenti, Obiettivi, KPI Intervento)

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const fs = require('fs').promises;
const path = require('path');
// const { retrieveRelevantChunks } = require('./knowledgeRetriever'); // Importa il retriever
const { getFullKnowledgeBase } = require('../utils/kbLoader'); // NUOVO IMPORT

const { Intervento } = require('../models/progettazione');
// Rimuoviamo Gap e Checklist da qui, li recuperiamo tramite populate
// const { Gap } = require('../models/diagnosi');
// const { Checklist } = require('../models/diagnosi');

// --- NUOVO: Import KB per Obiettivi/KPI Intervento ---
const { actionPlanRules } = require('../knowledge/actionPlanRules');
// Importiamo anche gapRules per i riferimenti, anche se idealmente sarebbero già nel gap popolato
const gapRules = require('../knowledge/gapRules');
// -----------------------------------------------------

dotenv.config();

// --- Configurazione OpenAI ---
const openaiApiKey = process.env.OPENAI_API_KEY;
// Assicurati che il nome modello sia corretto per quello che usi
// const modelToUse = "gpt-4.1-mini"; // USA IL NOME CORRETTO DEL MODELLO
const modelToUse = "gpt-4.1-nano-2025-04-14";
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// --- NUOVO: Percorso File KB e Funzione Caricamento ---
// Rimuoviamo la vecchia gestione della KB qui
// const KB_FILE_PATH = path.join(__dirname, '../knowledge/concatenated_kb.txt');
// let knowledgeBaseContent = null; // Cache per il contenuto della KB

// async function loadKnowledgeBase() {
//    // Carica solo se non già in cache
//    if (knowledgeBaseContent === null) {
//        try {
//            console.log(`>>> Caricamento Knowledge Base da: ${KB_FILE_PATH}`);
//            knowledgeBaseContent = await fs.readFile(KB_FILE_PATH, 'utf8');
//            console.log(`>>> Knowledge Base caricata (${knowledgeBaseContent.length} caratteri).`);
//        } catch (error) {
//            console.error(`!!! ERRORE CRITICO: Impossibile caricare Knowledge Base dal file ${KB_FILE_PATH}`, error);
//            knowledgeBaseContent = "ERRORE_CARICAMENTO_KB"; // Segnaposto per evitare chiamate senza KB
//        }
//    }
//    return knowledgeBaseContent;
// }
// // Carica la KB all'avvio del server (o alla prima richiesta)
// loadKnowledgeBase();
// ----------------------------------------------------

// --- Funzioni Helper (Potrebbero essere condivise/importate) ---
/**
 * Converte il codice area (Org, Admin, Acct, Crisi, IT, Altro) in un'etichetta leggibile.
 * @param {string} areaCode - Il codice dell'area.
 * @returns {string} L'etichetta leggibile o il codice stesso se non mappato.
 */
const getAreaLabel = (areaCode) => {
    const areaMap = {
        Org: 'Assetto Organizzativo',
        Admin: 'Assetto Amministrativo',
        Acct: 'Assetto Contabile',
        Crisi: 'Rilevazione Crisi',
        IT: 'IT',
        Altro: 'Altro'
        // Aggiungere altri mapping se necessario
    };
    // Restituisce l'etichetta mappata, o il codice originale se non trovato, o 'N/D' se input è nullo/vuoto
    return areaMap[areaCode] || areaCode || 'N/D';
};

/**
 * Converte il codice priorità ('alta', 'media', 'bassa') in un'etichetta leggibile con iniziale maiuscola.
 * @param {string} priority - Il codice della priorità.
 * @returns {string} L'etichetta leggibile o 'N/D'.
 */
const getPriorityLabel = (priority) => {
    if (!priority) return 'N/D';
    // Converte in minuscolo per sicurezza, poi mette maiuscola la prima lettera
    const lowerPriority = priority.toLowerCase();
    return lowerPriority.charAt(0).toUpperCase() + lowerPriority.slice(1);
};

/**
 * Genera una bozza di documento tramite AI basandosi su un intervento.
 * @param {string} interventoId ID dell'intervento Mongoose.
 * @param {string} tipoDocumento Tipo di documento da generare ('procedura', 'mansionario', ecc.).
 * @param {object} [parametriUtente={}] Oggetto con parametri aggiuntivi (es. { titoloProcedura: 'Nome Procedura' }).
 * @returns {Promise<string>} La bozza del documento generata come stringa (es. Markdown).
 * @throws {Error} Se OpenAI non è configurato, intervento non trovato, o generazione fallisce.
 */

const generateDocumentDraft = async (interventoId, tipoDocumento, parametriUtente = {}) => {
    console.log(`>>> Servizio documentGeneratorAI (FULL KB): Avvio generazione bozza ${tipoDocumento} per intervento ${interventoId}`);
    if (!openai) throw new Error("OpenAI client non inizializzato.");
    if (!interventoId || !tipoDocumento) throw new Error("ID intervento e tipo documento sono obbligatori.");

    // --- Carica la KB (usa la cache o legge da file) ---
    // const kbText = await loadKnowledgeBase(); // QUESTA PARTE NON SERVE PIU' COSI'
    // if (kbText === "ERRORE_CARICAMENTO_KB" || !kbText) {
    //     throw new Error("Base di conoscenza non disponibile per la generazione.");
    // }
    // ---------------------------------------------------
    const kbContent = await getFullKnowledgeBase(); // Carica l'intera KB
    if (kbContent === "ERRORE_CARICAMENTO_KB_COMPLETA") {
        console.error("!!! ERRORE CRITICO: Impossibile caricare la Knowledge Base completa.");
        throw new Error("Base di conoscenza completa non disponibile per la generazione.");
    }

    // 1. Recupera Intervento e Contesto (come prima)
    console.log(`>>> Recupero intervento ${interventoId}...`);
    const intervento = await Intervento.findById(interventoId)
                                      .populate({ path: 'gap_correlati', select: 'item_id domandaText descrizione implicazioni livello_rischio' })
                                      .populate({ path: 'checklist_id_origine', select: 'cliente' }) // Popola la checklist per il cliente
                                      .lean();

    if (!intervento) throw new Error(`Intervento con ID ${interventoId} non trovato.`);
    console.log(">>> Intervento recuperato.");

    const clienteInfo = intervento.checklist_id_origine?.cliente || {};
    const gaps = intervento.gap_correlati || [];
    const obiettiviCliente = clienteInfo.obiettiviStrategici || 'Non specificati'; // Recupera obiettivi
    const criticitaCliente = clienteInfo.criticitaPercepite || 'Non specificate'; // Recupera criticità

    // --- NUOVO: Recupero Chunk Rilevanti --- // RIMOSSO
    // Costruisci una query significativa per il recupero.
    // Potrebbe essere il titolo dell'intervento, la descrizione del gap, o una combinazione.
    // const retrievalQuery = `Documento tipo "${tipoDocumento}" per intervento: ${intervento.titolo}. Gap correlati: ${gaps.map(g => g.descrizione).join('; ')}. Cliente: ${clienteInfo.nome}, Settore: ${clienteInfo.settore}.`;

    // console.log(`>>> documentGeneratorAI: Query per recupero chunk: "${retrievalQuery.substring(0,100)}..."`);
    // const retrievedChunkObjects = await retrieveRelevantChunks(retrievalQuery, 5); 
    
    // let retrievedKbTextForPrompt = "Nessun contesto specifico dalla KB recuperato.";
    // if (retrievedChunkObjects.length > 0) {
    //     retrievedKbTextForPrompt = "Contesto rilevante dalla Knowledge Base:\n\n" + 
    //                               retrievedChunkObjects.map((chunkObj, idx) => 
    //                                   `--- Contesto KB ${idx+1} (ID: ${chunkObj.id}, Sim: ${chunkObj.similarity.toFixed(3)}) ---\n${chunkObj.text}\n--- Fine Contesto KB ${idx+1} ---`
    //                               ).join('\n\n');
    //     // Logga solo il testo per il prompt, i dettagli sono già loggati da retrieveRelevantChunks
    //     console.log(`>>> documentGeneratorAI: Contesto per LLM costruito con ${retrievedChunkObjects.length} chunk.`);
    // } else {
    //     console.log(">>> documentGeneratorAI: Nessun chunk rilevante recuperato dalla KB per il prompt.");
    // }
    // ---------------------------------------

        // --- NUOVO: Recupera Info Intervento da KB actionPlanRules ---
        let obiettivoIntervento = "Formalizzare l'azione correttiva descritta."; // Default
        let kpiMonitoraggioIntervento = [];
        // Troviamo il gap principale o il primo gap per cercare la regola corrispondente
        const primaryGapId = gaps.length > 0 ? gaps[0].item_id : null;
        if (primaryGapId) {
            const actionRule = actionPlanRules.find(r => r.gapId === primaryGapId);
            if (actionRule) {
                obiettivoIntervento = actionRule.obiettivo_intervento || obiettivoIntervento;
                kpiMonitoraggioIntervento = actionRule.kpi_monitoraggio_suggeriti || [];
            }
        }
        console.log(`--- Info Intervento: Obiettivo='${obiettivoIntervento}', KPI Suggeriti=[${kpiMonitoraggioIntervento.join(', ')}]`);
        // --- FINE RECUPERO INFO INTERVENTO ---
    
        // --- NUOVO: Aggrega Riferimenti Normativi dai Gap ---
        const riferimentiAggregati = new Set(); // Usiamo un Set per evitare duplicati
        gaps.forEach(gap => {
            // Prova a prenderli dal gap popolato (se li avessimo aggiunti allo schema Gap)
            if (gap.riferimenti_normativi && Array.isArray(gap.riferimenti_normativi)) {
                 gap.riferimenti_normativi.forEach(ref => riferimentiAggregati.add(ref));
            } else {
                // Altrimenti, cercali di nuovo in gapRules (fallback)
                 const rule = gapRules.find(r => r.itemId === gap.item_id);
                 if (rule && typeof rule.getGapDetails === 'function') {
                     try {
                         const detailsFromRule = rule.getGapDetails({}, clienteInfo); // Passa cliente vuoto se non serve
                         if (detailsFromRule?.riferimenti_normativi) {
                              detailsFromRule.riferimenti_normativi.forEach(ref => riferimentiAggregati.add(ref));
                         }
                     } catch (e) {}
                 }
            }
        });
        const riferimentiUnici = Array.from(riferimentiAggregati);
        console.log(`--- Riferimenti Normativi Aggregati: [${riferimentiUnici.join(', ')}]`);
        // --- FINE AGGREGAZIONE RIFERIMENTI ---

       // 2. Costruisci il Prompt Esteso (Integrando nuove info)
       let systemPrompt = `Sei un consulente senior esperto di organizzazione aziendale, compliance e gestione dei processi. Il tuo compito è generare una bozza di documento aziendale (es. procedura, mansionario, policy) che sia completa, accurata, operativamente utile e formalmente corretta. Rispondi SOLO con il documento richiesto in formato Markdown. Assicurati che il contenuto sia **coerente con i riferimenti normativi** forniti e contribuisca all'**obiettivo specifico dell'intervento**, basandoti sull'INTERA Knowledge Base fornita.`; // Aggiunta precisazione

    // --- User Prompt (strutturato) ---
    let userPrompt = `**INTERA BASE DI CONOSCENZA (Knowledge Base):**\n"""\n${kbContent}\n"""\n\n`;
    // userPrompt += `SEZIONE 1: CONTESTO RILEVANTE DALLA BASE DI CONOSCENZA\n`; // RIMOSSO
    // userPrompt += `--------------------------------------------------\n\n`;
    // userPrompt += retrievedKbTextForPrompt; // Usa il testo dei chunk // RIMOSSO
    // userPrompt += `\n\n--------------------------------------------------\n`;
    userPrompt += `SEZIONE 1: CONTESTO SPECIFICO CLIENTE E INTERVENTO\n`; // Rinominata SEZIONE 1
    userPrompt += `--------------------------------------------------\n\n`;
    userPrompt += `**Cliente:**\n`;
    userPrompt += `* Nome: ${clienteInfo.nome || 'N/D'}\n`;
    userPrompt += `* Dimensione Stimata: ${clienteInfo.dimensioneStimata || 'Non specificata'}\n`;
    userPrompt += `* Complessità: ${clienteInfo.complessita || 'Non specificata'}\n`;
    userPrompt += `* Settore: ${clienteInfo.settore || 'Non specificato'}\n`;
    userPrompt += `* Forma Giuridica: ${clienteInfo.formaGiuridica || 'Non specificata'}\n\n`;
    userPrompt += `* Obiettivi Strategici Cliente: ${obiettiviCliente}\n`;
    userPrompt += `* Criticità Percepite Cliente: ${criticitaCliente}\n\n`;

    userPrompt += `**Intervento da Formalizzare:**\n`;
    userPrompt += `* Titolo Intervento: ${intervento.titolo}\n`;
    userPrompt += `* Obiettivo Specifico Intervento: ${obiettivoIntervento}\n`; // <-- NUOVO
    userPrompt += `* Descrizione Intervento: ${intervento.descrizione || 'N/D'}\n\n`;


    if (gaps.length > 0) {
        userPrompt += `**Gap Correlati Rilevanti:**\n`;
        gaps.forEach((gap, index) => {
            userPrompt += `${index + 1}. **Gap ${gap.item_id} (Rischio: ${gap.livello_rischio || 'N/D'})**\n`;
            // Idealmente qui avremmo la descrizione/implicazione ARRICCHITA dalla Fase 1 AI
            userPrompt += `   * Descrizione Problema: ${gap.descrizione || 'N/D'}\n`;
            userPrompt += `   * Implicazioni Note: ${gap.implicazioni || 'N/D'}\n`;
        });
        userPrompt += "\n";
    }

        // --- NUOVO: Includi Riferimenti e KPI Intervento nel contesto ---
        if (riferimentiUnici.length > 0) {
            userPrompt += `**Riferimenti Normativi/Best Practice Pertinenti all'Intervento (da rispettare scrupolosamente):**\n`;
            riferimentiUnici.forEach(ref => userPrompt += `* ${ref}\n`);
            userPrompt += "\n";
        }
        if (kpiMonitoraggioIntervento.length > 0) {
             userPrompt += `**KPI Suggeriti per Monitorare l'Efficacia di QUESTO Intervento:**\n`;
             kpiMonitoraggioIntervento.forEach(kpi => userPrompt += `* ${kpi}\n`);
             userPrompt += "\n";
        }
        // --- FINE NUOVI CAMPI CONTESTO ---

    // --- Aggiunta Parametri Utente (se presenti) ---
    if (Object.keys(parametriUtente).length > 0) {
         userPrompt += `**Parametri Specifici Forniti:**\n`;
         if (parametriUtente.titoloProcedura) userPrompt += `* Titolo Specifico Richiesto: "${parametriUtente.titoloProcedura}"\n`;
         if (parametriUtente.ruolo) userPrompt += `* Ruolo Specifico Richiesto: "${parametriUtente.ruolo}"\n`;
         // Aggiungere altri parametri qui...
         userPrompt += "\n";
    }
    // ---------------------------------------------

    // ... (Sezione 1: KB e Sezione 2: Contesto rimangono invariate) ...

    userPrompt += `--------------------------------------------------\n`;
    userPrompt += `SEZIONE 2: RICHIESTA SPECIFICA\n`; // Rinominata SEZIONE 2
    userPrompt += `--------------------------------------------------\n\n`;
    userPrompt += `Genera una bozza completa, dettagliata e operativamente utile per il documento di tipo **"${tipoDocumento}"** relativo all'intervento sopra descritto.\n`;
    userPrompt += `La bozza deve essere in formato Markdown e seguire una struttura logica appropriata.\n`;
    userPrompt += `**IMPORTANTE:** Assicurati che il contenuto generato sia **strettamente coerente con i Riferimenti Normativi/Best Practice forniti**, contribuisca a raggiungere l'**Obiettivo Specifico dell'Intervento** e, ove pertinente (es. procedure), faccia riferimento ai **KPI di Monitoraggio suggeriti**, basandoti sull'**INTERA Knowledge Base** fornita all'inizio di questo prompt.\n\n`;

// Istruzioni specifiche per tipo (RAFFINATE)
    switch (tipoDocumento.toLowerCase()) {
        case 'procedura':
            userPrompt += `**Istruzioni Specifiche per la PROCEDURA:**\n`;
            userPrompt += `- Includi tutte le sezioni standard (Scopo, Ambito, Riferimenti, Definizioni, Responsabilità, Descrizione Fasi Dettagliate, Punti di Controllo, KPI, Modulistica, Eccezioni, Archiviazione, Revisioni).\n`;
            userPrompt += `- Nella sezione **Descrizione Fasi**, dettaglia almeno 5-7 fasi principali con minimo 3-5 azioni specifiche per fase. Sii operativo e chiaro.\n`;
            userPrompt += `- Nella sezione **Punti di Controllo**, elenca almeno 3-5 controlli chiave specifici per mitigare i rischi dei Gap Correlati. Specifica CHI, COME, QUANDO e il **rischio mitigato** (facendo riferimento ai Riferimenti Normativi e all'INTERA Knowledge Base se applicabile).\n`;
            userPrompt += `- Nella sezione **KPI**, includi i **KPI di Monitoraggio Intervento suggeriti** sopra e descrivi brevemente come verranno misurati.\n`;
                    if (parametriUtente.titoloProcedura) {
             userPrompt += `- Usa come titolo esatto della procedura: "${parametriUtente.titoloProcedura}".\n`;
        }
        break;

    case 'mansionario':
        userPrompt += `**Istruzioni Specifiche per il MANSIONARIO:**\n`;
         if (parametriUtente.ruolo) {
             userPrompt += `- Il mansionario è per il ruolo specifico di: **"${parametriUtente.ruolo}"**. Focalizza la descrizione su questo ruolo.\n`;
         } else {
             userPrompt += `- Il mansionario è per il ruolo implicato dall'intervento. Identificalo chiaramente basandoti sul contesto e sull'INTERA Knowledge Base.\n`;
         }
        userPrompt += `- Includi **tutte** le sezioni standard: Posizione Organizzativa, Collocazione (Riporta a / Coordina), Finalità/Scopo della Posizione, Responsabilità Principali, Attività/Compiti Specifici, Relazioni Interne/Esterne, Competenze/Requisiti.\n`;
        userPrompt += `- Nella sezione **Responsabilità Principali**, elenca **almeno 5-7 aree di responsabilità chiave** per il ruolo, derivate dalla sua funzione e dall'intervento/gap correlati, utilizzando l'INTERA Knowledge Base per approfondire.\n`;
        userPrompt += `- Nella sezione **Attività/Compiti Specifici**, dettaglia con un elenco puntato **numerose azioni concrete (minimo 8-10)** che il ruolo svolge regolarmente per adempiere alle sue responsabilità. Sii specifico e operativo, traendo spunto dall'INTERA Knowledge Base.\n`;
        userPrompt += `- Nella sezione **Competenze/Requisiti**, elenca sia hard skills (conoscenze tecniche, software) sia soft skills (capacità relazionali, problem solving) necessarie, pertinenti al ruolo e al contesto aziendale, informate dall'INTERA Knowledge Base.\n`;
        userPrompt += `- Assicurati che le responsabilità e i compiti siano **coerenti con l'intervento** che questo mansionario contribuisce a formalizzare e con i **gap che mira a risolvere**.\n`;
        userPrompt += `- Assicurati che le **Responsabilità e i Compiti riflettano l'Obiettivo Specifico dell'Intervento** e le azioni necessarie per colmare i Gap Correlati, coerentemente con i Riferimenti Normativi e l'INTERA Knowledge Base.\n`;
        break;

        case 'organigramma': // Descrizione testuale
        userPrompt += `**Istruzioni Specifiche per la DESCRIZIONE ORGANIGRAMMA:**\n`;
        userPrompt += `- Descrivi in modo **testuale, chiaro, strutturato e completo** la struttura organizzativa risultante o formalizzata dall'intervento, basandoti sull'INTERA Knowledge Base per best practice e modelli.\n`;
        userPrompt += `- Definisci il vertice e le **principali Aree/Funzioni/Direzioni**, spiegandone lo **scopo** in coerenza con l'**Obiettivo Specifico dell'Intervento**.\n`;
        userPrompt += `- Dettaglia le **Unità Organizzative/Ruoli chiave** interni a ciascuna area e le **linee di riporto gerarchico e funzionale** in modo inequivocabile.\n`;
        userPrompt += `- Assicurati che la struttura descritta sia **coerente con i Riferimenti Normativi/Best Practice** sulla governance e la segregazione dei compiti (se pertinenti all'intervento e presenti nell'INTERA Knowledge Base).\n`;
        userPrompt += `- Se rilevante, indica come la nuova struttura contribuisce al monitoraggio dei **KPI suggeriti** per l'intervento.\n`;
        userPrompt += `- La descrizione deve risolvere le ambiguità evidenziate nei **Gap Correlati** (es. B.1.1, B.1.2).\n`;
        break;

    case 'delega':
        userPrompt += `**Istruzioni Specifiche per la BOZZA DELEGA:**\n`;
        userPrompt += `- Genera il testo completo di una **lettera/atto di delega formale**, pronta per essere firmata, utilizzando esempi e clausole standard dall'INTERA Knowledge Base.\n`;
        userPrompt += `- Includi **tutte le sezioni standard**: Intestazione, Oggetto, Premesse, Delegante, Delegato.\n`;
        userPrompt += `- Nell'"Art. 1 - Oggetto della Delega", dettaglia i **poteri specifici** in modo **preciso, inequivocabile ed esaustivo**, assicurandoti che siano strettamente necessari e sufficienti per raggiungere l'**Obiettivo Specifico dell'Intervento**.\n`;
        userPrompt += `- Nell'"Art. 2 - Limiti della Delega", definisci **limiti quantitativi e qualitativi chiari**, coerenti con le **policy aziendali** (desumibili dall'INTERA Knowledge Base o contesto) e i **Riferimenti Normativi** sulla responsabilità.\n`;
        userPrompt += `- Nell'"Art. 4 - Obblighi del Delegato", includi l'obbligo di **rispettare le procedure aziendali** pertinenti (identificate nell'INTERA Knowledge Base, se possibile) e di **riportare sul monitoraggio dei KPI suggeriti** se applicabile alla delega.\n`;
        userPrompt += `- Includi tutte le clausole standard (Durata, Validità, Revoca, Legge, Foro) e lo spazio per le firme.\n`;
        userPrompt += `- Il contenuto deve risolvere le criticità evidenziate nei **Gap Correlati** (es. B.3.1, B.3.2).\n`;
        break;

        default: // Caso 'altro' o tipo non riconosciuto
        userPrompt += `**Istruzioni Specifiche per Documento Generico:**\n`;
        userPrompt += `- Struttura il documento in modo logico (es. Introduzione/Contesto, Azioni/Decisioni Formalizzate, Responsabilità, Modalità Operative/Controlli, Monitoraggio/KPI, Approvazione) per formalizzare l'intervento richiesto.\n`;
        userPrompt += `- Dettaglia le azioni/decisioni/policy in modo **concreto e operativo**, assicurandoti che raggiungano l'**Obiettivo Specifico dell'Intervento**, traendo ispirazione dall'INTERA Knowledge Base per dettagli.\n`;
        userPrompt += `- Assicurati che il contenuto sia **coerente con i Riferimenti Normativi/Best Practice** identificati e con l'INTERA Knowledge Base fornita.\n`;
        userPrompt += `- Fai riferimenti espliciti ai **Gap Correlati** che l'intervento intende risolvere.\n`;
        userPrompt += `- Includi una sezione chiara su come verrà **monitorata l'efficacia** dell'intervento, facendo riferimento ai **KPI di Monitoraggio Intervento suggeriti**.\n`;
}

userPrompt += `\n**Output Richiesto:** Fornisci ESCLUSIVAMENTE il documento Markdown completo, senza alcuna frase introduttiva, commento, scusa o testo aggiuntivo prima o dopo il Markdown stesso. Il documento deve essere PRONTO per una revisione finale e personalizzazione minima.`;


    // 3. Chiama OpenAI (o il modello specifico)
    console.log(`>>> Chiamata API Modello: ${modelToUse} per ${tipoDocumento}...`);
    // DEBUG: Logga solo l'inizio del prompt utente per non inondare i log
    console.log(`>>> Prompt Utente (inizio): ${userPrompt.substring(0, 500)}... (Full KB Omissa dai Log)`);

    try {
        const completion = await openai.chat.completions.create({
            model: modelToUse, // USA IL NOME MODELLO CORRETTO
            messages: [
               // Rimosso system prompt separato, integrato in user per alcuni modelli
               // { role: "system", content: systemPrompt }, // Usiamo il system prompt per chiarezza
               { role: "system", content: systemPrompt },
               { role: "user", content: userPrompt } // Invia tutto come user prompt
            ],
            temperature: 0.4, // Leggermente più bassa per output più fattuale/strutturato
            max_tokens: 30000, // Potrebbe essere utile impostare un max per l'output
        });

        console.log(">>> Risposta AI ricevuta.");
         // DEBUG: Logga la scelta ricevuta
         // console.log(">>> Scelta AI:", JSON.stringify(completion.choices[0], null, 2));

        const draftContent = completion.choices[0]?.message?.content;
        if (!draftContent || draftContent.trim().length < 50) { // Controllo più robusto
            console.error("!!! Risposta AI vuota o troppo corta:", draftContent);
            throw new Error("Risposta vuota o insufficiente dall'API OpenAI.");
        }

        console.log(`>>> Bozza documento (${tipoDocumento}) generata con successo da AI Esperta (FULL KB).`);
        // Aggiungi qui il logging dei chunk usati per questa specifica generazione // RIMOSSO
        // if (retrievedChunkObjects.length > 0) {
        //     console.log("    Chunk usati per questa generazione:");
        //     retrievedChunkObjects.forEach(c => console.log(`      - ID: ${c.id}, Similarità: ${c.similarity.toFixed(4)}`));
        // }
        return draftContent.trim();

    } catch (error) {
        console.error(`!!! ERRORE durante chiamata API ${modelToUse} per ${tipoDocumento}:`, error);
        // Log più dettagliato dell'errore API
        if (error.response) {
            console.error(">>> Dettagli Errore API Response:", JSON.stringify(error.response.data, null, 2));
        } else {
             console.error(">>> Errore non legato alla risposta API:", error.message, error.stack);
        }
        // Messaggio di errore più specifico
        let specificErrorMsg = error.message;
        if (error.code === 'context_length_exceeded') {
             specificErrorMsg = "Il contesto fornito (Base di Conoscenza + Prompt) supera i limiti del modello AI.";
        } else if (error.response?.data?.error?.message) {
             specificErrorMsg = `Errore API OpenAI: ${error.response.data.error.message}`;
        }
        throw new Error(`Generazione bozza fallita: ${specificErrorMsg}`);
    }
};

// --- *** NUOVA FUNZIONE: analyzeContextForAssetStructure *** ---
/**
 * Analizza il contesto (intervento, tipo documento, area tematica) e propone una struttura
 * di base per un documento d'assetto, con riferimenti KB utili.
 */
const analyzeContextForAssetStructure = async (
    tipoDocumento, // es. "procedura", "mansionario"
    areaTematica,  // es. "Sistema di deleghe" (se non si parte da un intervento specifico)
    interventoId,  // opzionale
    parametriUtente = {}
) => {
    console.log(`>>> Servizio documentGeneratorAI (FULL KB): Avvio analisi contesto per struttura documento tipo: ${tipoDocumento}, area: ${areaTematica}, intervento: ${interventoId}`);
    if (!openai) throw new Error("OpenAI client non inizializzato.");

    const kbContent = await getFullKnowledgeBase(); // Carica l'intera KB
    if (kbContent === "ERRORE_CARICAMENTO_KB_COMPLETA") {
        console.error("!!! ERRORE CRITICO: Impossibile caricare la Knowledge Base completa per analisi struttura.");
        throw new Error("Base di conoscenza completa non disponibile per analisi struttura.");
    }

    let intervento = null;
    let clienteInfo = {};
    let gapsCorrelati = []; // Non usati attivamente nel prompt per struttura, ma recuperati per completezza
    let titoloInterventoPerQuery = areaTematica || `Documento di tipo ${tipoDocumento}`;

    if (interventoId) {
        intervento = await Intervento.findById(interventoId)
            .populate({ path: 'gap_correlati', select: 'item_id descrizione' }) // Non servono tutti i dettagli del gap per la struttura
            .populate({ path: 'checklist_id_origine', select: 'cliente' })
            .lean();
        if (!intervento) console.warn(`Intervento ${interventoId} non trovato, procedo con contesto limitato.`);
        else {
            clienteInfo = intervento.checklist_id_origine?.cliente || {};
            gapsCorrelati = intervento.gap_correlati || [];
            titoloInterventoPerQuery = intervento.titolo || titoloInterventoPerQuery;
        }
    }

    // Costruisci la query per il Knowledge Retriever // RIMOSSO
    // const retrievalQuery = `Struttura e contenuti chiave per un documento di tipo '${tipoDocumento}' relativo a '${titoloInterventoPerQuery}'. Contesto cliente: ${clienteInfo.nome || 'generico'}, settore ${clienteInfo.settore || 'generico'}. ${parametriUtente.dettagliAggiuntivi || ''}`;
    
    // console.log(`>>> analyzeContextForAssetStructure: Query per retriever: "${retrievalQuery.substring(0,100)}..."`);
    // const relevantKbChunks = await retrieveRelevantChunks(retrievalQuery, 5); // Top 5 chunks // RIMOSSO
    // let retrievedKbTextForPrompt = "Nessuna informazione specifica recuperata dalla KB per strutturare questo documento.";
    // if (relevantKbChunks.length > 0) {
    //     retrievedKbTextForPrompt = "Considera i seguenti estratti dalla Knowledge Base per definire la struttura e i contenuti chiave:\n" +
    //         relevantKbChunks.map((chunkObj, idx) =>
    //             `--- Contesto KB ${idx + 1} ---\n${chunkObj.text}\n--- Fine Contesto KB ${idx + 1} ---`
    //         ).join('\n\n');
    // }

    // Prompt per l'LLM
    const systemPrompt = `Sei un esperto di documentazione aziendale e compliance. Il tuo compito è suggerire una struttura logica e completa per un documento d'assetto, basandoti sull'INTERA Knowledge Base fornita.`;
    let userPrompt = `Data la richiesta di creare un documento di tipo "${tipoDocumento}" per l'argomento/intervento "${titoloInterventoPerQuery}" (contesto cliente: settore ${clienteInfo.settore || 'N/D'}), e basandoti sull'INTERA SEGUENTE Knowledge Base:\n\n"""\n${kbContent}\n"""\n\n`;
    userPrompt += `Quali sarebbero le SEZIONI PRINCIPALI E SOTTOSEZIONI CHIAVE (massimo 7-10 sezioni principali) per strutturare tale documento in modo efficace e completo? Per ogni sezione principale, elenca brevemente 2-3 punti chiave o sotto-sezioni che dovrebbe contenere.\n\n`;
    // userPrompt += `Inoltre, identifica e restituisci gli ID dei chunk della Knowledge Base fornita (se presenti e usati) che ritieni PIÙ UTILI per la redazione di questo documento.\n\n`; // RIMOSSO
    userPrompt += `Restituisci ESCLUSIVAMENTE un oggetto JSON con la seguente struttura:\n{\n  "tipo_documento_analizzato": "${tipoDocumento}",\n  "argomento_principale": "${titoloInterventoPerQuery}",\n  "proposta_struttura": [\n    { "sezione_principale": "Nome Sezione 1", "punti_chiave_o_sottosezioni": ["Punto 1.1", "Punto 1.2"] },\n    { "sezione_principale": "Nome Sezione 2", "punti_chiave_o_sottosezioni": ["Punto 2.1", "Punto 2.2", "Punto 2.3"] }\n    // ... altre sezioni ...\n  ],\n  "suggerimento_sezione_kb_rilevante": "Indica brevemente la sezione/argomento principale della Knowledge Base che hai trovato PIU\' utile per definire questa struttura. Se non applicabile, rispondi 'Nessuna sezione specifica utilizzata'."\n}\n`; // MODIFICATO

    console.log(`>>> Chiamata API ${modelToUse} per analisi struttura documento (FULL KB)...`);
    try {
        const completion = await openai.chat.completions.create({
            model: modelToUse, // Potrebbe essere lo stesso di generateDocumentDraft o uno più adatto all'analisi
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.2, // Più fattuale per la struttura
            response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0]?.message?.content;
        if (!responseContent) throw new Error("Risposta AI vuota per analisi struttura.");
        
        const analysisResult = JSON.parse(responseContent);
        console.log(`--- Analisi struttura (FULL KB) ricevuta da AI per ${tipoDocumento}.`);
        console.log(`    Sezione KB per struttura citata da AI: ${analysisResult.suggerimento_sezione_kb_rilevante || 'Nessuna'}`);


        // Aggiungi anche il testo completo dei chunk utili per il frontend // RIMOSSO
        // const riferimentiKbCompleti = [];
        // if (analysisResult.riferimenti_kb_utili_ids && Array.isArray(analysisResult.riferimenti_kb_utili_ids)) {
        //     for (const chunkId of analysisResult.riferimenti_kb_utili_ids) {
        //         const foundChunk = relevantKbChunks.find(c => c.id === chunkId); // Cerca tra quelli già recuperati
        //         if (foundChunk) {
        //             riferimentiKbCompleti.push({
        //                 id: foundChunk.id,
        //                 text: foundChunk.text,
        //                 similarity: foundChunk.similarity
        //             });
        //         }
        //     }
        // }
        
        return {
            propostaStruttura: analysisResult.proposta_struttura || [],
            // riferimentiKbUtili: riferimentiKbCompleti // Restituisci i chunk completi // RIMOSSO
            suggerimentoKbPerStruttura: analysisResult.suggerimento_sezione_kb_rilevante
        };

    } catch (error) {
        console.error(`!!! ERRORE Chiamata OpenAI per analisi struttura (FULL KB):`, error.message);
        if (error.response) {
            console.error(">>> Dettagli Errore API Response:", JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
};
// --- *** FINE NUOVA FUNZIONE *** ---

// Esporta entrambe le funzioni
module.exports = { generateDocumentDraft, analyzeContextForAssetStructure };

// END OF FILE server/services/documentGeneratorAI.js (AGGIORNATO v3)