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
  let userPrompt = `**OBIETTIVO:** Scrivere un Executive Summary (circa 300-450 parole) per un report diagnostico. L'summary deve essere autoconsistente e fornire una visione strategica. Struttura la tua risposta in paragrafi chiari, idealmente seguendo questa traccia:\n`;
  userPrompt += `   1. Giudizio Complessivo Iniziale.\n`;
  userPrompt += `   2. Analisi dei Principali Punti di Forza.\n`;
  userPrompt += `   3. Analisi delle Principali Aree di Debolezza e Rischi Associati.\n`;
  userPrompt += `   4. Priorità Strategiche d'Intervento (elencale chiaramente, magari con un breve titolo per ciascuna).\n`;
  userPrompt += `   5. Breve Conclusione sull'importanza del piano d'azione.\n\n`;

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
  userPrompt += `1.  **Giudizio Complessivo:** Inizia con una valutazione sintetica sull'adeguatezza generale degli assetti del cliente, basandoti su TUTTE le informazioni e la KB. Puoi confermare o modulare il giudizio base calcolato.\n`;
  userPrompt += `2.  **Punti di Forza:** Descrivi brevemente le 2-3 aree dove l'azienda eccelle o è ben posizionata.\n`;
  userPrompt += `3.  **Aree di Debolezza e Rischi:** Evidenzia le 2-3 aree di debolezza più critiche emerse. Collega queste debolezze ai rischi operativi, finanziari, di compliance (citando normative dalla KB se rilevante) o strategici per il cliente.\n`;
  userPrompt += `4.  **Priorità Strategiche d'Intervento (FONDAMENTALE):** Basandoti sull'intera diagnosi e sul profilo del cliente, identifica e formula chiaramente **due o tre priorità strategiche d'intervento**. Per ciascuna priorità, fornisci un titolo conciso (es. "Rafforzamento Pianificazione e Controllo") seguito da una breve spiegazione (1-2 frasi).\n`;
  userPrompt += `5.  **Conclusione:** Concludi sottolineando l'importanza di un piano d'azione.\n`;
  userPrompt += `6.  **Stile:** Professionale, chiaro, conciso, orientato alla decisione. Usa paragrafi ben distinti. Evita elenchi puntati se non per le priorità strategiche (se aiuta la leggibilità).\n\n`;
  userPrompt += `**OUTPUT RICHIESTO:** Un testo narrativo ben strutturato per l'Executive Summary. Inizia direttamente con il testo dell'summary, senza preamboli.`;
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

const generateGeneralRecommendationsAI = async (reportDataConsolidato, clienteInfo, executiveSummaryText) => {
    console.log(`--- Avvio Generazione Raccomandazioni Generali AI (FULL KB) ---`);
    if (!openai) throw new Error("OpenAI client non inizializzato per raccomandazioni.");

    const kbContent = await getFullKnowledgeBase();
    if (kbContent === "ERRORE_CARICAMENTO_KB_COMPLETA") {
        throw new Error("Base di conoscenza non disponibile per raccomandazioni.");
    }

    const systemPrompt = `Sei un consulente strategico con esperienza nell'analisi di diagnosi aziendali complesse. Il tuo compito è formulare raccomandazioni generali di alto livello basate su una diagnosi completa.`;

    let userPrompt = `**OBIETTIVO:** Fornire 3-4 raccomandazioni generali strategiche (non interventi specifici già suggeriti per i singoli gap) per l'azienda, basate sulla diagnosi complessiva. Ogni raccomandazione dovrebbe essere una frase o due.\n\n`;
    userPrompt += `**INTERA BASE DI CONOSCENZA (Knowledge Base di Riferimento):**\n\`\`\`\n${kbContent}\n\`\`\`\n\n`;
    userPrompt += `**DATI DELLA DIAGNOSI EFFETTUATA (Sintesi):**\n`;
    userPrompt += `- Profilo Cliente: Nome: ${clienteInfo.nome}, Settore: ${clienteInfo.settore}, Dimensione: ${clienteInfo.dimensioneStimata}\n`;
    userPrompt += `- Executive Summary della Diagnosi (già prodotto da altra AI):\n${executiveSummaryText}\n\n`;
    userPrompt += `- Principali Aree di Debolezza Identificate (da analisi base): ${reportDataConsolidato.executiveSummaryBase?.areeDebolezza?.join(', ') || 'N/D'}\n`;
    userPrompt += `- Gap Totali: ${reportDataConsolidato.statisticheGap?.totalGaps}, di cui Alti: ${reportDataConsolidato.statisticheGap?.countByRisk?.alto}, Medi: ${reportDataConsolidato.statisticheGap?.countByRisk?.medio}\n\n`;
    
    // Aggiungere sintesi delle non conformità più rilevanti
    if(reportDataConsolidato.sintesiConformitaCNDCEC?.length > 0) {
        userPrompt += `Sintesi Non Conformità CNDCEC:\n`;
        reportDataConsolidato.sintesiConformitaCNDCEC.forEach(s => userPrompt += `- Punto ${s.punto}: ${s.valutazione} (${s.descrizione?.substring(0,50)}...)\n`);
    }
    if(reportDataConsolidato.sintesiConformitaAllerta?.length > 0) {
        userPrompt += `Sintesi Non Conformità Sistemi Allerta:\n`;
        reportDataConsolidato.sintesiConformitaAllerta.forEach(s => userPrompt += `- Aspetto ${s.aspetto}: ${s.valutazione} (${s.note?.substring(0,50)}...)\n`);
    }
    userPrompt += `\n`;

    userPrompt += `**ISTRUZIONI PER LE RACCOMANDAZIONI GENERALI:**\n`;
    userPrompt += `1.  Focalizzati su consigli strategici o aree di miglioramento trasversali che non sono già coperte dai suggerimenti specifici per i singoli gap (che sono più operativi).\n`;
    userPrompt += `2.  Le raccomandazioni dovrebbero essere lungimiranti e aiutare l'azienda a migliorare la sua resilienza e performance complessiva.\n`;
    userPrompt += `3.  Considera temi come: cultura aziendale, sviluppo competenze, innovazione tecnologica (se emergono come aree trascurate dalla diagnosi), approccio al risk management, revisione strategica periodica.\n`;
    userPrompt += `4.  Fornisci da 2 a 4 raccomandazioni concise.\n\n`;
    userPrompt += `**OUTPUT RICHIESTO:** Un array JSON di stringhe, dove ogni stringa è una raccomandazione. Esempio: \`["Raccomandazione 1.", "Raccomandazione 2."]\`. Fornisci ESCLUSIVAMENTE l'array JSON, senza testo aggiuntivo.\n`;

    console.log(`>>> Chiamata API ${modelToUse} per Raccomandazioni Generali...`);
    try {
        const completion = await openai.chat.completions.create({
            model: modelToUse,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.5,
            response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0]?.message?.content;
        if (!responseContent) throw new Error("Risposta AI vuota per raccomandazioni.");
        
        let parsedResult;
        try {
            parsedResult = JSON.parse(responseContent);
        } catch (parseError) {
            console.error("Errore parsing JSON per Raccomandazioni Generali:", parseError, "Risposta AI:", responseContent);
            // Fallback: se non è JSON ma è una stringa con a-capo, prova a splittarla
            if (typeof responseContent === 'string' && responseContent.includes('\n')) {
                return responseContent.split('\n').map(line => line.replace(/^- /,'').trim()).filter(line => line.length > 5);
            }
            return ["Formato risposta AI per raccomandazioni non riconosciuto."];
        }

        // Modifica questa parte per gestire il caso in cui l'AI restituisca {"raccomandazioni_generali": []}
        // o direttamente un array []
        let finalRecommendations = [];
        if (parsedResult && parsedResult.raccomandazioni_generali && Array.isArray(parsedResult.raccomandazioni_generali)) {
            finalRecommendations = parsedResult.raccomandazioni_generali;
        } else if (Array.isArray(parsedResult)) { // Se l'AI restituisce direttamente un array
            finalRecommendations = parsedResult;
        } else {
            console.warn("Formato JSON AI per raccomandazioni non valido, atteso { raccomandazioni_generali: [] } o un array diretto.", parsedResult);
            return ["L'AI non ha fornito raccomandazioni nel formato atteso."];
        }
        
        console.log(`--- Raccomandazioni Generali AI generate: ${finalRecommendations.length}`);
        return finalRecommendations.map(String); // Assicura che siano stringhe
    } catch (error) {
        console.error(`!!! ERRORE Chiamata OpenAI per Raccomandazioni Generali:`, error.message);
        return ["Errore durante la generazione delle raccomandazioni AI."];
    }
};

module.exports = {
  generateExecutiveSummaryAI: generateExecutiveSummaryAI,
  generateGeneralRecommendationsAI: generateGeneralRecommendationsAI
};