const express = require("express");

const router = express.Router();

const mongoose = require("mongoose");

const {Gap: Gap} = require("../models/diagnosi");

const {analyzeGapRootCause: analyzeGapRootCause} = require("../services/rootCauseAnalyzerAI");

const {Checklist: Checklist} = require("../models/diagnosi");

const { ReportDiagnostico } = require("../models/diagnosi");
const { analyzeAggregatedRootCauses } = require("../services/aggregatedRootCauseAnalyzerAI");

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

router.post("/checklists/:checklistId/aggregated-root-cause", async (req, res) => {
    const { checklistId } = req.params;
    const { considerOnlyCriticalGaps } = req.body;

    console.log(`Richiesta POST /api/assessment/checklists/${checklistId}/aggregated-root-cause`);

    if (!mongoose.Types.ObjectId.isValid(checklistId)) {
        return res.status(400).json({ message: "ID Checklist non valido." });
    }

    let reportDoc;
    try {
        reportDoc = await ReportDiagnostico.findOne({ checklist_id: checklistId });
        if (!reportDoc) {
            const checklistData = await Checklist.findById(checklistId).select("nome cliente").lean();
            if (!checklistData) {
                return res.status(404).json({ message: "Checklist di riferimento non trovata per creare/aggiornare il report." });
            }
            reportDoc = new ReportDiagnostico({ 
                checklist_id: checklistId,
                titolo: `Report Diagnostico per ${checklistData.nome}`,
                clienteInfo: checklistData.cliente,
            });
            console.log("ReportDiagnostico non esistente, preparato per la creazione.");
        }
        
        reportDoc.analisiCauseRadiceAggregate = {
            ...(reportDoc.analisiCauseRadiceAggregate || {}),
            statusAnalisi: 'PROCESSING',
            messaggioAnalisi: 'Analisi cause radice aggregate in corso...',
            dataUltimaAnalisi: new Date()
        };
        await reportDoc.save();
        console.log("Stato analisi aggiornato a PROCESSING nel ReportDiagnostico.");

        analyzeAggregatedRootCauses(checklistId, considerOnlyCriticalGaps)
            .then(async (analysisResult) => {
                console.log(`Analisi AI completata per ${checklistId}. Risultato:`, analysisResult);
                const updatedReport = await ReportDiagnostico.findOne({ checklist_id: checklistId });
                if (updatedReport) {
                    updatedReport.analisiCauseRadiceAggregate = {
                        ...updatedReport.analisiCauseRadiceAggregate,
                        summaryAnalisiCauseAI: analysisResult.summaryAnalisiCauseAI,
                        causeIdentificate: analysisResult.causeIdentificate.map(causa => ({
                            ...causa,
                            gapDirettamenteImplicati: causa.gapDirettamenteImplicati.map(g => ({
                                ...g,
                                gapRefId: g.gapRefId && mongoose.Types.ObjectId.isValid(g.gapRefId) ? g.gapRefId : null
                            }))
                        })),
                        statusAnalisi: 'COMPLETED',
                        messaggioAnalisi: 'Analisi cause radice aggregate completata con successo.'
                    };
                    await updatedReport.save();
                    console.log(`Risultati analisi cause aggregate salvati nel ReportDiagnostico per ${checklistId}.`);
                } else {
                     console.error(`ReportDiagnostico per ${checklistId} non trovato dopo analisi AI per salvare i risultati.`);
                }
            })
            .catch(async (aiError) => {
                console.error(`Errore durante l'analisi AI asincrona per ${checklistId}:`, aiError);
                const errorReport = await ReportDiagnostico.findOne({ checklist_id: checklistId });
                 if (errorReport) {
                    errorReport.analisiCauseRadiceAggregate = {
                        ...(errorReport.analisiCauseRadiceAggregate || {}),
                        statusAnalisi: 'FAILED',
                        messaggioAnalisi: `Errore AI: ${aiError.message}`
                    };
                    await errorReport.save();
                    console.log(`Stato analisi aggiornato a FAILED nel ReportDiagnostico per ${checklistId}.`);
                }
            });

        res.status(202).json({ 
            message: "Richiesta di analisi cause radice aggregate accettata. Il processo è in corso in background.",
            reportId: reportDoc._id
        });

    } catch (error) {
        console.error(`Errore API analisi cause radice aggregate per Checklist ${checklistId}:`, error);
        if (reportDoc && reportDoc.analisiCauseRadiceAggregate?.statusAnalisi === 'PROCESSING') {
            reportDoc.analisiCauseRadiceAggregate.statusAnalisi = 'FAILED';
            reportDoc.analisiCauseRadiceAggregate.messaggioAnalisi = `Errore server: ${error.message}`;
            try { await reportDoc.save(); } catch (saveErr) { console.error("Errore salvataggio stato FAILED:", saveErr); }
        }
        res.status(500).json({
            message: error.message || "Errore del server durante l'avvio dell'analisi delle cause radice aggregate."
        });
    }
});

router.get("/checklists/:checklistId/aggregated-root-cause-status", async (req, res) => {
    const { checklistId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(checklistId)) {
        return res.status(400).json({ message: "ID Checklist non valido." });
    }
    try {
        const report = await ReportDiagnostico.findOne({ checklist_id: checklistId })
            .select("analisiCauseRadiceAggregate.statusAnalisi analisiCauseRadiceAggregate.messaggioAnalisi analisiCauseRadiceAggregate.dataUltimaAnalisi");
        
        if (!report || !report.analisiCauseRadiceAggregate) {
            return res.status(404).json({ 
                status: 'IDLE', 
                message: 'Analisi non ancora avviata o report non trovato.' 
            });
        }
        res.json({
            status: report.analisiCauseRadiceAggregate.statusAnalisi,
            message: report.analisiCauseRadiceAggregate.messaggioAnalisi,
            lastAnalysisDate: report.analisiCauseRadiceAggregate.dataUltimaAnalisi
        });
    } catch (error) {
        console.error("Errore recupero stato analisi aggregata:", error);
        res.status(500).json({ message: "Errore server recupero stato analisi." });
    }
});

module.exports = router;