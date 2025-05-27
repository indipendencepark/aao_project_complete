
const mongoose = require("mongoose");

const dotenv = require("dotenv");

const {OpenAI: OpenAI} = require("openai");

const fs = require("fs").promises;

const path = require("path");

const {getFullKnowledgeBase: getFullKnowledgeBase} = require("../utils/kbLoader");

const {Intervento: Intervento} = require("../models/progettazione");

const {actionPlanRules: actionPlanRules} = require("../knowledge/actionPlanRules");

const gapRules = require("../knowledge/gapRules");

dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;

const modelToUse = "gpt-4.1-nano-2025-04-14";

const openai = openaiApiKey ? new OpenAI({
  apiKey: openaiApiKey
}) : null;

 const getAreaLabel = areaCode => {
  const areaMap = {
    Org: "Assetto Organizzativo",
    Admin: "Assetto Amministrativo",
    Acct: "Assetto Contabile",
    Crisi: "Rilevazione Crisi",
    IT: "IT",
    Altro: "Altro"
  };

    return areaMap[areaCode] || areaCode || "N/D";
};

 const getPriorityLabel = priority => {
  if (!priority) return "N/D";

    const lowerPriority = priority.toLowerCase();
  return lowerPriority.charAt(0).toUpperCase() + lowerPriority.slice(1);
};

 const generateDocumentDraft = async (interventoId, tipoDocumento, parametriUtente = {}) => {
  console.log(`>>> Servizio documentGeneratorAI (FULL KB): Avvio generazione bozza ${tipoDocumento} per intervento ${interventoId}`);
  if (!openai) throw new Error("OpenAI client non inizializzato.");
  if (!interventoId || !tipoDocumento) throw new Error("ID intervento e tipo documento sono obbligatori.");

    const kbContent = await getFullKnowledgeBase();

    if (kbContent === "ERRORE_CARICAMENTO_KB_COMPLETA") {
    console.error("!!! ERRORE CRITICO: Impossibile caricare la Knowledge Base completa.");
    throw new Error("Base di conoscenza completa non disponibile per la generazione.");
  }

    console.log(`>>> Recupero intervento ${interventoId}...`);
  const intervento = await Intervento.findById(interventoId).populate({
    path: "gap_correlati",
    select: "item_id domandaText descrizione implicazioni livello_rischio"
  }).populate({
    path: "checklist_id_origine",
    select: "cliente"
  }).lean();
  if (!intervento) throw new Error(`Intervento con ID ${interventoId} non trovato.`);
  console.log(">>> Intervento recuperato.");
  const clienteInfo = intervento.checklist_id_origine?.cliente || {};
  const gaps = intervento.gap_correlati || [];
  const obiettiviCliente = clienteInfo.obiettiviStrategici || "Non specificati";

    const criticitaCliente = clienteInfo.criticitaPercepite || "Non specificate";

    let obiettivoIntervento = "Formalizzare l'azione correttiva descritta.";

    let kpiMonitoraggioIntervento = [];

    const primaryGapId = gaps.length > 0 ? gaps[0].item_id : null;
  if (primaryGapId) {
    const actionRule = actionPlanRules.find((r => r.gapId === primaryGapId));
    if (actionRule) {
      obiettivoIntervento = actionRule.obiettivo_intervento || obiettivoIntervento;
      kpiMonitoraggioIntervento = actionRule.kpi_monitoraggio_suggeriti || [];
    }
  }
  console.log(`--- Info Intervento: Obiettivo='${obiettivoIntervento}', KPI Suggeriti=[${kpiMonitoraggioIntervento.join(", ")}]`);

    const riferimentiAggregati = new Set;

    gaps.forEach((gap => {

    if (gap.riferimenti_normativi && Array.isArray(gap.riferimenti_normativi)) {
      gap.riferimenti_normativi.forEach((ref => riferimentiAggregati.add(ref)));
    } else {

      const rule = gapRules.find((r => r.itemId === gap.item_id));
      if (rule && typeof rule.getGapDetails === "function") {
        try {
          const detailsFromRule = rule.getGapDetails({}, clienteInfo);

                    if (detailsFromRule?.riferimenti_normativi) {
            detailsFromRule.riferimenti_normativi.forEach((ref => riferimentiAggregati.add(ref)));
          }
        } catch (e) {}
      }
    }
  }));
  const riferimentiUnici = Array.from(riferimentiAggregati);
  console.log(`--- Riferimenti Normativi Aggregati: [${riferimentiUnici.join(", ")}]`);

    let systemPrompt = `Sei un consulente senior esperto di organizzazione aziendale, compliance e gestione dei processi. Il tuo compito è generare una bozza di documento aziendale (es. procedura, mansionario, policy) che sia completa, accurata, operativamente utile e formalmente corretta. Rispondi SOLO con il documento richiesto in formato Markdown. Assicurati che il contenuto sia **coerente con i riferimenti normativi** forniti e contribuisca all'**obiettivo specifico dell'intervento**, basandoti sull'INTERA Knowledge Base fornita.`;

    let userPrompt = `**INTERA BASE DI CONOSCENZA (Knowledge Base):**\n"""\n${kbContent}\n"""\n\n`;

    userPrompt += `SEZIONE 1: CONTESTO SPECIFICO CLIENTE E INTERVENTO\n`;

    userPrompt += `--------------------------------------------------\n\n`;
  userPrompt += `**Cliente:**\n`;
  userPrompt += `* Nome: ${clienteInfo.nome || "N/D"}\n`;
  userPrompt += `* Dimensione Stimata: ${clienteInfo.dimensioneStimata || "Non specificata"}\n`;
  userPrompt += `* Complessità: ${clienteInfo.complessita || "Non specificata"}\n`;
  userPrompt += `* Settore: ${clienteInfo.settore || "Non specificato"}\n`;
  userPrompt += `* Forma Giuridica: ${clienteInfo.formaGiuridica || "Non specificata"}\n\n`;
  userPrompt += `* Obiettivi Strategici Cliente: ${obiettiviCliente}\n`;
  userPrompt += `* Criticità Percepite Cliente: ${criticitaCliente}\n\n`;
  userPrompt += `**Intervento da Formalizzare:**\n`;
  userPrompt += `* Titolo Intervento: ${intervento.titolo}\n`;
  userPrompt += `* Obiettivo Specifico Intervento: ${obiettivoIntervento}\n`;

    userPrompt += `* Descrizione Intervento: ${intervento.descrizione || "N/D"}\n\n`;
  if (gaps.length > 0) {
    userPrompt += `**Gap Correlati Rilevanti:**\n`;
    gaps.forEach(((gap, index) => {
      userPrompt += `${index + 1}. **Gap ${gap.item_id} (Rischio: ${gap.livello_rischio || "N/D"})**\n`;

            userPrompt += `   * Descrizione Problema: ${gap.descrizione || "N/D"}\n`;
      userPrompt += `   * Implicazioni Note: ${gap.implicazioni || "N/D"}\n`;
    }));
    userPrompt += "\n";
  }

    if (riferimentiUnici.length > 0) {
    userPrompt += `**Riferimenti Normativi/Best Practice Pertinenti all'Intervento (da rispettare scrupolosamente):**\n`;
    riferimentiUnici.forEach((ref => userPrompt += `* ${ref}\n`));
    userPrompt += "\n";
  }
  if (kpiMonitoraggioIntervento.length > 0) {
    userPrompt += `**KPI Suggeriti per Monitorare l'Efficacia di QUESTO Intervento:**\n`;
    kpiMonitoraggioIntervento.forEach((kpi => userPrompt += `* ${kpi}\n`));
    userPrompt += "\n";
  }

    if (Object.keys(parametriUtente).length > 0) {
    userPrompt += `**Parametri Specifici Forniti:**\n`;
    if (parametriUtente.titoloProcedura) userPrompt += `* Titolo Specifico Richiesto: "${parametriUtente.titoloProcedura}"\n`;
    if (parametriUtente.ruolo) userPrompt += `* Ruolo Specifico Richiesto: "${parametriUtente.ruolo}"\n`;

        userPrompt += "\n";
  }

    userPrompt += `--------------------------------------------------\n`;
  userPrompt += `SEZIONE 2: RICHIESTA SPECIFICA\n`;

    userPrompt += `--------------------------------------------------\n\n`;
  userPrompt += `Genera una bozza completa, dettagliata e operativamente utile per il documento di tipo **"${tipoDocumento}"** relativo all'intervento sopra descritto.\n`;
  userPrompt += `La bozza deve essere in formato Markdown e seguire una struttura logica appropriata.\n`;
  userPrompt += `**IMPORTANTE:** Assicurati che il contenuto generato sia **strettamente coerente con i Riferimenti Normativi/Best Practice forniti**, contribuisca a raggiungere l'**Obiettivo Specifico dell'Intervento** e, ove pertinente (es. procedure), faccia riferimento ai **KPI di Monitoraggio suggeriti**, basandoti sull'**INTERA Knowledge Base** fornita all'inizio di questo prompt.\n\n`;

    switch (tipoDocumento.toLowerCase()) {
   case "procedura":
    userPrompt += `**Istruzioni Specifiche per la PROCEDURA:**\n`;
    userPrompt += `- Includi tutte le sezioni standard (Scopo, Ambito, Riferimenti, Definizioni, Responsabilità, Descrizione Fasi Dettagliate, Punti di Controllo, KPI, Modulistica, Eccezioni, Archiviazione, Revisioni).\n`;
    userPrompt += `- Nella sezione **Descrizione Fasi**, dettaglia almeno 5-7 fasi principali con minimo 3-5 azioni specifiche per fase. Sii operativo e chiaro.\n`;
    userPrompt += `- Nella sezione **Punti di Controllo**, elenca almeno 3-5 controlli chiave specifici per mitigare i rischi dei Gap Correlati. Specifica CHI, COME, QUANDO e il **rischio mitigato** (facendo riferimento ai Riferimenti Normativi e all'INTERA Knowledge Base se applicabile).\n`;
    userPrompt += `- Nella sezione **KPI**, includi i **KPI di Monitoraggio Intervento suggeriti** sopra e descrivi brevemente come verranno misurati.\n`;
    if (parametriUtente.titoloProcedura) {
      userPrompt += `- Usa come titolo esatto della procedura: "${parametriUtente.titoloProcedura}".\n`;
    }
    break;

   case "mansionario":
    userPrompt += `**Istruzioni Specifiche per il MANSIONARIO:**\n`;
    if (parametriUtente.ruolo) {
      userPrompt += `- Il mansionario è per il ruolo specifico di: **"${parametriUtente.ruolo}"**. Focalizza la descrizione su questo ruolo.\n`;
    } else {
      userPrompt += `- Il mansionario è per il ruolo implicato dall'intervento. Identificalo chiaramente basandoti sul contesto e sull'INTERA Knowledge Base.\n`;
    }
    userPrompt += `- Includi **tutte** le sezioni standard: Posizione Organizzativa, Collocazione (Riporta a / Coordina), Finalità/Scopo della Posizione, Responsabilità Principali, Attività/Compiti Specifici, Relazioni Interne/Esterne, Competenze/Requisiti.\n`;
    userPrompt += `- Nella sezione **Responsabilità Principali**, elenca **almeno 5-7 aree di responsabilità chiave** per il ruolo, derivate dalla sua funzione e dall'intervento/gap correlati, utilizzando l'INTERA Knowledge Base per approfondire.\n`;
    userPrompt += `- Nella sezione **Attività/Compiti Specifici**, dettaglia con un elenco puntato **numerose azioni concrete (minimo 8-10)** che il ruolo svolge regolarmente per adempiere alle sue responsabilità. Sii specifico e operativo, traendo spunto dall'INTERA Knowledge Base.\n`;
    userPrompt += `- Nella sezione **Competenze/Requisiti**, elenca sia hard skills (conoscenze tecniche, software) sia soft skills (capacità relazionali, problem solving) necessarie, pertinenti al ruolo e al contesto aziendale, informate dall'INTERA Knowledge Base.\n`;
    userPrompt += `- Assicurati che le responsabilità e i compiti siano **coerenti con l'intervento** che questo mansionario contribuisce a formalizzare e con i **gap che mira a risolvere**.\n`;
    userPrompt += `- Assicurati che le **Responsabilità e i Compiti riflettano l'Obiettivo Specifico dell'Intervento** e le azioni necessarie per colmare i Gap Correlati, coerentemente con i Riferimenti Normativi e l'INTERA Knowledge Base.\n`;
    break;

   case "organigramma":

    userPrompt += `**Istruzioni Specifiche per la DESCRIZIONE ORGANIGRAMMA:**\n`;
    userPrompt += `- Descrivi in modo **testuale, chiaro, strutturato e completo** la struttura organizzativa risultante o formalizzata dall'intervento, basandoti sull'INTERA Knowledge Base per best practice e modelli.\n`;
    userPrompt += `- Definisci il vertice e le **principali Aree/Funzioni/Direzioni**, spiegandone lo **scopo** in coerenza con l'**Obiettivo Specifico dell'Intervento**.\n`;
    userPrompt += `- Dettaglia le **Unità Organizzative/Ruoli chiave** interni a ciascuna area e le **linee di riporto gerarchico e funzionale** in modo inequivocabile.\n`;
    userPrompt += `- Assicurati che la struttura descritta sia **coerente con i Riferimenti Normativi/Best Practice** sulla governance e la segregazione dei compiti (se pertinenti all'intervento e presenti nell'INTERA Knowledge Base).\n`;
    userPrompt += `- Se rilevante, indica come la nuova struttura contribuisce al monitoraggio dei **KPI suggeriti** per l'intervento.\n`;
    userPrompt += `- La descrizione deve risolvere le ambiguità evidenziate nei **Gap Correlati** (es. B.1.1, B.1.2).\n`;
    break;

   case "delega":
    userPrompt += `**Istruzioni Specifiche per la BOZZA DELEGA:**\n`;
    userPrompt += `- Genera il testo completo di una **lettera/atto di delega formale**, pronta per essere firmata, utilizzando esempi e clausole standard dall'INTERA Knowledge Base.\n`;
    userPrompt += `- Includi **tutte le sezioni standard**: Intestazione, Oggetto, Premesse, Delegante, Delegato.\n`;
    userPrompt += `- Nell'"Art. 1 - Oggetto della Delega", dettaglia i **poteri specifici** in modo **preciso, inequivocabile ed esaustivo**, assicurandoti che siano strettamente necessari e sufficienti per raggiungere l'**Obiettivo Specifico dell'Intervento**.\n`;
    userPrompt += `- Nell'"Art. 2 - Limiti della Delega", definisci **limiti quantitativi e qualitativi chiari**, coerenti con le **policy aziendali** (desumibili dall'INTERA Knowledge Base o contesto) e i **Riferimenti Normativi** sulla responsabilità.\n`;
    userPrompt += `- Nell'"Art. 4 - Obblighi del Delegato", includi l'obbligo di **rispettare le procedure aziendali** pertinenti (identificate nell'INTERA Knowledge Base, se possibile) e di **riportare sul monitoraggio dei KPI suggeriti** se applicabile alla delega.\n`;
    userPrompt += `- Includi tutte le clausole standard (Durata, Validità, Revoca, Legge, Foro) e lo spazio per le firme.\n`;
    userPrompt += `- Il contenuto deve risolvere le criticità evidenziate nei **Gap Correlati** (es. B.3.1, B.3.2).\n`;
    break;

   default:

    userPrompt += `**Istruzioni Specifiche per Documento Generico:**\n`;
    userPrompt += `- Struttura il documento in modo logico (es. Introduzione/Contesto, Azioni/Decisioni Formalizzate, Responsabilità, Modalità Operative/Controlli, Monitoraggio/KPI, Approvazione) per formalizzare l'intervento richiesto.\n`;
    userPrompt += `- Dettaglia le azioni/decisioni/policy in modo **concreto e operativo**, assicurandoti che raggiungano l'**Obiettivo Specifico dell'Intervento**, traendo ispirazione dall'INTERA Knowledge Base per dettagli.\n`;
    userPrompt += `- Assicurati che il contenuto sia **coerente con i Riferimenti Normativi/Best Practice** identificati e con l'INTERA Knowledge Base fornita.\n`;
    userPrompt += `- Fai riferimenti espliciti ai **Gap Correlati** che l'intervento intende risolvere.\n`;
    userPrompt += `- Includi una sezione chiara su come verrà **monitorata l'efficacia** dell'intervento, facendo riferimento ai **KPI di Monitoraggio Intervento suggeriti**.\n`;
  }
  userPrompt += `\n**Output Richiesto:** Fornisci ESCLUSIVAMENTE il documento Markdown completo, senza alcuna frase introduttiva, commento, scusa o testo aggiuntivo prima o dopo il Markdown stesso. Il documento deve essere PRONTO per una revisione finale e personalizzazione minima.`;

    console.log(`>>> Chiamata API Modello: ${modelToUse} per ${tipoDocumento}...`);

    console.log(`>>> Prompt Utente (inizio): ${userPrompt.substring(0, 500)}... (Full KB Omissa dai Log)`);
  try {
    const completion = await openai.chat.completions.create({
      model: modelToUse,

      messages: [ 

      {
        role: "system",
        content: systemPrompt
      }, {
        role: "user",
        content: userPrompt
      } ],
      temperature: .4,

      max_tokens: 3e4
    });
    console.log(">>> Risposta AI ricevuta.");

        const draftContent = completion.choices[0]?.message?.content;
    if (!draftContent || draftContent.trim().length < 50) {

      console.error("!!! Risposta AI vuota o troppo corta:", draftContent);
      throw new Error("Risposta vuota o insufficiente dall'API OpenAI.");
    }
    console.log(`>>> Bozza documento (${tipoDocumento}) generata con successo da AI Esperta (FULL KB).`);

        return draftContent.trim();
  } catch (error) {
    console.error(`!!! ERRORE durante chiamata API ${modelToUse} per ${tipoDocumento}:`, error);

        if (error.response) {
      console.error(">>> Dettagli Errore API Response:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(">>> Errore non legato alla risposta API:", error.message, error.stack);
    }

        let specificErrorMsg = error.message;
    if (error.code === "context_length_exceeded") {
      specificErrorMsg = "Il contesto fornito (Base di Conoscenza + Prompt) supera i limiti del modello AI.";
    } else if (error.response?.data?.error?.message) {
      specificErrorMsg = `Errore API OpenAI: ${error.response.data.error.message}`;
    }
    throw new Error(`Generazione bozza fallita: ${specificErrorMsg}`);
  }
};

 const analyzeContextForAssetStructure = async (tipoDocumento, // es. "procedura", "mansionario"
areaTematica, // es. "Sistema di deleghe" (se non si parte da un intervento specifico)
interventoId, // opzionale
parametriUtente = {}) => {
  console.log(`>>> Servizio documentGeneratorAI (FULL KB): Avvio analisi contesto per struttura documento tipo: ${tipoDocumento}, area: ${areaTematica}, intervento: ${interventoId}`);
  if (!openai) throw new Error("OpenAI client non inizializzato.");
  const kbContent = await getFullKnowledgeBase();

    if (kbContent === "ERRORE_CARICAMENTO_KB_COMPLETA") {
    console.error("!!! ERRORE CRITICO: Impossibile caricare la Knowledge Base completa per analisi struttura.");
    throw new Error("Base di conoscenza completa non disponibile per analisi struttura.");
  }
  let intervento = null;
  let clienteInfo = {};
  let gapsCorrelati = [];

    let titoloInterventoPerQuery = areaTematica || `Documento di tipo ${tipoDocumento}`;
  if (interventoId) {
    intervento = await Intervento.findById(interventoId).populate({
      path: "gap_correlati",
      select: "item_id descrizione"
    }).populate({
      path: "checklist_id_origine",
      select: "cliente"
    }).lean();
    if (!intervento) console.warn(`Intervento ${interventoId} non trovato, procedo con contesto limitato.`); else {
      clienteInfo = intervento.checklist_id_origine?.cliente || {};
      gapsCorrelati = intervento.gap_correlati || [];
      titoloInterventoPerQuery = intervento.titolo || titoloInterventoPerQuery;
    }
  }

    const systemPrompt = `Sei un esperto di documentazione aziendale e compliance. Il tuo compito è suggerire una struttura logica e completa per un documento d'assetto, basandoti sull'INTERA Knowledge Base fornita.`;
  let userPrompt = `Data la richiesta di creare un documento di tipo "${tipoDocumento}" per l'argomento/intervento "${titoloInterventoPerQuery}" (contesto cliente: settore ${clienteInfo.settore || "N/D"}), e basandoti sull'INTERA SEGUENTE Knowledge Base:\n\n"""\n${kbContent}\n"""\n\n`;
  userPrompt += `Quali sarebbero le SEZIONI PRINCIPALI E SOTTOSEZIONI CHIAVE (massimo 7-10 sezioni principali) per strutturare tale documento in modo efficace e completo? Per ogni sezione principale, elenca brevemente 2-3 punti chiave o sotto-sezioni che dovrebbe contenere.\n\n`;

    userPrompt += `Restituisci ESCLUSIVAMENTE un oggetto JSON con la seguente struttura:\n{\n  "tipo_documento_analizzato": "${tipoDocumento}",\n  "argomento_principale": "${titoloInterventoPerQuery}",\n  "proposta_struttura": [\n    { "sezione_principale": "Nome Sezione 1", "punti_chiave_o_sottosezioni": ["Punto 1.1", "Punto 1.2"] },\n    { "sezione_principale": "Nome Sezione 2", "punti_chiave_o_sottosezioni": ["Punto 2.1", "Punto 2.2", "Punto 2.3"] }\n    // ... altre sezioni ...\n  ],\n  "suggerimento_sezione_kb_rilevante": "Indica brevemente la sezione/argomento principale della Knowledge Base che hai trovato PIU' utile per definire questa struttura. Se non applicabile, rispondi 'Nessuna sezione specifica utilizzata'."\n}\n`;

    console.log(`>>> Chiamata API ${modelToUse} per analisi struttura documento (FULL KB)...`);
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
      temperature: .2,

      response_format: {
        type: "json_object"
      }
    });
    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) throw new Error("Risposta AI vuota per analisi struttura.");
    const analysisResult = JSON.parse(responseContent);
    console.log(`--- Analisi struttura (FULL KB) ricevuta da AI per ${tipoDocumento}.`);
    console.log(`    Sezione KB per struttura citata da AI: ${analysisResult.suggerimento_sezione_kb_rilevante || "Nessuna"}`);

        return {
      propostaStruttura: analysisResult.proposta_struttura || [],

      suggerimentoKbPerStruttura: analysisResult.suggerimento_sezione_kb_rilevante
    };
  } catch (error) {
    console.error(`!!! ERRORE Chiamata OpenAI per analisi struttura (FULL KB):`, error.message);
    if (error.response) {
      console.error(">>> Dettagli Errore API Response:", JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

module.exports = {
  generateDocumentDraft: generateDocumentDraft,
  analyzeContextForAssetStructure: analyzeContextForAssetStructure
};
