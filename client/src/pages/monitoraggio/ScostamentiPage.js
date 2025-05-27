import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, Alert, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
    InputLabel, Select, MenuItem, Tabs, Tab
} from '@mui/material';
import { Bar } from 'react-chartjs-2'; // Usiamo solo Bar qui per i grafici
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';

import DeleteIcon from '@mui/icons-material/Delete';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AnalyticsIcon from '@mui/icons-material/Analytics';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
);

const kpiData = [
  { id: '1', nome: 'Fatturato Mensile', area: 'Commerciale', unita_misura: '€', frequenza_rilevazione: 'mensile', valore_target: 100000, soglia_attenzione: 90000, soglia_allarme: 80000 },
  { id: '2', nome: 'Margine Operativo Lordo', area: 'Commerciale', unita_misura: '€', frequenza_rilevazione: 'trimestrale', valore_target: 30000, soglia_attenzione: 25000, soglia_allarme: 20000 },
  { id: '3', nome: 'Tempo Medio Consegna', area: 'Logistica', unita_misura: 'giorni', frequenza_rilevazione: 'mensile', valore_target: 3, soglia_attenzione: 5, soglia_allarme: 7 },
  { id: '4', nome: 'Tasso di Turnover', area: 'HR', unita_misura: '%', frequenza_rilevazione: 'trimestrale', valore_target: 5, soglia_attenzione: 8, soglia_allarme: 12 },
  { id: '5', nome: 'Costo Medio Acquisti', area: 'Acquisti', unita_misura: '€', frequenza_rilevazione: 'mensile', valore_target: 10000, soglia_attenzione: 12000, soglia_allarme: 15000 }
];
const valoriKpiData = [
  { id: '1', kpi_id: '1', valore: 95000, periodo: '2025-03'}, { id: '2', kpi_id: '1', valore: 105000, periodo: '2025-02'},
  { id: '3', kpi_id: '1', valore: 98000, periodo: '2025-01'}, { id: '4', kpi_id: '2', valore: 28000, periodo: '2025-Q1'},
  { id: '5', kpi_id: '3', valore: 4, periodo: '2025-03'}, { id: '6', kpi_id: '3', valore: 3.5, periodo: '2025-02'},
  { id: '7', kpi_id: '4', valore: 7.5, periodo: '2025-Q1'}, { id: '8', kpi_id: '5', valore: 11500, periodo: '2025-03'},
  { id: '9', kpi_id: '1', valore: 92000, periodo: '2025-04'}, { id: '10', kpi_id: '3', valore: 4.5, periodo: '2025-04'},
  { id: '11', kpi_id: '5', valore: 12500, periodo: '2025-04'}, { id: '12', kpi_id: '4', valore: 9.5, periodo: '2025-Q2'} // Aggiunto valore Q2 per KPI 4
];
const scostamentiData = [
  { id: '1', kpi_id: '1', periodo_corrente: '2025-04', periodo_precedente: '2025-03', valore_corrente: 92000, valore_precedente: 95000, scostamento_assoluto: -3000, scostamento_percentuale: -3.16, causa_probabile: 'Diminuzione vendite retail', impatto: 'Medio', azioni_suggerite: 'Analizzare vendite per segmento', data_analisi: '2025-05-05' },
  { id: '2', kpi_id: '3', periodo_corrente: '2025-04', periodo_precedente: '2025-03', valore_corrente: 4.5, valore_precedente: 4, scostamento_assoluto: 0.5, scostamento_percentuale: 12.5, causa_probabile: 'Problemi logistici fornitore', impatto: 'Medio', azioni_suggerite: 'Verificare performance fornitore', data_analisi: '2025-05-05' },
  { id: '3', kpi_id: '5', periodo_corrente: '2025-04', periodo_precedente: '2025-03', valore_corrente: 12500, valore_precedente: 11500, scostamento_assoluto: 1000, scostamento_percentuale: 8.7, causa_probabile: 'Aumento prezzi materie prime', impatto: 'Alto', azioni_suggerite: 'Rinegoziare contratti', data_analisi: '2025-05-05' },
  { id: '4', kpi_id: '4', periodo_corrente: '2025-Q2', periodo_precedente: '2025-Q1', valore_corrente: 9.5, valore_precedente: 7.5, scostamento_assoluto: 2, scostamento_percentuale: 26.67, causa_probabile: 'Insoddisfazione personale', impatto: 'Alto', azioni_suggerite: 'Condurre survey', data_analisi: '2025-07-05' }
];

const ScostamentiPage = () => {

  const [scostamenti, setScostamenti] = useState(scostamentiData);
  const [filteredScostamenti, setFilteredScostamenti] = useState(scostamentiData);
  const [filters, setFilters] = useState({ area: '', impatto: '', periodo: '' });
  const [selectedScostamento, setSelectedScostamento] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [showAnalisiForm, setShowAnalisiForm] = useState(false);

  const [formDataAnalisi, setFormDataAnalisi] = useState({ causa_probabile: '', impatto: 'Medio', azioni_suggerite: '' });

  useEffect(() => {
    let result = scostamenti;
    if (filters.area) {
      const kpiIds = kpiData.filter(kpi => kpi.area === filters.area).map(kpi => kpi.id);
      result = result.filter(scostamento => kpiIds.includes(scostamento.kpi_id));
    }
    if (filters.impatto) {
      result = result.filter(scostamento => scostamento.impatto === filters.impatto);
    }
    if (filters.periodo) {
      result = result.filter(scostamento => scostamento.periodo_corrente.includes(filters.periodo));
    }
    setFilteredScostamenti(result);
  }, [scostamenti, filters]); // Rimosso kpis dalle dipendenze perché usiamo kpiData

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedScostamento(null); // Resetta anche lo scostamento selezionato
  };

  const handleTabChange = (event, newValue) => { setTabValue(newValue); };
  const handleOpenDialog = (scostamento) => { setSelectedScostamento(scostamento); setOpenDialog(true); };
  const handleDeleteScostamento = (id) => { setScostamenti(scostamenti.filter(s => s.id !== id)); handleCloseDialog();  };
  const handleKpiSelect = (kpi) => { setSelectedKpi(kpi); setShowAnalisiForm(true); setFormDataAnalisi({ causa_probabile: '', impatto: 'Medio', azioni_suggerite: '' }); }; // Resetta form
  const handleBackFromAnalisi = () => { setShowAnalisiForm(false); setSelectedKpi(null); };

  const getKpiById = (id) => kpiData.find(kpi => kpi.id === id) || null; // Usa kpiData

  const getImpactColor = (impatto) => {
    if (impatto === 'Alto') return 'error';
    if (impatto === 'Medio') return 'warning';
    return 'success'; // Basso o non definito
  };

  const getScostamentoDirection = (scostamento) => {
    const kpi = getKpiById(scostamento.kpi_id);
    if (!kpi) return null;
    const isPositiveKpi = kpi.soglia_allarme < kpi.soglia_attenzione;
    return (isPositiveKpi ? scostamento.scostamento_assoluto >= 0 : scostamento.scostamento_assoluto <= 0) ? 'positivo' : 'negativo';
  };

  const AnalisiScostamentiForm = () => {
    if (!selectedKpi) return null;

    const valoriOrdinati = valoriKpiData // Usa valoriKpiData
      .filter(valore => valore.kpi_id === selectedKpi.id)
      .sort((a, b) => b.periodo.localeCompare(a.periodo));

    if (valoriOrdinati.length < 2) {
      return (
        <Box>
          <Button variant="outlined" onClick={handleBackFromAnalisi} sx={{ mb: 2 }}>Torna alla lista KPI</Button>
          <Paper sx={{ p: 3 }}><Alert severity="warning">Dati insufficienti per l'analisi (servono almeno 2 periodi).</Alert></Paper>
        </Box>
      );
    }

    const valoreCorrente = valoriOrdinati[0];
    const valorePrecedente = valoriOrdinati[1];
    const scostamentoAssoluto = valoreCorrente.valore - valorePrecedente.valore;
    const scostamentoPercentuale = valorePrecedente.valore !== 0 ? (scostamentoAssoluto / valorePrecedente.valore) * 100 : (scostamentoAssoluto !== 0 ? Infinity : 0);
    const isPositiveKpi = selectedKpi.soglia_allarme < selectedKpi.soglia_attenzione;
    const isPositiveScostamento = isPositiveKpi ? scostamentoAssoluto >= 0 : scostamentoAssoluto <= 0;

    const confrontoData = {
      labels: [valorePrecedente.periodo, valoreCorrente.periodo],
      datasets: [{
        label: selectedKpi.nome, data: [valorePrecedente.valore, valoreCorrente.valore],
        backgroundColor: ['#9e9e9e', isPositiveScostamento ? '#4caf50' : '#f44336'], borderWidth: 1
      }]
    };
     const confrontoOptions = { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Confronto Periodi'}}, scales: { y: { beginAtZero: true } } };

    const handleInputChangeAnalisi = (e) => {
      const { name, value } = e.target;
      setFormDataAnalisi({ ...formDataAnalisi, [name]: value });
    };

    const handleSubmitAnalisi = (e) => {
      e.preventDefault();
      const newScostamento = {
        id: `${scostamenti.length + 1}`, kpi_id: selectedKpi.id,
        periodo_corrente: valoreCorrente.periodo, periodo_precedente: valorePrecedente.periodo,
        valore_corrente: valoreCorrente.valore, valore_precedente: valorePrecedente.valore,
        scostamento_assoluto: scostamentoAssoluto, scostamento_percentuale: scostamentoPercentuale,
        ...formDataAnalisi, // causa, impatto, azioni
        data_analisi: new Date().toISOString().split('T')[0]
      };
      setScostamenti([...scostamenti, newScostamento]);
      handleBackFromAnalisi(); // Torna alla lista KPI dopo salvataggio

    };

    return (
      <Box>
        <Button variant="outlined" onClick={handleBackFromAnalisi} sx={{ mb: 2 }}>Torna alla lista KPI</Button>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Analisi Scostamento: {selectedKpi.nome}</Typography>
           <Grid container spacing={3}>
               <Grid item xs={12} md={6}>
                   <Typography variant="h6">Dati Scostamento</Typography>
                   <Typography>Periodo: {valoreCorrente.periodo} vs {valorePrecedente.periodo}</Typography>
                   <Typography>Valore: {valoreCorrente.valore} {selectedKpi.unita_misura} vs {valorePrecedente.valore} {selectedKpi.unita_misura}</Typography>
                   <Typography>Scostamento Assoluto: {scostamentoAssoluto.toFixed(2)} {selectedKpi.unita_misura}</Typography>
                   <Typography>Scostamento Percentuale: {scostamentoPercentuale.toFixed(2)}%</Typography>
                   <Chip label={isPositiveScostamento ? "Positivo/Miglioramento" : "Negativo/Peggioramento"} color={isPositiveScostamento ? "success" : "error"} sx={{ mt: 1 }} />
                   <Box sx={{ height: 200, mt: 2 }}>
                       <Bar data={confrontoData} options={confrontoOptions} />
                   </Box>
               </Grid>
               <Grid item xs={12} md={6}>
                   <Typography variant="h6">Analisi e Azioni</Typography>
                   <form onSubmit={handleSubmitAnalisi}>
                        <TextField name="causa_probabile" label="Causa Probabile (Analisi AI/Utente)" fullWidth margin="normal" multiline rows={3} value={formDataAnalisi.causa_probabile} onChange={handleInputChangeAnalisi} />
                       <FormControl fullWidth margin="normal">
                            <InputLabel>Impatto Stimato</InputLabel>
                            <Select name="impatto" label="Impatto Stimato" value={formDataAnalisi.impatto} onChange={handleInputChangeAnalisi}>
                                <MenuItem value="Basso">Basso</MenuItem>
                                <MenuItem value="Medio">Medio</MenuItem>
                                <MenuItem value="Alto">Alto</MenuItem>
                           </Select>
                       </FormControl>
                       <TextField name="azioni_suggerite" label="Azioni Correttive Suggerite" fullWidth margin="normal" multiline rows={3} value={formDataAnalisi.azioni_suggerite} onChange={handleInputChangeAnalisi} />
                       <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>Salva Analisi</Button>
                   </form>
               </Grid>
           </Grid>
        </Paper>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Analisi degli Scostamenti</Typography>

       {showAnalisiForm ? (
           <AnalisiScostamentiForm />
       ) : (
           <>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                    <Tab label="Scostamenti Rilevati" />
                    <Tab label="Avvia Nuova Analisi" />
                </Tabs>

                {tabValue === 0 && (
                     <Paper sx={{ p: 3, mb: 4 }}>
                       <Typography variant="body1" paragraph>Elenco degli scostamenti rilevanti analizzati.</Typography>
                        {}
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                             <Grid item xs={12} md={4}><FormControl fullWidth><InputLabel>Area</InputLabel><Select name="area" label="Area" value={filters.area} onChange={handleFilterChange}><MenuItem value="">Tutte</MenuItem><MenuItem value="Commerciale">Commerciale</MenuItem><MenuItem value="Logistica">Logistica</MenuItem><MenuItem value="HR">HR</MenuItem><MenuItem value="Acquisti">Acquisti</MenuItem></Select></FormControl></Grid>
                             <Grid item xs={12} md={4}><FormControl fullWidth><InputLabel>Impatto</InputLabel><Select name="impatto" label="Impatto" value={filters.impatto} onChange={handleFilterChange}><MenuItem value="">Tutti</MenuItem><MenuItem value="Alto">Alto</MenuItem><MenuItem value="Medio">Medio</MenuItem><MenuItem value="Basso">Basso</MenuItem></Select></FormControl></Grid>
                             <Grid item xs={12} md={4}><TextField name="periodo" label="Periodo (es. 2025-04)" fullWidth value={filters.periodo} onChange={handleFilterChange} /></Grid>
                        </Grid>
                        {}
                       <TableContainer>
                           <Table>
                               <TableHead><TableRow><TableCell>KPI</TableCell><TableCell>Periodo</TableCell><TableCell>Valore</TableCell><TableCell>Scost. %</TableCell><TableCell>Impatto</TableCell><TableCell>Causa Probabile</TableCell><TableCell>Azioni</TableCell></TableRow></TableHead>
                               <TableBody>
                                   {filteredScostamenti.length === 0 && <TableRow><TableCell colSpan={7} align="center">Nessuno scostamento trovato.</TableCell></TableRow>}
                                   {filteredScostamenti.map((scost) => {
                                       const kpi = getKpiById(scost.kpi_id);
                                       const direction = getScostamentoDirection(scost);
                                       return (
                                           <TableRow key={scost.id}>
                                                <TableCell>{kpi?.nome || `ID: ${scost.kpi_id}`}</TableCell>
                                                <TableCell>{scost.periodo_corrente}</TableCell>
                                                <TableCell>{scost.valore_corrente?.toFixed(2)}</TableCell>
                                                <TableCell sx={{ color: direction === 'positivo' ? 'success.main' : 'error.main' }}>
                                                     {direction === 'positivo' ? <TrendingUpIcon fontSize="small"/> : <TrendingDownIcon fontSize="small"/>} {scost.scostamento_percentuale?.toFixed(2)}%
                                                 </TableCell>
                                                <TableCell><Chip label={scost.impatto} color={getImpactColor(scost.impatto)} size="small"/></TableCell>
                                                <TableCell>{scost.causa_probabile}</TableCell>
                                                <TableCell><IconButton color="error" onClick={() => handleOpenDialog(scost)}><DeleteIcon /></IconButton></TableCell>
                                           </TableRow>
                                       );
                                   })}
                               </TableBody>
                           </Table>
                       </TableContainer>
                   </Paper>
               )}

               {tabValue === 1 && (
                    <Paper sx={{ p: 3, mb: 4 }}>
                       <Typography variant="h6" gutterBottom>Seleziona KPI per Nuova Analisi</Typography>
                       <Typography variant="body2" paragraph>Seleziona un KPI dall'elenco per avviare l'analisi dello scostamento rispetto al periodo precedente.</Typography>
                       <TableContainer>
                            <Table>
                               <TableHead><TableRow><TableCell>Nome KPI</TableCell><TableCell>Area</TableCell><TableCell>Azione</TableCell></TableRow></TableHead>
                               <TableBody>
                                   {kpiData.map((kpi) => ( // Usa kpiData per la selezione
                                       <TableRow key={kpi.id}>
                                           <TableCell>{kpi.nome}</TableCell>
                                           <TableCell>{kpi.area}</TableCell>
                                           <TableCell><Button startIcon={<AnalyticsIcon/>} onClick={() => handleKpiSelect(kpi)}>Analizza</Button></TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                       </TableContainer>
                   </Paper>
               )}

               {}
                <Dialog open={openDialog} onClose={handleCloseDialog}>
                   <DialogTitle>Conferma Eliminazione</DialogTitle>
                   <DialogContent><Typography>Eliminare l'analisi per "{getKpiById(selectedScostamento?.kpi_id)?.nome}" del periodo {selectedScostamento?.periodo_corrente}?</Typography></DialogContent>
                   <DialogActions><Button onClick={handleCloseDialog}>Annulla</Button><Button onClick={() => handleDeleteScostamento(selectedScostamento?.id)} color="error">Elimina</Button></DialogActions>
               </Dialog>
           </>
       )}

    </Box>
  );
};

export default ScostamentiPage;