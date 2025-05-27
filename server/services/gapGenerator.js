// START OF FILE server/services/gapGenerator.js (AGGIORNATO con Arricchimento AI)

const { Checklist, Gap } = require('../models/diagnosi');
const gapRules = require('../knowledge/gapRules'); // Importa le regole rule-based
const { enrichGapWithAI } = require('./gapEnricherAI'); // Importa la nuova funzione di arricchimento

/**
 * Analizza una checklist completata, genera i Gap rule-based e poi li arricchisce con AI.
 * @param {string} checklistId - L'ID della checklist da analizzare.
 * @returns {Promise<number>} - Il numero di gap generati/arricchiti.
 */
const generateGapsForChecklist = async (checklistId) => {
    console.log(`>>> Avvio generazione/arricchimento Gap per Checklist ID: ${checklistId}`);
    let gapsGeneratiCount = 0;
    let gapsArricchitiCount = 0;

    try {
        // 1. Recupera la checklist completa con le risposte e il profilo cliente
        const checklist = await Checklist.findById(checklistId);
        if (!checklist) {
            console.warn(`Checklist ${checklistId} non trovata. Generazione Gap saltata.`);
            return 0;
        }
        if (checklist.stato !== 'completata') {
            console.warn(`Checklist ${checklistId} non è completata. Generazione Gap saltata.`);
            console.log(`Checklist ${checklistId} non è completata (stato: ${checklist.stato}). Elimino eventuali Gap precedenti.`);
            await Gap.deleteMany({ checklist_id: checklistId });
            await Checklist.findByIdAndUpdate(checklistId, { numero_gap_rilevati: 0 });
            return 0;
        }

        const cliente = checklist.cliente;
        const checklistAnswers = checklist.answers;

        // 2. Rimuovi eventuali Gap precedenti
        console.log(`>>> Checklist ${checklistId} è completata. Elimino Gap preesistenti...`);
        const deleteResult = await Gap.deleteMany({ checklist_id: checklistId });
        console.log(`>>> Eliminati ${deleteResult.deletedCount} Gap preesistenti per checklist ${checklistId}.`);

        // 3. Genera Gap Rule-Based (come oggetti JS semplici, non ancora salvati)
        const gapsDaArricchire = []; // Conterrà oggetti JS pronti per insertMany
        for (const answer of checklistAnswers) {
            if (!answer || !answer.itemId) continue;
            const regoleApplicabili = gapRules.filter(rule => rule.itemId === answer.itemId);
            for (const regola of regoleApplicabili) {
                if (regola.triggerAnswers.includes(String(answer.risposta))) {
                    const gapDetails = regola.getGapDetails(answer, cliente);
                    if (gapDetails && gapDetails.descrizione && gapDetails.livello_rischio) {
                        gapsDaArricchire.push({
                            checklist_id: checklistId,
                            item_id: answer.itemId,
                            domandaText: answer.domandaText || 'N/D',
                            descrizione: gapDetails.descrizione,
                            livello_rischio: gapDetails.livello_rischio,
                            implicazioni: gapDetails.implicazioni || '',
                            risposta_data: answer.risposta,
                            note_utente: answer.note || '',
                            suggerimenti_ai: [],
                            data_rilevazione: new Date(),
                            riferimentiKb: [], // Inizializza vuoto
                            arricchitoConAI: false // Inizializza a false
                        });
                    }
                    break;
                }
            }
        }

    // SALVIAMO I GAP BASE PRIMA DI ARRICCHIRLI
    // Questo ci dà un _id per ogni gap da passare a enrichGapWithAI
    const savedGapsBase = [];
    if (gapsDaArricchire.length > 0) {
        try {
            // Usiamo insertMany per i gap base e recuperiamo i documenti salvati
            const insertedDocs = await Gap.insertMany(gapsDaArricchire.map(gapData => new Gap(gapData)));
            savedGapsBase.push(...insertedDocs);
            console.log(`>>> Salvati ${insertedDocs.length} Gap Rule-Based iniziali per checklist ${checklistId}.`);
            gapsGeneratiCount = insertedDocs.length;
        } catch (dbError) {
            console.error("Errore durante il salvataggio iniziale dei Gap rule-based:", dbError);
            // Potresti voler interrompere qui se il salvataggio base fallisce
            await Checklist.findByIdAndUpdate(checklistId, { $set: { numero_gap_rilevati: 0 }});
            return 0;
        }
    }


    // 5. Arricchimento AI (MODIFICATO)
    if (savedGapsBase.length > 0) {
        console.log(`>>> Avvio Arricchimento AI per ${savedGapsBase.length} gap...`);
        
        for (const gapDocument of savedGapsBase) { // Iteriamo sui documenti Mongoose salvati
            try {
                // Passa il documento Mongoose completo (con _id) e il contesto
                const enrichedData = await enrichGapWithAI(gapDocument, cliente, checklistAnswers);

                if (enrichedData) {
                    // Aggiorna il record Gap nel DB con i dati arricchiti
                    // Ora enrichedData contiene anche i riferimentiKb e il flag arricchitoConAI
                    await Gap.findByIdAndUpdate(gapDocument._id, { $set: enrichedData });
                    gapsArricchitiCount++;
                    console.log(`--- Gap ${gapDocument.item_id} arricchito con successo e aggiornato.`);
                } else {
                    console.warn(`--- Arricchimento AI per Gap ${gapDocument.item_id} non ha prodotto risultati validi (null).`);
                }
            } catch (enrichError) {
                console.error(`!!! Errore durante l'arricchimento AI per Gap ${gapDocument.item_id} (ID: ${gapDocument._id}):`, enrichError.message);
            }
            // Aggiungi un piccolo delay anche qui se fai molte chiamate sequenziali
            await new Promise(resolve => setTimeout(resolve, 100)); 
        }
        console.log(`>>> Arricchimento AI completato. Gap arricchiti: ${gapsArricchitiCount}/${savedGapsBase.length}`);
    } else {
         console.log(">>> Nessun gap rule-based generato, arricchimento AI saltato.");
    }

    // 6. Aggiorna il conteggio finale nella checklist (invariato)
    await Checklist.findByIdAndUpdate(checklistId, { $set: { numero_gap_rilevati: gapsGeneratiCount }});
    console.log(`>>> Conteggio Gap aggiornato su Checklist ${checklistId}: ${gapsGeneratiCount}`);

    return gapsGeneratiCount;

    } catch (error) {
        console.error(`!!! Errore GRAVE durante la generazione/arricchimento dei Gap per ${checklistId}:`, error);
        return -1; // Indica un errore
    }
};

module.exports = { generateGapsForChecklist };
