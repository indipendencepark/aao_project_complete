import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link as RouterLink, useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Divider,
    Alert, FormControl, InputLabel, Select, MenuItem, CircularProgress, Tooltip,
    List, ListItem, ListItemText, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, ListItemIcon,
    Accordion, AccordionSummary, AccordionDetails,
    Checkbox, Avatar, Zoom, Fade, Grow, Badge, LinearProgress,
    useTheme, alpha, Skeleton, CardActions, Stack
} from '@mui/material';

import { styled, keyframes } from '@mui/material/styles';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import PollIcon from '@mui/icons-material/Poll';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BuildIcon from '@mui/icons-material/Build';
import LaunchIcon from '@mui/icons-material/Launch';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SecurityIcon from '@mui/icons-material/Security';
import BugReportIcon from '@mui/icons-material/BugReport';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import FilterListIcon from '@mui/icons-material/FilterList';

// Animazioni
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const slideIn = keyframes`
  from { 
    opacity: 0;
    transform: translateX(-20px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); }
  50% { box-shadow: 0 0 20px rgba(0, 0, 0, 0.2); }
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
    '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
    },
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

const RiskChip = styled(Chip)(({ theme, risk }) => {
    const getStyle = () => {
        switch (risk) {
            case 'alto':
                return {
                    background: `linear-gradient(135deg, ${theme.palette.error.light} 0%, ${theme.palette.error.main} 100%)`,
                    color: theme.palette.error.contrastText
                };
            case 'medio':
                return {
                    background: `linear-gradient(135deg, ${theme.palette.warning.light} 0%, ${theme.palette.warning.main} 100%)`,
                    color: theme.palette.warning.contrastText
                };
            case 'basso':
                return {
                    background: `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
                    color: theme.palette.success.contrastText
                };
            default:
                return {
                    background: theme.palette.grey[500],
                    color: theme.palette.common.white
                };
        }
    };
    return {
        ...getStyle(),
        fontWeight: 600,
        '& .MuiChip-icon': {
            color: 'inherit'
        }
    };
});

const AnimatedButton = styled(Button)(({ theme }) => ({
    borderRadius: theme.spacing(3),
    textTransform: 'none',
    fontWeight: 600,
    padding: theme.spacing(1.5, 3),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
    }
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
    borderRadius: theme.spacing(2),
    marginBottom: theme.spacing(2),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: 'none',
    backdropFilter: 'blur(10px)',
    backgroundColor: alpha(theme.palette.background.paper, 0.7),
    '&:before': {
        display: 'none'
    },
    '&.Mui-expanded': {
        margin: theme.spacing(0, 0, 2, 0),
        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`
    }
}));

const StatCard = styled(Card)(({ theme, color = 'primary' }) => ({
    borderRadius: theme.spacing(2),
    background: `linear-gradient(135deg, ${alpha(theme.palette[color].light, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.1)} 100%)`,
    border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: -50,
        right: -50,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: alpha(theme.palette[color].main, 0.1)
    }
}));

const mapCategoriaToArea = (categoria) => {
    if (!categoria) return 'Altro';
    const catLower = categoria.toLowerCase();
    if (catLower.includes('process')) return 'Admin';
    if (catLower.includes('organizz')) return 'Org';
    if (catLower.includes('cultura')) return 'Org';
    if (catLower.includes('sistem') || catLower.includes('tecnologia')) return 'IT';
    if (catLower.includes('governance') || catLower.includes('leadership')) return 'Org';
    if (catLower.includes('person') || catLower.includes('competenze')) return 'HR';
    return 'Altro';
};

const mapRilevanzaToPriorita = (rilevanza) => {
    if (!rilevanza) return 'media';
    const rilLower = rilevanza.toLowerCase();
    if (rilLower === 'critica' || rilLower === 'alta') return 'alta';
    if (rilLower === 'media') return 'media';
    if (rilLower === 'bassa') return 'bassa';
    return 'media';
};

const GapAnalysisPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialChecklistId = searchParams.get('checklist_id');

    const [checklistsCompletate, setChecklistsCompletate] = useState([]);
    const [selectedChecklistId, setSelectedChecklistId] = useState('');
    const [gaps, setGaps] = useState([]);
    const [filteredGaps, setFilteredGaps] = useState([]);
    const [loadingChecklists, setLoadingChecklists] = useState(false);
    const [loadingGaps, setLoadingGaps] = useState(false);
    const [errorChecklists, setErrorChecklists] = useState(null);
    const [errorGaps, setErrorGaps] = useState(null);
    const [filters, setFilters] = useState({ area: '', livello_rischio: '' });

    const [analyzingRootCauseFor, setAnalyzingRootCauseFor] = useState(null);
    const [rootCauseError, setRootCauseError] = useState(null);
    const [showRootCauseModal, setShowRootCauseModal] = useState(false);
    const [currentRootCauses, setCurrentRootCauses] = useState([]);
    const [modalGapTitle, setModalGapTitle] = useState('');

    const [showSelectRelatedGapsModal, setShowSelectRelatedGapsModal] = useState(false);
    const [currentGapForRelatedSelection, setCurrentGapForRelatedSelection] = useState(null);
    const [selectedRelatedGapIds, setSelectedRelatedGapIds] = useState([]);

    const [reportDocumentId, setReportDocumentId] = useState(null);
    
    const [analyzingAggregatedRCA, setAnalyzingAggregatedRCA] = useState(false);
    const [aggregatedRCAData, setAggregatedRCAData] = useState(null);
    const [aggregatedRCAStatus, setAggregatedRCAStatus] = useState({
        status: 'IDLE',
        message: null,
        lastAnalysisDate: null,
        isPolling: false,
    });
    const pollingIntervalRef = useRef(null);
    const [errorAggregatedRCA, setErrorAggregatedRCA] = useState(null);

    const fetchCompletedChecklists = useCallback(async () => {
        setLoadingChecklists(true);
        setErrorChecklists(null);
        setChecklistsCompletate([]);
        try {
            const response = await axios.get('http://localhost:5001/api/checklist');
            const completed = response.data.data?.filter(cl => cl.stato === 'completata') || [];
            setChecklistsCompletate(completed);
            
            if (initialChecklistId && completed.some(cl => cl._id === initialChecklistId)) {
                setSelectedChecklistId(initialChecklistId);
            }
        } catch (err) {
            setErrorChecklists(err.response?.data?.message || 'Errore nel recupero elenco checklist.');
        } finally {
            setLoadingChecklists(false);
        }
    }, [initialChecklistId]);

    const fetchGaps = useCallback(async (checklistId) => {
        if (!checklistId) {
            setGaps([]);
            setFilteredGaps([]);
            return;
        }
        setLoadingGaps(true);
        setErrorGaps(null);
        setGaps([]);
        setFilteredGaps([]);
        try {
            const response = await axios.get(`http://localhost:5001/api/assessment/gaps?checklist_id=${checklistId}`);
            const receivedData = response.data.data || [];
            setGaps(receivedData);
        } catch (err) {
            setErrorGaps(err.response?.data?.message || 'Errore nel recupero dei gap.');
            setGaps([]);
            setFilteredGaps([]);
        } finally {
            setLoadingGaps(false);
        }
    }, []);

    const handleAnalyzeRootCause = useCallback(async (gap, relatedGapIds) => {
        if (!gap || !gap._id || !selectedChecklistId) return;

        setAnalyzingRootCauseFor(gap._id);
        setRootCauseError(null);
        setCurrentRootCauses([]);
        setModalGapTitle(gap.descrizione || `Analisi Gap ${gap.item_id}`);

        try {
            const response = await axios.post(
                `http://localhost:5001/api/assessment/gaps/${gap._id}/root-cause`,
                {
                    checklistId: selectedChecklistId,
                    relatedGapIds: relatedGapIds || []
                }
            );
            
            setCurrentRootCauses(response.data.data || []);
            setShowRootCauseModal(true);

            setGaps(prevGaps => prevGaps.map(g => 
                g._id === gap._id 
                ? { ...g, causeRadiceSuggeriteAI: response.data.data, ultimaAnalisiCauseRadice: new Date() } 
                : g
            ));

        } catch (err) {
            setRootCauseError(err.response?.data?.message || "Errore durante l'analisi delle cause radice.");
            setShowRootCauseModal(true);
        } finally {
            setAnalyzingRootCauseFor(null);
        }
    }, [selectedChecklistId]);

    useEffect(() => {
        fetchCompletedChecklists();
    }, [fetchCompletedChecklists]);

    useEffect(() => {
        if (!loadingChecklists && selectedChecklistId) {
            fetchGaps(selectedChecklistId);
        } else if (!selectedChecklistId) {
            setGaps([]);
            setFilteredGaps([]);
        }
    }, [selectedChecklistId, fetchGaps, loadingChecklists]);

    useEffect(() => {
        let result = gaps;
        if (filters.area) {
            result = result.filter(gap => gap.item_id && gap.item_id.toUpperCase().startsWith(filters.area));
        }
        if (filters.livello_rischio) {
            result = result.filter(gap => gap.livello_rischio === filters.livello_rischio);
        }
        setFilteredGaps(result);
    }, [gaps, filters.area, filters.livello_rischio]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
    };

    const handleChecklistChange = (event) => {
        const newId = event.target.value;
        setSelectedChecklistId(newId);
        setErrorGaps(null);
    };

    const getRiskIcon = (level) => {
        switch (level) {
            case 'alto': return <ErrorIcon />;
            case 'medio': return <WarningIcon />;
            case 'basso': return <CheckCircleIcon />;
            default: return null;
        }
    };

    const getRiskLabel = (level) => {
        switch (level) {
            case 'alto': return 'Alto';
            case 'medio': return 'Medio';
            case 'basso': return 'Basso';
            default: return level || 'N/D';
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'alto': return 'error';
            case 'medio': return 'warning';
            case 'basso': return 'success';
            default: return 'default';
        }
    };

    // Calcolo statistiche
    const stats = {
        total: filteredGaps.length,
        alto: filteredGaps.filter(g => g.livello_rischio === 'alto').length,
        medio: filteredGaps.filter(g => g.livello_rischio === 'medio').length,
        basso: filteredGaps.filter(g => g.livello_rischio === 'basso').length
    };

    const RootCauseModal = ({ open, onClose, causes, gapTitle, error }) => {
        if (!open) return null;

        return (
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        backdropFilter: 'blur(20px)',
                        backgroundColor: alpha(theme.palette.background.paper, 0.95)
                    }
                }}
            >
                <DialogTitle sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                            <TroubleshootIcon sx={{ mr: 1 }} />
                            Analisi Cause Radice
                        </Typography>
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {gapTitle}
                    </Typography>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {!error && causes.length === 0 && (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            Nessuna causa radice identificata per questo gap.
                        </Alert>
                    )}
                    {!error && causes.length > 0 && (
                        <List>
                            {causes.map((causa, index) => (
                                <React.Fragment key={index}>
                                    <Fade in timeout={300 * (index + 1)}>
                                        <ListItem sx={{
                                            alignItems: 'flex-start',
                                            p: 2,
                                            mb: 2,
                                            borderRadius: 2,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.03),
                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                                                <Avatar sx={{
                                                    width: 32,
                                                    height: 32,
                                                    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                                                    fontSize: '0.875rem',
                                                    fontWeight: 700
                                                }}>
                                                    {index + 1}
                                                </Avatar>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                                        {causa.testoCausa}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box>
                                                        {causa.categoriaCausa && (
                                                            <Chip
                                                                label={causa.categoriaCausa}
                                                                size="small"
                                                                sx={{
                                                                    mb: 1,
                                                                    fontWeight: 600,
                                                                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                                                                    color: theme.palette.info.main
                                                                }}
                                                            />
                                                        )}
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                            <strong>Motivazione AI:</strong> {causa.motivazioneAI || 'N/D'}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Rilevanza:
                                                            </Typography>
                                                            <RiskChip
                                                                label={getRiskLabel(causa.rilevanzaStimata)}
                                                                size="small"
                                                                risk={causa.rilevanzaStimata}
                                                                sx={{ ml: 1 }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    </Fade>
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <AnimatedButton onClick={onClose} variant="contained">
                        Chiudi
                    </AnimatedButton>
                </DialogActions>
            </Dialog>
        );
    };

    const SelectRelatedGapsModal = ({ open, onClose, onConfirm, allGaps, mainGapId }) => {
        const [locallySelectedIds, setLocallySelectedIds] = useState([]);

        useEffect(() => {
            setLocallySelectedIds([]);
        }, [open]);

        const handleToggleGap = (gapId) => {
            setLocallySelectedIds(prevSelected =>
                prevSelected.includes(gapId) ?
                prevSelected.filter(id => id !== gapId) :
                [...prevSelected, gapId]
            );
        };

        const handleConfirmSelection = () => {
            onConfirm(locallySelectedIds);
            onClose();
        };

        if (!open || !allGaps || !mainGapId) return null;

        const candidateRelatedGaps = allGaps.filter(g => g._id !== mainGapId);

        return (
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        backdropFilter: 'blur(20px)',
                        backgroundColor: alpha(theme.palette.background.paper, 0.95)
                    }
                }}
            >
                <DialogTitle sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Seleziona Gap Correlati
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Seleziona fino a 3-4 gap correlati per un'analisi più approfondita.
                    </Typography>
                    {candidateRelatedGaps.length === 0 ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            Nessun altro gap disponibile per la selezione.
                        </Alert>
                    ) : (
                        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {candidateRelatedGaps.map(gap => (
                                <ListItem
                                    key={gap._id}
                                    sx={{
                                        mb: 1,
                                        borderRadius: 2,
                                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                        backgroundColor: locallySelectedIds.includes(gap._id) 
                                            ? alpha(theme.palette.primary.main, 0.05)
                                            : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => handleToggleGap(gap._id)}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        {getRiskIcon(gap.livello_rischio)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={`${gap.item_id}: ${gap.descrizione}`}
                                        secondary={`Rischio: ${getRiskLabel(gap.livello_rischio)}`}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                    <Checkbox
                                        edge="end"
                                        checked={locallySelectedIds.includes(gap._id)}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={onClose}>Annulla</Button>
                    <AnimatedButton onClick={handleConfirmSelection} variant="contained">
                        Conferma Selezione
                    </AnimatedButton>
                </DialogActions>
            </Dialog>
        );
    };

    const handleConfirmRelatedGaps = (selectedIds) => {
        if (currentGapForRelatedSelection) {
            handleAnalyzeRootCause(currentGapForRelatedSelection, selectedIds);
        }
        setShowSelectRelatedGapsModal(false);
        setSelectedRelatedGapIds([]);
        setCurrentGapForRelatedSelection(null);
    };

    const startRelatedGapsSelection = useCallback((gapToAnalyze) => {
        setCurrentGapForRelatedSelection(gapToAnalyze);
        setSelectedRelatedGapIds([]);
        setShowSelectRelatedGapsModal(true);
    }, []);

    const fetchReportDocumentId = useCallback(async (chkId) => {
        if (!chkId) {
            setReportDocumentId(null);
            setAggregatedRCAData(null);
            setAggregatedRCAStatus({ status: 'IDLE', message: null, lastAnalysisDate: null, isPolling: false });
            return;
        }
        try {
            const response = await axios.get(`http://localhost:5001/api/report?checklist_id=${chkId}`);
            if (response.data && response.data.data) {
                const report = response.data.data;
                setReportDocumentId(report._id);
                if (report.analisiCauseRadiceAggregate) {
                    setAggregatedRCAData(report.analisiCauseRadiceAggregate);
                    setAggregatedRCAStatus(prev => ({
                        ...prev,
                        status: report.analisiCauseRadiceAggregate.statusAnalisi || 'IDLE',
                        message: report.analisiCauseRadiceAggregate.messaggioAnalisi,
                        lastAnalysisDate: report.analisiCauseRadiceAggregate.dataUltimaAnalisi,
                    }));
                    if (report.analisiCauseRadiceAggregate.statusAnalisi === 'PROCESSING' || report.analisiCauseRadiceAggregate.statusAnalisi === 'PENDING') {
                        startPollingAggregatedRCAStatus(chkId);
                    } else {
                        stopPollingAggregatedRCA();
                    }
                } else {
                    setAggregatedRCAData(null);
                    setAggregatedRCAStatus({ status: 'IDLE', message: null, lastAnalysisDate: null, isPolling: false });
                }
            } else {
                setReportDocumentId(null);
                setAggregatedRCAData(null);
                setAggregatedRCAStatus({ status: 'IDLE', message: null, lastAnalysisDate: null, isPolling: false });
            }
        } catch (err) {
            setReportDocumentId(null);
            setAggregatedRCAData(null);
        }
    }, []);

    useEffect(() => {
        if (selectedChecklistId) {
            fetchReportDocumentId(selectedChecklistId);
        } else {
            setReportDocumentId(null);
            setAggregatedRCAData(null);
            stopPollingAggregatedRCA();
            setAggregatedRCAStatus({ status: 'IDLE', message: null, lastAnalysisDate: null, isPolling: false });
        }
    }, [selectedChecklistId, fetchReportDocumentId]);

    const stopPollingAggregatedRCA = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            setAggregatedRCAStatus(prev => ({ ...prev, isPolling: false }));
        }
    }, []);

    const pollAggregatedRCAStatus = useCallback(async (chkIdToPoll) => {
        if (!chkIdToPoll || !aggregatedRCAStatus.isPolling) {
            stopPollingAggregatedRCA();
            return;
        }
        try {
            const response = await axios.get(
                `http://localhost:5001/api/assessment/checklists/${chkIdToPoll}/aggregated-root-cause-status`
            );
            const statusData = response.data;
            setAggregatedRCAStatus(prev => ({
                ...prev,
                status: statusData.status,
                message: statusData.message,
                lastAnalysisDate: statusData.lastAnalysisDate,
            }));

            if (statusData.status === 'COMPLETED' || statusData.status === 'FAILED') {
                stopPollingAggregatedRCA();
                setAnalyzingAggregatedRCA(false);
                if (statusData.status === 'COMPLETED') {
                    fetchReportDocumentId(chkIdToPoll);
                }
            }
        } catch (pollError) {
            if (pollError.response?.status === 404) {
                stopPollingAggregatedRCA();
                setAggregatedRCAStatus({ status: 'FAILED', message: 'Risorsa non trovata durante il polling.', lastAnalysisDate: null, isPolling: false });
            }
        }
    }, [aggregatedRCAStatus.isPolling, fetchReportDocumentId, stopPollingAggregatedRCA]);

    const startPollingAggregatedRCAStatus = useCallback((chkIdToPoll) => {
        stopPollingAggregatedRCA();
        pollAggregatedRCAStatus(chkIdToPoll);
        pollingIntervalRef.current = setInterval(() => pollAggregatedRCAStatus(chkIdToPoll), 7000);
        setAggregatedRCAStatus(prev => ({ ...prev, isPolling: true, status: 'PROCESSING', message: 'Analisi in corso...' }));
    }, [pollAggregatedRCAStatus, stopPollingAggregatedRCA]);

    const handleStartAggregatedRCA = async () => {
        if (!selectedChecklistId) return;

        setAnalyzingAggregatedRCA(true);
        setAggregatedRCAStatus({ 
            status: 'PENDING', 
            message: 'Avvio analisi aggregata delle cause radice...', 
            lastAnalysisDate: null, 
            isPolling: false 
        });
        setErrorAggregatedRCA(null);

        try {
            const response = await axios.post(
                `http://localhost:5001/api/assessment/checklists/${selectedChecklistId}/aggregated-root-cause`,
                { considerOnlyCriticalGaps: true }
            );

            if (response.status === 202) {
                setAggregatedRCAStatus(prev => ({
                    ...prev,
                    message: response.data.message || 'Richiesta di analisi accettata, elaborazione in corso...',
                }));
                startPollingAggregatedRCAStatus(selectedChecklistId);
            } else {
                throw new Error(response.data.message || "Risposta non attesa dal server per analisi aggregata.");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Errore sconosciuto.";
            setErrorAggregatedRCA(errorMsg);
            setAggregatedRCAStatus({ status: 'FAILED', message: errorMsg, lastAnalysisDate: null, isPolling: false });
            setAnalyzingAggregatedRCA(false);
        }
    };

    useEffect(() => {
        return () => {
            stopPollingAggregatedRCA();
        };
    }, [stopPollingAggregatedRCA]);

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
                background: `radial-gradient(circle at 20% 50%, ${theme.palette.error.main} 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, ${theme.palette.warning.main} 0%, transparent 50%)`
            }} />

            {/* Header */}
            <Fade in timeout={600}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{
                        fontWeight: 800,
                        background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.warning.main} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                    }}>
                        Gap Analysis
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Analizza i gap rilevati e le cause radice per definire interventi mirati
                    </Typography>
                </Box>
            </Fade>

            {/* Selezione checklist */}
            <Fade in timeout={800}>
                <GlassCard sx={{ p: 3, mb: 3 }}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={selectedChecklistId ? 6 : 12}>
                            <FormControl fullWidth disabled={loadingChecklists || loadingGaps || analyzingAggregatedRCA || aggregatedRCAStatus.isPolling}>
                                <InputLabel id="checklist-select-label">Seleziona Checklist Completata</InputLabel>
                                <Select
                                    labelId="checklist-select-label"
                                    value={selectedChecklistId}
                                    label="Seleziona Checklist Completata"
                                    onChange={handleChecklistChange}
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value=""><em>Nessuna selezionata</em></MenuItem>
                                    {loadingChecklists && <MenuItem value="" disabled>Caricamento...</MenuItem>}
                                    {!loadingChecklists && checklistsCompletate.length === 0 && <MenuItem value="" disabled>Nessuna checklist completata trovata.</MenuItem>}
                                    {checklistsCompletate.map((cl) => (
                                        <MenuItem key={cl._id} value={cl._id}>{cl.nome} ({cl.cliente?.nome})</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {errorChecklists && (
                                <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>
                                    {errorChecklists}
                                </Alert>
                            )}
                        </Grid>

                        {selectedChecklistId && !loadingGaps && gaps.length > 0 && (
                            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                                <Tooltip title="Analizza le cause sistemiche dei gap principali">
                                    <span>
                                        <AnimatedButton
                                            variant="contained"
                                            onClick={handleStartAggregatedRCA}
                                            startIcon={analyzingAggregatedRCA || aggregatedRCAStatus.isPolling ? <CircularProgress size={20} color="inherit" /> : <PollIcon />}
                                            disabled={!selectedChecklistId || loadingGaps || analyzingAggregatedRCA || aggregatedRCAStatus.isPolling || (aggregatedRCAStatus.status === 'PROCESSING')}
                                            sx={{
                                                background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                                                color: 'white',
                                                minWidth: 280
                                            }}
                                        >
                                            {(analyzingAggregatedRCA || aggregatedRCAStatus.isPolling) ? 'Analisi in Corso...' :
                                                (aggregatedRCAStatus.status === 'COMPLETED' || aggregatedRCAStatus.lastAnalysisDate) ? 'Ri-Analizza Cause' :
                                                    'Analizza Cause Complessive'}
                                        </AnimatedButton>
                                    </span>
                                </Tooltip>
                            </Grid>
                        )}

                        {selectedChecklistId && (aggregatedRCAStatus.message || aggregatedRCAStatus.lastAnalysisDate) && (
                            <Grid item xs={12}>
                                <Alert
                                    severity={aggregatedRCAStatus.status === 'FAILED' ? 'error' :
                                        aggregatedRCAStatus.status === 'COMPLETED' ? 'success' :
                                            (aggregatedRCAStatus.status === 'PROCESSING' || aggregatedRCAStatus.status === 'PENDING') ? 'info' :
                                                'info'}
                                    sx={{ mt: 1, borderRadius: 2 }}
                                    icon={(aggregatedRCAStatus.status === 'PROCESSING' || aggregatedRCAStatus.status === 'PENDING' || aggregatedRCAStatus.isPolling) ? <CircularProgress size={18} sx={{ mr: 1, alignSelf: 'center' }} /> : undefined}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        Stato Analisi: {aggregatedRCAStatus.status?.toUpperCase() || 'N/D'}
                                    </Typography>
                                    {aggregatedRCAStatus.message && (
                                        <Typography variant="caption" display="block">
                                            {aggregatedRCAStatus.message}
                                        </Typography>
                                    )}
                                    {aggregatedRCAStatus.lastAnalysisDate && !aggregatedRCAStatus.isPolling && (
                                        <Typography variant="caption" display="block">
                                            Ultima analisi: {new Date(aggregatedRCAStatus.lastAnalysisDate).toLocaleString('it-IT')}
                                        </Typography>
                                    )}
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                </GlassCard>
            </Fade>

            {/* Statistiche Gap */}
            {selectedChecklistId && !loadingGaps && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {[
                        { label: 'Gap Totali', value: stats.total, color: 'primary', icon: <BugReportIcon /> },
                        { label: 'Rischio Alto', value: stats.alto, color: 'error', icon: <ErrorIcon /> },
                        { label: 'Rischio Medio', value: stats.medio, color: 'warning', icon: <WarningIcon /> },
                        { label: 'Rischio Basso', value: stats.basso, color: 'success', icon: <CheckCircleIcon /> }
                    ].map((stat, index) => (
                        <Grid item xs={12} sm={6} md={3} key={stat.label}>
                            <Grow in timeout={800 + index * 100}>
                                <StatCard color={stat.color}>
                                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box>
                                                <Typography variant="h3" sx={{
                                                    fontWeight: 800,
                                                    color: theme.palette[stat.color].main
                                                }}>
                                                    {stat.value}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {stat.label}
                                                </Typography>
                                            </Box>
                                            <Avatar sx={{
                                                backgroundColor: alpha(theme.palette[stat.color].main, 0.1),
                                                color: theme.palette[stat.color].main
                                            }}>
                                                {stat.icon}
                                            </Avatar>
                                        </Box>
                                    </CardContent>
                                </StatCard>
                            </Grow>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Filtri */}
            {selectedChecklistId && !loadingGaps && gaps.length > 0 && (
                <Fade in timeout={1000}>
                    <Paper sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(10px)'
                    }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <FilterListIcon color="action" />
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Area</InputLabel>
                                <Select
                                    name="area"
                                    value={filters.area}
                                    label="Area"
                                    onChange={handleFilterChange}
                                >
                                    <MenuItem value="">Tutte</MenuItem>
                                    <MenuItem value="B">Organizzativa</MenuItem>
                                    <MenuItem value="C">Amministrativa</MenuItem>
                                    <MenuItem value="D">Contabile</MenuItem>
                                    <MenuItem value="E">Rilevazione Crisi</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Rischio</InputLabel>
                                <Select
                                    name="livello_rischio"
                                    value={filters.livello_rischio}
                                    label="Rischio"
                                    onChange={handleFilterChange}
                                >
                                    <MenuItem value="">Tutti</MenuItem>
                                    <MenuItem value="alto">Alto</MenuItem>
                                    <MenuItem value="medio">Medio</MenuItem>
                                    <MenuItem value="basso">Basso</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Paper>
                </Fade>
            )}

            {/* Lista Gap */}
            {selectedChecklistId && (
                <GlassCard sx={{ p: 3, mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <SecurityIcon sx={{ mr: 1, color: theme.palette.error.main }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Gap Rilevati
                            {!loadingGaps && ` (${filteredGaps.length} visualizzati su ${gaps.length} totali)`}
                        </Typography>
                    </Box>
                    {loadingGaps ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                            <CircularProgress />
                        </Box>
                    ) : errorGaps ? (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                            {errorGaps}
                        </Alert>
                    ) : gaps.length === 0 ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            Nessun gap rilevato per la checklist selezionata.
                        </Alert>
                    ) : filteredGaps.length === 0 ? (
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                            Nessun gap trovato con i filtri applicati.
                        </Alert>
                    ) : (
                        <Grid container spacing={3}>
                            {filteredGaps.map((gap, index) => (
                                <Grid item xs={12} md={6} key={gap._id}>
                                    <Zoom in timeout={200 * (index + 1)}>
                                        <GlassCard sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderLeft: `4px solid ${theme.palette[getRiskColor(gap.livello_rischio)].main}`
                                        }}>
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                    <RiskChip
                                                        icon={getRiskIcon(gap.livello_rischio)}
                                                        label={getRiskLabel(gap.livello_rischio)}
                                                        risk={gap.livello_rischio}
                                                        size="small"
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {gap.item_id}
                                                    </Typography>
                                                </Box>

                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                                    {gap.domandaText || 'Testo domanda non disponibile'}
                                                </Typography>

                                                <Typography variant="body2" sx={{ mb: 2 }}>
                                                    <strong>Gap:</strong> {gap.descrizione}
                                                </Typography>

                                                {gap.descrizione_arricchita_ai && (
                                                    <Paper sx={{
                                                        p: 2,
                                                        mb: 2,
                                                        backgroundColor: alpha(theme.palette.info.main, 0.05),
                                                        border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                                                        borderRadius: 2
                                                    }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <AutoAwesomeIcon sx={{ fontSize: 16, mr: 0.5, color: theme.palette.info.main }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                                                                Analisi AI
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                            {gap.descrizione_arricchita_ai}
                                                        </Typography>
                                                    </Paper>
                                                )}

                                                {gap.arricchitoConAI && (
                                                    <>
                                                        <Divider sx={{ my: 2 }}>
                                                            <Chip label="Dettagli AI" size="small" sx={{
                                                                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                                                                color: theme.palette.secondary.main
                                                            }} />
                                                        </Divider>

                                                        {/* Implicazioni Dettagliate (AI) */}
                                                        {gap.implicazioni_dettagliate_ai && gap.implicazioni_dettagliate_ai.length > 0 && (
                                                            <Box sx={{ mb: 2 }}>
                                                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>Implicazioni Dettagliate (AI):</Typography>
                                                                <List dense disablePadding sx={{ pl: 1 }}>
                                                                    {gap.implicazioni_dettagliate_ai.map((imp, idx) => (
                                                                        <ListItem key={`imp-ai-${idx}`} sx={{ py: 0 }}><ListItemText primaryTypographyProps={{ variant: 'caption' }} primary={`• ${imp}`} /></ListItem>
                                                                    ))}
                                                                </List>
                                                            </Box>
                                                        )}
                                                        
                                                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                                                            {/* Impatto Stimato (AI) */}
                                                            {gap.impattoStimatoAI && gap.impattoStimatoAI.livello && gap.impattoStimatoAI.livello !== 'non determinabile' && (
                                                                <Box>
                                                                    <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                                                                        Impatto Stimato (AI):
                                                                    </Typography>
                                                                    <Tooltip title={gap.impattoStimatoAI.descrizione || ''} arrow>
                                                                        <Chip
                                                                            label={`${gap.impattoStimatoAI.tipo || 'N/D'} - ${getRiskLabel(gap.impattoStimatoAI.livello)}`}
                                                                            color={getRiskColor(gap.impattoStimatoAI.livello)}
                                                                            size="small"
                                                                            sx={{ textTransform: 'capitalize' }}
                                                                        />
                                                                    </Tooltip>
                                                                </Box>
                                                            )}

                                                            {/* Priorità Risoluzione (AI) */}
                                                            {gap.prioritaRisoluzioneAI && (
                                                                <Box>
                                                                    <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                                                                        Priorità Risoluzione (AI):
                                                                    </Typography>
                                                                    <Chip
                                                                        label={getRiskLabel(gap.prioritaRisoluzioneAI)}
                                                                        color={getRiskColor(gap.prioritaRisoluzioneAI)}
                                                                        size="small"
                                                                        sx={{ textTransform: 'capitalize' }}
                                                                    />
                                                                </Box>
                                                            )}
                                                        </Stack>

                                                        {/* Riferimenti Normativi (AI) */}
                                                        {gap.riferimentiNormativiSpecificiAI && gap.riferimentiNormativiSpecificiAI.length > 0 && (
                                                            <Box sx={{ mb: 2 }}>
                                                                <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>Riferimenti Normativi (AI):</Typography>
                                                                <List dense disablePadding sx={{ fontSize: '0.75rem', pl: 1 }}>
                                                                    {gap.riferimentiNormativiSpecificiAI.map((ref, idx) => (
                                                                        <ListItem key={`norm-ai-${idx}`} sx={{ py: 0 }}><ListItemText primaryTypographyProps={{ variant: 'caption', fontStyle: 'italic' }} primary={`• ${ref}`} /></ListItem>
                                                                    ))}
                                                                </List>
                                                            </Box>
                                                        )}

                                                        {/* Suggerimenti Intervento (AI) */}
                                                        {gap.suggerimenti_ai && gap.suggerimenti_ai.length > 0 && (
                                                            <Box sx={{ mb: 2 }}>
                                                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>Suggerimenti Intervento (AI):</Typography>
                                                                <List dense disablePadding>
                                                                    {gap.suggerimenti_ai.map((sugg, idx) => (
                                                                        <ListItem key={`sugg-ai-${idx}`} sx={{ py: 0 }}>
                                                                            <ListItemIcon sx={{ minWidth: 20 }}>
                                                                                <BuildIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                                                                            </ListItemIcon>
                                                                            <ListItemText
                                                                                primary={sugg}
                                                                                primaryTypographyProps={{ variant: 'caption' }}
                                                                            />
                                                                        </ListItem>
                                                                    ))}
                                                                </List>
                                                            </Box>
                                                        )}
                                                    </>
                                                )}

                                                {gap.ultimaAnalisiCauseRadice && (
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2, fontStyle: 'italic' }}>
                                                        Ultima analisi cause radice: {new Date(gap.ultimaAnalisiCauseRadice).toLocaleDateString()}
                                                        {gap.causeRadiceSuggeriteAI && gap.causeRadiceSuggeriteAI.length > 0 && (
                                                            <Button
                                                                size="small"
                                                                onClick={() => {
                                                                    setCurrentRootCauses(gap.causeRadiceSuggeriteAI || []);
                                                                    setModalGapTitle(gap.descrizione || `Dettaglio Gap ${gap.item_id}`);
                                                                    setShowRootCauseModal(true);
                                                                    setRootCauseError(null);
                                                                }}
                                                                sx={{ ml: 1, textTransform: 'none', fontSize: '0.75rem' }}
                                                            >
                                                                (Vedi Analisi)
                                                            </Button>
                                                        )}
                                                    </Typography>
                                                )}
                                            </CardContent>
                                            <CardActions sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Tooltip title="Analizza Cause Radice con AI">
                                                    <span>
                                                        <IconButton
                                                            color="secondary"
                                                            onClick={() => startRelatedGapsSelection(gap)}
                                                            disabled={analyzingRootCauseFor === gap._id || !selectedChecklistId}
                                                            sx={{
                                                                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                                                                '&:hover': {
                                                                    backgroundColor: alpha(theme.palette.secondary.main, 0.2)
                                                                }
                                                            }}
                                                        >
                                                            {analyzingRootCauseFor === gap._id ? (
                                                                <CircularProgress size={22} color="inherit" />
                                                            ) : (
                                                                <TroubleshootIcon />
                                                            )}
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <AnimatedButton
                                                    variant="contained"
                                                    size="small"
                                                    component={RouterLink}
                                                    to={`/progettazione/interventi`}
                                                    state={{ prefillFromGap: gap }}
                                                    startIcon={<BuildIcon />}
                                                    sx={{
                                                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                                        color: 'white'
                                                    }}
                                                >
                                                    Crea Intervento
                                                </AnimatedButton>
                                            </CardActions>
                                        </GlassCard>
                                    </Zoom>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </GlassCard>
            )}

            {/* Risultati Analisi Aggregata */}
            {selectedChecklistId && aggregatedRCAData && aggregatedRCAData.statusAnalisi === 'COMPLETED' && (
                <Fade in timeout={1200}>
                    <Paper sx={{
                        p: { xs: 2, sm: 3 },
                        mb: 4,
                        borderRadius: 3,
                        border: `2px dashed ${theme.palette.info.main}`,
                        backgroundColor: alpha(theme.palette.info.main, 0.02)
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <PollIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.info.dark }}>
                                Risultati Analisi Cause Radice Complessive
                            </Typography>
                        </Box>

                        {aggregatedRCAData.summaryAnalisiCauseAI && (
                            <Paper sx={{
                                mb: 3,
                                p: 3,
                                backgroundColor: alpha(theme.palette.info.main, 0.05),
                                borderRadius: 2,
                                borderLeft: `4px solid ${theme.palette.info.main}`
                            }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                    Sintesi AI dell'Analisi Causale:
                                </Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                                    {aggregatedRCAData.summaryAnalisiCauseAI}
                                </Typography>
                            </Paper>
                        )}

                        {aggregatedRCAData.causeIdentificate && aggregatedRCAData.causeIdentificate.length > 0 ? (
                            aggregatedRCAData.causeIdentificate.map((causa, index) => (
                                <StyledAccordion key={causa.idCausa || index} defaultExpanded={index < 2}>
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        sx={{
                                            backgroundColor: causa.rilevanzaComplessiva === 'critica' ? alpha(theme.palette.error.main, 0.05) :
                                                causa.rilevanzaComplessiva === 'alta' ? alpha(theme.palette.warning.main, 0.05) :
                                                    alpha(theme.palette.grey[500], 0.05)
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                                            <Chip
                                                label={`Rilevanza: ${causa.rilevanzaComplessiva || 'N/D'}`}
                                                size="small"
                                                color={
                                                    causa.rilevanzaComplessiva === 'critica' || causa.rilevanzaComplessiva === 'alta' ? 'error' :
                                                        causa.rilevanzaComplessiva === 'media' ? 'warning' : 'default'
                                                }
                                            />
                                            <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>
                                                {index + 1}. {causa.testoCausa}
                                            </Typography>
                                            {causa.categoriaCausa && (
                                                <Chip
                                                    label={causa.categoriaCausa}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            )}
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 3 }}>
                                        <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                                            <strong>Descrizione Dettagliata (AI):</strong> {causa.descrizioneDettagliataAI || "N/D"}
                                        </Typography>

                                        {causa.gapDirettamenteImplicati && causa.gapDirettamenteImplicati.length > 0 && (
                                            <Box sx={{ my: 2 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                                                    Gap Principalmente Influenzati:
                                                </Typography>
                                                <List dense disablePadding>
                                                    {causa.gapDirettamenteImplicati.map(g => (
                                                        <ListItem key={g.gapRefId || g.gapItemId} sx={{ py: 0.5 }}>
                                                            <ListItemIcon sx={{ minWidth: 20 }}>
                                                                <WarningIcon fontSize="small" color="action" />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={`${g.gapItemId}: ${g.gapDescrizioneBreve || 'Vedi dettaglio gap'}`}
                                                                primaryTypographyProps={{ variant: 'caption' }}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Box>
                                        )}

                                        {causa.suggerimentiInterventoStrategicoAI && causa.suggerimentiInterventoStrategicoAI.length > 0 && (
                                            <Box sx={{ my: 2 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                                                    Suggerimenti Strategici d'Intervento:
                                                </Typography>
                                                <List dense disablePadding>
                                                    {causa.suggerimentiInterventoStrategicoAI.map((sugg, i) => (
                                                        <ListItem key={`sugg-strat-${i}`} sx={{ py: 0.5 }}>
                                                            <ListItemIcon sx={{ minWidth: 20 }}>
                                                                <BuildIcon fontSize="small" color="primary" />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                secondary={sugg}
                                                                secondaryTypographyProps={{ variant: 'caption' }}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Box>
                                        )}
                                        <Box sx={{ textAlign: 'right', mt: 2 }}>
                                            <AnimatedButton
                                                size="small"
                                                variant="outlined"
                                                startIcon={<BuildIcon />}
                                                onClick={() => {
                                                    const categoriaMappata = causa.categoriaCausa ? mapCategoriaToArea(causa.categoriaCausa) : 'Altro';
                                                    navigate('/progettazione/interventi', {
                                                        state: {
                                                            prefillFromAggregatedRCA: {
                                                                titolo: `Risolvere Causa Radice: ${causa.testoCausa.substring(0, 50)}...`,
                                                                descrizione: `Intervento strategico per affrontare la causa radice sistemica: '${causa.testoCausa}'.\n\nDettaglio fornito dall'AI sulla causa:\n${causa.descrizioneDettagliataAI}\n\nGap principali influenzati (Item ID):\n${causa.gapDirettamenteImplicati?.map(g => g.gapItemId).join(', ') || 'Vari'}`,
                                                                area: categoriaMappata,
                                                                priorita: mapRilevanzaToPriorita(causa.rilevanzaComplessiva)
                                                            }
                                                        }
                                                    });
                                                }}
                                            >
                                                Crea Intervento da Causa
                                            </AnimatedButton>
                                        </Box>
                                    </AccordionDetails>
                                </StyledAccordion>
                            ))
                        ) : (
                            aggregatedRCAData.statusAnalisi === 'COMPLETED' && (
                                <Alert severity="info" sx={{ mt: 1, borderRadius: 2 }}>
                                    Nessuna causa radice aggregata è stata identificata dall'analisi AI per i gap selezionati.
                                </Alert>
                            )
                        )}
                    </Paper>
                </Fade>
            )}

            {/* Modali */}
            <SelectRelatedGapsModal
                open={showSelectRelatedGapsModal}
                onClose={() => {
                    setShowSelectRelatedGapsModal(false);
                    setSelectedRelatedGapIds([]);
                    setCurrentGapForRelatedSelection(null);
                }}
                onConfirm={handleConfirmRelatedGaps}
                allGaps={gaps}
                mainGapId={currentGapForRelatedSelection?._id}
            />

            <RootCauseModal
                open={showRootCauseModal}
                onClose={() => {
                    setShowRootCauseModal(false);
                    setCurrentRootCauses([]);
                    setRootCauseError(null);
                    setModalGapTitle('');
                }}
                causes={currentRootCauses}
                gapTitle={modalGapTitle}
                error={rootCauseError}
            />
        </Box>
    );
};

export default GapAnalysisPage;