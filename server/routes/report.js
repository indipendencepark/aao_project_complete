const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { generateReportContent } = require("../services/reportGenerator");
const { ReportDiagnostico, Checklist } = require("../models/diagnosi"); // Importa ReportDiagnostico

// GET /api/report?checklist_id=<ID_CHECKLIST>
// Recupera un report esistente o lo genera/aggiorna se non esiste o se richiesto.
router.get("/", async (req, res) => {
    const checklistId = req.query.checklist_id;
    const forceGenerate = req.query.force_generate === 'true'; // Parametro per forzare la rigenerazione

    console.log(`Richiesta GET /api/report per Checklist ID: ${checklistId}, Force Generate: ${forceGenerate}`);

    if (!checklistId || !mongoose.Types.ObjectId.isValid(checklistId)) {
        return res.status(400).json({ message: "ID Checklist non valido o mancante." });
    }

    try {
        const checklist = await Checklist.findById(checklistId).lean();
        if (!checklist) {
            return res.status(404).json({ message: "Checklist non trovata." });
        }
        if (checklist.stato !== 'completata' && !forceGenerate) { // Non si può generare report se non completata (a meno che non si forzi per preview)
            return res.status(400).json({ message: "La checklist non è ancora stata completata. Completa la checklist per generare il report."});
        }

        let reportDoc = await ReportDiagnostico.findOne({ checklist_id: checklistId });

        if (forceGenerate || !reportDoc) {
            console.log(forceGenerate ? `>>> RIGENERAZIONE FORZATA del report per ${checklistId}...` : `>>> Report non trovato per ${checklistId}, lo GENERO...`);
            
            const reportDataCompleto = await generateReportContent(checklistId); // Questa genera tutti i dati freschi
            
            // Prepara i dati per il salvataggio/aggiornamento nel DB, mappandoli allo schema ReportDiagnosticoSchema
            const dataToSaveInDb = {
                checklist_id: checklistId,
                titolo: reportDataCompleto.checklistInfo.nome ? `${reportDataCompleto.checklistInfo.nome} - Report Diagnostico` : `Report Diagnostico per Checklist ${checklistId}`,
                clienteInfo: reportDataCompleto.clienteInfo, // Assumendo che generateReportContent lo popoli bene
                checklistInfo: reportDataCompleto.checklistInfo,
                sintesi_esecutiva: reportDataCompleto.sintesi_esecutiva, // Il nome nello schema
                executiveSummaryBase: reportDataCompleto.executiveSummaryBase,
                analisiArea: reportDataCompleto.analisiArea,
                statisticheGap: reportDataCompleto.statisticheGap,
                elencoGapCompleto: (reportDataCompleto.elencoGapCompleto || []).map(g => ({ // Snapshot dei campi chiave dei gap
                    _id: g._id, // ID del gap originale
                    item_id: g.item_id,
                    domandaText: g.domandaText,
                    descrizione: g.descrizione,
                    livello_rischio: g.livello_rischio,
                    implicazioni: g.implicazioni,
                    suggerimenti_ai: g.suggerimenti_ai,
                    riferimentiNormativiSpecificiAI: g.riferimentiNormativiSpecificiAI,
                    impattoStimatoAI: g.impattoStimatoAI,
                    prioritaRisoluzioneAI: g.prioritaRisoluzioneAI,
                })),
                analisiConformita: reportDataCompleto.analisiConformita,
                valutazioneQualitativaAAO: reportDataCompleto.valutazioneQualitativaAAO,
                suggerimentiPianoAzioneIniziale: reportDataCompleto.suggerimentiPianoAzioneIniziale,
                data_generazione: new Date(), // Data attuale di generazione/aggiornamento
                versioneReport: reportDoc ? (reportDoc.versioneReport || 0) + 1 : 1 // Incrementa versione se esiste
                // generato_da_id: req.user?.id // Se hai l'autenticazione
            };

            reportDoc = await ReportDiagnostico.findOneAndUpdate(
                { checklist_id: checklistId },
                dataToSaveInDb,
                { new: true, upsert: true, runValidators: true }
            );
            console.log(`>>> Report Diagnostico ${forceGenerate ? 'RIGENERATO' : 'GENERATO'} e salvato/aggiornato nel DB con ID: ${reportDoc._id}, Versione: ${reportDoc.versioneReport}`);
        } else {
            console.log(`>>> Report per ${checklistId} trovato nel DB (ID: ${reportDoc._id}, Versione: ${reportDoc.versioneReport}). Uso dati esistenti.`);
        }
        
        res.json({
            message: `Dati report recuperati${forceGenerate ? ' (rigenerati)' : ''} per checklist ${checklistId}`,
            data: reportDoc.toObject() // Invia il documento Mongoose come oggetto JS semplice
        });

    } catch (err) {
        console.error(`!!! Errore in GET /api/report per checklist ${checklistId}:`, err.message, err.stack);
        if (err.message === 'Checklist non trovata.') {
            return res.status(404).json({ message: err.message });
        }
        res.status(500).json({ message: "Errore del server durante il recupero/generazione dei dati del report." });
    }
});

module.exports = router;
