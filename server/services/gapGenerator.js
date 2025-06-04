const {Checklist: Checklist, Gap: Gap} = require("../models/diagnosi");

const gapRules = require("../knowledge/gapRules");

const {enrichGapWithAI: enrichGapWithAI} = require("./gapEnricherAI");

const generateGapsForChecklist = async checklistId => {
  console.log(`>>> Avvio generazione/arricchimento Gap ASINCRONO per Checklist ID: ${checklistId}`);
  let gapsRuleBasedCount = 0;
  let gapsSuccessfullyEnrichedCount = 0;
  let finalStatus = 'COMPLETED';
  let finalMessage = 'Analisi gap completata con successo.';

  try {
    await Checklist.findByIdAndUpdate(checklistId, {
      $set: { gapGenerationStatus: 'PROCESSING', gapGenerationProgress: 5, gapGenerationMessage: 'Caricamento dati checklist...' }
    });

    const checklist = await Checklist.findById(checklistId);
    if (!checklist) {
      console.warn(`Checklist ${checklistId} non trovata. Processo interrotto.`);
      throw new Error("Checklist non trovata durante la generazione gap.");
    }

    const cliente = checklist.cliente;
    const checklistAnswers = checklist.answers;

    await Checklist.findByIdAndUpdate(checklistId, {
      $set: { gapGenerationProgress: 10, gapGenerationMessage: 'Eliminazione gap precedenti...' }
    });
    const deleteResult = await Gap.deleteMany({
      checklist_id: checklistId
    });
    console.log(`>>> Eliminati ${deleteResult.deletedCount} Gap preesistenti per checklist ${checklistId}.`);

    const gapsDaCreareEDArricchire = [];

    for (const answer of checklistAnswers) {
      if (!answer || !answer.itemId) continue;
      const regoleApplicabili = gapRules.filter((rule => rule.itemId === answer.itemId));
      for (const regola of regoleApplicabili) {
        if (regola.triggerAnswers.includes(String(answer.risposta))) {
          const gapDetails = regola.getGapDetails(answer, cliente);
          if (gapDetails && gapDetails.descrizione && gapDetails.livello_rischio) {
            gapsDaCreareEDArricchire.push({
              checklist_id: checklistId,
              item_id: answer.itemId,
              domandaText: answer.domandaText || "N/D",
              descrizione: gapDetails.descrizione,
              livello_rischio: gapDetails.livello_rischio,
              implicazioni: gapDetails.implicazioni || "",
              risposta_data: answer.risposta,
              note_utente: answer.note || "",
              suggerimenti_ai: [],
              data_rilevazione: new Date,
              riferimentiKb: [],

              arricchitoConAI: false
            });
          }
          break;
        }
      }
    }

    gapsRuleBasedCount = gapsDaCreareEDArricchire.length;
    await Checklist.findByIdAndUpdate(checklistId, {
      $set: { 
        numero_gap_rilevati: gapsRuleBasedCount,
        gapGenerationProgress: 20, 
        gapGenerationMessage: `${gapsRuleBasedCount} potenziali gap identificati. Inizio salvataggio base...` 
      }
    });

    const savedGapsBase = [];
    if (gapsDaCreareEDArricchire.length > 0) {
      try {
        const insertedDocs = await Gap.insertMany(gapsDaCreareEDArricchire.map((gapData => new Gap(gapData))));
        savedGapsBase.push(...insertedDocs);
        console.log(`>>> Salvati ${insertedDocs.length} Gap Rule-Based iniziali per checklist ${checklistId}.`);
        await Checklist.findByIdAndUpdate(checklistId, {
          $set: { gapGenerationProgress: 30, gapGenerationMessage: 'Gap base salvati. Inizio arricchimento AI...' }
        });
      } catch (dbError) {
        console.error("Errore durante il salvataggio iniziale dei Gap rule-based:", dbError);
        throw new Error(`Salvataggio DB fallito: ${dbError.message}`);
      }
    } else {
      console.log(">>> Nessun gap rule-based da creare.");
      await Checklist.findByIdAndUpdate(checklistId, {
        $set: { gapGenerationProgress: 100, gapGenerationStatus: 'COMPLETED', gapGenerationMessage: 'Nessun gap rilevato dalle regole.' }
      });
      return { totalGapsToProcess: 0, gapsSuccessfullyEnriched: 0 };
    }

    if (savedGapsBase.length > 0) {
      console.log(`>>> Avvio Arricchimento AI per ${savedGapsBase.length} gap...`);
      const totalToEnrich = savedGapsBase.length;
      let enrichedSoFar = 0;

      for (const gapDocument of savedGapsBase) {
        enrichedSoFar++;
        const currentProgress = 30 + Math.round((enrichedSoFar / totalToEnrich) * 65);
        await Checklist.findByIdAndUpdate(checklistId, {
          $set: { 
            gapGenerationProgress: currentProgress, 
            gapGenerationMessage: `Arricchimento AI del gap ${enrichedSoFar}/${totalToEnrich} (ID: ${gapDocument.item_id})...`
          }
        });

        try {
          const enrichedData = await enrichGapWithAI(gapDocument, cliente, checklistAnswers);
          if (enrichedData && enrichedData.arricchitoConAI) {
            await Gap.findByIdAndUpdate(gapDocument._id, {
              $set: enrichedData
            });
            gapsSuccessfullyEnrichedCount++;
            console.log(`--- Gap ${gapDocument.item_id} arricchito con successo e aggiornato.`);
          } else {
            console.warn(`--- Arricchimento AI per Gap ${gapDocument.item_id} NON completato o fallito. Dati base conservati.`);
            await Gap.findByIdAndUpdate(gapDocument._id, { $set: { arricchitoConAI: false } });
          }
        } catch (enrichError) {
          console.error(`!!! ERRORE CRITICO durante l'arricchimento AI per Gap ${gapDocument.item_id} (ID: ${gapDocument._id}):`, enrichError.message);
        }
        if (totalToEnrich > 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      finalMessage = `Arricchimento AI completato. Gap arricchiti: ${gapsSuccessfullyEnrichedCount}/${totalToEnrich}. Gap totali identificati: ${gapsRuleBasedCount}.`;
      console.log(`>>> ${finalMessage}`);
    } else {
      finalMessage = "Nessun gap identificato dalle regole, arricchimento AI saltato.";
      console.log(">>> Nessun gap rule-based generato, arricchimento AI saltato.");
    }
    
    await Checklist.findByIdAndUpdate(checklistId, {
      $set: {
        gapGenerationStatus: finalStatus,
        gapGenerationProgress: 100,
        gapGenerationMessage: finalMessage,
        numero_gap_rilevati: gapsRuleBasedCount
      }
    });
    return { totalGapsToProcess: gapsRuleBasedCount, gapsSuccessfullyEnriched: gapsSuccessfullyEnrichedCount };

  } catch (error) {
    console.error(`!!! Errore GRAVE durante la generazione/arricchimento dei Gap per ${checklistId}:`, error);
    finalStatus = 'FAILED';
    finalMessage = `Errore grave: ${error.message}`;
    try {
      await Checklist.findByIdAndUpdate(checklistId, {
        $set: {
          gapGenerationStatus: finalStatus,
          gapGenerationMessage: finalMessage,
          gapGenerationProgress: 100
        }
      });
    } catch (updateErr) {
      console.error("Errore nell'aggiornare lo stato FAILED della checklist dopo errore grave:", updateErr);
    }
    throw error; 
  }
};

module.exports = {
  generateGapsForChecklist: generateGapsForChecklist
};