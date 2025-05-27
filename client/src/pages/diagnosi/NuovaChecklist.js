// START OF FILE client/src/pages/diagnosi/NuovaChecklist.js (AGGIORNATO v3 - Mapping Completo)

import React, { useState } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Stepper, Step, StepLabel, Button,
    TextField, FormControl, InputLabel, Select, MenuItem, Grid,
    Alert, CircularProgress, Checkbox, FormControlLabel,
    Divider, Chip
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
// Importa DatePicker e Adapter
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { it } from 'date-fns/locale';

const NuovaChecklist = ({ onSaveSuccess, onCancel }) => {
    // --- STATI ---
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [checklistData, setChecklistData] = useState({
        nome: '',
        descrizione: '',
        cliente: {
            nome: '', formaGiuridica: '', codiceFiscale: '', partitaIva: '', pec: '',
            reaNumero: '', reaProvincia: '', codiceLEI: '', dataCostituzione: null,
            dataIscrizioneRI: null, capitaleSociale: '', sede_via: '', sede_cap: '',
            sede_comune: '', sede_provincia: '', statoAttivita: 'attiva', dataInizioAttivita: null,
            attivitaPrevalente: '', atecoPrimario: '', atecoSecondari: '', importExport: false,
            numeroAddetti: '', dataRiferimentoAddetti: null, numeroSoci: '', numeroAmministratori: '',
            sistemaAmministrazione: '', organoControlloPresente: false, tipoOrganoControllo: '',
            numeroUnitaLocali: 0, certificazioni: '', partecipazioni: false,
            dimensioneStimata: '', settore: '', complessita: ''
        },
    });
    const [selectedVisuraFile, setSelectedVisuraFile] = useState(null);
    const [visuraFileName, setVisuraFileName] = useState('Nessun file selezionato');
    const [processingVisura, setProcessingVisura] = useState(false);
    const [visuraError, setVisuraError] = useState(null);

    const steps = ['Informazioni Azienda', 'Revisione e Creazione'];

    // --- HANDLERS ---
    const handleNext = () => { setActiveStep((prev) => prev + 1); };
    const handleBack = () => { setActiveStep((prev) => prev - 1); };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const keys = name.split('.');
        setError(null); setVisuraError(null);
        if (keys.length === 2) {
            const [parent, child] = keys;
            // Per i checkbox, assicurati che il valore sia booleano
            const newValue = type === 'checkbox' ? checked : value;
            setChecklistData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: newValue } }));
        } else {
            const newValue = type === 'checkbox' ? checked : value;
            setChecklistData(prev => ({ ...prev, [name]: newValue }));
        }
    };

    const parseDateSafe = (dateValue) => {
        if (!dateValue) return null;
        try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                date.setHours(12, 0, 0, 0);
                return date;
            }
        } catch (e) { console.error("Errore in parseDateSafe:", e); }
        console.warn("parseDateSafe ha ricevuto un valore non parsabile o invalido:", dateValue);
        return null;
    };

    const handleDateChange = (name, newValue) => {
         const keys = name.split('.');
         if (keys.length === 2) {
             const [parent, child] = keys;
             const validDate = newValue instanceof Date && !isNaN(newValue) ? newValue : null;
             setChecklistData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: validDate } }));
         }
    };

    const handleVisuraFileChange = (event) => {
        setVisuraError(null);
        if (event.target.files && event.target.files[0]) {
            if (event.target.files[0].type === 'application/pdf') {
                 setSelectedVisuraFile(event.target.files[0]);
                 setVisuraFileName(event.target.files[0].name);
            } else {
                 setSelectedVisuraFile(null); setVisuraFileName('File non PDF!'); setVisuraError('Seleziona un file PDF.');
            }
        } else {
            setSelectedVisuraFile(null); setVisuraFileName('Nessun file selezionato');
        }
    };

    const handleProcessVisura = async () => {
         if (!selectedVisuraFile) return;
         setProcessingVisura(true); setVisuraError(null); setError(null);
         const formData = new FormData();
         formData.append('visuraPdf', selectedVisuraFile);
         try {
             const response = await axios.post('http://localhost:5001/api/extract/visura', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
             const extracted = response.data.data;
             console.log(">>> Dati estratti ricevuti (frontend):", extracted);

             // --- AGGIORNAMENTO STATO CON MAPPING COMPLETO ---
             setChecklistData(prev => {
                 const newClienteData = { ...prev.cliente };

                 // Mappatura campi (usa ?? per mantenere valore esistente se AI restituisce null/undefined dove non ha senso)
                 // Usa || '' per stringhe dove preferisci stringa vuota a null/undefined
                 newClienteData.nome = extracted.nome || newClienteData.nome;
                 newClienteData.codiceFiscale = extracted.codiceFiscale || newClienteData.codiceFiscale;
                 newClienteData.partitaIva = extracted.partitaIva || newClienteData.partitaIva;
                 newClienteData.pec = extracted.pec || newClienteData.pec; // Potrebbe essere null
                 newClienteData.reaNumero = extracted.reaNumero || newClienteData.reaNumero;
                 newClienteData.reaProvincia = extracted.reaProvincia || newClienteData.reaProvincia;
                 newClienteData.formaGiuridica = extracted.formaGiuridica || newClienteData.formaGiuridica; // Aggiunto
                 newClienteData.sede_via = extracted.sede_via || newClienteData.sede_via;
                 newClienteData.sede_cap = extracted.sede_cap || newClienteData.sede_cap; // Aggiunto
                 newClienteData.sede_comune = extracted.sede_comune || newClienteData.sede_comune; // Aggiunto
                 newClienteData.sede_provincia = extracted.sede_provincia || newClienteData.sede_provincia; // Aggiunto
                 newClienteData.capitaleSociale = extracted.capitaleSociale ?? newClienteData.capitaleSociale; // Usa ?? per numeri
                 newClienteData.statoAttivita = extracted.statoAttivita || newClienteData.statoAttivita; // Aggiunto
                 newClienteData.atecoPrimario = extracted.atecoPrimario || newClienteData.atecoPrimario;
                 newClienteData.attivitaPrevalente = extracted.attivitaPrevalente || newClienteData.attivitaPrevalente; // Aggiunto
                 newClienteData.numeroAddetti = extracted.numeroAddetti ?? newClienteData.numeroAddetti; // Usa ?? per numeri
                 newClienteData.numeroAmministratori = extracted.numeroAmministratori ?? newClienteData.numeroAmministratori; // Aggiunto e Usa ??
                 newClienteData.sistemaAmministrazione = extracted.sistemaAmministrazione || newClienteData.sistemaAmministrazione; // Aggiunto
                 newClienteData.organoControlloPresente = extracted.organoControlloPresente ?? newClienteData.organoControlloPresente; // Aggiunto e Usa ?? per boolean
                 newClienteData.tipoOrganoControllo = extracted.tipoOrganoControllo || newClienteData.tipoOrganoControllo; // Aggiunto
                 newClienteData.numeroUnitaLocali = extracted.numeroUnitaLocali ?? newClienteData.numeroUnitaLocali; // Aggiunto e Usa ??
                 newClienteData.partecipazioni = extracted.partecipazioni ?? newClienteData.partecipazioni; // Aggiunto e Usa ?? per boolean

                 // Mappatura Date (usa parseDateSafe e aggiorna solo se valida)
                 const parsedCostituzione = parseDateSafe(extracted.dataCostituzione);
                 if (parsedCostituzione !== null) newClienteData.dataCostituzione = parsedCostituzione;

                 const parsedIscrizioneRI = parseDateSafe(extracted.dataIscrizioneRI);
                 if (parsedIscrizioneRI !== null) newClienteData.dataIscrizioneRI = parsedIscrizioneRI;

                 const parsedRiferimentoAddetti = parseDateSafe(extracted.dataRiferimentoAddetti);
                 if (parsedRiferimentoAddetti !== null) newClienteData.dataRiferimentoAddetti = parsedRiferimentoAddetti;

                 const parsedInizioAttivita = parseDateSafe(extracted.dataInizioAttivita); // Aggiunto
                 if (parsedInizioAttivita !== null) newClienteData.dataInizioAttivita = parsedInizioAttivita;

                 return { ...prev, cliente: newClienteData };
             });
             // --- FINE AGGIORNAMENTO STATO ---

             alert('Dati estratti con successo e campi pre-compilati!');
         } catch (err) {
             console.error("Errore estrazione dati da visura:", err);
             setVisuraError(err.response?.data?.message || 'Errore durante l\'estrazione dei dati dal PDF.');
         } finally { setProcessingVisura(false); }
     };

    const handleSubmit = async () => {
        setLoading(true); setError(null); setVisuraError(null);
        try {
            const clienteData = {
                ...checklistData.cliente,
                // Converte numeri e date in formato corretto per il backend
                capitaleSociale: checklistData.cliente.capitaleSociale !== '' ? Number(checklistData.cliente.capitaleSociale) : null,
                numeroAddetti: checklistData.cliente.numeroAddetti !== '' ? Number(checklistData.cliente.numeroAddetti) : null,
                numeroSoci: checklistData.cliente.numeroSoci !== '' ? Number(checklistData.cliente.numeroSoci) : null,
                numeroAmministratori: checklistData.cliente.numeroAmministratori !== '' ? Number(checklistData.cliente.numeroAmministratori) : null,
                numeroUnitaLocali: checklistData.cliente.numeroUnitaLocali !== '' ? Number(checklistData.cliente.numeroUnitaLocali) : 0,
                certificazioni: typeof checklistData.cliente.certificazioni === 'string' ? checklistData.cliente.certificazioni.split(',').map(s=>s.trim()).filter(s=>s) : (checklistData.cliente.certificazioni || []),
                dataCostituzione: checklistData.cliente.dataCostituzione instanceof Date && !isNaN(checklistData.cliente.dataCostituzione) ? checklistData.cliente.dataCostituzione.toISOString().split('T')[0] : null,
                dataIscrizioneRI: checklistData.cliente.dataIscrizioneRI instanceof Date && !isNaN(checklistData.cliente.dataIscrizioneRI) ? checklistData.cliente.dataIscrizioneRI.toISOString().split('T')[0] : null,
                dataInizioAttivita: checklistData.cliente.dataInizioAttivita instanceof Date && !isNaN(checklistData.cliente.dataInizioAttivita) ? checklistData.cliente.dataInizioAttivita.toISOString().split('T')[0] : null,
                dataRiferimentoAddetti: checklistData.cliente.dataRiferimentoAddetti instanceof Date && !isNaN(checklistData.cliente.dataRiferimentoAddetti) ? checklistData.cliente.dataRiferimentoAddetti.toISOString().split('T')[0] : null,
            };
            const dataToSave = { nome: checklistData.nome, descrizione: checklistData.descrizione, cliente: clienteData };
            console.log(">>> Dati inviati per creazione checklist:", dataToSave);
            const response = await axios.post('http://localhost:5001/api/checklist', dataToSave);
            console.log("Checklist creata:", response.data);
            if(onSaveSuccess) { onSaveSuccess(response.data.data); }
        } catch (err) {
            console.error('Errore creazione checklist:', err);
            let errorMessage = err.response?.data?.message || 'Errore durante la creazione della checklist.';
            if (err.response?.data?.errors) {
                 const validationErrors = Object.values(err.response.data.errors).map(e => e.message).join('; ');
                 errorMessage = `Errore di validazione: ${validationErrors}`;
            }
            setError(errorMessage);
            setActiveStep(0);
        } finally { setLoading(false); }
    };

    // --- GET STEP CONTENT ---
    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Informazioni Azienda</Typography>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Grid container spacing={2}>

                            {/* Upload Visura */}
                            <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Carica Visura (Opzionale)" size="small"/></Divider></Grid>
                            <Grid item xs={12} sm={8} sx={{ display: 'flex', alignItems: 'center' }}>
                              <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} sx={{mr: 1}} disabled={processingVisura}>
                                  Seleziona PDF... <input type="file" hidden accept="application/pdf" onChange={handleVisuraFileChange} />
                              </Button>
                              <Typography variant="body2" noWrap>{visuraFileName}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                               <Button fullWidth variant="contained" onClick={handleProcessVisura} disabled={!selectedVisuraFile || processingVisura} startIcon={processingVisura ? <CircularProgress size={16} color="inherit"/> : null}>
                                    Estrai Dati da PDF
                               </Button>
                            </Grid>
                            {visuraError && <Grid item xs={12}><Alert severity="warning" sx={{mt: 1}}>{visuraError}</Alert></Grid>}

                            {/* Anagrafica */}
                            <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Anagrafica" size="small"/></Divider></Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField required name="cliente.nome" label="Denominazione" fullWidth size="small" value={checklistData.cliente.nome} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.cliente.nome }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.codiceFiscale" label="Codice Fiscale" fullWidth size="small" value={checklistData.cliente.codiceFiscale} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.cliente.codiceFiscale }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.partitaIva" label="Partita IVA" fullWidth size="small" value={checklistData.cliente.partitaIva} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.cliente.partitaIva }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.pec" label="PEC" fullWidth size="small" value={checklistData.cliente.pec} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.cliente.pec }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                               <FormControl fullWidth size="small">
                                  <InputLabel id="forma-giuridica-label">Forma Giuridica</InputLabel>
                                  <Select labelId="forma-giuridica-label" name="cliente.formaGiuridica" value={checklistData.cliente.formaGiuridica} label="Forma Giuridica" onChange={handleInputChange} disabled={loading}>
                                      <MenuItem value=""><em>Non specificata</em></MenuItem>
                                      <MenuItem value="societa' a responsabilita' limitata">SRL</MenuItem> {/* Match esatto visura */}
                                      {/* Aggiungere altre opzioni mappate se necessario */}
                                      <MenuItem value="SRLS">SRLS</MenuItem>
                                      <MenuItem value="SPA">SPA</MenuItem>
                                      {/* ... */}
                                      <MenuItem value="Altro">Altro</MenuItem>
                                  </Select>
                                </FormControl>
                             </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.reaNumero" label="Numero REA" fullWidth size="small" value={checklistData.cliente.reaNumero} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.cliente.reaNumero }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.reaProvincia" label="Provincia REA" fullWidth size="small" value={checklistData.cliente.reaProvincia} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.cliente.reaProvincia }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.codiceLEI" label="Codice LEI (Opz.)" fullWidth size="small" value={checklistData.cliente.codiceLEI} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.cliente.codiceLEI }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.capitaleSociale" label="Capitale Sociale €" type="number" fullWidth size="small" value={checklistData.cliente.capitaleSociale} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: checklistData.cliente.capitaleSociale != null && checklistData.cliente.capitaleSociale !== '' }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <DatePicker label="Data Costituzione" value={checklistData.cliente.dataCostituzione} onChange={(newValue) => handleDateChange('cliente.dataCostituzione', newValue)} slots={{ textField: (params) => <TextField {...params} fullWidth size="small" disabled={loading}/> }} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <DatePicker label="Data Iscrizione RI" value={checklistData.cliente.dataIscrizioneRI} onChange={(newValue) => handleDateChange('cliente.dataIscrizioneRI', newValue)} slots={{ textField: (params) => <TextField {...params} fullWidth size="small" disabled={loading}/> }} />
                            </Grid>

                            {/* Sede Legale */}
                            <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Sede Legale" size="small"/></Divider></Grid>
                            <Grid item xs={12} md={8}> <TextField name="cliente.sede_via" label="Indirizzo (Via/Piazza/Km...)" fullWidth size="small" value={checklistData.cliente.sede_via} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.cliente.sede_via }}/> </Grid>
                            <Grid item xs={12} md={4}> <TextField name="cliente.sede_cap" label="CAP" fullWidth size="small" value={checklistData.cliente.sede_cap} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.cliente.sede_cap }}/> </Grid>
                            <Grid item xs={12} md={8}> <TextField name="cliente.sede_comune" label="Comune" fullWidth size="small" value={checklistData.cliente.sede_comune} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.cliente.sede_comune }}/> </Grid>
                            <Grid item xs={12} md={4}> <TextField name="cliente.sede_provincia" label="Provincia (Sigla)" fullWidth size="small" inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }} value={checklistData.cliente.sede_provincia} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.cliente.sede_provincia }}/> </Grid>

                           {/* Attività e Struttura */}
                           <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Attività e Struttura" size="small"/></Divider></Grid>
                           <Grid item xs={12} sm={6} md={4}>
                             <FormControl fullWidth size="small">
                                 <InputLabel id="stato-attivita-label">Stato Attività</InputLabel>
                                 <Select labelId="stato-attivita-label" name="cliente.statoAttivita" value={checklistData.cliente.statoAttivita} label="Stato Attività" onChange={handleInputChange} disabled={loading}>
                                     <MenuItem value="attiva">Attiva</MenuItem><MenuItem value="inattiva">Inattiva</MenuItem><MenuItem value="sospesa">Sospesa</MenuItem><MenuItem value="liquidazione">In Liquidazione</MenuItem><MenuItem value="cessata">Cessata</MenuItem>
                                 </Select>
                             </FormControl>
                           </Grid>
                           <Grid item xs={12} sm={6} md={4}>
                                 <DatePicker label="Data Inizio Attività" value={checklistData.cliente.dataInizioAttivita} onChange={(newValue) => handleDateChange('cliente.dataInizioAttivita', newValue)} slots={{ textField: (params) => <TextField {...params} fullWidth size="small" disabled={loading}/> }} />
                           </Grid>
                           <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.atecoPrimario" label="Codice ATECO Primario" fullWidth size="small" value={checklistData.cliente.atecoPrimario} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.cliente.atecoPrimario }}/> </Grid>
                           <Grid item xs={12}> <TextField name="cliente.attivitaPrevalente" label="Attività Prevalente (Descrizione)" fullWidth size="small" value={checklistData.cliente.attivitaPrevalente} onChange={handleInputChange} disabled={loading} multiline rows={2} InputLabelProps={{ shrink: !!checklistData.cliente.attivitaPrevalente }}/> </Grid>
                           <Grid item xs={12} sm={6} md={3}> <TextField name="cliente.numeroAddetti" label="Numero Addetti" type="number" fullWidth size="small" value={checklistData.cliente.numeroAddetti} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: checklistData.cliente.numeroAddetti != null && checklistData.cliente.numeroAddetti !== '' }}/> </Grid>
                           <Grid item xs={12} sm={6} md={3}>
                                <DatePicker label="Data Riferim. Addetti" value={checklistData.cliente.dataRiferimentoAddetti} onChange={(newValue) => handleDateChange('cliente.dataRiferimentoAddetti', newValue)} slots={{ textField: (params) => <TextField {...params} fullWidth size="small" disabled={loading}/> }} />
                           </Grid>
                           <Grid item xs={12} sm={6} md={3}> <TextField name="cliente.numeroAmministratori" label="Numero Amministratori" type="number" fullWidth size="small" value={checklistData.cliente.numeroAmministratori} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: checklistData.cliente.numeroAmministratori != null && checklistData.cliente.numeroAmministratori !== '' }}/> </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="sis-amm-label">Sistema Amministrazione</InputLabel>
                                    <Select labelId="sis-amm-label" name="cliente.sistemaAmministrazione" value={checklistData.cliente.sistemaAmministrazione} label="Sistema Amministrazione" onChange={handleInputChange} disabled={loading}>
                                         <MenuItem value=""><em>Non specificato</em></MenuItem>
                                         <MenuItem value="consiglio di amministrazione">Consiglio di Amministrazione</MenuItem> {/* Match esatto visura */}
                                         <MenuItem value="Amm. Unico">Amministratore Unico</MenuItem>
                                         <MenuItem value="Altro">Altro</MenuItem>
                                    </Select>
                                </FormControl>
                           </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                {/* Assicurati che 'checked' usi il valore booleano corretto */}
                                <FormControlLabel control={<Checkbox name="cliente.organoControlloPresente" checked={!!checklistData.cliente.organoControlloPresente} onChange={handleInputChange} disabled={loading}/>} label="Organo Controllo Presente?" />
                           </Grid>
                           <Grid item xs={12} sm={6} md={4}>
                                <FormControl fullWidth size="small" disabled={loading || !checklistData.cliente.organoControlloPresente}>
                                    <InputLabel id="tipo-org-controllo-label">Tipo Organo Controllo</InputLabel>
                                    <Select labelId="tipo-org-controllo-label" name="cliente.tipoOrganoControllo" value={checklistData.cliente.tipoOrganoControllo} label="Tipo Organo Controllo" onChange={handleInputChange}>
                                         <MenuItem value=""><em>Non specificato</em></MenuItem>
                                         <MenuItem value="Sindaco Unico">Sindaco Unico</MenuItem> {/* Match esatto visura */}
                                         <MenuItem value="Collegio Sindacale">Collegio Sindacale</MenuItem>
                                         <MenuItem value="Revisore Legale">Revisore Legale</MenuItem>
                                         <MenuItem value="Società Revisione">Società Revisione</MenuItem>
                                    </Select>
                                </FormControl>
                           </Grid>
                           <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.numeroUnitaLocali" label="Numero Unità Locali" type="number" fullWidth size="small" value={checklistData.cliente.numeroUnitaLocali} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: checklistData.cliente.numeroUnitaLocali != null && checklistData.cliente.numeroUnitaLocali !== '' }}/> </Grid>

                            {/* Varie */}
                           <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Varie" size="small"/></Divider></Grid>
                           <Grid item xs={12} sm={6}> <TextField name="cliente.certificazioni" label="Certificazioni (separate da virgola)" fullWidth size="small" value={checklistData.cliente.certificazioni} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.cliente.certificazioni }}/> </Grid>
                           <Grid item xs={6} sm={3}><FormControlLabel control={<Checkbox name="cliente.importExport" checked={!!checklistData.cliente.importExport} onChange={handleInputChange} disabled={loading}/>} label="Import/Export?" /></Grid>
                           <Grid item xs={6} sm={3}><FormControlLabel control={<Checkbox name="cliente.partecipazioni" checked={!!checklistData.cliente.partecipazioni} onChange={handleInputChange} disabled={loading}/>} label="Partecipazioni?" /></Grid>

                            {/* Checklist Info & Valutazione Preliminare */}
                           <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Info Checklist & Valutazione" size="small"/></Divider></Grid>
                           <Grid item xs={12} sm={6}> <TextField required name="nome" label="Nome Sessione Checklist" fullWidth size="small" value={checklistData.nome} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.nome }}/> </Grid>
                           <Grid item xs={12} sm={6}> <TextField name="descrizione" label="Descrizione Checklist (Opz.)" fullWidth size="small" value={checklistData.descrizione} onChange={handleInputChange} disabled={loading} InputLabelProps={{ shrink: !!checklistData.descrizione }}/> </Grid>
                           <Grid item xs={12} sm={6}>
                              <FormControl fullWidth size="small" required> {/* ... Select Dimensione ... */}
                                <InputLabel id="dimensione-stimata-label">Dimensione Stimata (Consulente)</InputLabel>
                                 <Select required labelId="dimensione-stimata-label" name="cliente.dimensioneStimata" value={checklistData.cliente.dimensioneStimata} label="Dimensione Stimata (Consulente)" onChange={handleInputChange} disabled={loading}>
                                       <MenuItem value=""><em>Seleziona</em></MenuItem><MenuItem value="Micro">Micro</MenuItem><MenuItem value="Piccola">Piccola</MenuItem><MenuItem value="Media">Media</MenuItem><MenuItem value="Grande">Grande</MenuItem>
                                  </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth size="small" required> {/* ... Select Complessità ... */}
                                <InputLabel id="complessita-label">Complessità (Consulente)</InputLabel>
                                 <Select required labelId="complessita-label" name="cliente.complessita" value={checklistData.cliente.complessita} label="Complessità (Consulente)" onChange={handleInputChange} disabled={loading}>
                                      <MenuItem value=""><em>Seleziona</em></MenuItem><MenuItem value="Bassa">Bassa</MenuItem><MenuItem value="Media">Media</MenuItem><MenuItem value="Alta">Alta</MenuItem>
                                  </Select>
                              </FormControl>
                            </Grid>

 {/* --- NUOVI CAMPI CONTESTO STRATEGICO --- */}
 <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Contesto Strategico (Opzionale)" size="small" /></Divider></Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        name="cliente.obiettiviStrategici" // Corrisponde allo schema DB
                                        label="Obiettivi Strategici Principali (1-3 anni)"
                                        fullWidth
                                        size="small"
                                        multiline
                                        rows={3}
                                        value={checklistData.cliente.obiettiviStrategici || ''} // Usa || '' per evitare warning controlled/uncontrolled
                                        onChange={handleInputChange}
                                        disabled={loading}
                                        helperText="Es: Aumentare export 20%, Lanciare linea prodotto Y, Migliorare efficienza Z"
                                        InputLabelProps={{ shrink: !!checklistData.cliente.obiettiviStrategici }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        name="cliente.criticitaPercepite" // Corrisponde allo schema DB
                                        label="Principali Criticità / Inefficienze Percepite dal Cliente"
                                        fullWidth
                                        size="small"
                                        multiline
                                        rows={3}
                                        value={checklistData.cliente.criticitaPercepite || ''} // Usa || ''
                                        onChange={handleInputChange}
                                        disabled={loading}
                                        helperText="Es: Ritardi consegne, Scarsa comunicazione interna, Difficoltà a trovare personale qualificato"
                                        InputLabelProps={{ shrink: !!checklistData.cliente.criticitaPercepite }}
                                    />
                                </Grid>
                                {/* --- FINE NUOVI CAMPI --- */}

                        </Grid>
                      </Box>
                  </LocalizationProvider>
                );
            case 1: // Revisione
                return (
                    <Box sx={{ p: 2 }}> {/* ... Step Revisione ... */}
                        <Typography variant="h6" gutterBottom>Revisione e Creazione</Typography>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Alert severity="info" sx={{ mb: 3 }}>Rivedi le informazioni prima di creare la checklist. Le domande verranno aggiunte automaticamente in base a Dimensione e Complessità.</Alert>
                        <Typography variant="subtitle1"><strong>Nome Checklist:</strong> {checklistData.nome}</Typography>
                        <Typography variant="subtitle1" sx={{mt: 1}}><strong>Cliente:</strong> {checklistData.cliente.nome}</Typography>
                        <Typography variant="body2">Dimensione Stimata: {checklistData.cliente.dimensioneStimata || 'N/D'}</Typography>
                        <Typography variant="body2">Complessità: {checklistData.cliente.complessita || 'N/D'}</Typography>
                                                {/* NUOVI CAMPI IN REVISIONE */}
                                                <Typography variant="body2" sx={{mt:1}}><strong>Obiettivi Strategici:</strong> {checklistData.cliente.obiettiviStrategici || 'Non inseriti'}</Typography>
                        <Typography variant="body2"><strong>Criticità Percepite:</strong> {checklistData.cliente.criticitaPercepite || 'Non inserite'}</Typography>
                    </Box>
                );
            default: return 'Passaggio sconosciuto';
        }
    };

    // --- RENDER ---
    return (
        <Paper sx={{ width: '100%', p: { xs: 1, sm: 2 } }}>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                {steps.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
            </Stepper>

            {getStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, p: 2, borderTop: '1px solid #eee' }}>
                 <Button variant="outlined" onClick={onCancel} disabled={loading}> Annulla Creazione </Button>
                 <Box>
                     {activeStep !== 0 && (<Button onClick={handleBack} sx={{ mr: 1 }} disabled={loading}> Indietro </Button>)}
                     {activeStep < steps.length - 1 ? (
                         <Button variant="contained" color="primary" onClick={handleNext} disabled={ loading || (activeStep === 0 && (!checklistData.nome || !checklistData.cliente.nome || !checklistData.cliente.dimensioneStimata || !checklistData.cliente.complessita)) }>
                              Avanti
                         </Button>
                     ) : (
                         <Button variant="contained" color="primary" onClick={handleSubmit} disabled={!checklistData.nome || !checklistData.cliente.nome || !checklistData.cliente.dimensioneStimata || !checklistData.cliente.complessita || loading}>
                             {loading ? <CircularProgress size={24} /> : 'Crea Checklist'}
                         </Button>
                     )}
                 </Box>
            </Box>
        </Paper>
    );
};

export default NuovaChecklist;

// END OF FILE client/src/pages/diagnosi/NuovaChecklist.js (AGGIORNATO v3 - Mapping Completo)