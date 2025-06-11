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
    },

    // --- NUOVI CAMPI PER PROFILAZIONE AVANZATA ---
    settoreATECOSpecifico: {
      type: String,
      trim: true
    },
    modelloBusiness: {
      type: String,
      trim: true,
      // enum: ['B2B', 'B2C', 'Manifatturiero', 'Servizi', 'Commerciale', 'Misto', 'Altro']
    },
    complessitaOperativa: {
      type: String,
      // enum: ['Bassa', 'Media', 'Alta', 'Molto Alta']
    },
    strutturaProprietaria: {
      type: String,
      // enum: ['Familiare', 'Manageriale', 'Mista', 'Fondo Investimento', 'Pubblica']
    },
    livelloInternazionalizzazione: {
      type: String,
      // enum: ['Nessuna', 'Solo Export', 'Solo Import', 'Export/Import', 'Sedi Estere', 'Globale']
    },
    faseCicloVita: {
      type: String,
      // enum: ['Startup', 'Crescita', 'Maturita', 'Declino', 'Ristrutturazione']
    }
    // --- FINE NUOVI CAMPI ---
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

  // NUOVI CAMPI PER TRACCIAMENTO GENERAZIONE GAP
  gapGenerationStatus: {
    type: String,
    enum: ['IDLE', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', null], // IDLE: stato iniziale
    default: 'IDLE'
  },
  gapGenerationProgress: { // Percentuale 0-100
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  gapGenerationMessage: { // Per eventuali messaggi o errori
    type: String,
    default: null
  },
  lastGapGenerationAttempt: {
    type: Date
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
    checklist_id: { type: Schema.Types.ObjectId, ref: "Checklist", required: true, index: true, unique: true },
    data_generazione: { type: Date, default: Date.now },
    titolo: { type: String, required: true },

    clienteInfo: {
        nome: String,
        formaGiuridica: String,
        codiceFiscale: String,
        partitaIva: String,
        dimensioneStimata: String,
        settore: String,
        complessita: String,
        obiettiviStrategici: String,
        criticitaPercepite: String,
    },

    checklistInfo: {
        id: { type: Schema.Types.ObjectId, ref: "Checklist" },
        nome: String,
        descrizione: String,
        stato: String,
        data_compilazione: Date,
        percentuale_completamento: Number
    },

    sintesi_esecutiva: { type: String, required: true },

    executiveSummaryBase: {
        giudizioGenerale: String,
        areeForza: [String],
        areeDebolezza: [String],
        gapPrioritariCount: Number
    },

    analisiArea: Schema.Types.Mixed,

    statisticheGap: {
        totalGaps: Number,
        countByRisk: { alto: Number, medio: Number, basso: Number },
        countByArea: { Org: Number, Admin: Number, Acct: Number, Crisi: Number, Altro: Number },
        riskCountByArea: Schema.Types.Mixed
    },

    elencoGapCompleto: [{
        _id: Schema.Types.ObjectId,
        item_id: String,
        domandaText: String,
        descrizione: String,
        livello_rischio: String,
        implicazioni: [String],
        suggerimenti_ai: [String],
        riferimentiNormativiSpecificiAI: [String],
        impattoStimatoAI: { tipo: String, livello: String, descrizione: String },
        prioritaRisoluzioneAI: String,
    }],

    analisiConformita: {
        cndcec: [{
            puntoCNDCEC: String,
            descrizionePunto: String,
            rispostaUtente: String,
            valutazioneConformita: String,
            gapCorrelatoId: { type: Schema.Types.ObjectId, ref: 'Gap', sparse: true },
            noteGap: String,
            notaUtenteChecklist: String,
            fonteNormativaPunto: String
        }],
        sistemiAllertaCCII: [{
            aspettoValutato: String,
            risposteRilevanti: Schema.Types.Mixed,
            valutazioneConformita: String,
            noteOsservazioni: String,
            implicazioniNonConformitaTestuali: String
        }],
        eba: [{
            principioEBA: String,
            valutazioneAI: String,
            domandeChecklistCorrelate: [String]
        }],
        ssmArt2086: [{
            aspettoSSM: String,
            commentoAI: String
        }],
        predisposizioneVistiCNDCEC: [{
            requisitoVisto: String,
            parerePreliminareAI: String
        }]
    },

    valutazioneQualitativaAAO: {
        approccioForwardLooking: { valutazioneTestualeAI: String, domandeRif: [String] },
        utilizzoStrumentiAvanzati: { valutazioneTestualeAI: String, domandeRif: [String] },
        focusKpiQualitativi: { valutazioneTestualeAI: String, domandeRif: [String] },
        culturaControlloRischio: { valutazioneTestualeAI: String, domandeRif: [String] }
    },

    suggerimentiPianoAzioneIniziale: [{
        gapId: { type: Schema.Types.ObjectId, ref: 'Gap' },
        titoloGap: String,
        rischioGap: String,
        interventoSuggerito: String
    }],
    
    // --- NUOVA SEZIONE PER ANALISI CAUSE RADICE AGGREGATE ---
    analisiCauseRadiceAggregate: {
        dataUltimaAnalisi: { type: Date },
        statusAnalisi: { type: String, enum: ['IDLE', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'IDLE' },
        messaggioAnalisi: { type: String },
        causeIdentificate: [{
            _id: false, // Non crea un ObjectId separato per ogni causa
            idCausa: { type: String, default: () => new mongoose.Types.ObjectId().toString() }, // ID univoco generato
            testoCausa: { type: String, required: true },
            categoriaCausa: { type: String }, // Es. Processi, Cultura, Sistemi, Governance, Persone, Organizzazione
            descrizioneDettagliataAI: { type: String }, // Spiegazione dell'AI
            rilevanzaComplessiva: {
                type: String,
                enum: ['critica', 'alta', 'media', 'bassa', null], // Aggiunto null se non determinabile
                default: null
            },
            gapDirettamenteImplicati: [{
                _id: false,
                gapRefId: { type: Schema.Types.ObjectId, ref: 'Gap' }, // Riferimento all'ID del Gap
                gapItemId: { type: String }, // item_id del Gap per facile lookup
                gapDescrizioneBreve: { type: String } // Breve descrizione del gap per il report
            }],
            suggerimentiInterventoStrategicoAI: [{ type: String }] // Suggerimenti di alto livello
        }],
        summaryAnalisiCauseAI: { type: String } // Commento riassuntivo dell'AI sull'analisi
    },
    // --- FINE NUOVA SEZIONE ---
    
    generato_da_id: { type: Schema.Types.ObjectId, ref: "User" },
    versioneReport: { type: Number, default: 1 },
    raccomandazioniGenerali: [String]

}, { timestamps: { createdAt: 'data_creazione_documento_report', updatedAt: 'data_ultima_modifica_report' } });

const Checklist = mongoose.model("Checklist", ChecklistSchema);

const Gap = mongoose.model("Gap", GapSchema);

const ReportDiagnostico = mongoose.model("ReportDiagnostico", ReportDiagnosticoSchema);

module.exports = {
  Checklist: Checklist,
  Gap: Gap,
  ReportDiagnostico: ReportDiagnostico
};