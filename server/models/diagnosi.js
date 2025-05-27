const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const VisibilityConditionSchema = new Schema({
  sourceItemId: {
    type: String,
    required: true
  },
  expectedAnswer: {
    type: Schema.Types.Mixed,
    required: true
  }
}, {
  _id: false
});

const ChecklistItemAnswerSchema = new Schema({

  questionTemplate: {
    type: Schema.Types.ObjectId,
    ref: "QuestionTemplate",

    required: true
  },

  itemId: {
    type: String,
    required: true,
    index: true
  },

  domandaText: {
    type: String,
    required: true
  },
  area: {

    type: String,
    required: true
  },
  rilevanza: {
    type: String
  },
  fonte: {
    type: String
  },
  tipoRisposta: {
    type: String,
    required: true
  },

  opzioniRisposta: [ String ],

  testoAiuto: {
    type: String
  },
  ordine: {
    type: Number
  },

  tags: {
    type: [ String ],
    default: []
  },

  dependsOn: [ VisibilityConditionSchema ],

  risposta: {
    type: Schema.Types.Mixed,

    default: null
  },
  note: {
    type: String,
    default: ""
  },

  motivazioneSelezioneAI: {

    type: String,
    trim: true,
    default: null
  },

  isCoreQuestion: {

    type: Boolean,
    default: false
  }
}, {
  _id: false
});

const ChecklistSchema = new Schema({
  nome: {
    type: String,
    required: true
  },
  descrizione: {
    type: String
  },
  data_creazione: {
    type: Date,
    default: Date.now
  },

  data_compilazione: {
    type: Date
  },

  stato: {
    type: String,
    enum: [ "bozza", "in_corso", "completata" ],
    default: "bozza",
    index: true
  },
  cliente: {

    nome: {
      type: String,
      required: true
    },
    formaGiuridica: {
      type: String
    },
    codiceFiscale: {
      type: String,
      index: true
    },
    partitaIva: {
      type: String,
      index: true
    },
    pec: {
      type: String
    },
    reaNumero: {
      type: String
    },
    reaProvincia: {
      type: String
    },
    codiceLEI: {
      type: String
    },
    dataCostituzione: {
      type: Date
    },
    dataIscrizioneRI: {
      type: Date
    },
    capitaleSociale: {
      type: Number
    },
    sede_via: {
      type: String
    },
    sede_cap: {
      type: String
    },
    sede_comune: {
      type: String
    },
    sede_provincia: {
      type: String
    },
    statoAttivita: {
      type: String
    },
    dataInizioAttivita: {
      type: Date
    },
    attivitaPrevalente: {
      type: String
    },
    atecoPrimario: {
      type: String
    },
    atecoSecondari: [ String ],
    importExport: {
      type: Boolean
    },
    numeroAddetti: {
      type: Number
    },
    dataRiferimentoAddetti: {
      type: Date
    },
    numeroSoci: {
      type: Number
    },
    numeroAmministratori: {
      type: Number
    },
    sistemaAmministrazione: {
      type: String
    },
    organoControlloPresente: {
      type: Boolean
    },
    tipoOrganoControllo: {
      type: String
    },
    numeroUnitaLocali: {
      type: Number
    },
    certificazioni: [ String ],
    partecipazioni: {
      type: Boolean
    },
    dimensioneStimata: {
      type: String,
      enum: [ "Micro", "Piccola", "Media", "Grande" ]
    },
    settore: {
      type: String
    },
    complessita: {
      type: String,
      enum: [ "Bassa", "Media", "Alta" ]
    },

    obiettiviStrategici: {
      type: String,
      trim: true
    },
    criticitaPercepite: {
      type: String,
      trim: true
    }
  },
  answers: [ ChecklistItemAnswerSchema ],

  punteggio_calcolato: {
    type: Number
  },

  numero_gap_rilevati: {
    type: Number,
    default: 0,
    index: true
  },

  compilata_da_id: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
});

const GapSchema = new Schema({
  checklist_id: {
    type: Schema.Types.ObjectId,
    ref: "Checklist",
    required: true,
    index: true
  },
  item_id: {
    type: String,
    required: true
  },
  domandaText: {
    type: String,
    required: true
  },
  descrizione: {
    type: String,
    required: true
  },

  livello_rischio: {
    type: String,
    enum: [ "basso", "medio", "alto" ],
    required: true,
    index: true
  },

  implicazioni: {
    type: [ String ]
  },

  suggerimenti_ai: [ String ],

  data_rilevazione: {
    type: Date,
    default: Date.now
  },

  riferimentiKb: [ {

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
  arricchitoConAI: {
    type: Boolean,
    default: false
  },

  riferimentiNormativiSpecificiAI: {
    type: [ String ],

    default: []
  },
  impattoStimatoAI: {
    tipo: {
      type: String
    },

    livello: {
      type: String,
      enum: [ "alto", "medio", "basso", null ]
    },
    descrizione: {
      type: String
    }
  },
  prioritaRisoluzioneAI: {
    type: String,
    enum: [ "alta", "media", "bassa", null ]
  },

  causeRadiceSuggeriteAI: [ {
    _id: false,

    testoCausa: {
      type: String,
      required: true
    },
    motivazioneAI: {
      type: String
    },

    rilevanzaStimata: {
      type: String,
      enum: [ "alta", "media", "bassa", null ]
    }
  } ],
  ultimaAnalisiCauseRadice: {
    type: Date
  }
}, {
  timestamps: true
});

const ReportDiagnosticoSchema = new Schema({
  checklist_id: {
    type: Schema.Types.ObjectId,
    ref: "Checklist",
    required: true
  },
  data_generazione: {
    type: Date,
    default: Date.now
  },
  titolo: {
    type: String,
    required: true
  },
  sintesi_esecutiva: {
    type: String,
    required: true
  },

  aree_forza: [ String ],
  aree_debolezza: [ String ],
  gaps: [ {
    type: Schema.Types.ObjectId,
    ref: "Gap"
  } ],
  raccomandazioni: [ String ],
  generato_da_id: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  stato: {
    type: String,
    enum: [ "bozza", "finale" ],
    default: "bozza"
  },

  analisiConformita: {

    cndcec: [ {
      puntoNorma: String,
      valutazione: String,
      note: String
    } ],

    eba: [ {
      puntoNorma: String,
      valutazione: String,
      note: String
    } ]
  },
  valutazioneQualitativaAAO: {

    approccioForwardLooking: {
      valutazione: String,
      motivazione: String
    },
    kpiQualitativi: {
      valutazione: String,
      motivazione: String
    },
    pianificazioneStrategica: {
      valutazione: String,
      motivazione: String
    }
  },
  suggerimentiPianoAzioneIniziale: [ {
    gapId: {
      type: Schema.Types.ObjectId,
      ref: "Gap"
    },
    titoloGap: String,
    rischioGap: String,
    interventoSuggerito: String
  } ]
}, {
  timestamps: true
});

const Checklist = mongoose.model("Checklist", ChecklistSchema);

const Gap = mongoose.model("Gap", GapSchema);

const ReportDiagnostico = mongoose.model("ReportDiagnostico", ReportDiagnosticoSchema);

module.exports = {
  Checklist: Checklist,
  Gap: Gap,
  ReportDiagnostico: ReportDiagnostico
};