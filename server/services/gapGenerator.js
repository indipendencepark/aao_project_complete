
const {Checklist: Checklist, Gap: Gap} = require("../models/diagnosi");

const gapRules = require("../knowledge/gapRules");

const {enrichGapWithAI: enrichGapWithAI} = require("./gapEnricherAI");

 const generateGapsForChecklist = async checklistId => {
  console.log(`>>> Avvio generazione/arricchimento Gap per Checklist ID: ${checklistId}`);
  let gapsGeneratiCount = 0;
  let gapsArricchitiCount = 0;
  try {

    const checklist = await Checklist.findById(checklistId);
    if (!checklist) {
      console.warn(`Checklist ${checklistId} non trovata. Generazione Gap saltata.`);
      return 0;
    }
    if (checklist.stato !== "completata") {
      console.warn(`Checklist ${checklistId} non è completata. Generazione Gap saltata.`);
      console.log(`Checklist ${checklistId} non è completata (stato: ${checklist.stato}). Elimino eventuali Gap precedenti.`);
      await Gap.deleteMany({
        checklist_id: checklistId
      });
      await Checklist.findByIdAndUpdate(checklistId, {
        numero_gap_rilevati: 0
      });
      return 0;
    }
    const cliente = checklist.cliente;
    const checklistAnswers = checklist.answers;

        console.log(`>>> Checklist ${checklistId} è completata. Elimino Gap preesistenti...`);
    const deleteResult = await Gap.deleteMany({
      checklist_id: checklistId
    });
    console.log(`>>> Eliminati ${deleteResult.deletedCount} Gap preesistenti per checklist ${checklistId}.`);

        const gapsDaArricchire = [];

        for (const answer of checklistAnswers) {
      if (!answer || !answer.itemId) continue;
      const regoleApplicabili = gapRules.filter((rule => rule.itemId === answer.itemId));
      for (const regola of regoleApplicabili) {
        if (regola.triggerAnswers.includes(String(answer.risposta))) {
          const gapDetails = regola.getGapDetails(answer, cliente);
          if (gapDetails && gapDetails.descrizione && gapDetails.livello_rischio) {
            gapsDaArricchire.push({
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

        const savedGapsBase = [];
    if (gapsDaArricchire.length > 0) {
      try {

        const insertedDocs = await Gap.insertMany(gapsDaArricchire.map((gapData => new Gap(gapData))));
        savedGapsBase.push(...insertedDocs);
        console.log(`>>> Salvati ${insertedDocs.length} Gap Rule-Based iniziali per checklist ${checklistId}.`);
        gapsGeneratiCount = insertedDocs.length;
      } catch (dbError) {
        console.error("Errore durante il salvataggio iniziale dei Gap rule-based:", dbError);

                await Checklist.findByIdAndUpdate(checklistId, {
          $set: {
            numero_gap_rilevati: 0
          }
        });
        return 0;
      }
    }

        if (savedGapsBase.length > 0) {
      console.log(`>>> Avvio Arricchimento AI per ${savedGapsBase.length} gap...`);
      for (const gapDocument of savedGapsBase) {

        try {

          const enrichedData = await enrichGapWithAI(gapDocument, cliente, checklistAnswers);
          if (enrichedData) {

            await Gap.findByIdAndUpdate(gapDocument._id, {
              $set: enrichedData
            });
            gapsArricchitiCount++;
            console.log(`--- Gap ${gapDocument.item_id} arricchito con successo e aggiornato.`);
          } else {
            console.warn(`--- Arricchimento AI per Gap ${gapDocument.item_id} non ha prodotto risultati validi (null).`);
          }
        } catch (enrichError) {
          console.error(`!!! Errore durante l'arricchimento AI per Gap ${gapDocument.item_id} (ID: ${gapDocument._id}):`, enrichError.message);
        }

                await new Promise((resolve => setTimeout(resolve, 100)));
      }
      console.log(`>>> Arricchimento AI completato. Gap arricchiti: ${gapsArricchitiCount}/${savedGapsBase.length}`);
    } else {
      console.log(">>> Nessun gap rule-based generato, arricchimento AI saltato.");
    }

        await Checklist.findByIdAndUpdate(checklistId, {
      $set: {
        numero_gap_rilevati: gapsGeneratiCount
      }
    });
    console.log(`>>> Conteggio Gap aggiornato su Checklist ${checklistId}: ${gapsGeneratiCount}`);
    return gapsGeneratiCount;
  } catch (error) {
    console.error(`!!! Errore GRAVE durante la generazione/arricchimento dei Gap per ${checklistId}:`, error);
    return -1;

    }
};

module.exports = {
  generateGapsForChecklist: generateGapsForChecklist
};