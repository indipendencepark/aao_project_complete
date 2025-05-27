const getRiskLevelFromMapping = (dimensioneCliente, riskMappingString = "") => {
  const mapping = riskMappingString.toUpperCase().split("/");
  if (mapping.length !== 4) return "basso";

  const [riskMicro, riskP, riskM, riskG] = mapping.map((r) => {
    if (r === "A") return "alto";
    if (r === "M") return "medio";
    if (r === "B") return "basso";
    return "basso";
  });

  switch (dimensioneCliente) {
    case "Micro":
      return riskMicro;

    case "Piccola":
      return riskP;

    case "Media":
      return riskM;

    case "Grande":
      return riskG;

    default:
      return "basso";
  }
};

const gapRules = [ 

{
  itemId: "B.1.1",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Assenza/incompletezza organigramma documentato.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/M/A/A"),

    implicazioni: "Confusione ruoli, inefficienze, difficoltà controllo, ambiguità responsabilità.",

    riferimenti_normativi: [ "FNC CL B.1", "BP Org. Aziendale" ]
  })
}, {
  itemId: "B.1.2",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Struttura organizzativa non comunicata/compresa.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/B/M/M"),
    implicazioni: "Difficoltà coordinamento, minore commitment.",
    riferimenti_normativi: [ "FNC CL B.3", "BP Comunicazione Interna" ]
  })
}, {
  itemId: "B.1.3",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "La struttura organizzativa attuale non appare adeguata a natura/dimensione.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "M/M/A/A"),
    implicazioni: "Inefficienze operative, costi elevati, lentezza decisionale, limiti crescita. (Richiede Giudizio Prof.)",
    riferimenti_normativi: [ "Art. 2086", "ISA 315", "FNC CL A.7" ]
  })
}, {
  itemId: "B.2.1",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Mancata/incompletezza identificazione formale ruoli chiave.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/B/M/M"),
    implicazioni: "Ambiguità responsabilità, difficoltà individuazione referenti.",
    riferimenti_normativi: [ "FNC CL B.4", "BP Org. Aziendale" ]
  })
}, {
  itemId: "B.2.2",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Assenza/incompletezza mansionari scritti.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/B/B/M"),
    implicazioni: "Scarsa chiarezza compiti, difficoltà valutazione performance.",
    riferimenti_normativi: [ "FNC CL B.4", "BP HR Management" ]
  })
}, {
  itemId: "B.2.3",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Inadeguata/Assente segregazione funzioni incompatibili.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "A/A/A/A"),

    implicazioni: "Alto rischio errori e frodi non rilevati, mancanza controllo reciproco.",
    riferimenti_normativi: [ "FNC CL B.6", "ISA 315 (CA)", "BP Controllo Interno (SoD)" ]
  })
}, {
  itemId: "B.3.1",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Assenza/incompletezza sistema deleghe/poteri formali.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/M/A/A"),
    implicazioni: "Rischio atti non autorizzati, incertezza poteri, accentramento eccessivo.",
    riferimenti_normativi: [ "FNC CL B.5", "BP Sistema Autorizzativo" ]
  })
}, {
  itemId: "B.3.2",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Incoerenza tra deleghe e struttura/responsabilità.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/B/M/M"),
    implicazioni: "Conflitti operativi, ambiguità decisionali.",
    riferimenti_normativi: [ "FNC CL B.5", "BP Coerenza Organizzativa" ]
  })
}, 

{
  itemId: "B.4.4",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Flussi informativi vs organo controllo inadeguati.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/M/A/A"),
    implicazioni: "Controllo inefficace, mancata rilevazione irregolarità, responsabilità organi controllo.",
    riferimenti_normativi: [ "Art. 2381", "Norme CS", "ISA 260/265" ]
  })
}, 

{
  itemId: "C.1.1",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Mancata/incompletezza mappatura processi chiave.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/B/M/M"),
    implicazioni: "Scarsa visibilità operativa, difficoltà ottimizzazione.",
    riferimenti_normativi: [ "FNC CL C.1", "BP Process Management" ]
  })
}, {
  itemId: "C.1.2",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Assenza/incompletezza procedure operative scritte.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/B/M/A"),
    implicazioni: "Disomogeneità, rischio errori, difficoltà formazione, dipendenza da persone.",
    riferimenti_normativi: [ "FNC CL C.1", "BP" ]
  })
}, {
  itemId: "C.1.3",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Assenza/carenza punti di controllo interno.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "A/A/A/A"),

    implicazioni: "Alto rischio errori/frodi, mancanza verifiche, inefficacia operativa.",
    riferimenti_normativi: [ "FNC CL C.2", "ISA 315 (CA)", "BP Controllo Interno" ]
  })
}, 

{
  itemId: "C.2.1",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Sistema informativo gestionale inadeguato/obsoleto.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/M/A/A"),
    implicazioni: "Inefficienza processi, dati inaffidabili, difficoltà reporting, limiti crescita.",
    riferimenti_normativi: [ "FNC CL C.6", "ISA 315 (IC)", "BP" ]
  })
}, {
  itemId: "C.2.2",

  triggerAnswers: [ "No", "Parziale" ],

  getGapDetails: (answer, cliente) => ({

    descrizione: "Carenze nella sicurezza informatica (backup, accessi, policy).",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "A/A/A/A"),

    implicazioni: "Rischio perdita dati, accessi non autorizzati, violazione privacy, interruzione operatività.",
    riferimenti_normativi: [ "FNC CL C.7", "ISA 315 (IC)", "GDPR", "BP Sicurezza IT", "BP Business Continuity" ]
  })
}, 

{
  itemId: "C.3.1",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Assenza/incompletezza budget economico annuale.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/M/A/A"),
    implicazioni: "Mancanza obiettivi chiari, difficoltà controllo costi/ricavi, gestione reattiva.",
    riferimenti_normativi: [ "FNC CL D.1", "BP Budgeting" ]
  })
}, {
  itemId: "C.3.3",

  triggerAnswers: [ "No", "Parziale" ],

  getGapDetails: (answer, cliente) => ({
    descrizione: "Assenza/Irregolarità budget tesoreria previsionale.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "A/A/A/A"),

    implicazioni: "Alto rischio crisi liquidità, incapacità previsione fabbisogni finanziari, difficoltà accesso credito.",
    riferimenti_normativi: [ "FNC CL D.3", "Art. 2086", "CCII Art.3", "BP Cash Management" ]
  })
}, {
  itemId: "C.3.4",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Mancata/Sporadica analisi scostamenti.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/B/M/M"),
    implicazioni: "Scarsa consapevolezza performance, incapacità azioni correttive tempestive.",
    riferimenti_normativi: [ "FNC CL D.4", "BP Controllo di Gestione" ]
  })
}, 

{
  itemId: "C.3.6",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Assenza/Carenza monitoraggio KPI specifici (non solo fin.).",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "M/M/A/A"),
    implicazioni: "Visione incompleta performance, difficoltà identificazione cause problemi/successi.",
    riferimenti_normativi: [ "FNC CL A.7", "D.5", "Art. 2086", "BP Performance Measurement" ]
  })
}, 

{
  itemId: "D.1.1",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Registrazioni contabili non tempestive.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "A/A/A/A"),

    implicazioni: "Dati consuntivi inaffidabili/tardivi, impossibilità monitoraggio efficace.",
    riferimenti_normativi: [ "FNC CL C.3", "CC Artt. 2214, 2219", "BP" ]
  })
}, {
  itemId: "D.1.2",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Mancanza/Irregolarità riconciliazioni contabili.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "A/A/A/A"),

    implicazioni: "Rischio errori/omissioni non rilevati, inaffidabilità saldi contabili.",
    riferimenti_normativi: [ "FNC CL C.4", "BP Controllo Interno Contabile" ]
  })
}, {
  itemId: "D.1.3",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Mancata/Incompleta produzione situazioni contabili infra.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/B/M/M"),
    implicazioni: "Difficoltà monitoraggio performance infra-annuale.",
    riferimenti_normativi: [ "FNC CL C.5", "BP Reporting Interno" ]
  })
}, {
  itemId: "D.1.4",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Assenza/Carenza contabilità analitica.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/B/M/A"),
    implicazioni: "Incapacità valutazione redditività dettaglio, decisioni pricing/mix non informate.",
    riferimenti_normativi: [ "FNC CL D.7", "BP Controllo di Gestione Avanzato" ]
  })
}, {
  itemId: "D.1.5",

  triggerAnswers: [ "No", "Parziale" ],

  getGapDetails: (answer, cliente) => ({
    descrizione: "Gestione contabile magazzino scorretta/intempestiva.",

    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "M/A/A/A"),

    implicazioni: "Valore magazzino inattendibile, impatto su risultato economico.",
    riferimenti_normativi: [ "FNC CL D.11", "PC OIC 13", "CC Art. 2426 n.9" ]
  })
}, 

{
  itemId: "E.1",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Sistema informativo non idoneo a rilevare squilibri.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "A/A/A/A"),

    implicazioni: "Mancata/Tardiva rilevazione crisi, impossibilità intervento precoce.",
    riferimenti_normativi: [ "Art. 2086 c.2", "CCII Art.3", "FNC CL A.7", "ISA 570" ]
  })
}, {
  itemId: "E.2",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Mancato/Parziale monitoraggio Indici Crisi.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "A/A/A/A"),

    implicazioni: "Rischio mancato rispetto obblighi CCII, mancata attivazione allerta.",
    riferimenti_normativi: [ "CCII Art. 3", "Art. 13", "Documenti CNDCEC", "FNC CL D.6", "ISA 570" ]
  })
}, {
  itemId: "E.3",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Assenza/Informalità procedura gestione allerta.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "B/M/A/A"),
    implicazioni: "Reazione tardiva/disordinata a segnali crisi.",
    riferimenti_normativi: [ "Art. 2086 c.2", "CCII Art.3", "BP Crisis Management" ]
  })
}, {
  itemId: "E.4",

  triggerAnswers: [ "No", "Parziale" ],

  getGapDetails: (answer, cliente) => ({
    descrizione: "Scarsa formalizzazione/periodicità valutazione Going Concern.",

    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "A/A/A/A"),

    implicazioni: "Sottovalutazione rischi, mancate decisioni, responsabilità amministratori/sindaci.",
    riferimenti_normativi: [ "Art. 2086 c.2", "ISA 570", "OIC 11" ]
  })
}, {
  itemId: "E.5",

  triggerAnswers: [ "No", "Parziale" ],
  getGapDetails: (answer, cliente) => ({
    descrizione: "Assenza/Inadeguatezza piani/budget attendibili per valutazione GC.",
    livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, "A/A/A/A"),

    implicazioni: "Valutazione GC non fondata, difficoltà accesso credito, non conformità ISA 570.",
    riferimenti_normativi: [ "Art. 2086 c.2", "ISA 570", "OIC 11", "ODCEC BP Guide" ]
  })
} ];

module.exports = gapRules;
