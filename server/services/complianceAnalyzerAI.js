
const dotenv = require("dotenv");

const {OpenAI: OpenAI} = require("openai");

const path = require("path");

const {getFullKnowledgeBase: getFullKnowledgeBase} = require("../utils/kbLoader");

dotenv.config({
  path: path.join(__dirname, "../../.env")
});

const openaiApiKey = process.env.OPENAI_API_KEY;

const MODEL_FOR_COMPLIANCE = process.env.OPENAI_MODEL_FOR_COMPLIANCE_ANALYSIS || "gpt-4.1-nano";

const openai = openaiApiKey ? new OpenAI({
  apiKey: openaiApiKey
}) : null;

if (!openai) {
  console.warn("!!! SERVIZIO COMPLIANCE AI: OpenAI client non inizializzato. Le funzioni restituiranno messaggi di fallback. !!!");
}

 async function getAIComplianceAssessment(systemPrompt, userQueryConstruct, kbContent, instructionForAI) {
  if (!openai) return "Servizio AI non disponibile (OpenAI client non inizializzato).";
  if (kbContent === "ERRORE_CARICAMENTO_KB_COMPLETA") return "Base di conoscenza non disponibile per l'analisi.";
  const userPrompt = `**INTERA BASE DI CONOSCENZA (Knowledge Base di Riferimento):**\n\`\`\`\n${kbContent}\n\`\`\`\n\n${userQueryConstruct}\n\n**VALUTAZIONE/COMMENTO RICHIESTO:**\n${instructionForAI}\nRestituisci solo il testo della valutazione/commento richiesto, senza preamboli o postille.`;
  try {
    console.log(`>>> complianceAnalyzerAI: Chiamata API ${MODEL_FOR_COMPLIANCE}...`);

        const completion = await openai.chat.completions.create({
      model: MODEL_FOR_COMPLIANCE,
      messages: [ {
        role: "system",
        content: systemPrompt
      }, {
        role: "user",
        content: userPrompt
      } ],
      temperature: .3
    });
    const assessmentText = completion.choices[0]?.message?.content?.trim();
    if (!assessmentText || assessmentText.length < 10) {

      console.warn("complianceAnalyzerAI: Risposta AI vuota o troppo corta.");
      return "L'analisi AI non ha prodotto un risultato sufficiente.";
    }
    console.log(">>> complianceAnalyzerAI: Valutazione ricevuta da AI.");
    return assessmentText;
  } catch (error) {
    console.error(`!!! ERRORE Chiamata OpenAI in complianceAnalyzerAI:`, error.message);
    if (error.response?.data?.error?.message) {
      return `Errore API OpenAI: ${error.response.data.error.message}`;
    }
    return `Errore durante l'analisi di conformità AI: ${error.message}`;
  }
}

 async function analyzeComplianceEBA(principioEBA, checklistAnswers, clienteInfo) {
  const kbContent = await getFullKnowledgeBase();
  const systemPromptEBA = "Sei un esperto di compliance bancaria e delle Linee Guida EBA sulla concessione e monitoraggio dei prestiti. Il tuo compito è valutare l'allineamento di un'azienda a uno specifico principio EBA, basandoti sulle informazioni fornite.";
  let userQueryConstruct = `**PRINCIPIO EBA DA VALUTARE:**\nTitolo: ${principioEBA.titolo}\nEstratto Linee Guida (dalla KB): ${principioEBA.testoRiferimentoKB}\n\n`;
  userQueryConstruct += `**PROFILO AZIENDA CLIENTE:**\nNome: ${clienteInfo.nome || "N/D"}\nDimensione: ${clienteInfo.dimensioneStimata || "N/D"}\nSettore: ${clienteInfo.settore || "N/D"}\n\n`;
  userQueryConstruct += `**SINTESI RISPOSTE CHECKLIST RILEVANTI (selezionate dal sistema):**\n`;

    const risposteDaConsiderare = checklistAnswers.filter((a => a.itemId?.startsWith("B.") || a.itemId?.startsWith("C.") || a.itemId?.startsWith("E."))).slice(0, 5).map((a => `- ${a.itemId} (${a.domandaText?.substring(0, 50)}...): ${a.risposta || "Non Risposto"}${a.note ? " (Nota: " + a.note.substring(0, 30) + "...)" : ""}`)).join("\n");
  userQueryConstruct += risposteDaConsiderare || "Nessuna risposta specifica fornita per questo prompt.\n";
  const instructionForAI_EBA = `Fornisci una valutazione sintetica (massimo 100-120 parole) sull'allineamento dell'azienda a questo specifico principio EBA. Evidenzia eventuali punti di forza o debolezza osservati dalle risposte e dal profilo cliente, in relazione al principio EBA e al contesto generale della KB. Concludi con un giudizio qualitativo (es. Allineamento Buono, Aree di Miglioramento Necessarie, Forte Disallineamento).`;
  return getAIComplianceAssessment(systemPromptEBA, userQueryConstruct, kbContent, instructionForAI_EBA);
}

 async function commentComplianceSSM(aspettoSSM, checklistDoc, gapsDocs, executiveSummaryAI) {
  const kbContent = await getFullKnowledgeBase();
  const systemPromptSSM = "Sei un giurista d'impresa esperto dell'art. 2086 c.c. e delle responsabilità degli amministratori in materia di adeguati assetti organizzativi, amministrativi e contabili, con riferimento al Quaderno 18 della Scuola Superiore della Magistratura.";
  let userQueryConstruct = `**ASPETTO DA COMMENTARE (ART. 2086 c.c. e SSM Doc. 5):**\nTitolo: ${aspettoSSM.titolo}\nContesto Normativo (dalla KB): ${aspettoSSM.testoRiferimentoKB}\n\n`;
  userQueryConstruct += `**PROFILO AZIENDA CLIENTE:**\nNome: ${checklistDoc.cliente.nome || "N/D"}\nDimensione: ${checklistDoc.cliente.dimensioneStimata || "N/D"}\n\n`;
  userQueryConstruct += `**SINTESI DIAGNOSI (Executive Summary AI):**\n${executiveSummaryAI || "Summary non disponibile."}\n\n`;
  userQueryConstruct += `**PRINCIPALI GAP CRITICI RILEVATI (se presenti):**\n`;
  const criticalGaps = gapsDocs.filter((g => g.livello_rischio === "alto")).slice(0, 3);
  if (criticalGaps.length > 0) {
    criticalGaps.forEach((g => userQueryConstruct += `- ${g.item_id}: ${g.descrizione?.substring(0, 100)}...\n`));
  } else {
    userQueryConstruct += "Nessun gap a rischio alto particolarmente critico evidenziato per questo prompt.\n";
  }
  const instructionForAI_SSM = `Fornisci un breve commento (massimo 100-120 parole) su come le informazioni della diagnosi (summary e gap) si pongono rispetto a QUESTO SPECIFICO aspetto del dovere degli amministratori ex art. 2086 c.c. come interpretato dal Quaderno SSM. Evidenzia se emergono potenziali carenze o punti di attenzione.`;
  return getAIComplianceAssessment(systemPromptSSM, userQueryConstruct, kbContent, instructionForAI_SSM);
}

 async function analyzePredisposizioneVisti(requisitoVisto, checklistDoc, gapsDocs) {
  const kbContent = await getFullKnowledgeBase();
  const systemPromptVisti = "Sei un Dottore Commercialista esperto nelle Linee Guida CNDCEC sul rilascio del Visto di Conformità e del Visto di Congruità sull'informativa finanziaria aziendale.";
  let userQueryConstruct = `**REQUISITO PER VISTI CNDCEC DA VALUTARE:**\nTitolo: ${requisitoVisto.titolo}\nContesto Linee Guida CNDCEC (dalla KB): ${requisitoVisto.testoRiferimentoKB}\n\n`;
  userQueryConstruct += `**PROFILO AZIENDA CLIENTE:**\nNome: ${checklistDoc.cliente.nome || "N/D"}\n\n`;
  userQueryConstruct += `**SINTESI RISULTATI CHECKLIST SU AREE CONTABILI E DI CONTROLLO (selezionate dal sistema):**\n`;
  const risposteContabili = checklistDoc.answers.filter((a => a.itemId?.startsWith("D.") || a.itemId === "C.1.3")).slice(0, 7).map((a => `- ${a.itemId} (${a.domandaText?.substring(0, 50)}...): ${a.risposta || "Non Risposto"}`)).join("\n");
  userQueryConstruct += risposteContabili || "Nessuna risposta contabile specifica fornita per questo prompt.\n";
  userQueryConstruct += `\n**GAP RILEVATI NELLE AREE CONTABILI/AMMINISTRATIVE (se presenti):**\n`;
  const relevantGaps = gapsDocs.filter((g => g.item_id?.startsWith("D.") || g.item_id?.startsWith("C."))).slice(0, 3);
  if (relevantGaps.length > 0) {
    relevantGaps.forEach((g => userQueryConstruct += `- ${g.item_id}: ${g.descrizione?.substring(0, 100)}... (Rischio: ${g.livello_rischio})\n`));
  } else {
    userQueryConstruct += "Nessun gap specifico in area contabile/amministrativa fornito per questo prompt.\n";
  }
  const instructionForAI_Visti = `Fornisci un parere preliminare (massimo 100-120 parole) sulla probabile predisposizione dell'azienda a soddisfare QUESTO SPECIFICO requisito per i Visti CNDCEC, basandoti sulle informazioni della checklist e sui gap. Evidenzia potenziali ostacoli o punti di forza.`;
  return getAIComplianceAssessment(systemPromptVisti, userQueryConstruct, kbContent, instructionForAI_Visti);
}

module.exports = {
  analyzeComplianceEBA: analyzeComplianceEBA,
  commentComplianceSSM: commentComplianceSSM,
  analyzePredisposizioneVisti: analyzePredisposizioneVisti
};