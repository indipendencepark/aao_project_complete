

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  IconButton,
} from '@mui/material';
import { Link } from 'react-router-dom';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

import AssessmentIcon from '@mui/icons-material/Assessment';
import ConstructionIcon from '@mui/icons-material/Construction';
import MonitorIcon from '@mui/icons-material/Monitor';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import BusinessIcon from '@mui/icons-material/Business';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ChecklistIcon from '@mui/icons-material/Checklist';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const kpiData = [
  { id: '1', nome: 'Fatturato Mensile', area: 'Commerciale', unita_misura: '€', frequenza_rilevazione: 'mensile', valore_target: 100000, soglia_attenzione: 90000, soglia_allarme: 80000 },
  { id: '2', nome: 'Margine Operativo Lordo', area: 'Commerciale', unita_misura: '€', frequenza_rilevazione: 'trimestrale', valore_target: 30000, soglia_attenzione: 25000, soglia_allarme: 20000 },
  { id: '3', nome: 'Tempo Medio Consegna', area: 'Logistica', unita_misura: 'giorni', frequenza_rilevazione: 'mensile', valore_target: 3, soglia_attenzione: 5, soglia_allarme: 7 },
];
const valoriKpiData = [
  { id: '1', kpi_id: '1', valore: 95000, periodo: '2025-03', data_rilevazione: '2025-04-01'},
  { id: '2', kpi_id: '1', valore: 92000, periodo: '2025-04', data_rilevazione: '2025-05-01'},
  { id: '4', kpi_id: '2', valore: 28000, periodo: '2025-Q1', data_rilevazione: '2025-04-05'},
  { id: '5', kpi_id: '3', valore: 4.5, periodo: '2025-04', data_rilevazione: '2025-05-01'},
];
const alertsData = [
  { id: '1', kpi_id: '1', tipo: 'attenzione', messaggio: 'Fatturato Mensile sotto la soglia di attenzione', data_generazione: '2025-05-01', letto: false, valore_rilevato: 92000, soglia_superata: 90000, area: 'Commerciale' },
  { id: '4', kpi_id: '1', tipo: 'allarme', messaggio: 'Fatturato Mensile sotto la soglia di allarme', data_generazione: '2025-05-15', letto: false, valore_rilevato: 78000, soglia_superata: 80000, area: 'Commerciale' },
];
const checklistData = [
  { id: '1', nome: 'Valutazione Assetti Organizzativi', data_creazione: '2025-01-10', data_compilazione: '2025-01-15', stato: 'completata', punteggio: 72, area: 'Organizzativa', domande_totali: 25, domande_completate: 25 },
  { id: '2', nome: 'Valutazione Assetti Amministrativi', data_creazione: '2025-02-10', data_compilazione: null, stato: 'in_corso', punteggio: 0, area: 'Amministrativa', domande_totali: 30, domande_completate: 15 },
];
const interventiData = [
  { id: '1', nome: 'Implementazione sistema di controllo di gestione', area: 'Amministrativa', priorita: 'alta', stato: 'in_corso', completamento: 60 },
  { id: '2', nome: 'Definizione organigramma', area: 'Organizzativa', priorita: 'alta', stato: 'completato', completamento: 100 },
];

const DashboardUnificata = () => {
  const [kpis] = useState(kpiData);
  const [valoriKpi] = useState(valoriKpiData);
  const [alerts] = useState(alertsData);
  const [checklists] = useState(checklistData);
  const [interventiState] = useState(interventiData);

  function getKpiStatus(kpi) {
    const valoriKpiOrdinati = valoriKpi
      .filter(valore => valore.kpi_id === kpi.id)
      .sort((a, b) => new Date(b.data_rilevazione) - new Date(a.data_rilevazione));
    if (valoriKpiOrdinati.length === 0) return 'non_rilevato';
    const ultimoValore = valoriKpiOrdinati[0].valore;
    if (kpi.soglia_allarme > kpi.soglia_attenzione) {
      if (ultimoValore >= kpi.soglia_allarme) return 'allarme';
      if (ultimoValore >= kpi.soglia_attenzione) return 'attenzione';
      return 'ok';
    } else {
      if (ultimoValore <= kpi.soglia_allarme) return 'allarme';
      if (ultimoValore <= kpi.soglia_attenzione) return 'attenzione';
      return 'ok';
    }
  }

  const kpiStatusCount = { ok: 0, attenzione: 0, allarme: 0, non_rilevato: 0 };
  kpis.forEach(kpi => {
    kpiStatusCount[getKpiStatus(kpi)]++;
  });

  const unreadAlertsCount = alerts.filter(alert => !alert.letto).length;

  const interventiStatusCount = {
    completato: interventiState.filter(i => i.stato === 'completato').length,
    in_corso: interventiState.filter(i => i.stato === 'in_corso').length,
    pianificato: interventiState.filter(i => i.stato === 'pianificato' || i.stato === 'approvato' || i.stato === 'suggerito').length
  };

  const checklistCompletate = checklists.filter(c => c.stato === 'completata');
  const checklistInProgress = checklists.filter(c => c.stato === 'in_corso' || c.stato === 'bozza');
  const punteggioMedio = checklistCompletate.length > 0
    ? checklistCompletate.reduce((acc, curr) => acc + curr.punteggio, 0) / checklistCompletate.length
    : 0;

  const kpiPieData = {
    labels: ['OK', 'Attenzione', 'Allarme', 'Non Rilevato'],
    datasets: [{
        data: [kpiStatusCount.ok, kpiStatusCount.attenzione, kpiStatusCount.allarme, kpiStatusCount.non_rilevato],
        backgroundColor: ['#4caf50', '#ff9800', '#f44336', '#9e9e9e'],
        borderWidth: 1,
    }],
  };
  const kpiPieOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' }, title: { display: true, text: 'Stato KPI Attuali' } }
  };

  const interventiBarData = {
    labels: ['Completati', 'In Corso', 'Pianificati'],
    datasets: [{
        label: 'Numero di Interventi',
        data: [interventiStatusCount.completato, interventiStatusCount.in_corso, interventiStatusCount.pianificato],
        backgroundColor: ['#4caf50', '#2196f3', '#9e9e9e'],
    }],
  };
  const interventiBarOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' }, title: { display: true, text: 'Stato Interventi Pianificati' } },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Dashboard Unificata AAO</Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body1"><strong>Benvenuto nel Sistema AAO</strong></Typography>
        <Typography variant="body2">Utilizza il menu laterale per navigare tra i moduli.</Typography>
      </Alert>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Stato del Sistema AAO</Typography>
            <Grid container spacing={2}>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Diagnosi</Typography>
                    </Box>
                    <Typography variant="body2">{checklistCompletate.length} Checklist completate.</Typography>
                    <Typography variant="body2">{checklistInProgress.length} Checklist in corso.</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt:1 }}>
                      <Typography variant="h5" color="primary">{punteggioMedio.toFixed(0)}%</Typography>
                      <Chip label={checklistInProgress.length > 0 ? "In corso" : "Completata"} color={checklistInProgress.length > 0 ? "primary" : "success"} size="small" />
                    </Box>
                    <Button component={Link} to="/diagnosi" size="small" endIcon={<ArrowForwardIcon />} sx={{ mt: 1, display: 'block', textAlign: 'right' }}>Vai al modulo</Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ConstructionIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="h6">Progettazione</Typography>
                    </Box>
                    <Typography variant="body2">{interventiState.length} Interventi definiti.</Typography>
                    <Typography variant="body2">{interventiStatusCount.in_corso} Interventi in corso.</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="h5" color="success.main">{interventiStatusCount.completato}/{interventiState.length}</Typography>
                        <Chip
                          label={interventiStatusCount.in_corso > 0 ? "In corso" : (interventiStatusCount.completato === interventiState.length && interventiState.length > 0 ? "Completata" : "Pianificata") }
                          color={interventiStatusCount.in_corso > 0 ? "primary" : (interventiStatusCount.completato === interventiState.length && interventiState.length > 0 ? "success" : "info")}
                          size="small"
                        />
                    </Box>
                    <Button component={Link} to="/progettazione" size="small" endIcon={<ArrowForwardIcon />} sx={{ mt: 1, display: 'block', textAlign: 'right' }}>Vai al modulo</Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: '#fff3e0', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MonitorIcon color="warning" sx={{ mr: 1 }} />
                      <Typography variant="h6">Monitoraggio</Typography>
                    </Box>
                    <Typography variant="body2">{kpis.length} KPI monitorati.</Typography>
                    <Typography variant="body2">{kpiStatusCount.attenzione + kpiStatusCount.allarme} KPI con criticità.</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="h5" color={kpiStatusCount.allarme > 0 ? 'error.main' : 'warning.main'}>{kpiStatusCount.attenzione + kpiStatusCount.allarme} / {kpis.length}</Typography>
                      <Chip label={kpiStatusCount.allarme > 0 ? "Allarme" : (kpiStatusCount.attenzione > 0 ? "Attenzione" : "OK")} color={kpiStatusCount.allarme > 0 ? "error" : (kpiStatusCount.attenzione > 0 ? "warning" : "success")} size="small" />
                    </Box>
                    <Button component={Link} to="/monitoraggio" size="small" endIcon={<ArrowForwardIcon />} sx={{ mt: 1, display: 'block', textAlign: 'right' }}>Vai al modulo</Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: '#ffebee', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <NotificationsIcon color="error" sx={{ mr: 1 }} />
                      <Typography variant="h6">Alert Attivi</Typography>
                    </Box>
                    <Typography variant="body2">Alert generati da KPI fuori soglia.</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="h4" color="error">{unreadAlertsCount}</Typography>
                      <Chip label={unreadAlertsCount > 0 ? "Da leggere" : "Nessuno"} color={unreadAlertsCount > 0 ? "error" : "default"} size="small" />
                    </Box>
                    <Button component={Link} to="/monitoraggio/alerts" size="small" endIcon={<ArrowForwardIcon />} sx={{ mt: 1, display: 'block', textAlign: 'right' }}>Gestisci Alert</Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
           <Paper sx={{ p: 3, height: '100%' }}>
             <Typography variant="h6" gutterBottom>Stato KPI</Typography>
             {kpis.length > 0 ? (
                 <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Pie data={kpiPieData} options={kpiPieOptions}/></Box>
             ) : ( <Typography variant="body2" color="text.secondary" align="center">Nessun KPI definito.</Typography> )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
             <Typography variant="h6" gutterBottom>Stato Interventi</Typography>
             {interventiState.length > 0 ? (
                 <Box sx={{ height: 300 }}><Bar data={interventiBarData} options={interventiBarOptions} /></Box>
             ) : ( <Typography variant="body2" color="text.secondary" align="center">Nessun intervento definito.</Typography> )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Azioni Rapide</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}><Button component={Link} to="/diagnosi/nuova-checklist" variant="outlined" fullWidth startIcon={<ChecklistIcon />}>Nuova Checklist</Button></Grid>
                <Grid item xs={12} sm={6} md={3}><Button component={Link} to="/progettazione/interventi" variant="outlined" fullWidth startIcon={<AddIcon />}>Nuovo Intervento</Button></Grid>
                <Grid item xs={12} sm={6} md={3}><Button component={Link} to="/monitoraggio/kpi" variant="outlined" fullWidth startIcon={<AnalyticsIcon />}>Gestione KPI</Button></Grid>
                <Grid item xs={12} sm={6} md={3}><Button component={Link} to="/progettazione/formalizzazione" variant="outlined" fullWidth startIcon={<DescriptionIcon />}>Documenti AAO</Button></Grid>
            </Grid>
          </Paper>
        </Grid>

         <Grid item xs={12}>
           <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>Ultime Attività / Notifiche</Typography>
              <Divider sx={{ mb: 2 }} />
             {alerts.length > 0 ? (
                 <List dense>
                      {alerts.slice(0, 5).map((alert) => (
                        <ListItem key={alert.id} secondaryAction={<IconButton edge="end" aria-label="view" component={Link} to="/monitoraggio/alerts"><VisibilityIcon /></IconButton>} sx={{ bgcolor: alert.letto ? 'inherit' : '#fff8e1' }}>
                             <ListItemIcon>{alert.tipo === 'allarme' ? <ErrorIcon color="error" /> : <WarningIcon color="warning" />}</ListItemIcon>
                             <ListItemText primary={alert.messaggio} secondary={`${alert.area} - ${new Date(alert.data_generazione).toLocaleDateString('it-IT')}`} />
                        </ListItem>
                    ))}
                 </List>
             ) : ( <Typography variant="body2" color="text.secondary">Nessuna attività recente o alert attivo.</Typography> )}
             {alerts.length > 5 && ( <Button component={Link} to="/monitoraggio/alerts" size="small" sx={{ mt: 1 }}>Vedi tutti gli alert</Button> )}
         </Paper>
       </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardUnificata;