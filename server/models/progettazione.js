// server/models/progettazione.js (CORRETTO - SOLO SCHEMI E MODELLI)
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- Schema Intervento (VERIFICA E CORREGGI GLI ENUM) ---
const InterventoSchema = new Schema({
    titolo: { type: String, required: [true, 'Il titolo è obbligatorio.'] },
    descrizione: { type: String }, // Descrizione arricchita dall'AI se origin='ai_generated'
    area: {
        type: String,
        required: [true, "L'area è obbligatoria."],
        enum: {
            // Assicurati che 'Acct' e gli altri valori usati da mapArea() siano qui
            values: ['Org', 'Admin', 'Acct', 'Crisi', 'IT', 'Altro'], 
            message: 'Area non valida ({VALUE}). Valori permessi: Org, Admin, Acct, Crisi, IT, Altro'
        },
        index: true // index era presente prima, lo manteniamo
    },
    priorita: {
        type: String,
        required: [true, 'La priorità è obbligatoria.'],
        enum: {
            values: ['alta', 'media', 'bassa'],
            message: 'Priorità non valida ({VALUE}). Valori permessi: alta, media, bassa'
        },
        index: true // index era presente prima, lo manteniamo
    },
    stato: {
        type: String,
        required: true, // required era presente prima
        // Assicurati che 'suggerito' e gli altri stati usati siano qui
        enum: ['suggerito', 'da_approvare', 'approvato', 'pianificato', 'in_corso', 'completato', 'annullato', 'in_attesa'],
        default: 'suggerito',
        index: true // index era presente prima, lo manteniamo
    },
    responsabile: { type: String },
    tempistica_stimata: { type: String }, 
    risorse_necessarie: { type: String },
    data_inizio_prevista: { type: Date },
    data_fine_prevista: { type: Date },
    data_completamento_effettiva: { type: Date },
    completamento_perc: { type: Number, min: 0, max: 100, default: 0 },
    note_avanzamento: { type: String },
    gap_correlati: [{ type: Schema.Types.ObjectId, ref: 'Gap' }],
    origin: { type: String, enum: ['manuale', 'ai_generated'], default: 'manuale' },
    checklist_id_origine: { type: Schema.Types.ObjectId, ref: 'Checklist', index: true },
    obiettivo_intervento: { type: String }, // Già presente, sarà popolato/arricchito da AI
    kpi_monitoraggio_suggeriti: [String], // Già presente
    // --- NUOVI CAMPI PER RIFERIMENTI KB ---
    riferimentiKbIntervento: [{ // Riferimenti specifici che supportano questo intervento
        chunkId: { type: String },
        documentoFonte: { type: String },
        estrattoTesto: { type: String },
        similarita: { type: Number }
    }],
    motivazioneContestualizzataAI: { type: String } // Motivazione specifica generata dall'AI
    // --- FINE NUOVI CAMPI ---
    }, { timestamps: true });

// --- Schema Piano d'Azione ---
const PianoAzioneSchema = new Schema({
    titolo: { type: String, required: true },
    descrizione: { type: String },
    cliente: { // Riferimento al cliente, potrebbe essere ridondante se sempre legato a una checklist
        nome: { type: String, required: true }
        // Aggiungere altri campi cliente se necessario per il piano
    },
    interventi: [{ type: Schema.Types.ObjectId, ref: 'Intervento' }], // Array di riferimenti a Interventi
    stato: { type: String, enum: ['bozza', 'approvato', 'in_corso', 'completato', 'annullato'], default: 'bozza' },
    data_inizio: { type: Date },
    data_fine_prevista: { type: Date },
    responsabile_piano: { type: String },
    note: { type: String },
    // --- NUOVI CAMPI ---
    origin: {
        type: String,
        enum: ['manuale', 'suggerito_ai'], // Assicurati che 'suggerito_ai' sia qui
        default: 'manuale'
    },
    checklist_id_origine: { // Nome esatto del campo
        type: Schema.Types.ObjectId,
        ref: 'Checklist',
        index: true,
        sparse: true
    }
    // --- FINE NUOVI CAMPI ---
}, { timestamps: true });

// --- Schema Documento Formalizzazione ---
const DocumentoFormalizzazioneSchema = new Schema({
    titolo: { type: String, required: true },
    tipo: { type: String, enum: ['organigramma', 'mansionario', 'procedura', 'delega', 'altro'], required: true },
    descrizione: { type: String },
    stato: { type: String, enum: ['bozza', 'in_revisione', 'approvato', 'pubblicato'], default: 'bozza' },
    versione: { type: String, default: '1.0' },
    data_approvazione: { type: Date },
    data_pubblicazione: { type: Date },
    responsabile_redazione: { type: String },
    approvato_da: { type: String },

    // --- INIZIO MODIFICHE ---
    // Campi per il file caricato (opzionali se generato da AI)
    nomeFileOriginale: { type: String, required: false }, // Non più required
    nomeFileSalvataggio: { type: String, required: false }, // Non più required
    pathFile: { type: String, required: false }, // Non più required
    mimetypeFile: { type: String, required: false },
    sizeFile: { type: Number, required: false },

    // NUOVO CAMPO per bozza AI
    contenutoMarkdown: { type: String },

    // Riferimento opzionale all'intervento
    intervento_id: { type: Schema.Types.ObjectId, ref: 'Intervento', index: true, sparse: true }
    // --- FINE MODIFICHE ---

}, { timestamps: true }); // Aggiunge createdAt e updatedAt

// --- Definizione ed Esportazione Modelli ---
// Assicurati che InterventoSchema, PianoAzioneSchema e DocumentoFormalizzazioneSchema
// siano definite SOPRA queste righe.
const Intervento = mongoose.model('Intervento', InterventoSchema);
const PianoAzione = mongoose.model('PianoAzione', PianoAzioneSchema);
const DocumentoFormalizzazione = mongoose.model('DocumentoFormalizzazione', DocumentoFormalizzazioneSchema);

module.exports = { Intervento, PianoAzione, DocumentoFormalizzazione };