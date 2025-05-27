

const express = require("express");

const router = express.Router();

const mongoose = require("mongoose");

const {Intervento: Intervento, PianoAzione: PianoAzione} = require("../models/progettazione");

const {Checklist: Checklist} = require("../models/diagnosi");

const {generateInterventionsFromGaps: generateInterventionsFromGaps} = require("../services/interventionGenerator");

router.get("/", (async (req, res) => {
  console.log(`Richiesta GET /api/interventions con query:`, req.query);
  try {
    const filtro = {};

        if (req.query.area) filtro.area = req.query.area;
    if (req.query.priorita) filtro.priorita = req.query.priorita;
    if (req.query.stato) filtro.stato = req.query.stato;

        if (req.query.gap_id && mongoose.Types.ObjectId.isValid(req.query.gap_id)) {
      filtro.gap_correlati = req.query.gap_id;
    }

        const checklistFilterValue = req.query.checklist_id;

        if (checklistFilterValue) {
      if (checklistFilterValue === "manuali") {

        filtro.origin = "manuale";

            } else if (checklistFilterValue === "tutti_ai") {

        filtro.origin = "ai_generated";
      } else if (mongoose.Types.ObjectId.isValid(checklistFilterValue)) {

        filtro.checklist_id_origine = checklistFilterValue;
        filtro.origin = "ai_generated";

            }

        }

        console.log("Filtro intervento applicato:", filtro);
    const interventi = await Intervento.find(filtro).populate("gap_correlati", "item_id descrizione").select("titolo descrizione area priorita stato responsabile data_fine_prevista completamento_perc origin checklist_id_origine gap_correlati tempistica_stimata risorse_necessarie data_inizio_prevista data_completamento_effettiva note_avanzamento").sort({
      priorita: 1,
      data_creazione: -1
    });

        res.json({
      message: "Interventi recuperati con successo",
      data: interventi
    });
  } catch (err) {
    console.error("Errore in GET /api/interventions:", err.message);
    res.status(500).json({
      message: "Errore del server nel recupero degli interventi."
    });
  }
}));

router.post("/", (async (req, res) => {
  console.log(`Richiesta POST /api/interventions (MANUALE) con body:`, req.body);
  try {
    const {titolo: titolo, descrizione: descrizione, area: area, priorita: priorita, gap_correlati: gap_correlati, tempistica_stimata: tempistica_stimata, risorse_necessarie: risorse_necessarie, stato: stato, responsabile: responsabile, data_inizio_prevista: data_inizio_prevista, data_fine_prevista: data_fine_prevista, completamento_perc: completamento_perc, note_avanzamento: note_avanzamento} = req.body;
    if (!titolo || !area || !priorita) {
      return res.status(400).json({
        message: "Titolo, Area e Priorità sono obbligatori."
      });
    }
    let gapObjectIds = [];
    if (gap_correlati && Array.isArray(gap_correlati)) {
      gapObjectIds = gap_correlati.filter((id => mongoose.Types.ObjectId.isValid(id))).map((id => mongoose.Types.ObjectId(id)));
    }
    const nuovoIntervento = new Intervento({
      titolo: titolo,
      descrizione: descrizione,
      area: area,
      priorita: priorita,
      stato: stato || "suggerito",
      gap_correlati: gapObjectIds,
      tempistica_stimata: tempistica_stimata,
      risorse_necessarie: risorse_necessarie,
      responsabile: responsabile,
      data_inizio_prevista: data_inizio_prevista,
      data_fine_prevista: data_fine_prevista,
      completamento_perc: completamento_perc,
      note_avanzamento: note_avanzamento,
      origin: "manuale"
    });
    await nuovoIntervento.save();
    res.status(201).json({
      message: "Intervento creato manualmente con successo",
      data: nuovoIntervento
    });
  } catch (err) {
    console.error("Errore in POST /api/interventions:", err.message);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((el => el.message));
      return res.status(400).json({
        message: `Errore di validazione: ${errors.join(", ")}`,
        errors: err.errors
      });
    }
    res.status(500).json({
      message: "Errore del server durante la creazione dell'intervento."
    });
  }
}));

router.post("/generate-from-checklist", (async (req, res) => {
  console.log(`Richiesta POST /generate-from-checklist con body:`, req.body);
  const {checklistId: checklistId} = req.body;
  if (!checklistId || !mongoose.Types.ObjectId.isValid(checklistId)) {
    return res.status(400).json({
      message: "ID Checklist non valido o mancante."
    });
  }
  try {

    const count = await generateInterventionsFromGaps(checklistId);
    res.status(200).json({
      message: `Generazione interventi completata. Creati ${count} interventi suggeriti.`,
      data: {
        generatedCount: count
      }
    });
  } catch (error) {
    console.error(`!!! Errore in POST /generate-from-checklist per ${checklistId}:`, error);
    if (error.message.includes("Checklist non trovata") || error.message.includes("Dimensione cliente mancante")) {
      return res.status(400).json({
        message: error.message
      });
    }
    res.status(500).json({
      message: `Errore del server durante la generazione: ${error.message}`
    });
  }
}));

router.get("/:id", (async (req, res) => {
  console.log(`Richiesta GET /api/interventions/${req.params.id}`);
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({
    message: "ID Intervento non valido."
  });
  try {

    const intervento = await Intervento.findById(req.params.id).populate("gap_correlati", "item_id descrizione livello_rischio").lean();

        if (!intervento) return res.status(404).json({
      message: "Intervento non trovato."
    });
    console.log("Intervento recuperato per modifica (backend):", JSON.stringify(intervento, null, 2));

        res.json({
      message: "Intervento recuperato con successo",
      data: intervento
    });
  } catch (err) {
    console.error(`Errore in GET /api/interventions/${req.params.id}:`, err.message);
    res.status(500).json({
      message: "Errore del server nel recupero dell'intervento."
    });
  }
}));

router.put("/:id", (async (req, res) => {
  console.log(`Richiesta PUT /api/interventions/${req.params.id} con body:`, req.body);
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({
    message: "ID Intervento non valido."
  });

    const {titolo: titolo, descrizione: descrizione, priorita: priorita, tempistica_stimata: tempistica_stimata, risorse_necessarie: risorse_necessarie, stato: stato, responsabile: responsabile, data_inizio_prevista: data_inizio_prevista, data_fine_prevista: data_fine_prevista, data_completamento_effettiva: data_completamento_effettiva, completamento_perc: completamento_perc, note_avanzamento: note_avanzamento} = req.body;
  const campiDaAggiornare = {};

    if (titolo !== undefined) campiDaAggiornare.titolo = titolo;
  if (descrizione !== undefined) campiDaAggiornare.descrizione = descrizione;

    if (priorita !== undefined) campiDaAggiornare.priorita = priorita;
  if (tempistica_stimata !== undefined) campiDaAggiornare.tempistica_stimata = tempistica_stimata;
  if (risorse_necessarie !== undefined) campiDaAggiornare.risorse_necessarie = risorse_necessarie;
  if (stato !== undefined) campiDaAggiornare.stato = stato;
  if (responsabile !== undefined) campiDaAggiornare.responsabile = responsabile;
  if (data_inizio_prevista !== undefined) campiDaAggiornare.data_inizio_prevista = data_inizio_prevista ? new Date(data_inizio_prevista) : null;
  if (data_fine_prevista !== undefined) campiDaAggiornare.data_fine_prevista = data_fine_prevista ? new Date(data_fine_prevista) : null;
  if (data_completamento_effettiva !== undefined) campiDaAggiornare.data_completamento_effettiva = data_completamento_effettiva ? new Date(data_completamento_effettiva) : null;
  if (completamento_perc !== undefined && completamento_perc !== null) campiDaAggiornare.completamento_perc = Number(completamento_perc);
  if (note_avanzamento !== undefined) campiDaAggiornare.note_avanzamento = note_avanzamento;

    try {
    const intervento = await Intervento.findByIdAndUpdate(req.params.id, {
      $set: campiDaAggiornare
    }, {
      new: true,
      runValidators: true
    }).lean();

        if (!intervento) return res.status(404).json({
      message: "Intervento non trovato."
    });
    res.json({
      message: "Intervento aggiornato con successo",
      data: intervento
    });
  } catch (err) {
    console.error(`Errore in PUT /api/interventions/${req.params.id}:`, err.message);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((el => el.message));
      return res.status(400).json({
        message: `Errore di validazione: ${errors.join(", ")}`,
        errors: err.errors
      });
    }
    res.status(500).json({
      message: "Errore del server durante l'aggiornamento."
    });
  }
}));

router.delete("/:id", (async (req, res) => {
  console.log(`Richiesta DELETE /api/interventions/${req.params.id}`);
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({
    message: "ID Intervento non valido."
  });
  try {
    const intervento = await Intervento.findByIdAndDelete(req.params.id);
    if (!intervento) return res.status(404).json({
      message: "Intervento non trovato."
    });

        await PianoAzione.updateMany({
      interventi: req.params.id
    }, {
      $pull: {
        interventi: req.params.id
      }
    });
    console.log(`Intervento ${req.params.id} rimosso da eventuali Piani d'Azione.`);
    res.json({
      message: "Intervento eliminato con successo"
    });
  } catch (err) {
    console.error(`Errore in DELETE /api/interventions/${req.params.id}:`, err.message);
    res.status(500).json({
      message: "Errore del server durante l'eliminazione."
    });
  }
}));

module.exports = router;
