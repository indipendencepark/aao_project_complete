// START OF FILE client/src/pages/progettazione/InterventiPage.js (Versione Completa e Pulita)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLocation, Link as RouterLink } from 'react-router-dom'; // Rimosso useSearchParams se non usato
import {
    Box, Typography, Paper, Grid, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Alert, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
    Select, MenuItem, CircularProgress, List, ListItem, ListItemText,
    Divider, Tooltip, Slider, ListItemIcon, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { it } from 'date-fns/locale';

// Icons
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link'; // Per i riferimenti KB

// --- Funzioni Utility ---
// (Definite qui o importate da un file utils)
const getPriorityColor = (priority) => {
    if (priority === 'alta') return 'error';
    if (priority === 'media') return 'warning';
    if (priority === 'bassa') return 'success';
    return 'default';
};
const getPriorityLabel = (priority) => priority?.charAt(0).toUpperCase() + priority?.slice(1) || priority || 'N/D';
const getStatusColor = (status) => {
    const statusMap = {
        completato: 'success',
        in_corso: 'primary',
        approvato: 'info',
        pianificato: 'info',
        da_approvare: 'secondary',
        annullato: 'error',
        suggerito: 'default',
        in_attesa: 'default',
    };
    return statusMap[status] || 'default';
};
const getStatusLabel = (status) => status?.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || status || 'N/D';
const getAreaLabel = (area) => {
    const areaMap = { Org: 'Organizzativa', Admin: 'Amministrativa', Acct: 'Contabile', Crisi: 'Ril. Crisi', IT: 'IT' };
    return areaMap[area] || area || 'Altro';
};
const mapArea = (itemId) => { // Funzione specifica per mappare da ID Gap (usata per prefill)
    if (!itemId) return 'Altro';
    const prefix = itemId.split('.')[0]?.toUpperCase();
    switch (prefix) {
        case 'B': return 'Org';
        case 'C': return 'Admin';
        case 'D': return 'Acct';
        case 'E': return 'Crisi';
        default: return 'Altro';
    }
};
// Funzione per parsare date in modo sicuro per lo stato iniziale del modal
const parseDateOrNull = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    return date instanceof Date && !isNaN(date) ? date : null;
};


// --- Componente Form Nuovo Intervento ---
const NewInterventoForm = ({ onSave, onCancel, isLoading, apiError, apiSuccess, initialData = {} }) => {
    const [formData, setFormData] = useState({
      titolo: initialData.titolo || '',
      descrizione: initialData.descrizione || '',
      area: initialData.area || '',
      priorita: initialData.priorita || 'media',
      tempistica_stimata: initialData.tempistica_stimata || '',
      risorse_necessarie: initialData.risorse_necessarie || '',
      gap_correlati: initialData.gap_correlati || [],
    });
    // Aggiungere qui caricamento e selezione manuale Gap se necessario in futuro

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Aggiungi 'origin: manuale' quando si salva da questo form
        onSave({ ...formData, origin: 'manuale' });
    };

    return (
         <Paper sx={{ p: 3 }}>
             <Typography variant="h5" gutterBottom>
                {initialData.titolo ? 'Nuovo Intervento (da Gap)' : 'Nuovo Intervento Manuale'}
             </Typography>
             {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
             {apiSuccess && <Alert severity="success" sx={{ mb: 2 }}>{apiSuccess}</Alert>}
             <form onSubmit={handleSubmit}>
                 <Grid container spacing={2}> {/* Ridotto spacing */}
                    <Grid item xs={12}> <TextField required name="titolo" label="Titolo Intervento" value={formData.titolo} onChange={handleInputChange} fullWidth disabled={isLoading} size="small" InputLabelProps={{ shrink: !!formData.titolo }}/> </Grid>
                    <Grid item xs={12}> <TextField name="descrizione" label="Descrizione Dettagliata" value={formData.descrizione} onChange={handleInputChange} fullWidth multiline rows={4} disabled={isLoading} size="small" InputLabelProps={{ shrink: !!formData.descrizione }}/> </Grid>
                    <Grid item xs={12} sm={6}>
                         <FormControl fullWidth required size="small">
                            <InputLabel id="area-label-new">Area</InputLabel>
                            <Select name="area" labelId="area-label-new" label="Area" value={formData.area} onChange={handleInputChange} disabled={isLoading}> <MenuItem value=""><em>Seleziona</em></MenuItem><MenuItem value="Org">Organizzativa</MenuItem><MenuItem value="Admin">Amministrativa</MenuItem><MenuItem value="Acct">Contabile</MenuItem><MenuItem value="Crisi">Rilevazione Crisi</MenuItem><MenuItem value="IT">IT</MenuItem><MenuItem value="Altro">Altro</MenuItem></Select>
                         </FormControl>
                    </Grid>
                     <Grid item xs={12} sm={6}>
                         <FormControl fullWidth required size="small">
                            <InputLabel id="prio-label-new">Priorità</InputLabel>
                            <Select name="priorita" labelId="prio-label-new" label="Priorità" value={formData.priorita} onChange={handleInputChange} disabled={isLoading}> <MenuItem value="bassa">Bassa</MenuItem><MenuItem value="media">Media</MenuItem><MenuItem value="alta">Alta</MenuItem></Select>
                         </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}> <TextField name="tempistica_stimata" label="Tempistica Stimata (es. 30 giorni)" value={formData.tempistica_stimata} onChange={handleInputChange} fullWidth disabled={isLoading} size="small"/> </Grid>
                    <Grid item xs={12} sm={6}> <TextField name="risorse_necessarie" label="Risorse Necessarie (es. Consulente)" value={formData.risorse_necessarie} onChange={handleInputChange} fullWidth disabled={isLoading} size="small"/> </Grid>
                     <Grid item xs={12}>
                         <FormControl fullWidth size="small">
                           <InputLabel id="gap-select-label">Gap Correlati (Info)</InputLabel>
                           <Select
                             labelId="gap-select-label" label="Gap Correlati (Info)" multiple
                             name="gap_correlati"
                             value={formData.gap_correlati}
                             readOnly // Non modificabile da qui
                             renderValue={(selected) => selected.map(id => `ID ...${String(id).slice(-6)}`).join(', ') || 'Nessuno'}
                           >
                              {formData.gap_correlati.map((gapId) => (
                                  <MenuItem key={gapId} value={gapId} disabled> Gap ID: ...{String(gapId).slice(-6)} </MenuItem>
                              ))}
                           </Select>
                         </FormControl>
                     </Grid>
                     <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                        <Button variant="outlined" onClick={onCancel} disabled={isLoading}> Annulla </Button>
                        <Button type="submit" variant="contained" color="primary" disabled={isLoading}> {isLoading ? <CircularProgress size={24} /> : 'Crea Intervento'} </Button>
                    </Grid>
                 </Grid>
             </form>
         </Paper>
    );
};

// --- Componente Modal/Form Modifica Intervento ---
const EditInterventoModal = ({ open, onClose, onSave, intervento, isLoading }) => {
    const [formData, setFormData] = useState({ // Stato iniziale definito
        titolo: '', descrizione: '', area: '', priorita: 'media', stato: 'suggerito',
        responsabile: '', tempistica_stimata: '', risorse_necessarie: '',
        data_inizio_prevista: null, data_fine_prevista: null, data_completamento_effettiva: null,
        completamento_perc: 0, note_avanzamento: '',
    });

    useEffect(() => {
        if (intervento) {
            setFormData({
                titolo: intervento.titolo || '',
                descrizione: intervento.descrizione || '', 
                area: intervento.area || '',
                priorita: intervento.priorita || 'media',
                stato: intervento.stato || 'suggerito',
                responsabile: intervento.responsabile || '',
                tempistica_stimata: intervento.tempistica_stimata || '',
                risorse_necessarie: intervento.risorse_necessarie || '',
                data_inizio_prevista: parseDateOrNull(intervento.data_inizio_prevista),
                data_fine_prevista: parseDateOrNull(intervento.data_fine_prevista),
                data_completamento_effettiva: parseDateOrNull(intervento.data_completamento_effettiva),
                completamento_perc: intervento.completamento_perc ?? 0,
                note_avanzamento: intervento.note_avanzamento || '',
            });
        }
        // Non serve else per resettare perché viene chiamato con intervento=null alla chiusura
    }, [intervento]); // Si attiva quando 'intervento' cambia

    const handleInputChange = (e) => { /* ... */ };
    const handleDateChange = (name, newValue) => { /* ... */ };
    const handleSliderChange = (event, newValue) => { setFormData(prev => ({ ...prev, completamento_perc: newValue })); };

    const handleInternalSave = () => {
        const dataToSave = {
            ...formData,
            completamento_perc: Number(formData.completamento_perc),
            data_inizio_prevista: formData.data_inizio_prevista?.toISOString().split('T')[0] || null,
            data_fine_prevista: formData.data_fine_prevista?.toISOString().split('T')[0] || null,
            data_completamento_effettiva: formData.data_completamento_effettiva?.toISOString().split('T')[0] || null,
        };
        onSave(intervento._id, dataToSave); // Passa ID e dati aggiornati
    };

    if (!open || !intervento) return null; // Renderizza solo se open e intervento sono validi

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
             <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Modifica Intervento: {intervento.titolo} {/* Mostra titolo originale */}
                <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                    <Grid container spacing={2} sx={{ pt: 1 }}> {/* Ridotto spacing e pt */}
                        {/* Riga 1: Titolo, Priorità */}
                        <Grid item xs={12} sm={8}> <TextField name="titolo" label="Titolo" value={formData.titolo} onChange={handleInputChange} fullWidth disabled={isLoading} size="small"/> </Grid>
                        <Grid item xs={12} sm={4}>
                           <FormControl fullWidth size="small">
                              <InputLabel id="prio-label-edit">Priorità</InputLabel>
                              <Select name="priorita" labelId="prio-label-edit" label="Priorità" value={formData.priorita} onChange={handleInputChange} disabled={isLoading}> <MenuItem value="bassa">Bassa</MenuItem><MenuItem value="media">Media</MenuItem><MenuItem value="alta">Alta</MenuItem></Select>
                           </FormControl>
                        </Grid>
                        {/* Riga 2: Descrizione */}
                        <Grid item xs={12}> 
                            <TextField 
                                name="descrizione" 
                                label="Descrizione Dettagliata Intervento" 
                                value={formData.descrizione} 
                                onChange={handleInputChange} 
                                fullWidth 
                                multiline 
                                rows={4} // O più se serve
                                disabled={isLoading} 
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                helperText="Descrizione dell'intervento, inclusi dettagli operativi."
                            /> 
                        </Grid>
                        {/* Riga 3: Stato, Responsabile */}
                        <Grid item xs={12} sm={6}>
                             <FormControl fullWidth size="small">
                               <InputLabel id="stato-label-edit">Stato</InputLabel>
                               <Select name="stato" labelId="stato-label-edit" label="Stato" value={formData.stato} onChange={handleInputChange} disabled={isLoading}>
                                   <MenuItem value="suggerito">Suggerito</MenuItem><MenuItem value="da_approvare">Da Approvare</MenuItem><MenuItem value="approvato">Approvato</MenuItem><MenuItem value="pianificato">Pianificato</MenuItem><MenuItem value="in_corso">In Corso</MenuItem><MenuItem value="completato">Completato</MenuItem><MenuItem value="annullato">Annullato</MenuItem><MenuItem value="in_attesa">In Attesa</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}> <TextField name="responsabile" label="Responsabile" value={formData.responsabile} onChange={handleInputChange} fullWidth disabled={isLoading} size="small"/> </Grid>
                        {/* Riga 4: Tempistica, Risorse */}
                        <Grid item xs={12} sm={6}> <TextField name="tempistica_stimata" label="Tempistica Stimata (Testo)" value={formData.tempistica_stimata} onChange={handleInputChange} fullWidth disabled={isLoading} size="small"/> </Grid>
                         <Grid item xs={12} sm={6}> <TextField name="risorse_necessarie" label="Risorse Necessarie" value={formData.risorse_necessarie} onChange={handleInputChange} fullWidth disabled={isLoading} size="small"/> </Grid>
                         {/* Riga 5: Date */}
                         <Grid item xs={12} sm={4}> <DatePicker label="Inizio Previsto" value={formData.data_inizio_prevista} onChange={(d) => handleDateChange('data_inizio_prevista', d)} slots={{ textField: (params) => <TextField {...params} fullWidth size="small" disabled={isLoading}/> }} /> </Grid>
                         <Grid item xs={12} sm={4}> <DatePicker label="Fine Prevista" value={formData.data_fine_prevista} onChange={(d) => handleDateChange('data_fine_prevista', d)} slots={{ textField: (params) => <TextField {...params} fullWidth size="small" disabled={isLoading}/> }} /> </Grid>
                         <Grid item xs={12} sm={4}> <DatePicker label="Completamento Effettivo" value={formData.data_completamento_effettiva} onChange={(d) => handleDateChange('data_completamento_effettiva', d)} slots={{ textField: (params) => <TextField {...params} fullWidth size="small" disabled={isLoading}/> }} /> </Grid>
                         {/* Riga 6: Completamento % */}
                         <Grid item xs={12}>
                             <Typography gutterBottom variant="caption">Completamento (%)</Typography>
                             <Slider name="completamento_perc" value={formData.completamento_perc ?? 0} onChange={handleSliderChange} aria-labelledby="input-slider" valueLabelDisplay="auto" step={5} marks min={0} max={100} disabled={isLoading} />
                             <Typography variant="caption" display="block" align="right">{formData.completamento_perc ?? 0}%</Typography>
                         </Grid>
                         {/* Riga 7: Note Avanzamento */}
                         <Grid item xs={12}> <TextField name="note_avanzamento" label="Note Avanzamento" value={formData.note_avanzamento} onChange={handleInputChange} fullWidth multiline rows={3} disabled={isLoading} size="small"/> </Grid>

                         {/* Sezione Dati AI (sola lettura, se intervento generato da AI) */}
                         {intervento.origin === 'ai_generated' && (
                            <>
                                <Grid item xs={12}><Divider sx={{my:2}}><Chip label="Dettagli Generati da AI" size="small" /></Divider></Grid>
                                {intervento.motivazioneContestualizzataAI && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Motivazione AI Contestualizzata:</Typography>
                                        <Typography variant="body2" paragraph sx={{ pl: 1, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                                            {intervento.motivazioneContestualizzataAI}
                                        </Typography>
                                    </Grid>
                                )}
                                {intervento.obiettivo_intervento && (
                                     <Grid item xs={12}>
                                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Obiettivo Specifico (AI/KB):</Typography>
                                        <Typography variant="body2" paragraph sx={{ pl: 1, whiteSpace: 'pre-wrap' }}>
                                            {intervento.obiettivo_intervento}
                                        </Typography>
                                    </Grid>
                                )}
                                {intervento.kpi_monitoraggio_suggeriti && intervento.kpi_monitoraggio_suggeriti.length > 0 && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>KPI Monitoraggio Suggeriti (AI/KB):</Typography>
                                        <List dense disablePadding sx={{pl:1}}>
                                            {intervento.kpi_monitoraggio_suggeriti.map((kpi, idx) => (
                                                <ListItem key={`kpi-${idx}`} sx={{py:0}}><ListItemText secondary={`- ${kpi}`} /></ListItem>
                                            ))}
                                        </List>
                                    </Grid>
                                )}
                                {intervento.riferimentiKbIntervento && intervento.riferimentiKbIntervento.length > 0 && (
                                    <Grid item xs={12}>
                                        <Accordion sx={{ boxShadow: 'none', border: '1px solid #eee', '&:before': {display: 'none'} }}>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Riferimenti Knowledge Base usati dall'AI ({intervento.riferimentiKbIntervento.length})</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ maxHeight: 200, overflow: 'auto' }}>
                                                <List dense>
                                                    {intervento.riferimentiKbIntervento.map((ref, idx) => (
                                                        <ListItem key={`ref-${idx}`} alignItems="flex-start">
                                                            <ListItemIcon sx={{minWidth: 30, mt:0.5}}><LinkIcon fontSize="small"/></ListItemIcon>
                                                            <ListItemText
                                                                primary={
                                                                    <Typography variant="caption" color="textSecondary">
                                                                        {`Chunk ID: ${ref.chunkId || 'N/A'} (Sim: ${ref.similarita?.toFixed(3) || 'N/A'})`}
                                                                    </Typography>
                                                                }
                                                                secondary={ref.estrattoTesto || 'Testo non disponibile'}
                                                                secondaryTypographyProps={{variant:'body2', fontStyle:'italic'}}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </AccordionDetails>
                                        </Accordion>
                                    </Grid>
                                )}
                            </>
                        )}
                        
                        {/* Info Origine non modificabili (come prima) */}
                        <Grid item xs={12}><Divider sx={{my:1}}>Info Origine (Non Modificabile)</Divider></Grid>
                         <Grid item xs={12} sm={6}><Typography variant="body2"><strong>Area:</strong> {getAreaLabel(intervento.area)}</Typography></Grid>
                         <Grid item xs={12} sm={6}><Typography variant="body2"><strong>Origine:</strong> {intervento.origin}</Typography></Grid>
                         {/* Visualizzazione Semplificata Gap Correlati (se necessario mostrare più dettagli, andrebbe popolato meglio) */}
                         {intervento.gap_correlati && intervento.gap_correlati.length > 0 && (
                            <Grid item xs={12}>
                                <Typography variant="body2">
                                    <strong>Gap Correlati:</strong> {intervento.gap_correlati.map(g => typeof g === 'string' ? `ID ...${g.slice(-4)}` : (g.item_id || `ID ...${g._id.slice(-4)}`)).join(', ')}
                                </Typography>
                            </Grid>
                         )}
                    </Grid>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isLoading}>Annulla</Button>
                <Button onClick={handleInternalSave} variant="contained" color="primary" startIcon={<SaveIcon />} disabled={isLoading}> {isLoading ? <CircularProgress size={20} /> : 'Salva Modifiche'} </Button>
            </DialogActions>
        </Dialog>
    );
};

// --- Componente Principale InterventiPage (AGGIORNATO v2 - No load on default) ---

const InterventiPage = () => {
    // Stati
    const [interventi, setInterventi] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [filters, setFilters] = useState({ area: '', priorita: '', stato: '' });
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedInterventoToDelete, setSelectedInterventoToDelete] = useState(null);
    const [showNewForm, setShowNewForm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedInterventoEdit, setSelectedInterventoEdit] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);
    // --- NUOVI STATI per Filtro Checklist ---
    const [checklists, setChecklists] = useState([]); // Lista checklist per dropdown
    const [loadingChecklists, setLoadingChecklists] = useState(false); // Loading specifico per checklist
    const [selectedChecklistId, setSelectedChecklistId] = useState(''); // Filtro checklist attivo ('', 'id', 'manuali', 'tutti_ai')
    // -----------------------------------------

    // Gestione Prefill da location.state
    const location = useLocation();
    const [prefillData, setPrefillData] = useState({}); // Stato per prefill
    useEffect(() => {
        if (location.state?.prefillFromGap) {
             console.log("Dati prefill da Gap ricevuti:", location.state.prefillFromGap);
             setPrefillData({
                 titolo: `Azione Correttiva per Gap ${location.state.prefillFromGap.item_id}`,
                 descrizione: `GAP RILEVATO:\n${location.state.prefillFromGap.descrizione || ''}\n\nIMPLICAZIONI:\n${location.state.prefillFromGap.implicazioni || ''}\n\nSUGGERIMENTI AI PRECEDENTI:\n- ${location.state.prefillFromGap.suggerimenti_ai?.join('\n- ') || 'Nessuno'}`,
                 area: mapArea(location.state.prefillFromGap.item_id),
                 priorita: location.state.prefillFromGap.livello_rischio === 'basso' ? 'bassa' : (location.state.prefillFromGap.livello_rischio === 'alto' ? 'alta' : 'media'), // Mappa rischio a priorità
                 gap_correlati: [location.state.prefillFromGap._id]
             });
             setShowNewForm(true); // Apri automaticamente il form nuovo
             // Pulisce lo stato della location per evitare riaperture al refresh
             window.history.replaceState({}, document.title)
        }
    }, [location.state]); // Dipende solo da location.state

     // --- NUOVO: Carica Checklist per il filtro ---
     useEffect(() => {
        const fetchChecklistListForFilter = async () => {
            setLoadingChecklists(true);
            try {
                // Prendiamo solo _id, nome e nome cliente per il dropdown
                const response = await axios.get('http://localhost:5001/api/checklist?select=nome,cliente.nome');
                setChecklists(response.data.data || []);
            } catch (err) {
                console.error("Errore caricamento checklist per filtro:", err);
                // Non blocchiamo tutto, al massimo il filtro non mostra le checklist
                setChecklists([]);
            } finally {
                setLoadingChecklists(false);
            }
        };
        fetchChecklistListForFilter();
    }, []); // Esegui solo al mount

    // --- fetchInterventi (MODIFICATO per non caricare se selectedChecklistId è vuoto) ---
    const fetchInterventi = useCallback(async (showSuccess = false) => {
        // Reset stati principali
        setLoading(true);
        setError(null);
        if (!showSuccess) setSuccessMessage(null);

        // *** MODIFICA: Non fare la chiamata API se nessuna checklist/opzione è selezionata ***
        if (selectedChecklistId === '') {
            console.log(">>> Fetch interventi saltata: nessuna checklist origine selezionata.");
            setInterventi([]); // Assicura che la lista sia vuota
            setLoading(false); // Termina il caricamento
            return; // Esce dalla funzione
        }
        // **********************************************************************************

        // Prepara i parametri per l'API (solo se selectedChecklistId NON è vuoto)
        const params = { ...filters };
        params.checklist_id = selectedChecklistId; // Aggiunge sempre il filtro selezionato

        console.log(">>> Fetching interventi con params:", params);
        try {
            const response = await axios.get('http://localhost:5001/api/interventions', { params });
            console.log("Dati interventi ricevuti:", response.data.data);
            setInterventi(response.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Errore recupero interventi.');
            setInterventi([]); // Svuota anche in caso di errore
        } finally {
            setLoading(false);
        }
    }, [filters, selectedChecklistId]); // Dipende ancora da filters e selectedChecklistId


    // useEffect per chiamare fetchInterventi quando cambiano i filtri o la checklist selezionata
    useEffect(() => {
        fetchInterventi();
    }, [fetchInterventi]); // Ora dipende da fetchInterventi che a sua volta dipende da filters e selectedChecklistId

    // Handlers Filtri (esistente)
    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // --- NUOVO: Handler per cambio filtro checklist ---
    const handleChecklistFilterChange = (event) => {
        setSelectedChecklistId(event.target.value);
    };
    // ---------------------------------------------

    // Handlers Dialogo Eliminazione
    const handleOpenDeleteDialog = (intervento) => { setSelectedInterventoToDelete(intervento); setOpenDeleteDialog(true); };
    const handleCloseDeleteDialog = () => { setOpenDeleteDialog(false); setSelectedInterventoToDelete(null); };
    const handleDeleteIntervento = async (id) => {
        if (!id) return;
        // Usiamo savingEdit come stato di loading per evitare conflitti
        setSavingEdit(true); setError(null); setSuccessMessage(null);
        try {
            await axios.delete(`http://localhost:5001/api/interventions/${id}`);
            setSuccessMessage('Intervento eliminato.');
            handleCloseDeleteDialog();
            fetchInterventi(true); // Ricarica mostrando messaggio
        } catch (err) { setError(err.response?.data?.message || 'Errore eliminazione.'); handleCloseDeleteDialog(); }
         finally { setSavingEdit(false); }
    };

    // Handlers Creazione/Modifica Form/Modal
    const handleShowNewForm = () => { setError(null); setSuccessMessage(null); setPrefillData({}); setShowNewForm(true); setShowEditModal(false); setSelectedInterventoEdit(null); };
    const handleHideNewForm = () => { setShowNewForm(false); setPrefillData({}); }; // Pulisci prefill all'annulla
    const handleOpenEditModal = (intervento) => { setError(null); setSuccessMessage(null); setSelectedInterventoEdit(intervento); setShowEditModal(true); setShowNewForm(false); };
    const handleCloseEditModal = () => { setShowEditModal(false); setSelectedInterventoEdit(null); };

    // Handler Salvataggio Nuovo
    const handleSaveNewIntervento = async (formData) => {
         setLoading(true); setError(null); setSuccessMessage(null);
         try {
             const response = await axios.post('http://localhost:5001/api/interventions', formData);
             setSuccessMessage(`Intervento "${response.data.data.titolo}" creato.`);
             handleHideNewForm(); // Chiude il form
             fetchInterventi(true);
         } catch (err) { setError(err.response?.data?.message || 'Errore creazione.'); setLoading(false); } // Mantieni form aperto su errore
         // finally non serve più qui
    };

    // Handler Salvataggio Modifica
    const handleSaveEditIntervento = async (id, formData) => {
         if (!id) return;
         setSavingEdit(true); setError(null); setSuccessMessage(null);
         try {
             const response = await axios.put(`http://localhost:5001/api/interventions/${id}`, formData);
             setSuccessMessage(`Intervento "${response.data.data.titolo}" aggiornato.`);
             handleCloseEditModal();
             fetchInterventi(true);
         } catch (err) { setError(err.response?.data?.message || 'Errore aggiornamento.'); /* Non chiudere modal su errore */ }
         finally { setSavingEdit(false); }
    };

    // --- RENDER DEL COMPONENTE ---
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
            <Box>
                {showNewForm ? (
                    <NewInterventoForm onSave={handleSaveNewIntervento} onCancel={handleHideNewForm} isLoading={loading} apiError={error} apiSuccess={successMessage} initialData={prefillData} />
                ) : (
                    <>
                        {/* Intestazione e pulsante Nuovo Manuale */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5">Interventi Suggeriti/Pianificati</Typography>
                            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleShowNewForm}>
                                Nuovo Intervento Manuale
                            </Button>
                        </Box>

                        {/* Alert Errori/Successo */}
                        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
                        {successMessage && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>}

                        {/* --- Box Filtri (AGGIORNATO con Select Checklist) --- */}
                        <Paper sx={{ p: 2, mb: 3 }}>
                            <Grid container spacing={2} alignItems="center">
                                {/* Select Checklist Origine */}
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small" disabled={loadingChecklists || loading}>
                                        <InputLabel id="checklist-filter-label">Checklist Origine</InputLabel>
                                        <Select
                                            labelId="checklist-filter-label"
                                            value={selectedChecklistId}
                                            label="Checklist Origine"
                                            onChange={handleChecklistFilterChange}
                                        >
                                            <MenuItem value=""><em>-- Seleziona Origine --</em></MenuItem> {/* Testo più esplicito */}
                                            <MenuItem value="tutti_ai">Tutti Generati da AI</MenuItem>
                                            <MenuItem value="manuali">Solo Creati Manualmente</MenuItem>
                                            <Divider />
                                            {loadingChecklists && <MenuItem disabled>Caricamento checklist...</MenuItem>}
                                            {checklists.map((cl) => (
                                                <MenuItem key={cl._id} value={cl._id}>{cl.nome} ({cl.cliente?.nome ?? 'N/D'})</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                 <Grid item xs={12} sm={6} md={3}>
                                     <FormControl fullWidth size="small" disabled={loading}>
                                        {/* ... Select Area ... */}
                                     </FormControl>
                                 </Grid>
                                 <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small" disabled={loading}>
                                        {/* ... Select Priorità ... */}
                                    </FormControl>
                                 </Grid>
                                 <Grid item xs={12} sm={6} md={3}>
                                     <FormControl fullWidth size="small" disabled={loading}>
                                         {/* ... Select Stato ... */}
                                     </FormControl>
                                 </Grid>
                             </Grid>
                         </Paper>

                         {/* Tabella Interventi */}
                         <Paper sx={{ p:0, mb: 4 }}>
                             {loading ? ( <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box> ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: 'grey.100' } }}>
                                                <TableCell>Titolo Intervento</TableCell>
                                                <TableCell>Area</TableCell>
                                                <TableCell>Priorità</TableCell>
                                                <TableCell>Stato</TableCell>
                                                <TableCell>Responsabile</TableCell>
                                                <TableCell>% Compl.</TableCell>
                                                <TableCell>Fine Prev.</TableCell>
                                                <TableCell align="right" sx={{pr: 2}}>Azioni</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {/* *** MODIFICA CONDIZIONE "NESSUN INTERVENTO" *** */}
                                            {interventi.length === 0 && selectedChecklistId === '' && (
                                                <TableRow><TableCell colSpan={8} align="center">Seleziona una "Checklist Origine" per visualizzare gli interventi.</TableCell></TableRow>
                                            )}
                                            {interventi.length === 0 && selectedChecklistId !== '' && !loading && (
                                                <TableRow><TableCell colSpan={8} align="center">Nessun intervento trovato con i filtri selezionati.</TableCell></TableRow>
                                            )}
                                            {/* ******************************************** */}                                            {interventi.map((i) => (
                                                <TableRow key={i._id} hover sx={{ '& td': { py: 1 } }}>
                                                    <TableCell sx={{ fontWeight: 500 }}>
                                                        <Tooltip 
                                                            title={
                                                                <Box sx={{maxWidth: 400}}> {/* Limita larghezza tooltip */}
                                                                    <Typography variant="caption" component="div" sx={{fontWeight:'bold', mb:0.5}}>Descrizione:</Typography>
                                                                    <Typography variant="caption" component="div" sx={{whiteSpace: 'pre-wrap'}}>
                                                                        {i.descrizione || 'Nessuna descrizione dettagliata disponibile.'}
                                                                    </Typography>
                                                                    {i.origin === 'ai_generated' && i.motivazioneContestualizzataAI && (
                                                                        <>
                                                                        <Typography variant="caption" component="div" sx={{fontWeight:'bold', mt:1, mb:0.5}}>Motivazione AI:</Typography>
                                                                        <Typography variant="caption" component="div" sx={{whiteSpace: 'pre-wrap', fontStyle:'italic'}}>
                                                                            {i.motivazioneContestualizzataAI}
                                                                        </Typography>
                                                                        </>
                                                                    )}
                                                                </Box>
                                                            } 
                                                            placement="top-start"
                                                            arrow
                                                        >
                                                            <span>{i.titolo}</span>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell>{getAreaLabel(i.area)}</TableCell>
                                                    <TableCell><Chip label={getPriorityLabel(i.priorita)} color={getPriorityColor(i.priorita)} size="small"/></TableCell>
                                                    <TableCell><Chip label={getStatusLabel(i.stato)} color={getStatusColor(i.stato)} size="small"/></TableCell>
                                                    <TableCell>{i.responsabile || '-'}</TableCell>
                                                    <TableCell align="center">{i.completamento_perc ?? 0}%</TableCell>
                                                    <TableCell>{i.data_fine_prevista ? new Date(i.data_fine_prevista).toLocaleDateString('it-IT') : '-'}</TableCell>
                                                    <TableCell padding="none" align="right" sx={{pr: 1}}>
                                                        <Tooltip title="Modifica/Dettaglio Intervento"><IconButton size="small" color="primary" onClick={() => handleOpenEditModal(i)}><EditIcon fontSize="inherit"/></IconButton></Tooltip>
                                                        <Tooltip title="Elimina Intervento"><IconButton size="small" color="error" onClick={() => handleOpenDeleteDialog(i)} disabled={savingEdit}><DeleteIcon fontSize="inherit"/></IconButton></Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                             )}
                         </Paper>

                         {/* Dialog Eliminazione */}
                         <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                            <DialogTitle>Conferma Eliminazione</DialogTitle>
                            <DialogContent>
                                <Typography>Eliminare l'intervento "{selectedInterventoToDelete?.titolo}"?</Typography>
                                <Alert severity="warning" sx={{mt:1}}>L'intervento verrà rimosso anche dai Piani d'Azione.</Alert>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseDeleteDialog} disabled={savingEdit}>Annulla</Button> {/* Usa savingEdit */}
                                <Button onClick={() => handleDeleteIntervento(selectedInterventoToDelete?._id)} color="error" disabled={savingEdit}> {savingEdit ? <CircularProgress size={20}/> : 'Elimina'} </Button>
                            </DialogActions>
                         </Dialog>

                         {/* Modal Modifica Intervento */}
                         <EditInterventoModal
                            open={showEditModal}
                            onClose={handleCloseEditModal}
                            onSave={handleSaveEditIntervento}
                            intervento={selectedInterventoEdit}
                            isLoading={savingEdit} // Passa savingEdit al modal
                         />
                     </>
                 )}
            </Box>
        </LocalizationProvider>
    );
};

export default InterventiPage;