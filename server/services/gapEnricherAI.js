
const dotenv = require("dotenv");

const {OpenAI: OpenAI} = require("openai");

const path = require("path");

const {getFullKnowledgeBase: getFullKnowledgeBase} = require("../utils/kbLoader");

dotenv.config({
  path: path.join(__dirname, "../../.env")
});

const openaiApiKey = process.env.OPENAI_API_KEY;

const modelToUse = process.env.OPENAI_MODEL_FOR_ENRICHMENT || "gpt-4.1-nano-2025-04-14";

const openai = openaiApiKey ? new OpenAI({
  apiKey: openaiApiKey
}) : null;

 const enrichGapWithAI = async (gapBase, cliente, checklistAnswers) => {
  console.log(`--- Avvio Enrichment AI Esperta (FULL KB) per Gap ${gapBase.item_id} ---`);
  if (!openai) {
    console.error("!!! ERRORE: OpenAI client non inizializzato per arricchimento Gap.");
    return null;
  }
  if (!gapBase || !cliente) {
    console.error("!!! ERRORE: Dati mancanti per l'arricchimento AI del Gap (gap o cliente).");
    return null;
  }
  const kbContent = await getFullKnowledgeBase();

    if (kbContent === "ERRORE_CARICAMENTO_KB_COMPLETA") {
    console.error("KB non disponibile per arricchimento gap.");
    return {
      descrizione: gapBase.descrizione,
      livello_rischio: gapBase.livello_rischio,
      implicazioni: gapBase.implicazioni ? Array.isArray(gapBase.implicazioni) ? gapBase.implicazioni : [ gapBase.implicazioni ] : [],
      suggerimenti_ai: [ "Errore: KB non disponibile." ],
      arricchitoConAI: false,
      riferimentiKb: [],
      riferimentiNormativiSpecificiAI: [],
      impattoStimatoAI: {
        livello: "Non determinabile",
        descrizione: "N/D"
      },
      prioritaRisoluzioneAI: null
    };
  }
  const relevantAnswer = checklistAnswers.find((ans => ans && ans.itemId === gapBase.item_id));

    const systemPrompt = `Sei un consulente esperto in adeguati assetti e crisi d'impresa. Analizza il GAP fornito, considerando il contesto del cliente e L'INTERA Knowledge Base fornita. Fornisci ESCLUSIVAMENTE un oggetto JSON.`;
  let userPrompt = `**INTERA BASE DI CONOSCENZA (Knowledge Base):**\n"""\n${kbContent}\n"""\n\n`;
  userPrompt += `PROFILO CLIENTE:\nNome: ${cliente.nome || "N/D"}\nDimensione: ${cliente.dimensioneStimata || "N/D"}\nSettore: ${cliente.settore || "N/D"}\nObiettivi Strategici Dichiarati: ${cliente.obiettiviStrategici || "Non specificati"}\nCriticità Percepite Dichiarate: ${cliente.criticitaPercepite || "Non specificate"}\n\n`;
  userPrompt += `CHECKLIST ITEM e GAP BASE:\nID Domanda: ${gapBase.item_id}\nTesto Domanda: ${gapBase.domandaText || relevantAnswer?.domandaText || "N/D"}\nRisposta Data: ${gapBase.risposta_data ?? relevantAnswer?.risposta ?? "N/D"}\nDescrizione Gap Base: ${gapBase.descrizione}\nLivello Rischio Base: ${gapBase.livello_rischio}\nImplicazione Base: ${gapBase.implicazioni || "Non specificate"}\n\n`;
  userPrompt += `RICHIESTA DI ARRICCHIMENTO (JSON Object):\n`;
  userPrompt += `Basandoti SU TUTTE LE INFORMAZIONI FORNITE (in particolare l'INTERA Knowledge Base e il profilo cliente), fornisci un oggetto JSON con i seguenti campi:\n`;
  userPrompt += `{\n`;
  userPrompt += `  "descrizione_arricchita": "Riscrivi la descrizione del gap in modo più dettagliato e specifico per QUESTO cliente, integrando eventuali spunti dalla KB. Sii preciso e conciso.",\n`;
  userPrompt += `  "livello_rischio_suggerito_ai": "Valuta attentamente ('alto', 'medio', 'basso') il rischio alla luce di TUTTO il contesto, inclusa la KB. Considera la dimensione del cliente e le normative. Se la KB suggerisce un rischio diverso da quello 'Base', motiva brevemente la tua valutazione (puoi includere la motivazione nella descrizione_arricchita o nelle implicazioni_dettagliate_ai).",\n`;
  userPrompt += `  "implicazioni_dettagliate_ai": ["Descrivi dettagliatamente (minimo 2-3 punti) le potenziali conseguenze negative SPECIFICHE di questo gap per QUESTO cliente. Collega le implicazioni a rischi finanziari, operativi, di compliance, reputazionali, o al mancato raggiungimento degli obiettivi cliente. Cita normative specifiche dalla KB se violate."],\n`;
  userPrompt += `  "suggerimenti_specifici_ai": ["Fornisci 2-3 suggerimenti di intervento CONCRETI e AZIONABILI (SMART) per mitigare o risolvere questo gap. I suggerimenti devono essere pratici per il cliente e informati dalla KB."],\n`;
  userPrompt += `  "riferimenti_normativi_specifici_ai": ["Elenca ESATTAMENTE gli articoli di legge, i paragrafi delle linee guida (es. 'EBA GL/2020/06 Par. 4.3.2', 'CNDCEC Check-list B.1.1'), o i principi contabili (es. 'OIC 11') che sono direttamente pertinenti o violati da questo gap, basandoti sulla KB. Se nessuno è direttamente applicabile, restituisci un array vuoto."],\n`;
  userPrompt += `  "impatto_stimato_ai": { "tipo": "Finanziario | Operativo | Reputazionale | Conformità | Strategico | Altro", "livello": "Alto | Medio | Basso | Non determinabile", "descrizione": "Descrivi brevemente l'impatto qualitativo o quantitativo (se possibile) del gap sull'azienda. Es: 'Rischio di sanzioni per non conformità CCII', 'Perdita efficienza operativa stimata X%'." },\n`;
  userPrompt += `  "priorita_risoluzione_ai": "Suggerisci una priorità di risoluzione ('alta', 'media', 'bassa') per questo gap, considerando il rischio e l'impatto.",\n`;
  userPrompt += `  "sezione_kb_piu_rilevante_citata": "Indica brevemente (es. 'Sezione CNDCEC B.1 Organigramma', 'EBA GL Par. 4.3') la parte della Knowledge Base che hai trovato PIU' utile per questa analisi, SE l'hai usata. Altrimenti 'Nessuna sezione specifica utilizzata'."\n`;
  userPrompt += `}\n`;
  userPrompt += `Assicurati che il JSON sia valido e contenga ESATTAMENTE questi campi. Non includere spiegazioni aggiuntive al di fuori del JSON.`;
  console.log(`>>> Chiamata API ${modelToUse} per arricchimento Gap ${gapBase.item_id} (FULL KB)...`);
  try {
    const completion = await openai.chat.completions.create({
      model: modelToUse,
      messages: [ {
        role: "system",
        content: systemPrompt
      }, {
        role: "user",
        content: userPrompt
      } ],
      temperature: .3,

      response_format: {
        type: "json_object"
      }
    });
    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("Risposta AI vuota per arricchimento gap (FULL KB).");
    }
    const enrichedJson = JSON.parse(responseContent);
    console.log(`--- JSON Arricchito (FULL KB) VALIDO ricevuto per Gap ${gapBase.item_id}.`);
    console.log(`    Sezione KB citata dall'AI: ${enrichedJson.sezione_kb_piu_rilevante_citata || "Nessuna"}`);

        return {
      descrizione: enrichedJson.descrizione_arricchita || gapBase.descrizione,
      livello_rischio: enrichedJson.livello_rischio_suggerito_ai || gapBase.livello_rischio,
      implicazioni: enrichedJson.implicazioni_dettagliate_ai || (gapBase.implicazioni ? Array.isArray(gapBase.implicazioni) ? gapBase.implicazioni : [ gapBase.implicazioni ] : []),
      suggerimenti_ai: enrichedJson.suggerimenti_specifici_ai || [],
      riferimentiNormativiSpecificiAI: enrichedJson.riferimenti_normativi_specifici_ai || [],
      impattoStimatoAI: enrichedJson.impatto_stimato_ai || {
        tipo: "Non determinabile",
        livello: "Non determinabile",
        descrizione: "N/D"
      },
      prioritaRisoluzioneAI: enrichedJson.priorita_risoluzione_ai || "Non determinata",

      riferimentiKb: enrichedJson.sezione_kb_piu_rilevante_citata ? [ {
        chunkId: "AI_cited_section",
        estrattoTesto: `AI ha indicato rilevante: ${enrichedJson.sezione_kb_piu_rilevante_citata}`,
        similarita: null
      } ] : [],
      arricchitoConAI: true
    };
  } catch (error) {
    console.error(`!!! ERRORE Chiamata OpenAI per arricchimento Gap ${gapBase.item_id} (FULL KB):`, error.message);

        return {
      descrizione: gapBase.descrizione,
      livello_rischio: gapBase.livello_rischio,
      implicazioni: gapBase.implicazioni ? Array.isArray(gapBase.implicazioni) ? gapBase.implicazioni : [ gapBase.implicazioni ] : [],
      suggerimenti_ai: [ "Errore durante l'arricchimento AI (FULL KB)." ],
      riferimentiKb: [],
      arricchitoConAI: false,
      riferimentiNormativiSpecificiAI: [],
      impattoStimatoAI: {
        tipo: "Errore AI",
        livello: "Errore AI",
        descrizione: "Errore durante arricchimento AI."
      },
      prioritaRisoluzioneAI: "Errore AI"
    };
  }
};

module.exports = {
  enrichGapWithAI: enrichGapWithAI
};
