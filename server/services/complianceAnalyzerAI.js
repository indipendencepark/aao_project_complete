// server/services/complianceAnalyzerAI.js
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const path = require('path');
const { getFullKnowledgeBase } = require('../utils/kbLoader');
// Importa qui i modelli DB se devi recuperare informazioni specifiche non passate come parametri
// const { Checklist, Gap } = require('../models/diagnosi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;
// Modello da usare per queste analisi. Potrebbe essere diverso da quello per i gap o summary.
// GPT-4o-mini o GPT-4-turbo sono consigliati per compiti di ragionamento e conformità.
const MODEL_FOR_COMPLIANCE = process.env.OPENAI_MODEL_FOR_COMPLIANCE_ANALYSIS || "gpt-4.1-nano"; 
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

if (!openai) {
    console.warn("!!! SERVIZIO COMPLIANCE AI: OpenAI client non inizializzato. Le funzioni restituiranno messaggi di fallback. !!!");
}

/**
 * Funzione generica per chiamare OpenAI per analisi di conformità.
 * @param {string} systemPrompt - Il prompt di sistema per l'AI.
 * @param {string} userQueryConstruct - La parte specifica della query utente (principio normativo, contesto cliente, risposte checklist).
 * @param {string} kbContent - L'intero contenuto della Knowledge Base.
 * @param {string} instructionForAI - L'istruzione specifica su cosa l'AI deve generare (es. valutazione, commento).
 * @returns {Promise<string>} - Il testo della valutazione/commento generato dall'AI.
 */
async function getAIComplianceAssessment(systemPrompt, userQueryConstruct, kbContent, instructionForAI) {
    if (!openai) return "Servizio AI non disponibile (OpenAI client non inizializzato).";
    if (kbContent === "ERRORE_CARICAMENTO_KB_COMPLETA") return "Base di conoscenza non disponibile per l'analisi.";

    const userPrompt = `**INTERA BASE DI CONOSCENZA (Knowledge Base di Riferimento):**\n\`\`\`\n${kbContent}\n\`\`\`\n\n${userQueryConstruct}\n\n**VALUTAZIONE/COMMENTO RICHIESTO:**\n${instructionForAI}\nRestituisci solo il testo della valutazione/commento richiesto, senza preamboli o postille.`;

    try {
        console.log(`>>> complianceAnalyzerAI: Chiamata API ${MODEL_FOR_COMPLIANCE}...`);
        // console.log("Prompt User (parziale per complianceAI):\n", userPrompt.substring(userPrompt.indexOf("PROFILO CLIENTE") || 0, 1500)); // Logga solo una parte rilevante

        const completion = await openai.chat.completions.create({
            model: MODEL_FOR_COMPLIANCE,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.3, // Bassa per output più fattuale e meno "creativo"
            // max_tokens: 300, // Ad es. per una valutazione di 100-150 parole
        });

        const assessmentText = completion.choices[0]?.message?.content?.trim();
        if (!assessmentText || assessmentText.length < 10) { // Controllo base sulla lunghezza
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

/**
 * Analizza la conformità ai principi EBA.
 * @param {object} principioEBA - Oggetto con { id, titolo, testoRiferimentoKB }.
 * @param {Array} checklistAnswers - Risposte della checklist.
 * @param {object} clienteInfo - Informazioni sul cliente.
 * @returns {Promise<string>} Valutazione testuale.
 */
async function analyzeComplianceEBA(principioEBA, checklistAnswers, clienteInfo) {
    const kbContent = await getFullKnowledgeBase();
    const systemPromptEBA = "Sei un esperto di compliance bancaria e delle Linee Guida EBA sulla concessione e monitoraggio dei prestiti. Il tuo compito è valutare l'allineamento di un'azienda a uno specifico principio EBA, basandoti sulle informazioni fornite.";
    
    let userQueryConstruct = `**PRINCIPIO EBA DA VALUTARE:**\nTitolo: ${principioEBA.titolo}\nEstratto Linee Guida (dalla KB): ${principioEBA.testoRiferimentoKB}\n\n`;
    userQueryConstruct += `**PROFILO AZIENDA CLIENTE:**\nNome: ${clienteInfo.nome || 'N/D'}\nDimensione: ${clienteInfo.dimensioneStimata || 'N/D'}\nSettore: ${clienteInfo.settore || 'N/D'}\n\n`;
    userQueryConstruct += `**SINTESI RISPOSTE CHECKLIST RILEVANTI (selezionate dal sistema):**\n`;
    // Qui dovresti avere una logica per selezionare e formattare SOLO le risposte più pertinenti
    // Per ora, passiamo le prime 5 risposte relative alle aree B, C, E come esempio.
    const risposteDaConsiderare = checklistAnswers
        .filter(a => a.itemId?.startsWith('B.') || a.itemId?.startsWith('C.') || a.itemId?.startsWith('E.'))
        .slice(0, 5)
        .map(a => `- ${a.itemId} (${a.domandaText?.substring(0,50)}...): ${a.risposta || 'Non Risposto'}${a.note ? ' (Nota: ' + a.note.substring(0,30) + '...)' : ''}`)
        .join('\n');
    userQueryConstruct += risposteDaConsiderare || "Nessuna risposta specifica fornita per questo prompt.\n";

    const instructionForAI_EBA = `Fornisci una valutazione sintetica (massimo 100-120 parole) sull'allineamento dell'azienda a questo specifico principio EBA. Evidenzia eventuali punti di forza o debolezza osservati dalle risposte e dal profilo cliente, in relazione al principio EBA e al contesto generale della KB. Concludi con un giudizio qualitativo (es. Allineamento Buono, Aree di Miglioramento Necessarie, Forte Disallineamento).`;

    return getAIComplianceAssessment(systemPromptEBA, userQueryConstruct, kbContent, instructionForAI_EBA);
}

/**
 * Fornisce un commento sull'aderenza ai doveri ex art. 2086 c.c. (rif. SSM Doc 5).
 * @param {object} aspettoSSM - Oggetto con { id, titolo, testoRiferimentoKB }.
 * @param {object} checklistDoc - L'intero documento checklist.
 * @param {Array} gapsDocs - I gap rilevati.
 * @param {object} executiveSummaryAI - L'executive summary già generato dall'AI.
 * @returns {Promise<string>} Commento testuale.
 */
async function commentComplianceSSM(aspettoSSM, checklistDoc, gapsDocs, executiveSummaryAI) {
    const kbContent = await getFullKnowledgeBase();
    const systemPromptSSM = "Sei un giurista d'impresa esperto dell'art. 2086 c.c. e delle responsabilità degli amministratori in materia di adeguati assetti organizzativi, amministrativi e contabili, con riferimento al Quaderno 18 della Scuola Superiore della Magistratura.";
    
    let userQueryConstruct = `**ASPETTO DA COMMENTARE (ART. 2086 c.c. e SSM Doc. 5):**\nTitolo: ${aspettoSSM.titolo}\nContesto Normativo (dalla KB): ${aspettoSSM.testoRiferimentoKB}\n\n`;
    userQueryConstruct += `**PROFILO AZIENDA CLIENTE:**\nNome: ${checklistDoc.cliente.nome || 'N/D'}\nDimensione: ${checklistDoc.cliente.dimensioneStimata || 'N/D'}\n\n`;
    userQueryConstruct += `**SINTESI DIAGNOSI (Executive Summary AI):**\n${executiveSummaryAI || "Summary non disponibile."}\n\n`;
    userQueryConstruct += `**PRINCIPALI GAP CRITICI RILEVATI (se presenti):**\n`;
    const criticalGaps = gapsDocs.filter(g => g.livello_rischio === 'alto').slice(0,3);
    if (criticalGaps.length > 0) {
        criticalGaps.forEach(g => userQueryConstruct += `- ${g.item_id}: ${g.descrizione?.substring(0,100)}...\n`);
    } else {
        userQueryConstruct += "Nessun gap a rischio alto particolarmente critico evidenziato per questo prompt.\n";
    }

    const instructionForAI_SSM = `Fornisci un breve commento (massimo 100-120 parole) su come le informazioni della diagnosi (summary e gap) si pongono rispetto a QUESTO SPECIFICO aspetto del dovere degli amministratori ex art. 2086 c.c. come interpretato dal Quaderno SSM. Evidenzia se emergono potenziali carenze o punti di attenzione.`;

    return getAIComplianceAssessment(systemPromptSSM, userQueryConstruct, kbContent, instructionForAI_SSM);
}

/**
 * Fornisce un parere preliminare sulla predisposizione per i Visti CNDCEC.
 * @param {object} requisitoVisto - Oggetto con { id, titolo, testoRiferimentoKB }.
 * @param {object} checklistDoc - L'intero documento checklist.
 * @param {Array} gapsDocs - I gap rilevati.
 * @returns {Promise<string>} Parere testuale.
 */
async function analyzePredisposizioneVisti(requisitoVisto, checklistDoc, gapsDocs) {
    const kbContent = await getFullKnowledgeBase();
    const systemPromptVisti = "Sei un Dottore Commercialista esperto nelle Linee Guida CNDCEC sul rilascio del Visto di Conformità e del Visto di Congruità sull'informativa finanziaria aziendale.";

    let userQueryConstruct = `**REQUISITO PER VISTI CNDCEC DA VALUTARE:**\nTitolo: ${requisitoVisto.titolo}\nContesto Linee Guida CNDCEC (dalla KB): ${requisitoVisto.testoRiferimentoKB}\n\n`;
    userQueryConstruct += `**PROFILO AZIENDA CLIENTE:**\nNome: ${checklistDoc.cliente.nome || 'N/D'}\n\n`;
    userQueryConstruct += `**SINTESI RISULTATI CHECKLIST SU AREE CONTABILI E DI CONTROLLO (selezionate dal sistema):**\n`;
    const risposteContabili = checklistDoc.answers
        .filter(a => a.itemId?.startsWith('D.') || a.itemId === 'C.1.3') // Domande Contabili e Controllo Interno Procedure
        .slice(0, 7)
        .map(a => `- ${a.itemId} (${a.domandaText?.substring(0,50)}...): ${a.risposta || 'Non Risposto'}`)
        .join('\n');
    userQueryConstruct += risposteContabili || "Nessuna risposta contabile specifica fornita per questo prompt.\n";
    userQueryConstruct += `\n**GAP RILEVATI NELLE AREE CONTABILI/AMMINISTRATIVE (se presenti):**\n`;
    const relevantGaps = gapsDocs.filter(g => g.item_id?.startsWith('D.') || g.item_id?.startsWith('C.')).slice(0,3);
    if (relevantGaps.length > 0) {
        relevantGaps.forEach(g => userQueryConstruct += `- ${g.item_id}: ${g.descrizione?.substring(0,100)}... (Rischio: ${g.livello_rischio})\n`);
    } else {
        userQueryConstruct += "Nessun gap specifico in area contabile/amministrativa fornito per questo prompt.\n";
    }

    const instructionForAI_Visti = `Fornisci un parere preliminare (massimo 100-120 parole) sulla probabile predisposizione dell'azienda a soddisfare QUESTO SPECIFICO requisito per i Visti CNDCEC, basandoti sulle informazioni della checklist e sui gap. Evidenzia potenziali ostacoli o punti di forza.`;
    
    return getAIComplianceAssessment(systemPromptVisti, userQueryConstruct, kbContent, instructionForAI_Visti);
}


module.exports = {
    analyzeComplianceEBA,
    commentComplianceSSM,
    analyzePredisposizioneVisti
};