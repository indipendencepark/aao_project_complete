import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link as RouterLink, useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Divider,
    Alert, FormControl, InputLabel, Select, MenuItem, CircularProgress, Tooltip,
    List, ListItem, ListItemText, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, ListItemIcon,
    Accordion, AccordionSummary, AccordionDetails,
    Checkbox
} from '@mui/material';

import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot'; // IMPORTA TroubleshootIcon
import PollIcon from '@mui/icons-material/Poll';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BuildIcon from '@mui/icons-material/Build';

const mapCategoriaToArea = (categoria) => {
    if (!categoria) return 'Altro';
    const catLower = categoria.toLowerCase();
    if (catLower.includes('process')) return 'Admin'; // Esempio, adatta alle tue categorie
    if (catLower.includes('organizz')) return 'Org';
    if (catLower.includes('cultura')) return 'Org'; // O 'HR' o 'Altro'
    if (catLower.includes('sistem') || catLower.includes('tecnologia')) return 'IT';
    if (catLower.includes('governance') || catLower.includes('leadership')) return 'Org';
    if (catLower.includes('person') || catLower.includes('competenze')) return 'HR'; // O 'Org'
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

    const [checklistsCompletate, setChecklistsCompletate] = useState([]);
    const [selectedChecklistId, setSelectedChecklistId] = useState('');
    const [gaps, setGaps] = useState([]);
    const [filteredGaps, setFilteredGaps] = useState([]);
    const [loadingChecklists, setLoadingChecklists] = useState(false);
    const [loadingGaps, setLoadingGaps] = useState(false);
    const [errorChecklists, setErrorChecklists] = useState(null); // Errore specifico checklist
    const [errorGaps, setErrorGaps] = useState(null); // Errore specifico gaps
    const [filters, setFilters] = useState({ area: '', livello_rischio: '' });

    const [analyzingRootCauseFor, setAnalyzingRootCauseFor] = useState(null); // ID del gap in analisi
    const [rootCauseError, setRootCauseError] = useState(null);
    const [showRootCauseModal, setShowRootCauseModal] = useState(false);
    const [currentRootCauses, setCurrentRootCauses] = useState([]);
    const [modalGapTitle, setModalGapTitle] = useState(''); // Stato per il titolo del modal

    // --- NUOVI STATI PER SELEZIONE GAP CORRELATI ---
    const [showSelectRelatedGapsModal, setShowSelectRelatedGapsModal] = useState(false);
    const [currentGapForRelatedSelection, setCurrentGapForRelatedSelection] = useState(null); // Gap principale per cui si scelgono i correlati
    const [selectedRelatedGapIds, setSelectedRelatedGapIds] = useState([]); // Array di ID dei gap correlati scelti
    // --- FINE NUOVI STATI ---

    const [reportDocumentId, setReportDocumentId] = useState(null); // ID del ReportDiagnostico associato
    
    // --- STATI PER ANALISI AGGREGATA DELLE CAUSE RADICE ---
    const [analyzingAggregatedRCA, setAnalyzingAggregatedRCA] = useState(false);
    const [aggregatedRCAData, setAggregatedRCAData] = useState(null); // Per conservare i risultati dell'analisi aggregata
    const [aggregatedRCAStatus, setAggregatedRCAStatus] = useState({
        status: 'IDLE',
        message: null,
        lastAnalysisDate: null,
        isPolling: false,
    });
    const pollingIntervalRef = useRef(null); // Già presente o da aggiungere
    const [errorAggregatedRCA, setErrorAggregatedRCA] = useState(null); // Errore specifico per l'analisi aggregata
    // --- FINE STATI PER ANALISI AGGREGATA ---

    const [searchParams] = useSearchParams();
    const initialChecklistId = searchParams.get('checklist_id');

    const navigate = useNavigate(); // Importa useNavigate da react-router-dom

    const fetchCompletedChecklists = useCallback(async () => { // useCallback per stabilità
        setLoadingChecklists(true); setErrorChecklists(null); setChecklistsCompletate([]);
        try {
            const response = await axios.get('http://localhost:5001/api/checklist');
            const completed = response.data.data?.filter(cl => cl.stato === 'completata') || [];
            setChecklistsCompletate(completed);
            console.log(">>> GapAnalysisPage: Elenco checklist completate caricato:", completed.length);

            if (initialChecklistId && completed.some(cl => cl._id === initialChecklistId)) {
                console.log(`>>> GapAnalysisPage: Pre-seleziono checklist da URL: ${initialChecklistId}`);
                setSelectedChecklistId(initialChecklistId);
            }

        } catch (err) {
            console.error(">>> GapAnalysisPage: Errore caricamento elenco checklist:", err);
            setErrorChecklists(err.response?.data?.message || 'Errore nel recupero elenco checklist.');
        } finally { setLoadingChecklists(false); }

    }, [initialChecklistId]); // Dipende da initialChecklistId per la pre-selezione

    const fetchGaps = useCallback(async (checklistId) => {
        if (!checklistId) {
            setGaps([]); setFilteredGaps([]); return;
        }
        console.log(`>>> GapAnalysisPage: fetchGaps chiamata per Checklist ID: ${checklistId}`);
        setLoadingGaps(true); setErrorGaps(null); // Resetta errore gaps
        setGaps([]); setFilteredGaps([]); // Svuota i gap precedenti
        try {
            const response = await axios.get(`http://localhost:5001/api/assessment/gaps?checklist_id=${checklistId}`);
            console.log(">>> GapAnalysisPage: Risposta API Gaps:", response.data);
            const receivedData = response.data.data || [];
            setGaps(receivedData);

        } catch (err) {
            console.error(">>> GapAnalysisPage: Errore caricamento gaps:", err);
            setErrorGaps(err.response?.data?.message || 'Errore nel recupero dei gap.');
            setGaps([]); setFilteredGaps([]);
        } finally { setLoadingGaps(false); }
    }, []); // useCallback senza dipendenze esterne

    const handleAnalyzeRootCause = useCallback(async (gap, relatedGapIds) => { // Accetta relatedGapIds
        if (!gap || !gap._id || !selectedChecklistId) return;

        setAnalyzingRootCauseFor(gap._id);
        setRootCauseError(null);
        setCurrentRootCauses([]); // Pulisci risultati precedenti
        setModalGapTitle(gap.descrizione || `Analisi Gap ${gap.item_id}`); // Imposta il titolo prima della chiamata API

        console.log(`Avvio analisi cause radice per Gap ID: ${gap._id} della Checklist ID: ${selectedChecklistId} con correlati: ${relatedGapIds}`); // Log aggiornato
        try {

            const response = await axios.post(
                `http://localhost:5001/api/assessment/gaps/${gap._id}/root-cause`,
                {
                    checklistId: selectedChecklistId,
                    relatedGapIds: relatedGapIds || [] // Assicurati che sia un array, anche se vuoto
                 }
            );
            
            setCurrentRootCauses(response.data.data || []);
            setShowRootCauseModal(true); // Apri il modal con i risultati

            setGaps(prevGaps => prevGaps.map(g => 
                g._id === gap._id 
                ? { ...g, causeRadiceSuggeriteAI: response.data.data, ultimaAnalisiCauseRadice: new Date() } 
                : g
            ));

        } catch (err) {
            console.error("Errore analisi cause radice:", err);
            setRootCauseError(err.response?.data?.message || "Errore durante l'analisi delle cause radice.");
            setShowRootCauseModal(true); // Mostra il modal anche in caso di errore

        } finally {
            setAnalyzingRootCauseFor(null);
        }
    }, [selectedChecklistId]); // Dipende da selectedChecklistId

    useEffect(() => {
        fetchCompletedChecklists();
    }, [fetchCompletedChecklists]); // Aggiunta dipendenza corretta

    useEffect(() => {

        if (!loadingChecklists && selectedChecklistId) {
             fetchGaps(selectedChecklistId);
        } else if (!selectedChecklistId) {
            setGaps([]); // Svuota i gap se deseleziono
            setFilteredGaps([]);
        }
    }, [selectedChecklistId, fetchGaps, loadingChecklists]); // Aggiunta dipendenza loadingChecklists

    useEffect(() => {
        console.log(`>>> GapAnalysisPage: Applico filtri frontend (Area: ${filters.area}, Rischio: ${filters.livello_rischio}) su ${gaps.length} gap totali.`);
        let result = gaps;
        if (filters.area) {
            result = result.filter(gap => gap.item_id && gap.item_id.toUpperCase().startsWith(filters.area));
        }
        if (filters.livello_rischio) {
             result = result.filter(gap => gap.livello_rischio === filters.livello_rischio);
        }
        setFilteredGaps(result);
        console.log(`>>> GapAnalysisPage: filteredGaps aggiornato a ${result.length} elementi.`);
    }, [gaps, filters.area, filters.livello_rischio]); // Dipende da 'gaps' e dai singoli filtri

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        console.log(`>>> GapAnalysisPage: handleFilterChange chiamata: name=${name}, value=${value}`);
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
    };

    const handleChecklistChange = (event) => {
        const newId = event.target.value;
        console.log(`>>> GapAnalysisPage: Checklist selezionata cambiata a: ${newId}`);
        setSelectedChecklistId(newId);

        setErrorGaps(null);

    };

    const getRiskIcon = (level) => {
        switch (level) {
          case 'alto': return <ErrorIcon color="error" fontSize="small"/>; // Dimensione icona
          case 'medio': return <WarningIcon color="warning" fontSize="small"/>;
          case 'basso': return <CheckCircleIcon color="success" fontSize="small"/>;
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

    const RootCauseModal = ({ open, onClose, causes, gapTitle, error }) => {
        if (!open) return null;

        const MAX_TITLE_LENGTH = 70;
        const truncatedTitle = gapTitle && gapTitle.length > MAX_TITLE_LENGTH
                                ? `${gapTitle.substring(0, MAX_TITLE_LENGTH)}...`
                                : gapTitle;

        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
                <DialogTitle sx={{ fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Tooltip title={gapTitle || 'Analisi Cause Radice'} arrow>
                        <span>Potenziali Cause Radice per: {truncatedTitle || 'Gap Selezionato'}</span>
                    </Tooltip>
                </DialogTitle>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {!error && causes.length === 0 && (
                        <Alert severity="info">
                            {analyzingRootCauseFor === null && !currentRootCauses.length ?
                             "Nessuna analisi delle cause radice effettuata o nessun dato disponibile." :
                             "L'analisi AI non ha identificato cause radici specifiche o sono in corso di caricamento."}
                        </Alert>
                    )}
                    {!error && causes.length > 0 && (
                        <List>
                            {causes.map((causa, index) => (
                                <React.Fragment key={index}>
                                    <ListItem alignItems="flex-start">
                                        <ListItemIcon sx={{ minWidth: 30, mt: 0.5 }}>
                                            <Chip label={index + 1} size="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={causa.testoCausa}
                                            secondary={
                                                <>
                                                    {/* VISUALIZZAZIONE CATEGORIA CAUSA */}
                                                    {causa.categoriaCausa && (
                                                        <Chip
                                                            label={causa.categoriaCausa}
                                                            size="small"
                                                            variant="outlined" // o default
                                                            sx={{
                                                                mr: 1,
                                                                mb: 0.5,
                                                                fontSize: '0.7rem',
                                                                height: '20px',
                                                                // Potresti aggiungere colori diversi per categoria se vuoi
                                                                // backgroundColor: getCategoryColor(causa.categoriaCausa),
                                                                // color: getCategoryColor(causa.categoriaCausa) ? 'white' : 'inherit'
                                                            }}
                                                        />
                                                    )}
                                                    <Typography component="span" variant="body2" color="text.primary" sx={{ fontWeight: 'bold', display: 'block', mt: causa.categoriaCausa ? 0.5 : 0 }}>
                                                        Motivazione AI:
                                                    </Typography>
                                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', pl:1 }}>
                                                      {causa.motivazioneAI || 'N/D'}
                                                    </Typography>
                                                    <br />
                                                    <Typography component="span" variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'inline-block' }}>
                                                        Rilevanza Stimata: <Chip label={causa.rilevanzaStimata || 'N/D'} size="small" color={getRiskColor(causa.rilevanzaStimata)} />
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                    {index < causes.length - 1 && <Divider variant="inset" component="li" />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Chiudi</Button>
                </DialogActions>
            </Dialog>
        );
    };

    // --- NUOVO MODAL PER SELEZIONE GAP CORRELATI ---
    const SelectRelatedGapsModal = ({ open, onClose, onConfirm, allGaps, mainGapId }) => {
        const [locallySelectedIds, setLocallySelectedIds] = useState([]);

        useEffect(() => {
            // Inizializza con gli ID già selezionati se il modal viene riaperto per lo stesso gap principale
            // (o se vuoi pre-popolare da uno stato globale, ma per ora partiamo da zero ogni volta)
            setLocallySelectedIds([]); 
        }, [open]); // Resetta ogni volta che il modal si apre

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

        // Filtra i gap per escludere quello principale e mostrare solo quelli della stessa checklist (già fatto da 'gaps')
        const candidateRelatedGaps = allGaps.filter(g => g._id !== mainGapId);

        return (
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>Seleziona Gap Correlati (Opzionale)</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Seleziona fino a 3-4 altri gap che ritieni possano essere correlati o contribuire
                        alle cause del gap principale: <strong>{allGaps.find(g => g._id === mainGapId)?.descrizione || 'N/D'}</strong>.
                        Questo aiuterà l'AI a fornire un'analisi più contestualizzata.
                    </Typography>
                    {candidateRelatedGaps.length === 0 && (
                        <Alert severity="info">Nessun altro gap disponibile in questa checklist per la selezione.</Alert>
                    )}
                    <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {candidateRelatedGaps.map(gap => (
                            <ListItem
                                key={gap._id}
                                secondaryAction={
                                    <Checkbox
                                        edge="end"
                                        onChange={() => handleToggleGap(gap._id)}
                                        checked={locallySelectedIds.includes(gap._id)}
                                    />
                                }
                                disablePadding
                                button 
                                onClick={() => handleToggleGap(gap._id)} // Rende l'intera riga cliccabile
                            >
                                <ListItemIcon sx={{minWidth: 'auto', mr: 1}}>
                                    {getRiskIcon(gap.livello_rischio)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={`${gap.item_id}: ${gap.descrizione}`}
                                    secondary={`Rischio: ${getRiskLabel(gap.livello_rischio)}`}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Annulla</Button>
                    <Button onClick={handleConfirmSelection} variant="contained">
                        Conferma e Analizza
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };
    // --- FINE NUOVO MODAL ---

    // --- NUOVO HANDLER PER CONFERMA SELEZIONE GAP CORRELATI ---
    const handleConfirmRelatedGaps = (selectedIds) => {
        // Chiama la funzione di analisi delle cause radice con il gap principale (memorizzato in currentGapForRelatedSelection)
        // e gli ID dei gap correlati selezionati
        if (currentGapForRelatedSelection) {
            console.log(`Conferma selezione correlati per ${currentGapForRelatedSelection._id}: ${selectedIds}`);
            handleAnalyzeRootCause(currentGapForRelatedSelection, selectedIds); // Passa il gap e gli IDs
        }
        // Chiudi il modal di selezione e resetta gli stati relativi
        setShowSelectRelatedGapsModal(false);
        setSelectedRelatedGapIds([]); // Resetta la selezione per la prossima volta che si apre
        setCurrentGapForRelatedSelection(null); // Resetta il gap principale in selezione
    };
    // --- FINE NUOVO HANDLER ---

    // --- NUOVA Funzione per Avviare la Selezione dei Gap Correlati ---
    const startRelatedGapsSelection = useCallback((gapToAnalyze) => {
        setCurrentGapForRelatedSelection(gapToAnalyze); // Memorizza il gap principale
        setSelectedRelatedGapIds([]); // Resetta selezioni precedenti (anche se il modal lo fa, meglio essere sicuri)
        setShowSelectRelatedGapsModal(true);
    }, []);
    // --- FINE NUOVA Funzione ---

    const fetchReportDocumentId = useCallback(async (chkId) => {
        if (!chkId) {
            setReportDocumentId(null);
            setAggregatedRCAData(null); // Pulisci dati precedenti
            setAggregatedRCAStatus({ status: 'IDLE', message: null, lastAnalysisDate: null, isPolling: false });
            return;
        }
        try {
            const response = await axios.get(`http://localhost:5001/api/report?checklist_id=${chkId}`);
            if (response.data && response.data.data) {
                const report = response.data.data;
                setReportDocumentId(report._id); // Salva l'ID del documento ReportDiagnostico
                if (report.analisiCauseRadiceAggregate) {
                    setAggregatedRCAData(report.analisiCauseRadiceAggregate); // Salva i dati dell'analisi
                    setAggregatedRCAStatus(prev => ({
                        ...prev,
                        status: report.analisiCauseRadiceAggregate.statusAnalisi || 'IDLE',
                        message: report.analisiCauseRadiceAggregate.messaggioAnalisi,
                        lastAnalysisDate: report.analisiCauseRadiceAggregate.dataUltimaAnalisi,
                    }));
                    if (report.analisiCauseRadiceAggregate.statusAnalisi === 'PROCESSING' || report.analisiCauseRadiceAggregate.statusAnalisi === 'PENDING') {
                        startPollingAggregatedRCAStatus(chkId); // Passa chkId
                    } else {
                        stopPollingAggregatedRCA();
                    }
                } else {
                    setAggregatedRCAData(null);
                    setAggregatedRCAStatus({ status: 'IDLE', message: null, lastAnalysisDate: null, isPolling: false });
                }
                console.log(`ID ReportDiagnostico per checklist ${chkId}: ${report._id}`);
            } else {
                setReportDocumentId(null);
                setAggregatedRCAData(null);
                setAggregatedRCAStatus({ status: 'IDLE', message: null, lastAnalysisDate: null, isPolling: false });
            }
        } catch (err) {
            console.error("Errore nel fetch dell'ID del ReportDiagnostico:", err);
            setReportDocumentId(null);
            setAggregatedRCAData(null);
        }
    }, []); // Aggiungi dipendenze se necessario

    // Chiama fetchReportDocumentId quando selectedChecklistId cambia
    useEffect(() => {
        if (selectedChecklistId) {
            fetchReportDocumentId(selectedChecklistId);
        } else {
            setReportDocumentId(null); // Pulisci se nessuna checklist è selezionata
            setAggregatedRCAData(null);
            stopPollingAggregatedRCA();
            setAggregatedRCAStatus({ status: 'IDLE', message: null, lastAnalysisDate: null, isPolling: false });
        }
    }, [selectedChecklistId, fetchReportDocumentId]);

    const stopPollingAggregatedRCA = useCallback(() => { // useCallback here
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            setAggregatedRCAStatus(prev => ({ ...prev, isPolling: false }));
            console.log("Polling Aggregato RCA interrotto.");
        }
    }, []); // No dependencies since it doesn't use external changing variables

    const pollAggregatedRCAStatus = useCallback(async (chkIdToPoll) => { // chkIdToPoll passed as argument
        if (!chkIdToPoll || !aggregatedRCAStatus.isPolling) { // Check status to avoid unnecessary polling
            stopPollingAggregatedRCA();
            return;
        }
        console.log(`Polling stato analisi aggregata per ${chkIdToPoll}...`);
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
                    console.log("Analisi aggregata completata, ricarico i dati del report/analisi...");
                    fetchReportDocumentId(chkIdToPoll); // Reload specific analysis data
                }
            }
        } catch (pollError) {
            console.error("Errore durante il polling dello stato RCA:", pollError);
            if (pollError.response?.status === 404) { // Checklist/Report no longer exists
                stopPollingAggregatedRCA();
                setAggregatedRCAStatus({ status: 'FAILED', message: 'Risorsa non trovata durante il polling.', lastAnalysisDate: null, isPolling: false });
            }
        }
    }, [aggregatedRCAStatus.isPolling, fetchReportDocumentId, stopPollingAggregatedRCA]); // Updated dependencies

    const startPollingAggregatedRCAStatus = useCallback((chkIdToPoll) => { // chkIdToPoll passed as argument
        stopPollingAggregatedRCA(); 
        // Immediate call to avoid waiting for the first interval
        pollAggregatedRCAStatus(chkIdToPoll); 
        pollingIntervalRef.current = setInterval(() => pollAggregatedRCAStatus(chkIdToPoll), 7000); // Polling every 7 seconds
        setAggregatedRCAStatus(prev => ({ ...prev, isPolling: true, status: 'PROCESSING', message: 'Analisi in corso...' }));
        console.log("Polling Aggregato RCA avviato.");
    }, [pollAggregatedRCAStatus, stopPollingAggregatedRCA]); // Updated dependencies

    const handleStartAggregatedRCA = async () => {
        if (!selectedChecklistId) return;

        setAnalyzingAggregatedRCA(true);
        // Initial state before API call
        setAggregatedRCAStatus({ 
            status: 'PENDING', 
            message: 'Avvio analisi aggregata delle cause radice...', 
            lastAnalysisDate: null, 
            isPolling: false 
        });
        setErrorAggregatedRCA(null);

        try {
            console.log(`>>> GapAnalysisPage: Avvio analisi aggregata RCA per checklist ${selectedChecklistId}`);
            const response = await axios.post(
                `http://localhost:5001/api/assessment/checklists/${selectedChecklistId}/aggregated-root-cause`,
                { considerOnlyCriticalGaps: true }
            );

            if (response.status === 202) { // Accepted
                // Do not set isPolling to true here, it will be done by startPolling
                setAggregatedRCAStatus(prev => ({
                    ...prev, // Keep PENDING or update to PROCESSING if backend indicates
                    message: response.data.message || 'Richiesta di analisi accettata, elaborazione in corso...',
                }));
                startPollingAggregatedRCAStatus(selectedChecklistId); // Start polling with the correct ID
            } else {
                // Handle other status codes if necessary
                throw new Error(response.data.message || "Risposta non attesa dal server per analisi aggregata.");
            }
        } catch (err) {
            console.error("Errore avvio analisi aggregata RCA:", err);
            const errorMsg = err.response?.data?.message || err.message || "Errore sconosciuto.";
            setErrorAggregatedRCA(errorMsg); // Use specific error state
            setAggregatedRCAStatus({ status: 'FAILED', message: errorMsg, lastAnalysisDate: null, isPolling: false });
            setAnalyzingAggregatedRCA(false); // Stop general spinner
        }
        // setAnalyzingAggregatedRCA(false) is handled by poll or error
    };

    // Cleanup for polling when component unmounts or selectedChecklistId changes
    useEffect(() => {
        return () => {
            stopPollingAggregatedRCA();
        };
    }, [stopPollingAggregatedRCA]); // Added stopPollingAggregatedRCA as dependency

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Gap Analysis</Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={selectedChecklistId ? 6 : 12}>
                        <FormControl fullWidth disabled={loadingChecklists || loadingGaps || analyzingAggregatedRCA || aggregatedRCAStatus.isPolling}>
                            <InputLabel id="checklist-select-label">Seleziona Checklist Completata</InputLabel>
                            <Select
                                labelId="checklist-select-label"
                                value={selectedChecklistId}
                                label="Seleziona Checklist Completata"
                                onChange={handleChecklistChange}
                            >
                                <MenuItem value=""><em>Nessuna selezionata</em></MenuItem>
                                {loadingChecklists && <MenuItem value="" disabled>Caricamento...</MenuItem>}
                                {!loadingChecklists && checklistsCompletate.length === 0 && <MenuItem value="" disabled>Nessuna checklist completata trovata.</MenuItem>}
                                {checklistsCompletate.map((cl) => (
                                    <MenuItem key={cl._id} value={cl._id}>{cl.nome} ({cl.cliente?.nome})</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {errorChecklists && <Alert severity="error" sx={{mt:1, width:'100%'}}>{errorChecklists}</Alert>}
                    </Grid>

                    {/* --- PULSANTE PER AVVIARE ANALISI AGGREGATA --- */}
                    {selectedChecklistId && !loadingGaps && gaps.length > 0 && (
                        <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: {xs: 'flex-start', md: 'flex-end'} }}>
                            <Tooltip title="Avvia un'analisi AI per identificare le cause radice sistemiche che collegano i principali gap di questa checklist.">
                                <span>
                                    <Button
                                        variant="contained"
                                        color="info"
                                        onClick={handleStartAggregatedRCA}
                                        startIcon={analyzingAggregatedRCA || aggregatedRCAStatus.isPolling ? <CircularProgress size={20} color="inherit"/> : <PollIcon />}
                                        disabled={
                                            !selectedChecklistId || 
                                            loadingGaps ||
                                            analyzingAggregatedRCA || 
                                            aggregatedRCAStatus.isPolling ||
                                            (aggregatedRCAStatus.status === 'PROCESSING')
                                        }
                                        sx={{minWidth: 280}}
                                    >
                                        { (analyzingAggregatedRCA || aggregatedRCAStatus.isPolling) ? 'Analisi Cause Complessive in Corso...' : 
                                          (aggregatedRCAStatus.status === 'COMPLETED' || aggregatedRCAStatus.lastAnalysisDate) ? 'Ri-Analizza Cause Complessive' : 
                                          'Analizza Cause Complessive (Checklist)'
                                        }
                                    </Button>
                                </span>
                            </Tooltip>
                        </Grid>
                    )}
                    
                    {/* Visualizzazione dello stato dell'analisi aggregata */}
                    {selectedChecklistId && (aggregatedRCAStatus.message || aggregatedRCAStatus.lastAnalysisDate) && (
                        <Grid item xs={12}>
                            <Alert 
                                severity={
                                    aggregatedRCAStatus.status === 'FAILED' ? 'error' : 
                                    aggregatedRCAStatus.status === 'COMPLETED' ? 'success' : 
                                    (aggregatedRCAStatus.status === 'PROCESSING' || aggregatedRCAStatus.status === 'PENDING') ? 'info' : 
                                    'info'
                                } 
                                sx={{ mt: 1 }}
                                icon={ (aggregatedRCAStatus.status === 'PROCESSING' || aggregatedRCAStatus.status === 'PENDING' || aggregatedRCAStatus.isPolling) ? <CircularProgress size={18} sx={{mr:1, alignSelf:'center'}}/> : undefined }
                            >
                                <Typography variant="body2" sx={{fontWeight:'bold'}}>
                                    Stato Analisi Cause Radice Complessive: {aggregatedRCAStatus.status?.toUpperCase() || 'N/D'}
                                </Typography>
                                {aggregatedRCAStatus.message && <Typography variant="caption" display="block">{aggregatedRCAStatus.message}</Typography>}
                                {aggregatedRCAStatus.lastAnalysisDate && !aggregatedRCAStatus.isPolling && (
                                    <Typography variant="caption" display="block">
                                        Ultima analisi completata il: {new Date(aggregatedRCAStatus.lastAnalysisDate).toLocaleString('it-IT')}
                                    </Typography>
                                )}
                                {errorAggregatedRCA && !aggregatedRCAStatus.isPolling && (
                                    <Typography variant="caption" display="block" color="error">
                                        Dettaglio Errore: {errorAggregatedRCA}
                                    </Typography>
                                )}
                            </Alert>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {selectedChecklistId && (
                 <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Gap Rilevati
                        {!loadingGaps && ` (${filteredGaps.length} visualizzati su ${gaps.length} totali)`}
                    </Typography>
                     {loadingGaps ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
                    ) : errorGaps ? (
                        <Alert severity="error">{errorGaps}</Alert>
                    ) : gaps.length === 0 ? (
                         <Alert severity="info"> Nessun gap rilevato per la checklist selezionata. </Alert>
                     ) : filteredGaps.length === 0 ? (
                         <Alert severity="warning"> Nessun gap trovato con i filtri applicati. </Alert>
                     ) : (

                        <Grid container spacing={2}>
                            {filteredGaps.map((gap) => (
                                <Grid item xs={12} md={6} key={gap._id}>
                                    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                <Chip
                                                    icon={getRiskIcon(gap.livello_rischio)}
                                                    label={getRiskLabel(gap.livello_rischio)}
                                                    color={getRiskColor(gap.livello_rischio)}
                                                    size="small"
                                                />
                                                <Typography variant="caption" color="text.secondary">{gap.item_id}</Typography>
                                            </Box>
                                            
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                {gap.domandaText || 'Testo domanda non disponibile'}
                                            </Typography>
                                            
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong>Gap (Descrizione Base):</strong> {gap.descrizione}
                                            </Typography>
                                            
                                            {gap.descrizione_arricchita_ai && (
                                                <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic', color: 'info.main' }}>
                                                    <strong>Dettaglio AI:</strong> {gap.descrizione_arricchita_ai}
                                                </Typography>
                                            )}

                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                                <strong>Implicazioni (Base):</strong> {(Array.isArray(gap.implicazioni) ? gap.implicazioni.join('; ') : gap.implicazioni) || 'Non specificate'}
                                            </Typography>

                                            {gap.arricchitoConAI && (
                                                <>
                                                    <Divider sx={{ my: 1.5 }}><Chip label="Analisi AI Avanzata" size="small" variant="outlined" /></Divider>
                                                    
                                                    {gap.implicazioni_dettagliate_ai && gap.implicazioni_dettagliate_ai.length > 0 && (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>Implicazioni Dettagliate (AI):</Typography>
                                                            <List dense disablePadding sx={{ fontSize: '0.75rem', pl: 1 }}>
                                                                {gap.implicazioni_dettagliate_ai.map((imp, idx) => (
                                                                    <ListItem key={`imp-ai-${idx}`} sx={{ py: 0 }}><ListItemText primaryTypographyProps={{ variant: 'caption' }} primary={`• ${imp}`} /></ListItem>
                                                                ))}
                                                            </List>
                                                        </Box>
                                                    )}

                                                    {gap.impattoStimatoAI && gap.impattoStimatoAI.livello && gap.impattoStimatoAI.livello !== 'non determinabile' && (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                                                                Impatto Stimato (AI):
                                                                <Chip 
                                                                    label={`${gap.impattoStimatoAI.tipo || 'N/D'} - ${getRiskLabel(gap.impattoStimatoAI.livello)}`} 
                                                                    color={getRiskColor(gap.impattoStimatoAI.livello)} 
                                                                    size="small" 
                                                                    sx={{ ml: 0.5, textTransform: 'capitalize' }}
                                                                />
                                                            </Typography>
                                                            {gap.impattoStimatoAI.descrizione && gap.impattoStimatoAI.descrizione !== "N/D" && (
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>
                                                                    {gap.impattoStimatoAI.descrizione}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    )}

                                                    {gap.prioritaRisoluzioneAI && (
                                                        <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                            Priorità Risoluzione (AI): 
                                                            <Chip 
                                                                label={getRiskLabel(gap.prioritaRisoluzioneAI)} 
                                                                color={getRiskColor(gap.prioritaRisoluzioneAI)} 
                                                                size="small" 
                                                                sx={{ ml: 0.5, textTransform: 'capitalize' }}
                                                            />
                                                        </Typography>
                                                    )}

                                                    {gap.riferimentiNormativiSpecificiAI && gap.riferimentiNormativiSpecificiAI.length > 0 && (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>Riferimenti Normativi (AI):</Typography>
                                                            <List dense disablePadding sx={{ fontSize: '0.75rem', pl: 1 }}>
                                                                {gap.riferimentiNormativiSpecificiAI.map((ref, idx) => (
                                                                    <ListItem key={`norm-ai-${idx}`} sx={{ py: 0 }}><ListItemText primaryTypographyProps={{ variant: 'caption', fontStyle: 'italic' }} primary={`• ${ref}`} /></ListItem>
                                                                ))}
                                                            </List>
                                                        </Box>
                                                    )}

                                                    {gap.suggerimenti_ai && gap.suggerimenti_ai.length > 0 && (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>Suggerimenti Intervento (AI):</Typography>
                                                            <List dense disablePadding sx={{ fontSize: '0.75rem', pl: 1 }}>
                                                                {gap.suggerimenti_ai.map((sugg, idx) => (
                                                                    <ListItem key={`sugg-ai-${idx}`} sx={{ py: 0 }}><ListItemText primaryTypographyProps={{ variant: 'caption' }} primary={`• ${sugg}`} /></ListItem>
                                                                ))}
                                                            </List>
                                                        </Box>
                                                    )}
                                                </>
                                            )}
                                            
                                            {gap.riferimentiKb && gap.riferimentiKb.length > 0 && (
                                                <>
                                                    <Divider sx={{ my: 1 }} />
                                                    <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', mt: 1 }}>
                                                        Contesto dalla KB (usato da AI per arricchimento):
                                                    </Typography>
                                                    <List dense disablePadding sx={{ maxHeight: 100, overflow: 'auto', fontSize: '0.75rem' }}>
                                                        {gap.riferimentiKb.map((ref, idx) => (
                                                            <ListItem key={`kbref-${gap._id}-${idx}`} sx={{ py: 0, alignItems: 'flex-start' }}>
                                                                <Tooltip title={`ID Chunk: ${ref.chunkId || 'N/A'} - Similarità: ${ref.similarita?.toFixed(3) || 'N/A'} - Fonte: ${ref.documentoFonte || 'N/A'}`}>
                                                                    <ListItemText 
                                                                        primaryTypographyProps={{ variant: 'caption', fontStyle: 'italic' }}
                                                                        primary={`• ${ref.estrattoTesto || 'N/D'}`} 
                                                                    />
                                                                </Tooltip>
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </>
                                            )}

                                            {gap.ultimaAnalisiCauseRadice && (
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
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
                                        <Box sx={{ p: 1, pt: 0, mt: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Button variant="outlined" size="small" disabled> Dettagli </Button>

                                            <Tooltip title="Analizza Cause Radice con AI">
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        color="secondary"
                                                        onClick={() => {
                                                            setCurrentGapForRelatedSelection(gap); // Memorizza il gap per il modal
                                                            setShowSelectRelatedGapsModal(true); // Apri il modal di selezione
                                                        }}
                                                        disabled={analyzingRootCauseFor === gap._id || !selectedChecklistId}
                                                    >
                                                        {analyzingRootCauseFor === gap._id ? (
                                                            <CircularProgress size={18} color="inherit" />
                                                        ) : (

                                                            <TroubleshootIcon fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </span>
                                            </Tooltip>

                                            <Button
                                                variant="contained"
                                                size="small"
                                                component={RouterLink}
                                                to={`/progettazione/interventi`}
                                                state={{ prefillFromGap: gap }}
                                            >
                                                Crea Intervento
                                            </Button>
                                        </Box>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                 </Paper>
             )}

            <SelectRelatedGapsModal
                open={showSelectRelatedGapsModal}
                onClose={() => {
                    setShowSelectRelatedGapsModal(false);
                    setSelectedRelatedGapIds([]); // Resetta la selezione se si annulla
                    setCurrentGapForRelatedSelection(null);
                }}
                onConfirm={handleConfirmRelatedGaps} // Collega il nuovo handler
                allGaps={gaps} // Passa tutti i gap disponibili per la selezione
                mainGapId={currentGapForRelatedSelection?._id}
            />

            <RootCauseModal
                open={showRootCauseModal}
                onClose={() => { setShowRootCauseModal(false); setCurrentRootCauses([]); setRootCauseError(null); setModalGapTitle(''); }} // Resetta il titolo alla chiusura
                causes={currentRootCauses}
                gapTitle={modalGapTitle} // Passa lo stato come titolo
                error={rootCauseError}
            />

            {/* --- SEZIONE VISUALIZZAZIONE RISULTATI ANALISI AGGREGATA --- */}
            {selectedChecklistId && aggregatedRCAData && aggregatedRCAData.statusAnalisi === 'COMPLETED' && (
                <Paper sx={{ p: {xs: 1.5, sm:2, md:3}, mb: 4, mt:2, border: theme => `2px dashed ${theme.palette.info.main}` }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'info.dark' }}>
                        <PollIcon sx={{ mr: 1 }} /> Risultati Analisi Cause Radice Complessive
                    </Typography>
                    
                    {aggregatedRCAData.summaryAnalisiCauseAI && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1, borderLeft: theme => `4px solid ${theme.palette.info.light}` }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Sintesi AI dell'Analisi Causale:</Typography>
                            <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap', fontStyle: 'italic', color: 'text.secondary' }}>
                                {aggregatedRCAData.summaryAnalisiCauseAI}
                            </Typography>
                        </Box>
                    )}

                    {aggregatedRCAData.causeIdentificate && aggregatedRCAData.causeIdentificate.length > 0 ? (
                        aggregatedRCAData.causeIdentificate.map((causa, index) => (
                            <Accordion key={causa.idCausa || index} sx={{ mb: 1.5, '&:before': { display: 'none' } }} defaultExpanded={index < 2}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{ 
                                        bgcolor: causa.rilevanzaComplessiva === 'critica' ? '#ffebee' : (causa.rilevanzaComplessiva === 'alta' ? '#fff3e0' : 'grey.50'),
                                        flexDirection: 'row-reverse',
                                        '& .MuiAccordionSummary-content': { ml: 1 } 
                                    }}
                                >
                                    <Chip 
                                        label={`Rilevanza: ${causa.rilevanzaComplessiva || 'N/D'}`} 
                                        size="small" 
                                        color={
                                            causa.rilevanzaComplessiva === 'critica' || causa.rilevanzaComplessiva === 'alta' ? 'error' :
                                            causa.rilevanzaComplessiva === 'media' ? 'warning' : 'default'
                                        }
                                        sx={{ mr: 'auto' }}
                                    />
                                    <Typography sx={{ fontWeight: 'medium', flexGrow: 1 }}>
                                        {index + 1}. {causa.testoCausa} 
                                        {causa.categoriaCausa && <Chip label={causa.categoriaCausa} size="small" variant="outlined" sx={{ ml: 1, fontSize: '0.7rem', height: '18px' }}/>}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 1, pb: 2, borderTop: '1px solid #eee' }}>
                                    <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                                        <strong>Descrizione Dettagliata (AI):</strong> {causa.descrizioneDettagliataAI || "N/D"}
                                    </Typography>
                                    
                                    {causa.gapDirettamenteImplicati && causa.gapDirettamenteImplicati.length > 0 && (
                                        <Box sx={{ my: 1.5 }}>
                                            <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>Gap Principalmente Influenzati da questa Causa:</Typography>
                                            <List dense disablePadding sx={{ pl: 1 }}>
                                                {causa.gapDirettamenteImplicati.map(g => (
                                                    <ListItem key={g.gapRefId || g.gapItemId} sx={{ py: 0.2 }}>
                                                        <ListItemIcon sx={{minWidth:20}}><WarningIcon fontSize="inherit" color="action" /></ListItemIcon>
                                                        <ListItemText 
                                                            primary={`${g.gapItemId}: ${g.gapDescrizioneBreve || 'Vedi dettaglio gap'}`} 
                                                            primaryTypographyProps={{variant:'caption'}}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}

                                    {causa.suggerimentiInterventoStrategicoAI && causa.suggerimentiInterventoStrategicoAI.length > 0 && (
                                        <Box sx={{ my: 1.5 }}>
                                            <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>Suggerimenti Strategici d'Intervento (AI):</Typography>
                                            <List dense disablePadding sx={{ pl: 1 }}>
                                                {causa.suggerimentiInterventoStrategicoAI.map((sugg, i) => (
                                                    <ListItem key={`sugg-strat-${i}`} sx={{ py: 0.2 }}>
                                                        <ListItemIcon sx={{minWidth:20}}><BuildIcon fontSize="inherit" color="primary"/></ListItemIcon>
                                                        <ListItemText secondary={sugg} secondaryTypographyProps={{variant:'caption'}}/>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}
                                    <Box sx={{ textAlign: 'right', mt: 1 }}>
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            startIcon={<BuildIcon />}
                                            onClick={() => {
                                                console.log("Creazione intervento strategico per causa aggregata:", causa.testoCausa);
                                                const categoriaMappata = causa.categoriaCausa ? mapCategoriaToArea(causa.categoriaCausa) : 'Altro';
                                                navigate('/progettazione/interventi', { 
                                                    state: { 
                                                        prefillFromAggregatedRCA: {
                                                            titolo: `Risolvere Causa Radice: ${causa.testoCausa.substring(0,50)}...`,
                                                            descrizione: `Intervento strategico per affrontare la causa radice sistemica: '${causa.testoCausa}'.\n\nDettaglio fornito dall'AI sulla causa:\n${causa.descrizioneDettagliataAI}\n\nGap principali influenzati (Item ID):\n${causa.gapDirettamenteImplicati?.map(g=>g.gapItemId).join(', ') || 'Vari'}`,
                                                            area: categoriaMappata,
                                                            priorita: mapRilevanzaToPriorita(causa.rilevanzaComplessiva)
                                                        } 
                                                    } 
                                                });
                                            }}
                                        >
                                            Crea Intervento da Causa
                                        </Button>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))
                    ) : (
                        aggregatedRCAData.statusAnalisi === 'COMPLETED' && <Alert severity="info" sx={{mt: 1}}>Nessuna causa radice aggregata è stata identificata dall'analisi AI per i gap selezionati.</Alert>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default GapAnalysisPage;
