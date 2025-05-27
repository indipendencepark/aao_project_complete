const express = require('express');
const router = express.Router();
// const authMiddleware = require('../middleware/auth'); // <-- Temporaneamente commentato
const mongoose = require('mongoose');
const { ValoreKpi } = require('../models/monitoraggio');
const { Kpi } = require('../models/monitoraggio');
const { Alert } = require('../models/monitoraggio'); // Importa Alert per la logica interna

// Applica il middleware a tutte le routes
// router.use(authMiddleware); // <-- TEMPORANEAMENTE COMMENTATO

// --- GET /api/values ---
router.get('/', async (req, res) => {
    // console.log(`Richiesta GET /api/values dall'utente ${req.user.id}`); // Commentato req.user
    console.log(`Richiesta GET /api/values (non protetta per test)`);
    const kpiId = req.query.kpi_id;

    if (!kpiId) return res.status(400).json({ message: 'Il parametro kpi_id è obbligatorio.' });
    if (!mongoose.Types.ObjectId.isValid(kpiId)) return res.status(400).json({ message: 'ID KPI non valido.' });

    try {
        const valori = await ValoreKpi.find({ kpi_id: kpiId }).sort({ data: -1 });
        res.json({ message: `Valori recuperati per KPI ${kpiId}`, data: valori });
    } catch (err) {
        console.error("Errore in GET /api/values:", err.message);
        res.status(500).json({ message: 'Errore del server nel recupero dei valori KPI.' });
    }
});

// --- POST /api/values ---
router.post('/', async (req, res) => {
    // console.log(`Richiesta POST /api/values dall'utente ${req.user.id} con body:`, req.body); // Commentato req.user
    console.log(`Richiesta POST /api/values (non protetta per test) con body:`, req.body);
    const { kpi_id, valore, data, note, fonte_dati } = req.body;

    if (!kpi_id || valore === undefined || !data) return res.status(400).json({ message: 'kpi_id, valore e data sono obbligatori.' });
    if (!mongoose.Types.ObjectId.isValid(kpi_id)) return res.status(400).json({ message: 'ID KPI non valido.' });

    try {
        const kpiEsistente = await Kpi.findById(kpi_id);
        if (!kpiEsistente) return res.status(404).json({ message: 'KPI di riferimento non trovato.' });

        const nuovoValore = new ValoreKpi({
            kpi_id, valore, data, note, fonte_dati,
            // creato_da: req.user.id // Commentato req.user
            creato_da: "Sistema (Test)" // Valore placeholder
        });
        await nuovoValore.save();

        // --- Logica Generazione Alert (Semplificata) ---
        let alertGenerato = null;
        const { valore_target, soglia_attenzione, soglia_allarme, nome } = kpiEsistente;
        let tipoAlert = null; let livelloAlert = null; let messaggioAlert = '';

        if (soglia_allarme != null && soglia_attenzione != null) {
             if (soglia_allarme > soglia_attenzione) { // Alti sono peggiori
                 if (valore >= soglia_allarme) { tipoAlert='soglia_massima'; livelloAlert='critical'; }
                 else if (valore >= soglia_attenzione) { tipoAlert='soglia_massima'; livelloAlert='warning'; }
             } else { // Bassi sono peggiori
                 if (valore <= soglia_allarme) { tipoAlert='soglia_minima'; livelloAlert='critical'; }
                 else if (valore <= soglia_attenzione) { tipoAlert='soglia_minima'; livelloAlert='warning'; }
             }
        }
        if(tipoAlert) {
            messaggioAlert = `KPI "${nome}" ha superato la soglia di ${livelloAlert === 'critical' ? 'allarme' : 'attenzione'} (${tipoAlert}). Valore: ${valore}`;
            try {
                const nuovoAlert = new Alert({ kpi_id: kpi_id, valore_kpi_id: nuovoValore._id, messaggio: messaggioAlert, tipo: tipoAlert, livello: livelloAlert });
                alertGenerato = await nuovoAlert.save();
                console.log(`--- Alert Generato (ID: ${alertGenerato._id}) ---`);
            } catch (alertErr) { console.error("!!! Errore durante la creazione dell'alert:", alertErr.message); }
        }
        // --- Fine Logica Alert ---

        res.status(201).json({ message: 'Valore KPI registrato con successo.', data: nuovoValore, alert: alertGenerato });

    } catch (err) {
        console.error("Errore in POST /api/values:", err.message);
        if (err.name === 'ValidationError') return res.status(400).json({ message: 'Errore di validazione', errors: err.errors });
        res.status(500).json({ message: 'Errore del server durante la registrazione del valore.' });
    }
});

module.exports = router;