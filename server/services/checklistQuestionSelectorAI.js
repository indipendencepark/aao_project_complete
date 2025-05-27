const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs').promises; // Per leggere il file KB
const { retrieveRelevantChunks } = require('./knowledgeRetriever'); // Importa il retriever

dotenv.config({ path: path.join(__dirname, '../../.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;
// Assicurati che questo sia il nome esatto del modello che stai usando.
// Se è un modello custom fine-tuned o un modello con alias specifici, usa quel nome.
const MODEL_FOR_QUESTION_SELECTION = process.env.OPENAI_MODEL_FOR_CHECKLIST_AI || "gpt-4.1-nano-2025-04-14"; // Aggiornato al nome che hai fornito
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// --- DEFINIZIONE DOMANDE MINIME ---
const CORE_QUESTION_ITEM_IDS = [
    "B.1.3", // Adeguatezza Struttura
    "B.2.3", // Segregazione Compiti
    "B.2.4", // Competenze Personale Chiave
    "B.4.3", // Nomina Organo Controllo (se previsto/necessario)
    "C.1.3", // Controlli Interni nelle Procedure
    "C.1.4", // Adeguatezza Procedure a Complessità/Rischi
    "C.2.1", // Adeguatezza Sistema Informativo
    "C.2.3", // Policy Sicurezza Informatica
    "C.2.4", // Backup Regolari e Testati
    "C.3.3", // Budget Tesoreria Previsionale
    "C.3.6", // Monitoraggio KPI Specifici (non solo bilancio)
    "C.4.3", // Adozione Modello 231 (o motivata non adozione)
    // "C.4.4", // Se adottato, il Modello 231 è aggiornato... (dipende da C.4.3) - Forse meglio gestirla con logica condizionale o farla selezionare all'AI se C.4.3 è 'Si'
    "D.1.1", // Tempestività Registrazioni Contabili
    "D.1.2", // Riconciliazioni Periodiche Contabili
    "D.1.5", // Gestione Contabile Magazzino (se applicabile e rilevante, l'AI potrebbe filtrarla se il profilo non ha magazzino)
    "D.2.1", // Bilancio redatto nei termini
    "D.2.2", // Conformità Politiche Contabili
    "D.2.3", // Coerenza Politiche Contabili
    "E.1",   // Sistema informativo idoneo a rilevare squilibri
    "E.2",   // Monitoraggio Indici Crisi (CCII/CNDCEC)
    "E.4",   // Valutazione periodica Going Concern
    "E.6"    // Reazione "Senza Indugio" a segnali di crisi
];
// ---------------------------------

// --- CARICAMENTO KNOWLEDGE BASE ---
const KB_TEXT_FILE_PATH = path.join(__dirname, '../knowledge/concatenated_kb.txt');
let fullKnowledgeBaseContent = null;

async function loadFullKnowledgeBase() {
    if (fullKnowledgeBaseContent === null) { // Carica solo una volta
        try {
            console.log(`>>> Caricamento FULL Knowledge Base da: ${KB_TEXT_FILE_PATH}`);
            fullKnowledgeBaseContent = await fs.readFile(KB_TEXT_FILE_PATH, 'utf8');
            console.log(`>>> FULL Knowledge Base caricata (${fullKnowledgeBaseContent.length} caratteri).`);
        } catch (error) {
            console.error(`!!! ERRORE CRITICO: Impossibile caricare FULL Knowledge Base da ${KB_TEXT_FILE_PATH}`, error);
            fullKnowledgeBaseContent = "ERRORE_CARICAMENTO_KB_COMPLETA"; // Segnaposto per evitare chiamate senza KB
        }
    }
    return fullKnowledgeBaseContent;
}
// Chiamiamo per caricare la KB all'avvio del modulo (o lazy load alla prima chiamata AI)
loadFullKnowledgeBase();
// ----------------------------------

/**
 * Seleziona e ordina le domande della checklist più pertinenti usando l'AI, con l'intera KB come contesto.
 * @param {object} clienteProfilo Profilo dettagliato del cliente.
 * @param {Array<object>} allActiveQuestions Array di tutti i QuestionTemplate attivi.
 * @param {number} targetTotalQuestions Numero approssimativo di domande desiderate.
 * @returns {Promise<Array<{itemId: string, motivazioneAI?: string, isCore?: boolean}>>} Array di oggetti.
 */
const selectPertinentQuestionsAI = async (clienteProfilo, allActiveQuestions, targetTotalQuestions = 70) => {
    const kbContent = await loadFullKnowledgeBase();

    if (!openai || kbContent === "ERRORE_CARICAMENTO_KB_COMPLETA") {
        console.warn("Fallback: OpenAI non configurato o KB non caricata.");
        const coreQuestions = allActiveQuestions
            .filter(q => CORE_QUESTION_ITEM_IDS.includes(q.itemId))
            .map(q => ({ 
                itemId: q.itemId, 
                motivazioneAI: "Domanda fondamentale (inclusa di default).", // Motivazione generica per le core
                isCore: true 
            }));
        const additionalNeeded = Math.max(0, targetTotalQuestions - coreQuestions.length);
        const additionalQuestions = allActiveQuestions.filter(q => !CORE_QUESTION_ITEM_IDS.includes(q.itemId)).slice(0, additionalNeeded).map(q => ({ itemId: q.itemId, motivazioneAI: "Selezionata da fallback AI.", isCore: false }));
        return [...coreQuestions, ...additionalQuestions];
    }
    
    if (!clienteProfilo || !allActiveQuestions || allActiveQuestions.length === 0) {
        console.error("Dati mancanti per la selezione AI delle domande.");
        return [];
    }

    const coreQuestionObjects = allActiveQuestions
        .filter(q => CORE_QUESTION_ITEM_IDS.includes(q.itemId))
        .map(q => ({
            itemId: q.itemId,
            motivazioneAI: "Domanda fondamentale (inclusa di default).", // Motivazione standard per le core
            isCore: true
        }));

    const candidateQuestionsForAI = allActiveQuestions.filter(q => !CORE_QUESTION_ITEM_IDS.includes(q.itemId));
    const numberOfAIChoicesNeeded = Math.max(0, targetTotalQuestions - coreQuestionObjects.length);

    if (numberOfAIChoicesNeeded === 0 || candidateQuestionsForAI.length === 0) {
        console.log("Nessuna domanda aggiuntiva da selezionare con AI. Restituisco solo le core.");
        return coreQuestionObjects; // Restituisce solo le core con la loro motivazione standard
    }
    
    const domandeCandidatePerPrompt = candidateQuestionsForAI.map(q => ({
        itemId: q.itemId,
        domanda: q.domanda,
        area: q.area,
        sottoArea: q.sottoArea || 'N/D',
        tags: q.tags && q.tags.length > 0 ? q.tags.join(', ') : 'Nessun tag specifico',
        // testoAiuto: q.testoAiuto || '' // Valuta se includerlo, aumenta i token
    }));

    const systemPrompt = `Sei un consulente esperto in adeguati assetti organizzativi, amministrativi e contabili per imprese italiane, con profonda conoscenza della normativa (Codice Civile art. 2086, Codice della Crisi d'Impresa) e delle best practice di settore. Il tuo compito è analizzare l'intera base di conoscenza fornita, il profilo di un'azienda cliente, e un elenco di domande candidate, per selezionare quelle più pertinenti.`;

    let userPrompt = `**INTERA BASE DI CONOSCENZA (Knowledge Base):**\n`;
    userPrompt += `"""\n${kbContent}\n"""\n\n`;

    userPrompt += `**PROFILO AZIENDALE DA VALUTARE:**\n`;
    userPrompt += `- Nome Azienda (per contesto): ${clienteProfilo.nome || 'N/D'}\n`;
    userPrompt += `- Settore ATECO Specifico: ${clienteProfilo.settoreATECOSpecifico || 'Non specificato'}\n`;
    userPrompt += `- Modello Business: ${clienteProfilo.modelloBusiness || 'Non specificato'}\n`;
    userPrompt += `- Complessità Operativa: ${clienteProfilo.complessitaOperativa || 'Non specificata'}\n`;
    userPrompt += `- Struttura Proprietaria: ${clienteProfilo.strutturaProprietaria || 'Non specificata'}\n`;
    userPrompt += `- Livello Internazionalizzazione: ${clienteProfilo.livelloInternazionalizzazione || 'Non specificato'}\n`;
    userPrompt += `- Fase Ciclo di Vita Azienda: ${clienteProfilo.faseCicloVita || 'Non specificata'}\n`;
    userPrompt += `- Dimensione Stimata (Consulente): ${clienteProfilo.dimensioneStimata || 'Non specificata'}\n`;
    userPrompt += `- Complessità (Consulente): ${clienteProfilo.complessita || 'Non specificata'}\n`;
    userPrompt += `- Obiettivi Strategici Dichiarati: ${clienteProfilo.obiettiviStrategici || 'Non specificati'}\n`;
    userPrompt += `- Criticità Percepite Dichiarate: ${clienteProfilo.criticitaPercepite || 'Non specificate'}\n\n`;

    userPrompt += `**DOMANDE "CORE" GIÀ PRE-SELEZIONATE (DA NON RIPETERE):**\n`;
    userPrompt += `${CORE_QUESTION_ITEM_IDS.join(', ')}\n\n`;

    userPrompt += `**LISTA DI DOMANDE CANDIDATE (tra cui scegliere quelle aggiuntive):**\n`;
    userPrompt += `Formato: itemId;Testo Domanda;Area;SottoArea;Tags\n`;
    domandeCandidatePerPrompt.forEach(q => {
        userPrompt += `${q.itemId};${q.domanda};${q.area};${q.sottoArea};${q.tags}\n`;
    });
    userPrompt += `\n**ISTRUZIONI PER LA SELEZIONE:**\n`;
    userPrompt += `1. Basandoti sulla TUA COMPRENSIONE DELL'INTERA BASE DI CONOSCENZA fornita e sul profilo aziendale, identifica i rischi normativi, operativi e strategici specifici per questa azienda.\n`;
    userPrompt += `2. Dalla "LISTA DI DOMANDE CANDIDATE", seleziona le **${numberOfAIChoicesNeeded} domande più EFFICACI e PERTINENTI** per investigare tali rischi e valutare l'adeguatezza degli assetti dell'azienda.\n`;
    userPrompt += `3. Privilegia domande che offrano il maggior valore diagnostico nel contesto specifico. Considera le interconnessioni tra aree aziendali suggerite dalla Knowledge Base.\n`;
    userPrompt += `4. Fornisci una BREVE (massimo 1-2 frasi) motivazione per ciascuna domanda selezionata, spiegando perché è particolarmente rilevante per QUESTA azienda alla luce della Knowledge Base e del suo profilo.\n`;
    userPrompt += `5. Ordina le domande che hai selezionato per Area tematica (Org, Admin, Acct, Crisi) e poi per importanza decrescente all'interno di ciascuna area.\n`;
    userPrompt += `6. Restituisci il risultato ESCLUSIVAMENTE come un oggetto JSON valido con la seguente struttura: {"domande_aggiuntive_selezionate": [{"itemId": "ID_DOMANDA_CANDIDATA", "motivazione_selezione_ai": "Tua motivazione specifica e concisa..."}]}. Assicurati che gli itemId siano corretti e presi dalla lista delle candidate.\n`;

    console.log(`>>> Chiamata AI (${MODEL_FOR_QUESTION_SELECTION}) con FULL KB per ${numberOfAIChoicesNeeded} domande aggiuntive...`);
    // NON loggare l'intero userPrompt se contiene tutta la KB, sarebbe troppo!
    // console.log("User prompt (solo inizio, KB omessa):\n", userPrompt.substring(userPrompt.indexOf("PROFILO AZIENDALE"), userPrompt.indexOf("PROFILO AZIENDALE") + 1000));
    
    try {
        const completion = await openai.chat.completions.create({
            model: MODEL_FOR_QUESTION_SELECTION,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.1, // Ancora più bassa per massima aderenza e precisione
            // max_tokens: // Calcola un max_tokens ragionevole per la risposta JSON attesa
            response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0]?.message?.content;
        if (!responseContent) throw new Error("Risposta AI vuota per selezione domande aggiuntive.");

        const resultJson = JSON.parse(responseContent);

        if (!resultJson.domande_aggiuntive_selezionate || !Array.isArray(resultJson.domande_aggiuntive_selezionate)) {
            throw new Error("Formato JSON AI non valido.");
        }
        
        // Le domande selezionate dall'AI avranno la loro motivazione dall'AI
        const domandeAISelezionateConMotivazione = resultJson.domande_aggiuntive_selezionate.map(q => ({ 
            itemId: q.itemId,
            motivazioneAI: q.motivazione_selezione_ai, // Questa è la motivazione dall'AI
            isCore: false 
        }));
        console.log(`>>> AI ha selezionato ${domandeAISelezionateConMotivazione.length} domande aggiuntive con motivazione.`);

        // Combina le domande core (con la loro motivazione standard) con quelle selezionate e motivate dall'AI
        const finalSelectedQuestions = [...coreQuestionObjects, ...domandeAISelezionateConMotivazione];
        console.log(`>>> Totale domande per la checklist: ${finalSelectedQuestions.length}`);
        return finalSelectedQuestions;

    } catch (error) {
        console.error(`!!! ERRORE chiamata API OpenAI (con FULL KB):`, error);
        console.warn("Fallback errore AI (con FULL KB): seleziono domande candidate rimanenti.");
        const additionalFallback = candidateQuestionsForAI
            .slice(0, numberOfAIChoicesNeeded)
            .map(q => ({ 
                itemId: q.itemId, 
                motivazioneAI: "Motivazione AI non disponibile (fallback errore).", // Motivazione specifica per il fallback
                isCore: false 
            }));
        // Combina le core con il fallback per le aggiuntive
        return [...coreQuestionObjects, ...additionalFallback];
    }
};

module.exports = { selectPertinentQuestionsAI }; 