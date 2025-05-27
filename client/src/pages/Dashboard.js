import React from 'react';
import { Box, Typography, Grid, Paper, Card, CardContent, CardHeader, Button } from '@mui/material';
import { Link } from 'react-router-dom';

import AssessmentIcon from '@mui/icons-material/Assessment';
import BuildIcon from '@mui/icons-material/Build';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';

const Dashboard = () => {
  const moduleCards = [
    {
      title: 'Diagnosi e Assessment',
      description: 'Valutazione degli assetti esistenti, gap analysis e report diagnostico',
      icon: <AssessmentIcon fontSize="large" color="primary" />,
      path: '/diagnosi',
      color: '#e3f2fd'
    },
    {
      title: 'Progettazione e Supporto',
      description: 'Definizione degli interventi, piano d\'azione e formalizzazione degli assetti',
      icon: <BuildIcon fontSize="large" color="primary" />,
      path: '/progettazione',
      color: '#e8f5e9'
    },
    {
      title: 'Monitoraggio Continuativo',
      description: 'Monitoraggio KPI, alert e analisi degli scostamenti',
      icon: <MonitorHeartIcon fontSize="large" color="primary" />,
      path: '/monitoraggio',
      color: '#fff8e1'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" paragraph>
        Benvenuto nel sistema di gestione degli Adeguati Assetti Organizzativi (AAO). 
        Questo software ti supporta in tutte le fasi del processo di adeguamento degli assetti organizzativi, 
        amministrativi e contabili della tua azienda.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {moduleCards.map((card, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: card.color,
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardHeader
                avatar={card.icon}
                title={<Typography variant="h5">{card.title}</Typography>}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="body1">
                  {card.description}
                </Typography>
              </CardContent>
              <Box sx={{ p: 2 }}>
                <Button 
                  variant="contained" 
                  component={Link} 
                  to={card.path}
                  fullWidth
                >
                  Accedi
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Panoramica del Sistema
        </Typography>
        <Typography variant="body1" paragraph>
          Il sistema è strutturato in tre moduli principali che corrispondono alle fasi del processo di adeguamento degli assetti organizzativi:
        </Typography>
        <Typography variant="body1" component="div">
          <ul>
            <li><strong>Diagnosi e Assessment</strong>: Compilazione delle check-list di valutazione, identificazione dei gap e generazione automatica di report diagnostici.</li>
            <li><strong>Progettazione e Supporto</strong>: Suggerimento di interventi prioritari in base ai gap rilevati e definizione di piani d'azione con tempistiche.</li>
            <li><strong>Monitoraggio Continuativo</strong>: Monitoraggio dei KPI aziendali, gestione degli alert e analisi degli scostamenti.</li>
          </ul>
        </Typography>
        <Typography variant="body1" paragraph>
          Seleziona uno dei moduli sopra per iniziare a lavorare con il sistema.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard;
