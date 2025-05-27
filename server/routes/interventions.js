// START OF FILE server/routes/interventions.js (AGGIORNATO v3 - API Complete)

// All'inizio di server/routes/interventions.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// Importa i modelli necessari da progettazione.js
const { Intervento, PianoAzione } = require('../models/progettazione');
// Importa Checklist se serve (es. per recuperare info cliente)
const { Checklist } = require('../models/diagnosi');
// Importa il servizio per generare interventi
const { generateInterventionsFromGaps } = require('../services/interventionGenerator');

// --- GET /api/interventions (AGGIORNATO con filtro checklist) ---
router.get('/', async (req, res) => {
    console.log(`Richiesta GET /api/interventions con query:`, req.query);
    try {
        const filtro = {}; // Oggetto per costruire la query Mongoose

        // Filtri esistenti (area, priorità, stato)
        if (req.query.area) filtro.area = req.query.area;
        if (req.query.priorita) filtro.priorita = req.query.priorita;
        if (req.query.stato) filtro.stato = req.query.stato;
        // Filtro per gap (se presente)
        if (req.query.gap_id && mongoose.Types.ObjectId.isValid(req.query.gap_id)) {
            filtro.gap_correlati = req.query.gap_id;
        }
     // --- NUOVO: Filtro Checklist ---
     const checklistFilterValue = req.query.checklist_id; // Nome parametro: checklist_id

     if (checklistFilterValue) {
         if (checklistFilterValue === 'manuali') {
             // Mostra solo interventi creati manualmente
             filtro.origin = 'manuale';
             // Opzionale: escludi quelli che hanno comunque un checklist_id_origine?
             // filtro.checklist_id_origine = null;
         } else if (checklistFilterValue === 'tutti_ai') {
             // Mostra tutti gli interventi generati da AI, indipendentemente dalla checklist
             filtro.origin = 'ai_generated';
         } else if (mongoose.Types.ObjectId.isValid(checklistFilterValue)) {
             // Mostra interventi generati da una specifica checklist
             filtro.checklist_id_origine = checklistFilterValue;
             filtro.origin = 'ai_generated'; // Assicurati di prendere solo quelli generati da AI per quell'ID
         }
         // Se il valore non è valido, semplicemente non viene applicato nessun filtro checklist
     }
     // --- FINE NUOVO Filtro Checklist ---


        console.log("Filtro intervento applicato:", filtro);

        const interventi = await Intervento.find(filtro)
        .populate('gap_correlati', 'item_id descrizione') // Popola info gap
        // Aggiungiamo 'checklist_id_origine' al select se vogliamo vederlo nei dati ricevuti
        .select('titolo descrizione area priorita stato responsabile data_fine_prevista completamento_perc origin checklist_id_origine gap_correlati tempistica_stimata risorse_necessarie data_inizio_prevista data_completamento_effettiva note_avanzamento')
        .sort({ priorita: 1, data_creazione: -1 }); // Ordinamento esempio

    res.json({ message: 'Interventi recuperati con successo', data: interventi });
} catch (err) {
    console.error("Errore in GET /api/interventions:", err.message);
    res.status(500).json({ message: 'Errore del server nel recupero degli interventi.' });
}
});

// --- POST /api/interventions (Creazione Manuale) ---
router.post('/', async (req, res) => {
    console.log(`Richiesta POST /api/interventions (MANUALE) con body:`, req.body);
    try {
        const { titolo, descrizione, area, priorita, gap_correlati, tempistica_stimata, risorse_necessarie, stato, responsabile, data_inizio_prevista, data_fine_prevista, completamento_perc, note_avanzamento } = req.body;

        if (!titolo || !area || !priorita) {
            return res.status(400).json({ message: 'Titolo, Area e Priorità sono obbligatori.' });
        }

        let gapObjectIds = [];
        if (gap_correlati && Array.isArray(gap_correlati)) {
            gapObjectIds = gap_correlati
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => mongoose.Types.ObjectId(id));
        }
        const nuovoIntervento = new Intervento({
            titolo, descrizione, area, priorita, stato: stato || 'suggerito',
            gap_correlati: gapObjectIds, tempistica_stimata, risorse_necessarie,
            responsabile, data_inizio_prevista, data_fine_prevista, completamento_perc, note_avanzamento,
            origin: 'manuale', // Forzato a manuale
            // checklist_id_origine non viene impostato per quelli manuali
            // data_aggiornamento e data_creazione gestiti da timestamps
        });

        await nuovoIntervento.save();
        res.status(201).json({ message: 'Intervento creato manualmente con successo', data: nuovoIntervento });

    } catch (err) {
         console.error("Errore in POST /api/interventions:", err.message);
        if (err.name === 'ValidationError') {
             const errors = Object.values(err.errors).map(el => el.message);
             return res.status(400).json({ message: `Errore di validazione: ${errors.join(', ')}`, errors: err.errors });
        }
        res.status(500).json({ message: 'Errore del server durante la creazione dell\'intervento.' });
    }
});

// --- POST /api/interventions/generate-from-checklist ---
router.post('/generate-from-checklist', async (req, res) => {
    console.log(`Richiesta POST /generate-from-checklist con body:`, req.body);
    const { checklistId } = req.body;

    if (!checklistId || !mongoose.Types.ObjectId.isValid(checklistId)) {
        return res.status(400).json({ message: 'ID Checklist non valido o mancante.' });
    }

    try {
        // Il servizio ora gestisce il recupero della checklist se necessario
        const count = await generateInterventionsFromGaps(checklistId);

        res.status(200).json({
            message: `Generazione interventi completata. Creati ${count} interventi suggeriti.`,
            data: { generatedCount: count }
        });

    } catch (error) {
        console.error(`!!! Errore in POST /generate-from-checklist per ${checklistId}:`, error);
        if (error.message.includes('Checklist non trovata') || error.message.includes('Dimensione cliente mancante')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: `Errore del server durante la generazione: ${error.message}` });
    }
});


// --- GET /api/interventions/:id (Recupero Dettaglio) ---
 router.get('/:id', async (req, res) => {
     console.log(`Richiesta GET /api/interventions/${req.params.id}`);
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID Intervento non valido.' });
     try {
         // Assicurati di recuperare TUTTI i campi necessari per il modal Edit
         const intervento = await Intervento.findById(req.params.id)
                                            .populate('gap_correlati', 'item_id descrizione livello_rischio') // Popola gap correlati
                                            .lean(); // Usa lean per performance

         if (!intervento) return res.status(404).json({ message: 'Intervento non trovato.' });

         console.log("Intervento recuperato per modifica (backend):", JSON.stringify(intervento, null, 2)); // Log per debug
         res.json({ message: 'Intervento recuperato con successo', data: intervento });
     } catch (err) {
          console.error(`Errore in GET /api/interventions/${req.params.id}:`, err.message);
          res.status(500).json({ message: 'Errore del server nel recupero dell\'intervento.' });
     }
});


// --- PUT /api/interventions/:id (Aggiornamento) ---
router.put('/:id', async (req, res) => {
    console.log(`Richiesta PUT /api/interventions/${req.params.id} con body:`, req.body);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID Intervento non valido.' });

    // Prendi solo i campi che l'utente può effettivamente modificare dal modal
    const { titolo, descrizione, priorita, tempistica_stimata, risorse_necessarie, stato,
            responsabile, data_inizio_prevista, data_fine_prevista, data_completamento_effettiva,
            completamento_perc, note_avanzamento } = req.body;

    const campiDaAggiornare = {};
    // Assegna solo i campi permessi e presenti nel body
    if (titolo !== undefined) campiDaAggiornare.titolo = titolo;
    if (descrizione !== undefined) campiDaAggiornare.descrizione = descrizione;
    // Non permettere modifica area o priorità? O sì? Per ora sì.
    if (priorita !== undefined) campiDaAggiornare.priorita = priorita;
    if (tempistica_stimata !== undefined) campiDaAggiornare.tempistica_stimata = tempistica_stimata;
    if (risorse_necessarie !== undefined) campiDaAggiornare.risorse_necessarie = risorse_necessarie;
    if (stato !== undefined) campiDaAggiornare.stato = stato;
    if (responsabile !== undefined) campiDaAggiornare.responsabile = responsabile;
    if (data_inizio_prevista !== undefined) campiDaAggiornare.data_inizio_prevista = data_inizio_prevista ? new Date(data_inizio_prevista) : null;
    if (data_fine_prevista !== undefined) campiDaAggiornare.data_fine_prevista = data_fine_prevista ? new Date(data_fine_prevista) : null;
    if (data_completamento_effettiva !== undefined) campiDaAggiornare.data_completamento_effettiva = data_completamento_effettiva ? new Date(data_completamento_effettiva) : null;
    if (completamento_perc !== undefined && completamento_perc !== null) campiDaAggiornare.completamento_perc = Number(completamento_perc);
    if (note_avanzamento !== undefined) campiDaAggiornare.note_avanzamento = note_avanzamento;
    // Non aggiorniamo origin, checklist_id_origine, gap_correlati da qui

    // data_aggiornamento viene gestita automaticamente dai timestamps/middleware

    try {
        const intervento = await Intervento.findByIdAndUpdate(
            req.params.id,
            { $set: campiDaAggiornare },
            { new: true, runValidators: true } // Restituisce doc aggiornato, esegue validazioni
        ).lean(); // Usa lean anche qui

        if (!intervento) return res.status(404).json({ message: 'Intervento non trovato.' });
        res.json({ message: 'Intervento aggiornato con successo', data: intervento });
    } catch (err) {
        console.error(`Errore in PUT /api/interventions/${req.params.id}:`, err.message);
         if (err.name === 'ValidationError') {
             const errors = Object.values(err.errors).map(el => el.message);
             return res.status(400).json({ message: `Errore di validazione: ${errors.join(', ')}`, errors: err.errors });
         }
        res.status(500).json({ message: 'Errore del server durante l\'aggiornamento.' });
    }
});

// --- DELETE /api/interventions/:id (Eliminazione) ---
router.delete('/:id', async (req, res) => {
     console.log(`Richiesta DELETE /api/interventions/${req.params.id}`);
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID Intervento non valido.' });
     try {
         const intervento = await Intervento.findByIdAndDelete(req.params.id);
         if (!intervento) return res.status(404).json({ message: 'Intervento non trovato.' });

         // Rimuovi l'intervento dai Piani d'Azione
         await PianoAzione.updateMany(
             { interventi: req.params.id },
             { $pull: { interventi: req.params.id } }
         );
         console.log(`Intervento ${req.params.id} rimosso da eventuali Piani d'Azione.`);

         res.json({ message: 'Intervento eliminato con successo' });
     } catch (err) {
         console.error(`Errore in DELETE /api/interventions/${req.params.id}:`, err.message);
         res.status(500).json({ message: 'Errore del server durante l\'eliminazione.' });
     }
});

module.exports = router;

// END OF FILE server/routes/interventions.js (AGGIORNATO v3 - API Complete)