// START OF FILE server/scripts/seedTemplates.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { QuestionTemplate } = require('../models/templates'); // Importa il modello
const path = require('path'); // Importa path

dotenv.config({ path: path.join(__dirname, '../../.env') }); // Carica .env dalla root del progetto

// ------------- INIZIO DATI TEMPLATE (CON AGGIUNTA CAMPO TAGS) -------------
const templateData = [
    // === AREA B: ASSETTO ORGANIZZATIVO ===
    {
        itemId: "B.1.1", domanda: "Esiste un organigramma documentato e aggiornato che descriva chiaramente la struttura (funzioni, unità, riporti)?",
        area: "Org", sottoArea: "Struttura", rilevanza: "P+ / M+", fonte: "FNC CL B.1, BP Org. Aziendale",
        tipoRisposta: "SiNoParz", testoAiuto: "Presenza e aggiornamento di uno schema formale (digitale o cartaceo) delle posizioni e delle linee di riporto gerarchico/funzionale.", ordine: 10, attiva: true,
        tags: ["organizzazione", "struttura", "organigramma", "formale", "documentazione", "gerarchia"],
        dependsOn: []
    },
    {
        itemId: "B.1.2", domanda: "L'organigramma (formale o informale) è comunicato efficacemente e compreso dalle persone chiave?",
        area: "Org", sottoArea: "Struttura", rilevanza: "P+ / M+", fonte: "FNC CL B.3, BP Comunicazione Interna",
        tipoRisposta: "SiNoParz", testoAiuto: "La struttura dei riporti e delle responsabilità è nota ai principali manager e collaboratori?", ordine: 20, attiva: true,
        tags: ["organizzazione", "struttura", "comunicazione", "comprensione", "personale_chiave", "organigramma"],
        dependsOn: [
            { sourceItemId: "B.1.1", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "B.1.3", domanda: "La struttura organizzativa attuale appare qualitativamente adeguata alla natura e dimensione dell'impresa?",
        area: "Org", sottoArea: "Struttura", rilevanza: "Tutte", fonte: "Art. 2086, ISA 315, FNC CL A.7",
        tipoRisposta: "SiNoParz", testoAiuto: "Valutazione professionale: la struttura attuale (es. troppo piatta, troppi livelli) consente una gestione efficace ed efficiente?", ordine: 25, attiva: true, // Txt rimosso per ora, SiNoParz standard
        tags: ["organizzazione", "struttura", "adeguatezza", "dimensione_impresa", "natura_impresa", "valutazione_professionale", "efficienza"],
        dependsOn: []
    },
    {
        itemId: "B.2.1", domanda: "I ruoli chiave (Direzione, Resp. Aree Funzionali critiche) sono stati formalmente identificati e assegnati?",
        area: "Org", sottoArea: "Ruoli e Responsabilità", rilevanza: "P+ / Tutte", fonte: "FNC CL B.4, BP Org. Aziendale",
        tipoRisposta: "SiNoParz", testoAiuto: "È chiaro e definito 'chi fa cosa' per le attività fondamentali dell'azienda?", ordine: 30, attiva: true,
        tags: ["organizzazione", "ruoli", "responsabilita", "formale", "assegnazione", "figure_chiave", "direzione"],
        dependsOn: []
    },
    {
        itemId: "B.2.2", domanda: "Esistono mansionari scritti (o documentazione equivalente) che dettaglino compiti e responsabilità per figure apicali/chiave?",
        area: "Org", sottoArea: "Ruoli e Responsabilità", rilevanza: "M+ / M+", fonte: "FNC CL B.4, BP HR Management",
        tipoRisposta: "SiNoParz", testoAiuto: "Per i ruoli principali, esiste un documento che ne definisca formalmente scopo, compiti, responsabilità e competenze richieste?", ordine: 40, attiva: true, // Doc rimosso per ora
        tags: ["organizzazione", "ruoli", "mansionari", "documentazione", "compiti", "responsabilita", "hr", "figure_apicali"],
        dependsOn: [
            { sourceItemId: "B.2.1", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "B.2.3", domanda: "È garantita un'adeguata segregazione dei compiti tra funzioni/persone incompatibili (es. autorizzativa vs esecutiva)?",
        area: "Org", sottoArea: "Ruoli e Responsabilità", rilevanza: "Tutte", fonte: "FNC CL B.6, ISA 315 (CA), BP Controllo Interno (SoD)",
        tipoRisposta: "SiNoParz", testoAiuto: "Esistono controlli per evitare che la stessa persona svolga attività critiche in conflitto (es. autorizzare e pagare una fattura)?", ordine: 50, attiva: true, // Txt rimosso
        tags: ["organizzazione", "segregazione_compiti", "sod", "controllo_interno", "rischio_frode", "autorizzazione_esecuzione"],
        dependsOn: []
    },
    {
        itemId: "B.2.4", domanda: "Le competenze del personale chiave appaiono adeguate ai ruoli ricoperti?",
        area: "Org", sottoArea: "Ruoli e Responsabilità", rilevanza: "Tutte", fonte: "Art. 2392 (competenze), BP HR Management",
        tipoRisposta: "SiNoParz", testoAiuto: "Le persone che occupano ruoli critici hanno l'esperienza e la formazione necessarie per svolgerli efficacemente?", ordine: 55, attiva: true, // Txt rimosso
        tags: ["organizzazione", "competenze", "personale_chiave", "adeguatezza_ruolo", "hr", "formazione", "esperienza"],
        dependsOn: []
    },
    {
        itemId: "B.3.1", domanda: "Esiste un sistema di deleghe operative e di spesa documentato (procure, policy interne, matrice autorizzativa)?",
        area: "Org", sottoArea: "Deleghe e Poteri", rilevanza: "P+ / M+", fonte: "FNC CL B.5, BP Sistema Autorizzativo",
        tipoRisposta: "SiNoParz", testoAiuto: "Sono definite per iscritto le regole su chi può firmare, impegnare l'azienda e autorizzare spese, e con quali limiti?", ordine: 60, attiva: true, // Doc rimosso
        tags: ["organizzazione", "deleghe", "poteri_spesa", "documentazione", "procure", "policy_interne", "matrice_autorizzativa"],
        dependsOn: []
    },
    {
        itemId: "B.3.2", domanda: "Le deleghe e procure esistenti sono coerenti con l'organigramma e le responsabilità formalmente definite?",
        area: "Org", sottoArea: "Deleghe e Poteri", rilevanza: "P+ / M+", fonte: "FNC CL B.5, BP Coerenza Organizzativa",
        tipoRisposta: "SiNoParz", testoAiuto: "I poteri formalizzati (es. procure) corrispondono ai ruoli e responsabilità definiti nell'organigramma?", ordine: 65, attiva: true,
        tags: ["organizzazione", "deleghe", "procure", "coerenza", "organigramma", "responsabilita_formali"],
        dependsOn: [
            { sourceItemId: "B.3.1", expectedAnswer: "Si" },
            { sourceItemId: "B.1.1", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "B.4.1", domanda: "L'organo amministrativo (CdA/AU) si riunisce con regolarità adeguata per deliberare sugli aspetti strategici/gestionali?",
        area: "Org", sottoArea: "Governance", rilevanza: "P+ / Tutte", fonte: "CC Artt. 2380-bis, 2388, BP Corporate Governance",
        tipoRisposta: "SiNoParz", testoAiuto: "La frequenza delle riunioni dell'organo amm.vo è sufficiente per prendere le decisioni necessarie (es. approvazione budget, piani, operazioni rilevanti)?", ordine: 70, attiva: true,
        tags: ["organizzazione", "governance", "cda", "amministratore_unico", "riunioni_periodiche", "delibere_strategiche", "gestione"],
        dependsOn: []
    },
    {
        itemId: "B.4.2", domanda: "Le delibere dell'organo amministrativo sono formalmente e dettagliatamente verbalizzate?",
        area: "Org", sottoArea: "Governance", rilevanza: "P+ / Tutte", fonte: "CC Artt. 2375, 2388, BP Corporate Governance",
        tipoRisposta: "SiNo", testoAiuto: "I verbali delle riunioni riportano adeguatamente le discussioni, le decisioni prese e le motivazioni?", ordine: 75, attiva: true, // Cambiato in SiNo
        tags: ["organizzazione", "governance", "delibere", "verbalizzazione", "documentazione_formale", "cda"],
        dependsOn: []
    },
    {
        itemId: "B.4.3", domanda: "L'organo di controllo (CS/SU/Rev), se previsto/necessario, è stato regolarmente nominato ed è operativo?",
        area: "Org", sottoArea: "Governance", rilevanza: "Tutte", fonte: "CC Artt. 2397, 2477, D.Lgs. 39/10",
        tipoRisposta: "SiNo", testoAiuto: "Verificare la presenza e l'effettiva operatività (partecipazione a riunioni, verbali) dell'organo di controllo/revisione previsto.", ordine: 80, attiva: true, // Cambiato in SiNoNA -> SiNo per semplicità schema
        tags: ["organizzazione", "governance", "organo_controllo", "collegio_sindacale", "revisore", "nomina", "operativita"],
        dependsOn: []
    },
    {
        itemId: "B.4.4", domanda: "I flussi informativi tra organo amministrativo e organo di controllo sono tempestivi, completi e documentati?",
        area: "Org", sottoArea: "Governance", rilevanza: "P+ / Tutte", fonte: "CC Artt. 2381, 2403-bis, Norme CS, ISA 260/265",
        tipoRisposta: "SiNoParz", testoAiuto: "L'organo di controllo riceve periodicamente (es. trimestralmente) e per iscritto informazioni adeguate sulla gestione e sugli assetti?", ordine: 85, attiva: true,
        tags: ["organizzazione", "governance", "flussi_informativi", "organo_amministrativo", "organo_controllo", "tempestivita", "completezza", "documentazione"],
        dependsOn: [
            { sourceItemId: "B.4.3", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "B.4.5", domanda: "[*] L'organo amministrativo valuta periodicamente l'adeguatezza degli assetti organizzativi, amm.vi e contabili?",
        area: "Org", sottoArea: "Governance", rilevanza: "M+ / Tutte", fonte: "CC Art. 2381 c.3",
        tipoRisposta: "SiNoParz", testoAiuto: "L'adeguatezza degli assetti è un punto specifico all'ordine del giorno delle riunioni dell'organo amministrativo (almeno annualmente)?", ordine: 90, attiva: true,
        tags: ["organizzazione", "governance", "valutazione_assetti", "organo_amministrativo", "adeguatezza_organizzativa", "adeguatezza_amministrativa", "adeguatezza_contabile", "cc_2381"],
        dependsOn: []
    },
    {
        itemId: "B.4.6", domanda: "[*] Gli organi delegati curano l'adeguatezza degli assetti e riferiscono all'organo delegante?",
        area: "Org", sottoArea: "Governance", rilevanza: "M+ / Tutte", fonte: "CC Art. 2381 c.5",
        tipoRisposta: "SiNoParz", testoAiuto: "Gli amministratori delegati/comitato esecutivo si occupano attivamente di mantenere adeguati gli assetti e ne riferiscono al CdA?", ordine: 95, attiva: true, // NA rimosso
        tags: ["organizzazione", "governance", "organi_delegati", "adeguatezza_assetti", "reporting_cda", "cc_2381"],
        dependsOn: []
    },

    // === AREA C: ASSETTO AMMINISTRATIVO ===
    {
        itemId: "C.1.1", domanda: "I principali processi aziendali (Ciclo Attivo, Passivo, Produzione/Erogazione Servizio, Tesoreria, HR) sono stati identificati e mappati?",
        area: "Admin", sottoArea: "Procedure", rilevanza: "P+ / M+", fonte: "FNC CL C.1, BP Process Management, ISO 9001",
        tipoRisposta: "SiNoParz", testoAiuto: "Esiste una consapevolezza e una rappresentazione (anche grafica/flowchart) di come si svolgono le attività principali?", ordine: 100, attiva: true,
        tags: ["amministrazione", "processi_aziendali", "mappatura_processi", "ciclo_attivo", "ciclo_passivo", "produzione", "tesoreria", "hr", "iso9001", "flowchart"],
        dependsOn: []
    },
    {
        itemId: "C.1.2", domanda: "Esistono procedure operative scritte che descrivano le modalità di svolgimento dei processi chiave?",
        area: "Admin", sottoArea: "Procedure", rilevanza: "M+ / M+", fonte: "FNC CL C.1, BP, ISO 9001",
        tipoRisposta: "SiNoParz", testoAiuto: "Per i processi più importanti (es. gestione ordini, acquisti, gestione finanziaria), esistono manuali o istruzioni operative formalizzate?", ordine: 110, attiva: true, // Doc rimosso
        tags: ["amministrazione", "procedure_operative", "documentazione_scritta", "processi_chiave", "manuali_operativi", "iso9001"],
        dependsOn: [
            { sourceItemId: "C.1.1", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "C.1.3", domanda: "Le procedure operative (anche informali) includono adeguati e formalizzati punti di controllo (es. autorizzazioni, verifiche documentali, quadrature)?",
        area: "Admin", sottoArea: "Procedure", rilevanza: "Tutte", fonte: "FNC CL C.2, ISA 315 (CA), BP Controllo Interno",
        tipoRisposta: "SiNoParz", testoAiuto: "Sono previsti momenti specifici di verifica e approvazione all'interno dei flussi operativi per prevenire errori o irregolarità?", ordine: 120, attiva: true, // Txt rimosso
        tags: ["amministrazione", "procedure_operative", "punti_controllo", "autorizzazioni", "verifiche_documentali", "quadrature", "controllo_interno"],
        dependsOn: [
            { sourceItemId: "C.1.2", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "C.1.4", domanda: "Le procedure operative sono adeguate alla complessità attuale dell'azienda e ai rischi connessi?",
        area: "Admin", sottoArea: "Procedure", rilevanza: "Tutte", fonte: "Art. 2086, FNC CL A.7",
        tipoRisposta: "SiNoParz", testoAiuto: "Valutazione professionale: le procedure attuali sono sufficientemente robuste per gestire l'operatività e i rischi attuali dell'impresa?", ordine: 125, attiva: true, // Txt rimosso
        tags: ["amministrazione", "procedure_operative", "adeguatezza", "complessita_aziendale", "rischi_connessi", "art_2086"],
        dependsOn: []
    },
    {
        itemId: "C.1.5", domanda: "[*] Le procedure operative vengono periodicamente revisionate e aggiornate (es. annualmente o al variare dei processi/rischi)?",
        area: "Admin", sottoArea: "Procedure", rilevanza: "M+ / M+", fonte: "BP Miglioramento Continuo, ISO 9001",
        tipoRisposta: "SiNoParz", testoAiuto: "Esiste un processo definito per mantenere aggiornata la documentazione procedurale?", ordine: 130, attiva: true,
        tags: ["amministrazione", "procedure_operative", "revisione_periodica", "aggiornamento", "miglioramento_continuo", "iso9001"],
        dependsOn: [
            { sourceItemId: "C.1.2", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "C.2.1", domanda: "Il sistema informativo gestionale (ERP, software specifici, Excel...) è adeguato a supportare i processi operativi e le esigenze informative?",
        area: "Admin", sottoArea: "Sistema Informativo/IT", rilevanza: "Tutte", fonte: "FNC CL C.6, ISA 315 (IC), BP",
        tipoRisposta: "SiNoParz", testoAiuto: "Gli strumenti informatici utilizzati sono idonei a gestire i volumi di dati, a fornire le informazioni necessarie e a supportare i controlli?", ordine: 140, attiva: true, // Txt rimosso
        tags: ["amministrazione", "sistema_informativo", "erp", "software_gestionale", "adeguatezza_it", "processi_operativi", "esigenze_informative"],
        dependsOn: []
    },
    {
        itemId: "C.2.2", domanda: "I diversi sistemi/strumenti informatici sono integrati tra loro o richiedono frequenti data entry manuali e riconciliazioni?",
        area: "Admin", sottoArea: "Sistema Informativo/IT", rilevanza: "P+ / M+", fonte: "FNC CL C.6, BP Integrazione Sistemi",
        tipoRisposta: "SiNoParz", testoAiuto: "I dati fluiscono automaticamente tra le diverse applicazioni (es. ordini -> produzione -> magazzino -> fatturazione) o vanno reinseriti?", ordine: 150, attiva: true, // Txt rimosso
        tags: ["amministrazione", "sistema_informativo", "integrazione_sistemi", "data_entry_manuale", "riconciliazioni", "automazione"],
        dependsOn: [
            { sourceItemId: "C.2.1", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "C.2.3", domanda: "Sono implementate policy e procedure per la sicurezza informatica (accessi profilati, password policy, antivirus, firewall)?",
        area: "Admin", sottoArea: "Sistema Informativo/IT", rilevanza: "Tutte", fonte: "FNC CL C.7, ISA 315 (IC), GDPR, BP Sicurezza IT",
        tipoRisposta: "SiNoParz", testoAiuto: "Esistono misure tecniche e organizzative per proteggere i sistemi informativi da accessi non autorizzati o da attacchi esterni?", ordine: 160, attiva: true,
        tags: ["amministrazione", "sicurezza_informatica", "policy_it", "accessi_profilati", "password_policy", "antivirus", "firewall", "gdpr"],
        dependsOn: []
    },
    {
        itemId: "C.2.4", domanda: "Vengono effettuati backup regolari e testati dei dati aziendali critici?",
        area: "Admin", sottoArea: "Sistema Informativo/IT", rilevanza: "Tutte", fonte: "FNC CL C.7, BP Business Continuity",
        tipoRisposta: "SiNoParz", testoAiuto: "Esiste una procedura di backup dei dati (contabili, gestionali) ed è stata verificata la sua efficacia (test di ripristino)?", ordine: 170, attiva: true,
        tags: ["amministrazione", "backup_dati", "test_ripristino", "dati_critici", "business_continuity", "sicurezza_it"],
        dependsOn: []
    },
    {
        itemId: "C.2.5", domanda: "[*] Esiste un piano di Disaster Recovery per garantire la continuità operativa dei sistemi IT in caso di eventi gravi?",
        area: "Admin", sottoArea: "Sistema Informativo/IT", rilevanza: "M+ / A", fonte: "BP Business Continuity",
        tipoRisposta: "SiNoParz", testoAiuto: "In caso di blocco prolungato dei sistemi principali (es. incendio, allagamento server), come viene garantita la ripartenza?", ordine: 180, attiva: true, // NA rimosso
        tags: ["amministrazione", "disaster_recovery", "continuita_operativa_it", "business_continuity_plan", "eventi_gravi"],
        dependsOn: [
            { sourceItemId: "C.2.4", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "C.3.1", domanda: "Viene redatto un budget economico previsionale annuale, approvato dall'organo amministrativo?",
        area: "Admin", sottoArea: "Pianificazione/Controllo", rilevanza: "P+ / Tutte", fonte: "FNC CL D.1, BP Budgeting",
        tipoRisposta: "SiNoParz", testoAiuto: "Esiste un documento previsionale formalizzato per l'anno successivo con obiettivi di ricavi, costi e margini?", ordine: 190, attiva: true, // Doc rimosso
        tags: ["amministrazione", "budget_economico", "previsionale_annuale", "approvazione_cda", "pianificazione_finanziaria", "budgeting"],
        dependsOn: []
    },
    {
        itemId: "C.3.2", domanda: "Il budget annuale è articolato per aree significative (es. prodotti, aree geografiche, centri di costo/ricavo)?",
        area: "Admin", sottoArea: "Pianificazione/Controllo", rilevanza: "M+ / M+", fonte: "FNC CL D.2, BP Controllo di Gestione",
        tipoRisposta: "SiNoParz", testoAiuto: "Il budget permette di analizzare la contribuzione delle diverse parti dell'azienda al risultato complessivo?", ordine: 200, attiva: true, // Doc rimosso
        tags: ["amministrazione", "budget_articolato", "centri_costo_ricavo", "controllo_gestione", "analisi_performance"],
        dependsOn: [
            { sourceItemId: "C.3.1", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "C.3.3", domanda: "Viene predisposto un budget di tesoreria previsionale (flussi di cassa) con cadenza almeno trimestrale?",
        area: "Admin", sottoArea: "Pianificazione/Controllo", rilevanza: "Tutte", fonte: "FNC CL D.3, Art. 2086, CCII Art.3, BP Cash Management",
        tipoRisposta: "SiNoParz", testoAiuto: "Si prevedono le entrate e le uscite monetarie future per verificare la copertura finanziaria?", ordine: 210, attiva: true, // Doc rimosso
        tags: ["amministrazione", "budget_tesoreria", "flussi_cassa", "pianificazione_finanziaria", "cash_management", "ccii", "crisi_liquidita"],
        dependsOn: []
    },
    {
        itemId: "C.3.4", domanda: "Viene effettuata un'analisi periodica (almeno trimestrale) degli scostamenti tra dati consuntivi e dati di budget/previsionali?",
        area: "Admin", sottoArea: "Pianificazione/Controllo", rilevanza: "P+ / Tutte", fonte: "FNC CL D.4, BP Controllo di Gestione",
        tipoRisposta: "SiNoParz", testoAiuto: "Si confrontano i risultati reali con gli obiettivi e si analizzano le cause delle differenze?", ordine: 220, attiva: true,
        tags: ["amministrazione", "analisi_scostamenti", "consuntivo_vs_budget", "controllo_gestione", "reporting_periodico"],
        dependsOn: [
            { sourceItemId: "C.3.1", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "C.3.5", domanda: "I risultati dell'analisi degli scostamenti vengono discussi con il management e portano ad azioni correttive?",
        area: "Admin", sottoArea: "Pianificazione/Controllo", rilevanza: "P+ / Tutte", fonte: "FNC CL D.4, BP Performance Management",
        tipoRisposta: "SiNoParz", testoAiuto: "L'analisi degli scostamenti è uno strumento attivo di gestione o una mera constatazione a posteriori?", ordine: 230, attiva: true,
        tags: ["amministrazione", "analisi_scostamenti", "azioni_correttive", "performance_management", "coinvolgimento_management"],
        dependsOn: [
            { sourceItemId: "C.3.4", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "C.3.6", domanda: "Vengono monitorati periodicamente KPI specifici (non solo dati di bilancio) per valutare le performance operative e strategiche?",
        area: "Admin", sottoArea: "Pianificazione/Controllo", rilevanza: "Tutte", fonte: "FNC CL A.7, D.5, Art. 2086, BP Performance Measurement",
        tipoRisposta: "SiNoParz", testoAiuto: "Si usano indicatori chiave (es. soddisfazione cliente, tempi consegna, qualità prodotto...) per monitorare l'andamento del business?", ordine: 240, attiva: true, // Txt rimosso
        tags: ["amministrazione", "kpi", "monitoraggio_performance", "indicatori_chiave", "performance_operative", "performance_strategiche"],
        dependsOn: []
    },
    {
        itemId: "C.3.7", domanda: "[*] Esiste un piano strategico/industriale pluriennale formalizzato e approvato?",
        area: "Admin", sottoArea: "Pianificazione/Controllo", rilevanza: "M+ / M+", fonte: "BP Pianificazione Strategica",
        tipoRisposta: "SiNoParz", testoAiuto: "L'azienda ha definito obiettivi e strategie a medio-lungo termine (3-5 anni)?", ordine: 250, attiva: true, // Doc rimosso
        tags: ["amministrazione", "piano_strategico", "piano_industriale", "pianificazione_pluriennale", "obiettivi_strategici"],
        dependsOn: []
    },
    {
        itemId: "C.4.1", domanda: "È stata effettuata una valutazione/mappatura dei principali rischi (operativi, finanziari, strategici, compliance, reputazionali, ESG)?",
        area: "Admin", sottoArea: "Gestione Rischi", rilevanza: "P+ / M+", fonte: "FNC CL D.8, ISA 315 (RA), COSO ERM",
        tipoRisposta: "SiNoParz", testoAiuto: "L'azienda ha identificato consapevolmente i rischi più significativi a cui è esposta?", ordine: 260, attiva: true, // Txt rimosso
        tags: ["amministrazione", "gestione_rischi", "mappatura_rischi", "rischi_operativi", "rischi_finanziari", "rischi_strategici", "rischi_compliance", "rischi_reputazionali", "rischi_esg", "coso_erm"],
        dependsOn: []
    },
    {
        itemId: "C.4.2", domanda: "Sono stati definiti e implementati presidi specifici per mitigare i rischi identificati come più rilevanti?",
        area: "Admin", sottoArea: "Gestione Rischi", rilevanza: "P+ / Tutte", fonte: "FNC CL D.9, ISA 315 (CA), COSO ERM",
        tipoRisposta: "SiNoParz", testoAiuto: "Per i rischi maggiori (es. perdita cliente chiave, guasto impianto critico, rischio cambio), cosa si è fatto per ridurne probabilità/impatto?", ordine: 270, attiva: true, // Txt rimosso
        tags: ["amministrazione", "gestione_rischi", "mitigazione_rischi", "presidi_controllo", "rischi_rilevanti", "coso_erm"],
        dependsOn: [
            { sourceItemId: "C.4.1", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "C.4.3", domanda: "È stato adottato (o motivatamente non adottato) un Modello Organizzativo ex D.Lgs. 231/01?",
        area: "Admin", sottoArea: "Gestione Rischi", rilevanza: "Tutte", fonte: "L. 231/01",
        tipoRisposta: "SiNo", testoAiuto: "È stata fatta l'analisi dei rischi-reato 231? Se sì, si è deciso di adottare/non adottare un Modello?", ordine: 280, attiva: true, // NA rimosso
        tags: ["amministrazione", "modello_231", "d_lgs_231_01", "rischi_reato", "compliance_normativa"],
        dependsOn: []
    },
    {
        itemId: "C.4.4", domanda: "Se adottato, il Modello 231 è aggiornato, efficacemente attuato e l'OdV è operativo?",
        area: "Admin", sottoArea: "Gestione Rischi", rilevanza: "Tutte", fonte: "L. 231/01, Giurisprudenza",
        tipoRisposta: "SiNoParz", testoAiuto: "Il modello viene aggiornato? Il personale è formato? L'Organismo di Vigilanza si riunisce, vigila e relaziona?", ordine: 290, attiva: true, // NA rimosso
        tags: ["amministrazione", "modello_231", "aggiornamento_modello", "attuazione_modello", "odv_operativo", "organismo_vigilanza"],
        dependsOn: [
            { sourceItemId: "C.4.3", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "C.4.5", domanda: "[*] Vengono monitorati e gestiti i rischi ESG (Ambientali, Sociali, Governance) rilevanti per l'azienda?",
        area: "Admin", sottoArea: "Gestione Rischi", rilevanza: "M+ / M+", fonte: "Linee Guida EBA, Tassonomia UE, BP Sostenibilità",
        tipoRisposta: "SiNoParz", testoAiuto: "Si considerano i rischi legati all'ambiente, all'impatto sociale, alla correttezza della governance nelle decisioni e nei controlli?", ordine: 300, attiva: true,
        tags: ["amministrazione", "rischi_esg", "sostenibilita", "ambientale", "sociale", "governance", "monitoraggio_esg"],
        dependsOn: []
    },

    // === AREA D: ASSETTO CONTABILE ===
    {
        itemId: "D.1.1", domanda: "Le registrazioni contabili sono effettuate con regolarità e tempestività adeguate a supportare il monitoraggio gestionale (es. entro 15-20 gg fine mese)?",
        area: "Acct", sottoArea: "Sistema Contabile", rilevanza: "Tutte", fonte: "FNC CL C.3, CC Artt. 2214, 2219, BP",
        tipoRisposta: "SiNoParz", testoAiuto: "La contabilità viene aggiornata abbastanza velocemente da permettere analisi su dati recenti?", ordine: 310, attiva: true,
        tags: ["contabilita", "registrazioni_contabili", "regolarita", "tempestivita", "monitoraggio_gestionale", "chiusure_mensili"],
        dependsOn: []
    },
    {
        itemId: "D.1.2", domanda: "Vengono effettuate sistematicamente e tempestivamente le principali riconciliazioni contabili (Banche, Cassa, Clienti, Fornitori, IVA)?",
        area: "Acct", sottoArea: "Sistema Contabile", rilevanza: "Tutte", fonte: "FNC CL C.4, BP Controllo Interno Contabile",
        tipoRisposta: "SiNoParz", testoAiuto: "Si verificano periodicamente le corrispondenze tra saldi contabili e dati esterni (estratti conto) o interni (scadenziari, registri IVA)?", ordine: 320, attiva: true,
        tags: ["contabilita", "riconciliazioni_contabili", "banche", "cassa", "clienti", "fornitori", "iva", "controllo_interno_contabile"],
        dependsOn: []
    },
    {
        itemId: "D.1.3", domanda: "Vengono prodotte situazioni contabili infra-annuali (Bilancini di verifica) complete, corrette e con cadenza adeguata (min. trimestrale)?",
        area: "Acct", sottoArea: "Sistema Contabile", rilevanza: "P+ / Tutte", fonte: "FNC CL C.5, BP Reporting Interno",
        tipoRisposta: "SiNoParz", testoAiuto: "Esistono report contabili periodici che presentino almeno Stato Patrimoniale e Conto Economico aggiornati?", ordine: 330, attiva: true, // Doc rimosso
        tags: ["contabilita", "situazioni_infra_annuali", "bilancini_verifica", "reporting_interno", "stato_patrimoniale", "conto_economico"],
        dependsOn: []
    },
    {
        itemId: "D.1.4", domanda: "[*] Esiste una contabilità analitica/industriale che permetta il calcolo e monitoraggio di costi e margini per CdC/Prodotto/Commessa?",
        area: "Acct", sottoArea: "Sistema Contabile", rilevanza: "M+ / M+", fonte: "FNC CL D.7, BP Controllo di Gestione Avanzato",
        tipoRisposta: "SiNoParz", testoAiuto: "Si dispone di informazioni dettagliate sui costi e sulla redditività delle singole aree di business?", ordine: 340, attiva: true, // NA rimosso
        tags: ["contabilita", "contabilita_analitica", "contabilita_industriale", "costi_margini", "cdc", "prodotto", "commessa", "controllo_gestione_avanzato"],
        dependsOn: []
    },
    {
        itemId: "D.1.5", domanda: "La gestione contabile del magazzino (valorizzazione LIFO/FIFO/CMP, scritture ausiliarie) è corretta, tempestiva e conforme ai PC?",
        area: "Acct", sottoArea: "Sistema Contabile", rilevanza: "Tutte", fonte: "FNC CL D.11, PC OIC 13, CC Art. 2426 n.9",
        tipoRisposta: "SiNoParz", testoAiuto: "Le rimanenze vengono valorizzate correttamente? Le scritture ausiliarie di magazzino (se obbligatorie) sono tenute e aggiornate?", ordine: 350, attiva: true, // NA rimosso
        tags: ["contabilita", "gestione_magazzino", "valorizzazione_lifo_fifo_cmp", "scritture_ausiliarie", "oic_13", "rimanenze"],
        dependsOn: []
    },
    {
        itemId: "D.1.6", domanda: "[*] Il sistema contabile permette una tracciabilità adeguata delle transazioni (audit trail)?",
        area: "Acct", sottoArea: "Sistema Contabile", rilevanza: "M+ / M+", fonte: "ISA 315 (IC), BP Auditabilità",
        tipoRisposta: "SiNoParz", testoAiuto: "È possibile ricostruire facilmente il percorso di una registrazione contabile dalla pezza giustificativa al bilancio e viceversa?", ordine: 360, attiva: true,
        tags: ["contabilita", "tracciabilita_transazioni", "audit_trail", "isa_315", "auditabilita"],
        dependsOn: []
    },
    {
        itemId: "D.2.1", domanda: "Il bilancio d'esercizio (e consolidato, se applicabile) viene redatto e approvato nei termini previsti dalla legge/statuto?",
        area: "Acct", sottoArea: "Reporting/Bilancio", rilevanza: "Tutte", fonte: "CC Artt. 2364, 2423, 2478-bis",
        tipoRisposta: "SiNo", testoAiuto: "Vengono rispettate le scadenze per l'approvazione del bilancio?", ordine: 370, attiva: true,
        tags: ["contabilita", "bilancio_esercizio", "bilancio_consolidato", "termini_legge", "approvazione_bilancio"],
        dependsOn: []
    },
    {
        itemId: "D.2.2", domanda: "Le politiche contabili adottate sono conformi ai Principi Contabili Nazionali (OIC) o Internazionali (IAS/IFRS) applicabili?",
        area: "Acct", sottoArea: "Reporting/Bilancio", rilevanza: "Tutte", fonte: "CC Art. 2423, PC, ISA",
        tipoRisposta: "SiNo", testoAiuto: "I criteri di valutazione e rappresentazione usati in bilancio sono corretti?", ordine: 380, attiva: true,
        tags: ["contabilita", "politiche_contabili", "oic", "ias_ifrs", "principi_contabili", "correttezza_bilancio"],
        dependsOn: []
    },
    {
        itemId: "D.2.3", domanda: "Le politiche contabili sono applicate coerentemente e costantemente nel tempo (principio di continuità)?",
        area: "Acct", sottoArea: "Reporting/Bilancio", rilevanza: "Tutte", fonte: "CC Art. 2423-bis n.6, PC OIC 11, ISA 570",
        tipoRisposta: "SiNo", testoAiuto: "I criteri di valutazione vengono cambiati frequentemente o solo in casi eccezionali e motivati?", ordine: 390, attiva: true,
        tags: ["contabilita", "politiche_contabili", "coerenza", "continuita_aziendale", "oic_11", "isa_570"],
        dependsOn: []
    },
    {
        itemId: "D.2.4", domanda: "[*] La Nota Integrativa fornisce tutte le informazioni qualitative e quantitative richieste dai PC e dalla normativa?",
        area: "Acct", sottoArea: "Reporting/Bilancio", rilevanza: "P+ / Tutte", fonte: "CC Art. 2427, PC specifici",
        tipoRisposta: "SiNoParz", testoAiuto: "La Nota Integrativa è completa e chiara nell'illustrare le voci di bilancio e le politiche contabili?", ordine: 400, attiva: true,
        tags: ["contabilita", "nota_integrativa", "informazioni_bilancio", "completezza_ni", "chiarezza_ni", "art_2427"],
        dependsOn: [
            { sourceItemId: "D.2.1", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "D.2.5", domanda: "[*] Viene effettuata la valutazione per impairment test sugli asset quando richiesto dai PC (OIC 9 / IAS 36)?",
        area: "Acct", sottoArea: "Reporting/Bilancio", rilevanza: "M+ / M+", fonte: "PC OIC 9, IAS 36",
        tipoRisposta: "SiNoParz", testoAiuto: "In presenza di indicatori di perdita di valore, vengono effettuati i test di impairment previsti per immobilizzazioni e avviamento?", ordine: 410, attiva: true, // NA rimosso
        tags: ["contabilita", "impairment_test", "oic_9", "ias_36", "valutazione_asset", "perdita_valore_asset"],
        dependsOn: [
            { sourceItemId: "D.2.1", expectedAnswer: "Si" }
        ]
    },


    // === AREA E: CAPACITÀ RILEVAZIONE CRISI ===
    {
        itemId: "E.1", domanda: "Il complesso degli assetti Org/Amm/Cont (procedure, controlli, reporting, IT) consente di identificare tempestivamente segnali di squilibrio economico-finanziario?",
        area: "Crisi", sottoArea: "Allerta Precoce", rilevanza: "Tutte", fonte: "Art. 2086 c.2, CCII Art.3, FNC CL A.7, ISA 570",
        tipoRisposta: "SiNoParz", testoAiuto: "Valutazione di sintesi: il sistema nel suo insieme (come emerso dalle risposte precedenti) è strutturato per far emergere i problemi prima che siano gravi?", ordine: 420, attiva: true, // Txt rimosso
        tags: ["crisi", "allerta_precoce", "assetti_adeguati", "squilibrio_economico_finanziario", "identificazione_tempestiva", "art_2086", "ccii_art_3"],
        dependsOn: []
    },
    {
        itemId: "E.2", domanda: "Vengono specificamente calcolati e monitorati gli indici della crisi previsti dall'art. 13 CCII e/o gli indicatori elaborati dal CNDCEC?",
        area: "Crisi", sottoArea: "Allerta Precoce", rilevanza: "Tutte", fonte: "CCII Art. 3, Art. 13, Documenti CNDCEC",
        tipoRisposta: "SiNoParz", testoAiuto: "Si utilizzano gli strumenti specifici definiti dalla normativa/prassi per l'allerta crisi (es. DSCR a 6 mesi, Indici CNDCEC)?", ordine: 430, attiva: true, // Txt rimosso
        tags: ["crisi", "allerta_precoce", "indicatori_crisi", "ccii_art_13", "cndcec", "monitoraggio_indici", "dscr"],
        dependsOn: []
    },
    {
        itemId: "E.3", domanda: "Esiste una procedura definita (chiara e formalizzata) per la gestione interna dei segnali di allerta rilevati (chi informa chi, cosa fare, tempi)?",
        area: "Crisi", sottoArea: "Allerta Precoce", rilevanza: "P+ / M+", fonte: "Art. 2086 c.2, CCII Art.3, BP Crisis Management",
        tipoRisposta: "SiNoParz", testoAiuto: "Se un indice/segnale supera una soglia, è chiaro chi deve essere informato e quali passi successivi devono essere intrapresi?", ordine: 440, attiva: true, // Doc rimosso
        tags: ["crisi", "allerta_precoce", "procedura_allerta", "gestione_segnali_crisi", "crisis_management", "flusso_informativo_crisi"],
        dependsOn: [
            { sourceItemId: "E.2", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "E.4", domanda: "L'organo amministrativo valuta periodicamente e formalmente la capacità dell'impresa di mantenere la continuità aziendale (Going Concern)?",
        area: "Crisi", sottoArea: "Continuità Aziend.", rilevanza: "Tutte", fonte: "Art. 2086 c.2, ISA 570, OIC 11, CC Art. 2381 (implic.)",
        tipoRisposta: "SiNoParz", testoAiuto: "La valutazione della continuità è un'attività esplicita e documentata (es. nei verbali CdA, nella Relazione sulla Gestione)?", ordine: 450, attiva: true,
        tags: ["crisi", "continuita_aziendale", "going_concern", "valutazione_periodica", "organo_amministrativo", "isa_570", "oic_11"],
        dependsOn: []
    },
    {
        itemId: "E.5", domanda: "La valutazione sulla continuità aziendale è supportata da piani, budget e analisi prospettiche (es. stress test) considerati attendibili?",
        area: "Crisi", sottoArea: "Continuità Aziend.", rilevanza: "P+ / Tutte", fonte: "Art. 2086 c.2, ISA 570, OIC 11, ODCEC BP Guide",
        tipoRisposta: "SiNoParz", testoAiuto: "Su quali basi (documenti previsionali, analisi di sensitività) viene fondata l'affermazione che l'azienda può continuare ad operare?", ordine: 460, attiva: true, // Doc rimosso
        tags: ["crisi", "continuita_aziendale", "piani_budget_prospettici", "stress_test", "analisi_sensitivita", "isa_570", "oic_11"],
        dependsOn: [
            { sourceItemId: "E.4", expectedAnswer: "Si" }
        ]
    },
    {
        itemId: "E.6", domanda: "In caso di segnali di crisi o dubbi sulla continuità, l'organo amministrativo si attiva 'senza indugio' per adottare gli strumenti di risanamento/composizione?",
        area: "Crisi", sottoArea: "Reazione alla Crisi", rilevanza: "Tutte", fonte: "Art. 2086 c.2, CCII Art.3",
        tipoRisposta: "SiNoParz", testoAiuto: "A fronte di difficoltà, l'organo amministrativo ha dimostrato reattività nel prendere iniziative (anche se poi non risolutive)?", ordine: 470, attiva: true, // NA rimosso
        tags: ["crisi", "reazione_crisi", "attivazione_organo_amministrativo", "strumenti_risanamento", "art_2086", "ccii_art_3", "composizione_crisi"],
        dependsOn: []
    },

];
// ------------- FINE DATI TEMPLATE -------------\


// --- Funzione di Seed ---
const seedDatabase = async () => {
    try {
        // --- MODIFICA QUI L'URI DI CONNESSIONE ---
        // Se lo script viene eseguito localmente (non in Docker), usa localhost.
        // Altrimenti, se è in Docker (es. tramite una entrypoint o un comando nello script di avvio del container), 
        // potrebbe usare l'hostname 'mongodb'.
        // Per lo script di seed eseguito manualmente, quasi sicuramente vorrai 'localhost'.
        const mongoUri = process.env.MONGO_URI_SEED || process.env.MONGO_URI || 'mongodb://localhost:27017/aao_system';
        // Ho aggiunto MONGO_URI_SEED come opzione per avere un override specifico per il seed se necessario.
        // Se MONGO_URI nel tuo .env è già 'mongodb://mongodb:27017/aao_system',
        // lo script di seed userà 'mongodb://localhost:27017/aao_system' come fallback se MONGO_URI_SEED non è impostato.
        // Oppure, più semplicemente per l'esecuzione locale:
        // const mongoUri = 'mongodb://localhost:27017/aao_system'; 
        // ------------------------------------------

        console.log(`Tentativo connessione a MongoDB per SEED: ${mongoUri}`);
        await mongoose.connect(mongoUri);
        console.log('MongoDB connesso per SEED.');

        console.log('Svuotamento collection questiontemplates...');
        await QuestionTemplate.deleteMany({});
        console.log('Collection questiontemplates svuotata.');

        console.log(`Inserimento di ${templateData.length} template con tags...`);
        // La logica per 'attiva: true' di default è già nello schema QuestionTemplate
        // Non è necessario aggiungerla qui se lo schema ha un default: true
        // Se lo schema non ha default, allora:
        // const dataToInsert = templateData.map(t => ({ ...t, attiva: t.attiva !== undefined ? t.attiva : true, tags: t.tags || [] }));
        // Ma è meglio se lo schema gestisce i default. Assicurati che il campo tags sia gestito (default: [] nello schema è ok)
        const dataToInsert = templateData.map(t => ({ ...t, attiva: t.attiva !== undefined ? t.attiva : true, tags: t.tags || [] }));
        await QuestionTemplate.insertMany(dataToInsert);
        console.log('Template inseriti con successo!');

    } catch (error) {
        console.error('!!! ERRORE durante il seeding del database:', error);
        if (error.message.includes("ECONNREFUSED")) {
            console.error(">>> POSSIBILE CAUSA: Il container MongoDB non è in esecuzione o la porta non è mappata correttamente.");
            console.error(">>> Assicurati che 'docker-compose up -d mongodb' (o 'docker-compose up -d') sia stato eseguito e che il container sia attivo.");
        }
        process.exit(1); // Esce con errore
    } finally {
        // Disconnetti da MongoDB
        if (mongoose.connection.readyState === 1) { // Controlla se la connessione è stata stabilita
            await mongoose.disconnect();
            console.log('Disconnesso da MongoDB dopo SEED.');
        }
    }
};

// Esegui la funzione di seed
seedDatabase();

// END OF FILE server/scripts/seedTemplates.js