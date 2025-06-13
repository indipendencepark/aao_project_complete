import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Grid, Button, CircularProgress, Alert,
    FormControl, RadioGroup, FormControlLabel, Radio, TextField,
    Accordion, AccordionSummary, AccordionDetails, Chip, Tooltip, IconButton, Divider,
    Select, MenuItem, InputLabel,
    LinearProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Card, CardContent, Fade, Grow, Zoom, Stack, Badge,
    useTheme, alpha, styled, keyframes, Avatar
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
import SaveIcon from '@mui/icons-material/Save';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

// Animazioni
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

// Componenti stilizzati
const GlassCard = styled(Card)(({ theme }) => ({
    backdropFilter: 'blur(20px)',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: theme.spacing(3),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    position: 'relative',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 50%)`,
        pointerEvents: 'none'
    }
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
    borderRadius: theme.spacing(2),
    marginBottom: theme.spacing(2),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: 'none',
    backdropFilter: 'blur(10px)',
    backgroundColor: alpha(theme.palette.background.paper, 0.7),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:before': {
        display: 'none'
    },
    '&.Mui-expanded': {
        margin: theme.spacing(0, 0, 2, 0),
        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    '&:hover': {
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`
    }
}));

const QuestionCard = styled(Paper)(({ theme, isCore }) => ({
    padding: theme.spacing(2.5),
    borderRadius: theme.spacing(2),
    border: `1px solid ${isCore ? theme.palette.warning.main : alpha(theme.palette.divider, 0.2)}`,
    borderLeft: `4px solid ${isCore ? theme.palette.warning.main : theme.palette.primary.main}`,
    background: isCore 
        ? `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.warning.light, 0.02)} 100%)`
        : theme.palette.background.paper,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 24px ${alpha(isCore ? theme.palette.warning.main : theme.palette.primary.main, 0.15)}`,
        '& .question-number': {
            transform: 'scale(1.1) rotate(-5deg)'
        }
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100px',
        height: '100px',
        background: `radial-gradient(circle, ${alpha(isCore ? theme.palette.warning.main : theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
        transform: 'translate(30px, -30px)'
    }
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
    height: 10,
    borderRadius: 5,
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    '& .MuiLinearProgress-bar': {
        borderRadius: 5,
        backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
    }
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
    borderRadius: theme.spacing(3),
    textTransform: 'none',
    fontWeight: 600,
    padding: theme.spacing(1.5, 3),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
        '& .MuiButton-startIcon': {
            transform: 'rotate(-10deg) scale(1.2)'
        }
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 0,
        height: 0,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.5)',
        transform: 'translate(-50%, -50%)',
        transition: 'width 0.6s, height 0.6s'
    },
    '&:active::after': {
        width: '300px',
        height: '300px'
    }
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
    const getStatusStyle = () => {
        switch (status) {
            case 'completata':
                return {
                    background: `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
                    color: theme.palette.success.contrastText
                };
            case 'in_corso':
                return {
                    background: `linear-gradient(135deg, ${theme.palette.info.light} 0%, ${theme.palette.info.main} 100%)`,
                    color: theme.palette.info.contrastText
                };
            default:
                return {
                    background: `linear-gradient(135deg, ${theme.palette.grey[400]} 0%, ${theme.palette.grey[600]} 100%)`,
                    color: theme.palette.common.white
                };
        }
    };
    return {
        ...getStatusStyle(),
        fontWeight: 600,
        padding: theme.spacing(0.5, 2),
        height: 32,
        '& .MuiChip-icon': {
            color: 'inherit'
        }
    };
});

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
    const theme = useTheme();
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
        <Box sx={{ position: 'relative', minHeight: '100vh' }}>
            {/* Background decorativo */}
            <Box sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 0,
                opacity: 0.03,
                pointerEvents: 'none',
                background: `radial-gradient(circle at 20% 50%, ${theme.palette.primary.main} 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, ${theme.palette.secondary.main} 0%, transparent 50%)`
            }} />

            <Fade in timeout={600}>
                <Box>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box>
                            <Typography variant="h4" gutterBottom sx={{
                                fontWeight: 800,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                {checklist?.nome || `Checklist ID: ${checklistId}`}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Compila le domande per completare la valutazione
                            </Typography>
                        </Box>
                        <AnimatedButton 
                            variant="outlined" 
                            onClick={onBackToList} 
                            disabled={isCompleting || gapGenerationJob.isActive}
                            startIcon={<ArrowBackIcon />}
                        >
                            Torna alla Lista
                        </AnimatedButton>
                    </Box>
                    
                    {/* Progress Card */}
                    {gapGenerationJob.isActive ? (
                        <Zoom in timeout={400}>
                            <GlassCard sx={{ mb: 3 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar sx={{
                                            mr: 2,
                                            width: 48,
                                            height: 48,
                                            background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                                            animation: `${pulse} 2s ease-in-out infinite`
                                        }}>
                                            <AutoAwesomeIcon />
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" gutterBottom>
                                                Analisi Gap in Corso...
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {gapGenerationJob.message || `Stato: ${gapGenerationJob.status}`}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <ProgressBar variant="determinate" value={gapGenerationJob.progress} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Progresso: {Math.round(gapGenerationJob.progress)}%
                                        </Typography>
                                        {gapGenerationJob.status === 'PROCESSING' && gapGenerationJob.gapsFound > 0 && (
                                            <Typography variant="caption" color="primary">
                                                Gap identificati: {gapGenerationJob.gapsFound}
                                            </Typography>
                                        )}
                                    </Box>
                                </CardContent>
                            </GlassCard>
                        </Zoom>
                    ) : (
                        <Grow in timeout={400}>
                            <GlassCard sx={{ mb: 3 }}>
                                <CardContent>
                                    <Grid container spacing={3} alignItems="center">
                                        <Grid item xs={12} md={3}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Cliente
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    {checklist?.cliente?.nome || 'N/D'}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Stato
                                                </Typography>
                                                <StatusChip 
                                                    label={currentStato} 
                                                    size="small" 
                                                    status={currentStato}
                                                    icon={currentStato === 'completata' ? <CheckCircleIcon /> : <TimerIcon />}
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Completamento
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                                        {completionPercentage}%
                                                    </Typography>
                                                </Box>
                                                <ProgressBar variant="determinate" value={completionPercentage} />
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </GlassCard>
                        </Grow>
                    )}

                    {/* Error/Success Messages */}
                    {error && (!gapGenerationJob.isActive || gapGenerationJob.status === 'FAILED') && (
                        <Zoom in timeout={400}>
                            <Alert 
                                severity="error" 
                                sx={{ 
                                    mb: 2,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.error.light, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.1)} 100%)`
                                }} 
                                onClose={() => setError(null)}
                            >
                                {error}
                            </Alert>
                        </Zoom>
                    )}
                    {savingError && (
                        <Zoom in timeout={400}>
                            <Alert 
                                severity="warning" 
                                sx={{ 
                                    mb: 2,
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.warning.light, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`
                                }} 
                                onClose={() => setSavingError(null)}
                            >
                                Attenzione: {savingError}
                            </Alert>
                        </Zoom>
                    )}

                    {/* Questions by Area */}
                    <fieldset disabled={gapGenerationJob.isActive && gapGenerationJob.status !== 'FAILED'} style={{ border: 'none', margin: 0, padding: 0 }}>
                        {Object.keys(visibleQuestionsByArea).length > 0 ? (
                            Object.keys(visibleQuestionsByArea).sort().map((area, areaIndex) => {
                                const domandeVisibiliDelGruppo = visibleQuestionsByArea[area];
                                if (!domandeVisibiliDelGruppo || domandeVisibiliDelGruppo.length === 0) {
                                    return null; 
                                }
                                console.log(`>>> Rendering Area: ${area}, Numero Domande Visibili: ${domandeVisibiliDelGruppo.length}`);
                                return (
                                    <Fade in timeout={600 + areaIndex * 100} key={area}>
                                        <StyledAccordion defaultExpanded={true}>
                                            <AccordionSummary 
                                                expandIcon={<ExpandMoreIcon />}
                                                sx={{ 
                                                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                                                    borderRadius: '16px 16px 0 0'
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar sx={{
                                                        width: 36,
                                                        height: 36,
                                                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                                        fontSize: '0.875rem',
                                                        fontWeight: 700
                                                    }}>
                                                        {area.charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 700 }}>
                                                            Area: {area}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {domandeVisibiliDelGruppo.length} domande visibili
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
                                                {domandeVisibiliDelGruppo.map((answerDoc, questionIndex) => {
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
                                                        <Zoom in timeout={800 + questionIndex * 50} key={itemId}>
                                                            <QuestionCard isCore={isCore}>
                                                                <Box sx={{ position: 'relative' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                                                                        <Badge
                                                                            className="question-number"
                                                                            sx={{
                                                                                mr: 2,
                                                                                '& .MuiBadge-badge': {
                                                                                    width: 32,
                                                                                    height: 32,
                                                                                    borderRadius: '50%',
                                                                                    background: isCore 
                                                                                        ? `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`
                                                                                        : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                                                                    color: 'white',
                                                                                    fontSize: '0.75rem',
                                                                                    fontWeight: 700,
                                                                                    transition: 'transform 0.3s ease'
                                                                                }
                                                                            }}
                                                                            badgeContent={itemId}
                                                                        />
                                                                        <Box sx={{ flexGrow: 1 }}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                                                {isCore && (
                                                                                    <Tooltip title={motivazioneAI || "Domanda Fondamentale"} arrow>
                                                                                        <Chip 
                                                                                            label="CORE" 
                                                                                            size="small" 
                                                                                            sx={{
                                                                                                background: `linear-gradient(135deg, ${theme.palette.warning.light} 0%, ${theme.palette.warning.main} 100%)`,
                                                                                                color: 'white',
                                                                                                fontWeight: 700,
                                                                                                fontSize: '0.7rem',
                                                                                                height: 20,
                                                                                                animation: `${pulse} 3s ease-in-out infinite`
                                                                                            }}
                                                                                        />
                                                                                    </Tooltip>
                                                                                )}
                                                                                {testoAiuto && (
                                                                                    <Tooltip title={testoAiuto} arrow>
                                                                                        <IconButton size="small" sx={{ 
                                                                                            p: 0.5,
                                                                                            '&:hover': {
                                                                                                backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                                                                            }
                                                                                        }}>
                                                                                            <HelpOutlineIcon sx={{ fontSize: '1rem' }} color="action"/>
                                                                                        </IconButton>
                                                                                    </Tooltip>
                                                                                )}
                                                                                {!isCore && motivazioneAI && (
                                                                                    <Tooltip title={`Motivazione AI: ${motivazioneAI}`} arrow>
                                                                                        <IconButton size="small" sx={{ 
                                                                                            p: 0.5,
                                                                                            '&:hover': {
                                                                                                backgroundColor: alpha(theme.palette.secondary.main, 0.1)
                                                                                            }
                                                                                        }}>
                                                                                            <InfoIcon sx={{ fontSize: '1rem' }} color="secondary"/>
                                                                                        </IconButton>
                                                                                    </Tooltip>
                                                                                )}
                                                                            </Box>
                                                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                                                {domandaText}
                                                                            </Typography>
                                                                            {answerDoc.fonte && (
                                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                                                    Rif.: {answerDoc.fonte}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    </Box>
                                                                    
                                                                    <Grid container spacing={2} alignItems="center">
                                                                        <Grid item xs={12} md={5}>
                                                                            <FormControl component="fieldset" size="small" fullWidth>
                                                                                {(tipoRisposta === 'SiNoParz' || tipoRisposta === 'SiNo') && (
                                                                                    <RadioGroup 
                                                                                        row 
                                                                                        name={`risposta-${itemId}`} 
                                                                                        value={currentLocalAnswer.risposta ?? ''} 
                                                                                        onChange={(e) => handleRispostaChange(itemId, e)}
                                                                                    >
                                                                                        <FormControlLabel value="Si" control={<Radio size="small"/>} label="Sì" />
                                                                                        <FormControlLabel value="No" control={<Radio size="small"/>} label="No" />
                                                                                        {tipoRisposta === 'SiNoParz' && <FormControlLabel value="Parziale" control={<Radio size="small"/>} label="Parz." />}
                                                                                        <FormControlLabel value="NA" control={<Radio size="small"/>} label="N/A" />
                                                                                    </RadioGroup>
                                                                                )}
                                                                                {(tipoRisposta === 'Testo' || tipoRisposta === 'Numero' || tipoRisposta === 'TestoLungo') && (
                                                                                    <TextField
                                                                                        fullWidth 
                                                                                        variant="outlined" 
                                                                                        size="small" 
                                                                                        label="Risposta"
                                                                                        name={`risposta-${itemId}`}
                                                                                        type={tipoRisposta === 'Numero' ? 'number' : 'text'}
                                                                                        multiline={tipoRisposta === 'TestoLungo'}
                                                                                        rows={tipoRisposta === 'TestoLungo' ? 2 : 1}
                                                                                        value={currentLocalAnswer.risposta ?? ''}
                                                                                        onChange={(e) => handleRispostaChange(itemId, e)}
                                                                                        sx={{
                                                                                            '& .MuiOutlinedInput-root': {
                                                                                                borderRadius: 2,
                                                                                                transition: 'all 0.2s ease',
                                                                                                '&:hover': {
                                                                                                    backgroundColor: alpha(theme.palette.primary.main, 0.02)
                                                                                                },
                                                                                                '&.Mui-focused': {
                                                                                                    backgroundColor: alpha(theme.palette.primary.main, 0.03)
                                                                                                }
                                                                                            }
                                                                                        }}
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
                                                                                            sx={{ borderRadius: 2 }}
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
                                                                        <Grid item xs={12} md={6}>
                                                                            <TextField 
                                                                                fullWidth 
                                                                                label="Note / Dettagli" 
                                                                                variant="outlined" 
                                                                                size="small" 
                                                                                multiline 
                                                                                rows={1} 
                                                                                name={`note-${itemId}`} 
                                                                                value={currentLocalAnswer.note} 
                                                                                onChange={(e) => handleNoteChange(itemId, e)}
                                                                                sx={{
                                                                                    '& .MuiOutlinedInput-root': {
                                                                                        borderRadius: 2,
                                                                                        transition: 'all 0.2s ease',
                                                                                        '&:hover': {
                                                                                            backgroundColor: alpha(theme.palette.primary.main, 0.02)
                                                                                        },
                                                                                        '&.Mui-focused': {
                                                                                            backgroundColor: alpha(theme.palette.primary.main, 0.03)
                                                                                        }
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </Grid>
                                                                        <Grid item xs={12} md={1} sx={{ textAlign: 'center', minHeight: '40px' }}>
                                                                            {saveState === 'saving' && <CircularProgress size={20} />}
                                                                            {saveState === 'saved' && (
                                                                                <Zoom in timeout={300}>
                                                                                    <CheckCircleIcon color="success" sx={{ animation: `${pulse} 1s ease-in-out` }} />
                                                                                </Zoom>
                                                                            )}
                                                                            {saveState === 'error' && (
                                                                                <Tooltip title={savingError || 'Errore'}>
                                                                                    <ErrorIcon color="error" />
                                                                                </Tooltip>
                                                                            )}
                                                                        </Grid>
                                                                    </Grid>
                                                                </Box>
                                                            </QuestionCard>
                                                        </Zoom>
                                                    );
                                                })}
                                            </AccordionDetails>
                                        </StyledAccordion>
                                    </Fade>
                                );
                            })
                        ) : (
                            !loading && (
                                <Fade in timeout={600}>
                                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                                        Nessuna domanda attualmente visibile per questa checklist.
                                    </Alert>
                                </Fade>
                            )
                        )}
                    </fieldset>

                    {/* Action Buttons */}
                    <Grow in timeout={1000}>
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            {currentStato !== 'completata' && (
                                <AnimatedButton 
                                    variant="contained" 
                                    color="success"
                                    size="large"
                                    disabled={loading || isCompleting || gapGenerationJob.isActive || Object.values(savingStatus).includes('saving')} 
                                    onClick={() => updateChecklistStatus('completata')}
                                    startIcon={isCompleting ? <CircularProgress size={20} sx={{color: 'white'}} /> : <RocketLaunchIcon />}
                                    sx={{
                                        background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                                        color: 'white',
                                        minWidth: 250,
                                        '&:hover': {
                                            background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
                                        }
                                    }}
                                > 
                                    {isCompleting ? 'Completamento in corso...' : 'Completa e Analizza Gap'}
                                </AnimatedButton>
                            )}
                            {currentStato === 'completata' && (!gapGenerationJob.isActive || gapGenerationJob.status === 'FAILED' || gapGenerationJob.status === 'COMPLETED') && (
                                <AnimatedButton 
                                    variant="outlined" 
                                    onClick={() => updateChecklistStatus('in_corso')} 
                                    disabled={loading || isCompleting || (gapGenerationJob.isActive && gapGenerationJob.status !== 'FAILED' && gapGenerationJob.status !== 'COMPLETED')}
                                    startIcon={<EditIcon />}
                                > 
                                    Riapri Checklist 
                                </AnimatedButton>
                            )}
                        </Box>
                    </Grow>
                </Box>
            </Fade>
        </Box>
    );
};

export default CompilazioneChecklist;