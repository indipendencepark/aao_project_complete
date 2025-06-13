import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, Divider,
    Alert, FormControl, InputLabel, Select, MenuItem, List, ListItem,
    ListItemIcon, ListItemText, Chip, CircularProgress, IconButton,
    Accordion, AccordionSummary, AccordionDetails, Link as MuiLink, Tooltip, Stack,
    Fade, Grow, Zoom, Container, Skeleton, CardActions, Avatar, LinearProgress,
    useTheme, alpha, styled, keyframes
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import RecommendIcon from '@mui/icons-material/Recommend';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LaunchIcon from '@mui/icons-material/Launch';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import BuildIcon from '@mui/icons-material/Build';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SecurityIcon from '@mui/icons-material/Security';

// Animazioni avanzate
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const slideInUp = keyframes`
  from { 
    opacity: 0;
    transform: translateY(30px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
`;

// Componenti stilizzati
const GlassCard = styled(Card)(({ theme }) => ({
    backdropFilter: 'blur(20px)',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: theme.spacing(3),
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
        transform: 'translateY(-8px) scale(1.02)',
        boxShadow: `0 25px 50px ${alpha(theme.palette.primary.main, 0.15)}`,
        '& .card-glow': {
            opacity: 1,
        }
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

const AnimatedButton = styled(Button)(({ theme }) => ({
    borderRadius: theme.spacing(3),
    textTransform: 'none',
    fontWeight: 600,
    padding: theme.spacing(1.5, 3),
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.4)}, transparent)`,
        transition: 'left 0.5s'
    },
    '&:hover::after': {
        left: '100%'
    }
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
    const getStatusStyle = () => {
        switch (status) {
            case 'completata':
                return {
                    background: `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
                    color: theme.palette.success.contrastText,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`
                };
            case 'in_corso':
                return {
                    background: `linear-gradient(135deg, ${theme.palette.info.light} 0%, ${theme.palette.info.main} 100%)`,
                    color: theme.palette.info.contrastText,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`
                };
            default:
                return {
                    background: `linear-gradient(135deg, ${theme.palette.grey[400]} 0%, ${theme.palette.grey[600]} 100%)`,
                    color: theme.palette.common.white,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.grey[500], 0.3)}`
                };
        }
    };
    return {
        ...getStatusStyle(),
        fontWeight: 700,
        padding: theme.spacing(0.5, 2),
        height: 32,
        fontSize: '0.85rem',
        '& .MuiChip-icon': {
            color: 'inherit'
        }
    };
});

const MetricCard = styled(Card)(({ theme, color = 'primary' }) => ({
    borderRadius: theme.spacing(3),
    background: `linear-gradient(135deg, ${alpha(theme.palette[color].light, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.1)} 100%)`,
    border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 20px 40px ${alpha(theme.palette[color].main, 0.2)}`
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        top: -50,
        right: -50,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: alpha(theme.palette[color].main, 0.1),
        animation: `${float} 6s ease-in-out infinite`
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
        boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.15)}`
    }
}));

const ActionCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.spacing(3),
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    border: `2px dashed ${theme.palette.primary.main}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    '&:hover': {
        transform: 'scale(1.02)',
        borderColor: theme.palette.secondary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.05)
    }
}));

const LoadingCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.spacing(3),
    background: `linear-gradient(90deg, ${theme.palette.grey[100]} 0%, ${theme.palette.grey[200]} 50%, ${theme.palette.grey[100]} 100%)`,
    backgroundSize: '200% 100%',
    animation: `${shimmer} 1.5s ease-in-out infinite`,
}));

// Funzioni helper
const getGiudizioColor = (giudizio) => {
    switch (giudizio?.toUpperCase()) {
        case 'INADEGUATO': return 'error';
        case 'PARZIALMENTE ADEGUATO': return 'warning';
        case 'ADEGUATO': return 'success';
        case 'ADEGUATO (CON GAP MINORI)': return 'info';
        default: return 'default';
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

const getRiskLabel = (level) => level?.charAt(0).toUpperCase() + level?.slice(1) || level || 'N/D';

const getRiskIcon = (level) => {
    switch (level) {
        case 'alto': return <ErrorIcon color="error" fontSize="small"/>;
        case 'medio': return <WarningIcon color="warning" fontSize="small"/>;
        case 'basso': return <CheckCircleIcon color="success" fontSize="small"/>;
        default: return null;
    }
};

const getAreaLabel = (areaCode) => {
    switch(areaCode){
        case 'Org': return 'Assetto Organizzativo';
        case 'Admin': return 'Assetto Amministrativo';
        case 'Acct': return 'Assetto Contabile';
        case 'Crisi': return 'Rilevazione Crisi';
        default: return areaCode || 'Altro';
    }
};

const ReportPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const [checklists, setChecklists] = useState([]);
    const [selectedChecklistId, setSelectedChecklistId] = useState('');
    const [reportData, setReportData] = useState(null);
    const [loadingChecklists, setLoadingChecklists] = useState(false);
    const [loadingReport, setLoadingReport] = useState(false);
    const [errorChecklists, setErrorChecklists] = useState(null);
    const [errorReport, setErrorReport] = useState(null);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [generatingInterventions, setGeneratingInterventions] = useState(false);
    const [generatingPlan, setGeneratingPlan] = useState(false);
    const [generationMessage, setGenerationMessage] = useState({ type: '', text: '', planId: null });
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '', planId: null });
    const [reportDocumentId, setReportDocumentId] = useState(null);

    useEffect(() => {
        const fetchChecklistList = async () => {
            setLoadingChecklists(true);
            setErrorChecklists(null);
            try {
                const response = await axios.get('http://localhost:5001/api/checklist');
                setChecklists(response.data.data || []);
            } catch (err) {
                setErrorChecklists(err.response?.data?.message || 'Errore recupero checklist.');
            } finally {
                setLoadingChecklists(false);
            }
        };
        fetchChecklistList();
    }, []);

    useEffect(() => {
        setGenerationMessage({ type: '', text: '' });
        const fetchOrGenerateReport = async (force = false) => {
            if (!selectedChecklistId) {
                setReportData(null);
                setErrorReport(null);
                setReportDocumentId(null);
                return;
            }
            setLoadingReport(true);
            setErrorReport(null);
            setReportData(null);
            setReportDocumentId(null);
            try {
                const url = `http://localhost:5001/api/report?checklist_id=${selectedChecklistId}${force ? '&force_generate=true' : ''}`;
                const response = await axios.get(url);
                
                if (response.data && response.data.data) {
                    setReportData(response.data.data);
                    setReportDocumentId(response.data.data._id);
                    if (force) {
                        setGenerationMessage({ type: 'success', text: 'Report rigenerato con successo!' });
                    }
                } else {
                    throw new Error("Dati del report non validi ricevuti.");
                }
            } catch (err) {
                setErrorReport(err.response?.data?.message || err.message || 'Errore recupero dati report.');
                setReportData(null);
            } finally {
                setLoadingReport(false);
            }
        };

        if (selectedChecklistId) {
            fetchOrGenerateReport(false);
        }
    }, [selectedChecklistId]);

    const handleForceRegenerateReport = () => {
        if (selectedChecklistId) {
            const fetchForced = async () => {
                setLoadingReport(true);
                setErrorReport(null);
                setReportData(null);
                setReportDocumentId(null);
                setGenerationMessage({ type: 'info', text: 'Rigenerazione report in corso...' });
                try {
                    const url = `http://localhost:5001/api/report?checklist_id=${selectedChecklistId}&force_generate=true`;
                    const response = await axios.get(url);
                    if (response.data && response.data.data) {
                        setReportData(response.data.data);
                        setReportDocumentId(response.data.data._id);
                        setGenerationMessage({ type: 'success', text: 'Report rigenerato con successo!' });
                    } else {
                        throw new Error("Dati del report non validi.");
                    }
                } catch (err) {
                    setErrorReport(err.response?.data?.message || err.message || 'Errore rigenerazione report.');
                    setGenerationMessage({ type: 'error', text: `Errore rigenerazione: ${err.response?.data?.message || err.message}` });
                } finally {
                    setLoadingReport(false);
                }
            };
            fetchForced();
        }
    };

    const handleExportPDF = async () => {
        if (!reportDocumentId || !reportData) {
            setErrorReport("Dati del report non disponibili o ID report mancante per l'esportazione.");
            return;
        }
        setExportingPdf(true);
        setErrorReport(null);
        setGenerationMessage({ type: '', text: '' });

        let fileURL = null;

        try {
            const response = await axios.post(
                `http://localhost:5001/api/export/report/${reportDocumentId}/pdf`,
                {}, { timeout: 90000 }
            );

            const { fileName, pdfBase64, mimeType } = response.data;

            if (!pdfBase64 || !fileName || !mimeType || pdfBase64.length < 100) {
                throw new Error("Dati Base64 ricevuti non validi.");
            }

            const byteCharacters = atob(pdfBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const fileBlob = new Blob([byteArray], { type: mimeType });

            if (fileBlob.size === 0) {
                throw new Error("File PDF ricostruito vuoto.");
            }

            fileURL = URL.createObjectURL(fileBlob);
            const link = document.createElement('a');
            link.href = fileURL;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            if (link.parentNode) {
                link.parentNode.removeChild(link);
            }

        } catch (error) {
            let errorMsg = `Errore generazione/download PDF: ${error.message}`;
            if (error.response && error.response.data?.message) {
                errorMsg = error.response.data.message;
            }
            setErrorReport(errorMsg);
        } finally {
            if (fileURL) {
                URL.revokeObjectURL(fileURL);
            }
            setExportingPdf(false);
        }
    };

    const handleGenerateInterventionsOnly = async () => {
        if (!selectedChecklistId) return;
        setGeneratingInterventions(true);
        setStatusMessage({ type: '', text: '', planId: null });
        setErrorReport(null);
        try {
            const response = await axios.post(
                'http://localhost:5001/api/interventions/generate-from-checklist',
                { checklistId: selectedChecklistId }
            );
            setStatusMessage({
                type: 'success',
                text: `${response.data.message || 'Interventi suggeriti generati/aggiornati.'} (${response.data.data?.generatedCount || 0} trovati/creati).`,
                planId: null
            });
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Errore sconosciuto durante la generazione degli interventi.";
            setStatusMessage({ type: 'error', text: errorMsg, planId: null });
        } finally {
            setGeneratingInterventions(false);
        }
    };

    const handleCreatePlanFromAI = async () => {
        if (!selectedChecklistId) return;
        setGeneratingPlan(true);
        setStatusMessage({ type: '', text: '', planId: null });
        setErrorReport(null);
        try {
            const response = await axios.post(
                'http://localhost:5001/api/action-plan/generate-ai',
                { checklistId: selectedChecklistId }
            );
            const newPlan = response.data.data;
            const message = response.data.message || 'Piano d\'azione generato con successo.';
            setStatusMessage({
                type: 'success',
                text: `${message} (ID: ${newPlan?._id}). Sarai reindirizzato...`,
                planId: newPlan?._id || null
            });
            if (newPlan?._id) {
                setTimeout(() => {
                    navigate(`/progettazione/piano-azione?view=${newPlan._id}`);
                }, 2000);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Errore sconosciuto durante la creazione del piano AI.";
            setStatusMessage({ type: 'error', text: errorMsg, planId: null });
        } finally {
            setGeneratingPlan(false);
        }
    };

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

            <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <Fade in timeout={600}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" sx={{
                            fontWeight: 800,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1
                        }}>
                            Report Diagnostico Avanzato
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Analisi completa e generazione automatica di report professionali
                        </Typography>
                    </Box>
                </Fade>

                {/* Selezione Checklist */}
                <Grow in timeout={800}>
                    <GlassCard sx={{ p: 3, mb: 3 }}>
                        <Box
                            className="card-glow"
                            sx={{
                                position: 'absolute',
                                top: -2,
                                left: -2,
                                right: -2,
                                bottom: -2,
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                borderRadius: theme.spacing(3),
                                opacity: 0,
                                transition: 'opacity 0.3s ease',
                                zIndex: -1
                            }}
                        />
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                            <AnalyticsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                            Seleziona Checklist per Report
                        </Typography>
                        <FormControl fullWidth sx={{ mt: 2 }} disabled={loadingChecklists || loadingReport || generatingInterventions}>
                            <InputLabel id="checklist-select-label">Checklist da Analizzare</InputLabel>
                            <Select
                                labelId="checklist-select-label"
                                value={selectedChecklistId}
                                label="Checklist da Analizzare"
                                onChange={(e) => setSelectedChecklistId(e.target.value)}
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value=""><em>Nessuna selezionata</em></MenuItem>
                                {loadingChecklists && <MenuItem value="" disabled>Caricamento...</MenuItem>}
                                {!loadingChecklists && checklists.length === 0 && <MenuItem value="" disabled>{errorChecklists ? 'Errore caricamento' : 'Nessuna checklist trovata'}</MenuItem>}
                                {checklists.map((cl) => (
                                    <MenuItem key={cl._id} value={cl._id}>
                                        {cl.nome} ({cl.cliente?.nome}) - {new Date(cl.data_creazione).toLocaleDateString('it-IT')}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {errorChecklists && (
                            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                                {errorChecklists}
                            </Alert>
                        )}
                    </GlassCard>
                </Grow>

                {/* Loading State */}
                {selectedChecklistId && loadingReport && (
                    <Box sx={{ my: 4 }}>
                        <Grid container spacing={3}>
                            {[1, 2, 3].map((i) => (
                                <Grid item xs={12} md={4} key={i}>
                                    <LoadingCard sx={{ height: 120 }} />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {/* Error State */}
                {selectedChecklistId && errorReport && !generatingInterventions && (
                    <Zoom in timeout={400}>
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setErrorReport(null)}>
                            {errorReport}
                        </Alert>
                    </Zoom>
                )}

                {/* Info State */}
                {!selectedChecklistId && !loadingChecklists && (
                    <Fade in timeout={800}>
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
                            Seleziona una checklist per generare il report diagnostico
                        </Alert>
                    </Fade>
                )}

                {/* Report Content */}
                {reportData && !loadingReport && selectedChecklistId && (
                    <Fade in timeout={1000}>
                        <GlassCard sx={{ p: 4, mb: 4 }}>
                            {/* Header Report */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, mb: 1 }}>
                                        <DescriptionIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                                        {reportData.checklistInfo?.nome || 'Report Diagnostico AAO'}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                                        Cliente: <strong>{reportData.clienteInfo?.nome}</strong>
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                        <StatusChip
                                            label={`Stato: ${reportData.checklistInfo?.stato}`}
                                            status={reportData.checklistInfo?.stato}
                                            size="small"
                                        />
                                        {reportData.checklistInfo?.percentuale_completamento !== undefined && (
                                            <Chip
                                                label={`${reportData.checklistInfo.percentuale_completamento}% Completato`}
                                                color="info"
                                                size="small"
                                            />
                                        )}
                                    </Stack>
                                    {reportData.data_generazione && (
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            Report Generato il: {new Date(reportData.data_generazione).toLocaleString('it-IT')}
                                            {reportData.versioneReport && ` (Versione: ${reportData.versioneReport})`}
                                        </Typography>
                                    )}
                                </Box>

                                <Stack direction="row" spacing={1} sx={{ mt: { xs: 2, md: 0 } }}>
                                    <Tooltip title="Forza la rigenerazione completa dei dati di questo report">
                                        <AnimatedButton
                                            variant="outlined"
                                            size="medium"
                                            onClick={handleForceRegenerateReport}
                                            startIcon={loadingReport && generationMessage.text?.includes('Rigenerazione') ? <CircularProgress size={16} color="inherit"/> : <RefreshIcon />}
                                            disabled={loadingReport || exportingPdf || generatingInterventions || generatingPlan || !selectedChecklistId}
                                        >
                                            {loadingReport && generationMessage.text?.includes('Rigenerazione') ? 'Rigenero...' : 'Aggiorna Report'}
                                        </AnimatedButton>
                                    </Tooltip>
                                    
                                    <Tooltip title="Esporta il report in formato PDF">
                                        <AnimatedButton
                                            variant="contained"
                                            size="medium"
                                            startIcon={exportingPdf ? <CircularProgress size={16} color="inherit"/> : <PictureAsPdfIcon />}
                                            onClick={handleExportPDF}
                                            disabled={exportingPdf || loadingReport || !reportDocumentId || generatingInterventions || generatingPlan}
                                            sx={{
                                                background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                                                color: 'white'
                                            }}
                                        >
                                            {exportingPdf ? 'Esporto PDF...' : 'Esporta PDF'}
                                        </AnimatedButton>
                                    </Tooltip>
                                </Stack>
                            </Box>
                            
                            {/* Messages */}
                            {generationMessage.text && (
                                <Zoom in timeout={400}>
                                    <Alert
                                        severity={generationMessage.type || 'info'}
                                        sx={{ mb: 3, borderRadius: 2 }}
                                        onClose={generationMessage.type !== 'success' ? () => setGenerationMessage({ type:'', text: '', planId: null }) : undefined}
                                        action={
                                            generationMessage.type === 'success' && generationMessage.planId ? (
                                                <Button color="inherit" size="small" component={RouterLink} to={`/progettazione/piano-azione?view=${generationMessage.planId}`}>
                                                    Vedi Piano
                                                </Button>
                                            ) : null
                                        }
                                    >
                                        {generationMessage.text}
                                    </Alert>
                                </Zoom>
                            )}

                            {statusMessage.text && (
                                <Zoom in timeout={400}>
                                    <Alert
                                        severity={statusMessage.type || 'info'}
                                        sx={{ mb: 3, borderRadius: 2 }}
                                        onClose={statusMessage.type !== 'success' ? () => setStatusMessage({ type:'', text: '', planId: null }) : undefined}
                                        action={
                                            statusMessage.type === 'success' && !statusMessage.planId ? (
                                                <Button color="inherit" size="small" component={RouterLink} to="/progettazione/interventi">
                                                    Vedi Interventi
                                                </Button>
                                            ) : null
                                        }
                                    >
                                        {statusMessage.text}
                                    </Alert>
                                </Zoom>
                            )}

                            <Divider sx={{ my: 4 }}>
                                <Chip
                                    icon={<AutoAwesomeIcon />}
                                    label="Executive Summary"
                                    sx={{
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                        color: 'white',
                                        fontWeight: 700
                                    }}
                                />
                            </Divider>

                            {/* Executive Summary */}
                            <MetricCard color="primary" sx={{ mb: 4 }}>
                                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                                    {reportData.sintesi_esecutiva ? (
                                        <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                                            {reportData.sintesi_esecutiva}
                                        </Typography>
                                    ) : (
                                        <>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                    Giudizio Generale Adeguatezza:
                                                </Typography>
                                                <StatusChip
                                                    label={reportData.executiveSummaryBase?.giudizioGenerale || 'N/D'}
                                                    status={getGiudizioColor(reportData.executiveSummaryBase?.giudizioGenerale)}
                                                    sx={{ ml: 2 }}
                                                />
                                            </Box>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} md={6}>
                                                    <Paper elevation={0} sx={{ p: 3, backgroundColor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.success.dark, mb: 2, display: 'flex', alignItems: 'center' }}>
                                                            <CheckCircleIcon sx={{ mr: 1 }} />
                                                            Principali Aree di Forza
                                                        </Typography>
                                                        {reportData.executiveSummaryBase?.areeForza?.length > 0 ? (
                                                            <List dense disablePadding>
                                                                {reportData.executiveSummaryBase.areeForza.map((f, i) => (
                                                                    <ListItem key={`f-${i}`} disableGutters sx={{ py: 0.5 }}>
                                                                        <ListItemIcon sx={{minWidth: 28}}>
                                                                            <CheckCircleIcon fontSize="small" color="success" />
                                                                        </ListItemIcon>
                                                                        <ListItemText
                                                                            primary={f}
                                                                            primaryTypographyProps={{fontSize: '0.9rem', fontWeight: 500}}
                                                                        />
                                                                    </ListItem>
                                                                ))}
                                                            </List>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                Nessuna area di forza significativa rilevata.
                                                            </Typography>
                                                        )}
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Paper elevation={0} sx={{ p: 3, backgroundColor: alpha(theme.palette.error.main, 0.1), borderRadius: 2 }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.error.dark, mb: 2, display: 'flex', alignItems: 'center' }}>
                                                            <ErrorIcon sx={{ mr: 1 }} />
                                                            Aree di Debolezza ({reportData.executiveSummaryBase?.gapPrioritariCount || 0} Gap Prioritari)
                                                        </Typography>
                                                        {reportData.executiveSummaryBase?.areeDebolezza?.length > 0 ? (
                                                            <List dense disablePadding>
                                                                {reportData.executiveSummaryBase.areeDebolezza.map((d, i) => (
                                                                    <ListItem key={`d-${i}`} disableGutters sx={{ py: 0.5 }}>
                                                                        <ListItemIcon sx={{minWidth: 28}}>
                                                                            <ErrorIcon fontSize="small" color="error" />
                                                                        </ListItemIcon>
                                                                        <ListItemText
                                                                            primary={d}
                                                                            primaryTypographyProps={{fontSize: '0.9rem', fontWeight: 500}}
                                                                        />
                                                                    </ListItem>
                                                                ))}
                                                            </List>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                Nessuna area di debolezza prioritaria rilevata.
                                                            </Typography>
                                                        )}
                                                    </Paper>
                                                </Grid>
                                            </Grid>
                                        </>
                                    )}
                                </CardContent>
                            </MetricCard>

                            {/* Azioni AI */}
                            <ActionCard sx={{ p: 4, mb: 4 }}>
                                <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <SecurityIcon sx={{ mr: 1 }} />
                                    Azioni AI Basate sui Gap
                                </Typography>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                                    <Tooltip title="Analizza i gap (Alto/Medio) e crea/aggiorna la lista degli interventi suggeriti">
                                        <AnimatedButton
                                            variant="outlined"
                                            color="secondary"
                                            startIcon={generatingInterventions ? <CircularProgress size={20} color="inherit"/> : <AutoFixHighIcon />}
                                            onClick={handleGenerateInterventionsOnly}
                                            disabled={generatingInterventions || generatingPlan || loadingReport || !reportData.statisticheGap || reportData.statisticheGap.totalGaps === 0}
                                            sx={{
                                                borderWidth: 2,
                                                '&:hover': {
                                                    borderWidth: 2,
                                                    backgroundColor: alpha(theme.palette.secondary.main, 0.08)
                                                }
                                            }}
                                        >
                                            {generatingInterventions ? 'Genero...' : 'Genera/Aggiorna Interventi AI'}
                                        </AnimatedButton>
                                    </Tooltip>
                                    <Tooltip title="Crea automaticamente un nuovo Piano d'Azione completo">
                                        <AnimatedButton
                                            variant="contained"
                                            color="secondary"
                                            startIcon={generatingPlan ? <CircularProgress size={20} color="inherit"/> : <PlaylistAddCheckIcon />}
                                            onClick={handleCreatePlanFromAI}
                                            disabled={generatingInterventions || generatingPlan || loadingReport || !reportData.statisticheGap || reportData.statisticheGap.totalGaps === 0}
                                            sx={{
                                                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                                                color: 'white'
                                            }}
                                        >
                                            {generatingPlan ? 'Creo Piano...' : 'Crea Piano da Interventi AI'}
                                        </AnimatedButton>
                                    </Tooltip>
                                </Stack>
                            </ActionCard>

                            {/* Gap Analysis */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <TrendingUpIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                                    Elenco Gap Rilevati ({reportData.statisticheGap?.totalGaps || 0})
                                </Typography>
                                {reportData.elencoGapCompleto?.length > 0 ? (
                                    reportData.elencoGapCompleto.map((gap, index) => (
                                        <StyledAccordion key={gap._id || index} defaultExpanded={index < 3}>
                                            <AccordionSummary 
                                                expandIcon={<ExpandMoreIcon />} 
                                                sx={{ 
                                                    backgroundColor: alpha(theme.palette.background.default, 0.5),
                                                    borderRadius: 2
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                                                    <StatusChip
                                                        label={getRiskLabel(gap.livello_rischio)}
                                                        status={getRiskColor(gap.livello_rischio)}
                                                        size="small"
                                                    />
                                                    <Typography variant="body1" sx={{ fontWeight: 600, flexGrow: 1 }}>
                                                        {gap.item_id}: {gap.descrizione}
                                                    </Typography>
                                                </Box>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={12}>
                                                        <Typography variant="body2" sx={{ mb: 2 }}>
                                                            <strong>Domanda:</strong> {gap.domandaText || 'N/D'}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mb: 2 }}>
                                                            <strong>Implicazioni:</strong> {gap.implicazioni || 'Non specificate'}
                                                        </Typography>
                                                    </Grid>
                                                    {gap.suggerimenti_ai && gap.suggerimenti_ai.length > 0 && (
                                                        <Grid item xs={12}>
                                                            <Paper elevation={0} sx={{ p: 2, backgroundColor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center' }}>
                                                                    <AutoAwesomeIcon sx={{ mr: 1, fontSize: 16 }} />
                                                                    Suggerimenti AI:
                                                                </Typography>
                                                                <List dense disablePadding>
                                                                    {gap.suggerimenti_ai.map((sugg, i) => (
                                                                        <ListItem key={i} sx={{ py: 0.5 }}>
                                                                            <ListItemIcon sx={{minWidth: 25}}>
                                                                                <RecommendIcon fontSize="small" color="primary"/>
                                                                            </ListItemIcon>
                                                                            <ListItemText 
                                                                                primary={sugg}
                                                                                primaryTypographyProps={{fontSize: '0.9rem'}}
                                                                            />
                                                                        </ListItem>
                                                                    ))}
                                                                </List>
                                                            </Paper>
                                                        </Grid>
                                                    )}
                                                    <Grid item xs={12}>
                                                        <Box sx={{ textAlign: 'right', mt: 2 }}>
                                                            <AnimatedButton
                                                                size="small"
                                                                startIcon={<BuildIcon/>}
                                                                component={RouterLink}
                                                                to={`/progettazione/interventi`}
                                                                state={{ prefillFromGap: gap }}
                                                                variant="contained"
                                                                color="primary"
                                                            >
                                                                Crea Intervento Manuale
                                                            </AnimatedButton>
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            </AccordionDetails>
                                        </StyledAccordion>
                                    ))
                                ) : (
                                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                                        Nessun gap rilevato per questa checklist.
                                    </Alert>
                                )}
                            </Box>

                            {/* Raccomandazioni */}
                            <Box>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <RecommendIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                                    Raccomandazioni Generali
                                </Typography>
                                {reportData.raccomandazioni?.length > 0 ? (
                                    <Paper elevation={0} sx={{ p: 3, backgroundColor: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
                                        <List dense>
                                            {reportData.raccomandazioni.map((r, i) => (
                                                <ListItem key={`r-${i}`} sx={{ py: 1 }}>
                                                    <ListItemIcon>
                                                        <RecommendIcon color="success" />
                                                    </ListItemIcon>
                                                    <ListItemText 
                                                        primary={r}
                                                        primaryTypographyProps={{ fontWeight: 500 }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Paper>
                                ) : (
                                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                                        Nessuna raccomandazione specifica generata.
                                    </Alert>
                                )}
                            </Box>
                        </GlassCard>
                    </Fade>
                )}
            </Container>
        </Box>
    );
};

export default ReportPage;