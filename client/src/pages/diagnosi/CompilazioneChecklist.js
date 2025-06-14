import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Grid, Button, CircularProgress, Alert,
    FormControl, RadioGroup, FormControlLabel, Radio, TextField,
    Accordion, AccordionSummary, AccordionDetails, Chip, Tooltip, IconButton, Divider,
    Select, MenuItem, InputLabel,
    LinearProgress,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { it } from 'date-fns/locale';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ErrorIcon from '@mui/icons-material/Error';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const context = this;
        const later = () => {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const CompilazioneChecklist = ({ checklistId, onBackToList }) => {
    const [checklist, setChecklist] = useState(null);
    const [answers, setAnswers] = useState({});
    const answersRef = useRef(answers);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [savingStatus, setSavingStatus] = useState({});
    const [savingError, setSavingError] = useState(null);
    const [currentStato, setCurrentStato] = useState('bozza');
    const [isCompleting, setIsCompleting] = useState(false);
    
    const [gapGenerationJob, setGapGenerationJob] = useState({
        isActive: false,
        progress: 0,
        status: null,
        message: null,
        gapsFound: 0,
    });
    const pollingIntervalRef = useRef(null);

    const fetchChecklistDetails = useCallback(async () => {
        if (!checklistId) return;
        setLoading(true); setError(null); setSavingError(null); setChecklist(null); setAnswers({}); setSavingStatus({});
        try {
            console.log(`>>> Fetching checklist ${checklistId}`);
            const response = await axios.get(`http://localhost:5001/api/checklist/${checklistId}`);
            const fetchedData = response.data.data;
            console.log(">>> DETTAGLI CHECKLIST CARICATI (CompilazioneChecklist):", JSON.stringify(fetchedData, null, 2));

            if (!fetchedData) throw new Error("Checklist non trovata o dati non validi.");

            setChecklist(fetchedData);
            setCurrentStato(fetchedData?.stato || 'bozza');

            const initialAnswers = {};
            if (fetchedData?.answers && Array.isArray(fetchedData.answers)) {
                fetchedData.answers.forEach(answerDoc => {
                    if(answerDoc && answerDoc.itemId){
                       initialAnswers[answerDoc.itemId] = { risposta: answerDoc.risposta, note: answerDoc.note ?? '' };
                       console.log(`Item (frontend): ${answerDoc.itemId}, DependsOn:`, JSON.stringify(answerDoc.dependsOn)); 
                    } else { console.warn(">>> Trovato answerDoc non valido:", answerDoc); }
                });
            } else { console.warn(">>> Checklist.answers non è un array o manca:", fetchedData?.answers); }
            setAnswers(initialAnswers);
            console.log(">>> Stato 'answers' inizializzato per la compilazione");

        } catch (err) {
            console.error("Errore caricamento dettagli checklist:", err);
            setError(err.response?.data?.message || 'Errore nel recupero dettagli checklist.');
        } finally { setLoading(false); }
    }, [checklistId]);

    useEffect(() => {
        fetchChecklistDetails();
    }, [fetchChecklistDetails]);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    const saveAnswerAPI = useCallback(async (itemId, rispostaValue, notaValue) => {
        console.log(`API CALL: Tentativo salvataggio per ${itemId}, risposta: ${rispostaValue}, nota: ${notaValue}`);
        setSavingStatus(prev => ({ ...prev, [itemId]: 'saving' }));
        setSavingError(null);

        const dataToSend = {
            risposta: rispostaValue,
            note: notaValue
        };

        try {
            await axios.put(`http://localhost:5001/api/checklist/${checklistId}/answers/${itemId}`, dataToSend);
            setSavingStatus(prev => ({ ...prev, [itemId]: 'saved' }));
            console.log(`Risposta per ${itemId} salvata (API).`);
            setTimeout(() => setSavingStatus(prev => ({ ...prev, [itemId]: undefined })), 2000);
        } catch (err) {
            console.error(`Errore salvataggio risposta per ${itemId} (API):`, err);
            setSavingStatus(prev => ({ ...prev, [itemId]: 'error' }));
            setSavingError(`Errore API per ${itemId}: ${err.response?.data?.message || err.message}`);
        }
    }, [checklistId]);

    const debouncedSaveNoteAPI = useMemo(() => {
        return debounce((itemId) => {
            const currentAnswersState = answersRef.current;
            const answerData = currentAnswersState[itemId] || { risposta: null, note: '' };
            saveAnswerAPI(itemId, answerData.risposta, answerData.note);
        }, 1000);
    }, [saveAnswerAPI]);

    const handleRispostaChange = (itemId, eventOrValue) => {
        let newValue;
        if (eventOrValue && eventOrValue.target) {
            newValue = eventOrValue.target.value;
        } else {
            newValue = eventOrValue;
        }
        console.log(`UI: handleRispostaChange for ${itemId}, new value:`, newValue);

        let notaCorrente = '';
        setAnswers(prev => {
            notaCorrente = (prev[itemId] || { note: '' }).note;
            return {
                ...prev,
                [itemId]: { ...(prev[itemId] || { risposta: null, note: '' }), risposta: newValue }
            };
        });
        saveAnswerAPI(itemId, newValue, notaCorrente);
    };

    const handleNoteChange = (itemId, event) => {
        const newNoteValue = event.target.value;
        console.log(`UI: handleNoteChange for ${itemId}, new value:`, newNoteValue);

        let updatedAnswersState;
        setAnswers(prev => {
            updatedAnswersState = {
                ...prev,
                [itemId]: { ...(prev[itemId] || { risposta: null, note: '' }), note: newNoteValue }
            };
            return updatedAnswersState;
        });

        debouncedSaveNoteAPI(itemId);
    };

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            console.log("Polling interrotto.");
        }
    };

    const pollGapGenerationStatus = useCallback(async (cId) => {
        if (!cId) return;
        console.log(`Polling status per checklist ${cId}...`);
        try {
            const response = await axios.get(`http://localhost:5001/api/checklist/${cId}/gap-generation-status`);
            const statusData = response.data.data;
            console.log("Stato ricevuto dal polling:", statusData);

            setGapGenerationJob(prev => ({
                ...prev,
                isActive: statusData.status === 'PENDING' || statusData.status === 'PROCESSING',
                progress: statusData.progress || 0,
                status: statusData.status,
                message: statusData.message,
                gapsFound: statusData.gapsFound || 0,
            }));

            if (statusData.status === 'COMPLETED' || statusData.status === 'FAILED') {
                stopPolling();
                setIsCompleting(false);
                if (statusData.status === 'COMPLETED') {
                    alert(`Analisi gap completata! Trovati ${statusData.gapsFound} gap. Puoi visualizzarli nella Gap Analysis.`);
                    fetchChecklistDetails(); 
                } else {
                     setError(`Analisi gap fallita: ${statusData.message || 'Errore sconosciuto.'}`);
                }
            }
        } catch (pollError) {
            console.error("Errore durante il polling:", pollError);
            if (pollError.response && pollError.response.status === 404) {
                stopPolling();
                setError("Checklist non trovata durante il polling dello stato.");
                setIsCompleting(false);
            }
        }
    }, [fetchChecklistDetails]);

    const updateChecklistStatus = async (newStatus) => {
        setError(null);
        setSavingError(null);
        stopPolling();

        if (newStatus === 'completata') {
            setIsCompleting(true);
            setGapGenerationJob({
                isActive: true,
                progress: 0,
                status: 'PENDING',
                message: 'Avvio analisi gap...',
                gapsFound: 0
            });
        } else {
            setLoading(true); 
        }

        try {
            const response = await axios.put(`http://localhost:5001/api/checklist/${checklistId}`, { stato: newStatus });
            setCurrentStato(newStatus);
            
            if (newStatus === 'completata' && response.data.gapGenerationInitiated) {
                console.log("Analisi gap avviata in background. Inizio polling...");
                pollingIntervalRef.current = setInterval(() => pollGapGenerationStatus(checklistId), 3000);
            } else if (newStatus === 'completata' && !response.data.gapGenerationInitiated) {
                setIsCompleting(false);
                setGapGenerationJob(prev => ({...prev, isActive: false, status: 'IDLE', message: 'Nessuna nuova analisi gap avviata (forse già processata.'}));
                console.warn("Completamento richiesto, ma il backend non ha avviato la generazione gap.");
            } else {
                 setLoading(false);
            }
        } catch (err) {
            console.error(`Errore aggiornamento stato a ${newStatus}:`, err);
            const errorMsg = err.response?.data?.message || `Errore aggiornamento stato checklist a ${newStatus}.`;
            setError(errorMsg);
            if (newStatus === 'completata') {
                setIsCompleting(false);
                setGapGenerationJob({ isActive: false, status: 'FAILED', message: errorMsg, progress: 0, gapsFound:0 });
            } else {
                setLoading(false);
            }
        }
    };
    
    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, []);

    const isQuestionVisible = useCallback((questionDoc) => {
        console.log(`isQuestionVisible per ${questionDoc.itemId}? dependsOn:`, JSON.stringify(questionDoc.dependsOn));

        if (!questionDoc.dependsOn || questionDoc.dependsOn.length === 0) {
            console.log(` -> ${questionDoc.itemId} è visibile (no dependsOn).`);
            return true;
        }
        const allConditionsMet = questionDoc.dependsOn.every(condition => {
            const sourceAnswerData = answers[condition.sourceItemId];
            const sourceAnswerValue = sourceAnswerData ? sourceAnswerData.risposta : null;
            
            console.log(`  Condizione per ${questionDoc.itemId}: source=${condition.sourceItemId}, expected=${condition.expectedAnswer}, actual=${sourceAnswerValue}`);
            
            const conditionMet = String(sourceAnswerValue).toLowerCase() === String(condition.expectedAnswer).toLowerCase();
            console.log(`  -> Condition Met: ${conditionMet}`);
            return conditionMet;
        });

        console.log(` -> Risultato finale visibilità per ${questionDoc.itemId}: ${allConditionsMet}`);
        return allConditionsMet;
    }, [answers]);

    const visibleQuestionsByArea = useMemo(() => {
        console.log(">>> Ricalcolo visibleQuestionsByArea... Stato 'answers':", JSON.stringify(answers));
        if (!checklist?.answers || !Array.isArray(checklist.answers)) {
            console.log("   -> checklist.answers non valido.");
            return {};
        }
        const groups = {};
        checklist.answers.forEach(answerDoc => {
            if (!answerDoc || !answerDoc.area || !answerDoc.itemId) {
                console.warn("Trovato answerDoc non valido in visibleQuestionsByArea:", answerDoc);
                return;
            }
            
            console.log(`   Verifico visibilità per ${answerDoc.itemId} (Area: ${answerDoc.area})`);
            const isVisible = isQuestionVisible(answerDoc);
            console.log(`   -> ${answerDoc.itemId} è visibile? ${isVisible}`);

            if (isVisible) {
                const areaKey = answerDoc.area;
                if (!groups[areaKey]) {
                    groups[areaKey] = [];
                }
                groups[areaKey].push(answerDoc);
            }
        });
        Object.values(groups).forEach(group => {
            group.sort((a, b) => (a.ordine || 0) - (b.ordine || 0) || (a.itemId || "").localeCompare(b.itemId || ""));
        });
        console.log(">>> Gruppi visibili calcolati:", Object.keys(groups).map(k => `${k}: ${groups[k].length} domande`));
        return groups;
    }, [checklist, answers, isQuestionVisible]);

     const completionPercentage = useMemo(() => {
        if (!checklist?.answers) return 0;
        const totalPotentiallyVisibleQuestions = checklist.answers.length;
        if (totalPotentiallyVisibleQuestions === 0) return 0;
        
        const answeredCount = checklist.answers.reduce((count, qDoc) => {
            if (isQuestionVisible(qDoc) && answers[qDoc.itemId]?.risposta !== null && answers[qDoc.itemId]?.risposta !== undefined && answers[qDoc.itemId]?.risposta !== '') {
                return count + 1;
            }
            return count;
        }, 0);

        let currentlyVisibleCount = 0;
        Object.values(visibleQuestionsByArea).forEach(group => currentlyVisibleCount += group.length);
        
        if (currentlyVisibleCount === 0) return 0;
        return Math.round((answeredCount / currentlyVisibleCount) * 100);

    }, [checklist, answers, isQuestionVisible, visibleQuestionsByArea]);

    if (loading && !checklist && !gapGenerationJob.isActive) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    if (error && !checklist && !gapGenerationJob.isActive) return ( <Box><Alert severity="error">Errore caricamento: {error}</Alert><Button variant="outlined" onClick={onBackToList} sx={{ mt: 2 }}>Torna Indietro</Button></Box> );
    if (!checklist && !gapGenerationJob.isActive) return ( <Box><Alert severity="warning">Checklist non trovata.</Alert><Button variant="outlined" onClick={onBackToList} sx={{ mt: 2 }}>Torna Indietro</Button></Box> );

    return (
         <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                 <Typography variant="h5" gutterBottom>Compilazione: {checklist?.nome || `Checklist ID: ${checklistId}`}</Typography>
                 <Button variant="outlined" onClick={onBackToList} disabled={isCompleting || gapGenerationJob.isActive}>Torna alla Lista</Button>
            </Box>
            
            {gapGenerationJob.isActive && (
                <Paper sx={{ p: 2, mb: 3, borderColor: 'primary.main', borderWidth: 1, borderStyle: 'dashed' }}>
                    <Typography variant="h6" gutterBottom align="center">Analisi Gap in Corso...</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress variant="determinate" value={gapGenerationJob.progress} />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">{`${Math.round(gapGenerationJob.progress)}%`}</Typography>
                        </Box>
                    </Box>
                    <Typography variant="caption" display="block" align="center">
                        {gapGenerationJob.message || `Stato: ${gapGenerationJob.status}`}
                    </Typography>
                    {gapGenerationJob.status === 'PROCESSING' && gapGenerationJob.gapsFound > 0 && (
                        <Typography variant="caption" display="block" align="center" sx={{mt:0.5}}>
                            Gap potenziali identificati finora: {gapGenerationJob.gapsFound}
                        </Typography>
                    )}
                </Paper>
            )}

             <Paper sx={{ p: 2, mb: 3 }}>
                 <Typography variant="body2" component="div">
                     Cliente: {checklist?.cliente?.nome} | Stato Checklist: <Chip label={currentStato} size="small" color={currentStato === 'completata' ? 'success' : (currentStato === 'in_corso' ? 'primary' : 'default')}/> | Compilazione Visibile: {completionPercentage}%
                 </Typography>
                 {error && (!gapGenerationJob.isActive || gapGenerationJob.status === 'FAILED') && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}
                 {savingError && <Alert severity="warning" sx={{ mt: 2 }} onClose={() => setSavingError(null)}>Attenzione: {savingError}</Alert>}
             </Paper>

            {console.log(">>> Rendering Accordions... Esistono visibleQuestionsByArea?", !!visibleQuestionsByArea)}
            {visibleQuestionsByArea && console.log(">>> Chiavi Aree:", Object.keys(visibleQuestionsByArea))}

            <fieldset disabled={gapGenerationJob.isActive && gapGenerationJob.status !== 'FAILED'}>
                {Object.keys(visibleQuestionsByArea).length > 0 ? Object.keys(visibleQuestionsByArea).sort().map((area) => {
                    const domandeVisibiliDelGruppo = visibleQuestionsByArea[area];
                    if (!domandeVisibiliDelGruppo || domandeVisibiliDelGruppo.length === 0) {
                        return null; 
                    }
                    console.log(`>>> Rendering Area: ${area}, Numero Domande Visibili: ${domandeVisibiliDelGruppo.length}`);
                    return (
                        <Accordion key={area} defaultExpanded={true } >
                             <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: '#f5f5f5' }}>
                                 <Typography sx={{ fontWeight: 'bold' }}>Area: {area} ({domandeVisibiliDelGruppo.length} visibili)</Typography>
                             </AccordionSummary>
                             <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {domandeVisibiliDelGruppo.map((answerDoc) => {
                                    const itemId = answerDoc.itemId;
                                    if (!itemId) return null;

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
                                                                  ))
                                                                  }
                                                              </Select>
                                                          </FormControl>
                                                      )}
                                                      {!['SiNoParz', 'SiNo', 'Testo', 'Numero', 'TestoLungo', 'Data', 'SceltaMultipla'].includes(tipoRisposta) && (
                                                           <Typography variant="caption" color="error">Tipo risposta non riconosciuto: '{tipoRisposta}'</Typography>
                                                       )}
                                                  </FormControl>
                                              </Grid>
                                              <Grid item xs={12} md={6}>
                                                  <TextField fullWidth label="Note / Dettagli" variant="outlined" size="small" multiline rows={1} name={`note-${itemId}`} value={currentLocalAnswer.note} onChange={(e) => handleNoteChange(itemId, e)} />
                                              </Grid>
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
                })
                 : (
                    !loading && <Alert severity="info">Nessuna domanda attualmente visibile per questa checklist.</Alert>
                )}
            </fieldset>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                 {currentStato !== 'completata' && (
                     <Button 
                        variant="contained" 
                        color="success" 
                        disabled={loading || isCompleting || gapGenerationJob.isActive || Object.values(savingStatus).includes('saving')} 
                        onClick={() => updateChecklistStatus('completata')} 
                     > 
                         {isCompleting ? <CircularProgress size={24} sx={{color: 'white', mr:1}} /> : null} 
                         {isCompleting ? 'Completamento in corso...' : 'Marca come Completata e Analizza Gap'}
                     </Button>
                 )}
                  {currentStato === 'completata' && (!gapGenerationJob.isActive || gapGenerationJob.status === 'FAILED' || gapGenerationJob.status === 'COMPLETED') && (
                      <Button 
                        variant="outlined" 
                        onClick={() => updateChecklistStatus('in_corso')} 
                        disabled={loading || isCompleting || (gapGenerationJob.isActive && gapGenerationJob.status !== 'FAILED' && gapGenerationJob.status !== 'COMPLETED')}
                      > 
                        Riapri Checklist 
                      </Button>
                  )}
             </Box>

        </Box>
    );
};

export default CompilazioneChecklist;