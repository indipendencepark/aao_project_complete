// START OF FILE client/src/pages/diagnosi/ChecklistPage.js (AGGIORNATO con Messaggio Successo)

import React, { useState, useEffect } from 'react'; // useEffect è usato
import axios from 'axios';
import {
    Box, Typography, Paper, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, Tooltip // Aggiunto Tooltip se non c'era
} from '@mui/material';
// Icons
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FindInPageIcon from '@mui/icons-material/FindInPage'; // Per link Gap Analysis

// Componenti
import NuovaChecklist from './NuovaChecklist';
import CompilazioneChecklist from './CompilazioneChecklist';
import { Link as RouterLink } from 'react-router-dom';

// Funzioni Utility (definite qui o importate)
const getStatusColor = (status) => {
    switch (status) {
      case 'completata': return 'success';
      case 'in_corso': return 'primary';
      case 'bozza': default: return 'default';
    }
};
const getStatusLabel = (status) => {
    switch (status) {
      case 'completata': return 'Completata';
      case 'in_corso': return 'In Corso';
      case 'bozza': return 'Bozza';
      default: return status;
    }
};

const ChecklistPage = () => {
    // Stati Reali
    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null); // Stato per messaggio successo

    // Stati UI
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedChecklistToDelete, setSelectedChecklistToDelete] = useState(null);
    const [showNewChecklistForm, setShowNewChecklistForm] = useState(false);
    const [selectedChecklistToCompile, setSelectedChecklistToCompile] = useState(null);

    // Funzione per caricare le checklist
    // Accetta parametro opzionale per pulire i messaggi
    const fetchChecklists = async (clearMessages = true) => {
        setLoading(true);
        if (clearMessages) { // Cancella messaggi solo se richiesto
             setError(null);
             setSuccessMessage(null);
        }
        try {
            console.log(">>> ChecklistPage: Fetching checklists...");
            const response = await axios.get('http://localhost:5001/api/checklist');
            console.log(">>> ChecklistPage: Checklists received:", response.data.data);
            setChecklists(response.data.data || []);
        } catch (err) {
            console.error(">>> ChecklistPage: Errore fetchChecklists:", err);
            setError(err.response?.data?.message || 'Errore nel recupero delle checklist.');
            setChecklists([]); // Svuota in caso di errore
        } finally {
            setLoading(false);
            console.log(">>> ChecklistPage: fetchChecklists finished.");
        }
    };

    // Caricamento iniziale (pulisce i messaggi)
    useEffect(() => {
       fetchChecklists(true);
    }, []);

    // Gestione Dialogo Eliminazione
    const handleOpenDeleteDialog = (checklist) => { setSelectedChecklistToDelete(checklist); setOpenDeleteDialog(true); };
    const handleCloseDeleteDialog = () => { setOpenDeleteDialog(false); setSelectedChecklistToDelete(null); };
    const handleDeleteChecklist = async (id) => {
        if (!id) return;
        setLoading(true); setError(null); setSuccessMessage(null); // Pulisce messaggi prima di cancellare
        try {
            await axios.delete(`http://localhost:5001/api/checklist/${id}`);
            setSuccessMessage('Checklist eliminata con successo.'); // Messaggio temporaneo, verrà sovrascritto o sparirà col refresh
            fetchChecklists(false); // Ricarica senza cancellare subito il msg di successo (anche se è per delete)
        } catch (err) {
            console.error("Errore eliminazione checklist:", err);
            setError(err.response?.data?.message || 'Errore durante l\'eliminazione.');
        } finally {
            handleCloseDeleteDialog(); // Chiude il dialogo anche in caso di errore
            // Imposta il loading a false qui se non si chiama fetchChecklists in caso di errore
            // setLoading(false); // Se fetchChecklists non viene chiamato nel catch
        }
    };

    // Gestione Visualizzazione Form Nuova Checklist
    const handleShowNewForm = () => {
        setError(null); setSuccessMessage(null); // Pulisce messaggi quando si apre il form
        setShowNewChecklistForm(true);
        setSelectedChecklistToCompile(null);
    };
    const handleHideNewForm = () => { setShowNewChecklistForm(false); };

    // Callback da NuovaChecklist dopo salvataggio successo
    // Imposta il messaggio di successo e ricarica la lista senza cancellarlo
    const handleNewChecklistSuccess = (newChecklist) => {
        setSuccessMessage(`Checklist "${newChecklist.nome}" creata con successo!`); // Imposta messaggio
        setShowNewChecklistForm(false); // Chiude il form
        fetchChecklists(false); // Ricarica lista SENZA cancellare il messaggio
        // Opzionale: cancellare il messaggio dopo N secondi
        // setTimeout(() => setSuccessMessage(null), 5000);
    };

    // Callback da CompilazioneChecklist per tornare alla lista
    const handleBackFromCompile = () => {
        setSelectedChecklistToCompile(null);
        setError(null); // Pulisce eventuali errori della compilazione
        setSuccessMessage(null); // Pulisce messaggi successo precedenti
        fetchChecklists(true); // Ricarica lista e pulisce messaggi
    };

    return (
        <Box>
            {selectedChecklistToCompile ? (
                // Mostra Compilazione
                <CompilazioneChecklist
                    checklistId={selectedChecklistToCompile}
                    onBackToList={handleBackFromCompile}
                />
            ) : showNewChecklistForm ? (
                // Mostra Form Nuova Checklist
                <>
                    <Button variant="outlined" onClick={handleHideNewForm} sx={{ mb: 2 }}> Torna alla Lista </Button>
                    <NuovaChecklist
                        onSaveSuccess={handleNewChecklistSuccess} // Passa la callback aggiornata
                        onCancel={handleHideNewForm}
                    />
                </>
            ) : (
                // Vista Lista Checklist
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5"> Check-list di Valutazione </Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleShowNewForm} > Nuova Checklist </Button>
                    </Box>

                    {/* Visualizza alert errore o successo */}
                    {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
                    {successMessage && <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 2 }}>{successMessage}</Alert>}

                    <Paper sx={{ p: 3, mb: 4 }}>
                        <Typography variant="body1" paragraph> Elenco delle checklist create per la valutazione degli assetti. </Typography>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                                            <TableCell>Nome Checklist</TableCell>
                                            <TableCell>Cliente</TableCell>
                                            <TableCell>Data Creazione</TableCell>
                                            <TableCell>Stato</TableCell>
                                            <TableCell align="right">Azioni</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {checklists.length === 0 && (
                                          <TableRow><TableCell colSpan={5} align="center">Nessuna checklist trovata.</TableCell></TableRow>
                                      )}
                                      {checklists.map((checklist) => (
                                          <TableRow key={checklist._id} hover>
                                              <TableCell>{checklist.nome}</TableCell>
                                              <TableCell>{checklist.cliente?.nome ?? 'N/D'}</TableCell>
                                              <TableCell>{new Date(checklist.data_creazione).toLocaleDateString('it-IT')}</TableCell>
                                              <TableCell>
                                                  <Chip label={getStatusLabel(checklist.stato)} color={getStatusColor(checklist.stato)} size="small" />
                                              </TableCell>
                                              <TableCell padding="none" align="right">
                                                  <Tooltip title="Visualizza/Compila">
                                                      <IconButton size="small" color="primary" onClick={() => { setSuccessMessage(null); setError(null); setSelectedChecklistToCompile(checklist._id); } }>
                                                          <VisibilityIcon fontSize='inherit'/>
                                                      </IconButton>
                                                  </Tooltip>
                                                  {checklist.stato === 'completata' && (
                                                      <Tooltip title="Analizza Gap Rilevati">
                                                          <IconButton size="small" color="secondary" component={RouterLink} to={`/diagnosi/gap-analysis?checklist_id=${checklist._id}`}>
                                                              <FindInPageIcon fontSize='inherit'/>
                                                          </IconButton>
                                                      </Tooltip>
                                                  )}
                                                  <Tooltip title="Modifica Info (Non attivo)">
                                                      <span> <IconButton size="small" color="default" disabled><EditIcon fontSize='inherit'/></IconButton> </span>
                                                  </Tooltip>
                                                  <Tooltip title="Elimina Checklist">
                                                      <IconButton size="small" color="error" onClick={() => handleOpenDeleteDialog(checklist)}><DeleteIcon fontSize='inherit'/></IconButton>
                                                  </Tooltip>
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>

                    {/* Dialogo Conferma Eliminazione */}
                    <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                        <DialogTitle>Conferma Eliminazione</DialogTitle>
                        <DialogContent>
                            <Typography>Sei sicuro di voler eliminare la checklist "{selectedChecklistToDelete?.nome}"?</Typography>
                            <Typography color="error" variant="body2" sx={{ mt: 1 }}>Questa azione non può essere annullata.</Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDeleteDialog}>Annulla</Button>
                            <Button onClick={() => handleDeleteChecklist(selectedChecklistToDelete?._id)} color="error" disabled={loading}> {loading ? <CircularProgress size={20}/> : 'Elimina'} </Button>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </Box>
    );
};

export default ChecklistPage;

// END OF FILE client/src/pages/diagnosi/ChecklistPage.js (AGGIORNATO con Messaggio Successo)