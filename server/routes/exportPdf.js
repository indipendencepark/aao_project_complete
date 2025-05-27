// START OF FILE server/routes/exportPdf.js (AGGIORNATO con Export Piano Azione)

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { generateReportContent } = require('../services/reportGenerator'); // Per report
const { generateExecutiveSummaryAI } = require('../services/summaryGeneratorAI');
const { PianoAzione } = require('../models/progettazione'); // *NUOVO: Modello PianoAzione*
// *MODIFICA: Importa entrambe le funzioni dal pdfGenerator*
const { generatePdfFromReportData, generatePdfFromActionPlanData } = require('../services/pdfGenerator');

router.post('/report/:checklistId/pdf', async (req, res) => {
    const checklistId = req.params.checklistId;
    console.log(`>>> Ricevuta richiesta POST /api/export/report/${checklistId}/pdf (Base64)`);

    if (!mongoose.Types.ObjectId.isValid(checklistId)) {
        return res.status(400).json({ message: 'ID Checklist non valido.' });
    }

    try {
        console.log(`>>> Generazione contenuto report (inclusa sintesi AI) per ${checklistId}...`);
        // 1. Genera i dati base del report
        let reportData = await generateReportContent(checklistId); // 'let' per poterla modificare
        
        // Estrai i dati per l'AI summary e rimuovili dall'oggetto principale
        const datiPerAISummary = reportData._datiPerAISummary;
        delete reportData._datiPerAISummary;

        // 2. Genera l'Executive Summary con l'AI (COME NELLA ROUTE GET /api/report)
        let executiveSummaryText = "Executive summary non generato (servizio AI non disponibile o errore).";
        if (datiPerAISummary) {
            try {
                console.log(`>>> [PDF EXPORT] Chiamata a generateExecutiveSummaryAI...`);
                executiveSummaryText = await generateExecutiveSummaryAI(datiPerAISummary, reportData.clienteInfo);
                console.log(">>> [PDF EXPORT] Executive Summary AI ricevuto.");
            } catch (aiError) {
                console.error(">>> [PDF EXPORT] Errore generazione Executive Summary AI:", aiError.message);
                executiveSummaryText = `Giudizio preliminare: ${reportData.executiveSummaryBase?.giudizioGenerale || 'N/D'}. (Errore AI summary: ${aiError.message})`;
            }
        }
        reportData.sintesi_esecutiva = executiveSummaryText; // Assegna la sintesi
        // *** FINE MODIFICA PER SINTESI AI ***

        console.log(`>>> [PDF EXPORT] Testo Executive Summary da passare a HTML: ${reportData.sintesi_esecutiva ? reportData.sintesi_esecutiva.substring(0,50)+'...' : 'undefined/vuoto'}`); // Log per verifica
        console.log(`>>> Contenuto report completo. Avvio generazione PDF...`);
        
        if (!reportData) {
            return res.status(404).json({ error: "Dati del report non trovati o incompleti per la generazione del PDF." });
        }

        // Assicurati che generatePdfFromReportData riceva il reportData aggiornato
        let generatedPdfObject = await generatePdfFromReportData(reportData); 
        console.log(`>>> OGGETTO RICEVUTO da generatePdfFromReportData. Tipo: ${typeof generatedPdfObject}, È Buffer? ${Buffer.isBuffer(generatedPdfObject)}, È Uint8Array? ${generatedPdfObject instanceof Uint8Array}, Lunghezza: ${generatedPdfObject?.length}`);

        let pdfBuffer; // Variabile per il buffer finale
        if (Buffer.isBuffer(generatedPdfObject)) {
            console.log("Oggetto ricevuto è già un Buffer Node.js.");
            pdfBuffer = generatedPdfObject;
        } else if (generatedPdfObject instanceof Uint8Array) {
            console.log("Oggetto ricevuto è Uint8Array, converto in Buffer Node.js...");
            pdfBuffer = Buffer.from(generatedPdfObject); // Conversione esplicita
            console.log(`Conversione in Buffer Node.js completata. Ora è Buffer? ${Buffer.isBuffer(pdfBuffer)}, Lunghezza: ${pdfBuffer?.length}`);
        } else {
            console.error("!!! ERRORE CRITICO: generatePdfFromReportData non ha restituito un Buffer Node.js o Uint8Array valido!");
            console.error("Oggetto ricevuto:", generatedPdfObject);
            throw new Error("La generazione PDF non ha restituito dati binari validi.");
        }

        // Controllo finale sul buffer risultante (il tuo check problematico)
        console.log(`>>> [PDF EXPORT] Controllo pdfBuffer (DOPO CONVERSIONE): È Buffer? ${Buffer.isBuffer(pdfBuffer)}, Lunghezza: ${pdfBuffer?.length}`);
        if (Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 0) {
            console.log(`>>> [PDF EXPORT] Primi 20 byte del pdfBuffer (hex): ${pdfBuffer.slice(0, 20).toString('hex')}`);
        } else {
            console.error(">>> [PDF EXPORT] ERRORE: pdfBuffer DOPO CONVERSIONE non è un Buffer valido o è vuoto.");
        }

        if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) { // Questo è il check che falliva
             console.error(">>> [PDF EXPORT] Lancio errore: Il buffer PDF finale non è valido o è vuoto.");
             throw new Error("Il buffer PDF finale non è valido o è vuoto.");
        }

        console.log(`>>> Buffer PDF valido pronto (${(pdfBuffer.length / 1024).toFixed(1)} KB). Converto in Base64...`);

        let base64Pdf; // Dichiarata qui fuori
        try {
            base64Pdf = pdfBuffer.toString('base64');
            console.log(">>> Conversione Base64 completata.");

            // --- VERIFICA E LOG STRINGA BASE64 (SPOSTATI QUI DENTRO) ---
            if (typeof base64Pdf !== 'string' || base64Pdf.length < 100) {
                 console.error(`!!! ERRORE: Risultato di toString('base64') non è una stringa valida o è troppo corta. Tipo: ${typeof base64Pdf}, Lunghezza: ${base64Pdf?.length}`);
                 console.error(">>> Buffer originale (decimal):", pdfBuffer.toJSON().data.slice(0, 100).join(','));
                 throw new Error("Conversione in Base64 fallita o ha prodotto risultato non valido.");
            }

            console.log(">>> Primi 100 char Base64 REALE (Backend):", base64Pdf.substring(0, 100));
            console.log(">>> Ultimi 100 char Base64 REALE (Backend):", base64Pdf.substring(base64Pdf.length - 100));
            console.log(`>>> Lunghezza Base64 (Backend): ${base64Pdf.length}`);
            // --- FINE VERIFICA E LOG ---

        } catch (toStringError) {
            console.error("!!! ERRORE durante pdfBuffer.toString('base64'):", toStringError);
             throw new Error(`Errore durante la conversione del buffer PDF in Base64: ${toStringError.message}`);
        }

        // Se siamo qui, base64Pdf è definita e valida
        const clientName = reportData.clienteInfo?.nome?.replace(/[\s.]+/g, '_') || 'Cliente';
        const fileName = `Report_Diagnostico_${clientName}_${checklistId}.pdf`;

        res.json({
            fileName: fileName,
            pdfBase64: base64Pdf,
            mimeType: 'application/pdf'
        });
        console.log(`>>> Dati PDF (Base64) inviati al client per ${fileName}`);

    } catch (error) {
        console.error(`!!! Errore durante l'export PDF (Base64) per checklist ${checklistId}:`, error);
         console.error(error.stack);
        let clientErrorMessage = "Errore durante la generazione del PDF.";
         // ... (gestione errori come prima) ...
         res.status(500).json({ message: clientErrorMessage });
    }
});

// --- *NUOVA* ROUTE: EXPORT PIANO D'AZIONE ---
router.post('/action-plan/:planId/pdf', async (req, res) => {
    const planId = req.params.planId;
    console.log(`>>> Ricevuta richiesta POST /api/export/action-plan/${planId}/pdf (Base64)`);

    if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({ message: 'ID Piano d\'Azione non valido.' });
    }

    try {
        // 1. Recupera i dati completi del Piano d'Azione con interventi popolati
        console.log(`>>> Recupero dati Piano d'Azione ${planId} con interventi popolati...`);
        const planData = await PianoAzione.findById(planId)
            .populate({ path: 'interventi' }) // Popola tutti i campi intervento
            .lean();

        if (!planData) {
            console.log(`Piano d'Azione ${planId} non trovato.`);
            return res.status(404).json({ message: 'Piano d\'Azione non trovato.' });
        }
        console.log(`>>> Dati Piano recuperati. Trovati ${planData.interventi?.length || 0} interventi. Avvio generazione PDF...`);

        // 2. Chiama il servizio PDF
        const generatedPdfObject = await generatePdfFromActionPlanData(planData); // Rinominiamo per chiarezza

        console.log(`>>> pdfGenerator restituito. Tipo: ${typeof generatedPdfObject}, Lunghezza: ${generatedPdfObject?.length}`);
        console.log(`>>> È un Buffer Node.js? ${Buffer.isBuffer(generatedPdfObject)}`);
        console.log(`>>> È un Uint8Array? ${generatedPdfObject instanceof Uint8Array}`);

        // *** CORREZIONE: Converti Uint8Array in Buffer se necessario ***
        let pdfBuffer; // Variabile per il buffer finale
        if (Buffer.isBuffer(generatedPdfObject)) {
            console.log("Oggetto ricevuto è già un Buffer.");
            pdfBuffer = generatedPdfObject;
        } else if (generatedPdfObject instanceof Uint8Array) {
            console.log("Oggetto ricevuto è Uint8Array, converto in Buffer Node.js...");
            pdfBuffer = Buffer.from(generatedPdfObject); // Conversione esplicita
            console.log(`Conversione in Buffer completata. Ora è Buffer? ${Buffer.isBuffer(pdfBuffer)}, Lunghezza: ${pdfBuffer?.length}`);
        } else {
            // Se non è né Buffer né Uint8Array, allora c'è un problema
            console.error("!!! ERRORE CRITICO: Oggetto restituito da pdfGenerator non è né Buffer né Uint8Array!");
            console.error("Valore ricevuto:", generatedPdfObject);
            throw new Error("La generazione PDF non ha restituito dati binari riconoscibili.");
        }
        // *** FINE CORREZIONE ***

        // Controllo finale sul buffer risultante
        if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
            console.error("!!! ERRORE: pdfBuffer finale non valido o vuoto!");
            throw new Error("Il buffer PDF finale non è valido o è vuoto.");
        }
        console.log(`>>> Buffer PDF valido pronto (${(pdfBuffer.length / 1024).toFixed(1)} KB).`);


        // 3. Converti in Base64 e invia la risposta JSON (come per il report)
        let base64Pdf;
        try {
            base64Pdf = pdfBuffer.toString('base64');
            if (typeof base64Pdf !== 'string' || base64Pdf.length < 100) {
                 throw new Error("Conversione in Base64 fallita o risultato non valido.");
            }
            console.log(">>> Conversione Base64 completata.");
        } catch (toStringError) {
             console.error("!!! ERRORE durante pdfBuffer.toString('base64'):", toStringError);
             throw new Error(`Errore durante la conversione del buffer PDF in Base64: ${toStringError.message}`);
        }

        const planTitleSafe = planData.titolo?.replace(/[\\s.]+/g, '_') || 'PianoAzione';
        const fileName = `${planTitleSafe}_${planId}.pdf`;

        res.json({
            fileName: fileName,
            pdfBase64: base64Pdf,
            mimeType: 'application/pdf'
        });
        console.log(`>>> Dati PDF Piano Azione (Base64) inviati al client per ${fileName}`);

    } catch (error) {
        console.error(`!!! Errore durante l'export PDF Piano Azione ${planId}:`, error);
         console.error(error.stack);
        let clientErrorMessage = "Errore durante la generazione del PDF del Piano d'Azione.";
         if (error.message === 'Piano d\'Azione non trovato.') {
             clientErrorMessage = error.message; // Usa messaggio specifico se 404
             return res.status(404).json({ message: clientErrorMessage });
         }
         res.status(500).json({ message: clientErrorMessage });
    }
});
// --- FINE NUOVA ROUTE ---


module.exports = router;

// END OF FILE server/routes/exportPdf.js (AGGIORNATO con Export Piano Azione)