const express = require('express');
const router = express.Router();
// const authMiddleware = require('../middleware/auth'); // <-- COMMENTA QUESTO IMPORT (opzionale)
const mongoose = require('mongoose');
const { Kpi } = require('../models/monitoraggio');

// Applica il middleware a TUTTE le routes definite dopo questa riga in questo file
// router.use(authMiddleware); // <-- COMMENTA QUESTA RIGA

// GET /api/kpis (ora NON più protetta)
router.get('/', async (req, res) => {
    // Rimuovi o commenta i riferimenti a req.user.id
    // console.log(`Richiesta GET /api/kpis dall'utente ${req.user.id}`);
    console.log(`Richiesta GET /api/kpis (non protetta per test)`);
    try {
        const kpis = await Kpi.find({}).sort({ nome: 1 });
        res.json({ message: 'KPI recuperati con successo', data: kpis });
    } catch (err) {
        console.error("Errore in GET /api/kpis:", err.message);
        res.status(500).json({ message: 'Errore del server nel recupero dei KPI.' });
    }
});

// POST /api/kpis (ora NON più protetta)
router.post('/', async (req, res) => {
    // Rimuovi o commenta i riferimenti a req.user.id
    // console.log(`Richiesta POST /api/kpis dall'utente ${req.user.id} con body:`, req.body);
    console.log(`Richiesta POST /api/kpis (non protetta per test) con body:`, req.body);
     // ... resto della logica POST invariata ...
     // (copia/incolla il resto della funzione POST da prima)
     const { codice, nome, area, /* ... altri campi */ } = req.body;
     if (!codice || !nome || !area) return res.status(400).json({ message: 'Codice, Nome e Area sono obbligatori.' });
     try {
        let kpi = await Kpi.findOne({ codice: codice });
        if (kpi) return res.status(400).json({ message: 'Esiste già un KPI con questo codice.' });
        kpi = new Kpi(req.body); // Assumi che req.body corrisponda allo schema
        const nuovoKpi = await kpi.save();
        res.status(201).json({ message: 'KPI creato con successo', data: nuovoKpi });
     } catch(err) {
         console.error("Errore in POST /api/kpis:", err.message);
         if (err.name === 'ValidationError') return res.status(400).json({ message: 'Errore di validazione', errors: err.errors });
         res.status(500).json({ message: 'Errore del server durante la creazione del KPI.' });
     }
});

// GET /api/kpis/:id (ora NON più protetta)
router.get('/', async (req, res) => {
    console.log(`Richiesta GET /api/kpis (non protetta per test)`);
    try {
        console.log("Tentativo Kpi.find()...");
        const kpis = await Kpi.find({}).sort({ nome: 1 });
        console.log(`Kpi.find() completato, trovati ${kpis.length} record.`);
        res.json({ message: 'KPI recuperati con successo', data: kpis });
        console.log("Risposta JSON inviata.");
    } catch (err) {
        console.error("!!! ERRORE nel blocco try/catch di GET /api/kpis:", err.message); // Log errore specifico qui
        console.error(err.stack); // Log stack trace completo
        res.status(500).json({ message: 'Errore del server nel recupero dei KPI.' });
    }
});

// PUT /api/kpis/:id (ora NON più protetta)
router.put('/:id', async (req, res) => {
    // Rimuovi o commenta i riferimenti a req.user.id
    console.log(`Richiesta PUT /api/kpis/${req.params.id} (non protetta per test) con body:`, req.body);
     // ... resto della logica PUT /:id invariata ...
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID KPI non valido.' });
    const campiDaAggiornare = { ...req.body, data_aggiornamento: Date.now() }; // Semplificato per test
    try {
         let kpi = await Kpi.findById(req.params.id);
         if (!kpi) return res.status(404).json({ message: 'KPI non trovato.' });
         // Controllo unicità codice omesso per semplicità test
         kpi = await Kpi.findByIdAndUpdate(req.params.id, { $set: campiDaAggiornare }, { new: true, runValidators: true });
         res.json({ message: 'KPI aggiornato con successo', data: kpi });
    } catch (err) {
         console.error(`Errore in PUT /api/kpis/${req.params.id}:`, err.message);
         if (err.name === 'ValidationError') return res.status(400).json({ message: 'Errore di validazione', errors: err.errors });
         res.status(500).json({ message: 'Errore del server durante l\'aggiornamento del KPI.' });
     }
});

// DELETE /api/kpis/:id (ora NON più protetta)
router.delete('/:id', async (req, res) => {
    // Rimuovi o commenta i riferimenti a req.user.id
     console.log(`Richiesta DELETE /api/kpis/${req.params.id} (non protetta per test)`);
     // ... resto della logica DELETE /:id invariata ...
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID KPI non valido.' });
     try {
         const kpi = await Kpi.findById(req.params.id);
         if (!kpi) return res.status(404).json({ message: 'KPI non trovato.' });
         await Kpi.findByIdAndDelete(req.params.id);
         res.json({ message: 'KPI eliminato con successo' });
     } catch (err) {
         console.error(`Errore in DELETE /api/kpis/${req.params.id}:`, err.message);
         res.status(500).json({ message: 'Errore del server durante l\'eliminazione del KPI.' });
     }
});

module.exports = router;