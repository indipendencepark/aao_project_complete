
const express = require("express");

const router = express.Router();

const mongoose = require("mongoose");

const {generateReportContent: generateReportContent} = require("../services/reportGenerator");

const {generateExecutiveSummaryAI: generateExecutiveSummaryAI} = require("../services/summaryGeneratorAI");

router.get("/", (async (req, res) => {
  console.log(`Richiesta GET /api/report (con generazione summary AI)`);
  const checklistId = req.query.checklist_id;
  if (!checklistId || !mongoose.Types.ObjectId.isValid(checklistId)) {
    return res.status(400).json({
      message: "ID Checklist non valido o mancante."
    });
  }
  try {

    console.log(`>>> Chiamata a generateReportContent per ${checklistId}...`);
    let reportData = await generateReportContent(checklistId);
    console.log(`>>> Dati report base generati per ${checklistId}.`);

        const datiPerAISummary = reportData._datiPerAISummary;
    delete reportData._datiPerAISummary;

        let executiveSummaryText = "Executive summary non generato (servizio AI non disponibile o errore).";
    if (datiPerAISummary) {

      try {
        console.log(`>>> Chiamata a generateExecutiveSummaryAI...`);

                executiveSummaryText = await generateExecutiveSummaryAI(datiPerAISummary, reportData.clienteInfo);
        console.log(">>> Executive Summary ricevuto da AI.");
      } catch (aiError) {
        console.error("Errore durante la generazione dell'Executive Summary AI via API:", aiError.message);
        executiveSummaryText = `Giudizio preliminare: ${reportData.executiveSummaryBase?.giudizioGenerale || "N/D"}. Si consiglia revisione manuale dell'executive summary. (Errore AI: ${aiError.message})`;
      }
    }

        reportData.sintesi_esecutiva = executiveSummaryText;
    console.log(`>>> Dati report finali (con summary AI) pronti. Invio risposta...`);
    res.json({
      message: `Dati report generati per checklist ${checklistId}`,
      data: reportData
    });
  } catch (err) {
    console.error(`!!! Errore in GET /api/report per checklist ${checklistId}:`, err.message, err.stack);
    if (err.message === "Checklist non trovata.") {
      return res.status(404).json({
        message: err.message
      });
    }
    res.status(500).json({
      message: "Errore del server durante la generazione dei dati del report."
    });
  }
}));

module.exports = router;
