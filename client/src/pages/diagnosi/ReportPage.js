

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, Divider,
    Alert, FormControl, InputLabel, Select, MenuItem, List, ListItem,
    ListItemIcon, ListItemText, Chip, CircularProgress, IconButton,
    Accordion, AccordionSummary, AccordionDetails, Link as MuiLink, Tooltip, Stack // Aggiunto Tooltip
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // Aggiunto useNavigate

import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import RecommendIcon from '@mui/icons-material/Recommend';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LaunchIcon from '@mui/icons-material/Launch';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'; // Icona per generazione interventi
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'; // Nuova icona per il bottone

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
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '', planId: null }); // planId usato solo per Crea Piano

    const navigate = useNavigate();

    useEffect(() => {
        const fetchChecklistList = async () => {
            setLoadingChecklists(true); setErrorChecklists(null);
            try {
                const response = await axios.get('http://localhost:5001/api/checklist');
                setChecklists(response.data.data || []);
            } catch (err) {
                console.error("Errore caricamento elenco checklist:", err);
                setErrorChecklists(err.response?.data?.message || 'Errore recupero checklist.');
            } finally { setLoadingChecklists(false); }
        };
        fetchChecklistList();
    }, []);

    useEffect(() => {
        setGenerationMessage({ type: '', text: '' }); // Reset messaggi generazione
        const fetchReportData = async () => {
            if (!selectedChecklistId) {
                setReportData(null);
                setErrorReport(null);
                return;
            };
            setLoadingReport(true); setErrorReport(null); setReportData(null);
            try {
                console.log(`>>> ReportPage: Fetching report for ${selectedChecklistId}`);
                const response = await axios.get(`http://localhost:5001/api/report?checklist_id=${selectedChecklistId}`);
                console.log(">>> ReportPage: Report data received:", response.data.data);
                if(response.data.data){
                     setReportData(response.data.data);
                } else {
                    throw new Error("Dati del report non validi ricevuti dal server.");
                }
            } catch (err) {
                 console.error(">>> ReportPage: Errore caricamento report:", err);
                 setErrorReport(err.response?.data?.message || err.message || 'Errore recupero dati report.');
                 setReportData(null);
            } finally { setLoadingReport(false); }
        };
        fetchReportData();
    }, [selectedChecklistId]);

    const handleExportPDF = async () => {
        if (!selectedChecklistId || !reportData) {
            console.warn("Tentativo di export PDF senza checklist selezionata o dati.");
            setErrorReport("Seleziona una checklist prima di esportare.");
            return;
        }

        setExportingPdf(true);
        setErrorReport(null);
        setGenerationMessage({ type: '', text: '' }); // Pulisci altri messaggi
        console.log(`Inizio richiesta export PDF per checklist: ${selectedChecklistId} (Metodo Base64 + Link)`);

        let fileURL = null;

        try {
            const response = await axios.post(
                `http://localhost:5001/api/export/report/${selectedChecklistId}/pdf`,
                {},
                { timeout: 90000 }
            );

            console.log("Risposta JSON con Base64 ricevuta dal backend.");
            const { fileName, pdfBase64, mimeType } = response.data;

            if (!pdfBase64 || !fileName || !mimeType || pdfBase64.length < 100) {
                throw new Error("Dati Base64 ricevuti non validi.");
            }

            console.log(`Ricevuti ${pdfBase64.length} caratteri Base64. Converto in Blob...`);
            const byteCharacters = atob(pdfBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
            const byteArray = new Uint8Array(byteNumbers);
            const fileBlob = new Blob([byteArray], { type: mimeType });
            console.log("Blob creato da Base64. Dimensione:", fileBlob.size);

            if (fileBlob.size === 0) { throw new Error("File PDF ricostruito vuoto."); }

            const reader = new FileReader();
            let readError = false;
            const readPromise = new Promise((resolve, reject) => {
                reader.onload = () => { console.log("FileReader: Lettura Blob OK."); resolve(); };
                reader.onerror = (e) => { console.error("FileReader: ERRORE!", e.target.error); readError = true; reject(e.target.error); };
                reader.readAsArrayBuffer(fileBlob);
            });
            await readPromise;
            if (readError) throw new Error("FileReader fallito.");
            console.log("FileReader: Verifica OK.");

            fileURL = URL.createObjectURL(fileBlob);
            console.log("URL Oggetto:", fileURL);
            const link = document.createElement('a');
            link.href = fileURL;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            console.log(`Download impostato: "${fileName}"`);
            link.click();
            console.log("Click simulato.");
             if (link.parentNode) { link.parentNode.removeChild(link); } // Rimuovi link

        } catch (error) {
            console.error("Errore Export PDF (Base64):", error);
            let errorMsg = `Errore generazione/download PDF: ${error.message}`;
             if (error.response && error.response.data?.message) { errorMsg = error.response.data.message; }
             setErrorReport(errorMsg);
        } finally {
             if (fileURL) { URL.revokeObjectURL(fileURL); console.log("URL Oggetto revocato."); }
            setExportingPdf(false);
            console.log("Export PDF terminato (client).");
        }
    };

     const handleGenerateInterventionsOnly = async () => {
        if (!selectedChecklistId) return;
        setGeneratingInterventions(true);
        setStatusMessage({ type: '', text: '', planId: null });
        setErrorReport(null);
        try {
            console.log(`>>> ReportPage: Richiesta generazione/aggiornamento INTERVENTI per ${selectedChecklistId}`);
            const response = await axios.post(
                'http://localhost:5001/api/interventions/generate-from-checklist',
                { checklistId: selectedChecklistId }
            );
            console.log(">>> ReportPage: Risposta generazione interventi:", response.data);
            setStatusMessage({
                type: 'success',
                text: `${response.data.message || 'Interventi suggeriti generati/aggiornati.'} (${response.data.data?.generatedCount || 0} trovati/creati).`,
                planId: null // Nessun piano creato qui
            });
        } catch (error) {
            console.error(">>> ReportPage: Errore generazione interventi:", error);
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
            console.log(`>>> ReportPage: Richiesta CREAZIONE PIANO AI per ${selectedChecklistId}`);
            const response = await axios.post(
                'http://localhost:5001/api/action-plan/generate-ai',
                { checklistId: selectedChecklistId }
            );
            console.log(">>> ReportPage: Risposta creazione piano AI:", response.data);
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
            console.error(">>> ReportPage: Errore creazione piano AI:", error);
            const errorMsg = error.response?.data?.message || error.message || "Errore sconosciuto durante la creazione del piano AI.";
            setStatusMessage({ type: 'error', text: errorMsg, planId: null });
        } finally {
            setGeneratingPlan(false);
        }
    };

  const handleGenerateActionPlanAI = async () => {
    if (!selectedChecklistId) return;

    setGeneratingPlan(true); // Usa nuovo stato
    setGenerationMessage({ type: '', text: '', planId: null }); // Resetta messaggio
    setErrorReport(null);

    try {
        console.log(`>>> ReportPage: Richiesta generazione PIANO AI per ${selectedChecklistId}`);

        const response = await axios.post(
            'http://localhost:5001/api/action-plan/generate-ai',
            { checklistId: selectedChecklistId }
        );
        console.log(">>> ReportPage: Risposta generazione piano AI:", response.data);

        const newPlan = response.data.data; // Il piano restituito dal backend
        const message = response.data.message || 'Piano d\'azione generato con successo.';

        setGenerationMessage({
            type: 'success',
            text: `${message} (ID: ${newPlan?._id})`,
            planId: newPlan?._id || null // Salva l'ID
        });

            if (newPlan?._id) {
                setTimeout(() => {
                    navigate(`/progettazione/piano-azione?view=${newPlan._id}`);
                }, 2000); // Ritardo 2 secondi
            }

    } catch (error) {
        console.error(">>> ReportPage: Errore generazione piano AI:", error);
        const errorMsg = error.response?.data?.message || error.message || "Errore sconosciuto durante la generazione del piano AI.";
        setGenerationMessage({ type: 'error', text: errorMsg, planId: null });
    } finally {
        setGeneratingPlan(false); // Usa nuovo stato
    }
};

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Report Diagnostico</Typography>

            {}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Seleziona Checklist</Typography>
                <FormControl fullWidth sx={{ mt: 1 }} disabled={loadingChecklists || loadingReport || generatingInterventions}>
                    <InputLabel id="checklist-select-label">Checklist da Analizzare</InputLabel>
                    <Select
                        labelId="checklist-select-label"
                        value={selectedChecklistId}
                        label="Checklist da Analizzare"
                        onChange={(e) => setSelectedChecklistId(e.target.value)}
                    >
                        <MenuItem value=""><em>Nessuna selezionata</em></MenuItem>
                        {loadingChecklists && <MenuItem value="" disabled>Caricamento...</MenuItem>}
                        {!loadingChecklists && checklists.length === 0 && <MenuItem value="" disabled>{errorChecklists ? 'Errore caricamento' : 'Nessuna checklist trovata'}</MenuItem>}
                        {checklists.map((cl) => (
                            <MenuItem key={cl._id} value={cl._id}>{cl.nome} ({cl.cliente?.nome}) - {new Date(cl.data_creazione).toLocaleDateString('it-IT')}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {errorChecklists && <Alert severity="error" sx={{mt:1}}>{errorChecklists}</Alert>}
            </Paper>

            {}
            {selectedChecklistId && loadingReport && ( <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box> )}
            {}
            {selectedChecklistId && errorReport && !generatingInterventions && ( <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorReport(null)}>{errorReport}</Alert> )}
            {!selectedChecklistId && !loadingChecklists && ( <Alert severity="info" sx={{ mb: 2 }}>Seleziona una checklist.</Alert> )}

            {}
            {reportData && !loadingReport && selectedChecklistId && (
                <Box>
                    <Paper sx={{ p: 3 }}>
                        {}
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                        <DescriptionIcon sx={{ mr: 1 }} /> {reportData.checklistInfo?.nome || 'Report Diagnostico AAO'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Cliente: {reportData.clienteInfo?.nome}</Typography>
                                    <Typography variant="caption" display="block" color="text.secondary">Stato Checklist: {reportData.checklistInfo?.stato} ({reportData.checklistInfo?.percentuale_completamento}%)</Typography>
                                </Box>
                                <Button id="export-pdf-button" variant="contained" size="small" startIcon={exportingPdf ? <CircularProgress size={16} color="inherit"/> : <PictureAsPdfIcon />} onClick={handleExportPDF} disabled={exportingPdf || loadingReport || generatingInterventions}>
                                    {exportingPdf ? 'Generazione...' : 'Esporta PDF'}
                                </Button>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                        </Box>

                         {}
                         {generationMessage.text && (
                            <Alert
                                severity={generationMessage.type || 'info'}
                                sx={{ mb: 2 }}
                                onClose={generationMessage.type !== 'success' ? () => setGenerationMessage({ type:'', text: '', planId: null }) : undefined} // Chiudibile solo se errore
                                action={

                                    generationMessage.type === 'success' && generationMessage.planId ? (
                                        <Button
                                            color="inherit"
                                            size="small"
                                            component={RouterLink}

                                            to={`/progettazione/piano-azione?view=${generationMessage.planId}`}
                                        >
                                            Vedi Piano
                                        </Button>
                                    ) : null
                                }
                            >
                                {generationMessage.text}
                            </Alert>
                         )}

                         {}

                         {}
                        {statusMessage.text && (
                            <Alert
                                severity={statusMessage.type || 'info'}
                                sx={{ mb: 2 }}
                                onClose={statusMessage.type !== 'success' ? () => setStatusMessage({ type:'', text: '', planId: null }) : undefined}
                                action={
                                    statusMessage.type === 'success' && statusMessage.planId ? (
                                        <Button  >...</Button>
                                    ) : statusMessage.type === 'success' && !statusMessage.planId ? ( // Successo generazione interventi
                                        <Button color="inherit" size="small" component={RouterLink} to="/progettazione/interventi">Vedi Interventi</Button>
                                     ) : null
                                }
                            >
                                {statusMessage.text}
                            </Alert>
                         )}

                        {}
                        <Box>
                            <Typography variant="h6" gutterBottom>Executive Summary</Typography>
                            <Card variant="outlined" sx={{ mb: 3, p: 2, bgcolor: '#f9f9f9'  }}>
                                {reportData.sintesi_esecutiva ? (

                                    <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                                        {reportData.sintesi_esecutiva}
                                    </Typography>
                                ) : (

                                    <>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Giudizio Generale Adeguatezza (Base): 
                                            <Chip 
                                                label={reportData.executiveSummaryBase?.giudizioGenerale || 'N/D'} 
                                                color={getGiudizioColor(reportData.executiveSummaryBase?.giudizioGenerale)}
                                                size="small" // Aggiunto per coerenza
                                                sx={{ ml: 1 }}
                                            />
                                        </Typography>
                                        <Grid container spacing={2} sx={{ mt: 0.5 }}> {}
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                                                    Principali Aree di Forza (Base):
                                                </Typography>
                                                {reportData.executiveSummaryBase?.areeForza?.length > 0 ? (
                                                    <List dense disablePadding>
                                                        {reportData.executiveSummaryBase.areeForza.map((f, i) => (
                                                            <ListItem key={`f-${i}`} disableGutters sx={{ py: 0 }}>
                                                                <ListItemIcon sx={{minWidth: 28}}><CheckCircleIcon fontSize="small" color="success" /></ListItemIcon>
                                                                <ListItemText secondary={f} secondaryTypographyProps={{fontSize: '0.8rem'}} />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                ) : (<Typography variant="caption" color="text.secondary">Nessuna area di forza significativa rilevata (analisi base).</Typography>)}
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', color: 'error.dark' }}>
                                                    Principali Aree di Debolezza (Base - Gap Prioritari: {reportData.executiveSummaryBase?.gapPrioritariCount || 0}):
                                                </Typography>
                                                {reportData.executiveSummaryBase?.areeDebolezza?.length > 0 ? (
                                                    <List dense disablePadding>
                                                        {reportData.executiveSummaryBase.areeDebolezza.map((d, i) => (
                                                            <ListItem key={`d-${i}`} disableGutters sx={{ py: 0 }}>
                                                                <ListItemIcon sx={{minWidth: 28}}><ErrorIcon fontSize="small" color="error" /></ListItemIcon>
                                                                <ListItemText secondary={d} secondaryTypographyProps={{fontSize: '0.8rem'}} />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                ) : (<Typography variant="caption" color="text.secondary">Nessuna area di debolezza prioritaria rilevata (analisi base).</Typography>)}
                                            </Grid>
                                        </Grid>
                                    </>
                                )}
                            </Card>
                        </Box>

                        {}
                        <Box>
                            <Typography variant="h6" gutterBottom>Analisi per Area</Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                               {reportData.analisiArea && Object.entries(reportData.analisiArea).map(([areaCode, giudizio]) => (
                                  <Grid item xs={12} sm={6} md={3} key={areaCode}>
                                      {}
                                  </Grid>
                               ))}
                            </Grid>
                        </Box>

                        {}
                        <Box sx={{ my: 3, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>Azioni AI Basate sui Gap</Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                                <Tooltip title="Analizza i gap (Alto/Medio) e crea/aggiorna la lista degli interventi suggeriti nel Modulo Progettazione, senza creare un piano d'azione.">
                                    <span> {}
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            startIcon={generatingInterventions ? <CircularProgress size={20} color="inherit"/> : <AutoFixHighIcon />}
                                            onClick={handleGenerateInterventionsOnly}

                                            disabled={generatingInterventions || generatingPlan || loadingReport || !reportData.statisticheGap || reportData.statisticheGap.totalGaps === 0 || (reportData.statisticheGap.countByRisk?.alto === 0 && reportData.statisticheGap.countByRisk?.medio === 0)}
                                        >
                                            {generatingInterventions ? 'Genero...' : 'Genera/Aggiorna Interventi AI'}
                                        </Button>
                                     </span>
                                </Tooltip>
                                <Tooltip title="Crea automaticamente un nuovo Piano d'Azione (in stato Bozza) nel Modulo Progettazione, associando gli interventi AI generati/aggiornati al momento.">
                                     <span> {}
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            startIcon={generatingPlan ? <CircularProgress size={20} color="inherit"/> : <PlaylistAddCheckIcon />}
                                            onClick={handleCreatePlanFromAI}

                                            disabled={generatingInterventions || generatingPlan || loadingReport || !reportData.statisticheGap || reportData.statisticheGap.totalGaps === 0 || (reportData.statisticheGap.countByRisk?.alto === 0 && reportData.statisticheGap.countByRisk?.medio === 0)}
                                        >
                                            {generatingPlan ? 'Creo Piano...' : 'Crea Piano da Interventi AI'}
                                        </Button>
                                     </span>
                                </Tooltip>
                            </Stack>
                        </Box>
                        {}

                        {}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Elenco Gap Rilevati ({reportData.statisticheGap?.totalGaps || 0})</Typography>
                             {reportData.elencoGapCompleto?.length > 0 ? (
                                 reportData.elencoGapCompleto.map((gap, index) => (
                                     <Accordion key={gap._id || index} defaultExpanded={index < 5} sx={{ mb: 1, '&:before': { display: 'none' } }} slotProps={{ transition: { unmountOnExit: true } }} >
                                         <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#f9f9f9', flexDirection: 'row-reverse', '& .MuiAccordionSummary-content': { ml: 1 } }}>
                                             <Chip label={getRiskLabel(gap.livello_rischio)} color={getRiskColor(gap.livello_rischio)} size="small" sx={{ mr: 2 }}/>
                                             <Typography variant="body2" sx={{ fontWeight: 'medium', flexGrow: 1 }}>{gap.item_id}: {gap.descrizione}</Typography>
                                         </AccordionSummary>
                                         <AccordionDetails sx={{ pt: 1, pb: 2, borderTop: '1px solid #eee' }}>
                                             <Typography variant="body2" sx={{ mb: 1 }}><strong>Domanda:</strong> {gap.domandaText || 'N/D'}</Typography>
                                             <Typography variant="body2" sx={{ mb: 1 }}><strong>Implicazioni Dettagliate:</strong> {gap.implicazioni || 'Non specificate'}</Typography>
                                             {gap.suggerimenti_ai && gap.suggerimenti_ai.length > 0 && (
                                                 <>
                                                     <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Suggerimenti AI:</Typography>
                                                     <List dense disablePadding>
                                                         {gap.suggerimenti_ai.map((sugg, i) => (
                                                             <ListItem key={i} sx={{ py: 0 }}><ListItemIcon sx={{minWidth: 25}}><RecommendIcon fontSize="small" color="action"/></ListItemIcon><ListItemText secondary={sugg} /></ListItem>
                                                         ))}
                                                     </List>
                                                 </>
                                             )}
                                             <Box sx={{ textAlign: 'right', mt: 1 }}>
                                                  {}
                                                 <Button size="small" startIcon={<LaunchIcon/>} component={RouterLink} to={`/progettazione/interventi`} state={{ prefillFromGap: gap }}>Crea Intervento Manuale</Button>
                                             </Box>
                                         </AccordionDetails>
                                     </Accordion>
                                 ))
                            ) : ( <Alert severity="success">Nessun gap rilevato per questa checklist.</Alert> )}
                        </Box>

                        {}
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Raccomandazioni Generali</Typography>
                            {reportData.raccomandazioni?.length > 0 ? (
                                <List dense>{reportData.raccomandazioni.map((r, i) => <ListItem key={`r-${i}`}><ListItemIcon><RecommendIcon color="primary" /></ListItemIcon><ListItemText primary={r} /></ListItem>)}</List>
                            ): ( <Alert severity="info">Nessuna raccomandazione specifica generata.</Alert> )}
                        </Box>

                    </Paper>
                </Box>
            )}
            {}
        </Box>
    );
};

export default ReportPage;
