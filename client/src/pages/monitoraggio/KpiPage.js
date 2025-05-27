import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Paper, Grid, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Alert, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { it } from 'date-fns/locale';

import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const NewKpiForm = ({ onSave, onCancel, isLoading, apiError, apiSuccess }) => {
    const [formData, setFormData] = useState({
        codice: '', nome: '', area: '', definizione: '', formula: '', unita: '', frequenza: 'mensile', utilita: '',
        valore_target: '', soglia_attenzione: '', soglia_allarme: '', attivo: true
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSubmit = {
           ...formData,
           valore_target: formData.valore_target !== '' ? Number(formData.valore_target) : null,
           soglia_attenzione: formData.soglia_attenzione !== '' ? Number(formData.soglia_attenzione) : null,
           soglia_allarme: formData.soglia_allarme !== '' ? Number(formData.soglia_allarme) : null,
        };
        onSave(dataToSubmit);
    };

   return (
       <Paper sx={{ p: 3 }}>
           <Typography variant="h5" gutterBottom>Nuovo KPI</Typography>
            {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
            {apiSuccess && <Alert severity="success" sx={{ mb: 2 }}>{apiSuccess}</Alert>}
           <form onSubmit={handleSubmit}>
               <Grid container spacing={3}>
                   <Grid item xs={12} sm={6}> <TextField required name="codice" label="Codice KPI" value={formData.codice} onChange={handleInputChange} fullWidth /> </Grid>
                   <Grid item xs={12} sm={6}> <TextField required name="nome" label="Nome KPI" value={formData.nome} onChange={handleInputChange} fullWidth /> </Grid>
                   <Grid item xs={12} sm={6}>
                       <FormControl fullWidth required>
                           <InputLabel id="area-label-new">Area</InputLabel>
                           <Select name="area" labelId="area-label-new" label="Area" value={formData.area} onChange={handleInputChange}> <MenuItem value="Commerciale">Commerciale</MenuItem> <MenuItem value="Logistica">Logistica</MenuItem> <MenuItem value="HR">HR</MenuItem> <MenuItem value="Acquisti">Acquisti</MenuItem> <MenuItem value="Produzione">Produzione</MenuItem> <MenuItem value="Finanza">Finanza</MenuItem> <MenuItem value="Altro">Altro</MenuItem> </Select>
                       </FormControl>
                   </Grid>
                    <Grid item xs={12} sm={6}>
                       <FormControl fullWidth>
                           <InputLabel id="freq-label-new">Frequenza Rilevazione</InputLabel>
                           <Select name="frequenza" labelId="freq-label-new" label="Frequenza Rilevazione" value={formData.frequenza} onChange={handleInputChange}> <MenuItem value="giornaliera">Giornaliera</MenuItem> <MenuItem value="settimanale">Settimanale</MenuItem> <MenuItem value="mensile">Mensile</MenuItem> <MenuItem value="trimestrale">Trimestrale</MenuItem> <MenuItem value="semestrale">Semestrale</MenuItem> <MenuItem value="annuale">Annuale</MenuItem> </Select>
                       </FormControl>
                   </Grid>
                   <Grid item xs={12}> <TextField name="definizione" label="Definizione" value={formData.definizione} onChange={handleInputChange} fullWidth multiline rows={2} /> </Grid>
                   <Grid item xs={12}> <TextField name="formula" label="Formula" value={formData.formula} onChange={handleInputChange} fullWidth /> </Grid>
                   <Grid item xs={12} sm={6}> <TextField name="unita" label="Unità di Misura" value={formData.unita} onChange={handleInputChange} fullWidth /> </Grid>
                   <Grid item xs={12} sm={6}> <TextField name="utilita" label="Utilità / Scopo" value={formData.utilita} onChange={handleInputChange} fullWidth /> </Grid>
                   <Grid item xs={12} sm={4}> <TextField name="valore_target" label="Valore Target" type="number" value={formData.valore_target} onChange={handleInputChange} fullWidth InputLabelProps={{ shrink: true }} /> </Grid>
                   <Grid item xs={12} sm={4}> <TextField name="soglia_attenzione" label="Soglia Attenzione" type="number" value={formData.soglia_attenzione} onChange={handleInputChange} fullWidth InputLabelProps={{ shrink: true }}/> </Grid>
                   <Grid item xs={12} sm={4}> <TextField name="soglia_allarme" label="Soglia Allarme" type="number" value={formData.soglia_allarme} onChange={handleInputChange} fullWidth InputLabelProps={{ shrink: true }}/> </Grid>
                   <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                       <Button variant="outlined" onClick={onCancel} disabled={isLoading}> Annulla </Button>
                       <Button type="submit" variant="contained" color="primary" disabled={isLoading}> {isLoading ? <CircularProgress size={24} /> : 'Salva KPI'} </Button>
                   </Grid>
               </Grid>
           </form>
       </Paper>
   );
};

const AddValueForm = ({ kpi, onSave, onCancel, isLoading, apiError }) => {
    const [localFormData, setLocalFormData] = useState({ valore: '', data: new Date(), note: ''});

    const handleLocalChange = (e) => {
        const { name, value } = e.target;
        setLocalFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLocalDateChange = (newDate) => {
        setLocalFormData(prev => ({ ...prev, data: newDate }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSubmit = {
            valore: localFormData.valore !== '' ? Number(localFormData.valore) : null,
            data: localFormData.data ? localFormData.data.toISOString() : null,
            note: localFormData.note
        };
         if (dataToSubmit.valore === null || !dataToSubmit.data) {
             alert("Valore e Data sono obbligatori.");
             return;
         }
        onSave(dataToSubmit);
    };

   return (
       <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Aggiungi Valore per: {kpi?.nome}</Typography>
          {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

          <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                      <TextField required label="Valore Rilevato" name="valore" type="number" value={localFormData.valore} onChange={handleLocalChange} fullWidth InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                       <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                           <DatePicker
                               label="Data Rilevazione/Periodo"
                               value={localFormData.data}
                               onChange={handleLocalDateChange}
                               slots={{ textField: (params) => <TextField {...params} required fullWidth /> }}
                           />
                       </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12}>
                      <TextField label="Note" name="note" multiline rows={3} value={localFormData.note} onChange={handleLocalChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                     <Button variant="outlined" onClick={onCancel} disabled={isLoading}> Annulla </Button>
                     <Button type="submit" variant="contained" color="primary" disabled={isLoading}> {isLoading ? <CircularProgress size={24} /> : 'Salva Valore'} </Button>
                 </Grid>
              </Grid>
          </form>
      </Paper>
  );
};

const KpiPage = () => {
  console.log("--- RENDER KpiPage INIZIATO ---");

  const [kpis, setKpis] = useState([]);
  const [filteredKpis, setFilteredKpis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [filters, setFilters] = useState({ area: '', frequenza: '' });
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedKpiToDelete, setSelectedKpiToDelete] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedKpiDetail, setSelectedKpiDetail] = useState(null);
  const [selectedKpiValues, setSelectedKpiValues] = useState([]);
  const [loadingValues, setLoadingValues] = useState(false);
  const [errorValues, setErrorValues] = useState(null);
  const [showAddValueForm, setShowAddValueForm] = useState(false);
  const [savingValue, setSavingValue] = useState(false);

  const fetchKpis = async () => {
    console.log(">>> fetchKpis INIZIATA");
    setLoading(true); setError(null); setSuccessMessage(null);
    try {
      console.log(">>> Chiamata axios.get a /api/kpis...");
      const response = await axios.get('http://localhost:5001/api/kpis');
      console.log(">>> Risposta API GET KPI:", response.data);
      const receivedData = response.data.data || [];
      setKpis(receivedData);
      let result = receivedData;
        if (filters.area) { result = result.filter(kpi => kpi.area === filters.area); }
        if (filters.frequenza) { result = result.filter(kpi => kpi.frequenza === filters.frequenza); }
      setFilteredKpis(result);
    } catch (err) {
      console.error(">>> ERRORE in fetchKpis:", err);
      if (err.response) { setError(err.response.data.message || 'Errore API nel recuperare i KPI.'); }
      else if (err.request) { setError('Nessuna risposta dal server per i KPI.'); }
      else { setError('Errore nell\'impostare la richiesta KPI.'); }
      setKpis([]); setFilteredKpis([]);
    } finally { setLoading(false); console.log(">>> fetchKpis COMPLETATA"); }
  };

   useEffect(() => {
      console.log(">>> useEffect [] - Eseguo fetchKpis al mount");
      fetchKpis();
  }, []);

  useEffect(() => {
    console.log(">>> useEffect [kpis, filters] - Applica filtro");
    let result = kpis;
    if (filters.area) { result = result.filter(kpi => kpi.area === filters.area); }
    if (filters.frequenza) { result = result.filter(kpi => kpi.frequenza === filters.frequenza); }
    setFilteredKpis(result);
    console.log(">>> filteredKpis aggiornato dopo cambio filtri");
  }, [kpis, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log(`>>> Filtro cambiato: ${name} = ${value}`);
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const handleCloseDialog = () => {
    console.log(">>> handleCloseDialog chiamato");
    setOpenDialog(false);
    setSelectedKpiToDelete(null);
  };

  const handleDeleteKpi = async (id) => {
    if (!id) return;
    console.log(`>>> handleDeleteKpi chiamato per ID: ${id}`);
    setLoading(true); setError(null); setSuccessMessage(null);
    try {
      await axios.delete(`http://localhost:5001/api/kpis/${id}`);
      setSuccessMessage('KPI eliminato con successo.');
      fetchKpis();
    } catch (err) {
      console.error(">>> Errore eliminazione KPI:", err);
      if (err.response) { setError(err.response.data.message || 'Errore durante l\'eliminazione.');}
      else if (err.request) { setError('Nessuna risposta dal server per eliminazione.'); }
      else { setError('Errore nell\'impostare la richiesta di eliminazione.'); }
    } finally { handleCloseDialog(); setLoading(false); }
  };

  const fetchKpiValues = async (kpiId) => {
    if (!kpiId) return;
    console.log(`>>> fetchKpiValues chiamata per KPI ID: ${kpiId}`);
    setLoadingValues(true); setErrorValues(null);
    try {
      const response = await axios.get(`http://localhost:5001/api/values?kpi_id=${kpiId}`);
      console.log(">>> Risposta API Valori:", response.data);
      setSelectedKpiValues(response.data.data || []);
    } catch (err) {
      console.error(`>>> ERRORE in fetchKpiValues (KPI ${kpiId}):`, err);
      if (err.response) { setErrorValues(err.response.data.message || 'Errore API nel recuperare i valori.'); }
      else if (err.request) { setErrorValues('Nessuna risposta dal server per i valori.'); }
      else { setErrorValues('Errore nell\'impostare la richiesta valori.'); }
      setSelectedKpiValues([]);
    } finally { setLoadingValues(false); }
  };

  const handleViewDetail = (kpi) => { console.log(">>> handleViewDetail chiamato per:", kpi); setSelectedKpiDetail(kpi); setShowDetailView(true); setShowNewForm(false); setShowAddValueForm(false); fetchKpiValues(kpi._id); };
  const handleBackToList = () => { console.log(">>> handleBackToList chiamato"); setShowDetailView(false); setSelectedKpiDetail(null); setShowAddValueForm(false); };
  const handleNewKpi = () => { console.log(">>> handleNewKpi chiamato"); setSelectedKpiDetail(null); setShowDetailView(false); setShowAddValueForm(false); setShowNewForm(true); setError(null); setSuccessMessage(null); };
  const handleBackFromNew = () => { console.log(">>> handleBackFromNew chiamato"); setShowNewForm(false); };

  const handleAddValueClick = () => { console.log(">>> handleAddValueClick chiamato"); setError(null); setSuccessMessage(null); setShowAddValueForm(true); setShowDetailView(false); };
  const handleBackFromAddValue = () => { console.log(">>> handleBackFromAddValue chiamato"); setShowAddValueForm(false); if (selectedKpiDetail) { setShowDetailView(true); } };

  const handleSaveNewValue = async (formData) => {
    if (!selectedKpiDetail?._id) return;
    console.log(">>> handleSaveNewValue chiamato con:", formData);
    setSavingValue(true); setError(null); setSuccessMessage(null);
    try {
      const response = await axios.post('http://localhost:5001/api/values', { ...formData, kpi_id: selectedKpiDetail._id });
      console.log(">>> Risposta POST Valore:", response.data);
      setSuccessMessage(response.data.message || 'Valore KPI registrato!');
      if(response.data.alert) { window.alert(`ALERT GENERATO: ${response.data.alert.messaggio}`); }
      setShowAddValueForm(false);
      setShowDetailView(true);
      fetchKpiValues(selectedKpiDetail._id);
    } catch (err) {
      console.error(">>> Errore registrazione valore:", err);
      if (err.response) { setError(err.response.data.message || 'Errore API nel registrare il valore.');}
      else if (err.request) { setError('Nessuna risposta dal server per registrazione valore.'); }
      else { setError('Errore nell\'impostare la richiesta valore.'); }
    } finally { setSavingValue(false); }
  };

   const handleSaveNewKpi = async (formData) => {
     console.log(">>> handleSaveNewKpi chiamato con:", formData);
     setLoading(true); setError(null); setSuccessMessage(null);
     try {
       const response = await axios.post('http://localhost:5001/api/kpis', formData);
       console.log(">>> Risposta POST KPI:", response.data);
       setSuccessMessage(`KPI "${response.data.data.nome}" creato con successo!`);
       setShowNewForm(false);
       fetchKpis();
     } catch (err) {
       console.error(">>> Errore creazione KPI:", err);
       if (err.response) { setError(err.response.data.message || 'Errore durante la creazione.');}
       else if (err.request) { setError('Nessuna risposta dal server per creazione.'); }
       else { setError('Errore nell\'impostare la richiesta di creazione.'); }
     } finally { setLoading(false); }
   };

  console.log("--- STATO PRIMA DEL RETURN ---");
  console.log("loading:", loading, "savingValue:", savingValue, "loadingValues:", loadingValues);
  console.log("error:", error, "errorValues:", errorValues);
  console.log("showNewForm:", showNewForm, "showDetailView:", showDetailView, "showAddValueForm:", showAddValueForm);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
        <Box>
        {showNewForm ? (
            <NewKpiForm onSave={handleSaveNewKpi} onCancel={handleBackFromNew} isLoading={loading} apiError={error} apiSuccess={successMessage} />
        ) : showAddValueForm && selectedKpiDetail ? (
            <AddValueForm kpi={selectedKpiDetail} onSave={handleSaveNewValue} onCancel={handleBackFromAddValue} isLoading={savingValue} apiError={error} />
        ) : showDetailView && selectedKpiDetail ? (
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5">Dettaglio KPI: {selectedKpiDetail.nome}</Typography>
                    <Button variant="outlined" size="small" onClick={handleBackToList}>Torna alla Lista</Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

                <Typography variant="h6" gutterBottom>Informazioni KPI</Typography>
                <Grid container spacing={1} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                    <Grid item xs={12} sm={6} md={4}><Typography variant="body2"><strong>Codice:</strong> {selectedKpiDetail.codice}</Typography></Grid>
                    <Grid item xs={12} sm={6} md={4}><Typography variant="body2"><strong>Area:</strong> {selectedKpiDetail.area}</Typography></Grid>
                    <Grid item xs={12} sm={6} md={4}><Typography variant="body2"><strong>Unità:</strong> {selectedKpiDetail.unita ?? 'N/D'}</Typography></Grid>
                    <Grid item xs={12} sm={6} md={4}><Typography variant="body2"><strong>Frequenza:</strong> {selectedKpiDetail.frequenza}</Typography></Grid>
                    <Grid item xs={12} sm={6} md={4}><Typography variant="body2"><strong>Target:</strong> {selectedKpiDetail.valore_target ?? 'N/D'}</Typography></Grid>
                    <Grid item xs={12} sm={6} md={4}><Typography variant="body2"><strong>Attivo:</strong> {selectedKpiDetail.attivo ? 'Sì' : 'No'}</Typography></Grid>
                    <Grid item xs={12}><Typography variant="body2"><strong>Definizione:</strong> {selectedKpiDetail.definizione ?? 'N/D'}</Typography></Grid>
                    <Grid item xs={12}><Typography variant="body2"><strong>Formula:</strong> {selectedKpiDetail.formula ?? 'N/D'}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="body2"><strong>Soglia Attenzione:</strong> {selectedKpiDetail.soglia_attenzione ?? 'N/D'}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="body2"><strong>Soglia Allarme:</strong> {selectedKpiDetail.soglia_allarme ?? 'N/D'}</Typography></Grid>
                </Grid>

                <Button variant="outlined" startIcon={<EditIcon />} sx={{ mr: 2 }} > Modifica KPI </Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddValueClick} disabled={savingValue}> Aggiungi Nuovo Valore </Button>

                <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>Storico Valori</Typography>
                 {errorValues && <Alert severity="error" sx={{ my: 2 }}>{errorValues}</Alert>}
                {loadingValues ? (
                    <Box sx={{ textAlign: 'center', my: 2 }}><CircularProgress /></Box>
                ) : (
                    <TableContainer component={Paper} sx={{ mt: 1, maxHeight: 400 }}>
                        <Table size="small" stickyHeader>
                            <TableHead><TableRow><TableCell>Data/Periodo</TableCell><TableCell align="right">Valore</TableCell><TableCell>Note</TableCell><TableCell>Azioni</TableCell></TableRow></TableHead>
                            <TableBody>
                                {selectedKpiValues.length === 0 && <TableRow><TableCell colSpan={4} align="center">Nessun valore registrato.</TableCell></TableRow>}
                                {selectedKpiValues.map(v => (
                                    <TableRow key={v._id} hover>
                                        <TableCell>{v.data ? new Date(v.data).toLocaleDateString('it-IT') : 'N/D'}</TableCell>
                                        <TableCell align="right">{typeof v.valore === 'number' ? v.valore.toLocaleString('it-IT') : v.valore}</TableCell>
                                        <TableCell>{v.note}</TableCell>
                                        <TableCell padding="none">
                                            <IconButton size="small" title="Modifica Valore" disabled><EditIcon fontSize="inherit" /></IconButton>
                                            <IconButton size="small" title="Elimina Valore" disabled><DeleteIcon fontSize="inherit" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

            </Paper>
        ) : (
            <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5">Gestione KPI</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewKpi}> Nuovo KPI </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

                <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="body1" paragraph> Elenco degli Indicatori Chiave di Performance (KPI) monitorati. </Typography>
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={6}><FormControl fullWidth><InputLabel id="area-filter-label">Area</InputLabel><Select labelId="area-filter-label" name="area" label="Area" value={filters.area} onChange={handleFilterChange}><MenuItem value="">Tutte</MenuItem><MenuItem value="Commerciale">Commerciale</MenuItem><MenuItem value="Logistica">Logistica</MenuItem><MenuItem value="HR">HR</MenuItem><MenuItem value="Acquisti">Acquisti</MenuItem><MenuItem value="Produzione">Produzione</MenuItem><MenuItem value="Finanza">Finanza</MenuItem><MenuItem value="Altro">Altro</MenuItem></Select></FormControl></Grid>
                        <Grid item xs={12} md={6}><FormControl fullWidth><InputLabel id="freq-filter-label">Frequenza</InputLabel><Select labelId="freq-filter-label" name="frequenza" label="Frequenza" value={filters.frequenza} onChange={handleFilterChange}><MenuItem value="">Tutte</MenuItem><MenuItem value="giornaliera">Giornaliera</MenuItem><MenuItem value="settimanale">Settimanale</MenuItem><MenuItem value="mensile">Mensile</MenuItem><MenuItem value="trimestrale">Trimestrale</MenuItem><MenuItem value="semestrale">Semestrale</MenuItem><MenuItem value="annuale">Annuale</MenuItem></Select></FormControl></Grid>
                    </Grid>

                    {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
                    <TableContainer>
                        <Table>
                            <TableHead><TableRow><TableCell>Codice</TableCell><TableCell>Nome</TableCell><TableCell>Area</TableCell><TableCell>Unità</TableCell><TableCell>Target</TableCell><TableCell>Azioni</TableCell></TableRow></TableHead>
                             <TableBody>
                               {filteredKpis.length === 0 && !loading && (<TableRow><TableCell colSpan={6} align="center">Nessun KPI trovato. Creane uno nuovo.</TableCell></TableRow>)}
                               {filteredKpis.map((kpi) => (
                                 <TableRow key={kpi._id} hover>
                                   <TableCell>{kpi.codice ?? 'N/A'}</TableCell>
                                   <TableCell>{kpi.nome ?? 'N/A'}</TableCell>
                                   <TableCell>{kpi.area ?? 'N/A'}</TableCell>
                                   <TableCell>{kpi.unita ?? 'N/A'}</TableCell>
                                   <TableCell>{kpi.valore_target != null ? kpi.valore_target.toLocaleString('it-IT') : 'N/D'}</TableCell>
                                   <TableCell padding="none">
                                     <IconButton size="small" color="primary" title="Visualizza Dettaglio" onClick={() => handleViewDetail(kpi)}><VisibilityIcon fontSize="inherit"/></IconButton>
                                     <IconButton size="small" color="secondary" title="Modifica" disabled><EditIcon fontSize="inherit"/></IconButton>
                                     <IconButton size="small" color="error" title="Elimina" onClick={() => { setSelectedKpiToDelete(kpi); setOpenDialog(true); }}><DeleteIcon fontSize="inherit"/></IconButton>
                                   </TableCell>
                                 </TableRow>
                               ))}
                             </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                <Dialog open={openDialog} onClose={handleCloseDialog}>
                    <DialogTitle>Conferma Eliminazione</DialogTitle>
                    <DialogContent><Typography>Sei sicuro di voler eliminare il KPI "{selectedKpiToDelete?.nome}"?</Typography><Typography color="error" variant="body2" sx={{mt: 1}}>Questa azione non può essere annullata.</Typography></DialogContent>
                    <DialogActions><Button onClick={handleCloseDialog}>Annulla</Button><Button onClick={() => handleDeleteKpi(selectedKpiToDelete?._id)} color="error"> Elimina </Button></DialogActions>
                </Dialog>
            </>
        )}
        </Box>
    </LocalizationProvider>
  );
};

export default KpiPage;