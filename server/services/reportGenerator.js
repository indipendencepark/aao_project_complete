// START OF FILE server/services/reportGenerator.js (NUOVO FILE)

const { Checklist, Gap } = require('../models/diagnosi');
const { 
    analyzeComplianceEBA, 
    commentComplianceSSM, 
    analyzePredisposizioneVisti 
} = require('./complianceAnalyzerAI'); // NUOVO IMPORT
// Potremmo importare regole specifiche per il report da un file dedicato
// const reportRules = require('../knowledge/reportRules');

/**
 * Calcola statistiche sui gap e genera giudizi sintetici.
 * @param {Array<object>} gaps - Array dei documenti Gap per la checklist.
 * @returns {object} Oggetto con statistiche e giudizi.
 */
const analyzeGaps = (gaps) => {
    const stats = {
        totalGaps: gaps.length,
        countByRisk: { alto: 0, medio: 0, basso: 0 },
        countByArea: { Org: 0, Admin: 0, Acct: 0, Crisi: 0 },
        riskCountByArea: {
            Org: { alto: 0, medio: 0, basso: 0 },
            Admin: { alto: 0, medio: 0, basso: 0 },
            Acct: { alto: 0, medio: 0, basso: 0 },
            Crisi: { alto: 0, medio: 0, basso: 0 }
        }
    };

    // Mappa inizio ID Domanda -> Area (semplificata, potrebbe essere migliorata)
    const getAreaFromItemId = (itemId) => {
        if (!itemId) return 'Altro';
        const prefix = itemId.split('.')[0]?.toUpperCase();
        if (prefix === 'B') return 'Org';
        if (prefix === 'C') return 'Admin';
        if (prefix === 'D') return 'Acct';
        if (prefix === 'E') return 'Crisi';
        return 'Altro'; // O gestisci diversamente Prefissi non noti
    };
    
// Dentro analyzeGaps
gaps.forEach(gap => {
    const risk = gap.livello_rischio; // <-- USA IL RISCHIO DAL DB (ARRICCHITO)
    const area = getAreaFromItemId(gap.item_id);

        if (stats.countByRisk[risk] !== undefined) {
            stats.countByRisk[risk]++;
        }
        if (stats.countByArea[area] !== undefined) {
            stats.countByArea[area]++;
        }
        if (stats.riskCountByArea[area] && stats.riskCountByArea[area][risk] !== undefined) {
            stats.riskCountByArea[area][risk]++;
        }
    });

    // --- Logica per i Giudizi Sintetici (Rule-Based Semplificata) ---
    // Queste soglie vanno calibrate!
    let giudizioGenerale = 'ADEGUATO';
    if (stats.countByRisk.alto > 2 || stats.countByRisk.medio > 5 || stats.totalGaps > 10) {
        giudizioGenerale = 'INADEGUATO';
    } else if (stats.countByRisk.alto > 0 || stats.countByRisk.medio > 2 || stats.totalGaps > 5) {
        giudizioGenerale = 'PARZIALMENTE ADEGUATO';
    }

    const giudiziArea = {};
    for (const area of Object.keys(stats.countByArea)) {
        if (stats.countByArea[area] === 0) {
            giudiziArea[area] = 'ADEGUATO'; // Nessun gap nell'area
        } else if (stats.riskCountByArea[area]?.alto > 1 || stats.riskCountByArea[area]?.medio > 3) {
            giudiziArea[area] = 'INADEGUATO';
        } else if (stats.riskCountByArea[area]?.alto > 0 || stats.riskCountByArea[area]?.medio > 1) {
            giudiziArea[area] = 'PARZIALMENTE ADEGUATO';
        } else {
            giudiziArea[area] = 'ADEGUATO (con gap minori)'; // Gap solo bassi o pochi medi
        }
    }
    // --- Fine Logica Giudizi ---

    return {
        stats,
        giudizioGenerale,
        giudiziArea
    };
};

/**
 * Identifica le aree di forza basandosi sulle risposte positive nella checklist.
 * @param {Array<object>} answers - Array delle risposte dalla checklist.
 * @returns {Array<string>} Lista di descrizioni aree di forza.
 */
const identifyStrengths = (answers) => {
    if (!answers || !Array.isArray(answers)) return [];
    // Identifica risposte 'Si' come punti di forza (semplificazione)
    const strengths = answers
        .filter(a => String(a.risposta).toLowerCase() === 'si')
        .slice(0, 7) // Limita per brevità
        .map(a => `${a.itemId}: ${a.domandaText}`); // Mostra ID e domanda
    return strengths;
};

/**
 * Ordina i gap per priorità (prima Alto, poi Medio).
 * @param {Array<object>} gaps - Array dei documenti Gap.
 * @returns {Array<object>} Array dei gap ordinati per priorità.
 */
const prioritizeGaps = (gaps) => {
    const riskOrder = { 'alto': 1, 'medio': 2, 'basso': 3 };
    return [...gaps].sort((a, b) => {
        const orderA = riskOrder[a.livello_rischio] || 9;
        const orderB = riskOrder[b.livello_rischio] || 9;
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        // A parità di rischio, ordina per ID item
        return (a.item_id || "").localeCompare(b.item_id || "");
    });
};


/**
 * Genera il contenuto strutturato per il report diagnostico.
 * @param {string} checklistId - ID della checklist da analizzare.
 * @returns {Promise<object>} Oggetto contenente i dati completi per il report.
 * @throws {Error} Se la checklist non viene trovata.
 */
const generateReportContent = async (checklistId) => {
    console.log(
      `>>> Servizio reportGenerator (D5.1 ARRICCHITO - Conformità Doc 1 & 4): Avvio per Checklist ID: ${checklistId}`
    );

    const checklist = await Checklist.findById(checklistId)
        .select('nome descrizione cliente stato data_creazione data_compilazione answers')
        .lean();

    if (!checklist) {
        throw new Error('Checklist non trovata.');
    }
    if (!checklist.answers || !Array.isArray(checklist.answers)) {
        console.warn(`Checklist ${checklistId} non ha un array 'answers' valido.`);
        checklist.answers = []; // Assicura che sia un array per evitare errori dopo
    }

    const gaps = await Gap.find({ checklist_id: checklistId }).lean();
    console.log(`>>> Trovati ${gaps.length} gap per la checklist.`);

    const { stats: gapStats, giudizioGenerale: giudizioBase, giudiziArea } = analyzeGaps(gaps);
    const areeForza = identifyStrengths(checklist.answers);
    const gapOrdinati = prioritizeGaps(gaps);
    const gapPrioritari = gapOrdinati.filter(g => g.livello_rischio === 'alto' || g.livello_rischio === 'medio').slice(0, 5);
    const areeDebolezza = gapPrioritari.map(g => `${g.item_id}: ${g.descrizione}`);


    // --- INIZIO LOGICA PER ANALISI CONFORMITÀ (MODIFICATA) ---
    const analisiConformita = {
        cndcec: [],
        sistemiAllertaCCII: [],
        eba: [],
        ssmArt2086: [],
        predisposizioneVistiCNDCEC: []
    };

    // 1. Conformità CNDCEC Check-list operative (Doc 1) - ARRICCHITA
    if (checklist.answers.length > 0) {
        for (const answer of checklist.answers) {
            if (!answer.itemId || !answer.domandaText) { // Controllo aggiuntivo
                console.warn("Trovata risposta senza itemId o domandaText:", answer);
                continue;
            }

            let valutazione = 'Non Valutato';
            if (answer.risposta === 'Si') valutazione = 'Conforme';
            else if (answer.risposta === 'No') valutazione = 'Non Conforme';
            else if (answer.risposta === 'Parziale') valutazione = 'Parzialmente Conforme';
            else if (answer.risposta === 'NA') valutazione = 'Non Applicabile';
            else if (answer.risposta === null || answer.risposta === undefined || String(answer.risposta).trim() === '') valutazione = 'Non Risposto';


            const gapCorrispondente = gaps.find(g => g.item_id === answer.itemId);

            analisiConformita.cndcec.push({
                puntoCNDCEC: answer.itemId,
                descrizionePunto: answer.domandaText,
                rispostaUtente: String(answer.risposta ?? 'Non Risposto'),
                valutazioneConformita: valutazione,
                gapCorrelatoId: gapCorrispondente ? gapCorrispondente._id : null,
                noteGap: gapCorrispondente ? gapCorrispondente.descrizione : null,
                // --- NUOVI CAMPI AGGIUNTI ---
                notaUtenteChecklist: answer.note || null,
                fonteNormativaPunto: answer.fonte || null // Assumendo che 'answer' in checklist.answers abbia 'fonte'
                // Se 'fonte' non è in checklist.answers, dovresti recuperarla da QuestionTemplate
                // basandoti su answer.questionTemplate (ObjectId) o answer.itemId.
                // Per ora, assumiamo che answer.fonte esista o sia null.
                // -----------------------------
            });
        }
        analisiConformita.cndcec.sort((a, b) => (a.puntoCNDCEC || "").localeCompare(b.puntoCNDCEC || ""));
        console.log(`>>> Conformità CNDCEC (Doc 1): Processati ${analisiConformita.cndcec.length} punti (con note e fonte).`);
    }


    // 2. Conformità Sistemi di Allerta Interna (Doc 4) - ARRICCHITA
    const helperCheckRispostaAllerta = (itemId, validAnswers = ["Si"]) => { // Rinominata per chiarezza
        const answerDoc = checklist.answers.find(a => a.itemId === itemId);
        // const domandaText = answerDoc?.domandaText || "Informazione domanda non disponibile"; // Pre-calcola per usarlo ovunque

        if (!answerDoc || answerDoc.risposta === null || answerDoc.risposta === undefined) {
            const domandaTextRecuperata = answerDoc?.domandaText || `itemId ${itemId} (domanda non caricata/trovata)`;
            return { 
                valore: 'Non Risposto', 
                valutazione: 'Da Verificare Manualmente', 
                nota: `Risposta mancante per ${itemId}: ${domandaTextRecuperata}.`,
                domandaText: domandaTextRecuperata
            };
        }
        const rispostaData = String(answerDoc.risposta);
        const domandaText = answerDoc.domandaText || itemId; // Se non c'è domandaText usa itemId

        if (rispostaData === 'NA') {
            return { valore: rispostaData, valutazione: 'Non Applicabile', nota: `Item ${itemId} ('${domandaText}') non applicabile.`, domandaText };
        }
        if (validAnswers.includes(rispostaData)) {
            return { valore: rispostaData, valutazione: 'Adeguato/Presente', nota: `Item ${itemId} ('${domandaText}') conforme.`, domandaText };
        }
        if (rispostaData === 'Parziale') {
            return { valore: rispostaData, valutazione: 'Parzialmente Adeguato', nota: `Item ${itemId} ('${domandaText}') parzialmente implementato.`, domandaText };
        }
        // Modifica per includere domandaText nella nota per criticità
        return { valore: rispostaData, valutazione: 'Carente/Non Adeguato', nota: `Criticità rilevata per ${itemId} ('${domandaText}', risposta: ${rispostaData}).`, domandaText };
    };
    
    // Aspetto: Monitoraggio Indici di Crisi
    const e2_allerta = helperCheckRispostaAllerta("E.2");
    analisiConformita.sistemiAllertaCCII.push({
        aspettoValutato: "Monitoraggio Indici di Crisi (ex Art. 3 CCII, Doc. CNDCEC, Quaderno 71 ODCEC)",
        risposteRilevanti: [{ itemId: "E.2", risposta: e2_allerta.valore, domandaText: e2_allerta.domandaText }],
        valutazioneConformita: e2_allerta.valutazione,
        noteOsservazioni: e2_allerta.valutazione !== 'Adeguato/Presente' && e2_allerta.valutazione !== 'Non Applicabile' ? 
            `È cruciale implementare o rafforzare il monitoraggio degli indici di crisi. ${e2_allerta.nota}` : 
            `L'azienda dichiara di monitorare gli indici di crisi. ${e2_allerta.nota}`,
        implicazioniNonConformitaTestuali: e2_allerta.valutazione.includes('Carente') || e2_allerta.valutazione.includes('Parzialmente') || e2_allerta.valutazione.includes('Manualmente') ? 
            "Rischio di mancata tempestiva rilevazione della crisi come richiesto da Art.3 CCII. Verificare l'effettiva implementazione e adeguatezza del monitoraggio." : null
    });

    // Aspetto: Procedura Gestione Allerta
    const e3_allerta = helperCheckRispostaAllerta("E.3");
    analisiConformita.sistemiAllertaCCII.push({
        aspettoValutato: "Procedura Interna per la Gestione dei Segnali di Allerta (Quaderno 71 ODCEC)",
        risposteRilevanti: [{ itemId: "E.3", risposta: e3_allerta.valore, domandaText: e3_allerta.domandaText }],
        valutazioneConformita: e3_allerta.valutazione,
        noteOsservazioni: e3_allerta.valutazione !== 'Adeguato/Presente' && e3_allerta.valutazione !== 'Non Applicabile' ?
            `È necessario definire e formalizzare una procedura chiara per la gestione interna delle allerte. ${e3_allerta.nota}` :
            `L'azienda dichiara di avere una procedura per la gestione delle allerte. ${e3_allerta.nota}`,
        implicazioniNonConformitaTestuali: e3_allerta.valutazione.includes('Carente') || e3_allerta.valutazione.includes('Parzialmente') || e3_allerta.valutazione.includes('Manualmente') ?
            "Possibile reazione tardiva o disorganizzata ai segnali di crisi, con aggravamento della situazione aziendale. Verificare esistenza, completezza e applicazione della procedura." : null
    });

    // Aspetto: Coinvolgimento Organo di Controllo nell'Allerta
    const b43_allerta = helperCheckRispostaAllerta("B.4.3");
    const b44_allerta = helperCheckRispostaAllerta("B.4.4");
    let valutazioneOrgCtrlAllerta = "Da Verificare Manualmente";
    let noteOrgCtrlAllerta = `Risposte: B.4.3 ('${b43_allerta.domandaText}') - ${b43_allerta.valore}; B.4.4 ('${b44_allerta.domandaText}') - ${b44_allerta.valore}. `;
    let implicazioniOrgCtrlAllerta = "Verifica manuale necessaria per determinare le implicazioni specifiche.";


    if (b43_allerta.valutazione === "Non Applicabile") {
        valutazioneOrgCtrlAllerta = "Non Applicabile";
        noteOrgCtrlAllerta += "Organo di controllo non previsto/applicabile per l'azienda.";
        implicazioniOrgCtrlAllerta = null; // Nessuna implicazione di non conformità se non applicabile
    } else if (b43_allerta.valutazione === "Carente/Non Adeguato" || b43_allerta.valutazione === "Da Verificare Manualmente" && b43_allerta.valore === 'Non Risposto') { 
        valutazioneOrgCtrlAllerta = "Fortemente Carente";
        noteOrgCtrlAllerta += `Mancata nomina/operatività dell'organo di controllo (${b43_allerta.domandaText}), se obbligatorio, o risposta mancante. Questo impatta significativamente la gestione dell'allerta. ${b43_allerta.nota} ${b44_allerta.nota}`;
        implicazioniOrgCtrlAllerta = "Grave deficit nel sistema di vigilanza sull'allerta, potenziali responsabilità per omesso controllo o mancata vigilanza. Verificare obbligatorietà e stato dell'organo di controllo.";
    } else if (b43_allerta.valutazione === "Adeguato/Presente") {
        if (b44_allerta.valutazione === "Adeguato/Presente") {
            valutazioneOrgCtrlAllerta = "Adeguato/Presente";
            noteOrgCtrlAllerta += `L'organo di controllo (${b43_allerta.domandaText}) è presente e i flussi informativi (${b44_allerta.domandaText}) per l'allerta sono dichiarati adeguati.`;
            implicazioniOrgCtrlAllerta = null;
        } else { // b44_allerta non Adeguato/Presente (Carente, Parziale, Non Risposto)
            valutazioneOrgCtrlAllerta = "Parzialmente Adeguato";
            noteOrgCtrlAllerta += `L'organo di controllo (${b43_allerta.domandaText}) è presente, ma i flussi informativi specifici (${b44_allerta.domandaText}) per la gestione dell'allerta potrebbero necessitare di rafforzamento/formalizzazione o non sono stati valutati. ${b44_allerta.nota}`;
            implicazioniOrgCtrlAllerta = "L'organo di controllo potrebbe non ricevere informazioni sufficienti o tempestive per una vigilanza efficace sull'allerta. Verificare la natura e l'adeguatezza dei flussi informativi.";
        }
    } // Altri casi (es. B.4.3 Parziale) mantengono "Da Verificare Manualmente" o si potrebbe dettagliare
    analisiConformita.sistemiAllertaCCII.push({
        aspettoValutato: "Coinvolgimento Organo di Controllo nella Gestione dell'Allerta (Quaderno 71 ODCEC)",
        risposteRilevanti: [
            { itemId: "B.4.3", risposta: b43_allerta.valore, domandaText: b43_allerta.domandaText },
            { itemId: "B.4.4", risposta: b44_allerta.valore, domandaText: b44_allerta.domandaText }
        ],
        valutazioneConformita: valutazioneOrgCtrlAllerta,
        noteOsservazioni: noteOrgCtrlAllerta,
        implicazioniNonConformitaTestuali: implicazioniOrgCtrlAllerta
    });
    console.log(`>>> Conformità Sistemi Allerta (Doc 4): Processati ${analisiConformita.sistemiAllertaCCII.length} aspetti (con implicazioni).`);
    // --- FINE LOGICA PER ANALISI CONFORMITÀ (MODIFICATA) ---

    // --- INIZIO LOGICA PER DOC 3: EBA - Linee guida prestiti ---
    console.log(">>> Avvio analisi conformità EBA (Doc 3) con servizio AI dedicato...");
    const principiEBAdaValutare = [
        { id: "EBA_GOV_AZ", titolo: "Governance Interna e Adeguatezza Assetti Azienda Mutuataria (Rif. EBA GL Sez. 5.1.1)", testoRiferimentoEBA: "Le istituzioni dovrebbero valutare il modello di business del mutuatario, la sua strategia, la sua governance e la qualità della sua gestione, poiché questi fattori possono influenzare la sua capacità di generare reddito e flussi di cassa sostenibili.", domandeRilevanti: ["B.1.3", "C.4.1"] },
        { id: "EBA_CAP_RIMB", titolo: "Valutazione Capacità di Rimborso (Rif. EBA GL Sez. 5.1.2)", testoRiferimentoEBA: "La valutazione del merito creditizio dovrebbe basarsi su una stima realistica e sostenibile del reddito e dei flussi di cassa futuri del mutuatario. Le istituzioni dovrebbero effettuare analisi di sensitività.", domandeRilevanti: ["C.3.3", "E.5"] },
        { id: "EBA_ESG_RISK", titolo: "Considerazione Rischi ESG (Rif. EBA GL Sez. 5.1.4)", testoRiferimentoEBA: "Le istituzioni dovrebbero integrare i rischi ESG nelle loro politiche di rischio di credito e nelle valutazioni del merito creditizio, considerando come tali fattori possano influenzare la capacità di rimborso del mutuatario.", domandeRilevanti: ["C.4.5"] },
        // Aggiungi altri principi chiave EBA che vuoi valutare
    ];

    // SIMULAZIONE CHIAMATA AI per ogni principio EBA (da sostituire con vera chiamata a complianceAnalyzerAI.js)
    for (const principio of principiEBAdaValutare) {
        const valutazioneTestualeAI_EBA = await analyzeComplianceEBA(principio, checklist.answers, checklist.cliente);
        analisiConformita.eba.push({
            principioEBA: principio.titolo,
            valutazioneAI: valutazioneTestualeAI_EBA,
            domandeChecklistCorrelate: principio.domandeRilevanti
        });
    }
    console.log(`>>> Conformità EBA (Doc 3): Processati ${analisiConformita.eba.length} principi.`);
    // --- FINE LOGICA PER DOC 3 ---

    // --- INIZIO LOGICA PER DOC 5: SSM - Assetti Organizzativi (Art. 2086) ---
    console.log(">>> Avvio analisi conformità SSM Art. 2086 (Doc 5) con servizio AI...");
    const executiveSummaryGiaGenerato = reportData.sintesi_esecutiva || (await generateExecutiveSummaryAI(datiPerAISummary, checklist.cliente)); // Assicurati sia disponibile
    const aspettiChiaveSSM = [
        { id: "SSM_DOVERE_ASSETTI", titolo: "Dovere di Istituire Assetti Adeguati (Natura e Dimensione)", testoRiferimentoSSM: "L'art. 2086 c.c. impone all'imprenditore (specie societario) di istituire un assetto organizzativo, amministrativo e contabile adeguato alla natura e alle dimensioni dell'impresa." },
        { id: "SSM_RILEVAZIONE_CRISI", titolo: "Funzione degli Assetti per la Rilevazione Tempestiva della Crisi", testoRiferimentoSSM: "Gli assetti devono essere funzionali anche alla tempestiva rilevazione della crisi e della perdita della continuità aziendale." },
        { id: "SSM_RESP_AMM", titolo: "Profili di Responsabilità degli Amministratori", testoRiferimentoSSM: "La mancata istituzione o l'inadeguatezza degli assetti può comportare profili di responsabilità gestoria per gli amministratori." }
    ];
    for (const aspetto of aspettiChiaveSSM) {
        // SIMULAZIONE CHIAMATA AI (da sostituire con vera chiamata a complianceAnalyzerAI.js)
        // const commentoTestualeAI_SSM = await analyzeComplianceSSM(aspetto, checklist, gaps, kbContent);
        const commentoTestualeAI_SSM = await commentComplianceSSM(aspetto, checklist, gaps, executiveSummaryGiaGenerato);
        analisiConformita.ssmArt2086.push({
            aspettoSSM: aspetto.titolo,
            commentoAI: commentoTestualeAI_SSM
        });
    }
    console.log(`>>> Conformità SSM (Doc 5): Processati ${analisiConformita.ssmArt2086.length} aspetti.`);
    // --- FINE LOGICA PER DOC 5 ---

    // --- INIZIO LOGICA PER DOC 8: CNDCEC - Visto Conformità/Congruità ---
    console.log(">>> Avvio analisi predisposizione Visti CNDCEC (Doc 8) con servizio AI...");
    const requisitiVisti = [
        { id: "VISTI_CTRL_INT", titolo: "Adeguatezza Sistema di Controllo Interno sull'Informativa Finanziaria", testoRiferimentoVisti: "Le Linee Guida CNDCEC per i Visti pongono enfasi sull'affidabilità del sistema di controllo interno che produce l'informativa finanziaria." },
        { id: "VISTI_DATI_CONT", titolo: "Affidabilità e Tempestività Dati Contabili", testoRiferimentoVisti: "La possibilità di rilasciare i Visti dipende dalla disponibilità di dati contabili corretti, completi e tempestivi." }
    ];
    for (const requisito of requisitiVisti) {
        // SIMULAZIONE CHIAMATA AI (da sostituire con vera chiamata a complianceAnalyzerAI.js)
        // const parerePreliminareAI_Visti = await analyzeComplianceVisti(requisito, checklist, gaps, kbContent);
        const parerePreliminareAI_Visti = await analyzePredisposizioneVisti(requisito, checklist, gaps);
        analisiConformita.predisposizioneVistiCNDCEC.push({
            requisitoVisto: requisito.titolo,
            parerePreliminareAI: parerePreliminareAI_Visti
        });
    }
    console.log(`>>> Predisposizione Visti CNDCEC (Doc 8): Analizzati ${analisiConformita.predisposizioneVistiCNDCEC.length} requisiti.`);
    // --- FINE LOGICA PER DOC 8 ---

    // --- (Opzionale) Logica per Valutazione Qualitativa AAO ("Brancozzi" - Doc 2 e Doc 7) ---
    // Questa sezione rimarrà qualitativa e potrebbe essere arricchita da AI in un secondo momento
    // o compilata dal consulente.
    const valutazioneQualitativaAAO = {
        approccioForwardLooking: { valutazione: "Da Valutare Manualmente", motivazione: "Analizzare se la pianificazione (C.3.1, C.3.3, C.3.7) e il monitoraggio (C.3.6, E.5) sono orientati al futuro." },
        kpiQualitativi: { valutazione: "Da Valutare Manualmente", motivazione: "Verificare se i KPI (C.3.6) includono aspetti qualitativi e non solo finanziari (Balanced Scorecard)." },
        pianificazioneStrategica: { valutazione: "Da Valutare Manualmente", motivazione: "Valutare la presenza e robustezza del piano strategico (C.3.7) e l'analisi di scenario." }
    };
    console.log(">>> Valutazione Qualitativa AAO (Doc 2, 7): Placeholder impostati.");
    // ----------------------------------------------------------------------

    // --- Suggerimenti Iniziali Piano Azione (come prima) ---
    const suggerimentiPianoAzioneIniziale = gapOrdinati
        .filter(g => g.livello_rischio === 'alto' || g.livello_rischio === 'medio')
        .slice(0, 7) 
        .map(g => ({
            gapId: g._id,
            titoloGap: `${g.item_id}: ${g.descrizione}`,
            rischioGap: g.livello_rischio,
            interventoSuggerito: g.suggerimenti_ai && g.suggerimenti_ai.length > 0 ? g.suggerimenti_ai[0] : "Definire intervento specifico."
        }));
    console.log(`>>> Suggerimenti Piano Azione Iniziale: Generati ${suggerimentiPianoAzioneIniziale.length} suggerimenti.`);
    // ------------------------------------------


    // --- DATI PER EXECUTIVE SUMMARY AI (chiamata separata DOPO questo servizio) ---
    const datiPerAISummary = {
        profiloCliente: checklist.cliente,
        giudizioBase: giudizioBase,
        statisticheGap: gapStats,
        areeForzaBase: areeForza,
        areeDebolezzaBase: areeDebolezza,
        elencoGapCritici: gapPrioritari.map(g => ({itemId: g.item_id, descrizione: g.descrizione, rischio: g.livello_rischio, implicazioni: Array.isArray(g.implicazioni) ? g.implicazioni.join('; ') : g.implicazioni})),
        // Aggiungi le nuove analisi di conformità per dare più contesto all'AI per l'executive summary
        sintesiConformitaCNDCEC: analisiConformita.cndcec
            .filter(c => c.valutazioneConformita === 'Non Conforme' || c.valutazioneConformita === 'Parzialmente Conforme')
            .slice(0,3) // Primi 3 punti critici
            .map(c => ({ punto: c.puntoCNDCEC, valutazione: c.valutazioneConformita, descrizione: c.descrizionePunto?.substring(0,100) + "..." })),
        sintesiConformitaAllerta: analisiConformita.sistemiAllertaCCII
            .filter(c => c.valutazioneConformita.includes('Carente') || c.valutazioneConformita.includes('Parzialmente') || c.valutazioneConformita.includes('Manualmente'))
            .slice(0,2) // Primi 2 aspetti critici
            .map(c => ({ aspetto: c.aspettoValutato, valutazione: c.valutazioneConformita, implicazioni: c.implicazioniNonConformitaTestuali?.substring(0,150) + "..." , note: c.noteOsservazioni?.substring(0,100) + "..."})),
        sintesiConformitaEBA: analisiConformita.eba.map(e => ({ principio: e.principioEBA.substring(0,50), valutazione: e.valutazioneAI.substring(0,100) })).slice(0,2),
        sintesiSSM: analisiConformita.ssmArt2086.map(s => ({ aspetto: s.aspettoSSM.substring(0,50), commento: s.commentoAI.substring(0,100) })).slice(0,2),
        sintesiPredisposizioneVisti: analisiConformita.predisposizioneVistiCNDCEC.map(v => ({ requisito: v.requisitoVisto.substring(0,50), parere: v.parerePreliminareAI.substring(0,100) })).slice(0,2)
    };
    // ---------------------------------------------------------------------------

    const reportData = {
        checklistInfo: {
            id: checklist._id,
            nome: checklist.nome,
            descrizione: checklist.descrizione,
            stato: checklist.stato,
            data_creazione: checklist.data_creazione,
            data_compilazione: checklist.data_compilazione,
            percentuale_completamento: /* calcola come prima */ 0,
        },
        clienteInfo: checklist.cliente,
        // sintesi_esecutiva: verrà popolata da summaryGeneratorAI
        executiveSummaryBase: { giudizioGenerale: giudizioBase, areeForza, areeDebolezza, gapPrioritariCount: gapPrioritari.length },
        analisiArea: giudiziArea,
        statisticheGap: gapStats,
        elencoGapCompleto: gapOrdinati,
        
        analisiConformita: analisiConformita, // Ora contiene tutte e 5 le sezioni
        valutazioneQualitativaAAO: valutazioneQualitativaAAO, // Placeholder per ora
        suggerimentiPianoAzioneIniziale: suggerimentiPianoAzioneIniziale,

        // Dati specifici da passare al servizio AI per l'executive summary (AGGIORNATI)
        _datiPerAISummary: datiPerAISummary 
    };

    console.log(">>> Contenuto Report (D5 COMPLETO) Generato.");
    return reportData;
};

module.exports = { generateReportContent };

// END OF FILE server/services/reportGenerator.js (NUOVO FILE)