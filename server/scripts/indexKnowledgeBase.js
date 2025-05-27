const fs = require('fs').promises;
const path = require('path');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') }); // Assicurati che il path a .env sia corretto

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
    console.error("ERRORE: OPENAI_API_KEY non impostata.");
    process.exit(1);
}
const openai = new OpenAI({ apiKey: openaiApiKey });

const KB_TEXT_FILE = path.join(__dirname, '../knowledge/concatenated_kb.txt');
const INDEXED_KB_FILE = path.join(__dirname, '../knowledge/indexed_kb_data.json');
const EMBEDDING_MODEL = 'text-embedding-3-small'; // Modello di embedding consigliato e più economico
const CHUNK_SIZE = 1000; // Dimensione approssimativa dei chunk in caratteri (da calibrare)
const CHUNK_OVERLAP = 100; // Sovrapposizione tra chunk per non perdere contesto ai bordi
const BATCH_SIZE = 50; // Quanti chunk per chiamata API

/**
 * Divide il testo in chunk sovrapposti.
 * @param {string} text Testo da dividere.
 * @param {number} chunkSize Dimensione target dei chunk.
 * @param {number} chunkOverlap Sovrapposizione.
 * @returns {string[]} Array di chunk di testo.
 */
function textToChunks(text, chunkSize, chunkOverlap) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        const end = Math.min(i + chunkSize, text.length);
        chunks.push(text.substring(i, end));
        // Modifica per evitare loop infinito se chunkSize <= chunkOverlap
        if (chunkSize <= chunkOverlap && chunkSize > 0) {
             i += chunkSize; // Avanza di chunkSize per evitare stallo
        } else {
            i += (chunkSize - chunkOverlap);
        }
        // Correzione per assicurare che l'ultimo pezzo sia preso se non c'è sovrapposizione
        // o se l'ultimo pezzo è più piccolo della sovrapposizione ma c'è ancora testo.
        if (i >= text.length - chunkOverlap && end < text.length) {
            if (text.length - i > 0 && i < text.length) { // Controlla che ci sia ancora testo e che i non superi la lunghezza
                 chunks.push(text.substring(i));
            }
            break;
        }
    }
    return chunks.filter(chunk => chunk.trim() !== '');
}

// /**
//  * Genera l'embedding per un testo.
//  * @param {string} text Testo per cui generare l'embedding.
//  * @returns {Promise<number[]>} Vettore di embedding.
//  */
// async function getEmbedding(text) { // This function will be replaced
//     console.log(`    Richiesta embedding per chunk di ${text.length} caratteri...`);
//     try {
//         const startTime = Date.now();
//         const response = await openai.embeddings.create({
//             model: EMBEDDING_MODEL,
//             input: text.replace(/\n/g, ' '),
//         });
//         const endTime = Date.now();
//         console.log(`    Embedding ricevuto in ${endTime - startTime}ms.`);
//         if (response.data && response.data.length > 0) {
//             return response.data[0].embedding;
//         }
//         throw new Error("Risposta embedding non valida da OpenAI.");
//     } catch (error) {
//         console.error(`    ERRORE embedding per testo: "${text.substring(0, 30)}..."`, error.status, error.message); // Logga anche status code se disponibile
//         // Potresti voler rilanciare l'errore per interrompere lo script o implementare una logica di retry
//         // throw error; // Se vuoi interrompere in caso di errore API grave
//         return null; // O restituisci null per saltare il chunk ma continuare
//     }
// }

async function getEmbeddingsInBatchWithRetry(texts, retries = 3, delay = 1000) {
    if (!texts || texts.length === 0) return [];
    console.log(`    Richiesta embedding per un batch di ${texts.length} testi (tentativo ${4 - retries})...`);
    try {
        const startTime = Date.now();
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: texts.map(text => text.replace(/\n/g, ' ')),
        });
        const endTime = Date.now();
        console.log(`    Batch di ${texts.length} embeddings ricevuto in ${endTime - startTime}ms.`);

        if (response.data && response.data.length === texts.length) {
            return response.data.map(d => d.embedding);
        }
        throw new Error(`Risposta embedding batch non valida. Attesi ${texts.length}, ricevuti ${response.data?.length || 0}.`);
    } catch (error) {
        console.error(`    ERRORE embedding batch (tentativo ${4 - retries}):`, error.status, error.message);
        if (retries > 0 && (error.status === 429 || error.status === 500 || error.status === 503 || error.message.includes('Rate limit'))) { // Codici di errore per cui fare retry
            console.log(`    Retry batch tra ${delay / 1000} secondi...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return getEmbeddingsInBatchWithRetry(texts, retries - 1, delay * 2); // Aumenta il delay
        } else {
            console.error(`    Fallimento definitivo embedding batch dopo ${4 - (retries+1)} tentativi.`);
            return texts.map(() => null); // Restituisce null per ogni testo nel batch in caso di errore definitivo
        }
    }
}

async function main() {
    console.log("Avvio indicizzazione Knowledge Base...");
    let kbContent;
    try {
        kbContent = await fs.readFile(KB_TEXT_FILE, 'utf8');
    } catch (error) {
        console.error(`Errore lettura file KB ${KB_TEXT_FILE}:`, error);
        return;
    }

    const chunks = textToChunks(kbContent, CHUNK_SIZE, CHUNK_OVERLAP);
    console.log(`Testo diviso in ${chunks.length} chunks.`);

    const indexedData = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const chunkBatch = chunks.slice(i, i + BATCH_SIZE);
        console.log(`Processo batch di chunk da ${i + 1} a ${Math.min(i + BATCH_SIZE, chunks.length)} (totale ${chunkBatch.length} chunk nel batch)...`);
        
        const embeddings = await getEmbeddingsInBatchWithRetry(chunkBatch);

        for (let j = 0; j < chunkBatch.length; j++) {
            if (embeddings[j]) {
                indexedData.push({
                    id: `chunk_${i + j}`,
                    text: chunkBatch[j],
                    embedding: embeddings[j]
                });
            } else {
                console.warn(`    Embedding non generato per chunk ${i + j + 1} (original index ${i+j}), lo salto.`);
            }
        }
        if (chunks.length > BATCH_SIZE && i < chunks.length - BATCH_SIZE) { // Aggiungi pausa solo se ci sono altri batch
             console.log(`    Pausa di 1 secondo tra i batch...`);
             await new Promise(resolve => setTimeout(resolve, 1000)); 
        }
    }

    try {
        await fs.writeFile(INDEXED_KB_FILE, JSON.stringify(indexedData, null, 2));
        console.log(`Dati indicizzati salvati in ${INDEXED_KB_FILE}. Trovati ${indexedData.length} chunk indicizzati su ${chunks.length} totali.`);
    } catch (error) {
        console.error(`Errore salvataggio file indicizzato ${INDEXED_KB_FILE}:`, error);
    }
}

main(); 