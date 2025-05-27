const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const path =require('path');
const { getFullKnowledgeBase } = require('../utils/kbLoader'); // Usiamo la stessa utility
const { Gap } = require('../models/diagnosi'); // Per recuperare dettagli gap se necessario
const { Checklist } = require('../models/diagnosi'); // Per contesto cliente

dotenv.config({ path: path.join(__dirname, '../../.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;
// Considera un modello potente per analisi causale, gpt-4o-mini o gpt-4-turbo
const modelToUse = process.env.OPENAI_MODEL_FOR_ROOT_CAUSE || "gpt-4.1-nano-2025-04-14";
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

/**
 * Analizza un Gap (o un insieme di Gap correlati) per suggerire possibili cause radice.
 * @param {string} gapId - L'ID del Gap principale da analizzare.
 * @param {string} checklistId - L'ID della checklist per contesto cliente.
 * @param {Array<string>} [relatedGapIds=[]] - Array di ID di altri Gap correlati (opzionale).
 * @returns {Promise<Array<{testoCausa: string, motivazioneAI: string, rilevanzaStimata: string}>>}
 */
const analyzeGapRootCause = async (gapId, checklistId, relatedGapIds = []) => {
    console.log(`--- Avvio Analisi Cause Radice (FULL KB) per Gap ID: ${gapId} ---`);
    if (!openai) {
        console.error("OpenAI client non inizializzato per analisi cause radice.");
        throw new Error("Servizio AI non disponibile.");
    }
    if (!gapId || !checklistId) {
        throw new Error("ID Gap e ID Checklist sono obbligatori.");
    }

    const kbContent = await getFullKnowledgeBase();
    if (kbContent === "ERRORE_CARICAMENTO_KB_COMPLETA") {
        throw new Error("Base di conoscenza non disponibile.");
    }

    // Recupera il Gap principale e il contesto della checklist
    const mainGap = await Gap.findById(gapId).lean();
    const checklist = await Checklist.findById(checklistId).select('cliente answers').lean();

    if (!mainGap || !checklist || !checklist.cliente) {
        throw new Error("Dati essenziali (Gap, Checklist o Cliente) mancanti per l'analisi delle cause radice.");
    }

    let relatedGapsDetails = [];
    if (relatedGapIds.length > 0) {
        relatedGapsDetails = await Gap.find({ _id: { $in: relatedGapIds } }).lean();
    }
    const mainGapAnswer = checklist.answers.find(a => a.itemId === mainGap.item_id);

    const systemPrompt = `Sei un consulente investigativo d'azienda, esperto in Root Cause Analysis (RCA) e diagnosi organizzativa, con profonda conoscenza della normativa italiana (Codice Civile, CCII) e delle best practice (EBA, CNDCEC, COSO Framework, ISO). Il tuo compito è analizzare criticamente le informazioni fornite (profilo cliente, gap specifico, gap correlati, e l'INTERA Knowledge Base di riferimento) per identificare le cause *fondamentali e sottostanti* dei problemi, non i semplici sintomi. Devi essere metodico, analitico e andare oltre le apparenze. Fornisci ESCLUSIVAMENTE un oggetto JSON valido.`;

    let userPrompt = `**OBIETTIVO DELL'ANALISI:** Identificare le cause radice (massimo 3-4, le più significative) per il GAP PRINCIPALE sotto descritto. Una causa radice è un fattore fondamentale che, se rimosso o corretto, preverrebbe la ricomparsa del problema.\\n\\n`;

    userPrompt += `**INTERA BASE DI CONOSCENZA (Knowledge Base di Riferimento):**\\n\`\`\`\\n${kbContent}\\n\`\`\`\\n\\n`;

    userPrompt += `**PROFILO CLIENTE:**\\n`;
    userPrompt += `- Nome Azienda: ${checklist.cliente.nome || 'N/D'}\\n`;
    userPrompt += `- Settore/Natura Attività: ${checklist.cliente.settore || checklist.cliente.attivitaPrevalente || 'N/D'}\\n`;
    userPrompt += `- Dimensione Stimata: ${checklist.cliente.dimensioneStimata || 'N/D'}\\n`;
    userPrompt += `- Complessità Stimata: ${checklist.cliente.complessita || 'N/D'}\\n`;
    userPrompt += `- Obiettivi Strategici Chiave: ${checklist.cliente.obiettiviStrategici || 'Non specificati o non rilevanti per questo gap.'}\\n`;
    userPrompt += `- Criticità Aziendali Percepite (dal cliente): ${checklist.cliente.criticitaPercepite || 'Non specificate o non rilevanti per questo gap.'}\\n\\n`;

    userPrompt += `**GAP PRINCIPALE DA ANALIZZARE (Sintomo Primario):**\\n`;
    userPrompt += `- ID Gap: ${mainGap._id}\\n`;
    userPrompt += `- Riferimento Domanda Checklist: ${mainGap.item_id}\\n`;
    userPrompt += `- Testo Domanda: ${mainGap.domandaText || mainGapAnswer?.domandaText || 'N/D'}\\n`;
    userPrompt += `- Risposta Data dall'Utente: "${mainGap.risposta_data ?? mainGapAnswer?.risposta ?? 'N/D'}"\\n`;
    userPrompt += `- Descrizione del Problema (Gap): ${mainGap.descrizione}\\n`;
    userPrompt += `- Livello di Rischio Associato al Gap: ${mainGap.livello_rischio}\\n`;
    userPrompt += `- Implicazioni Dirette del Gap: ${(Array.isArray(mainGap.implicazioni) ? mainGap.implicazioni.join('; ') : mainGap.implicazioni) || 'Non specificate'}\\n\\n`;

    if (relatedGapsDetails.length > 0) {
        userPrompt += `**ALTRI GAP POTENZIALMENTE CORRELATI (Sintomi Secondari o Fattori Contribuenti):**\\n`;
        relatedGapsDetails.forEach((rg, idx) => {
            userPrompt += `${idx + 1}. ID: ${rg._id}, Descrizione: ${rg.descrizione} (Rischio: ${rg.livello_rischio})\\n`;
        });
        userPrompt += `Valuta se questi gap correlati sono anch'essi sintomi della stessa causa radice o se indicano cause radice distinte ma interconnesse.\\n\\n`;
    }

    userPrompt += `**METODOLOGIA DI ANALISI RICHIESTA (Segui attentamente):**\\n`;
    userPrompt += `1.  **Analisi Profonda del Gap Principale:** Non limitarti alla descrizione superficiale. Chiediti ripetutamente "PERCHÉ questo gap si verifica?" (simulando la tecnica dei 5 Perché). Considera il contesto del cliente e le informazioni presenti nella Knowledge Base.\\n`;
    userPrompt += `2.  **Evita i Sintomi:** Una causa radice NON è una semplice riformulazione del gap, una sua implicazione diretta, o un intervento mancato (es. "manca procedura X" è un sintomo; la causa radice potrebbe essere "cultura aziendale avversa alla formalizzazione" o "mancanza di risorse/competenze per creare procedure").\\n`;
    userPrompt += `3.  **Considera Categorie Causali:** Esplora cause radice in diverse categorie:\\n`;
    userPrompt += `    *   **Processi:** Procedure inesistenti, inadeguate, non seguite, complesse, inefficienti; mancanza di standardizzazione; colli di bottiglia.\\n`;
    userPrompt += `    *   **Organizzazione/Struttura:** Ruoli e responsabilità non chiari, conflitto di interessi, segregazione dei compiti inadeguata, struttura organizzativa non allineata agli obiettivi, problemi di comunicazione interna/esterna, catena di comando inefficace.\\n`;
    userPrompt += `    *   **Persone/Competenze:** Mancanza di formazione, competenze tecniche o manageriali inadeguate, carenza di personale, turnover elevato, demotivazione, scarsa consapevolezza (awareness).\\n`;
    userPrompt += `    *   **Sistemi/Tecnologia:** Strumenti IT obsoleti o inadeguati, mancanza di integrazione tra sistemi, dati inaffidabili o non disponibili, carenze nella sicurezza IT.\\n`;
    userPrompt += `    *   **Cultura/Comportamenti:** Resistenza al cambiamento, scarsa attenzione ai controlli, cultura della colpa vs. cultura del miglioramento, mancanza di visione strategica condivisa.\\n`;
    userPrompt += `    *   **Governance/Leadership:** Policy aziendali carenti o assenti, mancanza di supervisione efficace, obiettivi strategici non chiari o non comunicati, decisioni reattive vs. proattive, scarsa allocazione di risorse.\\n`;
    userPrompt += `    *   **Fattori Esterni (se rilevanti e impattanti internamente):** Cambiamenti normativi non recepiti, pressione competitiva che porta a scorciatoie interne.\\n`;
    userPrompt += `4.  **Specificità e Unicità:** Ogni causa radice identificata deve essere il più specifica possibile per il gap in analisi. Se hai identificato cause simili per altri gap, cerca di trovare la sfumatura o il fattore distintivo che si applica qui.\\n`;
    userPrompt += `5.  **Riferimenti alla Knowledge Base:** Se una causa radice è supportata o illustrata da principi, normative o best practice presenti nella Knowledge Base, cita brevemente la sezione rilevante (es. "come da principio di segregazione dei compiti descritto in COSO Framework", "in contrasto con art. 2086 c.c. su assetti adeguati").\\n\\n`;

    userPrompt += `**OUTPUT RICHIESTO (Formato JSON Esclusivo):**\\n`;
    userPrompt += `Fornisci un oggetto JSON strutturato come segue, contenente da 2 a 4 (massimo) cause radice suggerite:\\n`;
    userPrompt += `{\\n`;
    userPrompt += `  \\"gap_analizzato_id\\": \\"${mainGap._id}\\",\\n`;
    userPrompt += `  \\"cause_radice_suggerite\\": [\\n`;
    userPrompt += `    {\\n`;
    userPrompt += `      \\"testoCausa\\": \\"Descrizione chiara, concisa e specifica della PRIMA causa radice fondamentale...\\",\\n`;
    userPrompt += `      \\"categoriaCausa\\": \\"(es. Processi, Organizzazione, Persone, Sistemi, Cultura, Governance, Esterni)\\",\\n`;
    userPrompt += `      \\"motivazioneAI\\": \\"Spiegazione dettagliata del perché questa è una causa radice fondamentale per il gap specifico, come sei arrivato a questa conclusione (es. applicando i 5 Perché), e come si collega al contesto cliente e alla Knowledge Base (cita eventuali riferimenti KB usati). Non limitarti a una frase.\\",\\n`;
    userPrompt += `      \\"rilevanzaStimata\\": \\"alta|media|bassa\\" (Valuta l'impatto e la probabilità di questa causa nel generare il gap)\\n`;
    userPrompt += `    },\\n`;
    userPrompt += `    { \\"testoCausa\\": \\"Descrizione della SECONDA causa radice...\\", \\"categoriaCausa\\": \\"...\\", \\"motivazioneAI\\": \\"...\\", \\"rilevanzaStimata\\": \\"...\\" }\\n`;
    userPrompt += `    // (Eventualmente una TERZA e QUARTA causa, solo se veramente distinte e significative)\\n`;
    userPrompt += `  ]\\n`;
    userPrompt += `}\\n`;
    userPrompt += `Non includere preamboli, commenti o testo al di fuori di questo oggetto JSON. La qualità della tua analisi causale è cruciale.`;

    console.log(`>>> Chiamata API ${modelToUse} per analisi cause radice Gap ${gapId} (FULL KB, Prompt Raffinato v2)...`);
    // Per il debug, potresti voler loggare una parte del prompt, escludendo la KB se troppo lunga:
    // console.log("User Prompt (senza KB):\\n", userPrompt.substring(userPrompt.indexOf("**PROFILO CLIENTE:**")));

    try {
        const completion = await openai.chat.completions.create({
            model: modelToUse,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.3, // Leggermente aumentata per un'analisi più "creativa" ma ancora fattuale
            // max_tokens: 1500, // Imposta un limite ragionevole per la risposta JSON
            response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0]?.message?.content;
        if (!responseContent) { throw new Error("Risposta AI vuota per analisi cause radice."); }

        const analysisResult = JSON.parse(responseContent);
        
        if (!analysisResult || !analysisResult.cause_radice_suggerite || !Array.isArray(analysisResult.cause_radice_suggerite)) {
            console.error("Formato JSON risposta AI non valido per cause radice:", analysisResult);
            throw new Error("L'AI non ha restituito le cause radice nel formato atteso.");
        }
        
        console.log(`--- Analisi Cause Radice (Prompt Raffinato v2) VALIDA ricevuta. Cause: ${analysisResult.cause_radice_suggerite.length}`);
        analysisResult.cause_radice_suggerite.forEach((causa, i) => {
            console.log(`    Causa ${i+1}: ${causa.testoCausa} (Cat: ${causa.categoriaCausa}, Rilevanza: ${causa.rilevanzaStimata})`);
        });
        return analysisResult.cause_radice_suggerite;

    } catch (error) {
        console.error(`!!! ERRORE Chiamata OpenAI per analisi cause radice (Prompt Raffinato v2) Gap ${gapId}:`, error.message);
        if (error.response && error.response.data) { // Log più dettagliato errore OpenAI
            console.error("Dettagli errore API OpenAI:", JSON.stringify(error.response.data, null, 2));
        }
        throw new Error(`Analisi cause radice fallita (Prompt Raffinato v2): ${error.message}`);
    }
};

module.exports = { analyzeGapRootCause }; 