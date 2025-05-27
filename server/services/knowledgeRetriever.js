const fs = require("fs").promises;

const path = require("path");

const {OpenAI: OpenAI} = require("openai");

const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, "../../.env")
});

const openaiApiKey = process.env.OPENAI_API_KEY;

const openai = openaiApiKey ? new OpenAI({
  apiKey: openaiApiKey
}) : null;

const INDEXED_KB_FILE = path.join(__dirname, "../knowledge/indexed_kb_data.json");

const EMBEDDING_MODEL = "text-embedding-3-small";

let indexedKb = null;

 function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    console.error("I vettori devono avere la stessa dimensione per la similarità coseno.");
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

 async function loadIndexedKb() {
  if (!indexedKb) {
    try {
      const data = await fs.readFile(INDEXED_KB_FILE, "utf8");
      indexedKb = JSON.parse(data);
      console.log(`KB indicizzata caricata da ${INDEXED_KB_FILE} (${indexedKb.length} chunks).`);
    } catch (error) {
      console.error("Errore caricamento KB indicizzata:", error);
      indexedKb = [];

            throw new Error("Impossibile caricare la base di conoscenza indicizzata.");
    }
  }
}

 async function getEmbeddingForQuery(text) {
  if (!openai) throw new Error("OpenAI client non inizializzato in retriever.");
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.replace(/\n/g, " ")
    });
    if (response.data && response.data.length > 0) {
      return response.data[0].embedding;
    }
    throw new Error("Risposta embedding non valida.");
  } catch (error) {
    console.error("Errore generazione embedding per query:", error);
    throw error;
  }
}

 async function retrieveRelevantChunks(query, topN = 30) {
  if (!openai) {
    console.error("OpenAI client non disponibile per il recupero.");
    return [];
  }
  await loadIndexedKb();
  if (!indexedKb || indexedKb.length === 0) {
    console.warn("Nessun dato indicizzato disponibile per il recupero.");
    return [];
  }
  console.log(`\n--- INIZIO RECUPERO CHUNK PER QUERY: "${query.substring(0, 100)}..." ---`);
  try {
    const queryEmbedding = await getEmbeddingForQuery(query);
    const similarities = indexedKb.map((chunk => ({
      id: chunk.id,

      text: chunk.text,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
    })));
    similarities.sort(((a, b) => b.similarity - a.similarity));
    const topChunks = similarities.slice(0, topN);
    console.log(`  -> ${topChunks.length} CHUNK PIÙ RILEVANTI RECUPERATI (su ${indexedKb.length} totali):`);
    topChunks.forEach((chunk => {
      console.log(`     - ID: ${chunk.id}, Similarità: ${chunk.similarity.toFixed(4)}, Testo (inizio): "${chunk.text.substring(0, 150).replace(/\n/g, " ")}..."`);
    }));
    console.log(`--- FINE RECUPERO CHUNK ---`);
    return topChunks;

    } catch (error) {
    console.error("Errore durante il recupero dei chunk:", error);
    return [];
  }
}

module.exports = {
  retrieveRelevantChunks: retrieveRelevantChunks
};