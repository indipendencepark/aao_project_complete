const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Riusa VisibilityConditionSchema o definiscilo qui se non lo importi
const VisibilityConditionSchema = new Schema({
    sourceItemId: { type: String, required: true },
    expectedAnswer: { type: Schema.Types.Mixed, required: true }
}, { _id: false });

// --- Schema per le Risposte all'interno della Checklist (Aggiornato) ---
const ChecklistItemAnswerSchema = new Schema({
    // Riferimento all'ID della domanda nel template (collection questiontemplates)
    questionTemplate: {
        type: Schema.Types.ObjectId,
        ref: 'QuestionTemplate', // Nome del modello definito in templates.js
        required: true
    },
    // ID mnemonico per riferimento rapido e filtro
    itemId: {
        type: String,
        required: true,
        index: true // Indice non univoco per ricerche veloci
    },
    // Campi duplicati dal template per facilità di visualizzazione/uso
    domandaText: {
        type: String,
        required: true
    },
    area: { // Fondamentale per raggruppamento frontend
        type: String,
        required: true
    },
    rilevanza: { type: String },
    fonte: { type: String },
    tipoRisposta: { type: String, required: true }, // Cruciale per rendering input
    opzioniRisposta: [String], // Per tipo 'SceltaMultipla'
    testoAiuto: { type: String },
    ordine: { type: Number }, // Aggiunto ordine se vuoi mantenerlo
    tags: { type: [String], default: [] }, // Aggiunto tags se vuoi mantenerli

    // --- AGGIUNGI 'dependsOn' QUI ---
    dependsOn: [VisibilityConditionSchema],
    // ------------------------------

    // Campi specifici della risposta data dall'utente
    risposta: {
        type: Schema.Types.Mixed, // Flessibile (String, Number, Boolean, Date, Array)
        default: null
    },
    note: {
        type: String,
        default: ''
    },
    // --- INIZIO NUOVO CAMPO PER MOTIVAZIONE AI ---
    motivazioneSelezioneAI: { // Motivazione fornita dall'AI per l'inclusione di questa domanda
        type: String,
        trim: true,
        default: null // o '' se preferisci stringa vuota
    },
    // --- FINE NUOVO CAMPO ---
    isCoreQuestion: { // NUOVO CAMPO
        type: Boolean,
        default: false
    }
}, { _id: false }); // Non serve _id per sotto-documento


// --- Schema Checklist Aggiornato ---
const ChecklistSchema = new Schema({
    nome: { type: String, required: true },
    descrizione: { type: String },
    data_creazione: { type: Date, default: Date.now }, // Mantenuto per info
    data_compilazione: { type: Date }, // Impostato quando stato -> 'completata'
    stato: { type: String, enum: ['bozza', 'in_corso', 'completata'], default: 'bozza', index: true },
    cliente: { // Incorporato
        nome: { type: String, required: true },
        formaGiuridica: { type: String },
        codiceFiscale: { type: String, index: true },
        partitaIva: { type: String, index: true },
        pec: { type: String },
        reaNumero: { type: String }, reaProvincia: { type: String },
        codiceLEI: { type: String }, dataCostituzione: { type: Date },
        dataIscrizioneRI: { type: Date }, capitaleSociale: { type: Number },
        sede_via: { type: String }, sede_cap: { type: String }, sede_comune: { type: String }, sede_provincia: { type: String },
        statoAttivita: { type: String }, dataInizioAttivita: { type: Date },
        attivitaPrevalente: { type: String }, atecoPrimario: { type: String }, atecoSecondari: [String],
        importExport: { type: Boolean }, numeroAddetti: { type: Number }, dataRiferimentoAddetti: { type: Date },
        numeroSoci: { type: Number }, numeroAmministratori: { type: Number }, sistemaAmministrazione: { type: String },
        organoControlloPresente: { type: Boolean }, tipoOrganoControllo: { type: String },
        numeroUnitaLocali: { type: Number }, certificazioni: [String], partecipazioni: { type: Boolean },
        dimensioneStimata: { type: String, enum: ['Micro', 'Piccola', 'Media', 'Grande'] },
        settore: { type: String }, complessita: { type: String, enum: ['Bassa', 'Media', 'Alta'] },
                // --- NUOVI CAMPI CLIENTE ---
                obiettiviStrategici: {
                    type: String,
                    trim: true // Rimuove spazi bianchi inizio/fine
                },
                criticitaPercepite: {
                    type: String,
                    trim: true
                }
                // --- FINE NUOVI CAMPI ---
    },
    answers: [ChecklistItemAnswerSchema], // Array risposte basate sui template
    punteggio_calcolato: { type: Number }, // Da calcolare eventualmente
    numero_gap_rilevati: { type: Number, default: 0, index: true }, // Aggiornato da generazione Gap
    compilata_da_id: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true }); // Aggiunge createdAt e updatedAt


// --- Schema per i Gap Rilevati (AGGIORNATO) ---
const GapSchema = new Schema({
    checklist_id: { type: Schema.Types.ObjectId, ref: 'Checklist', required: true, index: true },
    item_id: { type: String, required: true },
    domandaText: { type: String, required: true },
    descrizione: { type: String, required: true }, // Descrizione BASE (pre-AI) o ARRICCHITA (post-AI)
    livello_rischio: { type: String, enum: ['basso', 'medio', 'alto'], required: true, index: true }, // Rischio BASE o ARRICCHITO
    implicazioni: { type: [String] }, // Cambiato da String a [String] (array di stringhe)
    suggerimenti_ai: [String], // Suggerimenti specifici AI per risolvere il gap
    data_rilevazione: { type: Date, default: Date.now },
    // --- NUOVI CAMPI PER RIFERIMENTI KB ---
    riferimentiKb: [{ // Array di oggetti per i riferimenti
        chunkId: { type: String }, // ID del chunk della KB usata dall'AI (se applicabile)
        documentoFonte: { type: String }, // Nome del documento PDF originale (se possibile identificarlo)
        estrattoTesto: { type: String }, // Breve estratto significativo del testo della KB
        similarita: { type: Number } // Punteggio di similarità del chunk (se retrieval basato su similarità)
    }],
    arricchitoConAI: { type: Boolean, default: false }, // Flag per indicare se il gap è stato processato da gapEnricherAI
    // --- FINE NUOVI CAMPI ---

    // --- INIZIO NUOVI CAMPI PER D3 ---
    riferimentiNormativiSpecificiAI: {
        type: [String], // Array di stringhe, es. ["Art. 2086 c.c.", "EBA GL/2020/06 Par. X"]
        default: []
    },
    impattoStimatoAI: {
        tipo: { type: String }, // Es. 'Finanziario', 'Operativo', 'Reputazionale', 'Conformità'
        livello: { type: String, enum: ['alto', 'medio', 'basso', null] },
        descrizione: { type: String }
    },
    prioritaRisoluzioneAI: {
        type: String,
        enum: ['alta', 'media', 'bassa', null]
    },
    // --- FINE NUOVI CAMPI PER D3 ---

    // --- INIZIO NUOVI CAMPI PER D4 (Analisi Cause Radice) ---
    causeRadiceSuggeriteAI: [{
        _id: false, // Non serve un ID per ogni causa suggerita qui
        testoCausa: { type: String, required: true },
        motivazioneAI: { type: String }, // Spiegazione del perché l'AI la suggerisce
        rilevanzaStimata: { type: String, enum: ['alta', 'media', 'bassa', null] } // Stima della rilevanza/impatto della causa
    }],
    ultimaAnalisiCauseRadice: { type: Date } // Timestamp dell'ultima analisi effettuata
    // --- FINE NUOVI CAMPI PER D4 ---
}, { timestamps: true });


// --- Schema per il Report Diagnostico (Invariato) ---
const ReportDiagnosticoSchema = new Schema({
    checklist_id: { type: Schema.Types.ObjectId, ref: 'Checklist', required: true },
    data_generazione: { type: Date, default: Date.now },
    titolo: { type: String, required: true },
    sintesi_esecutiva: { type: String, required: true }, // Questo verrà popolato dall'AI
    aree_forza: [String],
    aree_debolezza: [String],
    gaps: [{ type: Schema.Types.ObjectId, ref: 'Gap' }],
    raccomandazioni: [String],
    generato_da_id: { type: Schema.Types.ObjectId, ref: 'User' },
    stato: { type: String, enum: ['bozza', 'finale'], default: 'bozza' },
    
    // --- NUOVI CAMPI PER D5 ---
    analisiConformita: { // Oggetto o array per la conformità
        cndcec: [{ puntoNorma: String, valutazione: String, note: String }], // Esempio
        eba: [{ puntoNorma: String, valutazione: String, note: String }]    // Esempio
    },
    valutazioneQualitativaAAO: { // Per la "Filosofia Brancozzi"
        approccioForwardLooking: { valutazione: String, motivazione: String },
        kpiQualitativi: { valutazione: String, motivazione: String },
        pianificazioneStrategica: { valutazione: String, motivazione: String }
        // ... altri aspetti ...
    },
    suggerimentiPianoAzioneIniziale: [{
        gapId: { type: Schema.Types.ObjectId, ref: 'Gap' },
        titoloGap: String,
        rischioGap: String,
        interventoSuggerito: String // Breve descrizione dell'intervento basato sul suggerimento AI del gap
    }]
    // --- FINE NUOVI CAMPI ---
}, { timestamps: true });


// Esporta i modelli
const Checklist = mongoose.model('Checklist', ChecklistSchema);
const Gap = mongoose.model('Gap', GapSchema);
const ReportDiagnostico = mongoose.model('ReportDiagnostico', ReportDiagnosticoSchema);

module.exports = {
    Checklist,
    Gap,
    ReportDiagnostico
};