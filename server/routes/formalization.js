const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// const authMiddleware = require('../middleware/auth'); // Temporaneamente commentato
const { DocumentoFormalizzazione } = require('../models/progettazione');
const multer = require('multer'); // Per gestione upload
const path = require('path');   // Per gestire percorsi file
const fs = require('fs');       // Per interagire con filesystem (es. creare cartella)

// *** NUOVO IMPORT ***
const { generateDocumentDraft, analyzeContextForAssetStructure } = require('../services/documentGeneratorAI');

console.log("+++ Loading server/routes/formalization.js router +++"); // <--- AGGIUNGI QUESTO


// Configurazione Multer per Upload
const UPLOAD_FOLDER = path.join(__dirname, '../uploads'); // Cartella dove salvare i file (relativa a questo file)

// Assicurati che la cartella uploads esista
if (!fs.existsSync(UPLOAD_FOLDER)){
    console.log(`Cartella uploads non trovata, la creo in: ${UPLOAD_FOLDER}`);
    fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
}

// Configurazione storage Multer: salva file con nome originale + timestamp per evitare collisioni
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_FOLDER); // Salva nella cartella definita
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Mantieni estensione originale
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage }); // Istanza di Multer

// router.use(authMiddleware); // Temporaneamente commentato

// --- GET /api/formalization ---
// Recupera elenco metadati documenti
router.get('/', async (req, res) => {
    console.log("!!!!!!!!!! TEST MODIFICA FILE formalization.js - GET / !!!!!!!!!");
    console.log(`Richiesta GET /api/formalization (non protetta per test)`);
    try {
        const documenti = await DocumentoFormalizzazione.find({})
                                                  .select('-contenuto') // Escludi campo 'contenuto' testuale se non serve nell'elenco
                                                  .sort({ data_creazione: -1 });
        res.json({ message: 'Documenti recuperati', data: documenti });
    } catch (err) {
        console.error("Errore GET /api/formalization:", err.message);
        res.status(500).json({ message: 'Errore server recupero documenti.' });
    }
});

// --- POST /api/formalization ---
// Carica un nuovo documento (file + metadati)
// Usa il middleware 'upload.single' di multer per gestire UN file nel campo 'documentoFile'
router.post('/', upload.single('documentoFile'), async (req, res) => {
    console.log(`Richiesta POST /api/formalization (non protetta per test)`);
    console.log("Body:", req.body);
    console.log("File:", req.file); // req.file contiene info sul file caricato da multer

    const { titolo, tipo, descrizione, intervento_id, versione } = req.body;

    // Validazione base
    if (!titolo || !tipo) return res.status(400).json({ message: 'Titolo e Tipo sono obbligatori.' });
    if (!req.file) return res.status(400).json({ message: 'Nessun file caricato.' });

    try {
        const nuovoDocumento = new DocumentoFormalizzazione({
            titolo,
            tipo, // Assicura corrispondenza con enum
            descrizione,
            // Associa intervento se l'ID è valido
            intervento_id: mongoose.Types.ObjectId.isValid(intervento_id) ? intervento_id : null,
            stato: 'bozza',
            versione: versione || '1.0',
            // Salva informazioni sul file caricato
            nomeFileOriginale: req.file.originalname,
            nomeFileSalvataggio: req.file.filename, // Nome univoco generato da multer
            pathFile: req.file.path, // Percorso completo sul server (relativo a dove gira Node)
            mimetypeFile: req.file.mimetype,
            sizeFile: req.file.size,
            // creato_da: req.user?.id // Con autenticazione
            data_aggiornamento: Date.now()
        });
        // Nota: Il campo 'contenuto' (testuale) non viene popolato qui, si usa il file salvato.

        await nuovoDocumento.save();
        // Restituisci i metadati salvati (senza il contenuto testuale)
        const docSalvato = nuovoDocumento.toObject();
        delete docSalvato.contenuto; // Rimuovi per sicurezza

        res.status(201).json({ message: 'Documento caricato e metadati salvati.', data: docSalvato });

    } catch (err) {
        console.error("Errore POST /api/formalization:", err.message);
        // Se c'è errore DB, cancella il file fisico caricato da multer? (Opzionale)
        if (req.file && req.file.path) {
             fs.unlink(req.file.path, (unlinkErr) => {
                 if (unlinkErr) console.error("Errore cancellazione file dopo fallimento DB:", unlinkErr);
             });
         }
        if (err.name === 'ValidationError') return res.status(400).json({ message: 'Errore validazione', errors: err.errors });
        res.status(500).json({ message: 'Errore server salvataggio documento.' });
    }
});

 // --- GET /api/formalization/:id/download ---
 // Permette di scaricare il file fisico associato a un documento
 router.get('/:id/download', async (req, res) => {
     console.log(`Richiesta DOWNLOAD /api/formalization/${req.params.id} (non protetta)`);
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID Documento non valido.' });

     try {
         const documento = await DocumentoFormalizzazione.findById(req.params.id).select('pathFile nomeFileOriginale mimetypeFile'); // Seleziona solo info file
         if (!documento || !documento.pathFile) {
             return res.status(404).json({ message: 'Documento o file associato non trovato.' });
         }

         // Verifica se il file esiste fisicamente prima di inviarlo
         if (!fs.existsSync(documento.pathFile)) {
              console.error(`File non trovato sul disco: ${documento.pathFile}`);
              return res.status(404).json({ message: 'File associato non trovato sul server.' });
         }

         // Invia il file come download
         // Il browser userà 'nomeFileOriginale' come nome del file scaricato
         res.download(documento.pathFile, documento.nomeFileOriginale, (err) => {
             if (err) {
                 console.error("Errore durante l'invio del file:", err);
                 // Evita di mandare un altro header se l'errore avviene dopo l'invio parziale
                 if (!res.headersSent) {
                    res.status(500).send('Errore durante il download del file.');
                 }
             } else {
                 console.log(`File ${documento.nomeFileOriginale} scaricato con successo.`);
             }
         });

     } catch (err) {
         console.error(`Errore GET /api/formalization/${req.params.id}/download:`, err.message);
         res.status(500).json({ message: 'Errore server durante il recupero del documento per il download.' });
     }
 });


// --- DELETE /api/formalization/:id ---
// Elimina i metadati e il file fisico associato
router.delete('/:id', async (req, res) => {
    console.log(`Richiesta DELETE /api/formalization/${req.params.id} (non protetta per test)`);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'ID Documento non valido.' });

    try {
        const documento = await DocumentoFormalizzazione.findById(req.params.id).select('pathFile'); // Prendi il percorso del file
        if (!documento) return res.status(404).json({ message: 'Documento non trovato.' });

        // Elimina prima il documento dal DB
        await DocumentoFormalizzazione.findByIdAndDelete(req.params.id);

        // Poi prova a eliminare il file fisico
        if (documento.pathFile && fs.existsSync(documento.pathFile)) {
            fs.unlink(documento.pathFile, (unlinkErr) => {
                if (unlinkErr) {
                    console.error(`Errore cancellazione file ${documento.pathFile}:`, unlinkErr);
                    // Non mandiamo errore al client per questo, ma lo logghiamo
                } else {
                    console.log(`File ${documento.pathFile} eliminato con successo.`);
                }
            });
        } else {
             console.warn(`File ${documento.pathFile} non trovato o path non definito, impossibile cancellare.`);
        }

        res.json({ message: 'Documento eliminato con successo' });

    } catch (err) {
        console.error(`Errore DELETE /api/formalization/${req.params.id}:`, err.message);
        res.status(500).json({ message: 'Errore server eliminazione documento.' });
    }
});




// --- *** NUOVA ROUTE: POST /api/formalization/generate-ai *** ---
router.post('/generate-ai', async (req, res) => {
    console.log("Richiesta POST /api/formalization/generate-ai con body:", req.body); // Verifica che questo log appaia
    const { interventoId, tipoDocumento, parametriUtente } = req.body;

    // Validazione Input
    if (!interventoId || !tipoDocumento) {
        return res.status(400).json({ message: "ID intervento e tipo documento sono obbligatori." });
    }
    if (!mongoose.Types.ObjectId.isValid(interventoId)) {
        return res.status(400).json({ message: "ID intervento non valido." });
    }
    const tipiValidi = ['procedura', 'mansionario', 'organigramma', 'delega', 'altro']; // Aggiungi/modifica se necessario
    if (!tipiValidi.includes(tipoDocumento.toLowerCase())) {
        return res.status(400).json({ message: "Tipo documento non valido." });
    }

    try {
        // Chiama il servizio AI per generare la bozza
        const bozzaMarkdown = await generateDocumentDraft(interventoId, tipoDocumento, parametriUtente);

        // Per ora, restituiamo direttamente la bozza Markdown al frontend
        // In futuro, potremmo salvarla nel DB e restituire l'ID del documento
        res.json({
            message: `Bozza per ${tipoDocumento} generata con successo.`,
            data: {
                bozzaMarkdown: bozzaMarkdown
            }
        });

    } catch (error) {
        console.error(`Errore in POST /generate-ai per intervento ${interventoId}:`, error);
        // Restituisci messaggi di errore specifici dal servizio se possibile
        res.status(500).json({ message: error.message || "Errore del server durante la generazione della bozza AI." });
    }
});
// --- *** FINE NUOVA ROUTE *** ---


// --- *** NUOVA ROUTE: POST /api/formalization/from-ai *** ---
router.post('/from-ai', async (req, res) => {
    console.log(">>> Richiesta POST /api/formalization/from-ai (salvataggio bozza AI)");
    console.log(">>> Body Ricevuto:", req.body);

    const { titolo, tipo, descrizione, intervento_id, contenutoMarkdown } = req.body;

    // Validazione Base
    if (!titolo || !tipo || !contenutoMarkdown) {
        return res.status(400).json({ message: 'Titolo, Tipo e Contenuto Markdown sono obbligatori per salvare la bozza AI.' });
    }
    if (!['organigramma', 'mansionario', 'procedura', 'delega', 'altro'].includes(tipo)) {
         return res.status(400).json({ message: 'Tipo documento non valido.' });
    }
    if (intervento_id && !mongoose.Types.ObjectId.isValid(intervento_id)) {
        return res.status(400).json({ message: 'ID intervento fornito non valido.' });
    }

    try {
        const nuovoDocumento = new DocumentoFormalizzazione({
            titolo,
            tipo,
            descrizione: descrizione || '', // Assicura che sia stringa
            stato: 'bozza',
            versione: '1.0_AI', // Versione specifica per indicare origine
            contenutoMarkdown: contenutoMarkdown,
            // Associa intervento solo se valido
            intervento_id: intervento_id && mongoose.Types.ObjectId.isValid(intervento_id) ? intervento_id : null,
            // Campi file volutamente lasciati vuoti/null
            nomeFileOriginale: null,
            nomeFileSalvataggio: null,
            pathFile: null,
            mimetypeFile: null,
            sizeFile: null,
            // Potresti aggiungere 'generato_da_ai: true' o simile
        });

        await nuovoDocumento.save();
        console.log(">>> Bozza AI salvata con successo. ID:", nuovoDocumento._id);

        // Restituisci i metadati salvati (senza contenuto per brevità, opzionale)
        const docSalvato = nuovoDocumento.toObject();
        delete docSalvato.contenutoMarkdown; // Rimuovi dalla risposta

        res.status(201).json({ message: 'Bozza documento AI salvata con successo.', data: docSalvato });

    } catch (err) {
        console.error("!!! Errore POST /api/formalization/from-ai:", err.message);
        if (err.name === 'ValidationError') {
             return res.status(400).json({ message: 'Errore validazione dati.', errors: err.errors });
        }
        res.status(500).json({ message: 'Errore del server durante il salvataggio della bozza.' });
    }
});
// --- *** FINE NUOVA ROUTE *** ---

// --- *** NUOVA ROUTE: GET /api/formalization/:id (Dettaglio) *** ---
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`>>> Richiesta GET /api/formalization/${id} (Dettaglio)`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID Documento non valido.' });
    }

    try {
        // Seleziona TUTTI i campi necessari, incluso contenutoMarkdown
        const documento = await DocumentoFormalizzazione.findById(id)
            .populate('intervento_id', 'titolo'); // Popola info intervento associato

        if (!documento) {
            return res.status(404).json({ message: 'Documento di formalizzazione non trovato.' });
        }

        console.log(`>>> Documento ${id} trovato.`);
        res.json({ message: 'Dettaglio documento recuperato con successo.', data: documento });

    } catch (err) {
        console.error(`!!! Errore GET /api/formalization/${id}:`, err.message);
        res.status(500).json({ message: 'Errore del server durante il recupero del dettaglio documento.' });
    }
});
// --- *** FINE NUOVA ROUTE DETTAGLIO *** ---

// --- *** NUOVA ROUTE: POST /api/formalization/analyze-context-for-structure *** ---
router.post('/analyze-context-for-structure', async (req, res) => {
    console.log("Richiesta POST /api/formalization/analyze-context-for-structure con body:", req.body);
    const { interventoId, tipoDocumentoDaStrutturare, areaTematica, parametriUtente } = req.body;

    // Validazione Input (semplificata, puoi renderla più robusta)
    if (!tipoDocumentoDaStrutturare && !areaTematica) {
        return res.status(400).json({ message: "È necessario fornire 'tipoDocumentoDaStrutturare' o 'areaTematica'." });
    }
    if (interventoId && !mongoose.Types.ObjectId.isValid(interventoId)) {
        return res.status(400).json({ message: "ID intervento non valido." });
    }
    
    try {
        // Chiama un nuovo servizio AI per analizzare il contesto e proporre una struttura
        const assetStructureAnalysis = await analyzeContextForAssetStructure(
            tipoDocumentoDaStrutturare, // Es. "procedura", "mansionario"
            areaTematica,               // Es. "Sistema di deleghe", "Gestione non conformità" (alternativo a interventoId)
            interventoId,               // ID intervento Mongoose (opzionale, se si parte da un intervento specifico)
            parametriUtente             // Eventuali parametri aggiuntivi forniti dall'utente
        );

        res.json({
            message: `Analisi contesto e proposta struttura per ${tipoDocumentoDaStrutturare || areaTematica} completata.`,
            data: assetStructureAnalysis // Es. { propostaStruttura: ["Scopo", "Ambito", ...], riferimentiKbUtili: [...] }
        });

    } catch (error) {
        console.error(`Errore in POST /analyze-context-for-structure:`, error);
        res.status(500).json({ message: error.message || "Errore del server durante l'analisi del contesto per la struttura dell'assetto." });
    }
});
// --- *** FINE NUOVA ROUTE *** ---

module.exports = router;
// END OF FILE server/routes/formalization.js (AGGIORNATO con Generazione AI)