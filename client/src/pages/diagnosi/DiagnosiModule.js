import React from 'react';
import { Routes, Route, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Fade,
  Grow,
  Zoom,
  Container,
  IconButton,
  Chip,
  LinearProgress,
  Stack
} from '@mui/material';

import AssessmentIcon from '@mui/icons-material/Assessment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import DescriptionIcon from '@mui/icons-material/Description';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import ChecklistPage from './ChecklistPage';
import GapAnalysisPage from './GapAnalysisPage';
import ReportPage from './ReportPage';
import NuovaChecklist from './NuovaChecklist';

// Card animata con effetto hover moderno
const ModuleCard = ({ title, description, icon, path, color, gradient, delay }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Grow in timeout={800 + delay}>
      <Card
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-12px) scale(1.02)',
            boxShadow: `0px 40px 80px ${color}20`,
            '& .card-bg': {
              transform: 'scale(1.1) rotate(5deg)',
            },
            '& .card-icon': {
              transform: 'scale(1.2) rotate(-10deg)',
            },
            '& .action-button': {
              backgroundColor: color,
              color: 'white',
              transform: 'translateX(0)',
              opacity: 1,
            },
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: gradient,
            opacity: isHovered ? 1 : 0.7,
            transition: 'all 0.3s ease',
          },
        }}
      >
        {/* Background decorativo */}
        <Box
          className="card-bg"
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            background: gradient,
            borderRadius: '50%',
            opacity: 0.1,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        
        <CardContent sx={{ flexGrow: 1, p: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Box
              className="card-icon"
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                background: gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: `0px 12px 24px ${color}40`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                mr: 2,
              }}
            >
              {icon}
            </Box>
            {isHovered && (
              <Chip
                label="NUOVO"
                size="small"
                sx={{
                  ml: 'auto',
                  background: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
            )}
          </Box>
          
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              color: '#1E293B',
              mb: 1,
              transition: 'color 0.3s ease',
            }}
          >
            {title}
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#64748B',
              lineHeight: 1.6,
              mb: 3,
            }}
          >
            {description}
          </Typography>
          
          {isHovered && (
            <Box sx={{ mt: 'auto' }}>
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                  label="AI Powered"
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: color, color: color, fontSize: '0.75rem' }}
                />
                <Chip
                  icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                  label="Ottimizzato"
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: color, color: color, fontSize: '0.75rem' }}
                />
              </Stack>
            </Box>
          )}
        </CardContent>
        
        <Box sx={{ p: 2, pt: 0 }}>
          <Button 
            className="action-button"
            variant="outlined"
            component={RouterLink} 
            to={path} 
            fullWidth
            endIcon={<ArrowForwardIcon />}
            sx={{
              borderRadius: 2,
              py: 1.5,
              borderColor: color,
              color: color,
              fontWeight: 600,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateX(-10px)',
              opacity: 0.8,
              '&:hover': {
                borderColor: color,
              },
            }}
          >
            Accedi
          </Button>
        </Box>
      </Card>
    </Grow>
  );
};

const DiagnosiModule = () => {
  const moduleCards = [
    { 
      title: 'Gestione Check-list', 
      description: 'Crea, visualizza e gestisci le check-list di valutazione per analizzare gli assetti aziendali', 
      icon: <ListAltIcon sx={{ fontSize: 28 }} />, 
      path: 'checklist', 
      color: '#F093FB',
      gradient: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
    },
    { 
      title: 'Nuova Check-list', 
      description: 'Avvia rapidamente la compilazione di una nuova check-list di valutazione guidata', 
      icon: <AddCircleOutlineIcon sx={{ fontSize: 28 }} />, 
      path: 'nuova-checklist', 
      color: '#667EEA',
      gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    },
    { 
      title: 'Gap Analysis', 
      description: 'Analizza in dettaglio i gap rilevati e identifica le aree critiche di intervento', 
      icon: <FindInPageIcon sx={{ fontSize: 28 }} />, 
      path: 'gap-analysis', 
      color: '#4FACFE',
      gradient: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
    },
    { 
      title: 'Report Diagnostico', 
      description: 'Genera report completi e professionali basati sulle valutazioni effettuate', 
      icon: <DescriptionIcon sx={{ fontSize: 28 }} />, 
      path: 'report', 
      color: '#43E97B',
      gradient: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)',
    }
  ];

  return (
    <Box>
      <Fade in timeout={500}>
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            Diagnosi e Assessment
          </Typography>
          
          <Paper 
            sx={{ 
              p: 3, 
              mb: 4,
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: 300,
                height: 300,
                background: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
                borderRadius: '50%',
                opacity: 0.05,
              }}
            />
            
            <Typography variant="body1" paragraph sx={{ position: 'relative', zIndex: 1 }}>
              Questo modulo ti permette di valutare gli assetti organizzativi, amministrativi e contabili della tua azienda 
              attraverso check-list strutturate e analisi guidate dall'intelligenza artificiale.
            </Typography>
            
            <Typography variant="body1" paragraph sx={{ position: 'relative', zIndex: 1 }}>
              Seleziona una funzionalità per iniziare la valutazione o visualizzare i risultati delle analisi precedenti.
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ mt: 3, position: 'relative', zIndex: 1 }}>
              <Chip
                icon={<AssessmentIcon />}
                label="Valutazione Guidata"
                sx={{
                  background: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
                  color: 'white',
                  fontWeight: 600,
                  px: 1,
                }}
              />
              <Chip
                icon={<AutoAwesomeIcon />}
                label="Analisi AI Integrata"
                sx={{
                  background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                  color: 'white',
                  fontWeight: 600,
                  px: 1,
                }}
              />
              <Chip
                label="Report Automatici"
                sx={{
                  background: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
                  color: 'white',
                  fontWeight: 600,
                  px: 1,
                }}
              />
            </Stack>
          </Paper>
        </Box>
      </Fade>

      <Routes>
        <Route index element={
          <Grid container spacing={3}>
            {moduleCards.map((card, index) => (
              <Grid item xs={12} md={6} lg={3} key={index}>
                <ModuleCard {...card} delay={index * 100} />
              </Grid>
            ))}
          </Grid>
        } />
        
        <Route path="checklist" element={<ChecklistPage />} />
        <Route path="gap-analysis" element={<GapAnalysisPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="nuova-checklist" element={<NuovaChecklist />} />
      </Routes>
    </Box>
  );
};

export default DiagnosiModule;