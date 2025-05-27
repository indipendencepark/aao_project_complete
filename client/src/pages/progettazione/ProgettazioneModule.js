import React from 'react';
// Rimuovi 'Link' da qui se non usato, o importa come alias se serve
import { Routes, Route, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Paper, Grid, Card, CardContent, CardHeader } from '@mui/material';

// Icons
import BuildIcon from '@mui/icons-material/Build';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos'; // Icona diversa per Nuovo Intervento


// ***** IMPORTA I COMPONENTI PAGINA REALI *****
import InterventiPage from './InterventiPage'; // Dalla stessa cartella
import PianoAzionePage from './PianoAzionePage'; // Dalla stessa cartella
import FormalizzazionePage from './FormalizzazionePage'; // Dalla stessa cartella
// **********************************************


// RIMUOVI o COMMENTA le definizioni dei componenti placeholder locali
/*
const InterventiPage = () => (
  <Box>
    <Typography variant="h5" gutterBottom>Interventi Suggeriti</Typography>
    <Typography variant="body1">Questa sezione mostrerà gli interventi suggeriti in base ai gap rilevati.</Typography>
  </Box>
);

const PianoAzionePage = () => ( // ... placeholder ... );
const FormalizzazionePage = () => ( // ... placeholder ... );
*/
// ********************************************************


const ProgettazioneModule = () => {
  // Aggiorna card e path relativi
  const moduleCards = [
    { title: 'Gestione Interventi', description: 'Visualizza, crea e gestisci gli interventi correttivi suggeriti o pianificati', icon: <BuildIcon fontSize="large" color="primary" />, path: 'interventi', color: '#e8f5e9' },
    // Potremmo avere un link diretto per creare un nuovo intervento se utile
    // { title: 'Nuovo Intervento', description: 'Definisci un nuovo intervento correttivo manualmente', icon: <AddToPhotosIcon fontSize="large" color="primary" />, path: 'interventi/nuovo', color: '#e8f5e9' },
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

      {/* Routes specifiche del modulo Progettazione */}
      <Routes>
         {/* Pagina Indice del Modulo (con le card) */}
         <Route index element={
           <Grid container spacing={3}>
             {moduleCards.map((card, index) => (
               <Grid item xs={12} md={6} lg={4} key={index}> {/* Adattato per 3 card */}
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
         {/* Pagine specifiche del modulo - USA I COMPONENTI REALI IMPORTATI */}
         <Route path="interventi" element={<InterventiPage />} />
         <Route path="piano-azione" element={<PianoAzionePage />} />
         <Route path="formalizzazione" element={<FormalizzazionePage />} />
         {/* Eventuale rotta per creare nuovo intervento direttamente:
         <Route path="interventi/nuovo" element={<InterventiPage showNewFormOnInit={true}/>} />
         Modificherebbe InterventiPage per accettare una prop */}
      </Routes>
    </Box>
  );
};

export default ProgettazioneModule;