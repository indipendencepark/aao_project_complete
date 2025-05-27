import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Box, Typography, Button, Paper, Grid, Card, CardContent, CardHeader } from '@mui/material';

import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DashboardIcon from '@mui/icons-material/Dashboard';

import KpiPage from './KpiPage';
import AlertsPage from './AlertsPage';
import ScostamentiPage from './ScostamentiPage';
import DashboardPage from './DashboardPage';

const MonitoraggioModule = () => {
   const moduleCards = [
     { title: 'Dashboard Monitoraggio', description: 'Visualizza la dashboard con i principali KPI e trend', icon: <DashboardIcon fontSize="large" color="primary" />, path: 'dashboard', color: '#fff8e1' },
     { title: 'Gestione KPI', description: 'Definisci, modifica ed elimina gli Indicatori Chiave di Performance', icon: <BarChartIcon fontSize="large" color="primary" />, path: 'kpi', color: '#fff8e1' },
     { title: 'Gestione Alert', description: 'Visualizza e gestisci gli alert generati quando i KPI escono dai range', icon: <NotificationsActiveIcon fontSize="large" color="primary" />, path: 'alerts', color: '#fff8e1' },
     { title: 'Analisi Scostamenti', description: 'Analizza gli scostamenti tra valori attesi ed effettivi dei KPI', icon: <CompareArrowsIcon fontSize="large" color="primary" />, path: 'scostamenti', color: '#fff8e1' }
   ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Monitoraggio Continuativo
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Questo modulo ti permette di monitorare continuamente l'efficacia degli assetti organizzativi...
        </Typography>
        <Typography variant="body1" paragraph>
          Seleziona una delle funzionalità sottostanti.
        </Typography>
      </Paper>

      <Routes>
         <Route index element={
           <Grid container spacing={3}>
             {moduleCards.map((card, index) => (
               <Grid item xs={12} md={6} lg={3} key={index}>
                 <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: card.color, transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}}}>
                   <CardHeader avatar={card.icon} title={<Typography variant="h6">{card.title}</Typography>} />
                   <CardContent sx={{ flexGrow: 1 }}>
                     <Typography variant="body2">{card.description}</Typography>
                   </CardContent>
                   <Box sx={{ p: 2 }}>
                     <Button variant="contained" component={Link} to={card.path} fullWidth> Accedi </Button>
                   </Box>
                 </Card>
               </Grid>
             ))}
           </Grid>
         } />
         <Route path="kpi" element={<KpiPage />} />
         <Route path="alerts" element={<AlertsPage />} />
         <Route path="scostamenti" element={<ScostamentiPage />} />
         <Route path="dashboard" element={<DashboardPage />} />
      </Routes>
    </Box>
  );
};

export default MonitoraggioModule;