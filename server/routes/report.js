// START OF FILE server/routes/report.js (AGGIORNATO)

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// const authMiddleware = require('../middleware/auth'); // Temporaneamente commentato
const { generateReportContent } = require('../services/reportGenerator');
const { generateExecutiveSummaryAI } = require('../services/summaryGeneratorAI'); // NUOVO IMPORT

// router.use(authMiddleware); // Temporaneamente commentato

// --- GET /api/report?checklist_id=xxx ---
// Genera i dati completi per il report diagnostico usando il servizio reportGenerator
router.get('/', async (req, res) => {
    console.log(`Richiesta GET /api/report (con generazione summary AI)`);
    const checklistId = req.query.checklist_id;

    if (!checklistId || !mongoose.Types.ObjectId.isValid(checklistId)) {
        return res.status(400).json({ message: 'ID Checklist non valido o mancante.' });
    }

    try {
        // 1. Genera i dati base del report (incluse le nuove analisi di conformità)
        console.log(`>>> Chiamata a generateReportContent per ${checklistId}...`);
        let reportData = await generateReportContent(checklistId);
        console.log(`>>> Dati report base generati per ${checklistId}.`);

        // Estrai i dati specifici per l'AI summary e poi rimuovili dall'oggetto finale
        const datiPerAISummary = reportData._datiPerAISummary;
        delete reportData._datiPerAISummary;

        // 2. Genera l'Executive Summary con l'AI
        let executiveSummaryText = "Executive summary non generato (servizio AI non disponibile o errore).";
        if (datiPerAISummary) { // Procedi solo se ci sono dati per l'AI
            try {
                console.log(`>>> Chiamata a generateExecutiveSummaryAI...`);
                // Passa i dati consolidati e le info cliente al servizio AI
                executiveSummaryText = await generateExecutiveSummaryAI(datiPerAISummary, reportData.clienteInfo);
                console.log(">>> Executive Summary ricevuto da AI.");
            } catch (aiError) {
                console.error("Errore durante la generazione dell'Executive Summary AI via API:", aiError.message);
                executiveSummaryText = `Giudizio preliminare: ${reportData.executiveSummaryBase?.giudizioGenerale || 'N/D'}. Si consiglia revisione manuale dell'executive summary. (Errore AI: ${aiError.message})`;
            }
        }
        
        // Aggiungi/Aggiorna la sintesi esecutiva nel reportData finale
        reportData.sintesi_esecutiva = executiveSummaryText;

        console.log(`>>> Dati report finali (con summary AI) pronti. Invio risposta...`);
        res.json({ message: `Dati report generati per checklist ${checklistId}`, data: reportData });

    } catch (err) {
        console.error(`!!! Errore in GET /api/report per checklist ${checklistId}:`, err.message, err.stack);
        if (err.message === 'Checklist non trovata.') {
             return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: 'Errore del server durante la generazione dei dati del report.' });
    }
});

module.exports = router;

// END OF FILE server/routes/report.js (AGGIORNATO)