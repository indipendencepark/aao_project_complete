import React from 'react';

import { Routes, Route, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Paper, Grid, Card, CardContent, CardHeader } from '@mui/material';

import BuildIcon from '@mui/icons-material/Build';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos'; // Icona diversa per Nuovo Intervento

import InterventiPage from './InterventiPage'; // Dalla stessa cartella
import PianoAzionePage from './PianoAzionePage'; // Dalla stessa cartella
import FormalizzazionePage from './FormalizzazionePage'; // Dalla stessa cartella

const ProgettazioneModule = () => {

  const moduleCards = [
    { title: 'Gestione Interventi', description: 'Visualizza, crea e gestisci gli interventi correttivi suggeriti o pianificati', icon: <BuildIcon fontSize="large" color="primary" />, path: 'interventi', color: '#e8f5e9' },

    { title: 'Piano d\'Azione', description: 'Definisci e monitora i piani d\'azione aggregando gli interventi', icon: <AssignmentIcon fontSize="large" color="primary" />, path: 'piano-azione', color: '#e8f5e9' },
    { title: 'Formalizzazione Assetti', description: 'Gestisci i documenti formali (organigrammi, procedure, etc.)', icon: <DescriptionIcon fontSize="large" color="primary" />, path: 'formalizzazione', color: '#e8f5e9' }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Progettazione e Supporto all'Implementazione
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Questo modulo ti supporta nella progettazione e implementazione degli interventi...
        </Typography>
        <Typography variant="body1" paragraph>
          Seleziona una delle funzionalità sottostanti.
        </Typography>
      </Paper>

      {}
      <Routes>
         {}
         <Route index element={
           <Grid container spacing={3}>
             {moduleCards.map((card, index) => (
               <Grid item xs={12} md={6} lg={4} key={index}> {}
                 <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: card.color, transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}}}>
                   <CardHeader avatar={card.icon} title={<Typography variant="h6">{card.title}</Typography>} />
                   <CardContent sx={{ flexGrow: 1 }}>
                     <Typography variant="body2">{card.description}</Typography>
                   </CardContent>
                   <Box sx={{ p: 2 }}>
                     <Button variant="contained" component={RouterLink} to={card.path} fullWidth> Accedi </Button>
                   </Box>
                 </Card>
               </Grid>
             ))}
           </Grid>
         } />
         {}
         <Route path="interventi" element={<InterventiPage />} />
         <Route path="piano-azione" element={<PianoAzionePage />} />
         <Route path="formalizzazione" element={<FormalizzazionePage />} />
         {}
      </Routes>
    </Box>
  );
};

export default ProgettazioneModule;