
const express = require("express");

const router = express.Router();

const mongoose = require("mongoose");

const {PianoAzione: PianoAzione, Intervento: Intervento} = require("../models/progettazione");

const {Checklist: Checklist} = require("../models/diagnosi");

const {suggestActionPlan: suggestActionPlan, createAiActionPlan: createAiActionPlan} = require("../services/actionPlanner");

router.get("/", (async (req, res) => {
  console.log("--- INIZIO GET /api/action-plan ---");
  console.log("req.query:", req.query);
  const checklistFilterValue = req.query.checklist_id;
  try {
    const filtro = {};
    if (checklistFilterValue) {
      if (checklistFilterValue === "manuali") {
        console.log("Applico filtro: Piani Manuali");
        filtro.origin = "manuale";

            } else if (checklistFilterValue === "tutti_ai") {

        console.log("Applico filtro: Tutti Piani AI");
        filtro.origin = "suggerito_ai";
      } else if (mongoose.Types.ObjectId.isValid(checklistFilterValue)) {
        console.log(`Applico filtro: Piani AI per Checklist ID ${checklistFilterValue}`);
        filtro.checklist_id_origine = checklistFilterValue;
        filtro.origin = "suggerito_ai";

            } else {

        console.error(`Valore filtro checklist_id non valido ricevuto: ${checklistFilterValue}`);
        return res.status(400).json({
          message: `Valore filtro checklist_id non valido: ${checklistFilterValue}`
        });
      }
    } else {
      console.log("Nessun filtro checklist_id fornito. Restituisco array vuoto.");
      return res.json({
        message: "Nessun filtro origine specificato.",
        data: []
      });
    }
    console.log("Filtro Mongoose costruito:", filtro);

        const selectFields = "titolo cliente.nome stato data_creazione origin checklist_id_origine";
    const piani = await PianoAzione.find(filtro).select(selectFields).sort({
      data_creazione: -1
    }).lean();

        console.log(`Trovati ${piani.length} piani con filtro.`);
    res.json({
      message: "Piani d'azione recuperati con successo",
      data: piani
    });
  } catch (err) {
    console.error("Errore in GET /api/action-plan:", err.message, err.stack);

        res.status(500).json({
      message: "Errore del server nel recupero dei piani d'azione."
    });
  }
  console.log("--- FINE GET /api/action-plan ---");
}));

router.get("/:id", (async (req, res) => {

  console.log("--- INIZIO GET /api/action-plan/:id ---");
  console.log("req.originalUrl:", req.originalUrl);
  console.log("req.params:", req.params);

    console.log("ID ricevuto?", req.params.id);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      message: "ID Piano non valido."
    });
  }
  try {
    const piano = await PianoAzione.findById(req.params.id).populate({
      path: "interventi",
      select: "titolo area priorita stato completamento_perc"
    }).lean();

        if (!piano) {
      console.log(`Piano con ID ${req.params.id} non trovato.`);
      return res.status(404).json({
        message: "Piano d'azione non trovato."
      });
    }
    console.log(`Piano ${req.params.id} trovato e popolato.`);
    res.json({
      message: "Dettaglio piano recuperato con successo",
      data: piano
    });
  } catch (err) {
    console.error(`Errore in GET /api/action-plan/${req.params.id}:`, err.message);
    res.status(500).json({
      message: "Errore del server nel recupero del dettaglio piano."
    });
  }
}));

router.post("/", (async (req, res) => {
  console.log(`Richiesta POST /api/action-plan (non protetta per test) con body:`, req.body);
  const {titolo: titolo, descrizione: descrizione, cliente: cliente, interventi: interventi, checklistIdOrigine: // Array di ID stringa degli interventi da includere
  checklistIdOrigine} = req.body;
  if (!titolo || !cliente || !cliente.nome) {
    return res.status(400).json({
      message: "Titolo e Nome Cliente sono obbligatori."
    });
  }
  try {
    let interventiValidi = [];
    if (interventi && Array.isArray(interventi)) {

      const checkPromises = interventi.filter((id => mongoose.Types.ObjectId.isValid(id))).map((id => Intervento.findById(id).select("_id").lean()));

            const risultati = await Promise.all(checkPromises);
      interventiValidi = risultati.filter((i => i !== null)).map((i => i._id));
      if (interventiValidi.length !== interventi.length) {
        console.warn("POST /api/action-plan: Alcuni ID intervento forniti non erano validi o non trovati.");
      }
    }

        const origin = checklistIdOrigine ? "suggerito_ai" : "manuale";
    const dataToSave = {
      titolo: titolo,
      descrizione: descrizione,
      cliente: cliente,
      interventi: interventiValidi,
      stato: "bozza",
      origin: origin
    };

        if (origin === "suggerito_ai" && checklistIdOrigine && mongoose.Types.ObjectId.isValid(checklistIdOrigine)) {
      dataToSave.checklist_id_origine = checklistIdOrigine;
    }

        console.log("Dati da salvare per Nuovo Piano:", dataToSave);
    const nuovoPiano = new PianoAzione(dataToSave);

        await nuovoPiano.save();

        const pianoSalvato = await PianoAzione.findById(nuovoPiano._id).select("titolo cliente.nome stato data_creazione origin checklist_id_origine").lean();
    res.status(201).json({
      message: "Piano d'azione creato con successo",
      data: pianoSalvato
    });
  } catch (err) {
    console.error("Errore in POST /api/action-plan:", err.message, err.stack);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((el => el.message));
      return res.status(400).json({
        message: `Errore di validazione: ${errors.join(", ")}`,
        errors: err.errors
      });
    }
    res.status(500).json({
      message: "Errore del server durante la creazione del piano."
    });
  }
}));

router.put("/:id", (async (req, res) => {
  console.log(`Richiesta PUT /api/action-plan/${req.params.id} con body:`, req.body);
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      message: "ID Piano non valido."
    });
  }
  const {titolo: titolo, descrizione: descrizione, cliente: cliente, interventi: interventi, stato: stato, responsabile_piano: // 'interventi' è l'array di ID
  responsabile_piano, data_inizio: data_inizio, data_fine_prevista: data_fine_prevista} = req.body;
  const campiDaAggiornare = {};
  if (titolo !== undefined) campiDaAggiornare.titolo = titolo;
  if (descrizione !== undefined) campiDaAggiornare.descrizione = descrizione;

    if (cliente?.nome !== undefined) campiDaAggiornare["cliente.nome"] = cliente.nome;
  if (stato !== undefined) campiDaAggiornare.stato = stato;
  if (responsabile_piano !== undefined) campiDaAggiornare.responsabile_piano = responsabile_piano;

    if (data_inizio !== undefined) {
    const date = data_inizio ? new Date(data_inizio) : null;
    campiDaAggiornare.data_inizio = date instanceof Date && !isNaN(date) ? date : null;
  }
  if (data_fine_prevista !== undefined) {
    const date = data_fine_prevista ? new Date(data_fine_prevista) : null;
    campiDaAggiornare.data_fine_prevista = date instanceof Date && !isNaN(date) ? date : null;
  }

    if (interventi !== undefined && Array.isArray(interventi)) {

    campiDaAggiornare.interventi = interventi.filter((id => mongoose.Types.ObjectId.isValid(id)));

    }

    console.log("Campi da aggiornare per PUT:", campiDaAggiornare);
  try {
    const piano = await PianoAzione.findByIdAndUpdate(req.params.id, {
      $set: campiDaAggiornare
    }, {
      new: true,
      runValidators: true
    }).populate({
      path: "interventi",
      select: "titolo area priorita stato completamento_perc"
    }).lean();
    if (!piano) {
      return res.status(404).json({
        message: "Piano d'azione non trovato."
      });
    }
    res.json({
      message: "Piano d'azione aggiornato con successo",
      data: piano
    });
  } catch (err) {
    console.error(`Errore in PUT /api/action-plan/${req.params.id}:`, err.message, err.stack);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((el => el.message));
      return res.status(400).json({
        message: `Errore di validazione: ${errors.join(", ")}`,
        errors: err.errors
      });
    }
    res.status(500).json({
      message: "Errore del server durante l'aggiornamento del piano."
    });
  }
}));

router.delete("/:id", (async (req, res) => {
  console.log(`Richiesta DELETE /api/action-plan/${req.params.id} (non protetta per test)`);
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({
    message: "ID Piano non valido."
  });
  try {
    const piano = await PianoAzione.findByIdAndDelete(req.params.id);
    if (!piano) return res.status(404).json({
      message: "Piano d'azione non trovato."
    });
    res.json({
      message: "Piano d'azione eliminato con successo"
    });
  } catch (err) {
    console.error(`Errore in DELETE /api/action-plan/${req.params.id}:`, err.message);
    res.status(500).json({
      message: "Errore del server durante l'eliminazione del piano."
    });
  }
}));

router.post("/suggest", (async (req, res) => {
  console.log(`Richiesta POST /api/action-plan/suggest (non protetta) con body:`, req.body);
  const {checklistId: checklistId} = req.body;
  if (!checklistId) return res.status(400).json({
    message: "ID Checklist mancante nel corpo della richiesta."
  });
  if (!mongoose.Types.ObjectId.isValid(checklistId)) return res.status(400).json({
    message: "ID Checklist non valido."
  });
  try {
    const checklist = await Checklist.findById(checklistId).select("cliente").lean();

        if (!checklist) return res.status(404).json({
      message: "Checklist non trovata."
    });
    if (!checklist.cliente || !checklist.cliente.dimensioneStimata) {

      return res.status(400).json({
        message: "Informazioni cliente (Dimensione Stimata) mancanti nella checklist."
      });
    }
    const azioniSuggerite = await suggestActionPlan(checklistId, checklist.cliente);

        res.json({
      message: `Suggerimenti piano d'azione generati per checklist ${checklistId}.`,
      data: azioniSuggerite
    });
  } catch (error) {
    console.error(`!!! Errore in POST /api/action-plan/suggest per checklist ${checklistId}:`, error);
    res.status(500).json({
      message: `Errore del server durante la generazione dei suggerimenti: ${error.message}`
    });
  }
}));

 router.post("/generate-ai", (async (req, res) => {
  console.log(`Richiesta POST /api/action-plan/generate-ai con body:`, req.body);
  const {checklistId: checklistId} = req.body;
  if (!checklistId) {
    return res.status(400).json({
      message: "ID Checklist mancante nel corpo della richiesta."
    });
  }
  if (!mongoose.Types.ObjectId.isValid(checklistId)) {
    return res.status(400).json({
      message: "ID Checklist non valido."
    });
  }
  try {

    const nuovoPiano = await createAiActionPlan(checklistId);

        res.status(201).json({
      message: `Piano d'azione generato con successo per la checklist ${checklistId}.`,
      data: nuovoPiano
    });
  } catch (error) {
    console.error(`!!! Errore in POST /api/action-plan/generate-ai per checklist ${checklistId}:`, error);

        if (error.message.includes("Checklist non trovata") || error.message.includes("non è completata")) {
      return res.status(400).json({
        message: error.message
      });
    }
    if (error.message.includes("Errore nella preparazione degli interventi")) {
      return res.status(500).json({
        message: error.message
      });

        }

        res.status(500).json({
      message: `Errore del server durante la generazione del piano AI: ${error.message}`
    });
  }
}));

module.exports = router;
