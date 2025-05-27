const express = require("express");

const router = express.Router();

const mongoose = require("mongoose");

const {Gap: Gap} = require("../models/diagnosi");

const {analyzeGapRootCause: analyzeGapRootCause} = require("../services/rootCauseAnalyzerAI");

const {Checklist: Checklist} = require("../models/diagnosi");

router.get("/gaps", (async (req, res) => {

  console.log(`Richiesta GET /api/assessment/gaps (non protetta per test)`);
  const checklistId = req.query.checklist_id;

    if (!checklistId) {
    return res.status(400).json({
      message: "Il parametro checklist_id è obbligatorio."
    });
  }
  if (!mongoose.Types.ObjectId.isValid(checklistId)) {
    return res.status(400).json({
      message: "ID Checklist non valido."
    });
  }
  try {

    const gaps = await Gap.find({
      checklist_id: checklistId
    }).sort({
      livello_rischio: -1,
      item_id: 1
    });

        console.log(`Trovati ${gaps.length} gap per checklist ${checklistId}`);
    res.json({
      message: `Gap recuperati per checklist ${checklistId}`,
      data: gaps
    });
  } catch (err) {
    console.error("Errore in GET /api/assessment/gaps:", err.message);
    res.status(500).json({
      message: "Errore del server nel recupero dei gap."
    });
  }
}));

router.post("/gaps/:gapId/root-cause", (async (req, res) => {
  const {gapId: gapId} = req.params;
  const {checklistId: checklistId, relatedGapIds: relatedGapIds} = req.body;

    console.log(`Richiesta POST /api/assessment/gaps/${gapId}/root-cause`);
  console.log(`Body ricevuto: checklistId=${checklistId}, relatedGapIds=${relatedGapIds}`);
  if (!mongoose.Types.ObjectId.isValid(gapId)) {
    return res.status(400).json({
      message: "ID Gap non valido."
    });
  }
  if (!checklistId || !mongoose.Types.ObjectId.isValid(checklistId)) {
    return res.status(400).json({
      message: "ID Checklist valido è obbligatorio nel body."
    });
  }
  if (relatedGapIds && (!Array.isArray(relatedGapIds) || !relatedGapIds.every((id => mongoose.Types.ObjectId.isValid(id))))) {
    return res.status(400).json({
      message: "relatedGapIds deve essere un array di ID validi, se fornito."
    });
  }
  try {
    const causeRadice = await analyzeGapRootCause(gapId, checklistId, relatedGapIds);

        await Gap.findByIdAndUpdate(gapId, {
      $set: {
        causeRadiceSuggeriteAI: causeRadice,
        ultimaAnalisiCauseRadice: new Date
      }
    });
    console.log(`Cause radice per Gap ${gapId} salvate nel DB.`);
    res.json({
      message: "Analisi cause radice completata e salvata.",
      data: causeRadice
    });
  } catch (error) {
    console.error(`Errore API analisi cause radice per Gap ${gapId}:`, error);
    res.status(500).json({
      message: error.message || "Errore del server durante l''analisi delle cause radice."
    });
  }
}));

module.exports = router;