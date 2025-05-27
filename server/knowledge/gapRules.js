/**
 * Knowledge Base (KB) per la Generazione Automatica dei Gap.
 * Mappa le condizioni (itemId, risposta, profiloCliente) a definizioni di Gap.
 * Basata sulla KB dettagliata fornita nel documento di progetto.
 *
 * NOTE:
 * - La funzione getRiskLevel ora mappa direttamente A/M/B dal documento.
 * - Le descrizioni/implicazioni sono prese il più possibile dal documento.
 * - Il professionista DEVE rivedere e calibrare queste regole.
 */

// Funzione helper per determinare il Rischio (A/M/B) in base alla mappatura fornita
// Esempio mapping: 'B/M/A/A' -> Rischio per Micro/Piccola/Media/Grande
const getRiskLevelFromMapping = (dimensioneCliente, riskMappingString = '') => {
    const mapping = riskMappingString.toUpperCase().split('/');
    if (mapping.length !== 4) return 'basso'; // Default se mapping non valido

    const [riskMicro, riskP, riskM, riskG] = mapping.map(r => {
        if (r === 'A') return 'alto';
        if (r === 'M') return 'medio';
        if (r === 'B') return 'basso';
        return 'basso'; // Default per valori non riconosciuti
    });

    switch (dimensioneCliente) {
        case 'Micro': return riskMicro;
        case 'Piccola': return riskP;
        case 'Media': return riskM;
        case 'Grande': return riskG;
        default: return 'basso'; // Default per dimensioni non riconosciute
    }
};

// Array delle regole per i Gap (Riveduto secondo KB Documento e con Riferimenti)
const gapRules = [
    // --- B. ASSETTO ORGANIZZATIVO ---\
    {
        itemId: "B.1.1", // Organigramma documentato
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Assenza/incompletezza organigramma documentato.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/M/A/A'), // Usa dimensioneStimata
            implicazioni: "Confusione ruoli, inefficienze, difficoltà controllo, ambiguità responsabilità.",
            // --- NUOVO CAMPO ---
            riferimenti_normativi: ["FNC CL B.1", "BP Org. Aziendale"]
            // --- FINE NUOVO CAMPO ---
        })
    },
    {
        itemId: "B.1.2", // Organigramma comunicato
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Struttura organizzativa non comunicata/compresa.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/B/M/M'),
            implicazioni: "Difficoltà coordinamento, minore commitment.",
            riferimenti_normativi: ["FNC CL B.3", "BP Comunicazione Interna"] // Aggiunto
        })
    },
    {
        itemId: "B.1.3", // Adeguatezza Struttura
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "La struttura organizzativa attuale non appare adeguata a natura/dimensione.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'M/M/A/A'),
            implicazioni: "Inefficienze operative, costi elevati, lentezza decisionale, limiti crescita. (Richiede Giudizio Prof.)",
            riferimenti_normativi: ["Art. 2086", "ISA 315", "FNC CL A.7"] // Aggiunto
        })
    },
    {
        itemId: "B.2.1", // Identificazione Ruoli Chiave
        triggerAnswers: ["No", "Parziale"],
         getGapDetails: (answer, cliente) => ({
            descrizione: "Mancata/incompleta identificazione formale ruoli chiave.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/B/M/M'),
            implicazioni: "Ambiguità responsabilità, difficoltà individuazione referenti.",
            riferimenti_normativi: ["FNC CL B.4", "BP Org. Aziendale"] // Aggiunto
        })
    },
     {
        itemId: "B.2.2", // Mansionari Scritti
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Assenza/incompletezza mansionari scritti.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/B/B/M'),
            implicazioni: "Scarsa chiarezza compiti, difficoltà valutazione performance.",
            riferimenti_normativi: ["FNC CL B.4", "BP HR Management"] // Aggiunto
        })
    },
    {
        itemId: "B.2.3", // Segregazione Compiti
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Inadeguata/Assente segregazione funzioni incompatibili.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'A/A/A/A'), // Alto rischio sempre
            implicazioni: "Alto rischio errori e frodi non rilevati, mancanza controllo reciproco.",
            riferimenti_normativi: ["FNC CL B.6", "ISA 315 (CA)", "BP Controllo Interno (SoD)"] // Aggiunto
        })
    },
     {
        itemId: "B.3.1", // Sistema Deleghe Documentato
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Assenza/incompletezza sistema deleghe/poteri formali.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/M/A/A'),
            implicazioni: "Rischio atti non autorizzati, incertezza poteri, accentramento eccessivo.",
            riferimenti_normativi: ["FNC CL B.5", "BP Sistema Autorizzativo"] // Aggiunto
        })
    },
     {
        itemId: "B.3.2", // Coerenza Deleghe/Organigramma
        triggerAnswers: ["No", "Parziale"],
         getGapDetails: (answer, cliente) => ({
            descrizione: "Incoerenza tra deleghe e struttura/responsabilità.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/B/M/M'),
            implicazioni: "Conflitti operativi, ambiguità decisionali.",
            riferimenti_normativi: ["FNC CL B.5", "BP Coerenza Organizzativa"] // Aggiunto
        })
    },
    // B.4.1, B.4.2, B.4.3 non generano gap diretti qui se risposta è negativa, ma sono input per B.4.4
    {
        itemId: "B.4.4", // Flusso Informativo Organo Controllo
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Flussi informativi vs organo controllo inadeguati.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/M/A/A'),
            implicazioni: "Controllo inefficace, mancata rilevazione irregolarità, responsabilità organi controllo.",
            riferimenti_normativi: ["Art. 2381", "Norme CS", "ISA 260/265"] // Aggiunto/Corretto
        })
    },
    // B.4.5 e B.4.6 sono più requisiti di governance avanzata, non generano gap "operativi" diretti qui

    // --- AREA C: AMMINISTRATIVO ---\
     {
        itemId: "C.1.1", // Mappatura Processi Chiave
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Mancata/incompleta mappatura processi chiave.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/B/M/M'),
            implicazioni: "Scarsa visibilità operativa, difficoltà ottimizzazione.",
            riferimenti_normativi: ["FNC CL C.1", "BP Process Management"] // Aggiunto
        })
    },
     {
        itemId: "C.1.2", // Procedure Operative Scritte
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Assenza/incompletezza procedure operative scritte.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/B/M/A'),
            implicazioni: "Disomogeneità, rischio errori, difficoltà formazione, dipendenza da persone.",
            riferimenti_normativi: ["FNC CL C.1", "BP"] // Aggiunto
        })
    },
     {
        itemId: "C.1.3", // Controlli Interni nelle Procedure
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Assenza/carenza punti di controllo interno.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'A/A/A/A'), // Alto rischio sempre
            implicazioni: "Alto rischio errori/frodi, mancanza verifiche, inefficacia operativa.",
            riferimenti_normativi: ["FNC CL C.2", "ISA 315 (CA)", "BP Controllo Interno"] // Aggiunto
        })
    },
     // C.1.4 (Aggiornamento Procedure) non genera gap diretto qui se risposta è negativa.
     {
        itemId: "C.2.1", // Adeguatezza Sistema Informativo
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Sistema informativo gestionale inadeguato/obsoleto.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/M/A/A'),
            implicazioni: "Inefficienza processi, dati inaffidabili, difficoltà reporting, limiti crescita.",
            riferimenti_normativi: ["FNC CL C.6", "ISA 315 (IC)", "BP"] // Aggiunto
        })
    },
    {
        itemId: "C.2.2", // Sicurezza e Integrità Dati (NB: Domanda C.2.2 + C.2.3 + C.2.4 del questionario)
        triggerAnswers: ["No", "Parziale"], // Trigger se una delle risposte C.2.2, C.2.3 o C.2.4 è No/Parz
        getGapDetails: (answer, cliente) => ({ // La descrizione può essere più generica o adattata
            descrizione: "Carenze nella sicurezza informatica (backup, accessi, policy).",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'A/A/A/A'), // Rischio alto aggregato
            implicazioni: "Rischio perdita dati, accessi non autorizzati, violazione privacy, interruzione operatività.",
            riferimenti_normativi: ["FNC CL C.7", "ISA 315 (IC)", "GDPR", "BP Sicurezza IT", "BP Business Continuity"] // Aggiunto
        })
    },
     // C.2.5 (Disaster Recovery) non genera gap diretto qui se risposta è negativa.
     {
        itemId: "C.3.1", // Budget Economico Annuale
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Assenza/incompletezza budget economico annuale.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/M/A/A'),
            implicazioni: "Mancanza obiettivi chiari, difficoltà controllo costi/ricavi, gestione reattiva.",
            riferimenti_normativi: ["FNC CL D.1", "BP Budgeting"] // Aggiunto
        })
    },
    {
        itemId: "C.3.3", // Budget Tesoreria Previsionale (Domanda C.3.3 del questionario)
        triggerAnswers: ["No", "Parziale"], // Anche Parziale è un gap qui
        getGapDetails: (answer, cliente) => ({
            descrizione: "Assenza/Irregolarità budget tesoreria previsionale.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'A/A/A/A'), // Rischio Alto
            implicazioni: "Alto rischio crisi liquidità, incapacità previsione fabbisogni finanziari, difficoltà accesso credito.",
            riferimenti_normativi: ["FNC CL D.3", "Art. 2086", "CCII Art.3", "BP Cash Management"] // Aggiunto
        })
    },
     {
        itemId: "C.3.4", // Analisi Scostamenti Budget (Domanda C.3.4 del questionario)
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Mancata/Sporadica analisi scostamenti.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/B/M/M'),
            implicazioni: "Scarsa consapevolezza performance, incapacità azioni correttive tempestive.",
             riferimenti_normativi: ["FNC CL D.4", "BP Controllo di Gestione"] // Aggiunto
        })
    },
    // C.3.5 (Azioni Correttive) è conseguenza, non gap primario.
     {
        itemId: "C.3.6", // Monitoraggio KPI Specifici (Domanda C.3.6 del questionario)
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Assenza/Carenza monitoraggio KPI specifici (non solo fin.).",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'M/M/A/A'),
            implicazioni: "Visione incompleta performance, difficoltà identificazione cause problemi/successi.",
            riferimenti_normativi: ["FNC CL A.7", "D.5", "Art. 2086", "BP Performance Measurement"] // Aggiunto
        })
    },
    // C.3.7 (Piano Strategico) non genera gap diretto qui se risposta è negativa.
    // C.4.x (Rischi, 231, ESG) non generano gap diretti qui se risposta è negativa (sono più scelte/opportunità).

    // --- AREA D: CONTABILE ---\
     {
        itemId: "D.1.1", // Tempestività Registrazioni
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Registrazioni contabili non tempestive.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'A/A/A/A'), // Rischio Alto
            implicazioni: "Dati consuntivi inaffidabili/tardivi, impossibilità monitoraggio efficace.",
            riferimenti_normativi: ["FNC CL C.3", "CC Artt. 2214, 2219", "BP"] // Aggiunto
        })
    },
    {
        itemId: "D.1.2", // Riconciliazioni Periodiche
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Mancanza/Irregolarità riconciliazioni contabili.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'A/A/A/A'), // Rischio Alto
            implicazioni: "Rischio errori/omissioni non rilevati, inaffidabilità saldi contabili.",
            riferimenti_normativi: ["FNC CL C.4", "BP Controllo Interno Contabile"] // Aggiunto
        })
    },
     {
        itemId: "D.1.3", // Situazioni Contabili Infra-annuali
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Mancata/Incompleta produzione situazioni contabili infra.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/B/M/M'),
            implicazioni: "Difficoltà monitoraggio performance infra-annuale.",
            riferimenti_normativi: ["FNC CL C.5", "BP Reporting Interno"] // Aggiunto
        })
    },
    {
        itemId: "D.1.4", // Contabilità Analitica [*]
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Assenza/Carenza contabilità analitica.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/B/M/A'),
            implicazioni: "Incapacità valutazione redditività dettaglio, decisioni pricing/mix non informate.",
            riferimenti_normativi: ["FNC CL D.7", "BP Controllo di Gestione Avanzato"] // Aggiunto
        })
    },
     {
        itemId: "D.1.5", // Gestione Contabile Magazzino
        triggerAnswers: ["No", "Parziale"], // Se NA non è gap
        getGapDetails: (answer, cliente) => ({
            descrizione: "Gestione contabile magazzino scorretta/intempestiva.",
            // Rischio dipende molto dalla rilevanza del magazzino (M-A?)
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'M/A/A/A'), // Assumo rischio crescente
            implicazioni: "Valore magazzino inattendibile, impatto su risultato economico.",
             riferimenti_normativi: ["FNC CL D.11", "PC OIC 13", "CC Art. 2426 n.9"] // Aggiunto
        })
    },
    // D.1.6, D.2.x non generano gap operativi diretti qui.

    // --- AREA E: RILEVAZIONE CRISI ---\
     {
        itemId: "E.1", // Sistema rileva Squilibri?
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Sistema informativo non idoneo a rilevare squilibri.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'A/A/A/A'), // Rischio Alto
            implicazioni: "Mancata/Tardiva rilevazione crisi, impossibilità intervento precoce.",
            riferimenti_normativi: ["Art. 2086 c.2", "CCII Art.3", "FNC CL A.7", "ISA 570"] // Aggiunto
        })
    },
    {
        itemId: "E.2", // Monitoraggio Indici Crisi
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Mancato/Parziale monitoraggio Indici Crisi.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'A/A/A/A'), // Rischio Alto
            implicazioni: "Rischio mancato rispetto obblighi CCII, mancata attivazione allerta.",
            riferimenti_normativi: ["CCII Art. 3", "Art. 13", "Documenti CNDCEC", "FNC CL D.6", "ISA 570"] // Aggiunto/Corretto
        })
    },
    {
        itemId: "E.3", // Procedura Gestione Allerta
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Assenza/Informalità procedura gestione allerta.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'B/M/A/A'),
            implicazioni: "Reazione tardiva/disordinata a segnali crisi.",
            riferimenti_normativi: ["Art. 2086 c.2", "CCII Art.3", "BP Crisis Management"] // Aggiunto
        })
    },
     {
        itemId: "E.4", // Consapevolezza Going Concern
        triggerAnswers: ["No", "Parziale"], // Se la valutazione non è formalizzata/periodica
        getGapDetails: (answer, cliente) => ({
            descrizione: "Scarsa formalizzazione/periodicità valutazione Going Concern.", // Riformulato
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'A/A/A/A'), // Rischio Alto
            implicazioni: "Sottovalutazione rischi, mancate decisioni, responsabilità amministratori/sindaci.",
            riferimenti_normativi: ["Art. 2086 c.2", "ISA 570", "OIC 11"] // Aggiunto
        })
    },
    {
        itemId: "E.5", // Supporto Documentale Valutaz. GC
        triggerAnswers: ["No", "Parziale"],
        getGapDetails: (answer, cliente) => ({
            descrizione: "Assenza/Inadeguatezza piani/budget attendibili per valutazione GC.",
            livello_rischio: getRiskLevelFromMapping(cliente?.dimensioneStimata, 'A/A/A/A'), // Rischio Alto
            implicazioni: "Valutazione GC non fondata, difficoltà accesso credito, non conformità ISA 570.",
             riferimenti_normativi: ["Art. 2086 c.2", "ISA 570", "OIC 11", "ODCEC BP Guide"] // Aggiunto
        })
    },
     // E.6 (Reazione "Senza Indugio") è difficile da valutare con Sì/No, più un giudizio qualitativo.
];

module.exports = gapRules;

// END OF FILE server/knowledge/gapRules.js (MODIFICATO CON RIFERIMENTI)