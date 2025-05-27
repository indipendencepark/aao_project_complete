import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab
} from '@mui/material';

import { Link } from 'react-router-dom'; // o da '@mui/material/Link'

// Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2'; // Assicurati che react-chartjs-2 sia installato

// Icons
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit'; // Non usato, ma importato nel codice originale
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; // Non usato, ma importato nel codice originale
import TrendingDownIcon from '@mui/icons-material/TrendingDown'; // Non usato, ma importato nel codice originale
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'; // Non usato, ma importato
import BusinessIcon from '@mui/icons-material/Business';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

// Registrazione dei componenti Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Dati di esempio per gli alert
const alertsData = [
  {
    id: '1',
    kpi_id: '1',
    tipo: 'attenzione',
    messaggio: 'Fatturato Mensile sotto la soglia di attenzione',
    data_generazione: '2025-05-01',
    letto: false,
    valore_rilevato: 92000,
    soglia_superata: 90000,
    area: 'Commerciale'
  },
  {
    id: '2',
    kpi_id: '5',
    tipo: 'attenzione',
    messaggio: 'Costo Medio Acquisti sopra la soglia di attenzione',
    data_generazione: '2025-05-01',
    letto: false,
    valore_rilevato: 12500,
    soglia_superata: 12000,
    area: 'Acquisti'
  },
  {
    id: '3',
    kpi_id: '3',
    tipo: 'attenzione',
    messaggio: 'Tempo Medio Consegna sopra la soglia di attenzione',
    data_generazione: '2025-05-01',
    letto: true,
    valore_rilevato: 4.5,
    soglia_superata: 5,
    area: 'Logistica'
  },
  {
    id: '4',
    kpi_id: '1',
    tipo: 'allarme',
    messaggio: 'Fatturato Mensile sotto la soglia di allarme',
    data_generazione: '2025-05-15',
    letto: false,
    valore_rilevato: 78000,
    soglia_superata: 80000,
    area: 'Commerciale'
  },
  {
    id: '5',
    kpi_id: '4',
    tipo: 'allarme',
    messaggio: 'Tasso di Turnover sopra la soglia di allarme',
    data_generazione: '2025-06-05',
    letto: false,
    valore_rilevato: 13.5,
    soglia_superata: 12,
    area: 'HR'
  }
];

// Dati di esempio per i KPI (necessari per correlare gli alert)
const kpiData = [
  { id: '1', nome: 'Fatturato Mensile', area: 'Commerciale' },
  { id: '2', nome: 'Margine Operativo Lordo', area: 'Commerciale' },
  { id: '3', nome: 'Tempo Medio Consegna', area: 'Logistica' },
  { id: '4', nome: 'Tasso di Turnover', area: 'HR' },
  { id: '5', nome: 'Costo Medio Acquisti', area: 'Acquisti' },
];

// Componente per la gestione degli alert
const AlertsPage = () => {
  const [alerts, setAlerts] = useState(alertsData); // Dati di esempio
  const [filteredAlerts, setFilteredAlerts] = useState(alertsData);
  const [filters, setFilters] = useState({
    tipo: '',
    area: '',
    letto: ''
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [kpis, setKpis] = useState(kpiData); // Dati di esempio

  // Effetto per caricare dati reali (da implementare)
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       // const alertsResponse = await axios.get('http://localhost:5001/api/alerts');
  //       // setAlerts(alertsResponse.data.data || []);
  //       // const kpisResponse = await axios.get('http://localhost:5001/api/kpis');
  //       // setKpis(kpisResponse.data.data || []);
  //     } catch (error) {
  //       console.error("Errore caricamento dati:", error);
  //     }
  //   };
  //   fetchData();
  // }, []);

  // Funzione per applicare i filtri
  useEffect(() => {
    let result = alerts;
    if (filters.tipo) {
      result = result.filter(alert => alert.tipo === filters.tipo);
    }
    if (filters.area) {
      result = result.filter(alert => alert.area === filters.area);
    }
    if (filters.letto !== '') {
      result = result.filter(alert => alert.letto === (filters.letto === 'true'));
    }
    setFilteredAlerts(result);
  }, [alerts, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleOpenDialog = (alert) => {
    setSelectedAlert(alert);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAlert(null); // Deseleziona l'alert alla chiusura
  };

  const handleDeleteAlert = (id) => {
    // Qui andrebbe implementata la logica API per eliminare l'alert
    console.log(`Eliminazione alert con ID: ${id}`);
    setAlerts(alerts.filter(alert => alert.id !== id));
    handleCloseDialog(); // Chiudi il dialogo dopo l'eliminazione
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMarkAsRead = (id) => {
    // Qui andrebbe implementata la logica API per aggiornare lo stato
    console.log(`Segna come letto alert con ID: ${id}`);
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, letto: true } : alert
    ));
  };

  const handleMarkAllAsRead = () => {
    // Qui andrebbe implementata la logica API per aggiornare tutti gli alert
    console.log('Segna tutti gli alert come letti');
    setAlerts(alerts.map(alert => ({ ...alert, letto: true })));
  };

  const getKpiById = (id) => {
    return kpis.find(kpi => kpi.id === id) || null;
  };

  const getStatusColor = (tipo) => {
    switch (tipo) {
      case 'allarme': return 'error';
      case 'attenzione': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (tipo) => {
    switch (tipo) {
      case 'allarme': return 'Allarme';
      case 'attenzione': return 'Attenzione';
      default: return tipo;
    }
  };

   const getAreaIcon = (area) => {
    switch (area) {
      case 'Commerciale': return <BusinessIcon />;
      case 'Logistica': return <LocalShippingIcon />;
      case 'HR': return <PeopleIcon />;
      case 'Acquisti': return <ShoppingCartIcon />;
      default: return <NotificationsIcon />; // Icona di default per area non mappata
    }
  };

  // Prepara i dati per il grafico degli alert per area
  const alertsByAreaData = {
    labels: ['Commerciale', 'Logistica', 'HR', 'Acquisti', 'Altro'], // Aggiunto 'Altro'
    datasets: [
      {
        label: 'Attenzione',
        data: [
          alerts.filter(a => a.area === 'Commerciale' && a.tipo === 'attenzione').length,
          alerts.filter(a => a.area === 'Logistica' && a.tipo === 'attenzione').length,
          alerts.filter(a => a.area === 'HR' && a.tipo === 'attenzione').length,
          alerts.filter(a => a.area === 'Acquisti' && a.tipo === 'attenzione').length,
          alerts.filter(a => !['Commerciale', 'Logistica', 'HR', 'Acquisti'].includes(a.area) && a.tipo === 'attenzione').length
        ],
        backgroundColor: '#ff9800', // Arancione
      },
      {
        label: 'Allarme',
        data: [
          alerts.filter(a => a.area === 'Commerciale' && a.tipo === 'allarme').length,
          alerts.filter(a => a.area === 'Logistica' && a.tipo === 'allarme').length,
          alerts.filter(a => a.area === 'HR' && a.tipo === 'allarme').length,
          alerts.filter(a => a.area === 'Acquisti' && a.tipo === 'allarme').length,
           alerts.filter(a => !['Commerciale', 'Logistica', 'HR', 'Acquisti'].includes(a.area) && a.tipo === 'allarme').length
        ],
        backgroundColor: '#f44336', // Rosso
      }
    ],
  };

  const alertsByAreaOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Distribuzione Alert per Area e Tipo',
      },
    },
    scales: {
      x: {
        stacked: true, // Impila le barre per tipo
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
            display: true,
            text: 'Numero di Alert'
        }
      },
    },
  };

  // Calcola il numero di alert non letti
  const unreadAlertsCount = alerts.filter(alert => !alert.letto).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Sistema di Alert
        </Typography>
        {unreadAlertsCount > 0 && (
          <Button 
            variant="outlined" 
            startIcon={<CheckCircleIcon />}
            onClick={handleMarkAllAsRead}
            size="small"
          >
            Segna tutti come letti ({unreadAlertsCount})
          </Button>
        )}
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Lista Alert" icon={<NotificationsIcon />} iconPosition="start" />
        <Tab label="Analisi" icon={<AnalyticsIcon />} iconPosition="start"/>
        <Tab label="Configurazione" icon={<SettingsIcon />} iconPosition="start" />
      </Tabs>

      {/* Tab: Lista Alert */}
      {tabValue === 0 && (
        <>
          <Paper sx={{ p: 3, mb: 4 }}>
             <Typography variant="body1" paragraph>
              Visualizza e gestisci gli alert generati dal sistema quando i KPI superano le soglie predefinite.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="tipo-filter-label">Tipo</InputLabel>
                  <Select
                    labelId="tipo-filter-label"
                    name="tipo"
                    value={filters.tipo}
                    label="Tipo"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="attenzione">Attenzione</MenuItem>
                    <MenuItem value="allarme">Allarme</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="area-filter-label">Area</InputLabel>
                  <Select
                    labelId="area-filter-label"
                    name="area"
                    value={filters.area}
                    label="Area"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">Tutte</MenuItem>
                    <MenuItem value="Commerciale">Commerciale</MenuItem>
                    <MenuItem value="Logistica">Logistica</MenuItem>
                    <MenuItem value="HR">HR</MenuItem>
                    <MenuItem value="Acquisti">Acquisti</MenuItem>
                    {/* Aggiungi altre aree se necessario */}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="letto-filter-label">Stato Lettura</InputLabel>
                  <Select
                    labelId="letto-filter-label"
                    name="letto"
                    value={filters.letto}
                    label="Stato Lettura"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="false">Non letti</MenuItem>
                    <MenuItem value="true">Letti</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {filteredAlerts.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Messaggio</TableCell>
                        <TableCell>KPI</TableCell>
                        <TableCell>Area</TableCell>
                        <TableCell>Data</TableCell>
                        <TableCell>Valore Rilevato</TableCell>
                        <TableCell>Stato</TableCell>
                        <TableCell align="right">Azioni</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAlerts.map((alert) => {
                        const kpi = getKpiById(alert.kpi_id);
                        return (
                          <TableRow 
                            key={alert.id} 
                            sx={{ 
                                bgcolor: alert.letto ? 'inherit' : '#fff8e1',
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                            >
                            <TableCell>
                              <Chip 
                                icon={alert.tipo === 'allarme' ? <ErrorIcon /> : <WarningIcon />}
                                label={getStatusLabel(alert.tipo)} 
                                color={getStatusColor(alert.tipo)} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>{alert.messaggio}</TableCell>
                            <TableCell>{kpi ? kpi.nome : `ID: ${alert.kpi_id}`}</TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {getAreaIcon(alert.area)}
                                    <Typography variant="body2" sx={{ ml: 1 }}>{alert.area}</Typography>
                                </Box>
                             </TableCell>
                            <TableCell>{new Date(alert.data_generazione).toLocaleDateString('it-IT')}</TableCell>
                            <TableCell>{alert.valore_rilevato} (Soglia: {alert.soglia_superata})</TableCell>
                            <TableCell>
                              <Chip 
                                label={alert.letto ? 'Letto' : 'Non letto'} 
                                color={alert.letto ? 'default' : 'primary'} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton color="primary" title="Dettagli KPI" size="small" component={Link} to={`/monitoraggio/kpi`}> {/* Dovrebbe puntare al dettaglio specifico */}
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                              {!alert.letto && (
                                <IconButton color="success" title="Segna come letto" size="small" onClick={() => handleMarkAsRead(alert.id)}>
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              )}
                              <IconButton color="error" title="Elimina" size="small" onClick={() => handleOpenDialog(alert)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
            ) : (
                <Alert severity="info" sx={{ mt: 2 }}>Nessun alert trovato con i filtri selezionati.</Alert>
            )}

          </Paper>

          {/* Dialog di conferma eliminazione */}
          <Dialog open={openDialog} onClose={handleCloseDialog}>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogContent>
              <Typography variant="body1">
                Sei sicuro di voler eliminare l'alert "{selectedAlert?.messaggio}"?
              </Typography>
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                Questa azione non può essere annullata.
              </Typography>
            </DialogContent>
            <DialogActions>
               {/* Completamento del tag Button troncato */}
              <Button onClick={handleCloseDialog}>Annulla</Button> 
              <Button 
                onClick={() => handleDeleteAlert(selectedAlert?.id)} 
                color="error" 
                variant="contained"
              >
                Elimina
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* Tab: Analisi */}
      {tabValue === 1 && (
          <Paper sx={{ p: 3, mb: 4 }}>
             <Typography variant="h6" gutterBottom>
                Analisi Alert
             </Typography>
              <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                     <Box sx={{ height: 400 }}>
                         <Bar data={alertsByAreaData} options={alertsByAreaOptions} />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                     <Typography variant="subtitle1" gutterBottom>Riepilogo:</Typography>
                      <List>
                         <ListItem>
                             <ListItemText primary="Alert Totali" secondary={alerts.length} />
                         </ListItem>
                         <ListItem>
                             <ListItemText primary="Alert Non Letti" secondary={unreadAlertsCount} />
                         </ListItem>
                         <ListItem>
                              <ListItemText primary="Alert di Allarme" secondary={alerts.filter(a => a.tipo === 'allarme').length} />
                          </ListItem>
                         <ListItem>
                              <ListItemText primary="Alert di Attenzione" secondary={alerts.filter(a => a.tipo === 'attenzione').length} />
                          </ListItem>
                     </List>
                     {/* Potrebbe esserci un altro grafico qui, es. trend temporale */}
                 </Grid>
              </Grid>
          </Paper>
      )}

       {/* Tab: Configurazione */}
       {tabValue === 2 && (
          <Paper sx={{ p: 3, mb: 4 }}>
             <Typography variant="h6" gutterBottom>
                Configurazione Alert
             </Typography>
              <Alert severity="info">
                 Questa sezione permetterà di configurare le regole di generazione degli alert e le notifiche (non ancora implementato).
             </Alert>
             {/* Qui andranno i campi per la configurazione */}
          </Paper>
       )}

    </Box>
  );
};

// Icone mancanti (placeholder, da importare correttamente se usate)
const SettingsIcon = NotificationsIcon; 
const AnalyticsIcon = NotificationsIcon;

export default AlertsPage;