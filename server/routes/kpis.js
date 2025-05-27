const express = require("express");

const router = express.Router();

const mongoose = require("mongoose");

const {Kpi: Kpi} = require("../models/monitoraggio");

router.get("/", (async (req, res) => {

  console.log(`Richiesta GET /api/kpis (non protetta per test)`);
  try {
    const kpis = await Kpi.find({}).sort({
      nome: 1
    });
    res.json({
      message: "KPI recuperati con successo",
      data: kpis
    });
  } catch (err) {
    console.error("Errore in GET /api/kpis:", err.message);
    res.status(500).json({
      message: "Errore del server nel recupero dei KPI."
    });
  }
}));

router.post("/", (async (req, res) => {

  console.log(`Richiesta POST /api/kpis (non protetta per test) con body:`, req.body);

    const {codice: codice, nome: nome, area: area} = req.body;
  if (!codice || !nome || !area) return res.status(400).json({
    message: "Codice, Nome e Area sono obbligatori."
  });
  try {
    let kpi = await Kpi.findOne({
      codice: codice
    });
    if (kpi) return res.status(400).json({
      message: "Esiste già un KPI con questo codice."
    });
    kpi = new Kpi(req.body);

        const nuovoKpi = await kpi.save();
    res.status(201).json({
      message: "KPI creato con successo",
      data: nuovoKpi
    });
  } catch (err) {
    console.error("Errore in POST /api/kpis:", err.message);
    if (err.name === "ValidationError") return res.status(400).json({
      message: "Errore di validazione",
      errors: err.errors
    });
    res.status(500).json({
      message: "Errore del server durante la creazione del KPI."
    });
  }
}));

router.get("/", (async (req, res) => {
  console.log(`Richiesta GET /api/kpis (non protetta per test)`);
  try {
    console.log("Tentativo Kpi.find()...");
    const kpis = await Kpi.find({}).sort({
      nome: 1
    });
    console.log(`Kpi.find() completato, trovati ${kpis.length} record.`);
    res.json({
      message: "KPI recuperati con successo",
      data: kpis
    });
    console.log("Risposta JSON inviata.");
  } catch (err) {
    console.error("!!! ERRORE nel blocco try/catch di GET /api/kpis:", err.message);

        console.error(err.stack);

        res.status(500).json({
      message: "Errore del server nel recupero dei KPI."
    });
  }
}));

router.put("/:id", (async (req, res) => {

  console.log(`Richiesta PUT /api/kpis/${req.params.id} (non protetta per test) con body:`, req.body);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({
    message: "ID KPI non valido."
  });
  const campiDaAggiornare = {
    ...req.body,
    data_aggiornamento: Date.now()
  };

    try {
    let kpi = await Kpi.findById(req.params.id);
    if (!kpi) return res.status(404).json({
      message: "KPI non trovato."
    });

        kpi = await Kpi.findByIdAndUpdate(req.params.id, {
      $set: campiDaAggiornare
    }, {
      new: true,
      runValidators: true
    });
    res.json({
      message: "KPI aggiornato con successo",
      data: kpi
    });
  } catch (err) {
    console.error(`Errore in PUT /api/kpis/${req.params.id}:`, err.message);
    if (err.name === "ValidationError") return res.status(400).json({
      message: "Errore di validazione",
      errors: err.errors
    });
    res.status(500).json({
      message: "Errore del server durante l'aggiornamento del KPI."
    });
  }
}));

router.delete("/:id", (async (req, res) => {

  console.log(`Richiesta DELETE /api/kpis/${req.params.id} (non protetta per test)`);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({
    message: "ID KPI non valido."
  });
  try {
    const kpi = await Kpi.findById(req.params.id);
    if (!kpi) return res.status(404).json({
      message: "KPI non trovato."
    });
    await Kpi.findByIdAndDelete(req.params.id);
    res.json({
      message: "KPI eliminato con successo"
    });
  } catch (err) {
    console.error(`Errore in DELETE /api/kpis/${req.params.id}:`, err.message);
    res.status(500).json({
      message: "Errore del server durante l'eliminazione del KPI."
    });
  }
}));

module.exports = router;