const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definiamo prima lo schema per una singola condizione di visibilità
const VisibilityConditionSchema = new Schema({
    sourceItemId: { // itemId della domanda che triggera la condizione
        type: String,
        required: true
    },
    expectedAnswer: { // Risposta attesa alla domanda sorgente per triggerare l'azione
        type: Schema.Types.Mixed, // Può essere 'Si', 'No', un numero, una stringa specifica ecc.
        required: true
    },
    // targetItemId: { // itemId della domanda la cui visibilità è affetta (NON SERVE QUI, la condizione è sulla domanda stessa)
    //     type: String,
    //     required: true
    // },
    // action: { // Potremmo averne solo una, "mostra se la condizione è vera"
    //     type: String,
    //     enum: ['show', 'hide'], // Per ora, implementiamo solo 'show' (mostra se la condizione è vera)
    //     required: true
    // }
}, { _id: false });

const QuestionTemplateSchema = new Schema({
    itemId: { // Usiamo itemId per coerenza con GapSchema
        type: String,
        required: true,
        unique: true, // Assicura che ogni ID domanda sia unico
        index: true // Indice per ricerche veloci
    },
    domanda: {
        type: String,
        required: true
    },
    area: {
        type: String,
        required: true,
        enum: ['Prelim.', 'Org', 'Admin', 'Acct', 'Crisi'] // Enum per consistenza
    },
    sottoArea: { // Campo opzionale per raggruppamenti più fini
        type: String
    },
    tags: {
        type: [String],
        default: []
    },
    // --- INIZIO NUOVO CAMPO PER LOGICA CONDIZIONALE ---
    // Se `dependsOn` è presente e non vuoto, questa domanda è VISIBILE SOLO SE
    // TUTTE le condizioni specificate in `dependsOn` sono soddisfatte.
    // Se `dependsOn` è assente o vuoto, la domanda è sempre visibile (a meno di altri filtri).
    dependsOn: [VisibilityConditionSchema], // Un array di condizioni che DEVONO essere VERE
    // --- FINE NUOVO CAMPO ---
    rilevanza: { // Filtro dimensionale
        type: String,
        required: true,
        // Potremmo usare un enum anche qui: ['Tutte', 'P+', 'M+', 'G']
    },
    fonte: { // Riferimento normativo/best practice
        type: String
    },
    tipoRisposta: { // Aiuta il frontend a renderizzare l'input corretto
         type: String,
         required: true,
         enum: ['SiNoParz', 'SiNo', 'Testo', 'TestoLungo', 'Numero', 'Data', 'SceltaMultipla'],
         default: 'SiNoParz'
    },
    opzioniRisposta: [String], // Array di stringhe per SceltaMultipla
    testoAiuto: { // Testo esplicativo aggiuntivo (tooltip?)
        type: String
    },
    attiva: { // Per disattivare domande senza cancellarle
        type: Boolean,
        default: true
    },
    ordine: { // Per ordinare le domande all'interno di un'area/sottoarea
        type: Number
    }
    // Aggiungere altri campi se necessario (es. tag, versione, ecc.)
}, { timestamps: true }); // Aggiunge createdAt e updatedAt automaticamente

const QuestionTemplate = mongoose.model('QuestionTemplate', QuestionTemplateSchema);

module.exports = { QuestionTemplate };