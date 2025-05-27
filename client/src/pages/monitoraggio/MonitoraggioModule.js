import React from 'react';
import { Routes, Route, Link } from 'react-router-dom'; // Assicurati che Link sia importato se lo usi nelle card
import { Box, Typography, Button, Paper, Grid, Card, CardContent, CardHeader } from '@mui/material';

// Icons (come prima)
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
// Aggiungi Dashboard Icon se hai una dashboard specifica per il monitoraggio
import DashboardIcon from '@mui/icons-material/Dashboard';


// ***** IMPORTA I COMPONENTI PAGINA REALI *****
import KpiPage from './KpiPage'; // Importa il file KpiPage.js dalla stessa cartella
import AlertsPage from './AlertsPage'; // Importa AlertsPage.js
import ScostamentiPage from './ScostamentiPage'; // Importa ScostamentiPage.js
import DashboardPage from './DashboardPage'; // Importa DashboardPage.js (la dashboard specifica del monitoraggio)
// **********************************************

// RIMUOVI o COMMENTA le definizioni dei componenti placeholder locali
/*
const KpiPage = () => (
  <Box>
    <Typography variant="h5" gutterBottom>Monitoraggio KPI</Typography>
    <Typography variant="body1">Questa sezione permetterà di monitorare i KPI aziendali per tutte le aree funzionali.</Typography>
  </Box>
);

const AlertPage = () => ( // Rinominato per coerenza
  <Box>
    <Typography variant="h5" gutterBottom>Gestione Alert</Typography>
    <Typography variant="body1">Questa sezione mostrerà gli alert generati quando i KPI escono dai range predefiniti.</Typography>
  </Box>
);

const AnalisiScostamentiPage = () => ( // Rinominato per coerenza
  <Box>
    <Typography variant="h5" gutterBottom>Analisi Scostamenti</Typography>
    <Typography variant="body1">Questa sezione permetterà di analizzare gli scostamenti tra valori attesi ed effettivi dei KPI.</Typography>
  </Box>
);
*/
// ********************************************************


const MonitoraggioModule = () => {
  // Aggiungi la card per la Dashboard specifica del monitoraggio se vuoi accedervi da qui
   const moduleCards = [
     { title: 'Dashboard Monitoraggio', description: 'Visualizza la dashboard con i principali KPI e trend', icon: <DashboardIcon fontSize="large" color="primary" />, path: 'dashboard', color: '#fff8e1' }, // Usa path relativo 'dashboard'
     { title: 'Gestione KPI', description: 'Definisci, modifica ed elimina gli Indicatori Chiave di Performance', icon: <BarChartIcon fontSize="large" color="primary" />, path: 'kpi', color: '#fff8e1' }, // Usa path relativo 'kpi'
     { title: 'Gestione Alert', description: 'Visualizza e gestisci gli alert generati quando i KPI escono dai range', icon: <NotificationsActiveIcon fontSize="large" color="primary" />, path: 'alerts', color: '#fff8e1' }, // Usa path relativo 'alerts'
     { title: 'Analisi Scostamenti', description: 'Analizza gli scostamenti tra valori attesi ed effettivi dei KPI', icon: <CompareArrowsIcon fontSize="large" color="primary" />, path: 'scostamenti', color: '#fff8e1' } // Usa path relativo 'scostamenti'
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

      {/* Routes specifiche del modulo Monitoraggio */}
      <Routes>
         {/* Pagina Indice del Modulo (con le card) */}
         <Route index element={
           <Grid container spacing={3}>
             {moduleCards.map((card, index) => (
               <Grid item xs={12} md={6} lg={3} key={index}> {/* Adattato lg per 4 card */}
                 <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: card.color, transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}}}>
                   <CardHeader avatar={card.icon} title={<Typography variant="h6">{card.title}</Typography>} />
                   <CardContent sx={{ flexGrow: 1 }}>
                     <Typography variant="body2">{card.description}</Typography>
                   </CardContent>
                   <Box sx={{ p: 2 }}>
                     {/* Usa path relativo per Link */}
                     <Button variant="contained" component={Link} to={card.path} fullWidth> Accedi </Button>
                   </Box>
                 </Card>
               </Grid>
             ))}
           </Grid>
         } />
         {/* Pagine specifiche del modulo - USA I COMPONENTI REALI IMPORTATI */}
         <Route path="kpi" element={<KpiPage />} />
         <Route path="alerts" element={<AlertsPage />} />
         <Route path="scostamenti" element={<ScostamentiPage />} />
         <Route path="dashboard" element={<DashboardPage />} />
      </Routes>
    </Box>
  );
};

export default MonitoraggioModule;