const express = require("express");

const router = express.Router();

const mongoose = require("mongoose");

const {DocumentoFormalizzazione: DocumentoFormalizzazione} = require("../models/progettazione");

const multer = require("multer");

const path = require("path");

const fs = require("fs");

const {generateDocumentDraft: generateDocumentDraft, analyzeContextForAssetStructure: analyzeContextForAssetStructure} = require("../services/documentGeneratorAI");

console.log("+++ Loading server/routes/formalization.js router +++");

const UPLOAD_FOLDER = path.join(__dirname, "../uploads");

if (!fs.existsSync(UPLOAD_FOLDER)) {
  console.log(`Cartella uploads non trovata, la creo in: ${UPLOAD_FOLDER}`);
  fs.mkdirSync(UPLOAD_FOLDER, {
    recursive: true
  });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, UPLOAD_FOLDER);

    },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage
});

router.get("/", (async (req, res) => {
  console.log("!!!!!!!!!! TEST MODIFICA FILE formalization.js - GET / !!!!!!!!!");
  console.log(`Richiesta GET /api/formalization (non protetta per test)`);
  try {
    const documenti = await DocumentoFormalizzazione.find({}).select("-contenuto").sort({
      data_creazione: -1
    });
    res.json({
      message: "Documenti recuperati",
      data: documenti
    });
  } catch (err) {
    console.error("Errore GET /api/formalization:", err.message);
    res.status(500).json({
      message: "Errore server recupero documenti."
    });
  }
}));

router.post("/", upload.single("documentoFile"), (async (req, res) => {
  console.log(`Richiesta POST /api/formalization (non protetta per test)`);
  console.log("Body:", req.body);
  console.log("File:", req.file);

    const {titolo: titolo, tipo: tipo, descrizione: descrizione, intervento_id: intervento_id, versione: versione} = req.body;

    if (!titolo || !tipo) return res.status(400).json({
    message: "Titolo e Tipo sono obbligatori."
  });
  if (!req.file) return res.status(400).json({
    message: "Nessun file caricato."
  });
  try {
    const nuovoDocumento = new DocumentoFormalizzazione({
      titolo: titolo,
      tipo: tipo,

      descrizione: descrizione,

      intervento_id: mongoose.Types.ObjectId.isValid(intervento_id) ? intervento_id : null,
      stato: "bozza",
      versione: versione || "1.0",

      nomeFileOriginale: req.file.originalname,
      nomeFileSalvataggio: req.file.filename,

      pathFile: req.file.path,

      mimetypeFile: req.file.mimetype,
      sizeFile: req.file.size,

      data_aggiornamento: Date.now()
    });

        await nuovoDocumento.save();

        const docSalvato = nuovoDocumento.toObject();
    delete docSalvato.contenuto;

        res.status(201).json({
      message: "Documento caricato e metadati salvati.",
      data: docSalvato
    });
  } catch (err) {
    console.error("Errore POST /api/formalization:", err.message);

        if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr => {
        if (unlinkErr) console.error("Errore cancellazione file dopo fallimento DB:", unlinkErr);
      }));
    }
    if (err.name === "ValidationError") return res.status(400).json({
      message: "Errore validazione",
      errors: err.errors
    });
    res.status(500).json({
      message: "Errore server salvataggio documento."
    });
  }
}));

router.get("/:id/download", (async (req, res) => {
  console.log(`Richiesta DOWNLOAD /api/formalization/${req.params.id} (non protetta)`);
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({
    message: "ID Documento non valido."
  });
  try {
    const documento = await DocumentoFormalizzazione.findById(req.params.id).select("pathFile nomeFileOriginale mimetypeFile");

        if (!documento || !documento.pathFile) {
      return res.status(404).json({
        message: "Documento o file associato non trovato."
      });
    }

        if (!fs.existsSync(documento.pathFile)) {
      console.error(`File non trovato sul disco: ${documento.pathFile}`);
      return res.status(404).json({
        message: "File associato non trovato sul server."
      });
    }

        res.download(documento.pathFile, documento.nomeFileOriginale, (err => {
      if (err) {
        console.error("Errore durante l'invio del file:", err);

                if (!res.headersSent) {
          res.status(500).send("Errore durante il download del file.");
        }
      } else {
        console.log(`File ${documento.nomeFileOriginale} scaricato con successo.`);
      }
    }));
  } catch (err) {
    console.error(`Errore GET /api/formalization/${req.params.id}/download:`, err.message);
    res.status(500).json({
      message: "Errore server durante il recupero del documento per il download."
    });
  }
}));

router.delete("/:id", (async (req, res) => {
  console.log(`Richiesta DELETE /api/formalization/${req.params.id} (non protetta per test)`);
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({
    message: "ID Documento non valido."
  });
  try {
    const documento = await DocumentoFormalizzazione.findById(req.params.id).select("pathFile");

        if (!documento) return res.status(404).json({
      message: "Documento non trovato."
    });

        await DocumentoFormalizzazione.findByIdAndDelete(req.params.id);

        if (documento.pathFile && fs.existsSync(documento.pathFile)) {
      fs.unlink(documento.pathFile, (unlinkErr => {
        if (unlinkErr) {
          console.error(`Errore cancellazione file ${documento.pathFile}:`, unlinkErr);

                } else {
          console.log(`File ${documento.pathFile} eliminato con successo.`);
        }
      }));
    } else {
      console.warn(`File ${documento.pathFile} non trovato o path non definito, impossibile cancellare.`);
    }
    res.json({
      message: "Documento eliminato con successo"
    });
  } catch (err) {
    console.error(`Errore DELETE /api/formalization/${req.params.id}:`, err.message);
    res.status(500).json({
      message: "Errore server eliminazione documento."
    });
  }
}));

router.post("/generate-ai", (async (req, res) => {
  console.log("Richiesta POST /api/formalization/generate-ai con body:", req.body);

    const {interventoId: interventoId, tipoDocumento: tipoDocumento, parametriUtente: parametriUtente} = req.body;

    if (!interventoId || !tipoDocumento) {
    return res.status(400).json({
      message: "ID intervento e tipo documento sono obbligatori."
    });
  }
  if (!mongoose.Types.ObjectId.isValid(interventoId)) {
    return res.status(400).json({
      message: "ID intervento non valido."
    });
  }
  const tipiValidi = [ "procedura", "mansionario", "organigramma", "delega", "altro" ];

    if (!tipiValidi.includes(tipoDocumento.toLowerCase())) {
    return res.status(400).json({
      message: "Tipo documento non valido."
    });
  }
  try {

    const bozzaMarkdown = await generateDocumentDraft(interventoId, tipoDocumento, parametriUtente);

        res.json({
      message: `Bozza per ${tipoDocumento} generata con successo.`,
      data: {
        bozzaMarkdown: bozzaMarkdown
      }
    });
  } catch (error) {
    console.error(`Errore in POST /generate-ai per intervento ${interventoId}:`, error);

        res.status(500).json({
      message: error.message || "Errore del server durante la generazione della bozza AI."
    });
  }
}));

router.post("/from-ai", (async (req, res) => {
  console.log(">>> Richiesta POST /api/formalization/from-ai (salvataggio bozza AI)");
  console.log(">>> Body Ricevuto:", req.body);
  const {titolo: titolo, tipo: tipo, descrizione: descrizione, intervento_id: intervento_id, contenutoMarkdown: contenutoMarkdown} = req.body;

    if (!titolo || !tipo || !contenutoMarkdown) {
    return res.status(400).json({
      message: "Titolo, Tipo e Contenuto Markdown sono obbligatori per salvare la bozza AI."
    });
  }
  if (![ "organigramma", "mansionario", "procedura", "delega", "altro" ].includes(tipo)) {
    return res.status(400).json({
      message: "Tipo documento non valido."
    });
  }
  if (intervento_id && !mongoose.Types.ObjectId.isValid(intervento_id)) {
    return res.status(400).json({
      message: "ID intervento fornito non valido."
    });
  }
  try {
    const nuovoDocumento = new DocumentoFormalizzazione({
      titolo: titolo,
      tipo: tipo,
      descrizione: descrizione || "",

      stato: "bozza",
      versione: "1.0_AI",

      contenutoMarkdown: contenutoMarkdown,

      intervento_id: intervento_id && mongoose.Types.ObjectId.isValid(intervento_id) ? intervento_id : null,

      nomeFileOriginale: null,
      nomeFileSalvataggio: null,
      pathFile: null,
      mimetypeFile: null,
      sizeFile: null
    });
    await nuovoDocumento.save();
    console.log(">>> Bozza AI salvata con successo. ID:", nuovoDocumento._id);

        const docSalvato = nuovoDocumento.toObject();
    delete docSalvato.contenutoMarkdown;

        res.status(201).json({
      message: "Bozza documento AI salvata con successo.",
      data: docSalvato
    });
  } catch (err) {
    console.error("!!! Errore POST /api/formalization/from-ai:", err.message);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Errore validazione dati.",
        errors: err.errors
      });
    }
    res.status(500).json({
      message: "Errore del server durante il salvataggio della bozza."
    });
  }
}));

router.get("/:id", (async (req, res) => {
  const {id: id} = req.params;
  console.log(`>>> Richiesta GET /api/formalization/${id} (Dettaglio)`);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "ID Documento non valido."
    });
  }
  try {

    const documento = await DocumentoFormalizzazione.findById(id).populate("intervento_id", "titolo");

        if (!documento) {
      return res.status(404).json({
        message: "Documento di formalizzazione non trovato."
      });
    }
    console.log(`>>> Documento ${id} trovato.`);
    res.json({
      message: "Dettaglio documento recuperato con successo.",
      data: documento
    });
  } catch (err) {
    console.error(`!!! Errore GET /api/formalization/${id}:`, err.message);
    res.status(500).json({
      message: "Errore del server durante il recupero del dettaglio documento."
    });
  }
}));

router.post("/analyze-context-for-structure", (async (req, res) => {
  console.log("Richiesta POST /api/formalization/analyze-context-for-structure con body:", req.body);
  const {interventoId: interventoId, tipoDocumentoDaStrutturare: tipoDocumentoDaStrutturare, areaTematica: areaTematica, parametriUtente: parametriUtente} = req.body;

    if (!tipoDocumentoDaStrutturare && !areaTematica) {
    return res.status(400).json({
      message: "È necessario fornire 'tipoDocumentoDaStrutturare' o 'areaTematica'."
    });
  }
  if (interventoId && !mongoose.Types.ObjectId.isValid(interventoId)) {
    return res.status(400).json({
      message: "ID intervento non valido."
    });
  }
  try {

    const assetStructureAnalysis = await analyzeContextForAssetStructure(tipoDocumentoDaStrutturare, // Es. "procedura", "mansionario"
    areaTematica, // Es. "Sistema di deleghe", "Gestione non conformità" (alternativo a interventoId)
    interventoId, // ID intervento Mongoose (opzionale, se si parte da un intervento specifico)
    parametriUtente);
    res.json({
      message: `Analisi contesto e proposta struttura per ${tipoDocumentoDaStrutturare || areaTematica} completata.`,
      data: assetStructureAnalysis
    });
  } catch (error) {
    console.error(`Errore in POST /analyze-context-for-structure:`, error);
    res.status(500).json({
      message: error.message || "Errore del server durante l'analisi del contesto per la struttura dell'assetto."
    });
  }
}));

module.exports = router;
