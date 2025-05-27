import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Divider,
  Alert,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link as MuiLink // Alias per evitare conflitti
} from '@mui/material';
import { Link } from 'react-router-dom'; // Importa Link da react-router-dom

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
  ArcElement,
  Filler // Importa Filler se usi 'fill' nei grafici
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import BusinessIcon from '@mui/icons-material/Business';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NotificationsIcon from '@mui/icons-material/Notifications'; // Per la sezione Alert

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler // Registra Filler

);

const kpiData = [
  { id: '1', nome: 'Fatturato Mensile', area: 'Commerciale', unita_misura: '€', valore_target: 100000, soglia_attenzione: 90000, soglia_allarme: 80000 },
  { id: '2', nome: 'Margine Operativo Lordo', area: 'Commerciale', unita_misura: '€', valore_target: 30000, soglia_attenzione: 25000, soglia_allarme: 20000 },
  { id: '3', nome: 'Tempo Medio Consegna', area: 'Logistica', unita_misura: 'giorni', valore_target: 3, soglia_attenzione: 5, soglia_allarme: 7 },
  { id: '4', nome: 'Tasso di Turnover', area: 'HR', unita_misura: '%', valore_target: 5, soglia_attenzione: 8, soglia_allarme: 12 },
  { id: '5', nome: 'Costo Medio Acquisti', area: 'Acquisti', unita_misura: '€', valore_target: 10000, soglia_attenzione: 12000, soglia_allarme: 15000 },
];

const valoriKpiData = [
  { id: '1', kpi_id: '1', valore: 95000, periodo: '2025-03', data_rilevazione: '2025-04-01' },
  { id: '2', kpi_id: '1', valore: 105000, periodo: '2025-02', data_rilevazione: '2025-03-01' },
  { id: '3', kpi_id: '1', valore: 98000, periodo: '2025-01', data_rilevazione: '2025-02-01' },
  { id: '4', kpi_id: '2', valore: 28000, periodo: '2025-Q1', data_rilevazione: '2025-04-05' },
  { id: '5', kpi_id: '3', valore: 4, periodo: '2025-03', data_rilevazione: '2025-04-01' },
  { id: '6', kpi_id: '3', valore: 3.5, periodo: '2025-02', data_rilevazione: '2025-03-01' },
  { id: '7', kpi_id: '4', valore: 7.5, periodo: '2025-Q1', data_rilevazione: '2025-04-05' },
  { id: '8', kpi_id: '5', valore: 11500, periodo: '2025-03', data_rilevazione: '2025-04-01' },
  { id: '9', kpi_id: '1', valore: 92000, periodo: '2025-04', data_rilevazione: '2025-05-01' },
  { id: '10', kpi_id: '3', valore: 4.5, periodo: '2025-04', data_rilevazione: '2025-05-01' },
  { id: '11', kpi_id: '5', valore: 12500, periodo: '2025-04', data_rilevazione: '2025-05-01' },
];

const alertsData = [
  { id: '1', kpi_id: '1', tipo: 'attenzione', messaggio: 'Fatturato Mensile sotto la soglia di attenzione', data_generazione: '2025-05-01', letto: false, area: 'Commerciale' },
  { id: '2', kpi_id: '5', tipo: 'attenzione', messaggio: 'Costo Medio Acquisti sopra la soglia di attenzione', data_generazione: '2025-05-01', letto: false, area: 'Acquisti'},
  { id: '3', kpi_id: '3', tipo: 'attenzione', messaggio: 'Tempo Medio Consegna sopra la soglia di attenzione', data_generazione: '2025-05-01', letto: true, area: 'Logistica'},
  { id: '4', kpi_id: '1', tipo: 'allarme', messaggio: 'Fatturato Mensile sotto la soglia di allarme', data_generazione: '2025-05-15', letto: false, area: 'Commerciale'},
];

const DashboardPage = () => {
  const [kpis, setKpis] = useState(kpiData);
  const [valoriKpi, setValoriKpi] = useState(valoriKpiData);
  const [alerts, setAlerts] = useState(alertsData);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [kpiDetails, setKpiDetails] = useState(null); // Per dati grafico KPI selezionato

  const filteredKpis = selectedArea 
    ? kpis.filter(kpi => kpi.area === selectedArea)
    : kpis;

  const kpiStatusCount = { ok: 0, attenzione: 0, allarme: 0, non_rilevato: 0 };

  function getKpiStatus(kpi) {
    const valoriKpiOrdinati = valoriKpi
      .filter(valore => valore.kpi_id === kpi.id)
      .sort((a, b) => new Date(b.data_rilevazione) - new Date(a.data_rilevazione));
    
    if (valoriKpiOrdinati.length === 0) return 'non_rilevato';
    
    const ultimoValore = valoriKpiOrdinati[0].valore;
    
    if (kpi.soglia_allarme > kpi.soglia_attenzione) { // Valori alti peggiori
      if (ultimoValore >= kpi.soglia_allarme) return 'allarme';
      if (ultimoValore >= kpi.soglia_attenzione) return 'attenzione';
      return 'ok';
    } else { // Valori bassi peggiori
      if (ultimoValore <= kpi.soglia_allarme) return 'allarme';
      if (ultimoValore <= kpi.soglia_attenzione) return 'attenzione';
      return 'ok';
    }
  }

  kpis.forEach(kpi => {
    const status = getKpiStatus(kpi);
    kpiStatusCount[status]++;
  });

  const unreadAlertsCount = alerts.filter(alert => !alert.letto).length;

  function getStatusColor(status) {  
      switch (status) {
          case 'ok': return 'success';
          case 'attenzione': return 'warning';
          case 'allarme': return 'error';
          default: return 'default';
      }
  }
  function getStatusLabel(status) {  
      switch (status) {
          case 'ok': return 'OK';
          case 'attenzione': return 'Attenzione';
          case 'allarme': return 'Allarme';
          case 'non_rilevato': return 'Non Rilevato';
          default: return status;
      }
  }
  function getAreaIcon(area) {  
      switch (area) {
          case 'Commerciale': return <BusinessIcon fontSize="small"/>;
          case 'Logistica': return <LocalShippingIcon fontSize="small"/>;
          case 'HR': return <PeopleIcon fontSize="small"/>;
          case 'Acquisti': return <ShoppingCartIcon fontSize="small"/>;
          default: return <BusinessIcon fontSize="small"/>;
      }
  }
  function getValoriByKpiId(kpiId) {  
      return valoriKpi
          .filter(valore => valore.kpi_id === kpiId)
          .sort((a, b) => a.periodo.localeCompare(b.periodo));
  }
  function getLastValueByKpiId(kpiId) {  
      const valoriOrdinati = valoriKpi
          .filter(valore => valore.kpi_id === kpiId)
          .sort((a, b) => new Date(b.data_rilevazione) - new Date(a.data_rilevazione));
      return valoriOrdinati.length > 0 ? valoriOrdinati[0] : null;
  }

  const handleAreaChange = (event) => {
    setSelectedArea(event.target.value);
    setSelectedKpi(null); // Deseleziona KPI quando cambia l'area
    setKpiDetails(null);
  };

  const handleKpiClick = (kpi) => {
    setSelectedKpi(kpi);
    
    const valori = getValoriByKpiId(kpi.id);
    if (valori.length === 0) {
      setKpiDetails(null); // Nessun dato da mostrare
      return;
    }

    const labels = valori.map(v => v.periodo);
    const data = valori.map(v => v.valore);
    
    const pointBackgroundColors = data.map(value => {
      if (kpi.soglia_allarme > kpi.soglia_attenzione) {
        if (value >= kpi.soglia_allarme) return '#f44336';
        if (value >= kpi.soglia_attenzione) return '#ff9800';
        return '#4caf50';
      } else {
        if (value <= kpi.soglia_allarme) return '#f44336';
        if (value <= kpi.soglia_attenzione) return '#ff9800';
        return '#4caf50';
      }
    });
    
    const chartData = {
      labels,
      datasets: [
        {
          label: kpi.nome,
          data,
          borderColor: '#2196f3', // Blu per la linea
          backgroundColor: 'rgba(33, 150, 243, 0.1)', // Area sotto la linea
          pointBackgroundColor: pointBackgroundColors, // Colore dei punti
          tension: 0.1,
          fill: true, // Riempie l'area sotto la linea
          pointRadius: 5,
          pointHoverRadius: 7
        },

        {
          label: 'Target',
          data: Array(labels.length).fill(kpi.valore_target),
          borderColor: '#4caf50',
          borderDash: [5, 5],
          pointRadius: 0,
          borderWidth: 1,
          fill: false,
        },
        {
          label: 'Attenzione',
          data: Array(labels.length).fill(kpi.soglia_attenzione),
          borderColor: '#ff9800',
           borderDash: [5, 5],
          pointRadius: 0,
           borderWidth: 1,
          fill: false,
        },
         {
          label: 'Allarme',
          data: Array(labels.length).fill(kpi.soglia_allarme),
          borderColor: '#f44336',
           borderDash: [5, 5],
          pointRadius: 0,
           borderWidth: 1,
          fill: false,
        }
      ]
    };
    
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false, // Permette di controllare l'altezza
      plugins: {
        legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
        title: { display: true, text: `Trend ${kpi.nome}` },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y} ${kpi.unita_misura || ''}`;
            }
          }
        },

      },
      scales: { y: { beginAtZero: false, title: { display: true, text: kpi.unita_misura || '' } } }
    };
    
    setKpiDetails({ chartData, chartOptions, valori });
  };

  const kpiPieData = {
    labels: ['OK', 'Attenzione', 'Allarme', 'Non Rilevato'],
    datasets: [ { data: [kpiStatusCount.ok, kpiStatusCount.attenzione, kpiStatusCount.allarme, kpiStatusCount.non_rilevato], backgroundColor: ['#4caf50', '#ff9800', '#f44336', '#9e9e9e'], borderWidth: 1, } ],
  };
   const kpiPieOptions = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Stato Generale KPI' } } };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Cruscotto di Monitoraggio KPI
      </Typography>
      
      <Grid container spacing={3}>
        {}
        <Grid item xs={12} md={4}>
           <Paper sx={{ p: 2, mb: 2 }}>
               <Typography variant="h6" gutterBottom>Stato Generale</Typography>
                <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                    <Pie data={kpiPieData} options={kpiPieOptions} />
                </Box>
                 <Typography variant="body2" align="center" color="text.secondary">
                     {kpis.length} KPI monitorati
                 </Typography>
           </Paper>
           <Paper sx={{ p: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="area-select-label">Filtra per Area</InputLabel>
                <Select
                  labelId="area-select-label"
                  value={selectedArea}
                  label="Filtra per Area"
                  onChange={handleAreaChange}
                >
                  <MenuItem value="">
                    <em>Tutte le Aree</em>
                  </MenuItem>
                  <MenuItem value="Commerciale">Commerciale</MenuItem>
                  <MenuItem value="Logistica">Logistica</MenuItem>
                  <MenuItem value="HR">HR</MenuItem>
                  <MenuItem value="Acquisti">Acquisti</MenuItem>
                  {}
                </Select>
              </FormControl>
           </Paper>
        </Grid>

        {}
        <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: 'calc(200px + 2rem + 100px)'  }}>
                <Typography variant="h6" gutterBottom>
                    KPI {selectedArea ? `Area ${selectedArea}` : 'Tutte le Aree'} ({filteredKpis.length})
                </Typography>
                 <Box sx={{ maxHeight: 'calc(200px + 2rem + 100px - 60px)' , overflowY: 'auto' }}>
                   <List dense>
                     {filteredKpis.map((kpi) => {
                       const status = getKpiStatus(kpi);
                       const lastValue = getLastValueByKpiId(kpi.id);
                       return (
                         <ListItem 
                            key={kpi.id} 
                            button 
                            selected={selectedKpi?.id === kpi.id} 
                            onClick={() => handleKpiClick(kpi)}
                            sx={{ borderBottom: '1px solid #eee' }}
                            >
                           <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5 }}>
                             {getAreaIcon(kpi.area)}
                           </ListItemIcon>
                           <ListItemText 
                              primary={kpi.nome} 
                              secondary={lastValue ? `Ultimo: ${lastValue.valore} ${kpi.unita_misura || ''} (${lastValue.periodo})` : 'Nessun valore'} 
                           />
                           <Chip label={getStatusLabel(status)} color={getStatusColor(status)} size="small" />
                         </ListItem>
                       );
                     })}
                   </List>
                </Box>
            </Paper>
        </Grid>

         {}
         <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: 350 }}>
                 {selectedKpi ? (
                    kpiDetails ? (
                         <Box sx={{ height: '100%', width: '100%' }}>
                           <Line data={kpiDetails.chartData} options={kpiDetails.chartOptions} />
                         </Box>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography color="text.secondary">Nessun dato storico disponibile per {selectedKpi.nome}.</Typography>
                        </Box>
                    )
                ) : (
                     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                         <Typography color="text.secondary">Seleziona un KPI dalla lista per visualizzare il trend.</Typography>
                     </Box>
                )}
            </Paper>
         </Grid>

         {}
         <Grid item xs={12} md={4}>
            {}
           <Paper sx={{ p: 2, height: 350 }}>
               <Typography variant="h6" gutterBottom>
                   <NotificationsIcon sx={{ verticalAlign: 'bottom', mr: 0.5}}/> Alert Recenti
               </Typography>
               <Divider sx={{ mb: 1 }}/>
                <Box sx={{ maxHeight: 'calc(350px - 60px)', overflowY: 'auto' }}>
                   {alerts.length > 0 ? (
                       <List dense>
                            {alerts.filter(a => !a.letto).slice(0, 5).map(alert => ( // Mostra solo 5 non letti
                                <ListItem key={alert.id} sx={{ bgcolor: '#fff8e1', mb: 0.5, borderRadius: 1 }}>
                                     <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                                         {alert.tipo === 'allarme' ? <ErrorIcon fontSize="small" color="error" /> : <WarningIcon fontSize="small" color="warning" />}
                                     </ListItemIcon>
                                     <ListItemText 
                                        primary={alert.messaggio} 
                                        primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                                        secondary={`${alert.area} - ${new Date(alert.data_generazione).toLocaleDateString('it-IT')}`} 
                                    />
                                </ListItem>
                            ))}
                           {alerts.filter(a => a.letto).slice(0, 5 - alerts.filter(a => !a.letto).length).map(alert => ( // Completa con i letti fino a 5
                                <ListItem key={alert.id} sx={{ mb: 0.5, borderRadius: 1 }}>
                                     <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                                         {alert.tipo === 'allarme' ? <ErrorIcon fontSize="small" color="action" /> : <WarningIcon fontSize="small" color="action" />}
                                     </ListItemIcon>
                                     <ListItemText 
                                        primary={alert.messaggio} 
                                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary'}}
                                        secondary={`${alert.area} - ${new Date(alert.data_generazione).toLocaleDateString('it-IT')}`} 
                                    />
                                </ListItem>
                           ))}
                       </List>
                   ) : (
                       <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                           Nessun alert recente.
                       </Typography>
                   )}
               </Box>
               {alerts.length > 0 && (
                    <Button 
                        component={Link} 
                        to="/monitoraggio/alerts" 
                        size="small" 
                        fullWidth 
                        sx={{ mt: 1 }}
                    >
                       Vedi tutti gli alert ({unreadAlertsCount} non letti)
                   </Button>
               )}
           </Paper>
             {}
         </Grid>

      </Grid>
    </Box>
  );
};

export default DashboardPage;