

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Grid, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Alert, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
    Select, MenuItem, CircularProgress, Tooltip, Stack, TextareaAutosize,    // --- AGGIUNGI QUESTI ---
    Divider,
    ListSubheader,

    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText

} from '@mui/material';

import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'; // Per generare bozza
import FilterListIcon from '@mui/icons-material/FilterList'; // Per filtri futuri
import CloseIcon from '@mui/icons-material/Close'; // Per chiudere dialoghi
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Per copiare bozza
import SaveIcon from '@mui/icons-material/Save'; // <-- AGGIUNGI ICONA SALVA

import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import SubjectIcon from '@mui/icons-material/Subject'; // Per area tematica
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest'; // Per analizza contesto
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Per Accordion

const getPriorityColor = (priority) => {
    if (priority === 'alta') return 'error';
    if (priority === 'media') return 'warning';
    if (priority === 'bassa') return 'success';
    return 'default';
};

const getPriorityLabel = (priority) => {
    return priority?.charAt(0).toUpperCase() + priority?.slice(1) || priority || 'N/D';
};

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

const getStatusLabel = (status) => {
    return status?.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || status || 'N/D';
};

const getAreaLabel = (area) => {
    const areaMap = {
        Org: 'Organizzativa',
        Admin: 'Amministrativa',
        Acct: 'Contabile',
        Crisi: 'Ril. Crisi',
        IT: 'IT',
        Altro: 'Altro' // Assicurati che 'Altro' sia gestito
    };
    return areaMap[area] || area || 'Altro'; // Restituisce il codice se non mappato o 'Altro'
};

const GenerateDocModal = ({ 
    open, 
    onClose, 
    onGenerate, // Vecchia funzione per bozza completa
    onGenerateStructure, // NUOVA PROP PER STRUTTURA
    intervento, 
    isLoading,
    tipoDocumentoPerStruttura, // Tipo documento per il nuovo pulsante
    onTipoDocumentoChange // Callback per aggiornare tipo documento per struttura
}) => {
    const [tipoDocumento, setTipoDocumento] = useState('');

    const [paramTitolo, setParamTitolo] = useState('');
    const [paramRuolo, setParamRuolo] = useState('');

    useEffect(() => {

        if (open) {
            setTipoDocumento(''); // Per la generazione completa
            onTipoDocumentoChange(''); // Resetta anche per la struttura
            setParamTitolo(intervento?.titolo ? `Procedura - ${intervento.titolo}` : ''); // Prefill titolo procedura
            setParamRuolo('');
        }
    }, [open, intervento, onTipoDocumentoChange]);

    const handleGenerateClick = () => { // Per bozza completa
        const parametriUtente = {};
        if (tipoDocumento === 'procedura' && paramTitolo) parametriUtente.titoloProcedura = paramTitolo;
        if (tipoDocumento === 'mansionario' && paramRuolo) parametriUtente.ruolo = paramRuolo;

        onGenerate(intervento._id, tipoDocumento, parametriUtente);
    };

    const handleAnalyzeStructureClick = () => { // Per analisi struttura
        if (onGenerateStructure) {
            onGenerateStructure(); // Non servono parametri qui, li prende dallo stato padre
        }
    };

    if (!intervento) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Azioni Documento AI per: {intervento.titolo}</DialogTitle>
            <DialogContent dividers>
                {}
                <FormControl fullWidth required margin="normal" size="small">
                    <InputLabel id="tipo-doc-label">Tipo Documento (per entrambe le azioni)</InputLabel>
                    <Select
                        labelId="tipo-doc-label"
                        value={tipoDocumentoPerStruttura} // Usa lo stato dal padre per la struttura
                        label="Tipo Documento (per entrambe le azioni)"
                        onChange={(e) => {
                            setTipoDocumento(e.target.value); // Per la generazione completa
                            onTipoDocumentoChange(e.target.value); // Per la struttura
                        }}
                        disabled={isLoading}
                    >
                        <MenuItem value=""><em>Seleziona...</em></MenuItem>
                        <ListSubheader>Documenti Strutturati</ListSubheader>
                        <MenuItem value="procedura">Procedura Operativa</MenuItem>
                        <MenuItem value="mansionario">Mansionario</MenuItem>
                        <MenuItem value="organigramma">Descrizione Organigramma (Testuale)</MenuItem>
                        <MenuItem value="delega">Bozza Delega Formale</MenuItem>
                        <ListSubheader>Altro</ListSubheader>
                        <MenuItem value="altro">Altro Documento (Generico)</MenuItem>
                    </Select>
                </FormControl>

                {}
                {tipoDocumentoPerStruttura === 'procedura' && (
                    <TextField
                        label="Titolo Specifico Procedura (Opzionale per Bozza Completa)"
                        value={paramTitolo}
                        onChange={(e) => setParamTitolo(e.target.value)}
                        fullWidth margin="normal" size="small" disabled={isLoading}
                        helperText="Se vuoto, l'AI userà un titolo generico per la bozza completa."
                    />
                )}
                {tipoDocumentoPerStruttura === 'mansionario' && (
                    <TextField
                        label="Ruolo Specifico (Opzionale per Bozza Completa)"
                        value={paramRuolo}
                        onChange={(e) => setParamRuolo(e.target.value)}
                        fullWidth margin="normal" size="small" disabled={isLoading}
                         helperText="Es: 'Responsabile Amministrativo'"
                    />
                )}
            </DialogContent>
            <DialogActions sx={{p:2, justifyContent: 'space-between'}}>
                <Button onClick={onClose} disabled={isLoading}>Annulla</Button>
                <Stack direction="row" spacing={1}>
                    <Button
                        onClick={handleAnalyzeStructureClick} // Nuovo handler
                        variant="outlined"
                        color="primary"
                        disabled={!tipoDocumentoPerStruttura || isLoading} // Usa tipoDocumentoPerStruttura
                        startIcon={isLoading ? <CircularProgress size={16} color="inherit"/> : <SettingsSuggestIcon />}
                    >
                        {isLoading ? 'Analizzo...' : 'Proponi Struttura'}
                    </Button>
                    <Button
                        onClick={handleGenerateClick} // Vecchio handler
                        variant="contained"
                        color="primary"
                        disabled={!tipoDocumentoPerStruttura || isLoading} // Usa tipoDocumentoPerStruttura (o tipoDocumento se differenziato)
                        startIcon={isLoading ? <CircularProgress size={16} color="inherit"/> : <AutoFixHighIcon />}
                    >
                        {isLoading ? 'Genero...' : 'Genera Bozza Completa'}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
};

const ViewDraftModal = ({
    open,
    onClose,
    draftMarkdown,
    titolo,

    onSaveDraft, // Funzione per salvare la bozza
    isSavingDraft // Stato di caricamento per salvataggio
 }) => {

    const handleCopyToClipboard = () => {  };

    const handleSaveClick = () => {
        if (onSaveDraft) {
            onSaveDraft(); // Chiama la funzione passata dalle props
        }
    };

    return (
         <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Bozza Documento Generata: {titolo}
                <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {}
                <TextareaAutosize
                    minRows={15}
                    maxRows={30}
                    value={draftMarkdown || "Nessun contenuto generato."}
                    readOnly
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9rem', whiteSpace: 'pre-wrap', border: '1px solid #ccc', padding: '8px', boxSizing: 'border-box' }}
                />
                 {}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
                <Button onClick={handleCopyToClipboard} startIcon={<ContentCopyIcon />} disabled={!draftMarkdown || isSavingDraft}>Copia Testo</Button>
                <Box>
                    <Button onClick={onClose} disabled={isSavingDraft} sx={{ mr: 1 }}>Chiudi</Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={isSavingDraft ? <CircularProgress size={16} color="inherit"/> : <SaveIcon />}
                        onClick={handleSaveClick}
                        disabled={!draftMarkdown || isSavingDraft}
                    >
                        {isSavingDraft ? 'Salvo...' : 'Salva Bozza'}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

const FormalizzazionePage = () => {

    const [interventi, setInterventi] = useState([]);
    const [loadingInterventi, setLoadingInterventi] = useState(false);
    const [errorInterventi, setErrorInterventi] = useState(null);
    const [filters, setFilters] = useState({ area: '', stato: '' }); // Filtri per interventi

    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [interventoToFormalize, setInterventoToFormalize] = useState(null);
    const [generatingDraft, setGeneratingDraft] = useState(false);
    const [generationError, setGenerationError] = useState(null);

    const [showDraftModal, setShowDraftModal] = useState(false);
    const [generatedDraft, setGeneratedDraft] = useState('');
    const [generatedDocTitle, setGeneratedDocTitle] = useState('');

    const [savingDraft, setSavingDraft] = useState(false);
    const [saveDraftError, setSaveDraftError] = useState(null);

    const [tipoDocumentoSelezionato, setTipoDocumentoSelezionato] = useState('');

    const [checklists, setChecklists] = useState([]);
    const [loadingChecklists, setLoadingChecklists] = useState(false);
    const [errorChecklists, setErrorChecklists] = useState(null);
    const [selectedChecklistIdFilter, setSelectedChecklistIdFilter] = useState('');

    const [generationMessage, setGenerationMessage] = useState({ type: '', text: '', planId: null });

    const [documenti, setDocumenti] = useState([]);
    const [loadingDocumenti, setLoadingDocumenti] = useState(false);
    const [errorDocumenti, setErrorDocumenti] = useState(null);

    const [showDocumentDetailModal, setShowDocumentDetailModal] = useState(false);
    const [selectedDocumentDetail, setSelectedDocumentDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [openDeleteDocDialog, setOpenDeleteDocDialog] = useState(false);
    const [docToDelete, setDocToDelete] = useState(null);

    const [filteredDocumenti, setFilteredDocumenti] = useState([]);

    const [showAssetDefinitionWorkspace, setShowAssetDefinitionWorkspace] = useState(false);
    const [assetContext, setAssetContext] = useState({ intervento: null, areaTematica: '', tipoDocumento: '' });
    const [proposedStructure, setProposedStructure] = useState([]);
    const [usefulKbReferences, setUsefulKbReferences] = useState([]);
    const [analyzingContext, setAnalyzingContext] = useState(false);
    const [analysisError, setAnalysisError] = useState(null);
    const [isDeletingDocument, setIsDeletingDocument] = useState(false);

    const handleAnalyzeContextForStructure = async () => {
        setAnalyzingContext(true);
        setAnalysisError(null);
        setProposedStructure([]);
        setUsefulKbReferences([]);

        const { intervento, tipoDocumento, areaTematica } = assetContext;

        if (!tipoDocumento) {
            setAnalysisError("Seleziona prima un tipo di documento per l'analisi della struttura.");
            setAnalyzingContext(false);
            return;
        }
        if (!intervento && !areaTematica) {
            setAnalysisError("Seleziona un intervento o specifica un'area tematica per l'analisi.");
            setAnalyzingContext(false);
            return;
        }

        const payload = {
            tipoDocumentoDaStrutturare: tipoDocumento,
            interventoId: intervento ? intervento._id : undefined,
            areaTematica: areaTematica || undefined,
            parametriUtente: {} // Per ora vuoto, da definire se servono parametri specifici
        };

        try {
            console.log(">>> Chiamata POST a /api/formalization/analyze-context-for-structure con payload:", payload);
            const response = await axios.post('http://localhost:5001/api/formalization/analyze-context-for-structure', payload);
            
            if (response.data && response.data.data) {
                setProposedStructure(response.data.data.propostaStruttura || []);
                setUsefulKbReferences(response.data.data.riferimentiKbUtili || []);
                setShowAssetDefinitionWorkspace(true); // Apri il workspace
                setShowGenerateModal(false); // Chiudi il modal di generazione
            } else {
                throw new Error("Risposta non valida dal server per l'analisi della struttura.");
            }

        } catch (err) {
            console.error(">>> Errore durante l'analisi del contesto per la struttura:", err);
            const errMsg = err.response?.data?.message || err.message || "Errore sconosciuto durante l'analisi della struttura.";
            setAnalysisError(errMsg);

            setShowAssetDefinitionWorkspace(false); 
        } finally {
            setAnalyzingContext(false);
        }
    };

    const fetchInterventi = useCallback(async () => {
        setLoadingInterventi(true); setErrorInterventi(null); setGenerationError(null);
        try {

            const defaultStates = ['approvato', 'pianificato', 'in_corso', 'completato'];

            setInterventi([]); // Svuota sempre prima del fetch

            if (selectedChecklistIdFilter === '') {
                console.log(">>> Fetch interventi saltata: nessuna origine checklist selezionata per formalizzazione.");
                setLoadingInterventi(false);
                return;
            }

    const params = {
        checklist_id: selectedChecklistIdFilter // Filtro origine è sempre obbligatorio (se non '')
    };

    if (filters.area) {
        params.area = filters.area;
    }
    if (filters.stato) {

        if (filters.stato === 'approvato,pianificato,in_corso,completato') {

             params.stato = filters.stato;

        } else if (filters.stato !== 'tutti') { // Ignora 'tutti'
             params.stato = filters.stato; 
        }

    }

            console.log("Fetching interventi per formalizzazione con params:", params);

            const response = await axios.get('http://localhost:5001/api/interventions', { params });
            setInterventi(response.data.data || []);
        } catch (err) {
            setErrorInterventi(err.response?.data?.message || 'Errore recupero interventi.');
            setInterventi([]);
        } finally { setLoadingInterventi(false); }

}, [selectedChecklistIdFilter, filters.area, filters.stato]); // Dipende dai filtri attivi

useEffect(() => {

    console.log(">>> FormalizzazionePage: useEffect[fetchInterventi] triggerato.");
    fetchInterventi();
}, [fetchInterventi]); // Dipendenza corretta

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleOpenGenerateModal = (intervento) => {
        setInterventoToFormalize(intervento);
        setGenerationError(null); // Pulisci errore precedente
        setShowGenerateModal(true);
    };
    const handleCloseGenerateModal = () => { setShowGenerateModal(false); setInterventoToFormalize(null);  setTipoDocumentoSelezionato(''); };
    const handleCloseDraftModal = () => { setShowDraftModal(false); setGeneratedDraft(''); setGeneratedDocTitle(''); setTipoDocumentoSelezionato(''); };

    const handleGenerateDraft = async (interventoId, tipoDocumento, parametriUtente) => {
        setGeneratingDraft(true); setGenerationError(null);
        setTipoDocumentoSelezionato(tipoDocumento); // <-- SALVA IL TIPO QUI

    const url = 'http://localhost:5001/api/formalization/generate-ai'; // <--- URL ASSOLUTO CORRETTO

        try {

            console.log(`Chiamata POST a ${url} con dati:`, { interventoId, tipoDocumento, parametriUtente }); // Aggiungi log
            const response = await axios.post(url, { interventoId, tipoDocumento, parametriUtente });

            setGeneratedDraft(response.data.data?.bozzaMarkdown || '');

            setGeneratedDocTitle(`${tipoDocumento.charAt(0).toUpperCase() + tipoDocumento.slice(1)} - ${interventoToFormalize?.titolo}`);
            setShowGenerateModal(false); // Chiudi modal generazione
            setShowDraftModal(true); // Apri modal visualizzazione
        } catch (err) {

            console.error(`Errore chiamata ${url}:`, err);
             if (err.response) {

                 console.error("Errore - Dati:", err.response.data);
                 console.error("Errore - Stato:", err.response.status);
                 console.error("Errore - Headers:", err.response.headers);
                 setGenerationError(`Errore dal server (${err.response.status}): ${err.response.data?.message || 'Errore sconosciuto'}`);
             } else if (err.request) {

                 console.error("Errore - Nessuna risposta:", err.request);
                 setGenerationError('Nessuna risposta ricevuta dal server. Verifica la connessione o che il server sia attivo.');
             } else {

                 console.error('Errore generico Axios:', err.message);
                 setGenerationError(`Errore nell'invio della richiesta: ${err.message}`);
             }

            setTipoDocumentoSelezionato(''); // Resetta se fallisce

        } finally { setGeneratingDraft(false); }
    };

    const fetchDocumenti = useCallback(async () => {
        setLoadingDocumenti(true);
        setErrorDocumenti(null);
        setDocumenti([]); // Svuota prima
        try {
            console.log(">>> FormalizzazionePage: Fetching documenti formalizzati...");

            const response = await axios.get('http://localhost:5001/api/formalization');
            console.log(">>> FormalizzazionePage: Documenti ricevuti:", response.data.data?.length || 0);
            setDocumenti(response.data.data || []);
        } catch (err) {
            console.error(">>> FormalizzazionePage: Errore fetchDocumenti:", err);
            setErrorDocumenti(err.response?.data?.message || 'Errore recupero elenco documenti.');
            setDocumenti([]);
        } finally {
            setLoadingDocumenti(false);
        }
    }, []); // Dipende solo da sé stessa, chiamata al mount e dopo salvataggio

    useEffect(() => {
        fetchDocumenti();
    }, [fetchDocumenti]);

 const handleSaveDraft = async () => {
    setSavingDraft(true);
    setSaveDraftError(null); // Pulisci errore precedente
    setGenerationMessage({ type: '', text: '', planId: null }); // Pulisci messaggio gen.

    if (!generatedDraft || !interventoToFormalize || !tipoDocumentoSelezionato) { // Assicurati di avere il tipo selezionato
        setSaveDraftError("Dati mancanti per il salvataggio (bozza, intervento o tipo documento).");
        setSavingDraft(false);
        return;
    }

    const payload = {
        titolo: generatedDocTitle || `Bozza AI - ${interventoToFormalize.titolo}`, // Usa titolo generato o creane uno
        tipo: tipoDocumentoSelezionato, // Devi avere il tipo selezionato da qualche parte
        descrizione: `Bozza generata da AI per intervento: ${interventoToFormalize.titolo}`, // Descrizione di default
        intervento_id: interventoToFormalize._id,
        contenutoMarkdown: generatedDraft
    };

    console.log(">>> Tentativo salvataggio bozza con payload:", payload);

    try {
        const response = await axios.post('http://localhost:5001/api/formalization/from-ai', payload);
        console.log(">>> Risposta salvataggio bozza:", response.data);

        setGenerationMessage({ type: 'success', text: 'Bozza AI salvata con successo nel sistema!' });

        handleCloseDraftModal();
        handleCloseGenerateModal(); // Assicurati che anche questo si chiuda
        fetchDocumenti(); // <-- RICARICA LA LISTA QUI
     } catch (err) {

     } finally {
         setSavingDraft(false);
     }
 };

const handleOpenDeleteDocDialog = (documento) => {
    setDocToDelete(documento);
    setOpenDeleteDocDialog(true);
};

const handleCloseDeleteDocDialog = () => {
    setOpenDeleteDocDialog(false);
    setDocToDelete(null);
};

const handleDeleteDocumento = async (docId) => {
    if (!docId) return;
    setIsDeletingDocument(true);
    setErrorDocumenti(null);
    setGenerationMessage({ type: '', text: '', planId: null });

    try {
        await axios.delete(`http://localhost:5001/api/formalization/${docId}`);
        setGenerationMessage({ type: 'success', text: 'Documento eliminato con successo.' });
        handleCloseDeleteDocDialog();
        fetchDocumenti();
    } catch (err) {
        console.error("Errore eliminazione documento:", err);
        setErrorDocumenti(err.response?.data?.message || 'Errore durante l\'eliminazione del documento.');
        handleCloseDeleteDocDialog();
    } finally {
        setIsDeletingDocument(false);
    }
};

const handleOpenDocumentDetailModal = async (docId) => {
    if (!docId) return;
    setShowDocumentDetailModal(true);
    setLoadingDetail(true);
    setErrorDocumenti(null);
    setSelectedDocumentDetail(null);

    try {
        console.log(`>>> FormalizzazionePage: Fetching dettaglio documento ${docId}...`);
        const response = await axios.get(`http://localhost:5001/api/formalization/${docId}`);
        console.log(">>> FormalizzazionePage: Dettaglio documento ricevuto:", response.data.data);
        setSelectedDocumentDetail(response.data.data);
    } catch (err) {
        console.error(">>> FormalizzazionePage: Errore fetch dettaglio documento:", err);
        setErrorDocumenti(err.response?.data?.message || 'Errore recupero dettaglio documento.');
        setShowDocumentDetailModal(false);
    } finally {
        setLoadingDetail(false);
    }
};

const handleCloseDocumentDetailModal = () => {
    setShowDocumentDetailModal(false);
    setSelectedDocumentDetail(null);
};

const DocumentDetailModal = ({ open, onClose, documento, isLoading }) => {
    if (!open) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Dettaglio Documento: {documento?.titolo || 'Caricamento...'}
                <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>}
                {!isLoading && !documento && <Alert severity="error">Errore nel caricamento dei dati del documento.</Alert>}
                {!isLoading && documento && (
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}> <Typography variant="body2"><strong>Tipo:</strong> {documento.tipo}</Typography> </Grid>
                        <Grid item xs={12} sm={6}> <Typography variant="body2"><strong>Stato:</strong> {getStatusLabel(documento.stato)}</Typography> </Grid>
                        <Grid item xs={12} sm={6}> <Typography variant="body2"><strong>Versione:</strong> {documento.versione}</Typography> </Grid>
                        <Grid item xs={12} sm={6}> <Typography variant="body2"><strong>Creato il:</strong> {new Date(documento.createdAt).toLocaleString('it-IT')}</Typography> </Grid>
                        {documento.intervento_id && (
                             <Grid item xs={12}> <Typography variant="body2"><strong>Intervento Correlato:</strong> {documento.intervento_id.titolo || documento.intervento_id}</Typography> </Grid>
                        )}
                        {documento.descrizione && (
                            <Grid item xs={12}> <Typography variant="body2"><strong>Descrizione:</strong> {documento.descrizione}</Typography> </Grid>
                        )}

                        <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                        {}
                        {documento.contenutoMarkdown ? (
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>Contenuto Bozza AI (Markdown):</Typography>
                                <TextareaAutosize
                                    minRows={10}
                                    maxRows={25}
                                    value={documento.contenutoMarkdown}
                                    readOnly
                                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9rem', border: '1px solid #eee', padding: '8px', boxSizing: 'border-box' }}
                                />
                            </Grid>
                        ) : documento.pathFile ? (
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>File Caricato:</Typography>
                                <Typography variant="body2">Nome Originale: {documento.nomeFileOriginale}</Typography>
                                <Typography variant="body2">Tipo MIME: {documento.mimetypeFile}</Typography>
                                <Typography variant="body2">Dimensione: {documento.sizeFile ? (documento.sizeFile / 1024).toFixed(1) + ' KB' : 'N/D'}</Typography>
                                <Button
                                     variant="outlined" size="small" sx={{ mt: 1 }}
                                     startIcon={<DownloadIcon />}
                                     href={`http://localhost:5001/api/formalization/${documento._id}/download`}
                                     target="_blank" rel="noopener noreferrer"
                                 >
                                     Scarica File
                                 </Button>
                            </Grid>
                        ) : (
                            <Grid item xs={12}><Alert severity="warning">Nessun contenuto Markdown né file associato trovato.</Alert></Grid>
                        )}
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Chiudi</Button>
            </DialogActions>
        </Dialog>
    );
};

const getFilterOriginLabel = () => {
    if (selectedChecklistIdFilter === 'manuali') return 'Manuali';
    if (selectedChecklistIdFilter === 'tutti_ai') return 'Tutti AI';
    const foundChecklist = checklists.find(c => c._id === selectedChecklistIdFilter);
    return foundChecklist ? `${foundChecklist.nome} (${foundChecklist.cliente?.nome ?? 'N/D'})` : 'Sconosciuta';
};

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Formalizzazione Assetti (Generazione AI)</Typography>
             <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="body1" paragraph>
                    Seleziona un intervento dall'elenco sottostante (tipicamente Approvato, Pianificato o In Corso)
                    per generare automaticamente una bozza di documento di formalizzazione (procedura, mansionario, ecc.) tramite Intelligenza Artificiale.
                </Typography>
            </Paper>

            {}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    {}
        <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small" disabled={loadingChecklists || loadingInterventi}>
                <InputLabel id="checklist-filter-formalizzazione-label">Filtra Interventi per Origine</InputLabel>
                <Select
                    labelId="checklist-filter-formalizzazione-label"
                    value={selectedChecklistIdFilter}
                    label="Filtra Interventi per Origine"
                    onChange={(e) => {
                        setSelectedChecklistIdFilter(e.target.value);

                        setErrorInterventi(null);
                        setGenerationMessage({ type: '', text: '', planId: null });
                    }}
                >
                    <MenuItem value=""><em>-- Seleziona Origine --</em></MenuItem>
                    <MenuItem value="tutti_ai">Tutti Generati da AI</MenuItem>
                    <MenuItem value="manuali">Solo Creati Manualmente</MenuItem>
                    <Divider />
                    <ListSubheader>Da Checklist Specifica:</ListSubheader>
                    {loadingChecklists && <MenuItem disabled>Caricamento checklist...</MenuItem>}
                    {checklists.length === 0 && !loadingChecklists && <MenuItem disabled>Nessuna checklist disponibile</MenuItem>}
                    {checklists.map((cl) => (
                        <MenuItem key={cl._id} value={cl._id}>
                            {cl.nome} ({cl.cliente?.nome ?? 'N/D'}) - {cl.stato}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            {errorChecklists && <Alert severity="error" sx={{mt:1, fontSize: '0.8rem'}}>{errorChecklists}</Alert>}
        </Grid>

        {}
        <Grid item xs={12} sm={6} md={3}>
        <FormControl fullWidth size="small" disabled={loadingInterventi || !selectedChecklistIdFilter}>
                             <InputLabel id="area-filter-label">Filtra Area Intervento</InputLabel>
                             <Select 
                                labelId="area-filter-label" 
                                name="area" 
                                value={filters.area} 
                                label="Filtra Area Intervento" 
                                onChange={handleFilterChange}
                             >
                                <MenuItem value="">Tutte</MenuItem>
                                <MenuItem value="Org">Organizzativa</MenuItem>
                                <MenuItem value="Admin">Amministrativa</MenuItem>
                                <MenuItem value="Acct">Contabile</MenuItem>
                                <MenuItem value="Crisi">Ril. Crisi</MenuItem>
                                <MenuItem value="IT">IT</MenuItem>
                                <MenuItem value="Altro">Altro</MenuItem>
                             </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small" disabled={loadingInterventi || !selectedChecklistIdFilter}>
                            <InputLabel id="stato-filter-label">Filtra Stato Intervento</InputLabel>
                            <Select 
                                labelId="stato-filter-label" 
                                name="stato" 
                                value={filters.stato} 
                                label="Filtra Stato Intervento" 
                                onChange={handleFilterChange}
                            >
                                <MenuItem value="tutti">Tutti gli Stati</MenuItem>
                                <MenuItem value="approvato,pianificato,in_corso,completato">Stati Rilevanti</MenuItem>
                                <MenuItem value="suggerito">Suggerito</MenuItem>
                                <MenuItem value="da_approvare">Da Approvare</MenuItem>
                                <MenuItem value="approvato">Approvato</MenuItem>
                                <MenuItem value="pianificato">Pianificato</MenuItem>
                                <MenuItem value="in_corso">In Corso</MenuItem>
                                <MenuItem value="completato">Completato</MenuItem>
                                <MenuItem value="annullato">Annullato</MenuItem>
                                <MenuItem value="in_attesa">In Attesa</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

             {errorInterventi && <Alert severity="error" sx={{ mb: 2 }}>{errorInterventi}</Alert>}

            {}
            <Paper sx={{ p: 0, mb: 4 }}>
                 {loadingInterventi ? ( <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box> ) : (
                    <TableContainer>
                        <Table size="small">
                             <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: 'grey.100' } }}>
                                    <TableCell>Titolo Intervento</TableCell>
                                    <TableCell>Area</TableCell>
                                    <TableCell>Priorità</TableCell>
                                    <TableCell>Stato</TableCell>
                                    <TableCell align="right" sx={{pr: 2}}>Azione AI</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                            {interventi.length === 0 && selectedChecklistIdFilter === '' && (
    <TableRow><TableCell colSpan={5} align="center">Seleziona un'origine checklist per visualizzare gli interventi.</TableCell></TableRow>
)}
{interventi.length === 0 && selectedChecklistIdFilter !== '' && !loadingInterventi && (
    <TableRow><TableCell colSpan={5} align="center">Nessun intervento trovato per l'origine selezionata.</TableCell></TableRow>
)}     
                    {interventi.map((i) => (
                        <TableRow key={i._id} hover sx={{ '& td': { py: 1 } }}>
                            <TableCell sx={{ fontWeight: 500 }}>{i.titolo}</TableCell>
                            <TableCell>{getAreaLabel(i.area)}</TableCell>
                            <TableCell><Chip label={getPriorityLabel(i.priorita)} color={getPriorityColor(i.priorita)} size="small"/></TableCell>
                            <TableCell><Chip label={getStatusLabel(i.stato)} color={getStatusColor(i.stato)} size="small"/></TableCell>
<TableCell padding="none" align="right" sx={{pr: 1}}>
                                             <Tooltip title="Genera Bozza Documento AI per questo intervento">
                                                <IconButton size="small" color="secondary" onClick={() => handleOpenGenerateModal(i)}>
                                                    <AutoFixHighIcon fontSize="inherit"/>
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                 )}
            </Paper>

{}
<Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
    Documenti di Formalizzazione Esistenti {selectedChecklistIdFilter && `(Origine: ${getFilterOriginLabel()})`}
</Typography>
{errorDocumenti && <Alert severity="error" sx={{ mb: 2 }}>{errorDocumenti}</Alert>}
<Paper sx={{ p: 0, mb: 4 }}>
    {loadingDocumenti ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
    ) : (
        <TableContainer>
            <Table size="small">
                <TableHead>
                                    <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: 'grey.100' } }}>
                                        <TableCell>Titolo Documento</TableCell>
                                        <TableCell>Tipo</TableCell>
                                        <TableCell>Stato</TableCell>
                                        <TableCell>Versione</TableCell>
                                        <TableCell>Origine</TableCell>
                                        <TableCell>Data Creazione</TableCell>
                                        <TableCell align="right">Azioni</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                    {selectedChecklistIdFilter === '' && (
                        <TableRow><TableCell colSpan={7} align="center">Seleziona un'origine per visualizzare i documenti associati.</TableCell></TableRow>
                    )}
                    {selectedChecklistIdFilter !== '' && filteredDocumenti.length === 0 && !loadingDocumenti && (
                        <TableRow><TableCell colSpan={7} align="center">Nessun documento trovato per l'origine selezionata.</TableCell></TableRow>
                    )}

                    {filteredDocumenti.map((doc) => (
                        <TableRow key={doc._id} hover>
                                            <TableCell sx={{ fontWeight: 500 }}>{doc.titolo}</TableCell>
                                            <TableCell>{doc.tipo}</TableCell>
                                            <TableCell><Chip label={getStatusLabel(doc.stato)} color={getStatusColor(doc.stato)} size="small" /></TableCell>
                                            <TableCell>{doc.versione}</TableCell>
                                            <TableCell>
                                                {doc.pathFile ? 'File Caricato' : (doc.contenutoMarkdown ? 'Bozza AI' : 'N/D')}
                                            </TableCell>
                                            <TableCell>{new Date(doc.createdAt).toLocaleDateString('it-IT')}</TableCell>
                                            <TableCell padding="none" align="right">
                                                <Tooltip title="Visualizza Dettaglio/Contenuto">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleOpenDocumentDetailModal(doc._id)}
                                                        disabled={loadingDetail}
                                                    >
                                                        <VisibilityIcon fontSize="inherit" />
                                                    </IconButton>
                                                </Tooltip>
                                                 {doc.pathFile && (
                                                    <Tooltip title="Scarica File">
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            href={`http://localhost:5001/api/formalization/${doc._id}/download`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <DownloadIcon fontSize="inherit"/>
                                                        </IconButton>
                                                     </Tooltip>
                                                 )}
<Tooltip title="Elimina Documento">
    <IconButton size="small" color="error" onClick={() => handleOpenDeleteDocDialog(doc)} disabled={loadingDocumenti}>
        <DeleteIcon fontSize="inherit" />
    </IconButton>
</Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>

            {}
            <GenerateDocModal
                open={showGenerateModal}
                onClose={handleCloseGenerateModal}
                onGenerate={handleGenerateDraft}
                onGenerateStructure={handleAnalyzeContextForStructure}
                intervento={interventoToFormalize}
                isLoading={generatingDraft || analyzingContext}
                tipoDocumentoPerStruttura={assetContext.tipoDocumento}
                onTipoDocumentoChange={(val) => setAssetContext(prev => ({...prev, tipoDocumento: val}))}
            />
             {}
             {analysisError && showGenerateModal && (
                <Alert severity="error" sx={{ position: 'absolute', bottom: 70, left: 24, right: 24, zIndex: 1301 }}>
                    {analysisError}
                </Alert>
            )}
            {}
             {generationError && showGenerateModal && (
                <Alert severity="error" sx={{ position: 'absolute', bottom: 70, left: 24, right: 24, zIndex: 1301 }}>
                    {generationError}
                </Alert>
            )}

            {}
            <ViewDraftModal
                open={showDraftModal}
                onClose={handleCloseDraftModal}
                draftMarkdown={generatedDraft}
                titolo={generatedDocTitle}
                onSaveDraft={handleSaveDraft}
                isSavingDraft={savingDraft}
            />
            {}
            {saveDraftError && showDraftModal && (
                <Alert severity="error" sx={{ position: 'absolute', bottom: 70, left: 24, right: 24, zIndex: 1301 }}>
                    {saveDraftError}
                </Alert>
            )}

            {}
            <DocumentDetailModal
                open={showDocumentDetailModal}
                onClose={handleCloseDocumentDetailModal}
                documento={selectedDocumentDetail}
                isLoading={loadingDetail}
            />

            {}
            <Dialog open={openDeleteDocDialog} onClose={handleCloseDeleteDocDialog}>
                <DialogTitle>Conferma Eliminazione</DialogTitle>
                <DialogContent>
                    <Typography>
                        Sei sicuro di voler eliminare il documento "{docToDelete?.titolo}"?
                        {docToDelete?.nomeFileSalvataggio && " Verrà eliminato anche il file associato."}
                        L'operazione non è reversibile.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDocDialog} disabled={isDeletingDocument}>Annulla</Button>
                    <Button onClick={() => handleDeleteDocumento(docToDelete?._id)} color="error" disabled={isDeletingDocument} startIcon={isDeletingDocument ? <CircularProgress size={16}/> : <DeleteIcon/>}>
                        {isDeletingDocument ? 'Elimino...' : 'Elimina Definitivamente'}
                    </Button>
                </DialogActions>
            </Dialog>

            {}
            {showAssetDefinitionWorkspace && (
                <Paper elevation={3} sx={{ p: {xs: 1, sm: 2, md: 3}, mt: 3, border: theme => `1px solid ${theme.palette.primary.main}`, borderRadius: 2 }}>
                    <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                        <Typography variant="h6" component="div">
                            Area di Lavoro: {assetContext.intervento?.titolo || assetContext.areaTematica}
                            <Chip label={assetContext.tipoDocumento} size="small" color="primary" sx={{ml:1}}/>
                        </Typography>
                        <Button onClick={() => setShowAssetDefinitionWorkspace(false)} size="small" variant="outlined" startIcon={<CloseIcon/>}>Chiudi Workspace</Button>
                    </Box>
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Typography variant="subtitle1" gutterBottom sx={{fontWeight:'bold'}}>Struttura Documento Proposta dall'AI:</Typography>
                            {analyzingContext && <Box sx={{display:'flex', justifyContent:'center', my:3}}><CircularProgress /></Box>}
                            {!analyzingContext && proposedStructure.length === 0 && <Alert severity="info" sx={{mb:1}}>Nessuna struttura proposta o analisi non ancora effettuata per questo contesto.</Alert>}
                            
                            {proposedStructure.map((sezione, idx) => (
                                <Accordion key={idx} defaultExpanded={idx < 3}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography sx={{fontWeight:'bold'}}>{idx + 1}. {sezione.sezione_principale}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{bgcolor: '#f9f9f9', borderLeft: '3px solid #eee', pl:2}}>
                                        <Typography variant="subtitle2" gutterBottom>Punti Chiave / Sottosezioni Suggerite:</Typography>
                                        {sezione.punti_chiave_o_sottosezioni && sezione.punti_chiave_o_sottosezioni.length > 0 ? (
                                            <List dense disablePadding>
                                                {sezione.punti_chiave_o_sottosezioni.map((punto, pIdx) => (
                                                    <ListItem key={pIdx} sx={{py:0.2}}>
                                                        <ListItemText secondary={`• ${punto}`} />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography variant="caption" sx={{fontStyle: 'italic'}}>Nessun punto chiave specifico suggerito per questa sezione.</Typography>
                                        )}
                                        <TextField 
                                            label={`Appunti per "${sezione.sezione_principale}"`}
                                            multiline rows={4} fullWidth variant="filled" size="small"
                                            placeholder="Inizia a scrivere o chiedi aiuto all'AI per elaborare questa sezione..."
                                            sx={{mt:1.5, bgcolor: 'white'}}
                                        />
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                            {!analyzingContext && proposedStructure.length > 0 && (
                                <Button variant="contained" sx={{mt:2}}
                                    startIcon={<SaveIcon/>}
                                    disabled
                                >
                                    Salva Documento Assetto Completo (In Lavorazione)
                                </Button>
                            )}
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper variant="outlined" sx={{p:1.5, height:'100%'}}>
                                <Typography variant="subtitle1" gutterBottom sx={{fontWeight:'bold'}}>Riferimenti KB Utili (suggeriti da AI):</Typography>
                                {analyzingContext && <Box sx={{display:'flex', justifyContent:'center', my:3}}><CircularProgress size={24} /></Box>}
                                {!analyzingContext && usefulKbReferences.length === 0 && <Alert severity="info" icon={false} size="small">Nessun riferimento specifico dalla KB.</Alert>}
                                
                                <Box sx={{maxHeight: {xs: 300, md: 500}, overflowY:'auto', pr:0.5}}>
                                {usefulKbReferences.map(ref => (
                                    <Paper key={ref.id} elevation={0} sx={{p:1, mb:1, fontSize:'0.8rem', border: '1px dashed #ddd'}}>
                                        <Typography variant="caption" display="block" sx={{fontWeight:'bold', color:'text.secondary'}}>
                                            ID Chunk: {ref.id} (Sim: {ref.similarity?.toFixed(3)})
                                        </Typography>
                                        <Typography variant="body2" sx={{fontStyle:'italic', fontSize: '0.85rem', maxHeight:100, overflow:'hidden', textOverflow:'ellipsis'}}>
                                            {ref.text.substring(0, 200)}...
                                        </Typography>
                                        <Button size="small" variant="text" sx={{mt:0.5}}>
                                            Leggi tutto
                                        </Button>
                                    </Paper>
                                ))}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </Box>
    );
};

export default FormalizzazionePage;
