import React, { useState } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Stepper, Step, StepLabel, Button,
    TextField, FormControl, InputLabel, Select, MenuItem, Grid,
    Alert, CircularProgress, Checkbox, FormControlLabel,
    Divider, Chip
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { it } from 'date-fns/locale';

const NuovaChecklist = ({ onSaveSuccess, onCancel }) => {

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
            dimensioneStimata: '', settore: '', complessita: '',
            obiettiviStrategici: '', criticitaPercepite: '',
            settoreATECOSpecifico: '',
            modelloBusiness: '',
            complessitaOperativa: '',
            strutturaProprietaria: '',
            livelloInternazionalizzazione: '',
            faseCicloVita: ''
        },
    });
    const [selectedVisuraFile, setSelectedVisuraFile] = useState(null);
    const [visuraFileName, setVisuraFileName] = useState('Nessun file selezionato');
    const [processingVisura, setProcessingVisura] = useState(false);
    const [visuraError, setVisuraError] = useState(null);

    const steps = ['Informazioni Azienda', 'Revisione e Creazione'];

    const handleNext = () => { setActiveStep((prev) => prev + 1); };
    const handleBack = () => { setActiveStep((prev) => prev - 1); };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const keys = name.split('.');
        setError(null); setVisuraError(null);
        if (keys.length === 2) {
            const [parent, child] = keys;

            const newValue = type === 'checkbox' ? checked : value;
            setChecklistData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: newValue } }));
        } else {
            const newValue = type === 'checkbox' ? checked : value;
            setChecklistData(prev => ({ ...prev, [name]: newValue }));
        }
    };

    const parseDateSafe = (dateValue) => {
        if (!dateValue) return null;
        let date;
        if (typeof dateValue === 'number') {
            date = new Date(dateValue);
        } else if (typeof dateValue === 'string') {
            const parts = dateValue.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (parts && parts.length === 4) {
                date = new Date(parts[3], parts[2] - 1, parts[1]);
            } else {
                date = new Date(dateValue);
            }
        } else {
            date = new Date(dateValue);
        }

        if (date instanceof Date && !isNaN(date.getTime())) {
            date.setHours(12, 0, 0, 0);
            return date;
        }
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
            const file = event.target.files[0];
            if (file.type === 'application/pdf') {
                setSelectedVisuraFile(file);
                setVisuraFileName(file.name);
            } else {
                setSelectedVisuraFile(null);
                setVisuraFileName('File non PDF!');
                setVisuraError('Formato file non valido. Selezionare un file PDF.');
            }
        } else {
            setSelectedVisuraFile(null);
            setVisuraFileName('Nessun file selezionato');
        }
    };

    const handleProcessVisura = async () => {
        if (!selectedVisuraFile) {
            setVisuraError('Nessun file PDF selezionato per l\'elaborazione.');
            return;
        }
        setProcessingVisura(true);
        setVisuraError(null);
        setError(null);

        const formData = new FormData();
        formData.append('file', selectedVisuraFile);
        formData.append('contesto', 'Estrazione dati da Visura Camerale PDF');
        formData.append('tipoOutputAtteso', 'JSON con dati anagrafici e societari');
        formData.append('istruzioniSpecifiche', 'Estrai i seguenti campi: denominazione, codice fiscale, partita IVA, PEC, numero REA, provincia REA, forma giuridica, sede (via, cap, comune, provincia), capitale sociale, stato attività, data costituzione, data iscrizione RI, data inizio attività, ATECO primario, attività prevalente, numero addetti, data riferimento addetti, numero amministratori, sistema amministrazione, presenza organo controllo, tipo organo controllo, numero unità locali, partecipazioni.');

        try {
            const response = await axios.post('http://localhost:5001/api/extract', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            let extractedData;
            if (typeof response.data.extractedAIOutput === 'string') {
                try {
                    extractedData = JSON.parse(response.data.extractedAIOutput);
                } catch (parseErr) {
                    console.error("Errore parsing JSON dalla risposta AI:", parseErr, "Risposta grezza:", response.data.extractedAIOutput);
                    setVisuraError("Formato dati estratto dall'AI non valido.");
                    setProcessingVisura(false);
                    return;
                }
            } else {
                extractedData = response.data.extractedAIOutput;
            }

            if (!extractedData) {
                throw new Error("Nessun dato estratto o formato risposta AI non corretto.");
            }
            console.log(">>> Dati estratti da Visura (frontend):", extractedData);

            setChecklistData(prev => {
                const newClienteData = { ...prev.cliente };

                newClienteData.nome = extractedData.denominazione || extractedData.nome || prev.cliente.nome;
                console.log(`MAPPING Nome: AI='${extractedData.denominazione || extractedData.nome}', Mapped='${newClienteData.nome}'`);

                newClienteData.codiceFiscale = extractedData.codice_fiscale_ri || extractedData.codiceFiscale || prev.cliente.codiceFiscale;
                console.log(`MAPPING Codice Fiscale: AI='${extractedData.codice_fiscale_ri || extractedData.codiceFiscale}', Mapped='${newClienteData.codiceFiscale}'`);

                newClienteData.partitaIva = extractedData.partita_iva || extractedData.partitaIva || prev.cliente.partitaIva;
                console.log(`MAPPING Partita IVA: AI='${extractedData.partita_iva || extractedData.partitaIva}', Mapped='${newClienteData.partitaIva}'`);

                newClienteData.pec = extractedData.pec || prev.cliente.pec;
                console.log(`MAPPING PEC: AI='${extractedData.pec}', Mapped='${newClienteData.pec}'`);

                newClienteData.reaNumero = extractedData.numero_rea_valore || extractedData.numero_rea || prev.cliente.reaNumero;
                newClienteData.reaProvincia = extractedData.provincia_rea || extractedData.reaProvincia || prev.cliente.reaProvincia;
                console.log(`MAPPING REA Numero: AI='${extractedData.numero_rea_valore || extractedData.numero_rea}', Mapped='${newClienteData.reaNumero}'`);
                console.log(`MAPPING REA Provincia: AI='${extractedData.provincia_rea || extractedData.reaProvincia}', Mapped='${newClienteData.reaProvincia}'`);

                newClienteData.codiceLEI = extractedData.codice_lei || prev.cliente.codiceLEI;
                console.log(`MAPPING Codice LEI: AI='${extractedData.codice_lei}', Mapped='${newClienteData.codiceLEI}'`);

                newClienteData.formaGiuridica = extractedData.forma_giuridica || extractedData.formaGiuridica || prev.cliente.formaGiuridica;
                console.log(`MAPPING Forma Giuridica: AI='${extractedData.forma_giuridica || extractedData.formaGiuridica}', Mapped='${newClienteData.formaGiuridica}'`);

                let viaCompleta = extractedData.indirizzo_sede_legale || prev.cliente.sede_via;
                if (extractedData.comune_sede_legale && extractedData.provincia_sede_legale && extractedData.cap_sede_legale) {
                    let tempVia = extractedData.indirizzo_sede_legale || "";
                    tempVia = tempVia.replace(new RegExp(`\\(?${extractedData.provincia_sede_legale}\\)?`, 'gi'), '');
                    tempVia = tempVia.replace(new RegExp(extractedData.comune_sede_legale, 'gi'), '');
                    tempVia = tempVia.replace(new RegExp(extractedData.cap_sede_legale, 'gi'), '');
                    viaCompleta = tempVia.replace(/[\s,.-]+$/,'').replace(/^[\s,.-]+/,'').trim();
                    if (!viaCompleta && extractedData.indirizzo_sede_legale) {
                        viaCompleta = extractedData.indirizzo_sede_legale;
                    }
                }
                newClienteData.sede_via = viaCompleta;
                newClienteData.sede_cap = extractedData.cap_sede_legale || extractedData.sede_cap || prev.cliente.sede_cap;
                newClienteData.sede_comune = extractedData.comune_sede_legale || extractedData.sede_comune || prev.cliente.sede_comune;
                newClienteData.sede_provincia = extractedData.provincia_sede_legale || extractedData.sede_provincia || prev.cliente.sede_provincia;

                console.log(`MAPPING Sede Via: AI_full='${extractedData.indirizzo_sede_legale}', Mapped='${newClienteData.sede_via}'`);
                console.log(`MAPPING Sede CAP: AI='${extractedData.cap_sede_legale || extractedData.sede_cap}', Mapped='${newClienteData.sede_cap}'`);
                console.log(`MAPPING Sede Comune: AI='${extractedData.comune_sede_legale || extractedData.sede_comune}', Mapped='${newClienteData.sede_comune}'`);
                console.log(`MAPPING Sede Provincia: AI='${extractedData.provincia_sede_legale || extractedData.sede_provincia}', Mapped='${newClienteData.sede_provincia}'`);

                newClienteData.capitaleSociale = extractedData.capitale_sociale_versato ?? extractedData.capitale_sociale ?? prev.cliente.capitaleSociale;
                console.log(`MAPPING Capitale Sociale: AI='${extractedData.capitale_sociale_versato ?? extractedData.capitale_sociale}', Mapped='${newClienteData.capitaleSociale}'`);

                newClienteData.statoAttivita = extractedData.stato_attivita || extractedData.statoAttivita || prev.cliente.statoAttivita;
                console.log(`MAPPING Stato Attività: AI='${extractedData.stato_attivita || extractedData.statoAttivita}', Mapped='${newClienteData.statoAttivita}'`);

                newClienteData.atecoPrimario = extractedData.codice_ateco || extractedData.atecoPrimario || prev.cliente.atecoPrimario;
                console.log(`MAPPING ATECO: AI='${extractedData.codice_ateco || extractedData.atecoPrimario}', Mapped='${newClienteData.atecoPrimario}'`);

                newClienteData.attivitaPrevalente = extractedData.attivita_esercitata_descr || extractedData.attivitaPrevalente || prev.cliente.attivitaPrevalente;
                console.log(`MAPPING Attività Prevalente: AI='${extractedData.attivita_esercitata_descr || extractedData.attivitaPrevalente}', Mapped='${newClienteData.attivitaPrevalente}'`);

                newClienteData.numeroAddetti = extractedData.numero_addetti ?? prev.cliente.numeroAddetti;
                console.log(`MAPPING Numero Addetti: AI='${extractedData.numero_addetti}', Mapped='${newClienteData.numeroAddetti}'`);

                newClienteData.numeroAmministratori = extractedData.numero_amministratori ?? prev.cliente.numeroAmministratori;
                console.log(`MAPPING Numero Amministratori: AI='${extractedData.numero_amministratori}', Mapped='${newClienteData.numeroAmministratori}'`);

                let sistemaAmm = extractedData.sistema_amministrazione_statuto || prev.cliente.sistemaAmministrazione;
                if (sistemaAmm && sistemaAmm.toLowerCase().includes("consiglio di amministrazione")) {
                    newClienteData.sistemaAmministrazione = "consiglio_di_amministrazione";
                } else if (sistemaAmm && sistemaAmm.toLowerCase().includes("amministratore unico")) {
                    newClienteData.sistemaAmministrazione = "amministratore_unico";
                } else if (sistemaAmm) {
                    newClienteData.sistemaAmministrazione = sistemaAmm;
                } else {
                    newClienteData.sistemaAmministrazione = prev.cliente.sistemaAmministrazione;
                }
                console.log(`MAPPING Sistema Amministrazione: AI='${extractedData.sistema_amministrazione_statuto}', Mapped='${newClienteData.sistemaAmministrazione}'`);

                if (extractedData.numero_organi_controllo !== undefined) {
                    if (Number(extractedData.numero_organi_controllo) > 0) {
                        newClienteData.organoControlloPresente = true;
                        let tipoDescr = extractedData.tipo_organo_controllo_descr;
                        if (tipoDescr && tipoDescr.toLowerCase().includes("sindaco")) {
                            tipoDescr = "Sindaco Unico";
                        }
                        newClienteData.tipoOrganoControllo = tipoDescr || prev.cliente.tipoOrganoControllo;
                    } else {
                        newClienteData.organoControlloPresente = false;
                        newClienteData.tipoOrganoControllo = '';
                    }
                }
                console.log(`MAPPING Org Controllo Presente: AI_num='${extractedData.numero_organi_controllo}', Mapped='${newClienteData.organoControlloPresente}'`);
                console.log(`MAPPING Tipo Org Controllo: AI_descr='${extractedData.tipo_organo_controllo_descr}', Mapped='${newClienteData.tipoOrganoControllo}'`);

                newClienteData.numeroUnitaLocali = extractedData.numero_unita_locali ?? prev.cliente.numeroUnitaLocali;
                console.log(`MAPPING Numero Unità Locali: AI='${extractedData.numero_unita_locali}', Mapped='${newClienteData.numeroUnitaLocali}'`);

                const partecipazioniValAI = extractedData.partecipazioni_descr;
                if (typeof partecipazioniValAI === 'string') {
                    newClienteData.partecipazioni = partecipazioniValAI.toLowerCase() === 'sì' || partecipazioniValAI.toLowerCase() === 'si';
                } else if (typeof partecipazioniValAI === 'boolean') {
                    newClienteData.partecipazioni = partecipazioniValAI;
                } else {
                    newClienteData.partecipazioni = prev.cliente.partecipazioni || false;
                }
                console.log(`MAPPING Partecipazioni: AI='${extractedData.partecipazioni_descr}', Mapped='${newClienteData.partecipazioni}'`);

                newClienteData.certificazioni = extractedData.certificazioni_qualita_elenco || extractedData.certificazioni || prev.cliente.certificazioni;
                console.log(`MAPPING Certificazioni: AI='${extractedData.certificazioni_qualita_elenco || extractedData.certificazioni}', Mapped='${newClienteData.certificazioni}'`);

                newClienteData.dataCostituzione = parseDateSafe(extractedData.data_costituzione) || parseDateSafe(extractedData.dataCostituzione) || prev.cliente.dataCostituzione;
                newClienteData.dataIscrizioneRI = parseDateSafe(extractedData.data_iscrizione_ri) || parseDateSafe(extractedData.dataIscrizioneRI) || prev.cliente.dataIscrizioneRI;
                newClienteData.dataRiferimentoAddetti = parseDateSafe(extractedData.data_riferimento_addetti) || parseDateSafe(extractedData.dataRiferimentoAddetti) || prev.cliente.dataRiferimentoAddetti;
                newClienteData.dataInizioAttivita = parseDateSafe(extractedData.data_inizio_attivita) || parseDateSafe(extractedData.dataInizioAttivita) || prev.cliente.dataInizioAttivita;

                console.log(`MAPPING Data Costituzione: AI='${extractedData.data_costituzione || extractedData.dataCostituzione}', Mapped='${newClienteData.dataCostituzione}'`);
                console.log(`MAPPING Data Iscrizione RI: AI='${extractedData.data_iscrizione_ri || extractedData.dataIscrizioneRI}', Mapped='${newClienteData.dataIscrizioneRI}'`);
                console.log(`MAPPING Data Rif Addetti: AI='${extractedData.data_riferimento_addetti || extractedData.dataRiferimentoAddetti}', Mapped='${newClienteData.dataRiferimentoAddetti}'`);
                console.log(`MAPPING Data Inizio Attività: AI='${extractedData.data_inizio_attivita || extractedData.dataInizioAttivita}', Mapped='${newClienteData.dataInizioAttivita}'`);

                newClienteData.dimensioneStimata = prev.cliente.dimensioneStimata;
                newClienteData.settore = prev.cliente.settore;
                newClienteData.complessita = prev.cliente.complessita;
                newClienteData.obiettiviStrategici = prev.cliente.obiettiviStrategici;
                newClienteData.criticitaPercepite = prev.cliente.criticitaPercepite;
                newClienteData.settoreATECOSpecifico = prev.cliente.settoreATECOSpecifico;
                newClienteData.modelloBusiness = prev.cliente.modelloBusiness;
                newClienteData.complessitaOperativa = prev.cliente.complessitaOperativa;
                newClienteData.strutturaProprietaria = prev.cliente.strutturaProprietaria;
                newClienteData.livelloInternazionalizzazione = prev.cliente.livelloInternazionalizzazione;
                newClienteData.faseCicloVita = prev.cliente.faseCicloVita;

                console.log("Dati cliente finali PRONTI per setChecklistData:", JSON.stringify(newClienteData, null, 2));
                return { ...prev, cliente: newClienteData };
            });

            alert('Dati estratti dalla visura e campi pre-compilati!');
        } catch (err) {
            console.error("Errore estrazione dati da visura:", err);
            setVisuraError(err.response?.data?.message || 'Errore durante l\'estrazione dei dati dal PDF.');
        } finally {
            setProcessingVisura(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true); setError(null);
        try {
            const clienteData = {
                ...checklistData.cliente,

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

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Informazioni Azienda e Checklist</Typography>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}> <TextField required name="nome" label="Nome Sessione Checklist" fullWidth size="small" value={checklistData.nome} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.nome }}/> </Grid>
                            <Grid item xs={12} sm={6}> <TextField name="descrizione" label="Descrizione Checklist (Opz.)" fullWidth size="small" value={checklistData.descrizione} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.descrizione }}/> </Grid>

                            <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Carica Visura Camerale (Opzionale)" size="small"/></Divider></Grid>
                            <Grid item xs={12} sm={8} sx={{ display: 'flex', alignItems: 'center' }}>
                              <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} sx={{mr: 1}} disabled={processingVisura || loading}>
                                  Seleziona PDF Visura...
                                  <input type="file" hidden accept="application/pdf" onChange={handleVisuraFileChange} />
                              </Button>
                              <Typography variant="body2" noWrap sx={{ fontStyle: selectedVisuraFile ? 'normal' : 'italic', color: selectedVisuraFile ? 'text.primary' : 'text.secondary' }}>
                                {visuraFileName}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                               <Button
                                    fullWidth
                                    variant="contained"
                                    color="secondary"
                                    onClick={handleProcessVisura}
                                    disabled={!selectedVisuraFile || processingVisura || loading}
                                    startIcon={processingVisura ? <CircularProgress size={16} color="inherit"/> : null}
                                >
                                    {processingVisura ? 'Elaboro...' : 'Estrai da Visura'}
                               </Button>
                            </Grid>
                            {visuraError && <Grid item xs={12}><Alert severity="warning" sx={{mt: 1}} onClose={() => setVisuraError(null)}>{visuraError}</Alert></Grid>}

                            <Grid item xs={12}><Divider sx={{ my: 2 }}><Chip label="Anagrafica Cliente (Base)" size="small"/></Divider></Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField required name="cliente.nome" label="Denominazione Cliente" fullWidth size="small" value={checklistData.cliente.nome} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.nome }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.codiceFiscale" label="Codice Fiscale" fullWidth size="small" value={checklistData.cliente.codiceFiscale} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.codiceFiscale }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.partitaIva" label="Partita IVA" fullWidth size="small" value={checklistData.cliente.partitaIva} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.partitaIva }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.pec" label="PEC" fullWidth size="small" value={checklistData.cliente.pec} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.pec }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                               <FormControl fullWidth size="small" disabled={loading || processingVisura}>
                                  <InputLabel id="forma-giuridica-label">Forma Giuridica</InputLabel>
                                  <Select labelId="forma-giuridica-label" name="cliente.formaGiuridica" value={checklistData.cliente.formaGiuridica} label="Forma Giuridica" onChange={handleInputChange}>
                                      <MenuItem value=""><em>Non specificata</em></MenuItem>
                                      <MenuItem value="societa' a responsabilita' limitata">SRL</MenuItem>
                                      <MenuItem value="SRLS">SRLS</MenuItem>
                                      <MenuItem value="SPA">SPA</MenuItem>
                                      <MenuItem value="Altro">Altro</MenuItem>
                                  </Select>
                                </FormControl>
                             </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.reaNumero" label="Numero REA" fullWidth size="small" value={checklistData.cliente.reaNumero} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.reaNumero }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.reaProvincia" label="Provincia REA" fullWidth size="small" value={checklistData.cliente.reaProvincia} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.reaProvincia }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.codiceLEI" label="Codice LEI (Opz.)" fullWidth size="small" value={checklistData.cliente.codiceLEI} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.codiceLEI }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.capitaleSociale" label="Capitale Sociale €" type="number" fullWidth size="small" value={checklistData.cliente.capitaleSociale} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: checklistData.cliente.capitaleSociale != null && checklistData.cliente.capitaleSociale !== '' }}/> </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <DatePicker label="Data Costituzione" value={checklistData.cliente.dataCostituzione} onChange={(newValue) => handleDateChange('cliente.dataCostituzione', newValue)} slots={{ textField: (params) => <TextField {...params} fullWidth size="small" disabled={loading || processingVisura}/> }} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <DatePicker label="Data Iscrizione RI" value={checklistData.cliente.dataIscrizioneRI} onChange={(newValue) => handleDateChange('cliente.dataIscrizioneRI', newValue)} slots={{ textField: (params) => <TextField {...params} fullWidth size="small" disabled={loading || processingVisura}/> }} />
                            </Grid>

                            <Grid item xs={12}><Divider sx={{ my: 2 }}><Chip label="Sede Legale" size="small"/></Divider></Grid>
                            <Grid item xs={12} md={8}> <TextField name="cliente.sede_via" label="Indirizzo (Via/Piazza/Km...)" fullWidth size="small" value={checklistData.cliente.sede_via} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.sede_via }}/> </Grid>
                            <Grid item xs={12} md={4}> <TextField name="cliente.sede_cap" label="CAP" fullWidth size="small" value={checklistData.cliente.sede_cap} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.sede_cap }}/> </Grid>
                            <Grid item xs={12} md={8}> <TextField name="cliente.sede_comune" label="Comune" fullWidth size="small" value={checklistData.cliente.sede_comune} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.sede_comune }}/> </Grid>
                            <Grid item xs={12} md={4}> <TextField name="cliente.sede_provincia" label="Provincia (Sigla)" fullWidth size="small" inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }} value={checklistData.cliente.sede_provincia} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.sede_provincia }}/> </Grid>

                            <Grid item xs={12}><Divider sx={{ my: 2 }}><Chip label="Attività e Struttura" size="small"/></Divider></Grid>
                            <Grid item xs={12} sm={6} md={4}>
                              <FormControl fullWidth size="small" disabled={loading || processingVisura}>
                                  <InputLabel id="stato-attivita-label">Stato Attività</InputLabel>
                                  <Select labelId="stato-attivita-label" name="cliente.statoAttivita" value={checklistData.cliente.statoAttivita} label="Stato Attività" onChange={handleInputChange}>
                                      <MenuItem value="attiva">Attiva</MenuItem><MenuItem value="inattiva">Inattiva</MenuItem><MenuItem value="sospesa">Sospesa</MenuItem><MenuItem value="liquidazione">In Liquidazione</MenuItem><MenuItem value="cessata">Cessata</MenuItem>
                                  </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                  <DatePicker label="Data Inizio Attività" value={checklistData.cliente.dataInizioAttivita} onChange={(newValue) => handleDateChange('cliente.dataInizioAttivita', newValue)} slots={{ textField: (params) => <TextField {...params} fullWidth size="small" disabled={loading || processingVisura}/> }} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.atecoPrimario" label="Codice ATECO Primario" fullWidth size="small" value={checklistData.cliente.atecoPrimario} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.atecoPrimario }}/> </Grid>
                            <Grid item xs={12}> <TextField name="cliente.attivitaPrevalente" label="Attività Prevalente (Descrizione)" fullWidth size="small" value={checklistData.cliente.attivitaPrevalente} onChange={handleInputChange} disabled={loading || processingVisura} multiline rows={2} InputLabelProps={{ shrink: !!checklistData.cliente.attivitaPrevalente }}/> </Grid>
                            <Grid item xs={12} sm={6} md={3}> <TextField name="cliente.numeroAddetti" label="Numero Addetti" type="number" fullWidth size="small" value={checklistData.cliente.numeroAddetti} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: checklistData.cliente.numeroAddetti != null && checklistData.cliente.numeroAddetti !== '' }}/> </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                 <DatePicker label="Data Riferim. Addetti" value={checklistData.cliente.dataRiferimentoAddetti} onChange={(newValue) => handleDateChange('cliente.dataRiferimentoAddetti', newValue)} slots={{ textField: (params) => <TextField {...params} fullWidth size="small" disabled={loading || processingVisura}/> }} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}> <TextField name="cliente.numeroAmministratori" label="Numero Amministratori" type="number" fullWidth size="small" value={checklistData.cliente.numeroAmministratori} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: checklistData.cliente.numeroAmministratori != null && checklistData.cliente.numeroAmministratori !== '' }}/> </Grid>
                             <Grid item xs={12} sm={6} md={3}>
                                 <FormControl fullWidth size="small" disabled={loading || processingVisura}>
                                     <InputLabel id="sis-amm-label">Sistema Amministrazione</InputLabel>
                                     <Select labelId="sis-amm-label" name="cliente.sistemaAmministrazione" value={checklistData.cliente.sistemaAmministrazione} label="Sistema Amministrazione" onChange={handleInputChange}>
                                          <MenuItem value=""><em>Non specificato</em></MenuItem>
                                          <MenuItem value="consiglio_di_amministrazione">Consiglio di Amministrazione</MenuItem>
                                          <MenuItem value="consiglio_di_amministrazione">Consiglio di Amministrazione (in carica)</MenuItem>
                                          <MenuItem value="amministratore_unico">Amministratore Unico</MenuItem>
                                          <MenuItem value="Altro">Altro</MenuItem>
                                     </Select>
                                 </FormControl>
                            </Grid>
                             <Grid item xs={12} sm={6} md={4}>
                                 <FormControlLabel control={<Checkbox name="cliente.organoControlloPresente" checked={!!checklistData.cliente.organoControlloPresente} onChange={handleInputChange} disabled={loading || processingVisura}/>} label="Organo Controllo Presente?" />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                 <FormControl fullWidth size="small" disabled={loading || processingVisura || !checklistData.cliente.organoControlloPresente}>
                                     <InputLabel id="tipo-org-controllo-label">Tipo Organo Controllo</InputLabel>
                                     <Select labelId="tipo-org-controllo-label" name="cliente.tipoOrganoControllo" value={checklistData.cliente.tipoOrganoControllo} label="Tipo Organo Controllo" onChange={handleInputChange}>
                                          <MenuItem value=""><em>Non specificato</em></MenuItem>
                                          <MenuItem value="Sindaco Unico">Sindaco Unico</MenuItem>
                                          <MenuItem value="Collegio Sindacale">Collegio Sindacale</MenuItem>
                                          <MenuItem value="Revisore Legale">Revisore Legale</MenuItem>
                                          <MenuItem value="Società Revisione">Società Revisione</MenuItem>
                                     </Select>
                                 </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}> <TextField name="cliente.numeroUnitaLocali" label="Numero Unità Locali" type="number" fullWidth size="small" value={checklistData.cliente.numeroUnitaLocali} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: checklistData.cliente.numeroUnitaLocali != null && checklistData.cliente.numeroUnitaLocali !== '' }}/> </Grid>

                            <Grid item xs={12}><Divider sx={{ my: 2 }}><Chip label="Varie" size="small"/></Divider></Grid>
                            <Grid item xs={12} sm={6}> <TextField name="cliente.certificazioni" label="Certificazioni (separate da virgola)" fullWidth size="small" value={checklistData.cliente.certificazioni} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.certificazioni }}/> </Grid>
                            <Grid item xs={6} sm={3}><FormControlLabel control={<Checkbox name="cliente.importExport" checked={!!checklistData.cliente.importExport} onChange={handleInputChange} disabled={loading || processingVisura}/>} label="Import/Export?" /></Grid>
                            <Grid item xs={6} sm={3}><FormControlLabel control={<Checkbox name="cliente.partecipazioni" checked={!!checklistData.cliente.partecipazioni} onChange={handleInputChange} disabled={loading || processingVisura}/>} label="Partecipazioni?" /></Grid>

                            <Grid item xs={12}><Divider sx={{ my: 2 }}><Chip label="Info Checklist & Valutazione" size="small"/></Divider></Grid>
                            <Grid item xs={12} sm={6}> <TextField required name="nome" label="Nome Sessione Checklist" fullWidth size="small" value={checklistData.nome} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.nome }}/> </Grid>
                            <Grid item xs={12} sm={6}> <TextField name="descrizione" label="Descrizione Checklist (Opz.)" fullWidth size="small" value={checklistData.descrizione} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.descrizione }}/> </Grid>
                            <Grid item xs={12} sm={6}>
                               <FormControl fullWidth size="small" required disabled={loading || processingVisura}>
                                 <InputLabel id="dimensione-stimata-label">Dimensione Stimata (Consulente)</InputLabel>
                                  <Select required labelId="dimensione-stimata-label" name="cliente.dimensioneStimata" value={checklistData.cliente.dimensioneStimata} label="Dimensione Stimata (Consulente)" onChange={handleInputChange}>
                                        <MenuItem value=""><em>Seleziona</em></MenuItem><MenuItem value="Micro">Micro</MenuItem><MenuItem value="Piccola">Piccola</MenuItem><MenuItem value="Media">Media</MenuItem><MenuItem value="Grande">Grande</MenuItem>
                                   </Select>
                               </FormControl>
                             </Grid>
                             <Grid item xs={12} sm={6}>
                               <FormControl fullWidth size="small" required disabled={loading || processingVisura}>
                                 <InputLabel id="complessita-label">Complessità (Consulente)</InputLabel>
                                  <Select required labelId="complessita-label" name="cliente.complessita" value={checklistData.cliente.complessita} label="Complessità (Consulente)" onChange={handleInputChange}>
                                        <MenuItem value=""><em>Seleziona</em></MenuItem><MenuItem value="Bassa">Bassa</MenuItem><MenuItem value="Media">Media</MenuItem><MenuItem value="Alta">Alta</MenuItem>
                                   </Select>
                               </FormControl>
                             </Grid>
                             <Grid item xs={12} md={12}> <TextField name="cliente.settore" label="Settore Attività (Generico)" fullWidth size="small" value={checklistData.cliente.settore} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.settore }}/> </Grid>

                            <Grid item xs={12}><Divider sx={{ my: 2 }}><Chip label="Profilazione Avanzata Cliente (Opzionale ma Consigliata per AI)" size="small"/></Divider></Grid>
                            <Grid item xs={12} md={6}> <TextField name="cliente.settoreATECOSpecifico" label="Settore ATECO Specifico (es. 22.2)" fullWidth size="small" value={checklistData.cliente.settoreATECOSpecifico} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.settoreATECOSpecifico }}/> </Grid>
                            <Grid item xs={12} md={6}>
                              <FormControl fullWidth size="small" disabled={loading || processingVisura}>
                                <InputLabel id="modello-business-label">Modello Business</InputLabel>
                                <Select labelId="modello-business-label" name="cliente.modelloBusiness" value={checklistData.cliente.modelloBusiness} label="Modello Business" onChange={handleInputChange}>
                                  <MenuItem value=""><em>Non specificato</em></MenuItem>
                                  <MenuItem value="B2B">B2B (Business-to-Business)</MenuItem>
                                  <MenuItem value="B2C">B2C (Business-to-Consumer)</MenuItem>
                                  <MenuItem value="Manifatturiero">Manifatturiero</MenuItem>
                                  <MenuItem value="Servizi">Servizi</MenuItem>
                                  <MenuItem value="Commerciale">Commerciale/Retail</MenuItem>
                                  <MenuItem value="Misto">Misto</MenuItem>
                                  <MenuItem value="Altro">Altro</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <FormControl fullWidth size="small" disabled={loading || processingVisura}>
                                <InputLabel id="complessita-op-label">Complessità Operativa</InputLabel>
                                <Select labelId="complessita-op-label" name="cliente.complessitaOperativa" value={checklistData.cliente.complessitaOperativa} label="Complessità Operativa" onChange={handleInputChange}>
                                  <MenuItem value=""><em>Non specificato</em></MenuItem>
                                  <MenuItem value="Bassa">Bassa</MenuItem>
                                  <MenuItem value="Media">Media</MenuItem>
                                  <MenuItem value="Alta">Alta</MenuItem>
                                  <MenuItem value="Molto Alta">Molto Alta</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <FormControl fullWidth size="small" disabled={loading || processingVisura}>
                                <InputLabel id="struttura-prop-label">Struttura Proprietaria</InputLabel>
                                <Select labelId="struttura-prop-label" name="cliente.strutturaProprietaria" value={checklistData.cliente.strutturaProprietaria} label="Struttura Proprietaria" onChange={handleInputChange}>
                                  <MenuItem value=""><em>Non specificato</em></MenuItem>
                                  <MenuItem value="Familiare">Familiare</MenuItem>
                                  <MenuItem value="Manageriale">Manageriale</MenuItem>
                                  <MenuItem value="Mista">Mista Famiglia/Manager</MenuItem>
                                  <MenuItem value="Fondo Investimento">Fondo di Investimento</MenuItem>
                                  <MenuItem value="Pubblica">Partecipazione Pubblica</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <FormControl fullWidth size="small" disabled={loading || processingVisura}>
                                <InputLabel id="internaz-label">Livello Internazionalizzazione</InputLabel>
                                <Select labelId="internaz-label" name="cliente.livelloInternazionalizzazione" value={checklistData.cliente.livelloInternazionalizzazione} label="Livello Internazionalizzazione" onChange={handleInputChange}>
                                  <MenuItem value=""><em>Non specificato</em></MenuItem>
                                  <MenuItem value="Nessuna">Nessuna</MenuItem>
                                  <MenuItem value="Solo Export">Solo Export</MenuItem>
                                  <MenuItem value="Solo Import">Solo Import</MenuItem>
                                  <MenuItem value="Export/Import">Export/Import</MenuItem>
                                  <MenuItem value="Sedi Estere">Sedi Produttive/Commerciali Estere</MenuItem>
                                  <MenuItem value="Globale">Operatività Globale</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <FormControl fullWidth size="small" disabled={loading || processingVisura}>
                                <InputLabel id="ciclo-vita-label">Fase Ciclo di Vita Azienda</InputLabel>
                                <Select labelId="ciclo-vita-label" name="cliente.faseCicloVita" value={checklistData.cliente.faseCicloVita} label="Fase Ciclo di Vita Azienda" onChange={handleInputChange}>
                                  <MenuItem value=""><em>Non specificato</em></MenuItem>
                                  <MenuItem value="Startup">Startup/Avvio</MenuItem>
                                  <MenuItem value="Crescita">Crescita Rapida</MenuItem>
                                  <MenuItem value="Maturita">Maturità</MenuItem>
                                  <MenuItem value="Declino">Declino</MenuItem>
                                  <MenuItem value="Ristrutturazione">In Ristrutturazione</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid item xs={12}><Divider sx={{ my: 2 }}><Chip label="Contesto Strategico (Opzionale)" size="small" /></Divider></Grid>
                            <Grid item xs={12}>
                              <TextField name="cliente.obiettiviStrategici" label="Obiettivi Strategici Principali (1-3 anni)" fullWidth size="small" multiline rows={3} value={checklistData.cliente.obiettiviStrategici || ''} onChange={handleInputChange} disabled={loading || processingVisura} helperText="Es: Aumentare export 20%, Lanciare linea prodotto Y, Migliorare efficienza Z" InputLabelProps={{ shrink: !!checklistData.cliente.obiettiviStrategici }} />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField name="cliente.criticitaPercepite" label="Principali Criticità / Inefficienze Percepite dal Cliente" fullWidth size="small" multiline rows={3} value={checklistData.cliente.criticitaPercepite || ''} onChange={handleInputChange} disabled={loading || processingVisura} helperText="Es: Ritardi consegne, Scarsa comunicazione interna, Difficoltà a trovare personale qualificato" InputLabelProps={{ shrink: !!checklistData.cliente.criticitaPercepite }}/>
                            </Grid>
                        </Grid>
                      </Box>
                  </LocalizationProvider>
                );
            case 1: // Revisione
                return (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Revisione e Creazione</Typography>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Alert severity="info" sx={{ mb: 3 }}>Rivedi le informazioni prima di creare la checklist. Le domande verranno aggiunte automaticamente in base a Dimensione e Complessità (e altri parametri del profilo se D1 avanzato è attivo).</Alert>
                        <Typography variant="subtitle1"><strong>Nome Checklist:</strong> {checklistData.nome}</Typography>
                        <Typography variant="subtitle1" sx={{mt: 1}}><strong>Cliente:</strong> {checklistData.cliente.nome}</Typography>
                        <Typography variant="body2">Denominazione: {checklistData.cliente.nome || 'N/D'}</Typography>
                        <Typography variant="body2">Codice Fiscale: {checklistData.cliente.codiceFiscale || 'N/D'}</Typography>
                        <Typography variant="body2">Partita IVA: {checklistData.cliente.partitaIva || 'N/D'}</Typography>
                        <Typography variant="body2">Forma Giuridica: {checklistData.cliente.formaGiuridica || 'N/D'}</Typography>
                        <Typography variant="body2">Dimensione Stimata (Cons.): {checklistData.cliente.dimensioneStimata || 'N/D'}</Typography>
                        <Typography variant="body2">Complessità (Cons.): {checklistData.cliente.complessita || 'N/D'}</Typography>
                        <Typography variant="body2">Settore (Generico): {checklistData.cliente.settore || 'N/D'}</Typography>
                        <Divider sx={{ my: 1}} />
                        <Typography variant="caption">Profilo Avanzato:</Typography>
                        <Typography variant="body2">Settore ATECO Specifico: {checklistData.cliente.settoreATECOSpecifico || 'N/D'}</Typography>
                        <Typography variant="body2">Modello Business: {checklistData.cliente.modelloBusiness || 'N/D'}</Typography>
                        <Typography variant="body2">Complessità Operativa (Specifica): {checklistData.cliente.complessitaOperativa || 'N/D'}</Typography>
                        <Typography variant="body2">Struttura Proprietaria: {checklistData.cliente.strutturaProprietaria || 'N/D'}</Typography>
                        <Typography variant="body2">Livello Internazionalizzazione: {checklistData.cliente.livelloInternazionalizzazione || 'N/D'}</Typography>
                        <Typography variant="body2">Fase Ciclo di Vita Azienda: {checklistData.cliente.faseCicloVita || 'N/D'}</Typography>
                        <Divider sx={{ my: 1}} />
                        <Typography variant="body2">Obiettivi Strategici: {checklistData.cliente.obiettiviStrategici || 'Non inseriti'}</Typography>
                        <Typography variant="body2">Principali Criticità Percepite: {checklistData.cliente.criticitaPercepite || 'Non inserite'}</Typography>
                    </Box>
                );
            default: return 'Passaggio sconosciuto';
        }
    };

    return (
        <Paper sx={{ width: '100%', p: { xs: 1, sm: 2 } }}>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                {steps.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
            </Stepper>

            {getStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, p: 2, borderTop: '1px solid #eee' }}>
                 <Button variant="outlined" onClick={onCancel} disabled={loading || processingVisura}> Annulla Creazione </Button>
                 <Box>
                     {activeStep !== 0 && (<Button onClick={handleBack} sx={{ mr: 1 }} disabled={loading || processingVisura}> Indietro </Button>)}
                     {activeStep < steps.length - 1 ? (
                         <Button variant="contained" color="primary" onClick={handleNext} disabled={ loading || processingVisura || (activeStep === 0 && (!checklistData.nome || !checklistData.cliente.nome || !checklistData.cliente.dimensioneStimata || !checklistData.cliente.complessita)) } >
                              Avanti
                         </Button>
                     ) : (
                         <Button variant="contained" color="primary" onClick={handleSubmit} disabled={!checklistData.nome || !checklistData.cliente.nome || !checklistData.cliente.dimensioneStimata || !checklistData.cliente.complessita || loading || processingVisura}>
                             {loading ? <CircularProgress size={24} /> : 'Crea Checklist'}
                         </Button>
                     )}
                 </Box>
            </Box>
        </Paper>
    );
};

export default NuovaChecklist;
