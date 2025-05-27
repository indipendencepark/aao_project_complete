import React from 'react';
// NOTA: Rimuovi 'Link' da qui se lo usi solo nelle card,
// altrimenti assicurati sia importato da react-router-dom se serve per navigazione programmatica
import { Routes, Route, Link as RouterLink } from 'react-router-dom'; // Usa RouterLink per le card
import { Box, Typography, Button, Paper, Grid, Card, CardContent, CardHeader } from '@mui/material';

// Icons
import AssessmentIcon from '@mui/icons-material/Assessment'; // Usato nelle props delle card
import ListAltIcon from '@mui/icons-material/ListAlt';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import DescriptionIcon from '@mui/icons-material/Description';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Per Nuova Checklist

// ***** IMPORTA I COMPONENTI PAGINA REALI *****
import ChecklistPage from './ChecklistPage'; // Assumendo sia nella stessa cartella
import GapAnalysisPage from './GapAnalysisPage'; // Assumendo sia nella stessa cartella
import ReportPage from './ReportPage'; // Assumendo sia nella stessa cartella
import NuovaChecklist from './NuovaChecklist'; // Assumendo sia nella stessa cartella
// **********************************************


// RIMUOVI o COMMENTA le definizioni dei componenti placeholder locali
/* // <-- Apertura commento
const ChecklistPage = () => (
  <Box>
    <Typography variant="h5" gutterBottom>Check-list di Valutazione</Typography>
    <Typography variant="body1">Questa sezione permetterà di compilare le check-list per valutare gli assetti esistenti.</Typography>
  </Box>
);

const GapAnalysisPage = () => (
  <Box>
    <Typography variant="h5" gutterBottom>Gap Analysis</Typography>
    <Typography variant="body1">Questa sezione mostrerà i gap rilevati durante la valutazione degli assetti.</Typography>
  </Box>
);

const ReportPage = () => (
   <Box>
    <Typography variant="h5" gutterBottom>Report Diagnostico</Typography>
    <Typography variant="body1">Questa sezione permetterà di generare e visualizzare i report diagnostici.</Typography>
  </Box>
);
*/ // <-- Chiusura commento
// ********************************************************

const DiagnosiModule = () => {
  // Aggiorna i path per essere relativi al modulo diagnosi
  const moduleCards = [
    { title: 'Gestione Check-list', description: 'Visualizza, crea e gestisci le check-list di valutazione', icon: <ListAltIcon fontSize="large" color="primary" />, path: 'checklist', color: '#e3f2fd' },
    { title: 'Nuova Check-list', description: 'Avvia la compilazione di una nuova check-list di valutazione', icon: <AddCircleOutlineIcon fontSize="large" color="primary" />, path: 'nuova-checklist', color: '#e3f2fd' },
    { title: 'Gap Analysis', description: 'Visualizza e analizza i gap rilevati durante la valutazione', icon: <FindInPageIcon fontSize="large" color="primary" />, path: 'gap-analysis', color: '#e3f2fd' },
    { title: 'Report Diagnostico', description: 'Genera e visualizza report diagnostici basati sulla valutazione', icon: <DescriptionIcon fontSize="large" color="primary" />, path: 'report', color: '#e3f2fd' }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Diagnosi e Assessment
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Questo modulo ti permette di valutare gli assetti organizzativi...
        </Typography>
        <Typography variant="body1" paragraph>
          Seleziona una funzionalità o avvia una nuova checklist.
        </Typography>
      </Paper>

      {/* Routes specifiche del modulo Diagnosi */}
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
                     {/* Usa path relativo e RouterLink */}
                     <Button variant="contained" component={RouterLink} to={card.path} fullWidth> Accedi </Button>
                   </Box>
                 </Card>
               </Grid>
             ))}
           </Grid>
         } />
         {/* Pagine specifiche del modulo - USA I COMPONENTI REALI IMPORTATI */}
         <Route path="checklist" element={<ChecklistPage />} />
         <Route path="gap-analysis" element={<GapAnalysisPage />} />
         <Route path="report" element={<ReportPage />} />
         <Route path="nuova-checklist" element={<NuovaChecklist />} /> {/* Usa il componente reale */}
      </Routes>
    </Box>
  );
};

export default DiagnosiModule;