import React from 'react';

import { Routes, Route, Link as RouterLink } from 'react-router-dom'; // Usa RouterLink per le card
import { Box, Typography, Button, Paper, Grid, Card, CardContent, CardHeader } from '@mui/material';

import AssessmentIcon from '@mui/icons-material/Assessment'; // Usato nelle props delle card
import ListAltIcon from '@mui/icons-material/ListAlt';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import DescriptionIcon from '@mui/icons-material/Description';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Per Nuova Checklist

import ChecklistPage from './ChecklistPage'; // Assumendo sia nella stessa cartella
import GapAnalysisPage from './GapAnalysisPage'; // Assumendo sia nella stessa cartella
import ReportPage from './ReportPage'; // Assumendo sia nella stessa cartella
import NuovaChecklist from './NuovaChecklist'; // Assumendo sia nella stessa cartella

 // <-- Chiusura commento

const DiagnosiModule = () => {

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

      {}
      <Routes>
         {}
         <Route index element={
           <Grid container spacing={3}>
             {moduleCards.map((card, index) => (
               <Grid item xs={12} md={6} lg={3} key={index}> {}
                 <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: card.color, transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}}}>
                   <CardHeader avatar={card.icon} title={<Typography variant="h6">{card.title}</Typography>} />
                   <CardContent sx={{ flexGrow: 1 }}>
                     <Typography variant="body2">{card.description}</Typography>
                   </CardContent>
                   <Box sx={{ p: 2 }}>
                     {}
                     <Button variant="contained" component={RouterLink} to={card.path} fullWidth> Accedi </Button>
                   </Box>
                 </Card>
               </Grid>
             ))}
           </Grid>
         } />
         {}
         <Route path="checklist" element={<ChecklistPage />} />
         <Route path="gap-analysis" element={<GapAnalysisPage />} />
         <Route path="report" element={<ReportPage />} />
         <Route path="nuova-checklist" element={<NuovaChecklist />} /> {}
      </Routes>
    </Box>
  );
};

export default DiagnosiModule;