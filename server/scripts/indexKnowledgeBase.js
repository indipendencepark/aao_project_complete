const fs = require("fs").promises;

const path = require("path");

const {OpenAI: OpenAI} = require("openai");

const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, "../../.env")
});

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.error("ERRORE: OPENAI_API_KEY non impostata.");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: openaiApiKey
});

const KB_TEXT_FILE = path.join(__dirname, "../knowledge/concatenated_kb.txt");

const INDEXED_KB_FILE = path.join(__dirname, "../knowledge/indexed_kb_data.json");

const EMBEDDING_MODEL = "text-embedding-3-small";

const CHUNK_SIZE = 1e3;

const CHUNK_OVERLAP = 100;

const BATCH_SIZE = 50;

 function textToChunks(text, chunkSize, chunkOverlap) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.substring(i, end));

        if (chunkSize <= chunkOverlap && chunkSize > 0) {
      i += chunkSize;

        } else {
      i += chunkSize - chunkOverlap;
    }

        if (i >= text.length - chunkOverlap && end < text.length) {
      if (text.length - i > 0 && i < text.length) {

        chunks.push(text.substring(i));
      }
      break;
    }
  }
  return chunks.filter((chunk => chunk.trim() !== ""));
}

async function getEmbeddingsInBatchWithRetry(texts, retries = 3, delay = 1e3) {
  if (!texts || texts.length === 0) return [];
  console.log(`    Richiesta embedding per un batch di ${texts.length} testi (tentativo ${4 - retries})...`);
  try {
    const startTime = Date.now();
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts.map((text => text.replace(/\n/g, " ")))
    });
    const endTime = Date.now();
    console.log(`    Batch di ${texts.length} embeddings ricevuto in ${endTime - startTime}ms.`);
    if (response.data && response.data.length === texts.length) {
      return response.data.map((d => d.embedding));
    }
    throw new Error(`Risposta embedding batch non valida. Attesi ${texts.length}, ricevuti ${response.data?.length || 0}.`);
  } catch (error) {
    console.error(`    ERRORE embedding batch (tentativo ${4 - retries}):`, error.status, error.message);
    if (retries > 0 && (error.status === 429 || error.status === 500 || error.status === 503 || error.message.includes("Rate limit"))) {

      console.log(`    Retry batch tra ${delay / 1e3} secondi...`);
      await new Promise((resolve => setTimeout(resolve, delay)));
      return getEmbeddingsInBatchWithRetry(texts, retries - 1, delay * 2);

        } else {
      console.error(`    Fallimento definitivo embedding batch dopo ${4 - (retries + 1)} tentativi.`);
      return texts.map((() => null));

        }
  }
}

async function main() {
  console.log("Avvio indicizzazione Knowledge Base...");
  let kbContent;
  try {
    kbContent = await fs.readFile(KB_TEXT_FILE, "utf8");
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
        console.warn(`    Embedding non generato per chunk ${i + j + 1} (original index ${i + j}), lo salto.`);
      }
    }
    if (chunks.length > BATCH_SIZE && i < chunks.length - BATCH_SIZE) {

      console.log(`    Pausa di 1 secondo tra i batch...`);
      await new Promise((resolve => setTimeout(resolve, 1e3)));
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