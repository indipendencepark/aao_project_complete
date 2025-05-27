const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema per le aree funzionali
const AreaSchema = new Schema({
  nome: {
    type: String,
    required: true,
    unique: true
  },
  descrizione: {
    type: String
  },
  data_creazione: {
    type: Date,
    default: Date.now
  }
});

// Schema per i KPI
const KpiSchema = new Schema({
  codice: {
    type: String,
    required: true,
    unique: true
  },
  nome: {
    type: String,
    required: true
  },
  //area_id: {
  //  type: Schema.Types.ObjectId,
  //  ref: 'Area',
  //  required: true
  //},
  area: { // <-- AGGIUNTO CAMPO STRINGA
    type: String,
    required: true, // Rendiamo obbligatoria la stringa dell'area
    // Potremmo aggiungere un enum se vogliamo limitare i valori:
    // enum: ['Commerciale', 'Logistica', 'HR', 'Acquisti', 'Produzione', 'Finanza', 'Altro']
},
  definizione: {
    type: String
  },
  formula: {
    type: String
  },
  unita: {
    type: String
  },
  frequenza: {
    type: String
  },
  utilita: {
    type: String
  },
  valore_target: {
    type: Number
  },
  soglia_attenzione: { type: Number }, // Nome corretto
  soglia_allarme: { type: Number },    // Nome corretto
  attivo: {
    type: Boolean,
    default: true
  },
  data_creazione: {
    type: Date,
    default: Date.now
  },
  data_aggiornamento: {
    type: Date,
    default: Date.now
  }
});

// Schema per i valori dei KPI
const ValoreKpiSchema = new Schema({
  kpi_id: {
    type: Schema.Types.ObjectId,
    ref: 'Kpi',
    required: true
  },
  valore: {
    type: Number,
    required: true
  },
  data: {
    type: Date,
    required: true
  },
  note: {
    type: String
  },
  fonte_dati: {
    type: String
  },
  creato_da: {
    type: String
  },
  data_creazione: {
    type: Date,
    default: Date.now
  }
});

// Schema per gli alert
const AlertSchema = new Schema({
  kpi_id: {
    type: Schema.Types.ObjectId,
    ref: 'Kpi',
    required: true
  },
  valore_kpi_id: {
    type: Schema.Types.ObjectId,
    ref: 'ValoreKpi'
  },
  messaggio: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['soglia_minima', 'soglia_massima', 'trend_negativo', 'altro'],
    required: true
  },
  livello: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'warning'
  },
  data: {
    type: Date,
    default: Date.now
  },
  letto: {
    type: Boolean,
    default: false
  },
  azioni_intraprese: {
    type: String
  },
  data_lettura: {
    type: Date
  }
});

// Schema per l'analisi degli scostamenti
const AnalisiScostamentoSchema = new Schema({
  kpi_id: {
    type: Schema.Types.ObjectId,
    ref: 'Kpi',
    required: true
  },
  periodo_inizio: {
    type: Date,
    required: true
  },
  periodo_fine: {
    type: Date,
    required: true
  },
  valore_atteso: {
    type: Number
  },
  valore_effettivo: {
    type: Number,
    required: true
  },
  scostamento_assoluto: {
    type: Number
  },
  scostamento_percentuale: {
    type: Number
  },
  cause: {
    type: String
  },
  azioni_correttive: {
    type: String
  },
  creato_da: {
    type: String
  },
  data_creazione: {
    type: Date,
    default: Date.now
  }
});

const Area = mongoose.model('Area', AreaSchema);
const Kpi = mongoose.model('Kpi', KpiSchema);
const ValoreKpi = mongoose.model('ValoreKpi', ValoreKpiSchema);
const Alert = mongoose.model('Alert', AlertSchema);
const AnalisiScostamento = mongoose.model('AnalisiScostamento', AnalisiScostamentoSchema);

module.exports = {
  Area,
  Kpi,
  ValoreKpi,
  Alert,
  AnalisiScostamento
};
