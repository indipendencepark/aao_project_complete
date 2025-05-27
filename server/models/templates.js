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

const QuestionTemplateSchema = new Schema({
  itemId: {

    type: String,
    required: true,
    unique: true,

    index: true
  },
  domanda: {
    type: String,
    required: true
  },
  area: {
    type: String,
    required: true,
    enum: [ "Prelim.", "Org", "Admin", "Acct", "Crisi" ]
  },
  sottoArea: {

    type: String
  },
  tags: {
    type: [ String ],
    default: []
  },

  dependsOn: [ VisibilityConditionSchema ],

  rilevanza: {

    type: String,
    required: true
  },
  fonte: {

    type: String
  },
  tipoRisposta: {

    type: String,
    required: true,
    enum: [ "SiNoParz", "SiNo", "Testo", "TestoLungo", "Numero", "Data", "SceltaMultipla" ],
    default: "SiNoParz"
  },
  opzioniRisposta: [ String ],

  testoAiuto: {

    type: String
  },
  attiva: {

    type: Boolean,
    default: true
  },
  ordine: {

    type: Number
  }
}, {
  timestamps: true
});

const QuestionTemplate = mongoose.model("QuestionTemplate", QuestionTemplateSchema);

module.exports = {
  QuestionTemplate: QuestionTemplate
};