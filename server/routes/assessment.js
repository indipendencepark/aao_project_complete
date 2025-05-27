const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Per validare ObjectId
// const authMiddleware = require('../middleware/auth'); // Temporaneamente commentato
const { Gap } = require('../models/diagnosi'); // Importa il modello Gap
const { analyzeGapRootCause } = require('../services/rootCauseAnalyzerAI'); // NUOVO IMPORT
const { Checklist } = require('../models/diagnosi'); // Per recuperare checklistId se non passato

// router.use(authMiddleware); // Temporaneamente commentato

// --- GET /api/assessment/gaps ---
// Recupera i Gap associati a una checklist_id fornita come query parameter
router.get('/gaps', async (req, res) => {
    // console.log(`Richiesta GET /api/assessment/gaps dall'utente ${req.user.id}`);
    console.log(`Richiesta GET /api/assessment/gaps (non protetta per test)`);
    const checklistId = req.query.checklist_id;

    // Validazione: checklist_id è obbligatorio
    if (!checklistId) {
        return res.status(400).json({ message: 'Il parametro checklist_id è obbligatorio.' });
    }
    if (!mongoose.Types.ObjectId.isValid(checklistId)) {
        return res.status(400).json({ message: 'ID Checklist non valido.' });
    }

    try {
        // Trova tutti i documenti Gap che hanno il checklist_id specificato
        const gaps = await Gap.find({ checklist_id: checklistId }).sort({ livello_rischio: -1, item_id: 1 }); // Ordina per rischio (alto prima) e poi per item
        console.log(`Trovati ${gaps.length} gap per checklist ${checklistId}`);

        res.json({ message: `Gap recuperati per checklist ${checklistId}`, data: gaps });

    } catch (err) {
        console.error("Errore in GET /api/assessment/gaps:", err.message);
        res.status(500).json({ message: 'Errore del server nel recupero dei gap.' });
    }
});

// --- NUOVA ROUTE: POST /api/assessment/gaps/:gapId/root-cause ---
router.post('/gaps/:gapId/root-cause', async (req, res) => {
    const { gapId } = req.params;
    const { checklistId, relatedGapIds } = req.body; // relatedGapIds è opzionale

    console.log(`Richiesta POST /api/assessment/gaps/${gapId}/root-cause`);
    console.log(`Body ricevuto: checklistId=${checklistId}, relatedGapIds=${relatedGapIds}`);

    if (!mongoose.Types.ObjectId.isValid(gapId)) {
        return res.status(400).json({ message: 'ID Gap non valido.' });
    }
    if (!checklistId || !mongoose.Types.ObjectId.isValid(checklistId)) {
        return res.status(400).json({ message: 'ID Checklist valido è obbligatorio nel body.' });
    }
    if (relatedGapIds && (!Array.isArray(relatedGapIds) || !relatedGapIds.every(id => mongoose.Types.ObjectId.isValid(id)))) {
        return res.status(400).json({ message: 'relatedGapIds deve essere un array di ID validi, se fornito.' });
    }

    try {
        const causeRadice = await analyzeGapRootCause(gapId, checklistId, relatedGapIds);

        // Salva le cause radice nel documento Gap
        await Gap.findByIdAndUpdate(gapId, {
            $set: { 
                causeRadiceSuggeriteAI: causeRadice,
                ultimaAnalisiCauseRadice: new Date()
            }
        });
        console.log(`Cause radice per Gap ${gapId} salvate nel DB.`);

        res.json({ message: 'Analisi cause radice completata e salvata.', data: causeRadice });

    } catch (error) {
        console.error(`Errore API analisi cause radice per Gap ${gapId}:`, error);
        res.status(500).json({ message: error.message || 'Errore del server durante l\'\'analisi delle cause radice.' });
    }
});

// Altre routes specifiche per l'assessment (se aggiunte, applicare authMiddleware se necessario)

module.exports = router;