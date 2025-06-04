import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Divider,
    Alert, FormControl, InputLabel, Select, MenuItem, CircularProgress, Tooltip,
    List, ListItem, ListItemText, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, ListItemIcon
} from '@mui/material';

import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot'; // IMPORTA TroubleshootIcon

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

    const [searchParams] = useSearchParams();
    const initialChecklistId = searchParams.get('checklist_id');

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

    const handleAnalyzeRootCause = async (gapToAnalyze) => {
        if (!gapToAnalyze || !gapToAnalyze._id || !selectedChecklistId) return;

        setAnalyzingRootCauseFor(gapToAnalyze._id);
        setRootCauseError(null);
        setCurrentRootCauses([]); // Pulisci risultati precedenti

        console.log(`Avvio analisi cause radice per Gap ID: ${gapToAnalyze._id} della Checklist ID: ${selectedChecklistId}`);
        try {

            const response = await axios.post(
                `http://localhost:5001/api/assessment/gaps/${gapToAnalyze._id}/root-cause`,
                { checklistId: selectedChecklistId  }
            );
            
            setCurrentRootCauses(response.data.data || []);
            setShowRootCauseModal(true); // Apri il modal con i risultati

            setGaps(prevGaps => prevGaps.map(g => 
                g._id === gapToAnalyze._id 
                ? { ...g, causeRadiceSuggeriteAI: response.data.data, ultimaAnalisiCauseRadice: new Date() } 
                : g
            ));

        } catch (err) {
            console.error("Errore analisi cause radice:", err);
            setRootCauseError(err.response?.data?.message || "Errore durante l'analisi delle cause radice.");

        } finally {
            setAnalyzingRootCauseFor(null);
        }
    };

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
        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
                <DialogTitle>Potenziali Cause Radice per: {gapTitle}</DialogTitle>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {!error && causes.length === 0 && <Alert severity="info">Nessuna causa radice suggerita o analisi non ancora effettuata.</Alert>}
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
                                                    <Typography component="span" variant="body2" color="text.primary" sx={{ fontWeight: 'bold' }}>
                                                        Motivazione AI:
                                                    </Typography>
                                                    {` ${causa.motivazioneAI || 'N/D'}`}
                                                    <br />
                                                    <Typography component="span" variant="caption" color="text.secondary">
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

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Gap Analysis</Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth disabled={loadingChecklists || loadingGaps}>
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

                    {selectedChecklistId && (
                       <>
                           <Grid item xs={12} md={3}>
                               <FormControl fullWidth size="small" disabled={loadingGaps || !selectedChecklistId}>
                                   <InputLabel id="area-label">Filtra Area</InputLabel>
                                   <Select labelId="area-label" name="area" value={filters.area} label="Filtra Area" onChange={handleFilterChange}>
                                       <MenuItem value="">Tutte</MenuItem><MenuItem value="B">Org (B)</MenuItem><MenuItem value="C">Admin (C)</MenuItem><MenuItem value="D">Acct (D)</MenuItem><MenuItem value="E">Crisi (E)</MenuItem>
                                   </Select>
                               </FormControl>
                           </Grid>
                           <Grid item xs={12} md={3}>
                               <FormControl fullWidth size="small" disabled={loadingGaps || !selectedChecklistId}>
                                   <InputLabel id="rischio-label">Filtra Rischio</InputLabel>
                                   <Select labelId="rischio-label" name="livello_rischio" value={filters.livello_rischio} label="Filtra Rischio" onChange={handleFilterChange}>
                                       <MenuItem value="">Tutti</MenuItem><MenuItem value="alto">Alto</MenuItem><MenuItem value="medio">Medio</MenuItem><MenuItem value="basso">Basso</MenuItem>
                                   </Select>
                               </FormControl>
                           </Grid>
                       </>
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
                                                    <Button size="small" onClick={() => { 
                                                        setCurrentRootCauses(gap.causeRadiceSuggeriteAI || []);
                                                        setShowRootCauseModal(true);
                                                        setRootCauseError(null);
                                                     }}> (Vedi) </Button>
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
                                                        onClick={() => handleAnalyzeRootCause(gap)}
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

            <RootCauseModal
                open={showRootCauseModal}
                onClose={() => { setShowRootCauseModal(false); setCurrentRootCauses([]); setRootCauseError(null); }}
                causes={currentRootCauses}
                gapTitle={gaps.find(g => g._id === (analyzingRootCauseFor || (currentRootCauses[0] && currentRootCauses[0].gap_analizzato_id) ))?.descrizione || 'Gap Selezionato'}
                error={rootCauseError}
            />
        </Box>
    );
};

export default GapAnalysisPage;
