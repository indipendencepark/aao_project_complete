// START OF FILE server/routes/actionPlan.js (AGGIORNATO v2 - Filtro e Dettaglio)

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { PianoAzione, Intervento } = require('../models/progettazione');
const { Checklist } = require('../models/diagnosi');
const { suggestActionPlan, createAiActionPlan } = require('../services/actionPlanner');

// --- GET /api/action-plan (con filtri - VERSIONE RIVISTA) ---
router.get('/', async (req, res) => {
    console.log("--- INIZIO GET /api/action-plan ---");
    console.log("req.query:", req.query);
    const checklistFilterValue = req.query.checklist_id;

    try {
        const filtro = {};

        if (checklistFilterValue) {
            if (checklistFilterValue === 'manuali') {
                console.log("Applico filtro: Piani Manuali");
                filtro.origin = 'manuale';
                // filtro.checklist_id_origine = { $exists: false }; // Opzionale: più restrittivo
            } else if (checklistFilterValue === 'tutti_ai') { // Rinominato da 'suggeriti_ai' per coerenza col frontend
                console.log("Applico filtro: Tutti Piani AI");
                filtro.origin = 'suggerito_ai';
            } else if (mongoose.Types.ObjectId.isValid(checklistFilterValue)) {
                console.log(`Applico filtro: Piani AI per Checklist ID ${checklistFilterValue}`);
                filtro.checklist_id_origine = checklistFilterValue;
                filtro.origin = 'suggerito_ai'; // Assicurati di prendere solo quelli AI per quell'ID
            } else {
                 // Valore filtro non riconosciuto
                 console.error(`Valore filtro checklist_id non valido ricevuto: ${checklistFilterValue}`);
                 return res.status(400).json({ message: `Valore filtro checklist_id non valido: ${checklistFilterValue}` });
            }
        } else {
             console.log("Nessun filtro checklist_id fornito. Restituisco array vuoto.");
             return res.json({ message: 'Nessun filtro origine specificato.', data: [] });
        }

        console.log("Filtro Mongoose costruito:", filtro);

        // Seleziona i campi necessari per la lista, inclusi quelli per il calcolo progresso SE fatto qui
        // Per ora manteniamo i campi base della lista
        const selectFields = 'titolo cliente.nome stato data_creazione origin checklist_id_origine';

        const piani = await PianoAzione.find(filtro)
                                     .select(selectFields)
                                     .sort({ data_creazione: -1 })
                                     .lean(); // Usa lean anche qui

        console.log(`Trovati ${piani.length} piani con filtro.`);
        res.json({ message: 'Piani d\'azione recuperati con successo', data: piani });

    } catch (err) {
        console.error("Errore in GET /api/action-plan:", err.message, err.stack); // Logga anche lo stack
        res.status(500).json({ message: 'Errore del server nel recupero dei piani d\'azione.' });
    }
    console.log("--- FINE GET /api/action-plan ---");
});

// --- GET /api/action-plan/:id --- (NUOVA o da CORREGGERE per il dettaglio)
router.get('/:id', async (req, res) => {
 // *** AGGIUNGI LOG ANCHE QUI PER CONFRONTO ***
 console.log("--- INIZIO GET /api/action-plan/:id ---");
 console.log("req.originalUrl:", req.originalUrl);
 console.log("req.params:", req.params); // Oggetto con i parametri del path :...
 console.log("ID ricevuto?", req.params.id);
 // ******************************************
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'ID Piano non valido.' });
    }
    try {
        const piano = await PianoAzione.findById(req.params.id)
            // *** POPOLA GLI INTERVENTI CON I CAMPI NECESSARI ***
            .populate({
                path: 'interventi',
                select: 'titolo area priorita stato completamento_perc' // Campi necessari per display e calcolo progresso
            })
            .lean(); // Usa lean per un oggetto JS semplice

        if (!piano) {
            console.log(`Piano con ID ${req.params.id} non trovato.`);
            return res.status(404).json({ message: 'Piano d\'azione non trovato.' });
        }
        console.log(`Piano ${req.params.id} trovato e popolato.`);
        res.json({ message: 'Dettaglio piano recuperato con successo', data: piano });
    } catch (err) {
        console.error(`Errore in GET /api/action-plan/${req.params.id}:`, err.message);
        res.status(500).json({ message: 'Errore del server nel recupero del dettaglio piano.' });
    }
});

// --- POST /api/action-plan --- (MODIFICATO per salvare origin e checklist_id_origine)
router.post('/', async (req, res) => {
    console.log(`Richiesta POST /api/action-plan (non protetta per test) con body:`, req.body);
    const {
        titolo, descrizione, cliente, interventi, // Array di ID stringa degli interventi da includere
        checklistIdOrigine // Riceviamo l'ID opzionale
    } = req.body;

    if (!titolo || !cliente || !cliente.nome) {
        return res.status(400).json({ message: 'Titolo e Nome Cliente sono obbligatori.' });
    }
    try {
        let interventiValidi = [];
        if (interventi && Array.isArray(interventi)) {
            // Verifica esistenza interventi (opzionale ma consigliato)
            const checkPromises = interventi
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => Intervento.findById(id).select('_id').lean()); // Verifica veloce
            const risultati = await Promise.all(checkPromises);
            interventiValidi = risultati.filter(i => i !== null).map(i => i._id);
            if (interventiValidi.length !== interventi.length) {
                 console.warn("POST /api/action-plan: Alcuni ID intervento forniti non erano validi o non trovati.");
            }
        }

        // *** CORREZIONE: Determina origin e prepara dati da salvare ***
        const origin = checklistIdOrigine ? 'suggerito_ai' : 'manuale';
        const dataToSave = {
            titolo,
            descrizione,
            cliente,
            interventi: interventiValidi,
            stato: 'bozza',
            origin: origin, // Salva l'origine corretta
        };
        // Aggiungi checklist_id_origine solo se valido e l'origine è 'suggerito_ai'
        if (origin === 'suggerito_ai' && checklistIdOrigine && mongoose.Types.ObjectId.isValid(checklistIdOrigine)) {
            dataToSave.checklist_id_origine = checklistIdOrigine;
        }
        // *** FINE CORREZIONE ***

        console.log("Dati da salvare per Nuovo Piano:", dataToSave);

        const nuovoPiano = new PianoAzione(dataToSave); // Usa l'oggetto preparato
        await nuovoPiano.save();

        // Popoliamo leggermente per la risposta (opzionale)
        const pianoSalvato = await PianoAzione.findById(nuovoPiano._id)
            .select('titolo cliente.nome stato data_creazione origin checklist_id_origine')
            .lean();

        res.status(201).json({ message: 'Piano d\'azione creato con successo', data: pianoSalvato });

    } catch (err) {
        console.error("Errore in POST /api/action-plan:", err.message, err.stack);
        if (err.name === 'ValidationError') {
             const errors = Object.values(err.errors).map(el => el.message);
             return res.status(400).json({ message: `Errore di validazione: ${errors.join(', ')}`, errors: err.errors });
         }
        res.status(500).json({ message: 'Errore del server durante la creazione del piano.' });
    }
});


// --- PUT /api/action-plan/:id --- (Verifica che gestisca 'interventi' correttamente)
router.put('/:id', async (req, res) => {
    console.log(`Richiesta PUT /api/action-plan/${req.params.id} con body:`, req.body);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'ID Piano non valido.' });
    }

    const {
        titolo, descrizione, cliente, interventi, stato, // 'interventi' è l'array di ID
        responsabile_piano, data_inizio, data_fine_prevista
    } = req.body;

    const campiDaAggiornare = {};
    if (titolo !== undefined) campiDaAggiornare.titolo = titolo;
    if (descrizione !== undefined) campiDaAggiornare.descrizione = descrizione;
    // Aggiorna solo il nome cliente per semplicità, ma potresti voler aggiornare l'intero oggetto
    if (cliente?.nome !== undefined) campiDaAggiornare['cliente.nome'] = cliente.nome;
    if (stato !== undefined) campiDaAggiornare.stato = stato;
    if (responsabile_piano !== undefined) campiDaAggiornare.responsabile_piano = responsabile_piano;

    // Gestione date (assicurati che siano valide o null)
    if (data_inizio !== undefined) {
        const date = data_inizio ? new Date(data_inizio) : null;
        campiDaAggiornare.data_inizio = (date instanceof Date && !isNaN(date)) ? date : null;
    }
    if (data_fine_prevista !== undefined) {
        const date = data_fine_prevista ? new Date(data_fine_prevista) : null;
        campiDaAggiornare.data_fine_prevista = (date instanceof Date && !isNaN(date)) ? date : null;
    }

    // Gestione array interventi (se presente nel body)
    if (interventi !== undefined && Array.isArray(interventi)) {
        // Filtra solo ID validi
        campiDaAggiornare.interventi = interventi.filter(id => mongoose.Types.ObjectId.isValid(id));
        // Nota: Qui non verifichiamo se gli interventi esistono davvero, diamo per scontato siano validi.
        // Una verifica aggiuntiva (come nel POST) sarebbe più robusta ma più lenta.
    }

    // Non aggiorniamo origin o checklist_id_origine qui

    console.log("Campi da aggiornare per PUT:", campiDaAggiornare);

    try {
        const piano = await PianoAzione.findByIdAndUpdate(
            req.params.id,
            { $set: campiDaAggiornare },
            { new: true, runValidators: true } // Restituisce doc aggiornato, esegue validazioni
        )
        // Popola gli interventi anche nella risposta del PUT
        .populate({
            path: 'interventi',
            select: 'titolo area priorita stato completamento_perc'
        })
        .lean();

        if (!piano) {
            return res.status(404).json({ message: 'Piano d\'azione non trovato.' });
        }
        res.json({ message: 'Piano d\'azione aggiornato con successo', data: piano });

    } catch (err) {
        console.error(`Errore in PUT /api/action-plan/${req.params.id}:`, err.message, err.stack);
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            return res.status(400).json({ message: `Errore di validazione: ${errors.join(', ')}`, errors: err.errors });
        }
        res.status(500).json({ message: 'Errore del server durante l\'aggiornamento del piano.' });
    }
});


// --- DELETE /api/action-plan/:id --- (Invariato)
router.delete('/:id', async (req, res) => {
     console.log(`Richiesta DELETE /api/action-plan/${req.params.id} (non protetta per test)`);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID Piano non valido.' });
    try {
        const piano = await PianoAzione.findByIdAndDelete(req.params.id);
        if (!piano) return res.status(404).json({ message: 'Piano d\'azione non trovato.' });
        res.json({ message: 'Piano d\'azione eliminato con successo' });
    } catch (err) {
        console.error(`Errore in DELETE /api/action-plan/${req.params.id}:`, err.message);
        res.status(500).json({ message: 'Errore del server durante l\'eliminazione del piano.' });
    }
});

// --- POST /api/action-plan/suggest --- (Invariato)
router.post('/suggest', async (req, res) => {
    console.log(`Richiesta POST /api/action-plan/suggest (non protetta) con body:`, req.body);
    const { checklistId } = req.body;

    if (!checklistId) return res.status(400).json({ message: 'ID Checklist mancante nel corpo della richiesta.' });
    if (!mongoose.Types.ObjectId.isValid(checklistId)) return res.status(400).json({ message: 'ID Checklist non valido.' });

    try {
        const checklist = await Checklist.findById(checklistId).select('cliente').lean(); // Prendi tutto l'oggetto cliente
        if (!checklist) return res.status(404).json({ message: 'Checklist non trovata.' });
        if (!checklist.cliente || !checklist.cliente.dimensioneStimata) { // Verifica dimensione
             return res.status(400).json({ message: 'Informazioni cliente (Dimensione Stimata) mancanti nella checklist.' });
        }

        const azioniSuggerite = await suggestActionPlan(checklistId, checklist.cliente); // Passa l'oggetto cliente

        res.json({
            message: `Suggerimenti piano d'azione generati per checklist ${checklistId}.`,
            data: azioniSuggerite
        });

    } catch (error) {
        console.error(`!!! Errore in POST /api/action-plan/suggest per checklist ${checklistId}:`, error);
        res.status(500).json({ message: `Errore del server durante la generazione dei suggerimenti: ${error.message}` });
    }
});

// --- NUOVA ROUTE: POST /api/action-plan/generate-ai ---
/**
 * Genera e salva automaticamente un Piano d'Azione basato su una checklist.
 */
router.post('/generate-ai', async (req, res) => {
    console.log(`Richiesta POST /api/action-plan/generate-ai con body:`, req.body);
    const { checklistId } = req.body;

    if (!checklistId) {
        return res.status(400).json({ message: 'ID Checklist mancante nel corpo della richiesta.' });
    }
    if (!mongoose.Types.ObjectId.isValid(checklistId)) {
        return res.status(400).json({ message: 'ID Checklist non valido.' });
    }

    try {
        // Chiama il nuovo servizio per creare il piano
        const nuovoPiano = await createAiActionPlan(checklistId);

        // Restituisci il piano creato (o solo ID e info base)
        res.status(201).json({
            message: `Piano d'azione generato con successo per la checklist ${checklistId}.`,
            data: nuovoPiano // Restituisce l'oggetto piano salvato
        });

    } catch (error) {
        console.error(`!!! Errore in POST /api/action-plan/generate-ai per checklist ${checklistId}:`, error);
        // Gestisci errori specifici lanciati dal servizio
        if (error.message.includes('Checklist non trovata') || error.message.includes('non è completata')) {
            return res.status(400).json({ message: error.message });
        }
        if (error.message.includes('Errore nella preparazione degli interventi')) {
             return res.status(500).json({ message: error.message }); // Errore interno
        }
        // Errore generico
        res.status(500).json({ message: `Errore del server durante la generazione del piano AI: ${error.message}` });
    }
});
// --- FINE NUOVA ROUTE ---

module.exports = router;

// END OF FILE server/routes/actionPlan.js (AGGIORNATO v3 - Nuova Route Generate AI)