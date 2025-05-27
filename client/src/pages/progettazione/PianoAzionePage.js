// START OF FILE client/src/pages/progettazione/PianoAzionePage.js (AGGIORNATO con Suggerimenti AI)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Grid, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Alert, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
    Select, MenuItem, CircularProgress, List, ListItem, ListItemText, Checkbox,
    Stepper, Step, StepLabel, Accordion, AccordionSummary, AccordionDetails, Divider,
    Card, CardHeader, CardContent, ListItemIcon, LinearProgress, Tooltip, Stack // Aggiunti per visualizzare suggerimenti
} from '@mui/material';
import { ListSubheader } from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { it } from 'date-fns/locale';
import { Link as RouterLink } from 'react-router-dom'; // Aggiunto se mancava

import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'; // Icona PDF


// Funzioni Utility (definite qui o importate)
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
        bozza: 'default' // Aggiunto bozza se mancava
    };
    return statusMap[status] || 'default';
};

const getStatusLabel = (status) => status?.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || status || 'N/D';

const getPriorityColor = (priority) => { // Rinominata per chiarezza
    if (priority === 'alta') return 'error';
    if (priority === 'media') return 'warning';
    if (priority === 'bassa') return 'success';
    return 'default';
};

const getPriorityLabel = (priority) => priority?.charAt(0).toUpperCase() + priority?.slice(1) || priority || 'N/D';

const getAreaLabel = (area) => { // Aggiunta definizione
    const areaMap = { Org: 'Organizzativa', Admin: 'Amministrativa', Acct: 'Contabile', Crisi: 'Ril. Crisi', IT: 'IT' };
    return areaMap[area] || area || 'Altro';
};


// Funzioni per suggerimenti (se ancora usate nel NewPianoForm)
const getPriorityColorSuggest = (priorityLabel) => { /* ... */ return 'default'; };
const getPriorityLabelSuggest = (priorityLabel) => { /* ... */ return priorityLabel; };

//const getPriorityColorSuggest = (priorityLabel) => { // Funzione per priorità A/M/B
  //  if (priorityLabel === 'A') return 'error';
    //if (priorityLabel === 'M') return 'warning';
    //if (priorityLabel === 'B') return 'success';
    //return 'default';
//};
//const getPriorityLabelSuggest = (priorityLabel) => { // Funzione per priorità A/M/B
 //   if (priorityLabel === 'A') return 'Alta';
  //  if (priorityLabel === 'M') return 'Media';
  //  if (priorityLabel === 'B') return 'Bassa';
   // return priorityLabel;
//};


// --- Componente NewPianoForm ---
// Assicurati che la definizione delle props sia ESATTAMENTE così:
const NewPianoForm = ({
    onSave,                     // Propricevuta
    onCancel,                   // Prop ricevuta
    isLoading,                 // Prop ricevuta
    apiError,                   // Prop ricevuta
    apiSuccess,                 // Prop ricevuta
    interventiSuggeriti = [],   // Prop ricevuta
    originatingChecklistId = null,// Prop ricevuta
    checklistsCompletate = []  // Prop ricevuta
}) => {                         // Fine definizione props
    // --- AGGIUNGI QUESTO LOG ---
    console.log("Props ricevute da NewPianoForm:", { onSave, onCancel, isLoading /*, altre props se vuoi vederle */ });
    // --------------------------
    // --- STATI LOCALI del Form ---
    const [formData, setFormData] = useState({
        titolo: originatingChecklistId ? `Piano Azione da Suggerimenti ${new Date().toLocaleDateString()}` : '', // Pre-popola titolo se arriva da suggerimenti
        descrizione: '',
        interventiSelezionati: []
    });
    const [clienteNomeInput, setClienteNomeInput] = useState('');
    const [selectedChecklistRefId, setSelectedChecklistRefId] = useState(originatingChecklistId || '');
    const [availableInterventi, setAvailableInterventi] = useState([]);
    const [loadingInterventi, setLoadingInterventi] = useState(false);
    const [filteredAvailableInterventi, setFilteredAvailableInterventi] = useState([]);

    // *** CONTROLLO CRUCIALE: NON ci devono essere altre dichiarazioni di ***
    // *** 'onCancel', 'isLoading', o 'checklistsCompletate' qui dentro! ***
    // const [isLoading, setIsLoading] = useState(false); // <-- SBAGLIATO! Rimuovi se presente
    // const [checklistsCompletate, setChecklistsCompletate] = useState([]); // <-- SBAGLIATO! Rimuovi se presente

    

    // --- useEffect e Handlers (come prima, ma assicurati usino le props/stati corretti) ---

    useEffect(() => { // Carica interventi
        const fetchAvailableInterventi = async () => {
            setLoadingInterventi(true);
            try {
                const response = await axios.get('http://localhost:5001/api/interventions?select=titolo,area,priorita,origin,checklist_id_origine');
                setAvailableInterventi(response.data.data || []);
            } catch (err) { console.error(err); setAvailableInterventi([]); }
            finally { setLoadingInterventi(false); }
        };
        fetchAvailableInterventi();
    }, []); // Solo al mount

    useEffect(() => { // Filtra interventi
        console.log(`Filtraggio interventi per Checklist ID: ${selectedChecklistRefId || 'Nessuna/Solo Manuali'}`);
        let filtered = [];
        if (!selectedChecklistRefId) {
            filtered = availableInterventi.filter(inter => inter.origin === 'manuale');
        } else {
            filtered = availableInterventi.filter(inter =>
                inter.origin === 'manuale' || inter.checklist_id_origine === selectedChecklistRefId
            );
        }
        setFilteredAvailableInterventi(filtered);
        const filteredIds = new Set(filtered.map(f => f._id));
        setFormData(prev => ({
            ...prev,
            interventiSelezionati: prev.interventiSelezionati.filter(id => filteredIds.has(id))
        }));
    }, [selectedChecklistRefId, availableInterventi]);

// Handler cambio checklist riferimento
const handleChecklistRefChange = (event) => {
    setSelectedChecklistRefId(event.target.value);
};

    // Carica interventi disponibili (come prima)
    useEffect(() => {
        const fetchAvailableInterventi = async () => {
             setLoadingInterventi(true);
             try {
                 const response = await axios.get('http://localhost:5001/api/interventions?select=titolo,area,priorita,gap_correlati'); // Prendiamo anche gap_correlati
                 setAvailableInterventi(response.data.data || []);
             } catch (err) { console.error(err); setAvailableInterventi([]); }
             finally { setLoadingInterventi(false); }
        };
        fetchAvailableInterventi();
    }, []);

    // Pre-popola titolo/cliente basato sui suggerimenti (se presenti)
    useEffect(() => {
         // Questa logica è semplice, potrebbe essere migliorata
        if (interventiSuggeriti.length > 0 && !formData.titolo) {
             // Potrebbe prendere il nome cliente dalla checklist associata ai suggerimenti?
            // Per ora, un titolo generico
            setFormData(prev => ({ ...prev, titolo: `Piano Azione da Suggerimenti ${new Date().toLocaleDateString()}` }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interventiSuggeriti]); // Aggiorna solo quando arrivano i suggerimenti


    // --- CORREZIONE: Handler generico per i TextField ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Aggiorna lo stato del form per titolo e descrizione
        if (name === 'titolo' || name === 'descrizione') {
             setFormData(prev => ({ ...prev, [name]: value }));
        }
        // Gestisce lo stato separato per clienteNomeInput
        else if (name === 'clienteNome') {
            setClienteNomeInput(value);
        }
    };
    // ----------------------------------------------------

    // Gestisce la selezione degli interventi REALI nel dropdown MultiSelect
    const handleInterventiChange = (event) => {
        const { target: { value } } = event;
        setFormData(prev => ({ ...prev, interventiSelezionati: typeof value === 'string' ? value.split(',') : value }));
    };

    // --- NUOVO: Funzione per selezionare interventi reali basati sui suggerimenti AI ---
    const selectInterventiFromSuggestions = (suggestedIds) => {
         // Trova gli _ID reali degli interventi disponibili che corrispondono ai gapId suggeriti
         const realIdsToSelect = availableInterventi
             .filter(realIntervento =>
                 // Controlla se l'intervento reale ha almeno un gap_correlato
                 // il cui item_id corrisponde a uno dei gapId suggeriti
                 realIntervento.gap_correlati && realIntervento.gap_correlati.some(gapRef =>
                     typeof gapRef === 'object' // Se è popolato
                         ? suggestedIds.includes(gapRef.item_id)
                         // Se è solo un ID, non possiamo fare il match diretto qui senza un'altra chiamata API
                         // Modifichiamo l'approccio: selezioniamo basandoci sull'ID del SUGGERIMENTO (ACT-B.1.1) vs l'ID del GAP dell'intervento
                         // : suggestedIds.includes(`ACT-${gapRef}`) // Questo probabilmente non funziona
                         // Per ora, questa logica è complessa senza un match diretto.
                         // Semplificazione: selezioniamo tutti gli interventi disponibili. L'utente deselezionerà.
                         : false // Ignora se non popolato
                 )
                 // OPPURE, se non abbiamo i gap popolati, potremmo provare un match sul titolo? (fragile)
                 // || interventiSuggeriti.some(sugg => sugg.gapId === realIntervento.gapIdPrincipale) // Se avessimo gapIdPrincipale
             )
             .map(realIntervento => realIntervento._id);

         // Alternativa Semplificata (Seleziona TUTTI gli interventi disponibili per poi deselezionare):
         // const allAvailableIds = availableInterventi.map(i => i._id);
         // setFormData(prev => ({ ...prev, interventiSelezionati: allAvailableIds }));
         // alert("Tutti gli interventi disponibili sono stati pre-selezionati. Deseleziona quelli non necessari.");

         // Approccio attuale: Non selezioniamo nulla automaticamente, l'utente usa la lista suggerimenti come guida
         console.log("Suggerimenti ricevuti, l'utente può usarli come guida per selezionare gli interventi reali.");

    };
     // Chiama la funzione quando i suggerimenti cambiano (dopo il caricamento)
     useEffect(() => {
         if (interventiSuggeriti.length > 0 && availableInterventi.length > 0) {
             const suggestedGapIds = interventiSuggeriti.map(s => s.gapId);
             selectInterventiFromSuggestions(suggestedGapIds);
         }
     // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [interventiSuggeriti, availableInterventi]); // Dipende da entrambi


     const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = {
            titolo: formData.titolo,
            descrizione: formData.descrizione,
            clienteNome: clienteNomeInput,
            interventiSelezionati: formData.interventiSelezionati,
            checklistIdOrigine: selectedChecklistRefId || originatingChecklistId // Passa la ref selezionata o quella originale
        };
        if (!dataToSave.titolo || !dataToSave.clienteNome) { alert("Titolo e Cliente obbligatori"); return; }
        onSave(dataToSave); // Chiama la prop onSave
    };
    // -----------------------------------
    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Nuovo Piano d'Azione</Typography>
            {/* Mostra la lista dei suggerimenti come guida */}
            {interventiSuggeriti.length > 0 && (
                <Box sx={{ mb: 3, p: 2, border: '1px dashed grey', maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Interventi Suggeriti dall'Analisi:</Typography>
                    <List dense>
                        {interventiSuggeriti.map((sugg, index) => (
                            <ListItem key={sugg.id} disablePadding>
                                <ListItemIcon sx={{minWidth: 30}}><Chip label={index+1} size="small"/></ListItemIcon>
                                <ListItemText
                                    primary={`${sugg.intervento} (Prio: ${getPriorityLabelSuggest(sugg.prioritaLabel)}, ~${sugg.tempisticaGiorni}gg)`}
                                    secondary={`Gap: ${sugg.gapId} - ${sugg.gapDesc}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                    <Alert severity="info" sx={{mt: 1}}>Usa questa lista come guida per selezionare gli interventi reali dal menu sottostante.</Alert>
                </Box>
            )}
            {/* Resto del form come prima */}
            {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
            {apiSuccess && <Alert severity="success" sx={{ mb: 2 }}>{apiSuccess}</Alert>}
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    {/* --- CORREZIONE: TextField Titolo --- */}
                    <Grid item xs={12}>
                        <TextField
                            required
                            name="titolo" // Nome corretto
                            label="Titolo Piano"
                            value={formData.titolo} // Valore dallo stato formData
                            onChange={handleInputChange} // Handler corretto
                            fullWidth
                            disabled={isLoading}
                            InputLabelProps={{ shrink: !!formData.titolo }}
                        />
                    </Grid>  
                    
                                        {/* --- CORREZIONE: TextField Cliente Nome --- */}
                                        <Grid item xs={12}>
                        <TextField
                            required
                            name="clienteNome" // Nome corretto
                            label="Nome Cliente"
                            value={clienteNomeInput} // Valore dallo stato clienteNomeInput
                            onChange={handleInputChange} // Handler corretto
                            fullWidth
                            disabled={isLoading}
                            InputLabelProps={{ shrink: !!clienteNomeInput }}
                        />
                    </Grid>
                    {/* --- CORREZIONE: TextField Descrizione --- */}
                    <Grid item xs={12}>
                        <TextField
                            name="descrizione" // Nome corretto
                            label="Descrizione/Obiettivi"
                            value={formData.descrizione} // Valore dallo stato formData
                            onChange={handleInputChange} // Handler corretto
                            fullWidth
                            multiline
                            rows={3}
                            disabled={isLoading}
                            InputLabelProps={{ shrink: !!formData.descrizione }}
                        />
                    </Grid>
                  {/* --- CORREZIONE: Select Checklist Riferimento --- */}
                  <Grid item xs={12}>
                        {/* Passa 'isLoading' (stato generale) o 'loadingInterventi' invece di 'loadingChecklists' */}
                        <FormControl fullWidth size="small" disabled={isLoading || loadingInterventi}>
                            <InputLabel id="checklist-ref-label">Checklist di Riferimento (Opzionale)</InputLabel>
                            <Select
                                labelId="checklist-ref-label"
                                value={selectedChecklistRefId}
                                label="Checklist di Riferimento (Opzionale)"
                                onChange={handleChecklistRefChange}
                            >
                                <MenuItem value=""><em>Nessuna (solo interventi manuali)</em></MenuItem>
                                {/* Usa la prop checklistsCompletate (che ora è definita) */}
                                {checklistsCompletate.length === 0 && <MenuItem disabled>Nessuna checklist compl. disponibile</MenuItem>}
                                {checklistsCompletate.map((cl) => (
                                    <MenuItem key={cl._id} value={cl._id}>{cl.nome} ({cl.cliente?.nome ?? 'N/D'})</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    {/* --- FINE CORREZIONE --- */}

                    <Grid item xs={12}>
                        <FormControl fullWidth disabled={loadingInterventi || isLoading}>
                            <InputLabel id="interventi-select-label">Seleziona Interventi REALI da Includere</InputLabel>
                            <Select
                                labelId="interventi-select-label"
                                label="Seleziona Interventi REALI da Includere"
                                multiple
                                value={formData.interventiSelezionati} // Usa lo stato interno
                                onChange={handleInterventiChange} // Usa l'handler interno
                                renderValue={(selected) => selected.length > 0 ? `${selected.length} interventi selezionati` : ''}
                            >
 {/* --- MODIFICA: Usa filteredAvailableInterventi --- */}
 {loadingInterventi && <MenuItem disabled>Caricamento interventi...</MenuItem>}
            {!loadingInterventi && filteredAvailableInterventi.length === 0 && <MenuItem disabled>{selectedChecklistRefId ? 'Nessun intervento manuale o per questa checklist.' : 'Nessun intervento disponibile.'}</MenuItem>}
            {filteredAvailableInterventi.map((inter) => (
                <MenuItem key={inter._id} value={inter._id}>
                    <Checkbox checked={formData.interventiSelezionati.indexOf(inter._id) > -1} />
                    <ListItemText primary={inter.titolo} secondary={`Origine: ${inter.origin === 'manuale' ? 'Manuale' : 'AI'} - Area: ${getAreaLabel(inter.area)}`} />
                </MenuItem>
            ))}
            {/* --------------------------------------------- */}
                            </Select>
                        </FormControl>
                    </Grid>
{/* Pulsanti Annulla / Crea Piano */}
<Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
<Button variant="outlined" onClick={onCancel} disabled={isLoading}>
                            Annulla
                        </Button>
                        <Button type="submit" variant="contained" color="primary" disabled={isLoading || loadingInterventi}>
                            {isLoading ? <CircularProgress size={24} /> : 'Crea Piano'}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};
// --- Fine Componente Form ---

// All'interno di client/src/pages/progettazione/PianoAzionePage.js
// --- Componente Dettaglio Piano (CORRETTO) ---
const PianoAzioneDetail = ({ piano, onBack, isLoading, onSave, checklistsCompletate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        titolo: '',
        descrizione: '',
        stato: '',
        responsabile_piano: '',
        data_inizio: null,
        data_fine_prevista: null,
        interventiSelezionati: [], // <-- NUOVO STATO per gli ID degli interventi selezionati
    });
    const [detailError, setDetailError] = useState(null);
    const [availableInterventi, setAvailableInterventi] = useState([]);
    const [loadingInterventi, setLoadingInterventi] = useState(false);

    // --- NUOVI STATI PER FILTRAGGIO IN EDIT ---
    // Stato per memorizzare il contesto di filtro (ID checklist o 'manuali')
    const [filterContextEdit, setFilterContextEdit] = useState('');
    // Stato per gli interventi filtrati specifici per la modalità modifica
    const [filteredInterventiEdit, setFilteredInterventiEdit] = useState([]);
    // -----------------------------------------
        // *** NUOVO STATO PER EXPORT PDF ***
        const [exportingPdf, setExportingPdf] = useState(false);
        const [exportError, setExportError] = useState(null); // Errore specifico per l'export

    useEffect(() => {
        // Logica esistente per popolare formData
        if (piano && !isEditing) {
            setFormData({
                titolo: piano.titolo || '',
                descrizione: piano.descrizione || '',
                stato: piano.stato || 'bozza',
                responsabile_piano: piano.responsabile_piano || '',
                data_inizio: piano.data_inizio ? new Date(piano.data_inizio) : null,
                data_fine_prevista: piano.data_fine_prevista ? new Date(piano.data_fine_prevista) : null,
                interventiSelezionati: piano.interventi?.map(inter => inter._id) || [],
            });
            setDetailError(null);

             // *** Determina il contesto di filtro iniziale quando si visualizza il dettaglio ***
             if (piano.origin === 'manuale') {
                setFilterContextEdit('manuali');
            } else if (piano.origin === 'suggerito_ai' && piano.checklist_id_origine) {
                setFilterContextEdit(piano.checklist_id_origine);
            } else {
                setFilterContextEdit(''); // Caso imprevisto o default
            }
             // ***********************************************************************************

            // Carica interventi disponibili solo se non già caricati
            if (availableInterventi.length === 0 && !loadingInterventi) {
                fetchAvailableInterventi();
            }
        }
    // Rimuoviamo loadingInterventi dalle dipendenze qui, fetchAvailableInterventi lo gestisce internamente
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [piano, isEditing]); // Tolto loadingInterventi

    // Funzione per caricare gli interventi disponibili (INVARIATA)
    const fetchAvailableInterventi = async () => {
        if (!loadingInterventi) {
             setLoadingInterventi(true);
             try {
                 const response = await axios.get('http://localhost:5001/api/interventions?select=titolo,area,priorita,origin,checklist_id_origine'); // Assicurati di avere origin e checklist_id_origine
                 setAvailableInterventi(response.data.data || []);
             } catch (err) { console.error("Errore caricamento interventi disponibili:", err); setAvailableInterventi([]); }
             finally { setLoadingInterventi(false); }
        }
    };

     // *** NUOVO useEffect per FILTRARE gli interventi disponibili in base al CONTESTO DEL PIANO ***
     useEffect(() => {
        console.log(`PianoAzioneDetail: Applico filtro interventi per contesto: ${filterContextEdit}`);
        let filtered = [];
        if (filterContextEdit === 'manuali') {
            // Mostra solo interventi manuali
            filtered = availableInterventi.filter(inter => inter.origin === 'manuale');
        } else if (filterContextEdit) {
            // Mostra interventi manuali OPPURE quelli generati dalla checklist specifica del piano
            filtered = availableInterventi.filter(inter =>
                inter.origin === 'manuale' || inter.checklist_id_origine === filterContextEdit
            );
        } else {
            // Se nessun contesto, non mostrare nulla o mostra tutti? Per sicurezza mostriamo nessuno.
            filtered = [];
        }
        setFilteredInterventiEdit(filtered);
        console.log(`PianoAzioneDetail: Interventi filtrati per edit: ${filtered.length}`);

        // Opzionale: Deseleziona interventi non più validi nel contesto attuale (se il contesto potesse cambiare)
        // const filteredIds = new Set(filtered.map(f => f._id));
        // setFormData(prev => ({
        //     ...prev,
        //     interventiSelezionati: prev.interventiSelezionati.filter(id => filteredIds.has(id))
        // }));

     }, [filterContextEdit, availableInterventi]); // Si attiva quando cambia il contesto o gli interventi disponibili

    

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (name, newValue) => {
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

        // --- NUOVO: Handler per cambio selezione interventi ---
        const handleInterventiChange = (event) => {
            const { target: { value } } = event;
            // value sarà un array di ID selezionati
            setFormData(prev => ({ ...prev, interventiSelezionati: typeof value === 'string' ? value.split(',') : value }));
        };
        // ----------------------------------------------------

    const handleToggleEdit = () => {
        if (isEditing) {
            // Se stavo modificando e clicco "Annulla", resetto il form ai dati originali del piano
            setFormData({
                titolo: piano.titolo || '',
                descrizione: piano.descrizione || '',
                stato: piano.stato || 'bozza',
                responsabile_piano: piano.responsabile_piano || '',
                data_inizio: piano.data_inizio ? new Date(piano.data_inizio) : null,
                data_fine_prevista: piano.data_fine_prevista ? new Date(piano.data_fine_prevista) : null,
                interventiSelezionati: piano.interventi?.map(inter => inter._id) || [], // Resetta anche gli interventi

            });
            setDetailError(null);
        } else {
            // Entrando in modifica, assicurati che gli interventi siano caricati
            if (availableInterventi.length === 0 && !loadingInterventi) {
                 fetchAvailableInterventi(); // Ricarica se vuoti
            }
            // Determina il contesto di filtro basato sul piano attuale
            if (piano.origin === 'manuale') {
                setFilterContextEdit('manuali');
            } else if (piano.origin === 'suggerito_ai' && piano.checklist_id_origine) {
                setFilterContextEdit(piano.checklist_id_origine);
            } else {
                 setFilterContextEdit(''); // Default o caso errore
            }
        }
       setIsEditing(!isEditing);
   };

    // Funzione interna che chiama la prop onSave
    const handleSaveChanges = () => {
        const dataToSubmit = {
            titolo: formData.titolo,
            descrizione: formData.descrizione,
            stato: formData.stato,
            responsabile_piano: formData.responsabile_piano,
            data_inizio: formData.data_inizio instanceof Date && !isNaN(formData.data_inizio)
                ? formData.data_inizio.toISOString().split('T')[0] : null,
            data_fine_prevista: formData.data_fine_prevista instanceof Date && !isNaN(formData.data_fine_prevista)
                ? formData.data_fine_prevista.toISOString().split('T')[0] : null,
            // --- NUOVO: Includi interventiSelezionati ---
            interventi: formData.interventiSelezionati
            // -----------------------------------------
        };
        // Chiama la prop onSave passata da PianoAzionePage
        onSave(piano._id, dataToSubmit) // USA la prop onSave
            .then(() => {
                setIsEditing(false);
                setDetailError(null);
            })
            .catch((err) => {
                setDetailError(err.message || "Errore durante il salvataggio.");
            });
    };

     // Calcolo Progresso Locale
     const calculateLocalProgress = () => {
         if (!piano || !piano.interventi || piano.interventi.length === 0) return 0;
         const totalPerc = piano.interventi.reduce((sum, i) => sum + (i.completamento_perc ?? 0), 0);
         return Math.round(totalPerc / piano.interventi.length);
     };
     const progress = calculateLocalProgress();

         // *** NUOVA FUNZIONE HANDLER PER EXPORT PDF PIANO ***
    const handleExportPlanPDF = async () => {
        if (!piano?._id) return;
        setExportingPdf(true);
        setExportError(null); // Resetta errore export precedente
        let fileURL = null;
        console.log(`Avvio export PDF per Piano ID: ${piano._id}`);
        try {
            const response = await axios.post(
                `http://localhost:5001/api/export/action-plan/${piano._id}/pdf`,
                {},
                { timeout: 90000 } // Timeout aumentato
            );
            const { fileName, pdfBase64, mimeType } = response.data;
            if (!pdfBase64 || !fileName || !mimeType) throw new Error("Dati PDF Base64 non validi ricevuti.");

            // Logica conversione Base64 -> Blob -> Download Link (identica a ReportPage)
            const byteCharacters = atob(pdfBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
            const byteArray = new Uint8Array(byteNumbers);
            const fileBlob = new Blob([byteArray], { type: mimeType });

            if (fileBlob.size === 0) throw new Error("File PDF generato è vuoto.");

            fileURL = URL.createObjectURL(fileBlob);
            const link = document.createElement('a');
            link.href = fileURL;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            if (link.parentNode) link.parentNode.removeChild(link);
            console.log(`Download del file "${fileName}" avviato.`);

        } catch (error) {
            console.error("Errore Export PDF Piano:", error);
            const errorMsg = error.response?.data?.message || error.message || 'Errore durante la generazione/download del PDF del piano.';
            setExportError(errorMsg); // Imposta errore specifico per l'export
        } finally {
            if (fileURL) URL.revokeObjectURL(fileURL);
            setExportingPdf(false);
            console.log("Export PDF Piano terminato (client).");
        }
    };
    // *** FINE NUOVA FUNZIONE ***

    if (!piano) return <Alert severity="warning">Dati piano non disponibili.</Alert>;

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}> {/* Modificato alignItems */}
                 <Typography variant="h5">
                     {isEditing ? 'Modifica Piano:' : 'Dettaglio Piano:'} {formData.titolo || piano.titolo}
                 </Typography>
                 {/* --- Stack per Bottoni Azione --- */}
                 <Stack direction="row" spacing={1}>
                     <Button variant="outlined" onClick={onBack} disabled={isLoading || isEditing || exportingPdf}>Torna Lista</Button>
                     <Button variant={isEditing ? "outlined" : "contained"} onClick={handleToggleEdit} disabled={isLoading || exportingPdf}>
                         {isEditing ? "Annulla Modifica" : "Modifica"}
                     </Button>
                      {isEditing && (
                          <Button variant="contained" color="primary" onClick={handleSaveChanges} disabled={isLoading || exportingPdf}>
                              {isLoading ? <CircularProgress size={24}/> : "Salva"}
                          </Button>
                      )}
                     {/* *** NUOVO BOTTONE EXPORT PDF *** */}
                     {!isEditing && ( // Mostra solo in modalità visualizzazione
                         <Tooltip title="Esporta questo Piano d'Azione in formato PDF">
                             <span> {/* Wrapper per Tooltip */}
                                 <Button
                                     variant="contained"
                                     color="success" // O altro colore
                                     startIcon={exportingPdf ? <CircularProgress size={16} color="inherit"/> : <PictureAsPdfIcon />}
                                     onClick={handleExportPlanPDF}
                                     disabled={exportingPdf || isLoading}
                                     size="medium" // O 'small'
                                 >
                                     {exportingPdf ? 'Esporto...' : 'PDF'}
                                 </Button>
                             </span>
                         </Tooltip>
                     )}
                     {/* ******************************* */}
                 </Stack>
                 {/* --- Fine Stack Bottoni --- */}
             </Box>

             {/* Mostra errori (incluso quello di export) */}
             {detailError && <Alert severity="error" sx={{ mb: 2 }}>{detailError}</Alert>}
             {exportError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setExportError(null)}>{exportError}</Alert>}
             {/* ... (successMessage globale se necessario) ... */}

             {/* ... Resto del form/visualizzazione (Grid, DatePicker, Select Interventi, Tabella) ... */}
             {/* Nessuna modifica necessaria qui dentro per l'export */}

<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
     <Grid container spacing={2}>
                 {/* Riga 1: Titolo, Stato, Progresso */}
                 <Grid item xs={12} md={6}>
                     <TextField
                         label="Titolo Piano" name="titolo" value={formData.titolo}
                         onChange={handleInputChange} fullWidth size="small"
                         required
                         InputProps={{ readOnly: !isEditing }}
                         variant={isEditing ? "outlined" : "standard"}
                         // Aggiungi InputLabelProps per forzare lo shrink se c'è valore
                         InputLabelProps={{ shrink: !!formData.titolo }}
                     />
                 </Grid>
                 <Grid item xs={12} sm={6} md={3}>
                     {isEditing ? (
                         <FormControl fullWidth size="small">
                             <InputLabel id="stato-piano-label">Stato Piano</InputLabel>
                             <Select
                                 labelId="stato-piano-label" name="stato" value={formData.stato}
                                 label="Stato Piano" onChange={handleInputChange}
                             >
                                 <MenuItem value="bozza">Bozza</MenuItem>
                                 <MenuItem value="approvato">Approvato</MenuItem>
                                 <MenuItem value="in_corso">In Corso</MenuItem>
                                 <MenuItem value="completato">Completato</MenuItem>
                                 <MenuItem value="annullato">Annullato</MenuItem>
                             </Select>
                         </FormControl>
                     ) : (
                         <TextField
                             label="Stato Piano" value={getStatusLabel(formData.stato)}
                             fullWidth size="small" InputProps={{ readOnly: true }} variant="standard"
                         />
                     )}
                 </Grid>
                 <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" display="block">Progresso Complessivo</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                         <Box sx={{ width: '100%', mr: 1 }}>
                             <LinearProgress variant="determinate" value={progress} color={progress === 100 ? 'success' : 'primary'}/>
                         </Box>
                         <Box sx={{ minWidth: 35 }}>
                             <Typography variant="body2" color="text.secondary">{`${progress}%`}</Typography>
                         </Box>
                     </Box>
                 </Grid>

                 {/* Riga 2: Descrizione */}
                 <Grid item xs={12}>
                     <TextField
                         label="Descrizione/Obiettivi" name="descrizione" value={formData.descrizione}
                         onChange={handleInputChange} fullWidth multiline rows={isEditing ? 3 : 1} size="small"
                         InputProps={{ readOnly: !isEditing }}
                         variant={isEditing ? "outlined" : "standard"}
                         // Aggiungi InputLabelProps per forzare lo shrink se c'è valore
                         InputLabelProps={{ shrink: !!formData.descrizione }}
                     />
                 </Grid>

                  {/* Riga 3: Responsabile, Date */}
                  <Grid item xs={12} md={4}>
                     <TextField
                         label="Responsabile Piano" name="responsabile_piano" value={formData.responsabile_piano}
                         onChange={handleInputChange} fullWidth size="small"
                         InputProps={{ readOnly: !isEditing }}
                         variant={isEditing ? "outlined" : "standard"}
                         // Aggiungi InputLabelProps per forzare lo shrink se c'è valore
                         InputLabelProps={{ shrink: !!formData.responsabile_piano }}
                     />
                 </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                     <DatePicker
                         label="Data Inizio" value={formData.data_inizio}
                         onChange={(newValue) => handleDateChange('data_inizio', newValue)}
                         readOnly={!isEditing}
                         slots={{ textField: (params) => <TextField {...params} fullWidth size="small" variant={isEditing ? "outlined" : "standard"}/> }}
                     />
                 </Grid>
                 <Grid item xs={12} sm={6} md={4}>
                     <DatePicker
                         label="Data Fine Prevista" value={formData.data_fine_prevista}
                         onChange={(newValue) => handleDateChange('data_fine_prevista', newValue)}
                         readOnly={!isEditing}
                         slots={{ textField: (params) => <TextField {...params} fullWidth size="small" variant={isEditing ? "outlined" : "standard"}/> }}
                     />
                 </Grid>
                   {/* --- MODIFICA: Select Interventi (solo in modifica) --- */}
                   {isEditing && (
                        <Grid item xs={12}>
                             {/* Mostra a quale checklist fa riferimento il piano (se AI) */}
                             {filterContextEdit && filterContextEdit !== 'manuali' && (
                                <Typography variant="caption" display="block" sx={{ mb: 1, fontStyle: 'italic' }}>
                                    Filtro interventi basato su Checklist: {checklistsCompletate.find(c => c._id === filterContextEdit)?.nome ?? filterContextEdit}
                                </Typography>
                             )}
                             {filterContextEdit === 'manuali' && (
                                 <Typography variant="caption" display="block" sx={{ mb: 1, fontStyle: 'italic' }}>
                                     Mostrando solo interventi creati manualmente.
                                 </Typography>
                             )}
                            <FormControl fullWidth disabled={loadingInterventi || isLoading}>
                                <InputLabel id="interventi-select-detail-label">Interventi Associati al Piano</InputLabel>
                                <Select
                                    labelId="interventi-select-detail-label"
                                    label="Interventi Associati al Piano"
                                    multiple
                                    value={formData.interventiSelezionati}
                                    onChange={handleInterventiChange}
                                    renderValue={(selected) => selected.length > 0 ? `${selected.length} interventi selezionati` : <em>Nessun intervento selezionato</em>}
                                >
                                    {/* *** USA GLI INTERVENTI FILTRATI *** */}
                                    {loadingInterventi && <MenuItem disabled>Caricamento interventi...</MenuItem>}
                                    {!loadingInterventi && filteredInterventiEdit.length === 0 && <MenuItem disabled>Nessun intervento disponibile per questo contesto.</MenuItem>}
                                    {filteredInterventiEdit.map((inter) => (
                                        <MenuItem key={inter._id} value={inter._id}>
                                            <Checkbox checked={formData.interventiSelezionati.indexOf(inter._id) > -1} />
                                            <ListItemText primary={inter.titolo} secondary={`Origine: ${inter.origin === 'manuale' ? 'Manuale' : 'AI'} - Area: ${getAreaLabel(inter.area)}`} />
                                        </MenuItem>
                                    ))}
                                    {/* *********************************** */}
                                </Select>
                            </FormControl>
                        </Grid>
                     )}
                    {/* --- FINE Select Interventi --- */}

                </Grid>
            </LocalizationProvider>

             <Divider sx={{ my: 3 }}/>

<Typography variant="h6" gutterBottom>Interventi Inclusi ({piano.interventi?.length || 0})</Typography>
<TableContainer component={Paper} sx={{ mt: 1, maxHeight: 400, overflow: 'auto' }}>
    <Table size="small" stickyHeader>
        <TableHead>
            <TableRow>
                <TableCell>Titolo Intervento</TableCell>
                <TableCell>Area</TableCell>
                <TableCell>Priorità</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>% Compl.</TableCell>
                <TableCell align="right">Azioni</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {!piano.interventi || piano.interventi.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">Nessun intervento associato.</TableCell></TableRow>
            ) : (
                piano.interventi.map(inter => (
                    <TableRow key={inter._id} hover>
                        <TableCell>{inter.titolo}</TableCell>
                        {/* USA LE FUNZIONI UTILITY DEFINITE PRIMA */}
                        <TableCell>{getAreaLabel(inter.area)}</TableCell>
                        <TableCell><Chip label={getPriorityLabel(inter.priorita)} color={getPriorityColor(inter.priorita)} size="small"/></TableCell>
                        <TableCell><Chip label={getStatusLabel(inter.stato)} color={getStatusColor(inter.stato)} size="small"/></TableCell>
                        <TableCell align="center">{inter.completamento_perc ?? 0}%</TableCell>
                        <TableCell align="right" padding="none">
                             {/* USA Tooltip CORRETTAMENTE */}
                            <Tooltip title="Visualizza dettaglio intervento (non attivo)">
                                <IconButton size="small" component={RouterLink} to={`/progettazione/interventi`} state={{ /* pass something? */ }}>
                                     <VisibilityIcon fontSize="inherit"/>
                                 </IconButton>
                            </Tooltip>
                         </TableCell>
                    </TableRow>
                ))
            )}
        </TableBody>
    </Table>
</TableContainer>
</Paper>
);
};


// --- Componente Principale PianoAzionePage ---
const PianoAzionePage = () => {
    // Stati esistenti
    const [piani, setPiani] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedPianoToDelete, setSelectedPianoToDelete] = useState(null);
    const [showNewForm, setShowNewForm] = useState(false);
    const [showDetailView, setShowDetailView] = useState(false);
    const [selectedPianoDetail, setSelectedPianoDetail] = useState(null);



    // --- NUOVI STATI PER SUGGERIMENTI ---
    const [checklistsCompletate, setChecklistsCompletate] = useState([]);
    const [selectedChecklistSuggest, setSelectedChecklistSuggest] = useState('');
    const [loadingChecklists, setLoadingChecklists] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [errorSuggestions, setErrorSuggestions] = useState(null);
    const [interventiSuggeriti, setInterventiSuggeriti] = useState([]);
    // --- FINE NUOVI STATI ---
  // --- NUOVO STATO PER FILTRO LISTA ---
  const [selectedPlanOriginFilter, setSelectedPlanOriginFilter] = useState('');
  // ------------------------------------


    // Stato per salvare i progressi calcolati per ogni piano nella lista
    const [pianiProgress, setPianiProgress] = useState({}); // Oggetto { pianoId: progresso }

    const fetchPiani = useCallback(async () => {
        // Reset stati
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        setPianiProgress({});
        setPiani([]); // Svuota la lista *prima* della chiamata
    
        // Se non c'è filtro selezionato, non fare la chiamata
        if (!selectedPlanOriginFilter) {
            console.log(">>> Fetch piani saltata: nessuna origine selezionata.");
            setLoading(false);
            return;
        }
    
        try {
            // Costruisci i parametri INCLUDENDO il filtro selezionato
            const params = {
                checklist_id: selectedPlanOriginFilter, // Nome del parametro atteso dal backend
                // Rimuovi select da qui, la lista base è sufficiente
                // select: 'titolo,cliente.nome,stato,data_creazione,origin,checklist_id_origine'
            };

            // Aggiungere altri filtri se necessario:
            // if (filters.stato) params.stato = filters.stato;
    
            console.log(">>> Fetching piani con params:", params); // Verifica che params ora contenga checklist_id
    
            // Passa l'oggetto params alla chiamata axios
            const response = await axios.get('http://localhost:5001/api/action-plan', { params });
            // *** FINE CORREZIONE ***
    
            const fetchedPiani = response.data.data || [];
            console.log(`Piani caricati: ${fetchedPiani.length}`, fetchedPiani); // Logga anche i dati
            setPiani(fetchedPiani);

            // Calcola progressi (temporaneamente commentato se la route dettaglio non funziona)
            // Se la route GET /:id non è pronta, commenta la riga seguente per evitare errori 404
            // Altrimenti, lasciala attiva se hai implementato la route dettaglio nel backend
// Calcolo progressi (assicurati che la route GET /:id funzioni nel backend)
if (fetchedPiani.length > 0) {
    console.log(">>> Avvio calcolo progressi...");
    await calculateAllPianiProgress(fetchedPiani);
     console.log(">>> Calcolo progressi terminato.");
}
    
} catch (err) {
    console.error("Errore fetchPiani:", err);
    setError(err.response?.data?.message || 'Errore recupero piani.');
    // setPiani([]); // Già svuotati all'inizio del try
} finally {
    setLoading(false);
    console.log(">>> fetchPiani terminata.");
}
// *** CORREZIONE DIPENDENZA: Dipende DIRETTAMENTE dallo stato del filtro ***
}, [selectedPlanOriginFilter]); // Rimuovi altre dipendenze non necessarie qui

    // useEffect che triggera il fetch quando il filtro cambia
    useEffect(() => {
        // Questo useEffect ora serve solo a chiamare fetchPiani quando la sua dipendenza (selectedPlanOriginFilter) cambia.
        // Il useCallback si occupa di ricreare fetchPiani solo quando selectedPlanOriginFilter cambia.
        console.log(`>>> useEffect[selectedPlanOriginFilter] cambiato, chiamo fetchPiani.`);
        fetchPiani();
    }, [fetchPiani]); // La dipendenza qui è la funzione callback stessa

    // --- NUOVO: Carica Checklist Completate (per dropdown suggerimenti e FILTRO) ---
    useEffect(() => {
        const fetchCompletedChecklists = async () => {
            setLoadingChecklists(true);
            try {
                // Prendiamo anche _id per usarlo come value nel Select del filtro
                const response = await axios.get('http://localhost:5001/api/checklist?select=nome,cliente.nome,_id,stato');
                const completed = response.data.data?.filter(cl => cl.stato === 'completata') || [];
                setChecklistsCompletate(completed);
                console.log("Checklist completate caricate per filtro:", completed.length);
            } catch (err) { console.error("Errore caricamento checklist completate:", err); }
             finally { setLoadingChecklists(false); }
        };
        fetchCompletedChecklists();
     }, []); // Eseguito solo al mount


    // --- NUOVA FUNZIONE: Calcola Progresso per tutti i Piani ---
    const calculateAllPianiProgress = async (pianiList) => {
        const progressMap = {};
        // Potremmo fare chiamate API per ogni piano per avere gli interventi popolati,
        // ma è inefficiente. Per ora, assumiamo che la chiamata iniziale dia almeno gli ID.
        // Idealmente, il backend dovrebbe fornire una route che dia la lista con il progresso già calcolato.
        // **SOLUZIONE TEMPORANEA (non ideale): fare chiamate multiple**
        setLoading(true); // Riattiva loading per questa fase
        try {
            const progressPromises = pianiList.map(async (piano) => {
                try {
                    // Chiamata per ottenere i dettagli (inclusi interventi popolati)
                    const detailResponse = await axios.get(`http://localhost:5001/api/action-plan/${piano._id}`);
                    const pianoDetail = detailResponse.data.data;
                    if (pianoDetail && pianoDetail.interventi && pianoDetail.interventi.length > 0) {
                        const totalPerc = pianoDetail.interventi.reduce((sum, i) => sum + (i.completamento_perc ?? 0), 0);
                        progressMap[piano._id] = Math.round(totalPerc / pianoDetail.interventi.length);
                    } else {
                        progressMap[piano._id] = 0; // Nessun intervento o 0 interventi
                    }
                } catch (detailErr) {
                    console.error(`Errore caricamento dettagli per piano ${piano._id} per calcolo progresso:`, detailErr);
                    progressMap[piano._id] = -1; // Indica errore
                }
            });
            await Promise.all(progressPromises);
            setPianiProgress(progressMap);
        } finally {
            setLoading(false);
        }
    };

    // --- NUOVO: Carica Checklist Completate (per dropdown suggerimenti) ---
     useEffect(() => {
        const fetchCompletedChecklists = async () => {
            setLoadingChecklists(true);
            try {
                const response = await axios.get('http://localhost:5001/api/checklist');
                const completed = response.data.data?.filter(cl => cl.stato === 'completata') || [];
                setChecklistsCompletate(completed);
            } catch (err) { console.error("Errore caricamento checklist completate:", err); }
             finally { setLoadingChecklists(false); }
        };
        // Carica solo se il form è visibile o se non ci sono suggerimenti?
        // Per ora carichiamo sempre all'inizio.
        fetchCompletedChecklists();
     }, []); // Eseguito solo al mount


 // --- GESTIONE ELIMINAZIONE ---

    /**
     * Apre il dialogo di conferma per l'eliminazione di un piano.
     * @param {object} piano L'oggetto piano da eliminare.
     */
// Definizione della funzione nel componente PianoAzionePage

const handleOpenDeleteDialog = (piano) => {
    console.log(">>> DEBUG: handleOpenDeleteDialog chiamata per:", piano?.titolo); // Log per debug
    setSelectedPianoToDelete(piano);
    setOpenDeleteDialog(true); // <-- Questa riga è cruciale!
};

    /**
     * Chiude il dialogo di conferma eliminazione.
     */
    const handleCloseDeleteDialog = () => {
        console.log("Chiusura dialogo eliminazione.");
        setOpenDeleteDialog(false);       // Imposta lo stato per chiudere il dialogo
        // Ritarda leggermente il reset del piano selezionato per evitare "flash" nel dialogo
        setTimeout(() => setSelectedPianoToDelete(null), 150);
    };

        // *** AGGIUNGI QUESTA FUNZIONE QUI ***
        const handlePlanOriginFilterChange = (event) => {
            console.log(`Filtro origine piano cambiato a: ${event.target.value}`);
            setSelectedPlanOriginFilter(event.target.value);
            // Resettare l'errore quando si cambia filtro è una buona pratica
            setError(null);
            setSuccessMessage(null);
        };
        // ***********************************

    /**
     * Esegue l'eliminazione effettiva del piano tramite chiamata API.
     * @param {string} id L'ID del piano da eliminare.
     */
    const handleDeletePiano = async (id) => {
        if (!id) {
            console.error("Tentativo di eliminazione senza ID valido.");
            setError("Impossibile eliminare: ID piano mancante.");
            return;
        }
        console.log(`Tentativo eliminazione piano con ID: ${id}`);

        // Attiva stato caricamento e resetta messaggi
        setLoading(true); // Potresti usare uno stato separato 'deleting' se preferisci
        setError(null);
        setSuccessMessage(null);

        try {
            // Chiamata API DELETE
            await axios.delete(`http://localhost:5001/api/action-plan/${id}`);

            setSuccessMessage('Piano d\'azione eliminato con successo.'); // Imposta messaggio successo
            handleCloseDeleteDialog(); // Chiudi il dialogo
            // Ricarica la lista dei piani aggiornata (SENZA cancellare il messaggio di successo)
            fetchPiani(false);

        } catch (err) {
            console.error('Errore eliminazione piano:', err);
            setError(err.response?.data?.message || 'Errore durante l\'eliminazione del piano.');
            setLoading(false); // Disattiva loading SOLO in caso di errore
            // Considera se chiudere il dialogo anche in caso di errore
            handleCloseDeleteDialog(); // Chiudiamo comunque
        }
        // 'finally' non serve qui perché fetchPiani() nel try gestirà setLoading(false)
    };

    // --- FINE GESTIONE ELIMINAZIONE ---




    const handleViewDetail = async (id) => {
        if (!id) return;
        console.log(`>>> handleViewDetail: Caricamento dettaglio per ID: ${id}`); // Debug
        setLoading(true); // Usa lo stato loading generale
        setError(null);
        setSelectedPianoDetail(null); // Resetta dettaglio precedente
        try {
            // Assicurati che l'URL sia corretto
            const response = await axios.get(`http://localhost:5001/api/action-plan/${id}`);
            console.log(`>>> handleViewDetail: Dati ricevuti:`, response.data); // Debug
            if (response.data && response.data.data) { // Controlla che i dati esistano
                setSelectedPianoDetail(response.data.data);
                setShowDetailView(true); // Mostra vista dettaglio
                setShowNewForm(false); // Nascondi form nuovo
            } else {
                throw new Error("Dati dettaglio piano non validi ricevuti dal server.");
            }
        } catch (err) {
            console.error(`>>> handleViewDetail: Errore:`, err); // Debug errore completo
            setError(err.response?.data?.message || err.message || 'Errore caricamento dettaglio piano.');
            setSelectedPianoDetail(null); // Assicura che non ci siano dati parziali
        } finally {
            setLoading(false);
        }
    };
    
    const handleBackToList = () => { setShowDetailView(false); setSelectedPianoDetail(null); fetchPiani(); /* Ricarica lista e progressi */ };

// Gestione Creazione (AGGIORNATO per passare ID checklist)
const handleShowNewForm = (suggestions = [], originatingChecklistId = null) => { // <-- Riceve ID
    setError(null); setErrorSuggestions(null); setSuccessMessage(null);
    setInterventiSuggeriti(suggestions);
    // Passa l'ID checklist quando apre il form
    setShowNewForm({ // Usiamo un oggetto per passare più info se serve
       visible: true,
       originatingChecklistId: originatingChecklistId // Memorizza l'ID
    });
    setShowDetailView(false);
};
const handleHideNewForm = () => {
    console.log("Annulla Creazione Piano - Nascondo form"); // Log per debug
    setShowNewForm({ visible: false, originatingChecklistId: null }); // Aggiorna stato visibilità
    setInterventiSuggeriti([]);
    setSelectedChecklistSuggest('');
    setError(null);
    setSuccessMessage(null);
};


 // Salva Nuovo Piano (come prima, ma i dati da salvare includono già l'ID se presente)
 const handleSaveNewPiano = async (dataToSave) => {
    setLoading(true); setError(null); setSuccessMessage(null);
    let successMsg = ''; // Variabile temporanea per il messaggio

    try {
         // 'checklistIdOrigine' è già dentro dataToSave se proveniva da suggerimenti
         const payload = {
             titolo: dataToSave.titolo,
             descrizione: dataToSave.descrizione,
             cliente: { nome: dataToSave.clienteNome },
             interventi: dataToSave.interventiSelezionati,
             checklistIdOrigine: dataToSave.checklistIdOrigine // Invia al backend
         };
         console.log(">>> Dati inviati per creare piano:", payload);
         const response = await axios.post('http://localhost:5001/api/action-plan', payload);
         successMsg = `Piano "${response.data.data.titolo}" creato.`; // Salva messaggio qui
         handleHideNewForm(); // Chiude il form
         await fetchPiani(true); // Ricarica la lista (passiamo true ora)
         // --- IMPOSTA IL MESSAGGIO DOPO IL FETCH ---
         setSuccessMessage(successMsg);
         // Opzionale: timeout per cancellare il messaggio
         // setTimeout(() => setSuccessMessage(null), 5000);
         // -----------------------------------------
     } catch (err) {
         let errorMessage = err.response?.data?.message || 'Errore creazione piano.';
         if (err.response?.data?.errors) { /* ... gestione errori validazione ... */ }
         setError(errorMessage);
         setLoading(false); // Interrompi loading solo su errore
     }
    // finally gestito da fetchPiani o catch
};



   // Gestione Generazione Suggerimenti (AGGIORNATO per passare ID a handleShowNewForm)
   const handleGenerateSuggestions = async () => {
    if (!selectedChecklistSuggest) return;
    setLoadingSuggestions(true); setErrorSuggestions(null); setInterventiSuggeriti([]);
    try {
        const response = await axios.post('http://localhost:5001/api/action-plan/suggest', { checklistId: selectedChecklistSuggest });
        const suggestions = response.data.data || [];
        // --- MODIFICA: Passa ID checklist selezionata ---
        handleShowNewForm(suggestions, selectedChecklistSuggest);
        // ----------------------------------------------
    } catch (err) { 
            console.error("Errore generazione suggerimenti:", err);
            setErrorSuggestions(err.response?.data?.message || "Errore nel generare i suggerimenti.");
        } finally {
            setLoadingSuggestions(false);
        }
    };
    // --- FINE NUOVA GESTIONE ---


    // --- Handler salvataggio modifiche dal dettaglio (CORRETTO) ---
    // Questa è la funzione che viene passata come prop 'onSave' a PianoAzioneDetail
    const handleSaveDetailChanges = useCallback(async (pianoId, updatedData) => {
        console.log("Salvataggio Modifiche Dettaglio Piano:", pianoId, updatedData);
        setLoading(true); // Usa lo stato loading principale
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await axios.put(`http://localhost:5001/api/action-plan/${pianoId}`, updatedData);
            setSelectedPianoDetail(response.data.data);
             setSuccessMessage("Modifiche al piano salvate.");
             // Non chiamare fetchPiani() qui se la lista non deve cambiare
             // In alternativa, ricalcola solo il progresso per il piano modificato
             console.log("Modifica salvata, il progresso verrà ricalcolato al prossimo fetch completo o ricaricamento.")
        } catch(err) {
            console.error("Errore salvataggio modifiche piano:", err); // Logga l'errore
            const errorMsg = err.response?.data?.message || 'Errore salvataggio modifiche piano.';
            setError(errorMsg); // Imposta l'errore nello stato principale
            setLoading(false); // Interrompi il caricamento qui in caso di errore
            throw new Error(errorMsg); // Rilancia l'errore per farlo gestire dal .catch in PianoAzioneDetail
        } finally {
            // Non impostare setLoading(false) qui se fetchPiani() lo fa già
            // setLoading(false);
        }
   // Aggiungi fetchPiani come dipendenza se lo chiami dentro
   }, [fetchPiani]); // Dipende da fetchPiani

    // --- RENDER (invariato rispetto a prima, ma ora le funzioni utility sono definite sopra) ---
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
        <Box>
            {showNewForm ? (
                 <NewPianoForm
                 onSave={handleSaveNewPiano} // <-- DEVE ESSERE PASSATO handleSaveNewPiano
                 onCancel={handleHideNewForm} // <-- DEVE ESSERE PASSATO handleHideNewForm
                 isLoading={loading}
                 apiError={error}
                 apiSuccess={successMessage}
                 interventiSuggeriti={interventiSuggeriti}
                 originatingChecklistId={showNewForm.originatingChecklistId} // <-- Passa l'ID
                 checklistsCompletate={checklistsCompletate} // <-- Passa le checklist caricate
             />    
                    ) : showDetailView ? (
                // Passa l'handler CORRETTO
                <PianoAzioneDetail
                    piano={selectedPianoDetail}
                    onBack={handleBackToList}
                    isLoading={loading}
                    onSave={handleSaveDetailChanges} // Passa la funzione corretta
                    checklistsCompletate={checklistsCompletate}

                />
             ) : (
                 <>
                    {/* Sezione Generazione Suggerimenti */}
                    <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.lighter', border: '1px solid primary.light' }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                           <AutoFixHighIcon sx={{ mr: 1 }}/> Genera Bozza Piano d'Azione (AI)
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={8}>
                                <FormControl fullWidth size="small" disabled={loadingChecklists || loadingSuggestions}>
                                    <InputLabel id="checklist-suggest-label">Seleziona Checklist Completata</InputLabel>
                                    <Select
                                        labelId="checklist-suggest-label"
                                        value={selectedChecklistSuggest}
                                        label="Seleziona Checklist Completata"
                                        onChange={(e) => { setSelectedChecklistSuggest(e.target.value); setErrorSuggestions(null); }} // Pulisce errore al cambio
                                    >
                                        <MenuItem value=""><em>Seleziona...</em></MenuItem>
                                        {loadingChecklists && <MenuItem value="" disabled>Caricamento...</MenuItem>}
                                        {!loadingChecklists && checklistsCompletate.length === 0 && <MenuItem value="" disabled>Nessuna checklist completata disponibile.</MenuItem>}
                                        {checklistsCompletate.map((cl) => (
                                            <MenuItem key={cl._id} value={cl._id}>{cl.nome} ({cl.cliente?.nome})</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    fullWidth
                                    onClick={handleGenerateSuggestions}
                                    disabled={!selectedChecklistSuggest || loadingSuggestions || loadingChecklists}
                                    startIcon={loadingSuggestions ? <CircularProgress size={16} color="inherit"/> : null}
                                >
                                    {loadingSuggestions ? 'Genero...' : 'Genera Suggerimenti'}
                                </Button>
                            </Grid>
                        </Grid>
                        {errorSuggestions && <Alert severity="error" sx={{mt: 2}}>{errorSuggestions}</Alert>}
                    </Paper>

                      {/* NUOVO: Filtro Origine Piano */}
                      <Paper sx={{ p: 2, mb: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                             <Grid item xs={12} md={6}> {/* Aumentato spazio */}
                                 <FormControl fullWidth size="small" disabled={loadingChecklists || loading}>
                                     <InputLabel id="plan-origin-filter-label">Filtra Piani per Origine</InputLabel>
                                     <Select
                                         labelId="plan-origin-filter-label"
                                         value={selectedPlanOriginFilter} // Usa il nuovo stato
                                         label="Filtra Piani per Origine"
                                         onChange={handlePlanOriginFilterChange} // Usa il nuovo handler
                                     >
                                         <MenuItem value=""><em>-- Seleziona Origine --</em></MenuItem>
                                         <MenuItem value="tutti_ai">Tutti Suggeriti da AI</MenuItem>
                                         <MenuItem value="manuali">Solo Creati Manualmente</MenuItem>
                                         <Divider />
                                         <ListSubheader>Da Checklist Specifica:</ListSubheader> {/* Opzionale: intestazione */}
                                         {loadingChecklists && <MenuItem disabled>Caricamento checklist...</MenuItem>}
                                         {checklistsCompletate.map((cl) => ( // Usa checklistsCompletate
                                             <MenuItem key={cl._id} value={cl._id}>{cl.nome} ({cl.cliente?.nome ?? 'N/D'})</MenuItem>
                                         ))}
                                     </Select>
                                 </FormControl>
                             </Grid>
                             {/* Aggiungere altri filtri (stato, cliente?) se necessario */}
                        </Grid>
                    </Paper>

                    {/* Lista Piani Esistenti */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                         <Typography variant="h5">Piani d'Azione Esistenti</Typography>
                         <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleShowNewForm([], null)}> Nuovo Piano Manuale </Button> {/* Passa null come ID checklist */}
                    </Box>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
                    <Paper sx={{ p: 3, mb: 4 }}>
                        {loading && piani.length === 0 ? (<Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Titolo Piano</TableCell>
                                            <TableCell>Cliente</TableCell>
                                            <TableCell>Stato</TableCell>
                                            {/* NUOVA COLONNA PROGRESSO */}
                                            <TableCell>Progresso (%)</TableCell>
                                            <TableCell>Data Creazione</TableCell>
                                            <TableCell align="right">Azioni</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
 {/* --- AGGIORNA Messaggio No Data --- */}
 {piani.length === 0 && selectedPlanOriginFilter === '' && (
                                            <TableRow><TableCell colSpan={5} align="center">Seleziona un'origine per visualizzare i piani.</TableCell></TableRow>
                                        )}
                                        {piani.length === 0 && selectedPlanOriginFilter !== '' && !loading && (
                                            <TableRow><TableCell colSpan={5} align="center">Nessun piano trovato per l'origine selezionata.</TableCell></TableRow>
                                        )}
                                        {/* --- FINE AGGIORNAMENTO --- */}                                        {piani.map((p) => {
                                            const progress = pianiProgress[p._id]; // Recupera progresso calcolato
                                            return (
                                                <TableRow key={p._id} hover>
                                                    <TableCell>{p.titolo}</TableCell>
                                                    <TableCell>{p.cliente?.nome ?? 'N/D'}</TableCell>
                                                    <TableCell><Chip label={getStatusLabel(p.stato)} color={getStatusColor(p.stato)} size="small"/></TableCell>
                                                    {/* VISUALIZZAZIONE PROGRESSO */}
                                                    <TableCell>
                                                        {progress === undefined || loading ? ( // Mostra loading o trattino se non ancora calcolato
                                                            <CircularProgress size={16} thickness={5}/>
                                                        ) : progress === -1 ? (
                                                            <Tooltip title="Errore calcolo progresso"><Chip label="Errore" size="small" color="error" /></Tooltip>
                                                        ) : (
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Box sx={{ width: '100%', mr: 1 }}>
                                                                    <LinearProgress variant="determinate" value={progress} color={progress === 100 ? 'success' : 'primary'}/>
                                                                </Box>
                                                                <Box sx={{ minWidth: 35 }}>
                                                                    <Typography variant="body2" color="text.secondary">{`${progress}%`}</Typography>
                                                                </Box>
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{new Date(p.data_creazione).toLocaleDateString('it-IT')}</TableCell>
                                                    <TableCell padding="none" align="right">
                                                        <IconButton size="small" title="Dettaglio/Modifica" onClick={() => handleViewDetail(p._id)}><VisibilityIcon fontSize="inherit"/></IconButton>
                                                        <IconButton size="small" title="Elimina" onClick={() => handleOpenDeleteDialog(p)}><DeleteIcon fontSize="inherit"/></IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                         )}
                    </Paper>

                 </>
             )}
                         {/* === IL DIALOGO VA POSIZIONATO QUI, FUORI DALLE CONDIZIONI === */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
            {/* === ASSICURATI CHE open={openDeleteDialog} SIA CORRETTO === */}
                <DialogTitle>Conferma Eliminazione</DialogTitle>
                <DialogContent>
                    {/* Mostra il nome solo se selectedPianoToDelete è valido */}
                    <Typography>Sei sicuro di voler eliminare il piano "{selectedPianoToDelete?.titolo ?? 'selezionato'}"?</Typography>
                </DialogContent>
                <DialogActions>
                    {/* CORRETTO: Usa handleCloseDeleteDialog e lo stato 'loading' */}
                    <Button variant="outlined" onClick={handleCloseDeleteDialog} disabled={loading}>
                        Annulla
                    </Button>
                    <Button onClick={() => handleDeletePiano(selectedPianoToDelete?._id)} color="error" disabled={loading}>
                        {loading ? <CircularProgress size={20}/> : 'Elimina'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* === FINE DIALOGO === */}
        </Box>
        </LocalizationProvider>

    );
};

export default PianoAzionePage;

// END OF FILE client/src/pages/progettazione/PianoAzionePage.js (AGGIORNATO con Suggerimenti AI)