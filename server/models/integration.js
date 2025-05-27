const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema per i dati importati
const ImportedDataSchema = new Schema({
  tipo_file: {
    type: String,
    enum: ['excel', 'word', 'altro'],
    required: true
  },
  nome_file: {
    type: String,
    required: true
  },
  modulo_destinazione: {
    type: String,
    enum: ['diagnosi', 'progettazione', 'monitoraggio'],
    required: true
  },
  dati_importati: {
    type: Schema.Types.Mixed,
    required: true
  },
  stato_importazione: {
    type: String,
    enum: ['completata', 'parziale', 'fallita'],
    required: true
  },
  dettagli_errori: [String],
  importato_da: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  data_importazione: {
    type: Date,
    default: Date.now
  }
});

// Schema per l'integrazione AI
const AIModelSchema = new Schema({
  nome: {
    type: String,
    required: true
  },
  descrizione: {
    type: String
  },
  tipo: {
    type: String,
    enum: ['classificazione', 'regressione', 'clustering', 'nlp'],
    required: true
  },
  modulo: {
    type: String,
    enum: ['diagnosi', 'progettazione', 'monitoraggio'],
    required: true
  },
  parametri: {
    type: Schema.Types.Mixed
  },
  accuratezza: {
    type: Number
  },
  data_creazione: {
    type: Date,
    default: Date.now
  },
  data_ultimo_addestramento: {
    type: Date
  },
  attivo: {
    type: Boolean,
    default: true
  }
});

// Schema per i risultati dell'AI
const AIResultSchema = new Schema({
  model_id: {
    type: Schema.Types.ObjectId,
    ref: 'AIModel',
    required: true
  },
  input_data: {
    type: Schema.Types.Mixed,
    required: true
  },
  output_data: {
    type: Schema.Types.Mixed,
    required: true
  },
  confidenza: {
    type: Number
  },
  data_generazione: {
    type: Date,
    default: Date.now
  },
  utilizzato: {
    type: Boolean,
    default: false
  },
  feedback: {
    accurato: Boolean,
    commenti: String
  }
});

const ImportedData = mongoose.model('ImportedData', ImportedDataSchema);
const AIModel = mongoose.model('AIModel', AIModelSchema);
const AIResult = mongoose.model('AIResult', AIResultSchema);

module.exports = {
  ImportedData,
  AIModel,
  AIResult
};
