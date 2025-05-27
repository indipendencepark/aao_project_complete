import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Grid, Button, CircularProgress, Alert,
    FormControl, RadioGroup, FormControlLabel, Radio, TextField,
    Accordion, AccordionSummary, AccordionDetails, Chip, Tooltip, IconButton, Divider,
    Select, MenuItem, InputLabel // Assicurati che siano importati
} from '@mui/material';
// Importa DatePicker e provider di localizzazione
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { it } from 'date-fns/locale'; // Importa locale italiano per date-fns

// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ErrorIcon from '@mui/icons-material/Error';
import AddIcon from '@mui/icons-material/Add'; // Usato nel bottone
import EditIcon from '@mui/icons-material/Edit'; // Per bottoni futuri
import DeleteIcon from '@mui/icons-material/Delete'; // Per bottoni futuri
import InfoIcon from '@mui/icons-material/Info'; // Nuova icona per la motivazione AI

// Funzione debounce per non salvare ad ogni keypress nelle note
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const CompilazioneChecklist = ({ checklistId, onBackToList }) => {
    const [checklist, setChecklist] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [savingStatus, setSavingStatus] = useState({});
    const [savingError, setSavingError] = useState(null);
    const [currentStato, setCurrentStato] = useState('bozza');

    // Funzione per caricare i dettagli della checklist
    const fetchChecklistDetails = useCallback(async () => {
        if (!checklistId) return;
        setLoading(true); setError(null); setSavingError(null); setChecklist(null); setAnswers({}); setSavingStatus({});
        try {
            console.log(`>>> Fetching checklist ${checklistId}`);
            const response = await axios.get(`http://localhost:5001/api/checklist/${checklistId}`);
            const fetchedData = response.data.data;
            console.log(">>> DETTAGLI CHECKLIST CARICATI (CompilazioneChecklist):", JSON.stringify(fetchedData, null, 2)); // LOG DETTAGLIATO

            if (!fetchedData) throw new Error("Checklist non trovata o dati non validi.");

            setChecklist(fetchedData);
            setCurrentStato(fetchedData?.stato || 'bozza');

            const initialAnswers = {};
            if (fetchedData?.answers && Array.isArray(fetchedData.answers)) {
                // --- VERIFICA QUI OGNI SINGOLO answerDoc ---
                fetchedData.answers.forEach(answerDoc => {
                    if(answerDoc && answerDoc.itemId){
                       initialAnswers[answerDoc.itemId] = { risposta: answerDoc.risposta, note: answerDoc.note ?? '' };
                       // LOG PER VERIFICARE LA PRESENZA DI dependsOn
                       console.log(`Item (frontend): ${answerDoc.itemId}, DependsOn:`, JSON.stringify(answerDoc.dependsOn)); 
                    } else { console.warn(">>> Trovato answerDoc non valido:", answerDoc); }
                });
                // -----------------------------------------
            } else { console.warn(">>> Checklist.answers non è un array o manca:", fetchedData?.answers); }
            setAnswers(initialAnswers);
            console.log(">>> Stato 'answers' inizializzato per la compilazione");

        } catch (err) {
            console.error("Errore caricamento dettagli checklist:", err);
            setError(err.response?.data?.message || 'Errore nel recupero dettagli checklist.');
        } finally { setLoading(false); }
    }, [checklistId]);

    // Carica i dettagli al montaggio o quando l'ID cambia
    useEffect(() => {
        fetchChecklistDetails();
    }, [fetchChecklistDetails]);

    // Funzione per salvare una singola risposta/nota
    const saveAnswer = useCallback(async (itemId, field, value) => {
        console.log(`Tentativo salvataggio per ${itemId}, campo ${field}, valore ${value}`);
        setSavingStatus(prev => ({ ...prev, [itemId]: 'saving' }));
        setSavingError(null);

        const currentAnswerData = answers[itemId] || { risposta: null, note: '' };
        const dataToSend = {
             risposta: field === 'risposta' ? value : currentAnswerData.risposta,
             note: field === 'note' ? value : currentAnswerData.note
         };

        try {
             await axios.put(`http://localhost:5001/api/checklist/${checklistId}/answers/${itemId}`, dataToSend);
             setSavingStatus(prev => ({ ...prev, [itemId]: 'saved' }));
             console.log(`Risposta per ${itemId} salvata.`);
             setTimeout(() => setSavingStatus(prev => ({ ...prev, [itemId]: undefined })), 2000);
         } catch (err) {
            console.error(`Errore salvataggio risposta per ${itemId}:`, err);
            setSavingStatus(prev => ({ ...prev, [itemId]: 'error' }));
            setSavingError(`Errore salvataggio per ${itemId}: ${err.response?.data?.message || err.message}`);
        }
    }, [checklistId, answers]);

     // Debounce per le note
     const debouncedSaveNote = useCallback(debounce((itemId, value) => {
         saveAnswer(itemId, 'note', value);
     }, 1000), [saveAnswer]);

    // Handler per cambio risposta
    const handleRispostaChange = (itemId, eventOrValue) => {
        let newValue;
        if (eventOrValue && eventOrValue.target) {
            newValue = eventOrValue.target.value;
        } else {
            newValue = eventOrValue;
        }

        console.log(`handleRispostaChange for ${itemId}, new value:`, newValue);
        console.log("Stato 'answers' PRIMA dell'aggiornamento:", JSON.stringify(answers)); // LOG PRIMA

        setAnswers(prev => {
            const newState = {
                ...prev,
                [itemId]: { ...(prev[itemId] || { risposta: null, note: '' }), risposta: newValue }
            };
            console.log("Stato 'answers' DOPO l'aggiornamento (dentro setAnswers):", JSON.stringify(newState)); // LOG DOPO
            return newState;
        });
        saveAnswer(itemId, 'risposta', newValue);
    };

    // Handler per cambio note
    const handleNoteChange = (itemId, event) => {
         const newValue = event.target.value;
         setAnswers(prev => ({
             ...prev,
             [itemId]: { ...(prev[itemId] || { risposta: null, note: '' }), note: newValue }
         }));
         debouncedSaveNote(itemId, newValue);
    };

    // Aggiorna stato checklist
    const updateChecklistStatus = async (newStatus) => {
         setLoading(true); setError(null); setSavingError(null);
         try {
            await axios.put(`http://localhost:5001/api/checklist/${checklistId}`, { stato: newStatus });
            setCurrentStato(newStatus);
            if (newStatus === 'completata') {
                console.log("Checklist completata, triggerare generazione GAP?");
                // TODO: Chiamare API generazione GAP? Mostrare messaggio?
            }
         } catch (err) {
             console.error(`Errore aggiornamento stato a ${newStatus}:`, err);
             setError(err.response?.data?.message || 'Errore aggiornamento stato checklist.');
         } finally { setLoading(false); }
    };

    // --- NUOVA LOGICA PER DETERMINARE LA VISIBILITÀ DELLE DOMANDE ---
    const isQuestionVisible = useCallback((questionDoc) => {
        // LOG INIZIALE
        console.log(`isQuestionVisible per ${questionDoc.itemId}? dependsOn:`, JSON.stringify(questionDoc.dependsOn));

        if (!questionDoc.dependsOn || questionDoc.dependsOn.length === 0) {
            console.log(` -> ${questionDoc.itemId} è visibile (no dependsOn).`);
            return true; // Visibile di default se non ha dipendenze
        }
        // Deve soddisfare TUTTE le condizioni
        const allConditionsMet = questionDoc.dependsOn.every(condition => {
            const sourceAnswerData = answers[condition.sourceItemId]; // answers è lo stato { itemId: {risposta, note} }
            const sourceAnswerValue = sourceAnswerData ? sourceAnswerData.risposta : null;
            
            // LOG CONDIZIONE
            console.log(`  Condizione per ${questionDoc.itemId}: source=${condition.sourceItemId}, expected=${condition.expectedAnswer}, actual=${sourceAnswerValue}`);
            
            const conditionMet = String(sourceAnswerValue).toLowerCase() === String(condition.expectedAnswer).toLowerCase(); // Confronto case-insensitive
            console.log(`  -> Condition Met: ${conditionMet}`);
            return conditionMet;
        });

        console.log(` -> Risultato finale visibilità per ${questionDoc.itemId}: ${allConditionsMet}`);
        return allConditionsMet;
    }, [answers]); // Dipende dallo stato corrente delle risposte

    // Raggruppa le domande per Area E FILTRA PER VISIBILITÀ
    const visibleQuestionsByArea = useMemo(() => {
        console.log(">>> Ricalcolo visibleQuestionsByArea... Stato 'answers':", JSON.stringify(answers)); // Logga lo stato 'answers'
        if (!checklist?.answers || !Array.isArray(checklist.answers)) {
            console.log("   -> checklist.answers non valido.");
            return {};
        }
        const groups = {};
        checklist.answers.forEach(answerDoc => { // answerDoc è l'oggetto domanda dalla checklist
            if (!answerDoc || !answerDoc.area || !answerDoc.itemId) {
                console.warn("Trovato answerDoc non valido in visibleQuestionsByArea:", answerDoc);
                return;
            }
            
            // LOG PRIMA DELLA CHIAMATA
            console.log(`   Verifico visibilità per ${answerDoc.itemId} (Area: ${answerDoc.area})`);
            const isVisible = isQuestionVisible(answerDoc); // Chiama la funzione debuggata
            // LOG DOPO LA CHIAMATA
            console.log(`   -> ${answerDoc.itemId} è visibile? ${isVisible}`);

            // Controlla la visibilità QUI
            if (isVisible) { // answerDoc contiene i campi del QuestionTemplate, incluso dependsOn
                const areaKey = answerDoc.area;
                if (!groups[areaKey]) {
                    groups[areaKey] = [];
                }
                groups[areaKey].push(answerDoc);
            }
        });
        // Ordina i gruppi
        Object.values(groups).forEach(group => {
            group.sort((a, b) => (a.ordine || 0) - (b.ordine || 0) || (a.itemId || "").localeCompare(b.itemId || ""));
        });
        console.log(">>> Gruppi visibili calcolati:", Object.keys(groups).map(k => `${k}: ${groups[k].length} domande`));
        return groups;
    }, [checklist, answers, isQuestionVisible]); // Ricalcola quando la checklist o la funzione di visibilità (che dipende da `answers`) cambiano.
    // ---------------------------------------------------------------

    // Calcola percentuale completamento
     const completionPercentage = useMemo(() => {
        if (!checklist?.answers) return 0;
        const totalPotentiallyVisibleQuestions = checklist.answers.length; // Tutte le domande caricate per questa checklist
        if (totalPotentiallyVisibleQuestions === 0) return 0;
        
        const answeredCount = checklist.answers.reduce((count, qDoc) => {
            // Considera risposta valida solo se la domanda è attualmente visibile E ha una risposta
            if (isQuestionVisible(qDoc) && answers[qDoc.itemId]?.risposta !== null && answers[qDoc.itemId]?.risposta !== undefined && answers[qDoc.itemId]?.risposta !== '') {
                return count + 1;
            }
            return count;
        }, 0);

        // Calcola la % rispetto alle domande *attualmente visibili*
        let currentlyVisibleCount = 0;
        Object.values(visibleQuestionsByArea).forEach(group => currentlyVisibleCount += group.length);
        
        if (currentlyVisibleCount === 0) return 0; // Evita divisione per zero se nessuna domanda è visibile
        return Math.round((answeredCount / currentlyVisibleCount) * 100);

    }, [checklist, answers, isQuestionVisible, visibleQuestionsByArea]);

    // Gestione Stati UI Iniziali
    if (loading && !checklist) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    if (error && !checklist) return ( <Box><Alert severity="error">Errore caricamento: {error}</Alert><Button variant="outlined" onClick={onBackToList} sx={{ mt: 2 }}>Torna Indietro</Button></Box> );
    if (!checklist) return ( <Box><Alert severity="warning">Checklist non trovata.</Alert><Button variant="outlined" onClick={onBackToList} sx={{ mt: 2 }}>Torna Indietro</Button></Box> );

    // --- Rendering Effettivo ---
    return (
         <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                 <Typography variant="h5" gutterBottom>Compilazione: {checklist.nome}</Typography>
                 <Button variant="outlined" onClick={onBackToList}>Torna alla Lista</Button>
            </Box>
             <Paper sx={{ p: 2, mb: 3 }}>
                 <Typography variant="body2" component="div">
                     Cliente: {checklist?.cliente?.nome} | Stato: <Chip label={currentStato} size="small" color={currentStato === 'completata' ? 'success' : (currentStato === 'in_corso' ? 'primary' : 'default')}/> | Compilazione Visibile: {completionPercentage}%
                 </Typography>
                 {savingError && <Alert severity="error" sx={{ mt: 2 }}>{savingError}</Alert>}
                 {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
             </Paper>

            {/* Log prima del map degli Accordion */}
            {console.log(">>> Rendering Accordions... Esistono visibleQuestionsByArea?", !!visibleQuestionsByArea)}
            {visibleQuestionsByArea && console.log(">>> Chiavi Aree:", Object.keys(visibleQuestionsByArea))}

            {/* Ciclo Accordion basato su visibleQuestionsByArea */}
            {Object.keys(visibleQuestionsByArea).length > 0 ? Object.keys(visibleQuestionsByArea).sort().map((area) => {
                const domandeVisibiliDelGruppo = visibleQuestionsByArea[area];
                if (!domandeVisibiliDelGruppo || domandeVisibiliDelGruppo.length === 0) {
                    // Questo non dovrebbe succedere se visibleQuestionsByArea è costruito correttamente
                    return null; 
                }
                console.log(`>>> Rendering Area: ${area}, Numero Domande Visibili: ${domandeVisibiliDelGruppo.length}`);
                return (
                    <Accordion key={area} defaultExpanded={true /* o altra logica */} >
                         <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: '#f5f5f5' }}>
                             <Typography sx={{ fontWeight: 'bold' }}>Area: {area} ({domandeVisibiliDelGruppo.length} visibili)</Typography>
                         </AccordionSummary>
                         <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {domandeVisibiliDelGruppo.map((answerDoc) => { // answerDoc è l'oggetto con i dati della domanda
                                const itemId = answerDoc.itemId;
                                if (!itemId) return null; // Difesa aggiuntiva

                                const domandaText = answerDoc.domandaText;
                                const testoAiuto = answerDoc.testoAiuto;
                                const tipoRisposta = answerDoc.tipoRisposta;
                                const opzioniRisposta = answerDoc.opzioniRisposta;
                                const motivazioneAI = answerDoc.motivazioneSelezioneAI;
                                const isCore = answerDoc.isCoreQuestion;

                                if (!domandaText) return null;

                                const currentLocalAnswer = answers[itemId] || { risposta: null, note: '' };
                                const saveState = savingStatus[itemId];

                                return (
                                    <Paper key={itemId} variant="outlined" sx={{ p: 2, borderLeft: isCore ? '3px solid orange' : undefined }}>
                                        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                            {isCore && (
                                                <Tooltip title={motivazioneAI || "Domanda Fondamentale"} arrow>
                                                    <Chip label="CORE" size="small" color="warning" sx={{ mr: 1, fontSize: '0.7rem', height: '18px' }} />
                                                </Tooltip>
                                            )}
                                            <strong>{itemId}:</strong> {domandaText}
                                            {testoAiuto && (
                                                <Tooltip title={testoAiuto} arrow>
                                                    <IconButton size="small" sx={{ ml: 0.5 }}><HelpOutlineIcon sx={{ fontSize: '1rem' }} color="action"/></IconButton>
                                                </Tooltip>
                                             )}
                                            {!isCore && motivazioneAI && (
                                                <Tooltip title={`Motivazione AI: ${motivazioneAI}`} arrow>
                                                    <IconButton size="small" sx={{ ml: 0.5 }}>
                                                        <InfoIcon sx={{ fontSize: '1rem' }} color="secondary"/>
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Typography>
                                          {answerDoc.fonte && (
                                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                                  Rif.: {answerDoc.fonte}
                                              </Typography>
                                          )}
                                        <Grid container spacing={2} alignItems="center">
                                          {/* Colonna Risposta - Rendering Condizionale */}
                                          <Grid item xs={12} md={5}>
                                              <FormControl component="fieldset" size="small" fullWidth>
                                                  {(tipoRisposta === 'SiNoParz' || tipoRisposta === 'SiNo') && (
                                                      <RadioGroup row name={`risposta-${itemId}`} value={currentLocalAnswer.risposta ?? ''} onChange={(e) => handleRispostaChange(itemId, e)} >
                                                          <FormControlLabel value="Si" control={<Radio size="small"/>} label="Sì" />
                                                          <FormControlLabel value="No" control={<Radio size="small"/>} label="No" />
                                                          {tipoRisposta === 'SiNoParz' && <FormControlLabel value="Parziale" control={<Radio size="small"/>} label="Parz." />}
                                                          <FormControlLabel value="NA" control={<Radio size="small"/>} label="N/A" />
                                                      </RadioGroup>
                                                  )}
                                                  {(tipoRisposta === 'Testo' || tipoRisposta === 'Numero' || tipoRisposta === 'TestoLungo') && (
                                                      <TextField
                                                          fullWidth variant="outlined" size="small" label="Risposta"
                                                          name={`risposta-${itemId}`}
                                                          type={tipoRisposta === 'Numero' ? 'number' : 'text'}
                                                          multiline={tipoRisposta === 'TestoLungo'}
                                                          rows={tipoRisposta === 'TestoLungo' ? 2 : 1}
                                                          value={currentLocalAnswer.risposta ?? ''}
                                                          onChange={(e) => handleRispostaChange(itemId, e)}
                                                      />
                                                  )}
                                                  {tipoRisposta === 'Data' && (
                                                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                                                          <DatePicker
                                                              label="Data Risposta"
                                                              value={currentLocalAnswer.risposta ? new Date(currentLocalAnswer.risposta) : null}
                                                              onChange={(newValue) => handleRispostaChange(itemId, newValue?.toISOString() ?? null )}
                                                              slots={{ textField: (params) => <TextField {...params} size="small" fullWidth /> }}
                                                          />
                                                      </LocalizationProvider>
                                                  )}
                                                  {tipoRisposta === 'SceltaMultipla' && opzioniRisposta && opzioniRisposta.length > 0 && (
                                                      <FormControl fullWidth size="small">
                                                          <InputLabel id={`select-label-${itemId}`}>Seleziona</InputLabel>
                                                          <Select
                                                              labelId={`select-label-${itemId}`}
                                                              name={`risposta-${itemId}`}
                                                              value={currentLocalAnswer.risposta ?? ''}
                                                              onChange={(e) => handleRispostaChange(itemId, e)}
                                                              label="Seleziona"
                                                          >
                                                              <MenuItem value="" disabled><em>Seleziona...</em></MenuItem>
                                                              {opzioniRisposta.map(opt => (
                                                                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                              ))}
                                                          </Select>
                                                      </FormControl>
                                                  )}
                                                  {!['SiNoParz', 'SiNo', 'Testo', 'Numero', 'TestoLungo', 'Data', 'SceltaMultipla'].includes(tipoRisposta) && (
                                                       <Typography variant="caption" color="error">Tipo risposta non riconosciuto: '{tipoRisposta}'</Typography>
                                                   )}
                                              </FormControl>
                                          </Grid>
                                          {/* Colonna Note */}
                                          <Grid item xs={12} md={6}>
                                              <TextField fullWidth label="Note / Dettagli" variant="outlined" size="small" multiline rows={1} name={`note-${itemId}`} value={currentLocalAnswer.note} onChange={(e) => handleNoteChange(itemId, e)} />
                                          </Grid>
                                          {/* Colonna Stato Salvataggio */}
                                          <Grid item xs={12} md={1} sx={{ textAlign: 'center', minHeight: '40px' }}>
                                              {saveState === 'saving' && <CircularProgress size={20} />}
                                              {saveState === 'saved' && <CheckCircleIcon color="success" />}
                                              {saveState === 'error' && <Tooltip title={savingError || 'Errore'}><ErrorIcon color="error" /></Tooltip>}
                                          </Grid>
                                        </Grid>
                                    </Paper>
                                );
                            })}
                        </AccordionDetails>
                    </Accordion>
                );
            }) : (
                 <Alert severity="info">Nessuna domanda attualmente visibile per questa checklist o tutte le aree sono vuote.</Alert>
            )}


            {/* Bottone per marcare come completata */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                 {currentStato !== 'completata' && (
                     <Button variant="contained" color="success" disabled={loading || Object.values(savingStatus).includes('saving')} onClick={() => updateChecklistStatus('completata')} >
                         {loading ? <CircularProgress size={24}/> : 'Marca come Completata'}
                     </Button>
                 )}
                  {currentStato === 'completata' && (
                      <Button variant="outlined" onClick={() => updateChecklistStatus('in_corso')} disabled={loading}> Riapri Checklist </Button>
                  )}
             </Box>

        </Box>
    );
};

export default CompilazioneChecklist;