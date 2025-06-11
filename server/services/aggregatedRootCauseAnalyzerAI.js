// server/services/aggregatedRootCauseAnalyzerAI.js
const dotenv = require("dotenv");
const { OpenAI } = require("openai");
const path = require("path");
const { getFullKnowledgeBase } = require("../utils/kbLoader");
const { Checklist, Gap } = require("../models/diagnosi"); // Assicurati che i modelli siano importati correttamente
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, "../../.env") });

const openaiApiKey = process.env.OPENAI_API_KEY;
const modelToUse = process.env.OPENAI_MODEL_FOR_AGGREGATED_ROOT_CAUSE || "gpt-4.1-mini"; // Usa un modello potente, es. gpt-4o o gpt-4-turbo

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

const analyzeAggregatedRootCauses = async (checklistId, considerOnlyCriticalGaps = true) => {
    console.log(`--- Servizio aggregatedRootCauseAnalyzerAI (COTP): Avvio per Checklist ID: ${checklistId} ---`);
    if (!openai) {
        console.error("OpenAI client non inizializzato per analisi cause radice aggregate.");
        throw new Error("Servizio AI (OpenAI) non disponibile.");
    }

    const kbContent = await getFullKnowledgeBase();
    if (kbContent === "ERRORE_CARICAMENTO_KB_COMPLETA") {
        console.error("Base di conoscenza non disponibile per analisi cause radice aggregate.");
        throw new Error("Base di conoscenza non disponibile.");
    }

    const checklist = await Checklist.findById(checklistId).select("cliente").lean();
    if (!checklist || !checklist.cliente) {
        throw new Error("Checklist o dati cliente mancanti per l'analisi.");
    }
    const cliente = checklist.cliente;

    let gapQuery = { checklist_id: checklistId };
    if (considerOnlyCriticalGaps) {
        gapQuery.livello_rischio = { $in: ['alto', 'medio'] };
    }
    const gaps = await Gap.find(gapQuery)
        .select("_id item_id domandaText descrizione livello_rischio implicazioni suggerimenti_ai arricchitoConAI riferimentiNormativiSpecificiAI impattoStimatoAI")
        .lean();

    if (!gaps || gaps.length === 0) {
        console.log("Nessun gap (critico) trovato per l'analisi aggregata.");
        return { 
            summaryAnalisiCauseAI: "Nessun gap critico rilevato su cui basare un'analisi aggregata delle cause radice.", 
            causeIdentificate: [] 
        };
    }
    console.log(`Trovati ${gaps.length} gap da considerare per l'analisi aggregata.`);

    const systemPrompt = `Sei un consulente strategico di alto livello, specializzato in diagnosi organizzativa e Root Cause Analysis (RCA) sistemica per imprese italiane. Il tuo compito è analizzare un insieme di problemi (gap) rilevati in un'azienda, il suo profilo e una vasta Knowledge Base (KB) per identificare le **poche (massimo 3-5) cause radice fondamentali e trasversali** che spiegano la maggior parte dei problemi. Devi seguire attentamente il processo di output richiesto.`;

    let userPrompt = `**OBIETTIVO ANALISI CRITICO:** Identificare le cause radice sistemiche che sottendono **TUTTI** i problemi aziendali (gap) rilevati, raggruppandoli sotto **ALMENO 2 e preferibilmente 3 (massimo 4) cause radice principali e DISTINTE**.\\n\\n`;
    userPrompt += `**INTERA BASE DI CONOSCENZA (KB di Riferimento):**\\n\`\`\`\\n${kbContent}\\n\`\`\`\\n\\n`;

    userPrompt += `**PROFILO AZIENDA CLIENTE:**\\n`;
    userPrompt += `- Nome: ${cliente.nome || "N/D"}\\n`;
    userPrompt += `- Dimensione Stimata: ${cliente.dimensioneStimata || "Non specificata"}\\n`;
    userPrompt += `- Complessità (Consulente): ${cliente.complessita || "Non specificata"}\\n`;
    userPrompt += `- Settore (Generico): ${cliente.settore || "Non specificato"}\\n`;
    userPrompt += `- Settore ATECO Specifico: ${cliente.settoreATECOSpecifico || "Non specificato"}\\n`;
    userPrompt += `- Modello Business: ${cliente.modelloBusiness || "Non specificato"}\\n`;
    userPrompt += `- Complessità Operativa (Specifica): ${cliente.complessitaOperativa || "Non specificata"}\\n`;
    userPrompt += `- Struttura Proprietaria: ${cliente.strutturaProprietaria || "Non specificata"}\\n`;
    userPrompt += `- Livello Internazionalizzazione: ${cliente.livelloInternazionalizzazione || "Non specificato"}\\n`;
    userPrompt += `- Fase Ciclo di Vita Azienda: ${cliente.faseCicloVita || "Non specificata"}\\n`;
    userPrompt += `- Obiettivi Strategici Dichiarati: ${cliente.obiettiviStrategici || "Non specificati"}\\n`;
    userPrompt += `- Criticità Percepite Dichiarate: ${cliente.criticitaPercepite || "Non specificate"}\\n\\n`;

    userPrompt += `**ELENCO COMPLETO DEI GAP RILEVATI DA ANALIZZARE E ASSOCIARE (Devi associare OGNUNO di questi a una causa radice):**\\n`;
    gaps.forEach((gap, index) => {
        userPrompt += `${index + 1}. **Gap MongoDB _id: ${gap._id}, Gap Item ID: ${gap.item_id} (Rischio: ${gap.livello_rischio})**\\n`;
        userPrompt += `   - Domanda: ${gap.domandaText || "N/D"}\\n`;
        userPrompt += `   - Descrizione Problema: ${gap.descrizione}\\n`;
        // Potresti omettere le implicazioni/suggerimenti del singolo gap qui per alleggerire il prompt,
        // dato che l\'AI deve fare un\'analisi aggregata. Concentrati sul problema.
        userPrompt += "\\n";
    });

    userPrompt += `**ISTRUZIONI DETTAGLIATE E OBBLIGATORIE PER L\'AI (SEGUI QUESTI PASSI DI RAGIONAMENTO):**\\n`;
    userPrompt += `1.  **Comprensione del Contesto e dei Gap:** Analizza attentamente il profilo cliente, l\'INTERO elenco dei gap forniti (dal primo all\'ultimo) e la Knowledge Base. Identifica temi e interconnessioni.\\n`;
    userPrompt += `2.  **Identificazione Cause Radice Sistemiche (Minimo 2, Massimo 4):** Il tuo compito è identificare da **DUE (2) a QUATTRO (4) cause radice principali**. Queste cause devono essere:\\n`;
    userPrompt += `        *   **Sistemiche:** Non problemi isolati, ma fattori di fondo.\\n`;
    userPrompt += `        *   **Fondamentali:** Le vere origini dei problemi, non sintomi.\\n`;
    userPrompt += `        *   **Chiaramente DISTINTE Concettualmente:** Ogni causa deve rappresentare una problematica di fondo diversa (es. una sui processi, una sulla cultura, una sui sistemi IT, una sulla governance). Evita cause sovrapposte o troppo simili. Se più problemi convergono, articola le diverse sfaccettature come cause distinte se necessario per raggiungere il minimo di 2.\\n`;
    userPrompt += `3.  **COPERTURA TOTALE DEI GAP (OBBLIGATORIO):** Per OGNI causa radice che identifichi, devi elencare nel campo \`gapDirettamenteImplicati\` gli ID (_id MongoDB e item_id) di **TUTTI i gap (dall\'elenco fornito sopra) che sono una manifestazione diretta o una conseguenza significativa di QUELLA causa radice**. È IMPERATIVO che **OGNI SINGOLO GAP fornito nell\'elenco iniziale sia associato ad ALMENO UNA delle tue 2-4 cause radice identificate**. Un gap può essere associato a una sola causa radice (quella più pertinente). Distribuisci TUTTI i gap tra le cause identificate.\\n`;
    userPrompt += `4.  **Dettaglio e Motivazione per Causa:** Per ogni causa radice identificata, fornisci le informazioni richieste nella struttura JSON (testoCausa, categoriaCausa, descrizioneDettagliataAI, rilevanzaComplessiva, suggerimentiInterventoStrategicoAI).\\n`;
    userPrompt += `5.  **Sintesi Complessiva e Gestione Gap Residui:** Formula un paragrafo di sintesi (\`summaryAnalisiCauseAI\`) che descriva le principali dinamiche causali. **OBBLIGATORIO e FONDAMENTALE: Alla fine ESATTA della stringa del summaryAnalisiCauseAI, AGGIUNGI la seguente etichetta letterale: "@@GAP_ORFANI@@:" seguita IMMEDIATAMENTE da una lista separata da virgole degli ITEM_ID di tutti i gap forniti in input che NON hai associato a nessuna causa nell'array \`causeIdentificate\`. Se hai associato tutti i gap, scrivi "Nessuno" dopo l'etichetta.** Esempio finale del summary: "...testo del summary. @@GAP_ORFANI@@: B.X.X, C.Y.Y, Nessuno"\n`;
    userPrompt += `6.  **Formattazione Finale in JSON:** SOLO DOPO aver completato i passaggi di ragionamento, struttura TUTTI i tuoi risultati finali ESCLUSIVAMENTE nell\'oggetto JSON specificato sotto.\\n\\n`;

    userPrompt += `**PROCESSO DI OUTPUT RICHIESTO (IMPORTANTE):**\\n`;
    userPrompt += `Inizia la tua risposta con la sezione "== PENSIERO DELL\'AI (Chain of Thought) ==" e descrivi brevemente (circa 100-200 parole) come hai identificato le 2-4 cause distinte e come hai pianificato di associare TUTTI i gap. \\n`;
    userPrompt += `Subito dopo questa sezione di pensiero, fornisci l\'output JSON finale delimitato da \`\`\`json e \`\`\`.\\n\\n`;

    userPrompt += `**STRUTTURA JSON FINALE RICHIESTA (Deve contenere da 2 a 4 elementi nell\'array \'causeIdentificate\', e l\'insieme dei \'gapDirettamenteImplicati\' tra tutte le cause deve coprire TUTTI i gap forniti in input):**\\n`;
    userPrompt += `   {\\n`;
    userPrompt += `     "summaryAnalisiCauseAI": "Il tuo paragrafo di sintesi principale... che termina OBBLIGATORIAMENTE con '@@GAP_ORFANI@@: item_id1, item_id2, ... (o Nessuno)'",\n`;
    userPrompt += `     "causeIdentificate": [\\n`; // Array con 2-4 elementi
    userPrompt += `       {\\n`;
    userPrompt += `         "testoCausa": "Descrizione causa radice 1...",\\n`;
    userPrompt += `         "categoriaCausa": "Es. Processi",\\n`;
    userPrompt += `         "descrizioneDettagliataAI": "Argomentazione dettagliata...",\\n`;
    userPrompt += `         "rilevanzaComplessiva": "critica | alta | media | bassa",\\n`;
    userPrompt += `         "gapDirettamenteImplicati": [\n`;
    userPrompt += `           // Elenca QUI solo gli _id MongoDB (come 'gapRefId') e gli 'item_id' (come 'gapItemId') dei gap forniti in input che sono manifestazioni o conseguenze di QUESTA causa radice. Non includere la descrizione del gap qui, la recupereremo noi.\n`;
    userPrompt += `           { "gapRefId": "ID_MONGO_DELL_GAP_INPUT_1", "gapItemId": "ITEM_ID_DEL_GAP_INPUT_1" },\n`;
    userPrompt += `           { "gapRefId": "ID_MONGO_DELL_GAP_INPUT_2", "gapItemId": "ITEM_ID_DEL_GAP_INPUT_2" }\n`;
    userPrompt += `         ],\n`;
    userPrompt += `         "suggerimentiInterventoStrategicoAI": ["Suggerimento strategico 1...", "Suggerimento strategico 2..."]\\n`;
    userPrompt += `       }\\n`;
    userPrompt += `       // ... (Almeno un altro elemento, fino a un massimo di 3 ulteriori, per un totale di 2-4 cause) ...\\n`;
    userPrompt += `     ]\\n`;
    userPrompt += `   }\\n`

    console.log(`>>> Chiamata API ${modelToUse} per analisi aggregata cause radice (COTP). Prompt length (approx, senza KB): ${userPrompt.length - kbContent.length}`);

    try {
        const completion = await openai.chat.completions.create({
            model: modelToUse,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.5, // Un po' più di creatività per l'analisi sistemica, ma non troppa
            // RIMOSSO: response_format: { type: "json_object" }, 
        });

        const rawResponseContent = completion.choices[0]?.message?.content;
        
        // Log della risposta grezza completa dall'AI
        console.log("========= RAW AI RESPONSE (COTP) START =========");
        console.log(rawResponseContent);
        console.log("========= RAW AI RESPONSE (COTP) END =========");

        if (!rawResponseContent) {
            throw new Error("Risposta AI vuota per analisi aggregata cause radice (COTP).");
        }
        
        let analysisResultJsonString;
        const jsonBlockRegex = /```json\s*([\s\S]+?)\s*```/; // Regex per trovare il blocco JSON
        const match = rawResponseContent.match(jsonBlockRegex);

        if (match && match[1]) {
            analysisResultJsonString = match[1].trim();
            console.log("JSON estratto con regex con successo.");
        } else {
            console.warn("Delimitatori ```json non trovati con regex principale. Tento un approccio più flessibile per l'estrazione del JSON...");
            // Tentativo di trovare il JSON anche se ci fosse testo dopo l'ultimo ```
            const startIndex = rawResponseContent.indexOf("```json");
            if (startIndex !== -1) {
                let potentialJson = rawResponseContent.substring(startIndex + 7); // +7 per saltare ```json e newline
                const endIndex = potentialJson.lastIndexOf("```");
                if (endIndex !== -1) {
                    analysisResultJsonString = potentialJson.substring(0, endIndex).trim();
                    console.log("JSON estratto con fallback su indexOf/lastIndexOf.");
                } else {
                     // Se non c'è un ``` finale, prova a prendere tutto ciò che sembra un oggetto JSON
                    const firstBrace = potentialJson.indexOf('{');
                    const lastBrace = potentialJson.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace > firstBrace) {
                        analysisResultJsonString = potentialJson.substring(firstBrace, lastBrace + 1).trim();
                        console.warn("JSON estratto cercando solo le parentesi graffe finali (delimitatore finale mancante o testo dopo).");
                    } else {
                        throw new Error("Impossibile estrarre la parte JSON dalla risposta dell'AI (COTP) - delimitatori o struttura JSON non riconosciuti.");
                    }
                }
            } else {
                throw new Error("Delimitatore ```json di inizio non trovato nella risposta dell'AI (COTP).");
            }
        }

        // Log del "pensiero" (tutto ciò che precede il primo ```json)
        const thoughtProcessStartIndex = rawResponseContent.indexOf("== PENSIERO DELL'AI (Chain of Thought) ==");
        let thoughtProcess = "Processo di pensiero non esplicitamente trovato.";
        if (thoughtProcessStartIndex !== -1) {
            const jsonStartForThought = rawResponseContent.indexOf("```json");
            if (jsonStartForThought !== -1 && jsonStartForThought > thoughtProcessStartIndex) {
                thoughtProcess = rawResponseContent.substring(thoughtProcessStartIndex, jsonStartForThought)
                    .replace("== PENSIERO DELL'AI (Chain of Thought) ==", "").trim();
            } else { // Se non c'è ```json dopo il pensiero, prendi una porzione
                thoughtProcess = rawResponseContent.substring(thoughtProcessStartIndex, thoughtProcessStartIndex + 1000) // Prendi un pezzo
                    .replace("== PENSIERO DELL'AI (Chain of Thought) ==", "").trim() + "... (potrebbe essere incompleto)";
            }
        }
        console.log("--- PENSIERO DELL'AI (COTP) ---");
        console.log(thoughtProcess);

        // Prova a parsare il JSON estratto
        let analysisResult;
        try {
            analysisResult = JSON.parse(analysisResultJsonString);
        } catch (parseError) {
            console.error("!!! ERRORE CRITICO nel parsing del JSON estratto:", parseError);
            console.error("Stringa JSON che ha causato l'errore:", analysisResultJsonString);
            throw new Error(`Errore nel parsing del JSON restituito dall'AI: ${parseError.message}. Controllare la stringa JSON loggata.`);
        }
        
        console.log("--- Analisi Aggregata Cause Radice (da JSON estratto dopo COTP) ---");
        console.log("Summary:", analysisResult.summaryAnalisiCauseAI);
        console.log("Cause Identificate (prima del mapping _id):", analysisResult.causeIdentificate ? analysisResult.causeIdentificate.length : 'undefined'); // Logga la lunghezza o undefined

        // --- Inizio Post-Elaborazione Backend per Copertura Gap ---
        console.log("--- Inizio Post-Elaborazione Backend per Copertura Gap ---");

        if (analysisResult.causeIdentificate && Array.isArray(analysisResult.causeIdentificate)) {
            analysisResult.causeIdentificate.forEach(causa => {
                if (causa.gapDirettamenteImplicati && Array.isArray(causa.gapDirettamenteImplicati)) {
                    // Ricostruisci l'array gapDirettamenteImplicati basandoti solo su gapItemId
                    const mappedGaps = [];
                    causa.gapDirettamenteImplicati.forEach(implicatoAI => {
                        if (implicatoAI.gapItemId) {
                            const originalGap = gaps.find(g => g.item_id === implicatoAI.gapItemId); // Trova per item_id
                            if (originalGap) {
                                mappedGaps.push({
                                    gapRefId: originalGap._id, // Usa l'_id corretto dal DB
                                    gapItemId: originalGap.item_id,
                                    gapDescrizioneBreve: originalGap.descrizione.substring(0, 120) + (originalGap.descrizione.length > 120 ? "..." : "")
                                });
                            } else {
                                console.warn(`Gap con item_id '${implicatoAI.gapItemId}' menzionato dall'AI non trovato nella lista originale dei gap.`);
                                // Potresti decidere di non includerlo o includerlo con refId null
                                mappedGaps.push({
                                    gapRefId: null, 
                                    gapItemId: implicatoAI.gapItemId,
                                    gapDescrizioneBreve: "Descrizione originale non trovata (item_id sconosciuto)."
                                });
                            }
                        } else {
                             console.warn("Elemento in gapDirettamenteImplicati dall'AI non ha gapItemId:", implicatoAI);
                        }
                    });
                    causa.gapDirettamenteImplicati = mappedGaps.filter(g => g.gapRefId); // Mantieni solo quelli trovati
                } else {
                    causa.gapDirettamenteImplicati = []; 
                }
            });
        } else {
            analysisResult.causeIdentificate = []; // Assicura sia un array
        }

        const tuttiGapInputIds = new Set(gaps.map(g => g.item_id)); // Set degli item_id di tutti i gap originali
        const gapAssociatiAI = new Set(analysisResult.causeIdentificate.flatMap(causa => 
            (causa.gapDirettamenteImplicati || []).map(g => g.gapItemId)
        ));

        const gapOrfaniItemIds = [...tuttiGapInputIds].filter(itemId => !gapAssociatiAI.has(itemId));

        if (gapOrfaniItemIds.length > 0) {
            console.log(`Gap "orfani" (non associati esplicitamente dall'AI): ${gapOrfaniItemIds.join(', ')}`);
            
            // Prova a estrarre gli orfani dal summary dell'AI se presenti
            let orfaniDalSummaryAI = [];
            if (analysisResult.summaryAnalisiCauseAI && analysisResult.summaryAnalisiCauseAI.includes("@@GAP_ORFANI@@:")) {
                const orfaniString = analysisResult.summaryAnalisiCauseAI.split("@@GAP_ORFANI@@:")[1];
                if (orfaniString && orfaniString.toLowerCase().trim() !== "nessuno") {
                    orfaniDalSummaryAI = orfaniString.trim().split(',').map(s => s.trim()).filter(s => s);
                    console.log("Gap orfani menzionati nel summary AI:", orfaniDalSummaryAI);
                    // Potresti voler verificare se questi corrispondono a gapOrfaniItemIds
                }
            }

            // Strategia: Aggiungi i gap orfani alla prima causa radice identificata (o a una nuova "Varie")
            if (analysisResult.causeIdentificate.length > 0) {
                const primaCausa = analysisResult.causeIdentificate[0];
                gapOrfaniItemIds.forEach(itemId => {
                    const originalGap = gaps.find(g => g.item_id === itemId);
                    if (originalGap) {
                        primaCausa.gapDirettamenteImplicati.push({
                            gapRefId: originalGap._id,
                            gapItemId: originalGap.item_id,
                            gapDescrizioneBreve: originalGap.descrizione.substring(0, 120) + (originalGap.descrizione.length > 120 ? "..." : "")
                        });
                    }
                });
                console.log(`Gap orfani aggiunti alla prima causa radice: "${primaCausa.testoCausa}"`);
                // Aggiorna il summary per riflettere che tutti i gap sono stati considerati
                if (analysisResult.summaryAnalisiCauseAI && !analysisResult.summaryAnalisiCauseAI.includes("Tutti i gap sono stati associati")) {
                    analysisResult.summaryAnalisiCauseAI += " (Nota: Tutti i gap forniti sono stati associati a una causa radice, inclusi quelli non primari aggiunti in post-elaborazione).";
                }

            } else {
                // Se l'AI non ha prodotto NESSUNA causa, ma ci sono orfani (improbabile se ci sono gap), crea una causa generica
                analysisResult.causeIdentificate.push({
                    testoCausa: "Problemi specifici non raggruppabili o analisi AI incompleta",
                    categoriaCausa: "Varie",
                    descrizioneDettagliataAI: "Questi gap non sono stati associati a una causa sistemica principale dall'analisi AI o rappresentano questioni più isolate.",
                    rilevanzaComplessiva: "media",
                    gapDirettamenteImplicati: gapOrfaniItemIds.map(itemId => {
                        const originalGap = gaps.find(g => g.item_id === itemId);
                        return {
                            gapRefId: originalGap?._id,
                            gapItemId: itemId,
                            gapDescrizioneBreve: originalGap ? (originalGap.descrizione.substring(0,120) + (originalGap.descrizione.length > 120 ? "..." : "")) : "Descrizione non trovata"
                        };
                    }),
                    suggerimentiInterventoStrategicoAI: ["Analizzare singolarmente questi gap per definire azioni correttive."]
                });
                console.log("Creato un contenitore 'Varie' per i gap orfani.");
            }
        } else {
            console.log("Tutti i gap sembrano essere stati associati esplicitamente dall'AI.");
        }
        console.log("--- Fine Post-Elaborazione Backend ---");

        return analysisResult;

    } catch (error) {
        console.error(`!!! ERRORE Chiamata OpenAI per analisi aggregata (COTP) (Checklist ${checklistId}):`, error.message);
        if (error instanceof SyntaxError) { 
            console.error("Errore durante il parsing del JSON estratto dalla risposta AI (COTP). Risposta grezza loggata sopra.");
        }
        // Aggiungo il console.error per il dettaglio dell'errore OpenAI se presente
        if (error.response?.data?.error?.message) {
            console.error("Dettaglio Errore OpenAI:", error.response.data.error.message);
        }
        throw new Error(`Analisi aggregata cause radice (COTP) fallita: ${error.message}`);
    }
};

module.exports = { analyzeAggregatedRootCauses };