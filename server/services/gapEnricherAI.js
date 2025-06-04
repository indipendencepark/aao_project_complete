const dotenv = require("dotenv");

const {OpenAI: OpenAI} = require("openai");

const path = require("path");

const {getFullKnowledgeBase: getFullKnowledgeBase} = require("../utils/kbLoader");

dotenv.config({
  path: path.join(__dirname, "../../.env")
});

const openaiApiKey = process.env.OPENAI_API_KEY;

const modelToUse = process.env.OPENAI_MODEL_FOR_ENRICHMENT || "gpt-4.1-nano-2025-04-14"; // Considera un modello più potente se i risultati non sono soddisfacenti, es. gpt-4o

const openai = openaiApiKey ? new OpenAI({
  apiKey: openaiApiKey
}) : null;

 const enrichGapWithAI = async (gapBase, cliente, checklistAnswers) => {
  console.log(`--- Avvio Enrichment AI Esperta (FULL KB & D3 Potenziato) per Gap ${gapBase.item_id} ---`);
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

    const systemPrompt = `Sei un consulente senior esperto in adeguati assetti organizzativi, amministrativi, contabili e crisi d'impresa, con profonda conoscenza della normativa italiana (Codice Civile, CCII), delle best practice di settore (EBA, CNDCEC, COSO, ISO) e della governance aziendale. Analizza il GAP fornito, considerando il profilo del cliente e l'INTERA Knowledge Base (KB) fornita. Il tuo output deve essere ESCLUSIVAMENTE un oggetto JSON valido.`;
  let userPrompt = `**INTERA BASE DI CONOSCENZA (Knowledge Base):**\n"""\n${kbContent}\n"""\n\n`;
  userPrompt += `PROFILO CLIENTE:\nNome: ${cliente.nome || "N/D"}\nDimensione: ${cliente.dimensioneStimata || "N/D"}\nSettore: ${cliente.settore || "N/D"}\nObiettivi Strategici Dichiarati: ${cliente.obiettiviStrategici || "Non specificati"}\nCriticità Percepite Dichiarate: ${cliente.criticitaPercepite || "Non specificate"}\n\n`;
  userPrompt += `- Forma Giuridica: ${cliente.formaGiuridica || "N/D"}\n`;
  userPrompt += `- Complessità (Consulente): ${cliente.complessita || "Non specificata"}\n`;
  userPrompt += `- Settore ATECO Specifico: ${cliente.settoreATECOSpecifico || "Non specificato"}\n`;
  userPrompt += `- Modello Business: ${cliente.modelloBusiness || "Non specificato"}\n`;
  userPrompt += `- Complessità Operativa (Specifica): ${cliente.complessitaOperativa || "Non specificata"}\n`;
  userPrompt += `- Struttura Proprietaria: ${cliente.strutturaProprietaria || "Non specificata"}\n`;
  userPrompt += `- Livello Internazionalizzazione: ${cliente.livelloInternazionalizzazione || "Non specificato"}\n`;
  userPrompt += `- Fase Ciclo di Vita Azienda: ${cliente.faseCicloVita || "Non specificata"}\n`;
  userPrompt += `CHECKLIST ITEM e GAP BASE:\nID Domanda: ${gapBase.item_id}\nTesto Domanda: ${gapBase.domandaText || relevantAnswer?.domandaText || "N/D"}\nRisposta Data: ${gapBase.risposta_data ?? relevantAnswer?.risposta ?? "N/D"}\nDescrizione Gap Base: ${gapBase.descrizione}\nLivello Rischio Base: ${gapBase.livello_rischio}\nImplicazione Base: ${gapBase.implicazioni || "Non specificate"}\n\n`;
  userPrompt += `**RICHIESTA DI ARRICCHIMENTO SPECIFICO DEL GAP (Output JSON OBBLIGATORIO):**\n`;
  userPrompt += `Basandoti sull'INTERA Knowledge Base fornita, sul profilo cliente e sul gap base, fornisci un oggetto JSON con i seguenti campi. Sii estremamente preciso, contestualizzato e tecnico:\n`;
  userPrompt += `{\n`;
  userPrompt += `  "descrizione_arricchita_ai": "Riscrivi la descrizione del gap in modo più dettagliato, tecnico e specifico per QUESTO cliente, integrando concetti e terminologia dalla KB. Motiva brevemente perché questa situazione rappresenta un gap per l'azienda specifica, considerando il suo profilo (max 150 parole).",\n`;
  userPrompt += `  "livello_rischio_confermato_o_modificato_ai": "alto | medio | basso", // Valuta attentamente il rischio. Parti dal \`livello_rischio_base\` fornito. Modificalo SOLO SE hai una forte motivazione basata sulla KB o sul profilo cliente per cambiarlo. Se lo modifichi, la motivazione deve essere evidente nella 'descrizione_arricchita_ai' o nelle 'implicazioni_dettagliate_ai'. Altrimenti, conferma il livello di rischio base.\n`;
  userPrompt += `  "implicazioni_dettagliate_ai": ["Descrivi dettagliatamente (minimo 2-3 punti) le potenziali conseguenze negative SPECIFICHE di questo gap per QUESTO cliente. Collega le implicazioni a rischi finanziari, operativi, di compliance, reputazionali, o al mancato raggiungimento degli obiettivi cliente. Cita normative specifiche dalla KB se violate."],\n`;
  userPrompt += `  "suggerimenti_intervento_specifici_ai": ["Fornisci 2-3 suggerimenti di intervento CONCRETI, AZIONABILI (quasi SMART) e, se possibile, con una logica di priorità o propedeuticità (es. 'Come primo passo:', 'Successivamente:'). I suggerimenti devono essere pratici per il cliente, informati dalla KB e non generici. Devono essere frasi complete e chiare."],\n`;
  userPrompt += `  "riferimenti_normativi_specifici_ai": ["Elenca ESATTAMENTE gli articoli di legge, i paragrafi delle linee guida (es. 'EBA GL/2020/06 Par. 4.3.2', 'CNDCEC Check-list B.1.1'), o i principi contabili (es. 'OIC 11') che sono direttamente pertinenti o violati da questo gap, basandoti sulla KB. Se nessuno è direttamente applicabile, restituisci un array vuoto."],\n`;
  userPrompt += `  "impatto_stimato_ai": { "tipo": "Finanziario | Operativo | Reputazionale | Conformità | Strategico | Altro", "livello": "Alto | Medio | Basso | Non determinabile", "descrizione": "Descrivi brevemente l'impatto qualitativo o quantitativo (se possibile) del gap sull'azienda. Es: 'Rischio di sanzioni per non conformità CCII', 'Perdita efficienza operativa stimata X%'." },\n`;
  userPrompt += `  "priorita_risoluzione_ai": "Suggerisci una priorità di risoluzione ('alta', 'media', 'bassa') per questo gap, considerando il rischio e l'impatto.",\n`;
  userPrompt += `  "sezione_kb_piu_rilevante_citata": "Indica brevemente (es. 'Sezione CNDCEC B.1 Organigramma', 'EBA GL Par. 4.3') la parte della Knowledge Base che hai trovato PIU' utile per questa analisi, SE l'hai usata. Altrimenti 'Nessuna sezione specifica utilizzata'."\n`;
  userPrompt += `}\n`;
  userPrompt += `Assicurati che il JSON sia valido e contenga ESATTAMENTE questi campi. Non includere spiegazioni aggiuntive al di fuori del JSON.`;
  console.log(`>>> Chiamata API ${modelToUse} per arricchimento Gap ${gapBase.item_id} (FULL KB, prompt D3 potenziato)...`);
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
    console.log(`>>>> RAW AI Response for livello_rischio_confermato_o_modificato_ai: "${enrichedJson.livello_rischio_confermato_o_modificato_ai}" for GAP ID ${gapBase.item_id}`);
    console.log(`--- JSON Arricchito (D3) VALIDO ricevuto per Gap ${gapBase.item_id}. ---`);
    console.log(`    Descrizione Arricchita: ${enrichedJson.descrizione_arricchita_ai?.substring(0,100) || 'N/D'}...`);
    console.log(`    Sezione KB citata dall'AI: ${enrichedJson.sezione_kb_piu_rilevante_citata || "Nessuna"}`);

    const validRiskLevels = ['alto', 'medio', 'basso'];
    const validImpactTypes = ["Finanziario", "Operativo", "Reputazionale", "Conformità", "Strategico", "Altro", "Non determinabile"];
    const validImpactLevels = ['Alto', 'Medio', 'Basso', 'Non determinabile']; // Nota: case sensitive qui per l'enum, ma l'AI potrebbe non rispettarlo. Convertiremo.
    const suggestedRiskLevel = enrichedJson.livello_rischio_confermato_o_modificato_ai;

    // Verifica se il livello di rischio suggerito è valido
    if (!validRiskLevels.includes(suggestedRiskLevel)) {
      console.error(`!!! ERRORE: Livello di rischio suggerito non valido: ${suggestedRiskLevel}`);
      // Puoi decidere di impostare un valore di fallback qui, se necessario
    }

    const normalizedRisk = validRiskLevels.includes(suggestedRiskLevel) ? suggestedRiskLevel : gapBase.livello_rischio;

    return {
      descrizione: enrichedJson.descrizione_arricchita_ai || gapBase.descrizione,
      livello_rischio: normalizedRisk,
      implicazioni: enrichedJson.implicazioni_dettagliate_ai || (gapBase.implicazioni ? Array.isArray(gapBase.implicazioni) ? gapBase.implicazioni : [ gapBase.implicazioni ] : []),
      suggerimenti_ai: enrichedJson.suggerimenti_intervento_specifici_ai || ["Arricchimento AI non disponibile (OpenAI client non inizializzato)."],
      riferimentiNormativiSpecificiAI: enrichedJson.riferimenti_normativi_specifici_ai || [],
      impattoStimatoAI: enrichedJson.impatto_stimato_ai || {
        tipo: validImpactTypes[enrichedJson.impatto_stimato_ai?.tipo ? parseInt(enrichedJson.impatto_stimato_ai.tipo) : 6],
        livello: validImpactLevels[enrichedJson.impatto_stimato_ai?.livello ? parseInt(enrichedJson.impatto_stimato_ai.livello) : 3],
        descrizione: enrichedJson.impatto_stimato_ai?.descrizione || "N/D"
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
      suggerimenti_ai: [`Errore durante l'arricchimento AI (D3): ${error.message}`],
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
