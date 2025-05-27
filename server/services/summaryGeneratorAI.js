const dotenv = require("dotenv");

const {OpenAI: OpenAI} = require("openai");

const path = require("path");

const {getFullKnowledgeBase: getFullKnowledgeBase} = require("../utils/kbLoader");

dotenv.config({
  path: path.join(__dirname, "../../.env")
});

const openaiApiKey = process.env.OPENAI_API_KEY;

const modelToUse = process.env.OPENAI_MODEL_FOR_SUMMARY || "gpt-4.1-nano";

const openai = openaiApiKey ? new OpenAI({
  apiKey: openaiApiKey
}) : null;

const generateExecutiveSummaryAI = async (reportDataConsolidato, clienteInfo) => {
  console.log(`--- Avvio Generazione Executive Summary AI (FULL KB) ---`);
  if (!openai) throw new Error("OpenAI client non inizializzato per summary.");
  const kbContent = await getFullKnowledgeBase();
  if (kbContent === "ERRORE_CARICAMENTO_KB_COMPLETA") {
    throw new Error("Base di conoscenza non disponibile per summary.");
  }
  const systemPrompt = `Sei un senior business consultant specializzato nella redazione di executive summary chiari, concisi e orientati all'azione per report diagnostici sugli adeguati assetti aziendali. Devi utilizzare un linguaggio professionale e strategico. Il tuo output deve essere un testo fluente, non un elenco puntato, a meno che non sia specificamente richiesto per le priorità.`;
  let userPrompt = `**OBIETTIVO:** Scrivere un Executive Summary di circa 3-4 paragrafi (250-400 parole) per un report diagnostico. L'summary deve essere autoconsistente e fornire una visione strategica.\\n\\n`;
  userPrompt += `**INTERA BASE DI CONOSCENZA (Knowledge Base di Riferimento):**\\n\\\`\\\`\\\`\\n${kbContent}\\n\\\`\\\`\\\`\\n\\n`;
  userPrompt += `**DATI DELLA DIAGNOSI EFFETTUATA:**\\n`;
  userPrompt += `- Nome Cliente: ${clienteInfo.nome || "N/D"}\\n`;
  userPrompt += `- Settore: ${clienteInfo.settore || "N/D"}\\n`;
  userPrompt += `- Dimensione: ${clienteInfo.dimensioneStimata || "N/D"}\\n`;
  userPrompt += `- Obiettivi Strategici del Cliente: ${clienteInfo.obiettiviStrategici || "Non forniti."}\\n`;
  userPrompt += `- Criticità Percepite dal Cliente: ${clienteInfo.criticitaPercepite || "Non fornite."}\\n\\n`;
  userPrompt += `- Giudizio Generale Adeguatezza (calcolato da regole): ${reportDataConsolidato.executiveSummary?.giudizioGenerale || "N/D"}\\n`;
  userPrompt += `- Totale Gap Rilevati: ${reportDataConsolidato.statisticheGap?.totalGaps || 0}\\n`;
  userPrompt += `  - Gap a Rischio Alto: ${reportDataConsolidato.statisticheGap?.countByRisk?.alto || 0}\\n`;
  userPrompt += `  - Gap a Rischio Medio: ${reportDataConsolidato.statisticheGap?.countByRisk?.medio || 0}\\n`;
  userPrompt += `  - Gap a Rischio Basso: ${reportDataConsolidato.statisticheGap?.countByRisk?.basso || 0}\\n\\n`;
  userPrompt += `Principali Aree di Forza (calcolate da regole):\\n`;
  (reportDataConsolidato.executiveSummary?.areeForza || []).forEach((f => userPrompt += `- ${f}\\n`));
  userPrompt += `\\nPrincipali Aree di Debolezza (basate su gap prioritari calcolati da regole):\\n`;
  (reportDataConsolidato.executiveSummary?.areeDebolezza || []).forEach((d => userPrompt += `- ${d}\\n`));
  userPrompt += `\\n`;
  if (reportDataConsolidato.elencoGapCompleto && reportDataConsolidato.elencoGapCompleto.length > 0) {
    userPrompt += `**Elenco dei Gap più Rilevanti (Rischio Alto/Medio):**\\n`;
    reportDataConsolidato.elencoGapCompleto.filter((g => g.livello_rischio === "alto" || g.livello_rischio === "medio")).slice(0, 7).forEach((g => {
      userPrompt += `- ID: ${g.item_id}, Rischio: ${g.livello_rischio}, Descrizione: ${g.descrizione}\\n`;
      if (g.implicazioni && Array.isArray(g.implicazioni) && g.implicazioni.length > 0) {
        userPrompt += `    Implicazioni: ${g.implicazioni.join("; ")}\\n`;
      }
    }));
    userPrompt += `\\n`;
  }
  userPrompt += `**ISTRUZIONI PER L'EXECUTIVE SUMMARY:**\\n`;
  userPrompt += `1.  **Introduzione e Giudizio Complessivo:** Inizia con una frase che riassuma lo scopo della diagnosi e fornisca il tuo giudizio sintetico (puoi confermare o modulare quello calcolato da regole, motivando brevemente) sull'adeguatezza generale degli assetti del cliente, basandoti su TUTTE le informazioni e la KB.\\n`;
  userPrompt += `2.  **Analisi Punti Salienti:** Evidenzia le 2-3 aree di forza più significative e le 2-3 aree di debolezza più critiche emerse. Collega queste debolezze ai rischi operativi, finanziari, di compliance (citando normative dalla KB se rilevante) o strategici per il cliente.\\n`;
  userPrompt += `3.  **Priorità Strategiche d'Intervento (FONDAMENTALE):** Basandoti sull'intera diagnosi, sul profilo del cliente (inclusi obiettivi e criticità dichiarate, se presenti), e sulla tua conoscenza esperta derivante dalla KB, identifica e formula chiaramente **due o tre priorità strategiche d'intervento**. Queste priorità devono essere azioni di alto livello o aree tematiche su cui l'azienda dovrebbe concentrarsi per migliorare i propri assetti e mitigare i rischi più significativi. Spiega brevemente il perché di ogni priorità.\\n`;
  userPrompt += `4.  **Conclusione e Prossimi Passi (Opzionale):** Concludi con una breve frase che sottolinei l'importanza dell'adozione di un piano d'azione e il supporto che il sistema può offrire.\\n`;
  userPrompt += `5.  **Stile:** Professionale, chiaro, conciso, orientato alla decisione. Evita linguaggio eccessivamente tecnico se non spiegato. L'output deve essere un testo narrativo, non un elenco di punti (eccetto forse per le priorità strategiche se aiuta la chiarezza).\\n\\n`;
  userPrompt += `**OUTPUT RICHIESTO:** Un testo di 3-4 paragrafi (circa 250-400 parole) che costituisca l'Executive Summary. Inizia direttamente con il testo dell'summary, senza preamboli.`;
  console.log(`>>> Chiamata API ${modelToUse} per Executive Summary (FULL KB)...`);
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
      temperature: .4
    });
    const summaryText = completion.choices[0]?.message?.content;
    if (!summaryText || summaryText.trim().length < 50) {
      throw new Error("Risposta AI vuota o insufficiente per l'executive summary.");
    }
    console.log(`--- Executive Summary AI (FULL KB) generato con successo.`);
    return summaryText.trim();
  } catch (error) {
    console.error(`!!! ERRORE Chiamata OpenAI per Executive Summary:`, error.message);
    throw new Error(`Generazione Executive Summary fallita: ${error.message}`);
  }
};

module.exports = {
  generateExecutiveSummaryAI: generateExecutiveSummaryAI
};