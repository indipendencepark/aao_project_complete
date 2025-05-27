const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // <-- IMPORTA MIDDLEWARE
// const { AnalisiScostamento } = require('../models/monitoraggio'); // Decommenta

router.use(authMiddleware); // <-- APPLICA MIDDLEWARE A TUTTE

// GET /api/analysis/scostamenti - Ora protetta
router.get('/scostamenti', async (req, res) => {
     console.log(`Richiesta GET /api/analysis/scostamenti dall'utente ${req.user.id}`);
    try {
        res.json({ message: 'GET tutte le analisi scostamenti (protetto - placeholder)', data: [] });
    } catch (err) {
        console.error("Errore in GET /api/analysis/scostamenti:", err.message);
        res.status(500).json({ message: 'Errore del server' });
    }
});

 // POST /api/analysis/scostamenti - Ora protetta
router.post('/scostamenti', async (req, res) => {
    console.log(`Richiesta POST /api/analysis/scostamenti dall'utente ${req.user.id} con body:`, req.body);
    try {
        // Logica per calcolare e salvare l'analisi
        res.status(201).json({ message: 'Analisi scostamento creata (protetto - placeholder)', data: req.body });
    } catch (err) {
        console.error("Errore in POST /api/analysis/scostamenti:", err.message);
        res.status(500).json({ message: 'Errore del server' });
    }
});

// --- Aggiungi qui altre routes protette per Analysis ---

module.exports = router;