
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const InterventoSchema = new Schema({
  titolo: {
    type: String,
    required: [ true, "Il titolo è obbligatorio." ]
  },
  descrizione: {
    type: String
  },

  area: {
    type: String,
    required: [ true, "L'area è obbligatoria." ],
    enum: {

      values: [ "Org", "Admin", "Acct", "Crisi", "IT", "Altro" ],
      message: "Area non valida ({VALUE}). Valori permessi: Org, Admin, Acct, Crisi, IT, Altro"
    },
    index: true
  },
  priorita: {
    type: String,
    required: [ true, "La priorità è obbligatoria." ],
    enum: {
      values: [ "alta", "media", "bassa" ],
      message: "Priorità non valida ({VALUE}). Valori permessi: alta, media, bassa"
    },
    index: true
  },
  stato: {
    type: String,
    required: true,

    enum: [ "suggerito", "da_approvare", "approvato", "pianificato", "in_corso", "completato", "annullato", "in_attesa" ],
    default: "suggerito",
    index: true
  },
  responsabile: {
    type: String
  },
  tempistica_stimata: {
    type: String
  },
  risorse_necessarie: {
    type: String
  },
  data_inizio_prevista: {
    type: Date
  },
  data_fine_prevista: {
    type: Date
  },
  data_completamento_effettiva: {
    type: Date
  },
  completamento_perc: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  note_avanzamento: {
    type: String
  },
  gap_correlati: [ {
    type: Schema.Types.ObjectId,
    ref: "Gap"
  } ],
  origin: {
    type: String,
    enum: [ "manuale", "ai_generated" ],
    default: "manuale"
  },
  checklist_id_origine: {
    type: Schema.Types.ObjectId,
    ref: "Checklist",
    index: true
  },
  obiettivo_intervento: {
    type: String
  },

  kpi_monitoraggio_suggeriti: [ String ],

  riferimentiKbIntervento: [ {

    chunkId: {
      type: String
    },
    documentoFonte: {
      type: String
    },
    estrattoTesto: {
      type: String
    },
    similarita: {
      type: Number
    }
  } ],
  motivazioneContestualizzataAI: {
    type: String
  }
}, {
  timestamps: true
});

const PianoAzioneSchema = new Schema({
  titolo: {
    type: String,
    required: true
  },
  descrizione: {
    type: String
  },
  cliente: {

    nome: {
      type: String,
      required: true
    }
  },
  interventi: [ {
    type: Schema.Types.ObjectId,
    ref: "Intervento"
  } ],

  stato: {
    type: String,
    enum: [ "bozza", "approvato", "in_corso", "completato", "annullato" ],
    default: "bozza"
  },
  data_inizio: {
    type: Date
  },
  data_fine_prevista: {
    type: Date
  },
  responsabile_piano: {
    type: String
  },
  note: {
    type: String
  },

  origin: {
    type: String,
    enum: [ "manuale", "suggerito_ai" ],

    default: "manuale"
  },
  checklist_id_origine: {

    type: Schema.Types.ObjectId,
    ref: "Checklist",
    index: true,
    sparse: true
  }
}, {
  timestamps: true
});

const DocumentoFormalizzazioneSchema = new Schema({
  titolo: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: [ "organigramma", "mansionario", "procedura", "delega", "altro" ],
    required: true
  },
  descrizione: {
    type: String
  },
  stato: {
    type: String,
    enum: [ "bozza", "in_revisione", "approvato", "pubblicato" ],
    default: "bozza"
  },
  versione: {
    type: String,
    default: "1.0"
  },
  data_approvazione: {
    type: Date
  },
  data_pubblicazione: {
    type: Date
  },
  responsabile_redazione: {
    type: String
  },
  approvato_da: {
    type: String
  },

  nomeFileOriginale: {
    type: String,
    required: false
  },

  nomeFileSalvataggio: {
    type: String,
    required: false
  },

  pathFile: {
    type: String,
    required: false
  },

  mimetypeFile: {
    type: String,
    required: false
  },
  sizeFile: {
    type: Number,
    required: false
  },

  contenutoMarkdown: {
    type: String
  },

  intervento_id: {
    type: Schema.Types.ObjectId,
    ref: "Intervento",
    index: true,
    sparse: true
  }
}, {
  timestamps: true
});

const Intervento = mongoose.model("Intervento", InterventoSchema);

const PianoAzione = mongoose.model("PianoAzione", PianoAzioneSchema);

const DocumentoFormalizzazione = mongoose.model("DocumentoFormalizzazione", DocumentoFormalizzazioneSchema);

module.exports = {
  Intervento: Intervento,
  PianoAzione: PianoAzione,
  DocumentoFormalizzazione: DocumentoFormalizzazione
};