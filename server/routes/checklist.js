const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// const authMiddleware = require('../middleware/auth'); // Temporaneamente commentato
const { Checklist, Gap } = require('../models/diagnosi'); // Importa Checklist e Gap
const { QuestionTemplate } = require('../models/templates'); // Importa il modello delle domande standard
const { generateGapsForChecklist } = require('../services/gapGenerator'); // Importa la funzione di generazione Gap
const { selectPertinentQuestionsAI } = require('../services/checklistQuestionSelectorAI'); // NUOVO IMPORT

// router.use(authMiddleware); // Temporaneamente commentato

// --- GET /api/checklist ---
// Recupera l'elenco di tutte le checklist (solo info principali)
router.get('/', async (req, res) => {
    console.log(`>>> [${new Date().toISOString()}] INIZIO GET /api/checklist (Elenco)`);
    try {
        console.log(">>> Tentativo Checklist.find({}) [Elenco]...");
        const checklists = await Checklist.find({})
                                         .select('nome descrizione stato data_creazione cliente.nome numero_gap_rilevati')
                                         .sort({ data_creazione: -1 });
        console.log(`>>> Checklist.find() [Elenco] completato. Trovate: ${checklists ? checklists.length : 'null'}`);

        if (!checklists) {
             console.log(">>> Find ha restituito null/undefined? Invio array vuoto.");
             return res.json({ message: 'Nessuna checklist trovata.', data: [] });
        }

        console.log(">>> Invio risposta JSON [Elenco]...");
        res.json({ message: 'Elenco checklist recuperato con successo', data: checklists });
        console.log(">>> Risposta JSON [Elenco] inviata.");

    } catch (err) {
        console.error(`!!! ERRORE CATTURATO in GET /api/checklist (Elenco):`, err);
         if (!res.headersSent) {
             res.status(500).json({ message: 'Errore del server nel recupero delle checklist.' });
         }
    }
    console.log(`>>> [${new Date().toISOString()}] FINE GET /api/checklist (Elenco)`);
});

// --- POST /api/checklist (CON FILTRO RILEVANZA) ---
// Crea una nuova checklist, popolando l'array 'answers' dai template attivi e filtrati
router.post('/', async (req, res) => {
    console.log(`Richiesta POST /api/checklist (CON SELEZIONE E MOTIVAZIONE AI) con body:`, req.body);
    const { nome, descrizione, cliente } = req.body;

    // Define CORE_QUESTION_ITEM_IDS if not already defined in a higher scope
    // This is a placeholder and might need adjustment based on actual project structure.
    const CORE_QUESTION_ITEM_IDS = global.CORE_QUESTION_ITEM_IDS || []; 

    if (!nome || !cliente || !cliente.nome) {
        return res.status(400).json({ message: 'Nome checklist e nome cliente sono obbligatori.' });
    }
    // Potresti aggiungere qui validazioni più stringenti sui nuovi campi cliente se necessario

    try {
        // 1. Recupera tutte le domande template attive
        const tutteDomandeTemplate = await QuestionTemplate.find({ attiva: true })
            .select('_id itemId domanda area sottoArea rilevanza fonte tipoRisposta opzioniRisposta testoAiuto ordine tags dependsOn') // Includi tutti i campi utili per l'AI
            .sort({ area: 1, ordine: 1 }) // Ordina per consistenza
            .lean();

        if (!tutteDomandeTemplate || tutteDomandeTemplate.length === 0) {
            return res.status(500).json({ message: 'Errore: Nessun template di domanda attivo trovato.' });
        }

        // 2. Chiama il servizio AI aggiornato
        // Potresti rendere 'targetTotalQuestions' configurabile
        const domandeSelezionateInfo = await selectPertinentQuestionsAI(cliente, tutteDomandeTemplate, 75); 

        if (!domandeSelezionateInfo || domandeSelezionateInfo.length === 0) {
            console.warn("L'AI non ha selezionato domande o c'è stato un errore. La checklist potrebbe essere vuota.");
            // Gestisci questo caso come preferisci (es. errore, checklist vuota, o checklist con solo core se il fallback le ha restituite)
        }
        
        const answersDaSalvare = [];
        // Mappa per accedere facilmente alle informazioni per ogni itemId selezionato
        const selectionDetailsMap = new Map();
        if (domandeSelezionateInfo) { // Added safety check for the array
            domandeSelezionateInfo.forEach(info => {
                if (info && info.itemId) { // Added safety check for info object and itemId
                    selectionDetailsMap.set(info.itemId, {
                        motivazione: info.motivazioneAI,
                        isCore: info.isCore || false // Aggiungi il flag isCore
                    });
                }
            });
        }

        tutteDomandeTemplate.forEach(qTemplate => {
            if (selectionDetailsMap.has(qTemplate.itemId)) { // Se la domanda è tra quelle selezionate (core o AI)
                const selectionInfo = selectionDetailsMap.get(qTemplate.itemId);
                answersDaSalvare.push({
                    questionTemplate: qTemplate._id,
                    itemId: qTemplate.itemId,
                    domandaText: qTemplate.domanda,
                    area: qTemplate.area,
                    sottoArea: qTemplate.sottoArea,
                    ordine: qTemplate.ordine,
                    rilevanza: qTemplate.rilevanza,
                    fonte: qTemplate.fonte,
                    tipoRisposta: qTemplate.tipoRisposta,
                    opzioniRisposta: qTemplate.opzioniRisposta || [],
                    testoAiuto: qTemplate.testoAiuto,
                    dependsOn: qTemplate.dependsOn || [],
                    risposta: null,
                    note: '',
                    motivazioneSelezioneAI: selectionInfo.motivazione, // Questa conterrà la motivazione AI o quella standard per le core
                    isCoreQuestion: selectionInfo.isCore 
                });
            }
        });
        
        // Opzionale: riordina answersDaSalvare se l'AI non le ha ordinate come desiderato
        // (es. per area, poi per itemId, o per come le ha ordinate l'AI se rilevante)
        // L'AI dovrebbe già ordinarle, ma un riordino finale per area/itemId può garantire coerenza
        // L'ordinamento finale delle domande nella checklist:
         answersDaSalvare.sort((a, b) => {
            const areaCompare = (a.area || "").localeCompare(b.area || "");
            if (areaCompare !== 0) return areaCompare;
            
            // All'interno della stessa area, le domande "core" vengono prima
            // (assumendo che `isCoreQuestion` sia stato aggiunto allo schema e popolato)
            const aIsActuallyCore = CORE_QUESTION_ITEM_IDS.includes(a.itemId); // Usiamo l'array originale per sicurezza
            const bIsActuallyCore = CORE_QUESTION_ITEM_IDS.includes(b.itemId);

            if (aIsActuallyCore && !bIsActuallyCore) return -1;
            if (!aIsActuallyCore && bIsActuallyCore) return 1;
            
            // Se entrambe core o entrambe non core, ordina per itemId
            return (a.itemId || "").localeCompare(b.itemId || "");
        });


        const nuovaChecklist = new Checklist({
            nome,
            descrizione,
            // Passa l'intero oggetto cliente ricevuto, Mongoose ignorerà campi non definiti nello schema
            // Assicurati che il frontend invii l'oggetto cliente strutturato correttamente
            // e che lo schema Checklist lo supporti o che tu faccia un mapping esplicito qui
            cliente: { ...cliente }, // Copia l'oggetto cliente per intero
            answers: answersDaSalvare, // Quelle selezionate dall'AI
            stato: 'bozza',
            // compilata_da_id: req.user?.id // Se hai autenticazione
        });

        await nuovaChecklist.save();
        console.log(`Checklist "${nome}" creata con ${answersDaSalvare.length} domande (incluse core e selezionate da AI).`);
        
        res.status(201).json({
            message: 'Checklist creata: domande core e domande aggiuntive selezionate/motivate da AI.',
            data: nuovaChecklist,
            // infoSelezioneAI: domandeSelezionateInfo // Opzionale, se vuoi restituire le motivazioni/info dell'AI
        });

    } catch (err) {
        console.error("Errore in POST /api/checklist (con AI e core questions):", err);
        if (err.name === 'ValidationError') {
            // Log più dettagliato degli errori di validazione Mongoose
            console.error("Dettagli errore di validazione:", err.errors);
            return res.status(400).json({ message: 'Errore di validazione dei dati della checklist.', errors: err.errors });
        }
        // Per altri errori, un messaggio più generico ma che indichi il contesto AI
        res.status(500).json({ message: `Errore del server durante la creazione della checklist (selezione AI con motivazione): ${err.message}` });
    }
});

// --- GET /api/checklist/:id (CON LOG AGGIUNTIVI) ---
router.get('/:id', async (req, res) => {
    console.log(`>>> [${new Date().toISOString()}] INIZIO GET /api/checklist/:id. req.params:`, req.params); // LOG PARAMS
    const checklistId = req.params.id; // Estrai ID dai parametri

    if (!mongoose.Types.ObjectId.isValid(checklistId)) {
        console.log(`>>> ID non valido: ${checklistId}`);
        return res.status(400).json({ message: 'ID Checklist non valido.' });
    }
    try {
        console.log(`>>> Tentativo Checklist.findById con ID: ${checklistId}`);
        const checklist = await Checklist.findById(checklistId);
        console.log(`>>> Checklist.findById risultato:`, checklist ? `Trovato (ID: ${checklist._id})` : 'Non Trovato (null)');

        if (!checklist) {
            console.log(`>>> Checklist ${checklistId} non trovata nel DB, invio 404.`);
            return res.status(404).json({ message: 'Checklist non trovata.' });
        }

        console.log(`>>> Checklist ${checklistId} trovata, invio risposta JSON...`);
        res.json({ message: 'Checklist recuperata con successo', data: checklist });
        console.log(`>>> Risposta JSON per ${checklistId} inviata.`);

    } catch (err) {
        console.error(`!!! ERRORE DETTAGLIO CHECKLIST ${checklistId}:`, err);
         if (!res.headersSent) {
             res.status(500).json({ message: 'Errore del server nel recupero della checklist.' });
         }
    }
    console.log(`>>> [${new Date().toISOString()}] FINE GET /api/checklist/:id`);
});

// --- PUT /api/checklist/:id (Aggiorna solo info generali) ---
router.put('/:id', async (req, res) => {
    console.log(`Richiesta PUT /api/checklist/${req.params.id} (non protetta per test) con body:`, req.body);
    const checklistId = req.params.id; // Usa variabile per chiarezza
    if (!mongoose.Types.ObjectId.isValid(checklistId)) return res.status(400).json({ message: 'ID Checklist non valido.' });

    const { nome, descrizione, cliente, stato } = req.body;
    const campiDaAggiornare = {};
    if (nome !== undefined) campiDaAggiornare.nome = nome;
    if (descrizione !== undefined) campiDaAggiornare.descrizione = descrizione;
    if (cliente !== undefined) campiDaAggiornare.cliente = cliente;
    if (stato !== undefined) campiDaAggiornare.stato = stato;

    let triggerGapGeneration = false;

    try {
         // Controlla stato precedente PRIMA di aggiornare
         if (stato === 'completata') {
             const checklistPrecedente = await Checklist.findById(checklistId).select('stato');
             if (checklistPrecedente && checklistPrecedente.stato !== 'completata') {
                 campiDaAggiornare.data_compilazione = Date.now();
                 triggerGapGeneration = true;
                 console.log(`Checklist ${checklistId} marcata come completata. Trigger generazione Gap.`);
             } else {
                 console.log(`Checklist ${checklistId} era già completata o non trovata. Nessun trigger Gap.`);
             }
        } else if (stato && stato !== 'completata') {
             campiDaAggiornare.data_compilazione = null;
             campiDaAggiornare.numero_gap_rilevati = 0;
             console.log(`Checklist ${checklistId} impostata a stato ${stato}. Azzero data completamento e conteggio gap.`);
             await Gap.deleteMany({ checklist_id: checklistId });
             console.log(`Gap associati a checklist ${checklistId} eliminati perché è stata riaperta.`);
        }

        const checklistAggiornata = await Checklist.findByIdAndUpdate(
            checklistId, { $set: campiDaAggiornare }, { new: true, runValidators: true }
        );
        if (!checklistAggiornata) return res.status(404).json({ message: 'Checklist non trovata.' });

        // Avvia generazione Gap in background se necessario
        if (triggerGapGeneration) {
            generateGapsForChecklist(checklistAggiornata._id)
                .then(count => console.log(`Generazione Gap per ${checklistAggiornata._id} completata in background. Generati: ${count}`))
                .catch(err => console.error(`Errore background generazione Gap per ${checklistAggiornata._id}:`, err));
        }

        res.json({ message: 'Checklist aggiornata con successo', data: checklistAggiornata });

    } catch (err) {
        console.error(`Errore in PUT /api/checklist/${checklistId}:`, err.message);
         if (err.name === 'ValidationError') return res.status(400).json({ message: 'Errore di validazione', errors: err.errors });
        res.status(500).json({ message: 'Errore del server durante l\'aggiornamento della checklist.' });
    }
});

// --- PUT /api/checklist/:id/answers/:itemId (Aggiorna singola risposta) ---
router.put('/:id/answers/:itemId', async (req, res) => {
    console.log(`Richiesta PUT /api/checklist/${req.params.id}/answers/${req.params.itemId} (non protetta per test) con body:`, req.body);
    const { risposta, note } = req.body;
    const checklistId = req.params.id;
    const itemId = req.params.itemId;

    if (!mongoose.Types.ObjectId.isValid(checklistId)) return res.status(400).json({ message: 'ID Checklist non valido.' });
    if (!itemId) return res.status(400).json({ message: 'Item ID mancante.' });

    try {
        // Aggiorna stato checklist a 'in_corso' se era 'bozza'
        const checklist = await Checklist.findById(checklistId).select('stato');
        let updateStato = {};
        if (checklist && checklist.stato === 'bozza' && risposta !== null && risposta !== undefined && risposta !== '') {
             updateStato = { stato: 'in_corso' };
             console.log(`Checklist ${checklistId} impostata automaticamente a 'in_corso'.`);
        }

        const result = await Checklist.updateOne(
            { _id: checklistId, "answers.itemId": itemId },
            { $set: { "answers.$.risposta": risposta, "answers.$.note": note ?? '', ...updateStato } }
        );

        if (result.matchedCount === 0) return res.status(404).json({ message: 'Checklist o Item non trovato.' });

        res.json({ message: 'Risposta checklist aggiornata con successo' });

    } catch (err) {
        console.error(`Errore in PUT /api/checklist/${checklistId}/answers/${itemId}:`, err.message);
        res.status(500).json({ message: 'Errore del server durante l\'aggiornamento della risposta.' });
    }
});


// --- DELETE /api/checklist/:id (CON LOG AGGIUNTIVI) ---
router.delete('/:id', async (req, res) => {
    console.log(`>>> Richiesta DELETE /api/checklist/:id ricevuta. req.params:`, req.params); // <-- LOG PARAMS
    const checklistId = req.params.id; // Estrai ID

    if (!mongoose.Types.ObjectId.isValid(checklistId)) {
        console.log(`>>> ID non valido per delete: ${checklistId}`);
        return res.status(400).json({ message: 'ID Checklist non valido.' });
    }
    try {
        console.log(`>>> Tentativo findById per delete: ${checklistId}`);
        const checklistExists = await Checklist.findById(checklistId).select('_id');
        if (!checklistExists) {
            console.log(`>>> Checklist ${checklistId} non trovata per delete, invio 404.`);
            return res.status(404).json({ message: 'Checklist non trovata.' });
        }
        console.log(`>>> Checklist ${checklistId} trovata. Procedo con eliminazione Gap e Checklist.`);

        // Elimina Gap associati
        try {
             const deleteGapResult = await Gap.deleteMany({ checklist_id: checklistId });
             console.log(`>>> Gap associati a checklist ${checklistId} eliminati: ${deleteGapResult.deletedCount}`);
        } catch(gapErr){
             console.error(`!!! ERRORE ELIMINAZIONE GAP per checklist ${checklistId}:`, gapErr);
             // Continuiamo comunque con l'eliminazione della checklist
        }

        // Elimina Checklist
        console.log(`>>> Tentativo findByIdAndDelete per checklist: ${checklistId}`);
        await Checklist.findByIdAndDelete(checklistId);
        console.log(`>>> Checklist ${checklistId} eliminata.`);
        res.json({ message: 'Checklist e gap associati eliminati con successo' });

    } catch (err) {
        console.error(`!!! ERRORE ELIMINAZIONE CHECKLIST ${checklistId}:`, err); // Logga errore completo
        if (!res.headersSent) {
            res.status(500).json({ message: 'Errore del server durante l\'eliminazione.' });
        }
    }
    console.log(`>>> [${new Date().toISOString()}] FINE DELETE /api/checklist/:id`);
});

module.exports = router;