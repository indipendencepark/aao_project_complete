const express = require("express");

const router = express.Router();

const mongoose = require("mongoose");

const {generateReportContent: generateReportContent} = require("../services/reportGenerator");

const {PianoAzione: PianoAzione} = require("../models/progettazione");

const {generatePdfFromReportData: generatePdfFromReportData, generatePdfFromActionPlanData: generatePdfFromActionPlanData} = require("../services/pdfGenerator");

const { ReportDiagnostico } = require("../models/diagnosi");

router.post("/report/:reportDocumentId/pdf", async (req, res) => {
  const reportDocumentId = req.params.reportDocumentId;
  console.log(`>>> Ricevuta richiesta POST /api/export/report/${reportDocumentId}/pdf (Base64)`);

  if (!mongoose.Types.ObjectId.isValid(reportDocumentId)) {
    return res.status(400).json({ message: "ID Documento Report non valido." });
  }

  try {
    console.log(`>>> [PDF EXPORT] Recupero ReportDiagnostico dal DB con ID: ${reportDocumentId}...`);
    const reportDataFromDb = await ReportDiagnostico.findById(reportDocumentId).lean();
    
    if (!reportDataFromDb) {
      console.error(`>>> [PDF EXPORT] ReportDiagnostico con ID ${reportDocumentId} non trovato nel DB.`);
      return res.status(404).json({ message: "Dati del report non trovati nel database." });
    }
    
    console.log(`>>> [PDF EXPORT] Dati report recuperati dal DB. Sintesi: ${reportDataFromDb.sintesi_esecutiva?.substring(0,50)}... Avvio generazione PDF...`);
    
    let generatedPdfObject = await generatePdfFromReportData(reportDataFromDb);
    
    let pdfBuffer;
    if (Buffer.isBuffer(generatedPdfObject)) { pdfBuffer = generatedPdfObject; }
    else if (generatedPdfObject instanceof Uint8Array) { pdfBuffer = Buffer.from(generatedPdfObject); }
    else { throw new Error("La generazione PDF non ha restituito dati binari validi."); }

    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      throw new Error("Il buffer PDF finale non è valido o è vuoto.");
    }
    const base64Pdf = pdfBuffer.toString("base64");
    
    const clientName = reportDataFromDb.clienteInfo?.nome?.replace(/[\s.]+/g, "_") || "Cliente";
    const checklistIdOriginale = reportDataFromDb.checklist_id?.toString() || reportDataFromDb.checklistInfo?.id?.toString() || "IDChecklistSconosciuto";
    const fileName = `Report_Diagnostico_${clientName}_${checklistIdOriginale}.pdf`;
    
    res.json({
      fileName: fileName,
      pdfBase64: base64Pdf,
      mimeType: "application/pdf"
    });
    console.log(`>>> Dati PDF (Base64) inviati al client per ${fileName} (da DB)`);

  } catch (error) {
    console.error(`!!! Errore durante l'export PDF (Base64) per ReportDocumentID ${reportDocumentId}:`, error);
    res.status(500).json({ message: "Errore durante la generazione del PDF." });
  }
});

router.post("/action-plan/:planId/pdf", (async (req, res) => {
  const planId = req.params.planId;
  console.log(`>>> Ricevuta richiesta POST /api/export/action-plan/${planId}/pdf (Base64)`);
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    return res.status(400).json({
      message: "ID Piano d'Azione non valido."
    });
  }
  try {

    console.log(`>>> Recupero dati Piano d'Azione ${planId} con interventi popolati...`);
    const planData = await PianoAzione.findById(planId).populate({
      path: "interventi"
    }).lean();
    if (!planData) {
      console.log(`Piano d'Azione ${planId} non trovato.`);
      return res.status(404).json({
        message: "Piano d'Azione non trovato."
      });
    }
    console.log(`>>> Dati Piano recuperati. Trovati ${planData.interventi?.length || 0} interventi. Avvio generazione PDF...`);

    const generatedPdfObject = await generatePdfFromActionPlanData(planData);

    console.log(`>>> pdfGenerator restituito. Tipo: ${typeof generatedPdfObject}, Lunghezza: ${generatedPdfObject?.length}`);
    console.log(`>>> È un Buffer Node.js? ${Buffer.isBuffer(generatedPdfObject)}`);
    console.log(`>>> È un Uint8Array? ${generatedPdfObject instanceof Uint8Array}`);

    let pdfBuffer;

    if (Buffer.isBuffer(generatedPdfObject)) {
      console.log("Oggetto ricevuto è già un Buffer.");
      pdfBuffer = generatedPdfObject;
    } else if (generatedPdfObject instanceof Uint8Array) {
      console.log("Oggetto ricevuto è Uint8Array, converto in Buffer Node.js...");
      pdfBuffer = Buffer.from(generatedPdfObject);

      console.log(`Conversione in Buffer completata. Ora è Buffer? ${Buffer.isBuffer(pdfBuffer)}, Lunghezza: ${pdfBuffer?.length}`);
    } else {

      console.error("!!! ERRORE CRITICO: Oggetto restituito da pdfGenerator non è né Buffer né Uint8Array!");
      console.error("Valore ricevuto:", generatedPdfObject);
      throw new Error("La generazione PDF non ha restituito dati binari riconoscibili.");
    }

    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      console.error("!!! ERRORE: pdfBuffer finale non valido o vuoto!");
      throw new Error("Il buffer PDF finale non è valido o è vuoto.");
    }
    console.log(`>>> Buffer PDF valido pronto (${(pdfBuffer.length / 1024).toFixed(1)} KB).`);

    let base64Pdf;
    try {
      base64Pdf = pdfBuffer.toString("base64");
      if (typeof base64Pdf !== "string" || base64Pdf.length < 100) {
        throw new Error("Conversione in Base64 fallita o risultato non valido.");
      }
      console.log(">>> Conversione Base64 completata.");
    } catch (toStringError) {
      console.error("!!! ERRORE durante pdfBuffer.toString('base64'):", toStringError);
      throw new Error(`Errore durante la conversione del buffer PDF in Base64: ${toStringError.message}`);
    }
    const planTitleSafe = planData.titolo?.replace(/[\\s.]+/g, "_") || "PianoAzione";
    const fileName = `${planTitleSafe}_${planId}.pdf`;
    res.json({
      fileName: fileName,
      pdfBase64: base64Pdf,
      mimeType: "application/pdf"
    });
    console.log(`>>> Dati PDF Piano Azione (Base64) inviati al client per ${fileName}`);
  } catch (error) {
    console.error(`!!! Errore durante l'export PDF Piano Azione ${planId}:`, error);
    console.error(error.stack);
    let clientErrorMessage = "Errore durante la generazione del PDF del Piano d'Azione.";
    if (error.message === "Piano d'Azione non trovato.") {
      clientErrorMessage = error.message;

      return res.status(404).json({
        message: clientErrorMessage
      });
    }
    res.status(500).json({
      message: clientErrorMessage
    });
  }
}));

module.exports = router;
