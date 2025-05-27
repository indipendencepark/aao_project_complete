// START OF FILE server/knowledge/actionPlanRules.js (NUOVA KB)

/**
 * Knowledge Base (KB) per la generazione suggerimenti Piano d'Azione.
 * Mappa i Gap (identificati da ID Domanda) a interventi standard,
 * priorità default, tempistiche indicative e dipendenze logiche.
 */

const actionPlanRules = [
    // --- B. ASSETTO ORGANIZZATIVO ---
    {
        gapId: "B.1.1", // Assenza/Incompletezza Organigramma
        intervento: "Redazione/Aggiornamento Organigramma Formale",
        prioritaDefault: "M",
        timings: { micro: '1s', p: '2s', m: '1m', g: '1m' },
        dipendeDa: [],
        risorse: ["Direzione"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Definire e comunicare chiaramente la struttura gerarchica e funzionale dell'azienda, le unità organizzative e le linee di riporto.",
        kpi_monitoraggio_suggeriti: [
            "Organigramma Approvato e Diffuso (Sì/No)",
            "% Personale che conosce il proprio riporto diretto"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "B.1.2", // Mancata Comunicazione Organigramma
        intervento: "Diffusione e Spiegazione Organigramma Approvato",
        prioritaDefault: "B",
        timings: { micro: '1g', p: '2g', m: '1s', g: '1s' },
        dipendeDa: ["B.1.1"],
        risorse: ["Direzione", "HR"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Assicurare che tutte le figure chiave e, ove opportuno, tutto il personale comprendano la struttura organizzativa, i ruoli e i riporti.",
        kpi_monitoraggio_suggeriti: [
            "% Personale informato su struttura (via survey interna)",
            "Data ultima comunicazione/formazione su organigramma"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "B.1.3", // Inadeguatezza Struttura Organizzativa
        intervento: "Analisi Critica Struttura e Proposta Riorganizzazione",
        prioritaDefault: "A", // Alta (se rilevata)
        timings: { micro: '2m', p: '2m', m: '3m', g: '3m+' }, // Ad Hoc
        dipendeDa: ["B.1.1"], // Utile avere l'esistente (anche se inadeguato)
        risorse: ["Direzione", "Consulente Esterno"],
         // --- NUOVI CAMPI ---
         obiettivo_intervento: "Valutare l'efficacia ed efficienza della struttura attuale rispetto agli obiettivi strategici e dimensionali, proponendo un modello organizzativo più adeguato.",
         kpi_monitoraggio_suggeriti: [
             "Report Analisi Struttura Completato (Sì/No)",
             "Piano di Riorganizzazione Approvato (Sì/No)",
             // KPI successivi misureranno l'efficacia della NUOVA struttura
         ]
         // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "B.2.1", // Mancata Identificazione Ruoli Chiave
        intervento: "Mappatura e Formalizzazione Ruoli Chiave",
        prioritaDefault: "M",
        timings: { micro: '1s', p: '1s', m: '2s', g: '2s' },
        dipendeDa: ["B.1.1"],
        risorse: ["Direzione"],
         // --- NUOVI CAMPI ---
         obiettivo_intervento: "Identificare formalmente le posizioni organizzative critiche per il funzionamento dell'azienda e assegnare responsabili chiari.",
         kpi_monitoraggio_suggeriti: [
             "Elenco Ruoli Chiave Definito e Approvato (Sì/No)",
             "Numero Ruoli Chiave senza responsabile assegnato"
         ]
         // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "B.2.2", // Assenza/Incompletezza Mansionari
        intervento: "Redazione Mansionari per Ruoli Chiave",
        prioritaDefault: "B", // Bassa (priorità più alta se M/G)
        timings: { micro: 'NA', p: 'NA', m: '1m', g: '1m' }, // NA per Micro/Piccola
        dipendeDa: ["B.2.1"],
        risorse: ["Direzione", "HR"],
         // --- NUOVI CAMPI ---
         obiettivo_intervento: "Definire per iscritto scopo, responsabilità principali, compiti specifici e competenze richieste per ciascun ruolo chiave identificato.",
         kpi_monitoraggio_suggeriti: [
             "% Ruoli Chiave con Mansionario Formalizzato",
             "Data Ultima Revisione Mansionari"
         ]
         // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "B.2.3", // Inadeguata Segregazione Compiti
        intervento: "Analisi Flussi Operativi e Ridefinizione Compiti/Controlli",
        prioritaDefault: "A", // Alta
        timings: { micro: '2s', p: '1m', m: '1.5m', g: '1.5m' },
        dipendeDa: ["B.1.1", "B.2.1"],
        risorse: ["Direzione", "Resp. Funzioni"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Identificare e rimuovere conflitti di interesse operativi e rischi di frode/errore dovuti a insufficiente separazione tra funzioni incompatibili (es. autorizzativa, esecutiva, di controllo).",
        kpi_monitoraggio_suggeriti: [
            "Numero Conflitti Segregazione Rilevati (pre/post intervento)",
            "Numero Controlli Compensativi Implementati",
            "Report Audit Interno su Segregazione (Sì/No)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "B.3.1", // Assenza/Incompletezza Sistema Deleghe
        intervento: "Definizione/Aggiornamento Sistema Deleghe e Poteri di Firma",
        prioritaDefault: "M",
        timings: { micro: '1s', p: '2s', m: '1m', g: '1m' },
        dipendeDa: ["B.1.1", "B.2.1"], // Richiede organigramma e ruoli
        risorse: ["Direzione", "Legale (se disponibile/necessario)"], // Modificato
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Formalizzare per iscritto chi ha l'autorità di impegnare l'azienda (operativamente e finanziariamente) e con quali limiti, garantendo tracciabilità e controllo.",
        kpi_monitoraggio_suggeriti: [
            "Matrice Deleghe Approvata (Sì/No)",
            "Numero contestazioni su atti non autorizzati (pre/post)",
            "% Spesa conforme ai limiti di delega"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "B.3.2", // Incoerenza Deleghe/Organigramma
        intervento: "Revisione Sistema Deleghe per Allineamento con Organigramma",
        prioritaDefault: "B",
        timings: { micro: 'NA', p: '1s', m: '2s', g: '2s' },
        dipendeDa: ["B.1.1", "B.3.1"], // Dipende da avere organigramma E sistema deleghe definito
        risorse: ["Direzione"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Assicurare che i poteri formali (deleghe, procure) siano coerenti con le responsabilità assegnate nell'organigramma, eliminando ambiguità e conflitti.",
        kpi_monitoraggio_suggeriti: [
            "Verifica Coerenza Deleghe/Organigramma Completata (Sì/No)",
            "Numero segnalazioni conflitti di competenza (pre/post)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    // Ignoriamo B.4.1 (Regolarità Riunioni) e B.4.2 (Verbalizzazione) come gap diretti da actionPlanRules,
    // assumendo che se emergono come problemi, si risolvono con interventi più generali sulla governance o con semplici azioni organizzative.
     {
        gapId: "B.4.3", // Mancata Nomina Organo Controllo (se obbligatorio!)
        intervento: "Convocazione Assemblea per Nomina Organo Controllo",
        prioritaDefault: "A", // Alta (Obbligo Legale)
        timings: { micro: '1m', p: '1m', m: '1m', g: '1m' }, // Tempo per iter formale
        dipendeDa: [],
        risorse: ["Soci", "Organo Amm.", "Consulente Legale/Fiscale"], // Modificato
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Adempiere agli obblighi normativi (art. 2477 c.c. o altri) nominando l'organo di controllo richiesto dalla legge o dallo statuto.",
        kpi_monitoraggio_suggeriti: [
            "Organo Controllo Nominato (Sì/No)",
            "Data Delibera Nomina"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "B.4.4", // Flusso Informativo vs Org. Controllo Inadeguato
        intervento: "Definizione/Attuazione Protocollo Flussi Informativi vs Org. Ctrl",
        prioritaDefault: "A", // Alta (se organo controllo presente)
        timings: { micro: 'NA', p: '1m', m: '1m', g: '1m' }, // Applicabile se esiste organo controllo
        dipendeDa: ["B.4.3"], // Assume organo controllo nominato
        risorse: ["Organo Amm.", "Organo Controllo", "Resp. AFC"], // Modificato
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Garantire che l'organo di controllo riceva tempestivamente, periodicamente e in modo strutturato tutte le informazioni necessarie per svolgere efficacemente la sua funzione di vigilanza (art. 2381 c.c., Norme CS).",
        kpi_monitoraggio_suggeriti: [
            "Protocollo Flussi Informativi Approvato (Sì/No)",
            "Frequenza Invio Report a Organo Controllo (vs. Protocollo)",
            "Completezza Reportistica Inviata (Audit/Verifica OdC)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    // B.4.5 (Valutazione Assetti CdA) e B.4.6 (Cura Assetti Delegati) sono più attività di governance continuativa
    // che interventi specifici da piano. Possono essere indirizzati tramite formazione (E.4) o inclusi
    // nelle responsabilità dei mansionari o nei regolamenti interni del CdA.

    // --- C. ASSETTO AMMINISTRATIVO ---
    {
        gapId: "C.1.1", // Mancata Mappatura Processi Chiave
        intervento: "Mappatura Processi Aziendali Chiave (As-Is)",
        prioritaDefault: "B",
        timings: { micro: '1s', p: '2s', m: '1m', g: '1m' },
        dipendeDa: [],
        risorse: ["Direzione", "Resp. Funzioni", "Consulente Org. (Opz.)"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Ottenere una visione chiara e condivisa di come si svolgono attualmente i principali processi operativi (es. vendite, acquisti, produzione), identificando attività, input, output e attori coinvolti.",
        kpi_monitoraggio_suggeriti: [
            "Numero Processi Chiave Mappati",
            "Documento Mappatura 'As-Is' Approvato (Sì/No)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "C.1.2", // Assenza Procedure Operative Scritte
        intervento: "Redazione Manuale Procedure per Processi Chiave",
        prioritaDefault: "M", // Media (se M/G)
        timings: { micro: 'NA', p: 'NA', m: '2m', g: '2m' },
        dipendeDa: ["C.1.1"], // Richiede mappatura as-is
        risorse: ["Direzione", "Resp. Funzioni", "Qualità/Org. (se esiste)"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Standardizzare e documentare le modalità operative dei processi più critici per ridurre variabilità, errori, dipendenza dalle persone e facilitare la formazione.",
        kpi_monitoraggio_suggeriti: [
            "Numero Procedure Formalizzate e Approvate",
            "% Processi Chiave Coperti da Procedure Scritte"
        ]
        // --- FINE NUOVI CAMPI ---
    },
     {
        gapId: "C.1.3", // Carenza Controlli Interni Procedure
        intervento: "Revisione Procedure con Inserimento Punti di Controllo Chiave",
        prioritaDefault: "A", // Alta
        timings: { micro: '2s', p: '1m', m: '1.5m', g: '1.5m' },
        // Dipende da C.1.1 (mappatura) e idealmente C.1.2 (procedure scritte), ma può essere fatto anche su prassi
        dipendeDa: ["C.1.1"],
        risorse: ["Direzione", "Resp. Funzioni", "Controllo Interno/Audit (se esiste)"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Integrare nelle procedure operative (formali o informali) controlli specifici (es. autorizzazioni, verifiche, quadrature) per mitigare i rischi di errori, frodi e inefficienze.",
        kpi_monitoraggio_suggeriti: [
            "Numero Controlli Chiave Implementati/Documentati",
            "Risultati Test Efficacia Controlli (se applicabile)",
            "Riduzione % Errori/Non Conformità nel Processo (post)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    // C.1.4 (Aggiornamento Procedure) - Intervento meno comune per piano iniziale, più gestione continuativa.
    {
        gapId: "C.2.1", // Sistema Informativo Inadeguato
        intervento: "Analisi Adeguatezza Sistema IT e Piano Interventi",
        prioritaDefault: "M",
        timings: { micro: '1m', p: '1m', m: '2m', g: '2m' }, // Tempo per analisi/selezione
        dipendeDa: [],
        risorse: ["Direzione", "IT", "Resp. Funzioni Chiave", "Consulente IT (Opz.)"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Valutare se gli strumenti IT attuali supportano efficacemente i processi e le esigenze informative; definire un piano per migliorare/integrare/sostituire i sistemi inadeguati.",
        kpi_monitoraggio_suggeriti: [
            "Report Analisi Adeguatezza IT Completato (Sì/No)",
            "Piano Interventi IT Approvato (Sì/No)",
            // KPI successivi misureranno benefici nuovo sistema (es. riduzione data entry)
        ]
        // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "C.2.2", // Carenza Sicurezza Dati
        intervento: "Definizione/Attuazione Policy Sicurezza Dati (backup, accessi)",
        prioritaDefault: "A", // Alta
        timings: { micro: '1m', p: '1m', m: '1m', g: '1m' },
        dipendeDa: [],
        risorse: ["Direzione", "IT", "Resp. HR (per policy accessi)"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Proteggere i dati aziendali da perdite, accessi non autorizzati e violazioni, implementando procedure di backup affidabili e testate e una gestione degli accessi basata su ruoli.",
        kpi_monitoraggio_suggeriti: [
            "Policy Sicurezza Dati Approvata e Comunicata (Sì/No)",
            "Frequenza Test Ripristino Backup (vs. Policy)",
            "Numero Incidenti Sicurezza Dati (pre/post)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    // C.2.3 (Policy IT), C.2.4 (Backup Testati), C.2.5 (Disaster Recovery) sono spesso dettagliati
    // all'interno degli interventi C.2.1 e C.2.2 o gestiti come progetti IT specifici.

     {
        gapId: "C.3.1", // Assenza Budget Economico Annuale
        intervento: "Implementazione Processo Budget Economico Annuale",
        prioritaDefault: "A", // Alta (se P/M/G)
        timings: { micro: '1m', p: '1m', m: '1.5m', g: '1.5m' },
        dipendeDa: ["D.1.1"], // Richiede contabilità tempestiva per consuntivi
        risorse: ["Direzione", "Amministrazione", "Controllo Gestione (se esiste)"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Dotare l'azienda di uno strumento previsionale annuale per definire obiettivi economici (ricavi, costi, margini), allocare risorse e monitorare le performance.",
        kpi_monitoraggio_suggeriti: [
            "Budget Annuale Approvato entro [Data Target] (Sì/No)",
            "Coinvolgimento Funzioni nel Processo di Budget (Sì/No)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "C.3.2", // Assenza Budget Tesoreria
        intervento: "Implementazione Budget Tesoreria (min. Trimestrale, raccomandato Mensile)", // Suggeriamo mensile
        prioritaDefault: "A", // Alta (Critico per crisi)
        timings: { micro: '1m', p: '1m', m: '1m', g: '1m' },
        dipendeDa: ["D.1.1", "C.3.1"], // Richiede dati contabili e idealmente budget economico
        risorse: ["Amministrazione", "Tesoreria", "Controllo Gestione (se esiste)"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Prevedere i flussi di cassa futuri (entrate/uscite) per anticipare fabbisogni o surplus di liquidità, gestire i rapporti con le banche e supportare la valutazione della continuità.",
        kpi_monitoraggio_suggeriti: [
            "Budget Tesoreria (6-12 mesi rolling) Prodotto e Aggiornato (Sì/No)",
            "Frequenza Aggiornamento Budget Tesoreria (vs. Target)",
            "Accuratezza Previsione Saldo Cassa a 1 mese (%)" // Da C. KPI Fase 3
        ]
        // --- FINE NUOVI CAMPI ---
    },
     {
        gapId: "C.3.3", // Mancata Analisi Scostamenti
        intervento: "Implementazione Reportistica Analisi Scostamenti Periodica",
        prioritaDefault: "M",
        timings: { micro: '1s', p: '2s', m: '1m', g: '1m' },
        dipendeDa: ["C.3.1", "C.3.2"], // Richiede budget
        risorse: ["Amministrazione", "Controllo Gestione (se esiste)", "Resp. Funzioni"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Analizzare sistematicamente le differenze tra risultati consuntivi e obiettivi di budget (economico e di tesoreria) per comprenderne le cause e supportare azioni correttive.",
        kpi_monitoraggio_suggeriti: [
            "Report Analisi Scostamenti Prodotto e Distribuito (Sì/No)",
            "Numero Azioni Correttive Intraprese a seguito Analisi",
            "Tempestività Report Scostamenti (vs. Target)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    // C.3.5 (Discussione/Azioni Scostamenti) è parte integrante di C.3.3 e della governance.

    {
        gapId: "C.3.6", // Assenza Monitoraggio KPI Specifici (C.3.4 nel Questionario)
        intervento: "Definizione Cruscotto KPI Chiave e Sistema Monitoraggio",
        prioritaDefault: "M",
        timings: { micro: '2s', p: '1m', m: '1m', g: '1m' },
        dipendeDa: [],
        risorse: ["Direzione", "Controllo Gestione (se esiste)", "Resp. Funzioni"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Identificare e monitorare regolarmente un set bilanciato di indicatori chiave (non solo finanziari) per valutare le performance operative, commerciali e strategiche dell'azienda.",
        kpi_monitoraggio_suggeriti: [
            "Cruscotto KPI Definito e Approvato (Sì/No)",
            "Frequenza Aggiornamento Dati KPI (vs. Target)",
            "% KPI con Target Definito"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    // C.3.7 (Piano Strategico) è un output complesso, meno un intervento singolo da piano assetti.

    // C.4 (Gestione Rischi) - Gli interventi dipendono molto dalla volontà/necessità del cliente.
    // KB potrebbe includere interventi come: "Effettuazione Risk Assessment Preliminare",
    // "Valutazione Adozione Modello 231", "Implementazione Piano Mitigazione Rischio X".
    // Per ora li omettiamo dall'automazione base del piano.


     // --- D. ASSETTO CONTABILE ---
     {
        gapId: "D.1.1", // Registrazioni Contabili Non Tempestive
        intervento: "Revisione Processo Chiusura Contabile Mensile/Trimestrale",
        prioritaDefault: "A", // Alta
        timings: { micro: '1m', p: '1m', m: '1m', g: '1m' },
        dipendeDa: [],
        risorse: ["Amministrazione", "Resp. AFC"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Garantire che le registrazioni contabili siano completate entro una scadenza definita (es. 15gg fine mese) per disporre di dati consuntivi aggiornati per il reporting e il monitoraggio.",
        kpi_monitoraggio_suggeriti: [
            "Tempo Medio Chiusura Contabile Mensile (gg)",
            "% Riconciliazioni completate entro chiusura"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "D.1.2", // Carenza Riconciliazioni Contabili
        intervento: "Implementazione/Schedulazione Riconciliazioni Periodiche (Banche, Clienti, Fornitori, IVA)", // Specificato di più
        prioritaDefault: "A", // Alta
        timings: { micro: '2s', p: '2s', m: '1m', g: '1m' },
        dipendeDa: ["D.1.1"], // Utile avere chiusure tempestive
        risorse: ["Amministrazione"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Assicurare l'accuratezza e l'affidabilità dei saldi contabili attraverso la verifica sistematica e tempestiva delle corrispondenze con dati esterni (estratti conto) e interni (scadenziari, registri IVA).",
        kpi_monitoraggio_suggeriti: [
            "Frequenza Riconciliazioni Effettuate (vs. Schedulazione)",
            "Numero/Importo differenze non riconciliate > X giorni"
        ]
        // --- FINE NUOVI CAMPI ---
    },
     {
        gapId: "D.1.3", // Mancanza Bilancini Infra-annuali
        intervento: "Implementazione Chiusure Contabili Infra-annuali e Reportistica Sintetica", // Specificato di più
        prioritaDefault: "M", // Media
        timings: { micro: 'NA', p: '1m', m: '1m', g: '1m' },
        dipendeDa: ["D.1.1"],
        risorse: ["Amministrazione", "Controllo Gestione (se esiste)"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Produrre regolarmente (min. trimestrale) situazioni contabili (SP/CE) affidabili per permettere il monitoraggio della performance economica e patrimoniale infra-annuale.",
        kpi_monitoraggio_suggeriti: [
            "Report Infra-annuale Prodotto e Distribuito (Sì/No)",
            "Tempestività Report Infra-annuale (vs. Target)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "D.1.4", // Assenza Contabilità Analitica [*]
        intervento: "Valutazione e Implementazione Sistema Contabilità Analitica (base)",
        prioritaDefault: "M", // Media (se M/G)
        timings: { micro: 'NA', p: 'NA', m: '3m+', g: '3m+' }, // Progetto complesso
        dipendeDa: ["D.1.1"], // Richiede dati base affidabili
        risorse: ["Amministrazione", "Controllo Gestione", "IT", "Consulente (Opz.)"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Implementare un sistema per allocare costi e ricavi a dimensioni specifiche (es. centri di costo/ricavo, prodotti) al fine di calcolare margini analitici e supportare decisioni di pricing/mix.",
        kpi_monitoraggio_suggeriti: [
            "Sistema Contabilità Analitica Operativo (Sì/No)",
            "Copertura % Costi/Ricavi allocata analiticamente",
            "Report Marginalità per Prodotto/CdC Disponibile (Sì/No)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "D.1.5", // Gest. Contabile Magazzino Scorr./Intem.
        intervento: "Revisione Procedure Valorizzazione/Rilevazione Magazzino",
        prioritaDefault: "A", // Alta (se magazzino rilevante)
        timings: { micro: '1m', p: '1m', m: '1.5m', g: '1.5m' },
        dipendeDa: [],
        risorse: ["Amministrazione", "Logistica", "Controllo Gestione"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Assicurare che le rimanenze di magazzino siano correttamente valorizzate secondo i principi contabili e che le scritture di carico/scarico riflettano tempestivamente i movimenti fisici.",
        kpi_monitoraggio_suggeriti: [
            "Accuratezza Inventario Fisico vs Contabile (%)", // Da KPI Logistica
            "Tempestività Registrazione Movimenti Magazzino",
            "Conformità Metodo Valorizzazione a PC (Audit)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    // D.1.6 (Audit Trail) è più una caratteristica del sistema IT (C.2.1).
    // D.2 (Bilancio) - Interventi D.2.1, D.2.2, D.2.3 sono più legati a correggere errori specifici
    // o non conformità, meno a definire *assetti*. Potrebbero essere azioni correttive puntuali.
    // Li omettiamo dal piano d'azione standard generato automaticamente.

    // --- E. CAPACITÀ RILEVAZIONE CRISI ---
    {
        gapId: "E.1", // Sistema Non Idoneo Rilevaz. Squilibri
        intervento: "Revisione Complessiva Assetti per Allerta Precoce (Focus Tesoreria/KPI/Reporting)", // Titolo più specifico
        prioritaDefault: "A", // Alta
        timings: { micro: '1m', p: '1.5m', m: '2m', g: '2m' }, // Sforzo coordinato
        // Dipende da MOLTI interventi precedenti che forniscono dati/struttura
        dipendeDa: ["C.3.2", "C.3.6", "D.1.1", "D.1.3", "E.2"],
        risorse: ["Direzione", "Resp. AFC", "Controllo Gestione", "IT", "Consulente"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Integrare e migliorare gli assetti organizzativi, amministrativi e contabili per creare un sistema informativo complessivo capace di identificare *tempestivamente* segnali di potenziale crisi.",
        kpi_monitoraggio_suggeriti: [
            // KPI sono quelli degli interventi sottostanti (es. DSCR, accuratezza budget...)
            "Report Sintetico Allerta Precoce Implementato (Sì/No)",
            "Tempo Medio Rilevamento Segnale Allerta (obiettivo)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
     {
        gapId: "E.2", // Non Monitoraggio Indici Crisi
        intervento: "Implementazione Calcolo/Monitoraggio Indici Crisi (CCII/CNDCEC)",
        prioritaDefault: "A", // Alta (Obbligo + Rischio)
        timings: { micro: '1m', p: '1m', m: '1m', g: '1m' },
        dipendeDa: ["D.1.1", "C.3.2"], // Richiede dati contabili e previsionali affidabili
        risorse: ["Amministrazione", "Controllo Gestione", "Consulente (Opz.)"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Calcolare e monitorare regolarmente gli indici specifici previsti dalla normativa (art. 13 CCII, indicatori CNDCEC) per adempiere agli obblighi e attivare l'allerta interna.",
        kpi_monitoraggio_suggeriti: [
            "Report Indici Crisi Prodotto Periodicamente (Sì/No)",
            "Numero Indici sopra soglia di allerta",
            "DSCR Previsionale a 6 mesi (Valore)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
     {
        gapId: "E.3", // Assenza Procedura Gestione Allerta
        intervento: "Definizione Procedura Interna Gestione Segnali Allerta",
        prioritaDefault: "M", // Media
        timings: { micro: '1m', p: '1m', m: '1.5m', g: '1.5m' },
        dipendeDa: ["E.1", "E.2"], // Ha senso dopo aver identificato cosa monitorare e come
        risorse: ["Direzione", "Organo Controllo (se presente)", "Resp. AFC"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Stabilire un processo chiaro e formalizzato su chi informa chi, cosa fare e in quali tempi quando viene rilevato un segnale di allerta (interno o esterno).",
        kpi_monitoraggio_suggeriti: [
            "Procedura Gestione Allerta Approvata e Comunicata (Sì/No)",
            "Tempo Medio Risposta a Segnale Allerta (gg)",
            "Numero Segnali Allerta gestiti secondo procedura (%)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "E.4", // Scarsa Consapevolezza Going Concern
        intervento: "Formazione/Sensibilizzazione Organi su Valutazione Continuità Aziendale",
        prioritaDefault: "A", // Alta
        timings: { micro: '1m', p: '1m', m: '1m', g: '1m' }, // Tempo per organizzare/erogare
        dipendeDa: [],
        risorse: ["Organo Amm.", "Organo Controllo", "Consulente"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Aumentare la consapevolezza dell'organo amministrativo e di controllo sull'importanza, la metodologia e le responsabilità legate alla valutazione periodica della continuità aziendale (Going Concern - ISA 570).",
        kpi_monitoraggio_suggeriti: [
            "Sessione Formativa Erogata (Sì/No)",
            "Valutazione GC inclusa formalmente nell'OdG CdA (Sì/No)"
        ]
        // --- FINE NUOVI CAMPI ---
    },
    {
        gapId: "E.5", // Documentazione GC Inadeguata
        intervento: "Implementazione Piani/Budget Attendibili a Supporto Valutazione GC",
        prioritaDefault: "A", // Alta
        timings: { micro: '1.5m', p: '1.5m', m: '2m', g: '2m' }, // Richiede lavoro su budget/piani
        dipendeDa: ["C.3.1", "C.3.2"], // Dipende dai budget
        risorse: ["Direzione", "Amministrazione", "Controllo Gestione"],
        // --- NUOVI CAMPI ---
        obiettivo_intervento: "Produrre piani economici e budget di tesoreria previsionali (min. 12 mesi), supportati da assunzioni realistiche e analisi di sensitività, che costituiscano una base documentale attendibile per la valutazione del Going Concern.",
        kpi_monitoraggio_suggeriti: [
            "Piano Economico/Finanziario a 12+ mesi Approvato (Sì/No)",
            "Analisi di Sensitività/Stress Test Effettuata (Sì/No)",
            "Attendibilità Piani confermata da Organo Controllo/Revisore (Sì/No)"
        ]
        // --- FINE NUOVI CAMPI ---
    }
    // E.6 (Reazione "Senza Indugio") è un comportamento, non un intervento specifico da piano.
];

module.exports = { actionPlanRules }; // Esporta solo le regole

// END OF FILE server/knowledge/actionPlanRules.js (NUOVA KB)