import React, { useState } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Stepper, Step, StepLabel, Button,
    TextField, FormControl, InputLabel, Select, MenuItem, Grid,
    Alert, CircularProgress, Checkbox, FormControlLabel,
    Divider, Chip, Avatar, Zoom, Fade, Grow, Card, CardContent,
    LinearProgress, useTheme, alpha, StepConnector, stepConnectorClasses,
    Collapse, IconButton, Tooltip
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoIcon from '@mui/icons-material/Info';

import { styled, keyframes } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { it } from 'date-fns/locale';

// Stepper connector personalizzato
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 22,
    },
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        },
    },
    [`& .${stepConnectorClasses.line}`]: {
        height: 3,
        border: 0,
        backgroundColor: theme.palette.grey[300],
        borderRadius: 1,
    },
}));

// Step icon personalizzato
const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
    backgroundColor: theme.palette.grey[300],
    zIndex: 1,
    color: '#fff',
    width: 50,
    height: 50,
    display: 'flex',
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    ...(ownerState.active && {
        backgroundImage: `linear-gradient(136deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
    }),
    ...(ownerState.completed && {
        backgroundImage: `linear-gradient(136deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    }),
}));

function ColorlibStepIcon(props) {
    const { active, completed, className } = props;
    const icons = {
        1: <BusinessIcon />,
        2: <CheckCircleIcon />,
    };
    return (
        <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
            {icons[String(props.icon)]}
        </ColorlibStepIconRoot>
    );
}

// Componenti stilizzati
const GlassCard = styled(Card)(({ theme }) => ({
    backdropFilter: 'blur(20px)',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: theme.spacing(3),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
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

const shine = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const AnimatedButton = styled(Button)(({ theme }) => ({
    borderRadius: theme.spacing(3),
    textTransform: 'none',
    fontWeight: 600,
    padding: theme.spacing(1.5, 3),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(120deg, transparent 30%, ${alpha(theme.palette.common.white, 0.4)} 50%, transparent 70%)`,
        backgroundSize: '200% 100%',
        animation: `${shine} 3s ease-in-out infinite`
    }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: theme.spacing(2),
        transition: 'all 0.3s ease',
        '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
        },
        '&.Mui-focused': {
            backgroundColor: alpha(theme.palette.primary.main, 0.03),
        }
    }
}));

const UploadArea = styled(Box)(({ theme, isDragActive }) => ({
    border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
    borderRadius: theme.spacing(2),
    padding: theme.spacing(4),
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
    '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.02)
    }
}));

const InfoCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: theme.spacing(2),
    backgroundColor: alpha(theme.palette.info.main, 0.05),
    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: -50,
        right: -50,
        width: 100,
        height: 100,
        borderRadius: '50%',
        backgroundColor: alpha(theme.palette.info.main, 0.1)
    }
}));

const NuovaChecklist = ({ onSaveSuccess, onCancel }) => {
    const theme = useTheme();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    
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
    const [isDragActive, setIsDragActive] = useState(false);

    const steps = ['Informazioni Azienda', 'Revisione e Creazione'];

    const handleNext = () => {
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const keys = name.split('.');
        setError(null);
        setVisuraError(null);
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

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileSelection(files[0]);
        }
    };

    const handleFileSelection = (file) => {
        if (file.type === 'application/pdf') {
            setSelectedVisuraFile(file);
            setVisuraFileName(file.name);
            setVisuraError(null);
        } else {
            setSelectedVisuraFile(null);
            setVisuraFileName('File non PDF!');
            setVisuraError('Formato file non valido. Selezionare un file PDF.');
        }
    };

    const handleVisuraFileChange = (event) => {
        setVisuraError(null);
        if (event.target.files && event.target.files[0]) {
            handleFileSelection(event.target.files[0]);
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
            const response = await axios.post('http://localhost:5001/api/extract', formData, { 
                headers: { 'Content-Type': 'multipart/form-data' } 
            });

            let extractedData;
            if (typeof response.data.extractedAIOutput === 'string') {
                try {
                    extractedData = JSON.parse(response.data.extractedAIOutput);
                } catch (parseErr) {
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

            // Aggiorna i dati del form con i dati estratti
            setChecklistData(prev => {
                const newClienteData = { ...prev.cliente };

                // Mapping dei campi estratti
                newClienteData.nome = extractedData.denominazione || extractedData.nome || prev.cliente.nome;
                newClienteData.codiceFiscale = extractedData.codice_fiscale_ri || extractedData.codiceFiscale || prev.cliente.codiceFiscale;
                newClienteData.partitaIva = extractedData.partita_iva || extractedData.partitaIva || prev.cliente.partitaIva;
                newClienteData.pec = extractedData.pec || prev.cliente.pec;
                newClienteData.reaNumero = extractedData.numero_rea_valore || extractedData.numero_rea || prev.cliente.reaNumero;
                newClienteData.reaProvincia = extractedData.provincia_rea || extractedData.reaProvincia || prev.cliente.reaProvincia;
                newClienteData.codiceLEI = extractedData.codice_lei || prev.cliente.codiceLEI;
                newClienteData.formaGiuridica = extractedData.forma_giuridica || extractedData.formaGiuridica || prev.cliente.formaGiuridica;
                
                // Gestione indirizzo
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
                newClienteData.capitaleSociale = extractedData.capitale_sociale_versato ?? extractedData.capitale_sociale ?? prev.cliente.capitaleSociale;
                newClienteData.statoAttivita = extractedData.stato_attivita || extractedData.statoAttivita || prev.cliente.statoAttivita;
                newClienteData.atecoPrimario = extractedData.codice_ateco || extractedData.atecoPrimario || prev.cliente.atecoPrimario;
                newClienteData.attivitaPrevalente = extractedData.attivita_esercitata_descr || extractedData.attivitaPrevalente || prev.cliente.attivitaPrevalente;
                newClienteData.numeroAddetti = extractedData.numero_addetti ?? prev.cliente.numeroAddetti;
                newClienteData.numeroAmministratori = extractedData.numero_amministratori ?? prev.cliente.numeroAmministratori;
                
                // Sistema amministrazione
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
                
                // Organo controllo
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
                
                newClienteData.numeroUnitaLocali = extractedData.numero_unita_locali ?? prev.cliente.numeroUnitaLocali;
                
                // Partecipazioni
                const partecipazioniValAI = extractedData.partecipazioni_descr;
                if (typeof partecipazioniValAI === 'string') {
                    newClienteData.partecipazioni = partecipazioniValAI.toLowerCase() === 'sì' || partecipazioniValAI.toLowerCase() === 'si';
                } else if (typeof partecipazioniValAI === 'boolean') {
                    newClienteData.partecipazioni = partecipazioniValAI;
                } else {
                    newClienteData.partecipazioni = prev.cliente.partecipazioni || false;
                }
                
                newClienteData.certificazioni = extractedData.certificazioni_qualita_elenco || extractedData.certificazioni || prev.cliente.certificazioni;
                
                // Date
                newClienteData.dataCostituzione = parseDateSafe(extractedData.data_costituzione) || parseDateSafe(extractedData.dataCostituzione) || prev.cliente.dataCostituzione;
                newClienteData.dataIscrizioneRI = parseDateSafe(extractedData.data_iscrizione_ri) || parseDateSafe(extractedData.dataIscrizioneRI) || prev.cliente.dataIscrizioneRI;
                newClienteData.dataRiferimentoAddetti = parseDateSafe(extractedData.data_riferimento_addetti) || parseDateSafe(extractedData.dataRiferimentoAddetti) || prev.cliente.dataRiferimentoAddetti;
                newClienteData.dataInizioAttivita = parseDateSafe(extractedData.data_inizio_attivita) || parseDateSafe(extractedData.dataInizioAttivita) || prev.cliente.dataInizioAttivita;

                // Mantieni i dati di valutazione esistenti
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

                return { ...prev, cliente: newClienteData };
            });

            setVisuraError(null);
            alert('Dati estratti dalla visura e campi pre-compilati!');
        } catch (err) {
            setVisuraError(err.response?.data?.message || 'Errore durante l\'estrazione dei dati dal PDF.');
        } finally {
            setProcessingVisura(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
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
            const dataToSave = {
                nome: checklistData.nome,
                descrizione: checklistData.descrizione,
                cliente: clienteData
            };
            const response = await axios.post('http://localhost:5001/api/checklist', dataToSave);
            if(onSaveSuccess) {
                onSaveSuccess(response.data.data);
            }
        } catch (err) {
            let errorMessage = err.response?.data?.message || 'Errore durante la creazione della checklist.';
            if (err.response?.data?.errors) {
                const validationErrors = Object.values(err.response.data.errors).map(e => e.message).join('; ');
                errorMessage = `Errore di validazione: ${validationErrors}`;
            }
            setError(errorMessage);
            setActiveStep(0);
        } finally {
            setLoading(false);
        }
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                        <Fade in timeout={600}>
                            <Box>
                                {/* Informazioni base checklist */}
                                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                                    <DescriptionIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                                    Informazioni Checklist
                                </Typography>
                                
                                {error && (
                                    <Zoom in timeout={400}>
                                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                            {error}
                                        </Alert>
                                    </Zoom>
                                )}
                                
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <StyledTextField
                                            required
                                            name="nome"
                                            label="Nome Sessione Checklist"
                                            fullWidth
                                            value={checklistData.nome}
                                            onChange={handleInputChange}
                                            disabled={loading || processingVisura}
                                            InputLabelProps={{ shrink: !!checklistData.nome }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <StyledTextField
                                            name="descrizione"
                                            label="Descrizione Checklist (Opz.)"
                                            fullWidth
                                            value={checklistData.descrizione}
                                            onChange={handleInputChange}
                                            disabled={loading || processingVisura}
                                            InputLabelProps={{ shrink: !!checklistData.descrizione }}
                                        />
                                    </Grid>

                                    {/* Upload Visura */}
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 2 }}>
                                            <Chip 
                                                label="Carica Visura Camerale (Opzionale)" 
                                                icon={<CloudUploadIcon />}
                                                sx={{
                                                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                                                    color: theme.palette.secondary.main
                                                }}
                                            />
                                        </Divider>
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <UploadArea
                                            isDragActive={isDragActive}
                                            onDragEnter={handleDragEnter}
                                            onDragLeave={handleDragLeave}
                                            onDragOver={handleDragOver}
                                            onDrop={handleDrop}
                                        >
                                            <input
                                                type="file"
                                                id="visura-upload"
                                                hidden
                                                accept="application/pdf"
                                                onChange={handleVisuraFileChange}
                                                disabled={processingVisura || loading}
                                            />
                                            <label htmlFor="visura-upload" style={{ cursor: 'pointer' }}>
                                                <Avatar sx={{
                                                    mx: 'auto',
                                                    mb: 2,
                                                    width: 64,
                                                    height: 64,
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                    color: theme.palette.primary.main
                                                }}>
                                                    <DocumentScannerIcon fontSize="large" />
                                                </Avatar>
                                                <Typography variant="h6" gutterBottom>
                                                    {selectedVisuraFile ? visuraFileName : 'Trascina qui il PDF della visura'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    oppure clicca per selezionare
                                                </Typography>
                                                {selectedVisuraFile && (
                                                    <AnimatedButton
                                                        variant="contained"
                                                        color="secondary"
                                                        onClick={handleProcessVisura}
                                                        disabled={!selectedVisuraFile || processingVisura || loading}
                                                        startIcon={processingVisura ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                                                        sx={{ mt: 2 }}
                                                    >
                                                        {processingVisura ? 'Elaboro...' : 'Estrai Dati con AI'}
                                                    </AnimatedButton>
                                                )}
                                            </label>
                                        </UploadArea>
                                        {visuraError && (
                                            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setVisuraError(null)}>
                                                {visuraError}
                                            </Alert>
                                        )}
                                    </Grid>

                                    {/* Anagrafica Cliente */}
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 2 }}>
                                            <Chip 
                                                label="Anagrafica Cliente" 
                                                icon={<BusinessIcon />}
                                                sx={{
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                    color: theme.palette.primary.main
                                                }}
                                            />
                                        </Divider>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6} md={4}>
                                        <StyledTextField
                                            required
                                            name="cliente.nome"
                                            label="Denominazione Cliente"
                                            fullWidth
                                            value={checklistData.cliente.nome}
                                            onChange={handleInputChange}
                                            disabled={loading || processingVisura}
                                            InputLabelProps={{ shrink: !!checklistData.cliente.nome }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <StyledTextField
                                            name="cliente.codiceFiscale"
                                            label="Codice Fiscale"
                                            fullWidth
                                            value={checklistData.cliente.codiceFiscale}
                                            onChange={handleInputChange}
                                            disabled={loading || processingVisura}
                                            InputLabelProps={{ shrink: !!checklistData.cliente.codiceFiscale }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <StyledTextField
                                            name="cliente.partitaIva"
                                            label="Partita IVA"
                                            fullWidth
                                            value={checklistData.cliente.partitaIva}
                                            onChange={handleInputChange}
                                            disabled={loading || processingVisura}
                                            InputLabelProps={{ shrink: !!checklistData.cliente.partitaIva }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <StyledTextField
                                            name="cliente.pec"
                                            label="PEC"
                                            fullWidth
                                            value={checklistData.cliente.pec}
                                            onChange={handleInputChange}
                                            disabled={loading || processingVisura}
                                            InputLabelProps={{ shrink: !!checklistData.cliente.pec }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <FormControl fullWidth disabled={loading || processingVisura}>
                                            <InputLabel id="forma-giuridica-label">Forma Giuridica</InputLabel>
                                            <Select
                                                labelId="forma-giuridica-label"
                                                name="cliente.formaGiuridica"
                                                value={checklistData.cliente.formaGiuridica}
                                                label="Forma Giuridica"
                                                onChange={handleInputChange}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                <MenuItem value=""><em>Non specificata</em></MenuItem>
                                                <MenuItem value="societa' a responsabilita' limitata">SRL</MenuItem>
                                                <MenuItem value="SRLS">SRLS</MenuItem>
                                                <MenuItem value="SPA">SPA</MenuItem>
                                                <MenuItem value="Altro">Altro</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}> <StyledTextField name="cliente.reaNumero" label="Numero REA" fullWidth value={checklistData.cliente.reaNumero} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.reaNumero }}/> </Grid>
                                    <Grid item xs={12} sm={6} md={4}> <StyledTextField name="cliente.reaProvincia" label="Provincia REA" fullWidth value={checklistData.cliente.reaProvincia} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.reaProvincia }}/> </Grid>
                                    <Grid item xs={12} sm={6} md={4}> <StyledTextField name="cliente.codiceLEI" label="Codice LEI (Opz.)" fullWidth value={checklistData.cliente.codiceLEI} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.codiceLEI }}/> </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <StyledTextField
                                            name="cliente.capitaleSociale"
                                            label="Capitale Sociale €"
                                            type="number"
                                            fullWidth
                                            value={checklistData.cliente.capitaleSociale}
                                            onChange={handleInputChange}
                                            disabled={loading || processingVisura}
                                            InputLabelProps={{ shrink: checklistData.cliente.capitaleSociale != null && checklistData.cliente.capitaleSociale !== '' }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <DatePicker label="Data Costituzione" value={checklistData.cliente.dataCostituzione} onChange={(newValue) => handleDateChange('cliente.dataCostituzione', newValue)} slots={{ textField: (params) => <StyledTextField {...params} fullWidth disabled={loading || processingVisura}/> }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <DatePicker label="Data Iscrizione RI" value={checklistData.cliente.dataIscrizioneRI} onChange={(newValue) => handleDateChange('cliente.dataIscrizioneRI', newValue)} slots={{ textField: (params) => <StyledTextField {...params} fullWidth disabled={loading || processingVisura}/> }} />
                                    </Grid>


                                    {/* Sede Legale */}
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 2 }}><Chip label="Sede Legale" size="small" /></Divider>
                                    </Grid>
                                    <Grid item xs={12} md={8}>
                                        <StyledTextField
                                            name="cliente.sede_via"
                                            label="Indirizzo (Via/Piazza/Km...)"
                                            fullWidth
                                            value={checklistData.cliente.sede_via}
                                            onChange={handleInputChange}
                                            disabled={loading || processingVisura}
                                            InputLabelProps={{ shrink: !!checklistData.cliente.sede_via }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <StyledTextField
                                            name="cliente.sede_cap"
                                            label="CAP"
                                            fullWidth
                                            value={checklistData.cliente.sede_cap}
                                            onChange={handleInputChange}
                                            disabled={loading || processingVisura}
                                            InputLabelProps={{ shrink: !!checklistData.cliente.sede_cap }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={8}>
                                        <StyledTextField
                                            name="cliente.sede_comune"
                                            label="Comune"
                                            fullWidth
                                            value={checklistData.cliente.sede_comune}
                                            onChange={handleInputChange}
                                            disabled={loading || processingVisura}
                                            InputLabelProps={{ shrink: !!checklistData.cliente.sede_comune }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <StyledTextField
                                            name="cliente.sede_provincia"
                                            label="Provincia (Sigla)"
                                            fullWidth
                                            inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
                                            value={checklistData.cliente.sede_provincia}
                                            onChange={handleInputChange}
                                            disabled={loading || processingVisura}
                                            InputLabelProps={{ shrink: !!checklistData.cliente.sede_provincia }}
                                        />
                                    </Grid>

                                    {/* Attività e Struttura */}
                                    <Grid item xs={12}><Divider sx={{ my: 2 }}><Chip label="Attività e Struttura" size="small"/></Divider></Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                      <FormControl fullWidth disabled={loading || processingVisura}>
                                          <InputLabel id="stato-attivita-label">Stato Attività</InputLabel>
                                          <Select labelId="stato-attivita-label" name="cliente.statoAttivita" value={checklistData.cliente.statoAttivita} label="Stato Attività" onChange={handleInputChange} sx={{ borderRadius: 2 }}>
                                              <MenuItem value="attiva">Attiva</MenuItem><MenuItem value="inattiva">Inattiva</MenuItem><MenuItem value="sospesa">Sospesa</MenuItem><MenuItem value="liquidazione">In Liquidazione</MenuItem><MenuItem value="cessata">Cessata</MenuItem>
                                          </Select>
                                      </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                          <DatePicker label="Data Inizio Attività" value={checklistData.cliente.dataInizioAttivita} onChange={(newValue) => handleDateChange('cliente.dataInizioAttivita', newValue)} slots={{ textField: (params) => <StyledTextField {...params} fullWidth disabled={loading || processingVisura}/> }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}> <StyledTextField name="cliente.atecoPrimario" label="Codice ATECO Primario" fullWidth value={checklistData.cliente.atecoPrimario} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.atecoPrimario }}/> </Grid>
                                    <Grid item xs={12}> <StyledTextField name="cliente.attivitaPrevalente" label="Attività Prevalente (Descrizione)" fullWidth value={checklistData.cliente.attivitaPrevalente} onChange={handleInputChange} disabled={loading || processingVisura} multiline rows={2} InputLabelProps={{ shrink: !!checklistData.cliente.attivitaPrevalente }}/> </Grid>
                                    <Grid item xs={12} sm={6} md={3}> <StyledTextField name="cliente.numeroAddetti" label="Numero Addetti" type="number" fullWidth value={checklistData.cliente.numeroAddetti} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: checklistData.cliente.numeroAddetti != null && checklistData.cliente.numeroAddetti !== '' }}/> </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                         <DatePicker label="Data Riferim. Addetti" value={checklistData.cliente.dataRiferimentoAddetti} onChange={(newValue) => handleDateChange('cliente.dataRiferimentoAddetti', newValue)} slots={{ textField: (params) => <StyledTextField {...params} fullWidth disabled={loading || processingVisura}/> }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}> <StyledTextField name="cliente.numeroAmministratori" label="Numero Amministratori" type="number" fullWidth value={checklistData.cliente.numeroAmministratori} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: checklistData.cliente.numeroAmministratori != null && checklistData.cliente.numeroAmministratori !== '' }}/> </Grid>
                                     <Grid item xs={12} sm={6} md={3}>
                                         <FormControl fullWidth disabled={loading || processingVisura}>
                                             <InputLabel id="sis-amm-label">Sistema Amministrazione</InputLabel>
                                             <Select labelId="sis-amm-label" name="cliente.sistemaAmministrazione" value={checklistData.cliente.sistemaAmministrazione} label="Sistema Amministrazione" onChange={handleInputChange} sx={{ borderRadius: 2 }}>
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
                                         <FormControl fullWidth disabled={loading || processingVisura || !checklistData.cliente.organoControlloPresente}>
                                             <InputLabel id="tipo-org-controllo-label">Tipo Organo Controllo</InputLabel>
                                             <Select labelId="tipo-org-controllo-label" name="cliente.tipoOrganoControllo" value={checklistData.cliente.tipoOrganoControllo} label="Tipo Organo Controllo" onChange={handleInputChange} sx={{ borderRadius: 2 }}>
                                                  <MenuItem value=""><em>Non specificato</em></MenuItem>
                                                  <MenuItem value="Sindaco Unico">Sindaco Unico</MenuItem>
                                                  <MenuItem value="Collegio Sindacale">Collegio Sindacale</MenuItem>
                                                  <MenuItem value="Revisore Legale">Revisore Legale</MenuItem>
                                                  <MenuItem value="Società Revisione">Società Revisione</MenuItem>
                                             </Select>
                                         </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}> <StyledTextField name="cliente.numeroUnitaLocali" label="Numero Unità Locali" type="number" fullWidth value={checklistData.cliente.numeroUnitaLocali} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: checklistData.cliente.numeroUnitaLocali != null && checklistData.cliente.numeroUnitaLocali !== '' }}/> </Grid>

                                    {/* Varie */}
                                    <Grid item xs={12}><Divider sx={{ my: 2 }}><Chip label="Varie" size="small"/></Divider></Grid>
                                    <Grid item xs={12} sm={6}> <StyledTextField name="cliente.certificazioni" label="Certificazioni (separate da virgola)" fullWidth value={checklistData.cliente.certificazioni} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.certificazioni }}/> </Grid>
                                    <Grid item xs={6} sm={3}><FormControlLabel control={<Checkbox name="cliente.importExport" checked={!!checklistData.cliente.importExport} onChange={handleInputChange} disabled={loading || processingVisura}/>} label="Import/Export?" /></Grid>
                                    <Grid item xs={6} sm={3}><FormControlLabel control={<Checkbox name="cliente.partecipazioni" checked={!!checklistData.cliente.partecipazioni} onChange={handleInputChange} disabled={loading || processingVisura}/>} label="Partecipazioni?" /></Grid>

                                    {/* Info Valutazione */}
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 2 }}>
                                            <Chip 
                                                label="Parametri Valutazione AAO" 
                                                size="small"
                                                sx={{
                                                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                                    color: theme.palette.warning.main
                                                }}
                                            />
                                        </Divider>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth required disabled={loading || processingVisura}>
                                            <InputLabel id="dimensione-stimata-label">Dimensione Stimata</InputLabel>
                                            <Select
                                                required
                                                labelId="dimensione-stimata-label"
                                                name="cliente.dimensioneStimata"
                                                value={checklistData.cliente.dimensioneStimata}
                                                label="Dimensione Stimata"
                                                onChange={handleInputChange}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                <MenuItem value=""><em>Seleziona</em></MenuItem>
                                                <MenuItem value="Micro">Micro</MenuItem>
                                                <MenuItem value="Piccola">Piccola</MenuItem>
                                                <MenuItem value="Media">Media</MenuItem>
                                                <MenuItem value="Grande">Grande</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth required disabled={loading || processingVisura}>
                                            <InputLabel id="complessita-label">Complessità</InputLabel>
                                            <Select
                                                required
                                                labelId="complessita-label"
                                                name="cliente.complessita"
                                                value={checklistData.cliente.complessita}
                                                label="Complessità"
                                                onChange={handleInputChange}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                <MenuItem value=""><em>Seleziona</em></MenuItem>
                                                <MenuItem value="Bassa">Bassa</MenuItem>
                                                <MenuItem value="Media">Media</MenuItem>
                                                <MenuItem value="Alta">Alta</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                     <Grid item xs={12} md={12}> <StyledTextField name="cliente.settore" label="Settore Attività (Generico)" fullWidth value={checklistData.cliente.settore} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.settore }}/> </Grid>

                                    {/* Profilazione Avanzata */}
                                    <Grid item xs={12}>
                                        <Box sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                             onClick={() => setShowAdvanced(!showAdvanced)}>
                                            <IconButton size="small">
                                                {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                Profilazione Avanzata (Opzionale)
                                            </Typography>
                                            <Tooltip title="Questi dati migliorano la personalizzazione delle domande AI">
                                                <InfoIcon sx={{ ml: 1, fontSize: 18, color: theme.palette.info.main }} />
                                            </Tooltip>
                                        </Box>
                                        <Divider />
                                    </Grid>

                                    <Collapse in={showAdvanced} timeout="auto" unmountOnExit>
                                        <Grid container spacing={3} sx={{ mt: 0 }}>
                                            <Grid item xs={12}>
                                                <InfoCard>
                                                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <AutoAwesomeIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                                                        La compilazione di questi campi permette all'AI di personalizzare le domande
                                                        in base al contesto specifico dell'azienda.
                                                    </Typography>
                                                </InfoCard>
                                            </Grid>
                                            
                                            <Grid item xs={12} md={6}>
                                                <FormControl fullWidth disabled={loading || processingVisura}>
                                                    <InputLabel id="modello-business-label">Modello Business</InputLabel>
                                                    <Select
                                                        labelId="modello-business-label"
                                                        name="cliente.modelloBusiness"
                                                        value={checklistData.cliente.modelloBusiness}
                                                        label="Modello Business"
                                                        onChange={handleInputChange}
                                                        sx={{ borderRadius: 2 }}
                                                    >
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
                                              <FormControl fullWidth disabled={loading || processingVisura}>
                                                <InputLabel id="complessita-op-label">Complessità Operativa</InputLabel>
                                                <Select labelId="complessita-op-label" name="cliente.complessitaOperativa" value={checklistData.cliente.complessitaOperativa} label="Complessità Operativa" onChange={handleInputChange} sx={{ borderRadius: 2 }}>
                                                  <MenuItem value=""><em>Non specificato</em></MenuItem>
                                                  <MenuItem value="Bassa">Bassa</MenuItem>
                                                  <MenuItem value="Media">Media</MenuItem>
                                                  <MenuItem value="Alta">Alta</MenuItem>
                                                  <MenuItem value="Molto Alta">Molto Alta</MenuItem>
                                                </Select>
                                              </FormControl>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <FormControl fullWidth disabled={loading || processingVisura}>
                                                    <InputLabel id="struttura-prop-label">Struttura Proprietaria</InputLabel>
                                                    <Select
                                                        labelId="struttura-prop-label"
                                                        name="cliente.strutturaProprietaria"
                                                        value={checklistData.cliente.strutturaProprietaria}
                                                        label="Struttura Proprietaria"
                                                        onChange={handleInputChange}
                                                        sx={{ borderRadius: 2 }}
                                                    >
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
                                                <FormControl fullWidth disabled={loading || processingVisura}>
                                                    <InputLabel id="internaz-label">Livello Internazionalizzazione</InputLabel>
                                                    <Select
                                                        labelId="internaz-label"
                                                        name="cliente.livelloInternazionalizzazione"
                                                        value={checklistData.cliente.livelloInternazionalizzazione}
                                                        label="Livello Internazionalizzazione"
                                                        onChange={handleInputChange}
                                                        sx={{ borderRadius: 2 }}
                                                    >
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
                                                <FormControl fullWidth disabled={loading || processingVisura}>
                                                    <InputLabel id="ciclo-vita-label">Fase Ciclo di Vita</InputLabel>
                                                    <Select
                                                        labelId="ciclo-vita-label"
                                                        name="cliente.faseCicloVita"
                                                        value={checklistData.cliente.faseCicloVita}
                                                        label="Fase Ciclo di Vita"
                                                        onChange={handleInputChange}
                                                        sx={{ borderRadius: 2 }}
                                                    >
                                                        <MenuItem value=""><em>Non specificato</em></MenuItem>
                                                        <MenuItem value="Startup">Startup/Avvio</MenuItem>
                                                        <MenuItem value="Crescita">Crescita Rapida</MenuItem>
                                                        <MenuItem value="Maturita">Maturità</MenuItem>
                                                        <MenuItem value="Declino">Declino</MenuItem>
                                                        <MenuItem value="Ristrutturazione">In Ristrutturazione</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                             <Grid item xs={12} md={6}> <StyledTextField name="cliente.settoreATECOSpecifico" label="Settore ATECO Specifico (es. 22.2)" fullWidth value={checklistData.cliente.settoreATECOSpecifico} onChange={handleInputChange} disabled={loading || processingVisura} InputLabelProps={{ shrink: !!checklistData.cliente.settoreATECOSpecifico }}/> </Grid>

                                            
                                            <Grid item xs={12}>
                                                <StyledTextField
                                                    name="cliente.obiettiviStrategici"
                                                    label="Obiettivi Strategici Principali (1-3 anni)"
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    value={checklistData.cliente.obiettiviStrategici || ''}
                                                    onChange={handleInputChange}
                                                    disabled={loading || processingVisura}
                                                    helperText="Es: Aumentare export 20%, Lanciare linea prodotto Y, Migliorare efficienza Z"
                                                    InputLabelProps={{ shrink: !!checklistData.cliente.obiettiviStrategici }}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <StyledTextField
                                                    name="cliente.criticitaPercepite"
                                                    label="Principali Criticità / Inefficienze Percepite"
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    value={checklistData.cliente.criticitaPercepite || ''}
                                                    onChange={handleInputChange}
                                                    disabled={loading || processingVisura}
                                                    helperText="Es: Ritardi consegne, Scarsa comunicazione interna, Difficoltà a trovare personale qualificato"
                                                    InputLabelProps={{ shrink: !!checklistData.cliente.criticitaPercepite }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Collapse>
                                </Grid>
                            </Box>
                        </Fade>
                    </LocalizationProvider>
                );
            case 1: // Revisione
                return (
                    <Fade in timeout={600}>
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                                Revisione e Creazione
                            </Typography>
                            
                            {error && (
                                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                    {error}
                                </Alert>
                            )}
                            
                            <InfoCard sx={{ mb: 3 }}>
                                <Typography variant="body2">
                                    <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Le domande verranno generate automaticamente dall'AI in base ai parametri inseriti.
                                </Typography>
                            </InfoCard>
                            
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <GlassCard sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                                Informazioni Checklist
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Typography variant="body2">
                                                    <strong>Nome:</strong> {checklistData.nome || 'N/D'}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Descrizione:</strong> {checklistData.descrizione || 'N/D'}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </GlassCard>
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                    <GlassCard sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                                Dati Cliente
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Typography variant="body2">
                                                    <strong>Denominazione:</strong> {checklistData.cliente.nome || 'N/D'}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>P.IVA:</strong> {checklistData.cliente.partitaIva || 'N/D'}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Forma Giuridica:</strong> {checklistData.cliente.formaGiuridica || 'N/D'}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </GlassCard>
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <GlassCard sx={{
                                        borderLeft: `4px solid ${theme.palette.warning.main}`
                                    }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                                Parametri di Valutazione
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={4}>
                                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                                        <Typography variant="h4" sx={{
                                                            fontWeight: 800,
                                                            color: theme.palette.primary.main,
                                                            mb: 1
                                                        }}>
                                                            {checklistData.cliente.dimensioneStimata || 'N/D'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Dimensione
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={4}>
                                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                                        <Typography variant="h4" sx={{
                                                            fontWeight: 800,
                                                            color: theme.palette.secondary.main,
                                                            mb: 1
                                                        }}>
                                                            {checklistData.cliente.complessita || 'N/D'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Complessità
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={4}>
                                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                                        <Typography variant="h4" sx={{
                                                            fontWeight: 800,
                                                            color: theme.palette.info.main,
                                                            mb: 1
                                                        }}>
                                                            AI
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Personalizzazione
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </GlassCard>
                                </Grid>
                                
                                {(checklistData.cliente.modelloBusiness || checklistData.cliente.obiettiviStrategici) && (
                                    <Grid item xs={12}>
                                        <Alert severity="success" sx={{ borderRadius: 2 }}>
                                            <Typography variant="body2">
                                                <strong>Ottimo!</strong> Hai fornito informazioni avanzate che permetteranno
                                                all'AI di personalizzare meglio le domande per {checklistData.cliente.nome}.
                                            </Typography>
                                        </Alert>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </Fade>
                );
            default:
                return 'Passaggio sconosciuto';
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

            <GlassCard sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
                {/* Stepper */}
                <Stepper 
                    activeStep={activeStep} 
                    sx={{ mb: 4 }}
                    connector={<ColorlibConnector />}
                    alternativeLabel
                >
                    {steps.map((label, index) => (
                        <Step key={label}>
                            <StepLabel StepIconComponent={ColorlibStepIcon}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    {label}
                                </Typography>
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* Progress bar */}
                <LinearProgress
                    variant="determinate"
                    value={(activeStep + 1) / steps.length * 100}
                    sx={{
                        mb: 4,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                        }
                    }}
                />

                {/* Content */}
                <Box sx={{ minHeight: 400 }}>
                    {getStepContent(activeStep)}
                </Box>

                {/* Actions */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 4,
                    pt: 3,
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                    <AnimatedButton
                        variant="outlined"
                        onClick={onCancel}
                        disabled={loading || processingVisura}
                        sx={{ borderRadius: 2 }}
                    >
                        Annulla Creazione
                    </AnimatedButton>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {activeStep !== 0 && (
                            <Button
                                onClick={handleBack}
                                disabled={loading || processingVisura}
                                startIcon={<ArrowBackIcon />}
                            >
                                Indietro
                            </Button>
                        )}
                        {activeStep < steps.length - 1 ? (
                            <AnimatedButton
                                variant="contained"
                                onClick={handleNext}
                                disabled={
                                    loading || processingVisura ||
                                    (activeStep === 0 && (!checklistData.nome || !checklistData.cliente.nome ||
                                        !checklistData.cliente.dimensioneStimata || !checklistData.cliente.complessita))
                                }
                                endIcon={<ArrowForwardIcon />}
                                sx={{
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                    color: 'white'
                                }}
                            >
                                Avanti
                            </AnimatedButton>
                        ) : (
                            <AnimatedButton
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={
                                    !checklistData.nome || !checklistData.cliente.nome ||
                                    !checklistData.cliente.dimensioneStimata || !checklistData.cliente.complessita ||
                                    loading || processingVisura
                                }
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                                sx={{
                                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                                    color: 'white',
                                    minWidth: 150
                                }}
                            >
                                {loading ? 'Creazione...' : 'Crea Checklist'}
                            </AnimatedButton>
                        )}
                    </Box>
                </Box>
            </GlassCard>
        </Box>
    );
};

export default NuovaChecklist;