// START OF FILE client/src/pages/diagnosi/GapAnalysisPage.js (AGGIORNATO v2)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link as RouterLink, useSearchParams } from 'react-router-dom'; // Aggiunto useSearchParams
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Divider,
    Alert, FormControl, InputLabel, Select, MenuItem, CircularProgress, Tooltip,
    List, ListItem, ListItemText, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, ListItemIcon // IMPORTA Dialog components
} from '@mui/material';
// Icons
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot'; // IMPORTA TroubleshootIcon
// Rimosso HelpOutlineIcon se non usato altrove

const GapAnalysisPage = () => {
    // Stati
    const [checklistsCompletate, setChecklistsCompletate] = useState([]);
    const [selectedChecklistId, setSelectedChecklistId] = useState('');
    const [gaps, setGaps] = useState([]);
    const [filteredGaps, setFilteredGaps] = useState([]);
    const [loadingChecklists, setLoadingChecklists] = useState(false);
    const [loadingGaps, setLoadingGaps] = useState(false);
    const [errorChecklists, setErrorChecklists] = useState(null); // Errore specifico checklist
    const [errorGaps, setErrorGaps] = useState(null); // Errore specifico gaps
    const [filters, setFilters] = useState({ area: '', livello_rischio: '' });
    // Stati per RCA
    const [analyzingRootCauseFor, setAnalyzingRootCauseFor] = useState(null); // ID del gap in analisi
    const [rootCauseError, setRootCauseError] = useState(null);
    const [showRootCauseModal, setShowRootCauseModal] = useState(false);
    const [currentRootCauses, setCurrentRootCauses] = useState([]);

    // Leggi checklist_id dai parametri URL all'avvio (se presente)
    const [searchParams] = useSearchParams();
    const initialChecklistId = searchParams.get('checklist_id');

    // Funzione per caricare l'elenco delle checklist COMPLETATE
    const fetchCompletedChecklists = useCallback(async () => { // useCallback per stabilità
        setLoadingChecklists(true); setErrorChecklists(null); setChecklistsCompletate([]);
        try {
            const response = await axios.get('http://localhost:5001/api/checklist');
            const completed = response.data.data?.filter(cl => cl.stato === 'completata') || [];
            setChecklistsCompletate(completed);
            console.log(">>> GapAnalysisPage: Elenco checklist completate caricato:", completed.length);

            // Se c'è un ID nell'URL e esiste nella lista, pre-selezionalo
            if (initialChecklistId && completed.some(cl => cl._id === initialChecklistId)) {
                console.log(`>>> GapAnalysisPage: Pre-seleziono checklist da URL: ${initialChecklistId}`);
                setSelectedChecklistId(initialChecklistId);
            }

        } catch (err) {
            console.error(">>> GapAnalysisPage: Errore caricamento elenco checklist:", err);
            setErrorChecklists(err.response?.data?.message || 'Errore nel recupero elenco checklist.');
        } finally { setLoadingChecklists(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialChecklistId]); // Dipende da initialChecklistId per la pre-selezione

    // Funzione per caricare i Gaps
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
            // Il filtro viene applicato dall'altro useEffect
        } catch (err) {
            console.error(">>> GapAnalysisPage: Errore caricamento gaps:", err);
            setErrorGaps(err.response?.data?.message || 'Errore nel recupero dei gap.');
            setGaps([]); setFilteredGaps([]);
        } finally { setLoadingGaps(false); }
    }, []); // useCallback senza dipendenze esterne

    // Funzione Handler per Chiamare l'API RCA:
    const handleAnalyzeRootCause = async (gapToAnalyze) => {
        if (!gapToAnalyze || !gapToAnalyze._id || !selectedChecklistId) return;

        setAnalyzingRootCauseFor(gapToAnalyze._id);
        setRootCauseError(null);
        setCurrentRootCauses([]); // Pulisci risultati precedenti

        console.log(`Avvio analisi cause radice per Gap ID: ${gapToAnalyze._id} della Checklist ID: ${selectedChecklistId}`);
        try {
            // Potresti voler passare relatedGapIds se hai una logica per identificarli
            const response = await axios.post(
                `http://localhost:5001/api/assessment/gaps/${gapToAnalyze._id}/root-cause`,
                { checklistId: selectedChecklistId /* , relatedGapIds: [] */ }
            );
            
            setCurrentRootCauses(response.data.data || []);
            setShowRootCauseModal(true); // Apri il modal con i risultati

            // Aggiorna i dati del gap nella lista 'gaps' per riflettere la nuova analisi (opzionale)
            // Questo eviterebbe un refetch completo se vuoi solo aggiornare la singola card
            setGaps(prevGaps => prevGaps.map(g => 
                g._id === gapToAnalyze._id 
                ? { ...g, causeRadiceSuggeriteAI: response.data.data, ultimaAnalisiCauseRadice: new Date() } 
                : g
            ));

        } catch (err) {
            console.error("Errore analisi cause radice:", err);
            setRootCauseError(err.response?.data?.message || "Errore durante l'analisi delle cause radice.");
            // Potresti voler mostrare l'errore in un alert o nel modal
        } finally {
            setAnalyzingRootCauseFor(null);
        }
    };

    // useEffect per caricare elenco checklist al mount
    useEffect(() => {
        fetchCompletedChecklists();
    }, [fetchCompletedChecklists]); // Aggiunta dipendenza corretta

    // useEffect per caricare i Gaps quando cambia la checklist selezionata
    useEffect(() => {
        // Non chiamare fetchGaps se stiamo ancora caricando le checklist
        // o se l'ID selezionato non è valido (es. stringa vuota)
        if (!loadingChecklists && selectedChecklistId) {
             fetchGaps(selectedChecklistId);
        } else if (!selectedChecklistId) {
            setGaps([]); // Svuota i gap se deseleziono
            setFilteredGaps([]);
        }
    }, [selectedChecklistId, fetchGaps, loadingChecklists]); // Aggiunta dipendenza loadingChecklists

    // useEffect per applicare filtri frontend
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


    // Handler cambio filtri
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        console.log(`>>> GapAnalysisPage: handleFilterChange chiamata: name=${name}, value=${value}`);
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
    };

    // Handler cambio checklist selezionata
    const handleChecklistChange = (event) => {
        const newId = event.target.value;
        console.log(`>>> GapAnalysisPage: Checklist selezionata cambiata a: ${newId}`);
        setSelectedChecklistId(newId);
        // Resetta errori e filtri quando cambio checklist
        setErrorGaps(null);
        // Potresti voler resettare anche i filtri qui, dipende dall'usabilità desiderata
        // setFilters({ area: '', livello_rischio: '' });
    };

    // --- Funzioni Utility Rischio ---
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
    // --- Fine Funzioni Utility Rischio ---\

    // --- Funzione Rimossa ---
    // const generateAISuggestions = ...

    // Modal per Visualizzare le Cause Radice
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

            {/* Selettore Checklist e Filtri */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                     {/* Selettore Checklist */}
                     <Grid item xs={12} md={6}>
                        <FormControl fullWidth disabled={loadingChecklists || loadingGaps}>
                            <InputLabel id="checklist-select-label">Seleziona Checklist Completata</InputLabel>
                            <Select
                                labelId="checklist-select-label"
                                value={selectedChecklistId} // Usa direttamente l'ID
                                label="Seleziona Checklist Completata"
                                onChange={handleChecklistChange} // Usa handler dedicato
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

                    {/* Filtri Gap (visibili solo se una checklist è selezionata) */}
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

            {/* Visualizzazione Risultati Gap */}
             {selectedChecklistId && ( // Mostra solo se una checklist è selezionata
                 <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Gap Rilevati
                        {!loadingGaps && ` (${filteredGaps.length} visualizzati su ${gaps.length} totali)`}
                    </Typography>
                     {loadingGaps ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
                    ) : errorGaps ? ( // Errore specifico caricamento GAP
                        <Alert severity="error">{errorGaps}</Alert>
                    ) : gaps.length === 0 ? ( // Nessun gap trovato per la checklist
                         <Alert severity="info"> Nessun gap rilevato per la checklist selezionata. </Alert>
                     ) : filteredGaps.length === 0 ? ( // Gap trovati ma nessuno corrisponde ai filtri
                         <Alert severity="warning"> Nessun gap trovato con i filtri applicati. </Alert>
                     ) : (
                        // Griglia con le Card dei Gap
                        <Grid container spacing={2}>
                            {filteredGaps.map((gap) => (
                                    <Grid item xs={12} sm={6} key={gap._id}> {/* sm={6} per 2 colonne da schermi small in su */}
                                        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                {/* Header Card con Rischio */}
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                    <Chip
                                                        icon={getRiskIcon(gap.livello_rischio)}
                                                        label={getRiskLabel(gap.livello_rischio)}
                                                        color={getRiskColor(gap.livello_rischio)}
                                                        size="small"
                                                        sx={{ mb: 1 }} // Spazio sotto il chip
                                                    />
                                                    {/* Potremmo aggiungere qui l'ID Domanda se utile */}
                                                    <Typography variant="caption" color="text.secondary">{gap.item_id}</Typography>
                                                </Box>
                                                {/* Testo Domanda */}
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                    {gap.domandaText || 'Testo domanda non disponibile'}
                                                 </Typography>
                                                 {/* Descrizione Gap */}
                                                <Typography variant="body2" sx={{ mb: 1.5 }}>
                                                    <strong>Gap:</strong> {gap.descrizione}
                                                </Typography>
                                                {/* Implicazioni */}
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    <strong>Implicazioni:</strong> {gap.implicazioni || 'Non specificate'}
                                                </Typography>

                                                {/* --- INIZIO NUOVA SEZIONE DATI ARRICCHITI AI (D3) --- */}
                                                {(gap.arricchitoConAI && (gap.riferimentiNormativiSpecificiAI?.length > 0 || gap.impattoStimatoAI?.livello || gap.prioritaRisoluzioneAI)) && (
                                                    <>
                                                        <Divider sx={{ my: 1.5 }}><Chip label="Analisi AI Avanzata" size="small" variant="outlined" /></Divider>
                                                        
                                                        {gap.impattoStimatoAI?.livello && gap.impattoStimatoAI.livello !== 'Non determinabile' && (
                                                            <Box sx={{ mb: 1 }}>
                                                                <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                                                                    Impatto Stimato AI:
                                                                    <Chip 
                                                                        label={`${gap.impattoStimatoAI.tipo || ''} - ${getRiskLabel(gap.impattoStimatoAI.livello)}`} 
                                                                        color={getRiskColor(gap.impattoStimatoAI.livello)} 
                                                                        size="small" 
                                                                        sx={{ ml: 1, textTransform: 'capitalize' }}
                                                                    />
                                                                </Typography>
                                                                {gap.impattoStimatoAI.descrizione && <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>{gap.impattoStimatoAI.descrizione}</Typography>}
                                                            </Box>
                                                        )}

                                                        {gap.prioritaRisoluzioneAI && (
                                                            <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', mb: gap.riferimentiNormativiSpecificiAI?.length > 0 ? 0.5 : 1 }}>
                                                                Priorità Risoluzione AI: 
                                                                <Chip 
                                                                    label={getRiskLabel(gap.prioritaRisoluzioneAI)} 
                                                                    color={getRiskColor(gap.prioritaRisoluzioneAI)} 
                                                                    size="small" 
                                                                    sx={{ ml: 1, textTransform: 'capitalize' }}
                                                                />
                                                            </Typography>
                                                        )}

                                                        {gap.riferimentiNormativiSpecificiAI && gap.riferimentiNormativiSpecificiAI.length > 0 && (
                                                            <Box sx={{ mb: 1 }}>
                                                                <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                                                                    Riferimenti Normativi (AI):
                                                                </Typography>
                                                                <List dense disablePadding sx={{ fontSize: '0.75rem', pl: 1 }}>
                                                                    {gap.riferimentiNormativiSpecificiAI.map((ref, idx) => (
                                                                        <ListItem key={`norm-${idx}`} sx={{ py: 0, alignItems: 'flex-start' }}>
                                                                            <ListItemText 
                                                                                primaryTypographyProps={{ variant: 'caption', fontStyle: 'italic' }}
                                                                                primary={`- ${ref}`} 
                                                                            />
                                                                        </ListItem>
                                                                    ))}
                                                                </List>
                                                            </Box>
                                                        )}
                                                    </>
                                                )}
                                                {/* --- FINE NUOVA SEZIONE DATI ARRICCHITI AI (D3) --- */}

                                                {/* --- INIZIO NUOVA SEZIONE RIFERIMENTI KB --- */}
                                                {gap.riferimentiKb && gap.riferimentiKb.length > 0 && (
                                                    <>
                                                        <Divider sx={{ my: 1 }} />
                                                        <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', mt: 1 }}>
                                                            Contesto dalla KB (usato da AI):
                                                        </Typography>
                                                        <List dense disablePadding sx={{ maxHeight: 100, overflow: 'auto', fontSize: '0.75rem' }}>
                                                            {gap.riferimentiKb.map((ref, idx) => (
                                                                <ListItem key={idx} sx={{ py: 0, alignItems: 'flex-start' }}>
                                                                    <Tooltip title={`ID Chunk: ${ref.chunkId} - Similarità: ${ref.similarita?.toFixed(3)}`}>
                                                                        <ListItemText 
                                                                            primaryTypographyProps={{ variant: 'caption', fontStyle: 'italic' }}
                                                                            primary={`- ${ref.estrattoTesto || 'N/D'}`} 
                                                                        />
                                                                    </Tooltip>
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    </>
                                                )}
                                                {/* --- FINE NUOVA SEZIONE RIFERIMENTI KB --- */}

                                                {/* Visualizza ultima analisi cause radice */}
                                                {gap.ultimaAnalisiCauseRadice && (
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                        Ultima analisi cause radice: {new Date(gap.ultimaAnalisiCauseRadice).toLocaleDateString()}
                                                        <Button size="small" onClick={() => { 
                                                            setCurrentRootCauses(gap.causeRadiceSuggeriteAI || []);
                                                            setShowRootCauseModal(true);
                                                            setRootCauseError(null); // Resetta errori precedenti
                                                         }}> (Vedi) </Button>
                                                    </Typography>
                                                )}

                                            </CardContent>
                                            {/* Azioni in fondo alla card */}
                                            <Box sx={{ p: 1, pt: 0, mt: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                {/* Bottone Dettagli (Esistente, se lo hai) */}
                                                <Button variant="outlined" size="small" disabled> Dettagli </Button>

                                                {/* --- NUOVO: Pulsante/Icona per Analisi Cause Radice --- */}
                                                <Tooltip title="Analizza Cause Radice con AI">
                                                    <span> {/* Wrapper necessario se IconButton è disabilitato */}
                                                        <IconButton
                                                            size="small"
                                                            color="secondary" // O un altro colore che preferisci
                                                            onClick={() => handleAnalyzeRootCause(gap)}
                                                            disabled={analyzingRootCauseFor === gap._id || !selectedChecklistId} // Disabilita se già in analisi per questo gap o se nessuna checklist è selezionata
                                                        >
                                                            {analyzingRootCauseFor === gap._id ? (
                                                                <CircularProgress size={18} color="inherit" />
                                                            ) : (
                                                                // Assicurati di aver importato TroubleshootIcon o un'altra icona
                                                                // import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
                                                                <TroubleshootIcon fontSize="small" />
                                                            )}
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                {/* --- FINE NUOVO PULSANTE/ICONA --- */}

                                                {/* Bottone Crea Intervento (Esistente) */}
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    component={RouterLink}
                                                    to={`/progettazione/interventi`} // Assicurati che il path sia corretto per creare un intervento basato su un gap
                                                    state={{ prefillFromGap: gap }} // Passa dati del gap per precompilare il form intervento
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

            {/* Modal per visualizzare le cause radice */}
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

// END OF FILE client/src/pages/diagnosi/GapAnalysisPage.js (AGGIORNATO v2)