const express = require("express");

const router = express.Router();

const mongoose = require("mongoose");

const {Checklist: Checklist, Gap: Gap} = require("../models/diagnosi");

const {QuestionTemplate: QuestionTemplate} = require("../models/templates");

const {generateGapsForChecklist: generateGapsForChecklist} = require("../services/gapGenerator");

const {selectPertinentQuestionsAI: selectPertinentQuestionsAI} = require("../services/checklistQuestionSelectorAI");

router.get("/", (async (req, res) => {
  console.log(`>>> [${(new Date).toISOString()}] INIZIO GET /api/checklist (Elenco)`);
  try {
    console.log(">>> Tentativo Checklist.find({}) [Elenco]...");
    const checklists = await Checklist.find({}).select("nome descrizione stato data_creazione cliente.nome numero_gap_rilevati").sort({
      data_creazione: -1
    });
    console.log(`>>> Checklist.find() [Elenco] completato. Trovate: ${checklists ? checklists.length : "null"}`);
    if (!checklists) {
      console.log(">>> Find ha restituito null/undefined? Invio array vuoto.");
      return res.json({
        message: "Nessuna checklist trovata.",
        data: []
      });
    }
    console.log(">>> Invio risposta JSON [Elenco]...");
    res.json({
      message: "Elenco checklist recuperato con successo",
      data: checklists
    });
    console.log(">>> Risposta JSON [Elenco] inviata.");
  } catch (err) {
    console.error(`!!! ERRORE CATTURATO in GET /api/checklist (Elenco):`, err);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Errore del server nel recupero delle checklist."
      });
    }
  }
  console.log(`>>> [${(new Date).toISOString()}] FINE GET /api/checklist (Elenco)`);
}));

router.post("/", (async (req, res) => {
  console.log(`Richiesta POST /api/checklist (CON SELEZIONE E MOTIVAZIONE AI) con body:`, JSON.stringify(req.body, null, 2));
  const {nome: nome, descrizione: descrizione, cliente: cliente} = req.body;

    const CORE_QUESTION_ITEM_IDS = global.CORE_QUESTION_ITEM_IDS || [];
  if (!nome || !cliente || !cliente.nome) {
    return res.status(400).json({
      message: "Nome checklist e nome cliente sono obbligatori."
    });
  }
  if (!cliente.dimensioneStimata || !cliente.complessita) {
    console.warn("Profilo cliente incompleto: dimensioneStimata o complessita mancanti.");
  }

    try {

    const tutteDomandeTemplate = await QuestionTemplate.find({
      attiva: true
    }).select("_id itemId domanda area sottoArea rilevanza fonte tipoRisposta opzioniRisposta testoAiuto ordine tags dependsOn").sort({
      area: 1,
      ordine: 1
    }).lean();
    if (!tutteDomandeTemplate || tutteDomandeTemplate.length === 0) {
      return res.status(500).json({
        message: "Errore: Nessun template di domanda attivo trovato."
      });
    }

        const domandeSelezionateInfo = await selectPertinentQuestionsAI(cliente, tutteDomandeTemplate, 75);
    if (!domandeSelezionateInfo || domandeSelezionateInfo.length === 0) {
      console.warn("L'AI non ha selezionato domande o c'è stato un errore. La checklist potrebbe essere vuota o contenere solo domande fallback.");

        }
    const answersDaSalvare = [];

        const selectionDetailsMap = new Map;
    if (domandeSelezionateInfo) {

      domandeSelezionateInfo.forEach((info => {
        if (info && info.itemId) {

          selectionDetailsMap.set(info.itemId, {
            motivazione: info.motivazioneAI,
            isCore: info.isCore || false
          });
        }
      }));
    }
    tutteDomandeTemplate.forEach((qTemplate => {
      if (selectionDetailsMap.has(qTemplate.itemId)) {

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
          note: "",
          motivazioneSelezioneAI: selectionInfo.motivazione,

          isCoreQuestion: selectionInfo.isCore
        });
      }
    }));

        answersDaSalvare.sort(((a, b) => {
      const areaCompare = (a.area || "").localeCompare(b.area || "");
      if (areaCompare !== 0) return areaCompare;

            const aIsActuallyCore = CORE_QUESTION_ITEM_IDS.includes(a.itemId);

            const bIsActuallyCore = CORE_QUESTION_ITEM_IDS.includes(b.itemId);
      if (aIsActuallyCore && !bIsActuallyCore) return -1;
      if (!aIsActuallyCore && bIsActuallyCore) return 1;

            return (a.itemId || "").localeCompare(b.itemId || "");
    }));
    const nuovaChecklist = new Checklist({
      nome: nome,
      descrizione: descrizione,

      cliente: {
        ...cliente
      },

      answers: answersDaSalvare,

      stato: "bozza"
    });
    await nuovaChecklist.save();
    console.log(`Checklist "${nome}" creata con ${answersDaSalvare.length} domande (incluse core e selezionate da AI).`);
    res.status(201).json({
      message: "Checklist creata: domande core e domande aggiuntive selezionate/motivate da AI.",
      data: nuovaChecklist
    });
  } catch (err) {
    console.error("Errore in POST /api/checklist (con AI e core questions):", err);
    if (err.name === "ValidationError") {

      console.error("Dettagli errore di validazione:", err.errors);
      return res.status(400).json({
        message: "Errore di validazione dei dati della checklist.",
        errors: err.errors
      });
    }

        res.status(500).json({
      message: `Errore del server durante la creazione della checklist (selezione AI con motivazione): ${err.message}`
    });
  }
}));

router.get("/:id", (async (req, res) => {
  console.log(`>>> [${(new Date).toISOString()}] INIZIO GET /api/checklist/:id. req.params:`, req.params);

    const checklistId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(checklistId)) {
    console.log(`>>> ID non valido: ${checklistId}`);
    return res.status(400).json({
      message: "ID Checklist non valido."
    });
  }
  try {
    console.log(`>>> Tentativo Checklist.findById con ID: ${checklistId}`);
    const checklist = await Checklist.findById(checklistId);
    console.log(`>>> Checklist.findById risultato:`, checklist ? `Trovato (ID: ${checklist._id})` : "Non Trovato (null)");
    if (!checklist) {
      console.log(`>>> Checklist ${checklistId} non trovata nel DB, invio 404.`);
      return res.status(404).json({
        message: "Checklist non trovata."
      });
    }
    console.log(`>>> Checklist ${checklistId} trovata, invio risposta JSON...`);
    res.json({
      message: "Checklist recuperata con successo",
      data: checklist
    });
    console.log(`>>> Risposta JSON per ${checklistId} inviata.`);
  } catch (err) {
    console.error(`!!! ERRORE DETTAGLIO CHECKLIST ${checklistId}:`, err);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Errore del server nel recupero della checklist."
      });
    }
  }
  console.log(`>>> [${(new Date).toISOString()}] FINE GET /api/checklist/:id`);
}));

router.put("/:id", async (req, res) => {
    console.log(`Richiesta PUT /api/checklist/${req.params.id} con body:`, req.body);
    const checklistId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(checklistId)) {
        return res.status(400).json({ message: "ID Checklist non valido." });
    }

    const { nome, descrizione, cliente, stato } = req.body;
    const campiDaAggiornare = {};
    if (nome !== undefined) campiDaAggiornare.nome = nome;
    if (descrizione !== undefined) campiDaAggiornare.descrizione = descrizione;
    
    let triggerAsyncGapGeneration = false;

    try {
        const checklistPrecedente = await Checklist.findById(checklistId).select("stato gapGenerationStatus");

        if (stato !== undefined) {
            campiDaAggiornare.stato = stato;
            if (stato === "completata") {
                if (checklistPrecedente && checklistPrecedente.stato !== "completata") {
                    campiDaAggiornare.data_compilazione = Date.now();
                    campiDaAggiornare.gapGenerationStatus = 'PENDING'; // Imposta PENDING
                    campiDaAggiornare.gapGenerationProgress = 0;
                    campiDaAggiornare.gapGenerationMessage = "Analisi gap in attesa di avvio.";
                    campiDaAggiornare.lastGapGenerationAttempt = Date.now();
                    triggerAsyncGapGeneration = true;
                    console.log(`Checklist ${checklistId} marcata come completata. Trigger generazione Gap ASINCRONA.`);
                } else if (checklistPrecedente && checklistPrecedente.stato === "completata" && checklistPrecedente.gapGenerationStatus !== 'COMPLETED' && checklistPrecedente.gapGenerationStatus !== 'PROCESSING') {
                    campiDaAggiornare.gapGenerationStatus = 'PENDING';
                    campiDaAggiornare.gapGenerationProgress = 0;
                    campiDaAggiornare.gapGenerationMessage = "Nuovo tentativo di analisi gap in attesa.";
                    campiDaAggiornare.lastGapGenerationAttempt = Date.now();
                    triggerAsyncGapGeneration = true;
                    console.log(`Checklist ${checklistId} già completata, ma ritento generazione Gap ASINCRONA.`);
                } else {
                     console.log(`Checklist ${checklistId} era già completata e processata (o in processamento). Nessun trigger Gap.`);
                }
            } else if (stato && stato !== "completata") {
                campiDaAggiornare.data_compilazione = null;
                campiDaAggiornare.numero_gap_rilevati = 0;
                campiDaAggiornare.gapGenerationStatus = 'IDLE'; // Resetta lo stato della generazione gap
                campiDaAggiornare.gapGenerationProgress = 0;
                campiDaAggiornare.gapGenerationMessage = null;
                console.log(`Checklist ${checklistId} impostata a stato ${stato}. Azzero data completamento, conteggio gap e stato generazione.`);
                await Gap.deleteMany({ checklist_id: checklistId });
                console.log(`Gap associati a checklist ${checklistId} eliminati perché è stata riaperta.`);
            }
        }

        const checklistAggiornata = await Checklist.findByIdAndUpdate(
            checklistId,
            { $set: campiDaAggiornare },
            { new: true, runValidators: true }
        );

        if (!checklistAggiornata) {
            return res.status(404).json({ message: "Checklist non trovata." });
        }

        if (triggerAsyncGapGeneration) {
            generateGapsForChecklist(checklistAggiornata._id)
                .then(({ totalGapsToProcess, gapsSuccessfullyEnriched }) => {
                    console.log(`Processo ASINCRONO generazione Gap per ${checklistAggiornata._id} terminato (da then). Processati: ${totalGapsToProcess}, Arricchiti: ${gapsSuccessfullyEnriched}`);
                })
                .catch(err => {
                    console.error(`Errore nel processo ASINCRONO generazione Gap per ${checklistAggiornata._id} (da catch):`, err);
                    Checklist.findByIdAndUpdate(checklistAggiornata._id, {
                        $set: {
                            gapGenerationStatus: 'FAILED',
                            gapGenerationMessage: `Errore background: ${err.message}`,
                            gapGenerationProgress: 100
                        }
                    }).catch(updateErr => console.error("Errore nell'aggiornare lo stato FAILED della checklist:", updateErr));
                });
            
            res.json({
                message: "Checklist aggiornata. Analisi gap avviata in background.",
                data: checklistAggiornata,
                gapGenerationInitiated: true
            });
        } else {
            res.json({
                message: "Checklist aggiornata con successo.",
                data: checklistAggiornata,
                gapGenerationInitiated: false
            });
        }
    } catch (err) {
        console.error(`Errore in PUT /api/checklist/${checklistId}:`, err.message);
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: "Errore di validazione", errors: err.errors });
        }
        res.status(500).json({ message: "Errore del server durante l'aggiornamento della checklist." });
    }
});

// NUOVA ROUTE per lo stato della generazione gap
router.get("/:id/gap-generation-status", async (req, res) => {
    const checklistId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(checklistId)) {
        return res.status(400).json({ message: "ID Checklist non valido." });
    }
    try {
        const checklist = await Checklist.findById(checklistId)
            .select("gapGenerationStatus gapGenerationProgress gapGenerationMessage numero_gap_rilevati stato");
        if (!checklist) {
            return res.status(404).json({ message: "Checklist non trovata." });
        }
        res.json({
            message: "Stato generazione gap recuperato.",
            data: {
                status: checklist.gapGenerationStatus,
                progress: checklist.gapGenerationProgress,
                message: checklist.gapGenerationMessage,
                gapsFound: checklist.numero_gap_rilevati,
                checklistState: checklist.stato
            }
        });
    } catch (error) {
        console.error("Errore recupero stato generazione gap:", error);
        res.status(500).json({ message: "Errore server recupero stato." });
    }
});

router.put("/:id/answers/:itemId", (async (req, res) => {
  console.log(`Richiesta PUT /api/checklist/${req.params.id}/answers/${req.params.itemId} (non protetta per test) con body:`, req.body);
  const {risposta: risposta, note: note} = req.body;
  const checklistId = req.params.id;
  const itemId = req.params.itemId;
  if (!mongoose.Types.ObjectId.isValid(checklistId)) return res.status(400).json({
    message: "ID Checklist non valido."
  });
  if (!itemId) return res.status(400).json({
    message: "Item ID mancante."
  });
  try {

    const checklist = await Checklist.findById(checklistId).select("stato");
    let updateStato = {};
    if (checklist && checklist.stato === "bozza" && risposta !== null && risposta !== undefined && risposta !== "") {
      updateStato = {
        stato: "in_corso"
      };
      console.log(`Checklist ${checklistId} impostata automaticamente a 'in_corso'.`);
    }
    const result = await Checklist.updateOne({
      _id: checklistId,
      "answers.itemId": itemId
    }, {
      $set: {
        "answers.$.risposta": risposta,
        "answers.$.note": note ?? "",
        ...updateStato
      }
    });
    if (result.matchedCount === 0) return res.status(404).json({
      message: "Checklist o Item non trovato."
    });
    res.json({
      message: "Risposta checklist aggiornata con successo"
    });
  } catch (err) {
    console.error(`Errore in PUT /api/checklist/${checklistId}/answers/${itemId}:`, err.message);
    res.status(500).json({
      message: "Errore del server durante l'aggiornamento della risposta."
    });
  }
}));

router.delete("/:id", (async (req, res) => {
  console.log(`>>> Richiesta DELETE /api/checklist/:id ricevuta. req.params:`, req.params);

    const checklistId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(checklistId)) {
    console.log(`>>> ID non valido per delete: ${checklistId}`);
    return res.status(400).json({
      message: "ID Checklist non valido."
    });
  }
  try {
    console.log(`>>> Tentativo findById per delete: ${checklistId}`);
    const checklistExists = await Checklist.findById(checklistId).select("_id");
    if (!checklistExists) {
      console.log(`>>> Checklist ${checklistId} non trovata per delete, invio 404.`);
      return res.status(404).json({
        message: "Checklist non trovata."
      });
    }
    console.log(`>>> Checklist ${checklistId} trovata. Procedo con eliminazione Gap e Checklist.`);

        try {
      const deleteGapResult = await Gap.deleteMany({
        checklist_id: checklistId
      });
      console.log(`>>> Gap associati a checklist ${checklistId} eliminati: ${deleteGapResult.deletedCount}`);
    } catch (gapErr) {
      console.error(`!!! ERRORE ELIMINAZIONE GAP per checklist ${checklistId}:`, gapErr);

        }

        console.log(`>>> Tentativo findByIdAndDelete per checklist: ${checklistId}`);
    await Checklist.findByIdAndDelete(checklistId);
    console.log(`>>> Checklist ${checklistId} eliminata.`);
    res.json({
      message: "Checklist e gap associati eliminati con successo"
    });
  } catch (err) {
    console.error(`!!! ERRORE ELIMINAZIONE CHECKLIST ${checklistId}:`, err);

        if (!res.headersSent) {
      res.status(500).json({
        message: "Errore del server durante l'eliminazione."
      });
    }
  }
  console.log(`>>> [${(new Date).toISOString()}] FINE DELETE /api/checklist/:id`);
}));

module.exports = router;