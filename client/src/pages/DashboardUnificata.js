import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  IconButton,
  LinearProgress,
  Fade,
  Grow,
  Zoom,
  Container,
  Stack,
  Skeleton,
  useTheme
} from '@mui/material';
import { Link } from 'react-router-dom';

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
  RadialLinearScale
} from 'chart.js';
import { Pie, Bar, Doughnut, PolarArea, Radar } from 'react-chartjs-2';

import AssessmentIcon from '@mui/icons-material/Assessment';
import ConstructionIcon from '@mui/icons-material/Construction';
import MonitorIcon from '@mui/icons-material/Monitor';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import BusinessIcon from '@mui/icons-material/Business';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ChecklistIcon from '@mui/icons-material/Checklist';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AutorenewIcon from '@mui/icons-material/Autorenew';

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
  RadialLinearScale
);

const kpiData = [
  { id: '1', nome: 'Fatturato Mensile', area: 'Commerciale', unita_misura: '€', frequenza_rilevazione: 'mensile', valore_target: 100000, soglia_attenzione: 90000, soglia_allarme: 80000 },
  { id: '2', nome: 'Margine Operativo Lordo', area: 'Commerciale', unita_misura: '€', frequenza_rilevazione: 'trimestrale', valore_target: 30000, soglia_attenzione: 25000, soglia_allarme: 20000 },
  { id: '3', nome: 'Tempo Medio Consegna', area: 'Logistica', unita_misura: 'giorni', frequenza_rilevazione: 'mensile', valore_target: 3, soglia_attenzione: 5, soglia_allarme: 7 },
];
const valoriKpiData = [
  { id: '1', kpi_id: '1', valore: 95000, periodo: '2025-03', data_rilevazione: '2025-04-01'},
  { id: '2', kpi_id: '1', valore: 92000, periodo: '2025-04', data_rilevazione: '2025-05-01'},
  { id: '4', kpi_id: '2', valore: 28000, periodo: '2025-Q1', data_rilevazione: '2025-04-05'},
  { id: '5', kpi_id: '3', valore: 4.5, periodo: '2025-04', data_rilevazione: '2025-05-01'},
];
const alertsData = [
  { id: '1', kpi_id: '1', tipo: 'attenzione', messaggio: 'Fatturato Mensile sotto la soglia di attenzione', data_generazione: '2025-05-01', letto: false, valore_rilevato: 92000, soglia_superata: 90000, area: 'Commerciale' },
  { id: '4', kpi_id: '1', tipo: 'allarme', messaggio: 'Fatturato Mensile sotto la soglia di allarme', data_generazione: '2025-05-15', letto: false, valore_rilevato: 78000, soglia_superata: 80000, area: 'Commerciale' },
];
const checklistData = [
  { id: '1', nome: 'Valutazione Assetti Organizzativi', data_creazione: '2025-01-10', data_compilazione: '2025-01-15', stato: 'completata', punteggio: 72, area: 'Organizzativa', domande_totali: 25, domande_completate: 25 },
  { id: '2', nome: 'Valutazione Assetti Amministrativi', data_creazione: '2025-02-10', data_compilazione: null, stato: 'in_corso', punteggio: 0, area: 'Amministrativa', domande_totali: 30, domande_completate: 15 },
];
const interventiData = [
  { id: '1', nome: 'Implementazione sistema di controllo di gestione', area: 'Amministrativa', priorita: 'alta', stato: 'in_corso', completamento: 60 },
  { id: '2', nome: 'Definizione organigramma', area: 'Organizzativa', priorita: 'alta', stato: 'completato', completamento: 100 },
];

// Card moderna con glassmorphism
const ModernCard = ({ children, gradient, icon, delay = 0, ...props }) => (
  <Grow in timeout={500 + delay}>
    <Card
      sx={{
        height: '100%',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: '0px 40px 80px rgba(0, 0, 0, 0.12)',
          '& .icon-bg': {
            transform: 'scale(1.2) rotate(10deg)',
          }
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: gradient,
          opacity: 0.8,
        },
        ...props.sx
      }}
      {...props}
    >
      {icon && (
        <Box
          className="icon-bg"
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            background: gradient,
            borderRadius: '50%',
            opacity: 0.1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      )}
      {children}
    </Card>
  </Grow>
);

// Componente MetricCard con animazioni
const MetricCard = ({ title, value, subtitle, icon, gradient, trend, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <ModernCard gradient={gradient} icon={icon} delay={delay}>
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography 
              variant="subtitle2" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.75rem',
                mb: 1
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800,
                background: gradient,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
                transition: 'all 0.3s ease',
                transform: isVisible ? 'scale(1)' : 'scale(0.8)',
                opacity: isVisible ? 1 : 0,
              }}
            >
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
            }}
          >
            {icon}
          </Box>
        </Box>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 0.5 }}>
            {trend > 0 ? (
              <TrendingUpIcon sx={{ color: '#10B981', fontSize: 20 }} />
            ) : (
              <TrendingDownIcon sx={{ color: '#EF4444', fontSize: 20 }} />
            )}
            <Typography variant="body2" sx={{ 
              color: trend > 0 ? '#10B981' : '#EF4444',
              fontWeight: 600
            }}>
              {Math.abs(trend)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              vs mese precedente
            </Typography>
          </Box>
        )}
      </CardContent>
    </ModernCard>
  );
};

const DashboardUnificata = () => {
  const theme = useTheme();
  const [kpis] = useState(kpiData);
  const [valoriKpi] = useState(valoriKpiData);
  const [alerts] = useState(alertsData);
  const [checklists] = useState(checklistData);
  const [interventiState] = useState(interventiData);
  const [loadingData, setLoadingData] = useState(true);

  React.useEffect(() => {
    // Simula caricamento dati
    setTimeout(() => setLoadingData(false), 1000);
  }, []);

  function getKpiStatus(kpi) {
    const valoriKpiOrdinati = valoriKpi
      .filter(valore => valore.kpi_id === kpi.id)
      .sort((a, b) => new Date(b.data_rilevazione) - new Date(a.data_rilevazione));
    
    if (valoriKpiOrdinati.length === 0) return 'non_rilevato';
    
    const ultimoValore = valoriKpiOrdinati[0].valore;
    
    if (kpi.soglia_allarme > kpi.soglia_attenzione) {
      if (ultimoValore >= kpi.soglia_allarme) return 'allarme';
      if (ultimoValore >= kpi.soglia_attenzione) return 'attenzione';
      return 'ok';
    } else {
      if (ultimoValore <= kpi.soglia_allarme) return 'allarme';
      if (ultimoValore <= kpi.soglia_attenzione) return 'attenzione';
      return 'ok';
    }
  }

  const kpiStatusCount = { ok: 0, attenzione: 0, allarme: 0, non_rilevato: 0 };
  kpis.forEach(kpi => {
    kpiStatusCount[getKpiStatus(kpi)]++;
  });

  const unreadAlertsCount = alerts.filter(alert => !alert.letto).length;

  const interventiStatusCount = {
    completato: interventiState.filter(i => i.stato === 'completato').length,
    in_corso: interventiState.filter(i => i.stato === 'in_corso').length,
    pianificato: interventiState.filter(i => i.stato === 'pianificato' || i.stato === 'approvato' || i.stato === 'suggerito').length
  };

  const checklistCompletate = checklists.filter(c => c.stato === 'completata');
  const checklistInProgress = checklists.filter(c => c.stato === 'in_corso' || c.stato === 'bozza');
  const punteggioMedio = checklistCompletate.length > 0
    ? checklistCompletate.reduce((acc, curr) => acc + curr.punteggio, 0) / checklistCompletate.length
    : 0;

  // Configurazione grafici moderni
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
        },
      },
    },
  };

  const kpiDoughnutData = {
    labels: ['OK', 'Attenzione', 'Allarme'],
    datasets: [{
      data: [kpiStatusCount.ok, kpiStatusCount.attenzione, kpiStatusCount.allarme],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderColor: [
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
      ],
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };

  const interventiPolarData = {
    labels: ['Completati', 'In Corso', 'Pianificati'],
    datasets: [{
      data: [interventiStatusCount.completato, interventiStatusCount.in_corso, interventiStatusCount.pianificato],
      backgroundColor: [
        'rgba(99, 102, 241, 0.6)',
        'rgba(236, 72, 153, 0.6)',
        'rgba(59, 130, 246, 0.6)',
      ],
      borderColor: [
        'rgba(99, 102, 241, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(59, 130, 246, 1)',
      ],
      borderWidth: 2,
    }],
  };

  if (loadingData) {
    return (
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={150} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Box>
      <Fade in timeout={500}>
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            Dashboard Sistema AAO
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Panoramica completa del sistema di gestione degli Adeguati Assetti Organizzativi
          </Typography>
        </Box>
      </Fade>
      
      {/* Alert di benvenuto con design moderno */}
      <Zoom in timeout={600}>
        <Alert 
          severity="info" 
          sx={{ 
            mb: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            '& .MuiAlert-icon': {
              color: '#6366F1',
            }
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Benvenuto nel Sistema AAO
          </Typography>
          <Typography variant="body2">
            Utilizza il menu laterale per navigare tra i moduli e monitorare lo stato degli assetti aziendali.
          </Typography>
        </Alert>
      </Zoom>
      
      {/* Metriche principali con design ultra moderno */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Diagnosi"
            value={`${punteggioMedio.toFixed(0)}%`}
            subtitle={`${checklistCompletate.length} checklist completate`}
            icon={<AssessmentIcon />}
            gradient="linear-gradient(135deg, #F093FB 0%, #F5576C 100%)"
            trend={12}
            delay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Progettazione"
            value={`${interventiStatusCount.completato}/${interventiState.length}`}
            subtitle="Interventi completati"
            icon={<ConstructionIcon />}
            gradient="linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)"
            trend={-5}
            delay={100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Monitoraggio"
            value={`${kpiStatusCount.attenzione + kpiStatusCount.allarme}`}
            subtitle={`KPI critici su ${kpis.length}`}
            icon={<MonitorIcon />}
            gradient="linear-gradient(135deg,rgb(3, 4, 3) 0%, #38F9D7 100%)"
            trend={8}
            delay={200}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Alert Attivi"
            value={unreadAlertsCount}
            subtitle="Da gestire"
            icon={<NotificationsIcon />}
            gradient="linear-gradient(135deg, #FA709A 0%, #FEE140 100%)"
            trend={-15}
            delay={300}
          />
        </Grid>
      </Grid>

      {/* Grafici con design moderno */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Grow in timeout={800}>
            <Paper 
              sx={{ 
                p: 3, 
                height: 400,
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                Stato KPI
              </Typography>
              {kpis.length > 0 ? (
                <Box sx={{ height: 300, position: 'relative' }}>
                  <Doughnut data={kpiDoughnutData} options={{
                    ...chartOptions,
                    cutout: '70%',
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          font: {
                            size: 12,
                            weight: '500',
                          },
                        },
                      },
                    },
                  }} />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#1E293B' }}>
                      {kpis.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      KPI Totali
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  Nessun KPI definito.
                </Typography>
              )}
            </Paper>
          </Grow>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Grow in timeout={900}>
            <Paper 
              sx={{ 
                p: 3, 
                height: 400,
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                Stato Interventi
              </Typography>
              {interventiState.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <PolarArea data={interventiPolarData} options={{
                    ...chartOptions,
                    scales: {
                      r: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)',
                        },
                        ticks: {
                          display: false,
                        },
                      },
                    },
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          font: {
                            size: 12,
                            weight: '500',
                          },
                        },
                      },
                    },
                  }} />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  Nessun intervento definito.
                </Typography>
              )}
            </Paper>
          </Grow>
        </Grid>
      </Grid>

      {/* Azioni rapide con design moderno */}
      <Grow in timeout={1000}>
        <Paper 
          sx={{ 
            p: 4, 
            mb: 4,
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
            Azioni Rapide
          </Typography>
          <Grid container spacing={2}>
            {[
              { icon: <ChecklistIcon />, text: 'Nuova Checklist', to: '/diagnosi/nuova-checklist', color: '#F093FB' },
              { icon: <AddIcon />, text: 'Nuovo Intervento', to: '/progettazione/interventi', color: '#4FACFE' },
              { icon: <AnalyticsIcon />, text: 'Gestione KPI', to: '/monitoraggio/kpi', color: '#43E97B' },
              { icon: <DescriptionIcon />, text: 'Documenti AAO', to: '/progettazione/formalizzazione', color: '#FA709A' },
            ].map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Button
                  component={Link}
                  to={action.to}
                  variant="outlined"
                  fullWidth
                  startIcon={action.icon}
                  sx={{
                    py: 2,
                    borderRadius: 3,
                    borderColor: action.color,
                    color: action.color,
                    borderWidth: 2,
                    fontWeight: 600,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderWidth: 2,
                      backgroundColor: action.color,
                      color: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: `0px 8px 24px ${action.color}40`,
                    },
                  }}
                >
                  {action.text}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grow>

      {/* Ultime attività con design moderno */}
      <Grow in timeout={1100}>
        <Paper 
          sx={{ 
            p: 4,
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Ultime Attività / Notifiche
            </Typography>
            <IconButton 
              sx={{ 
                color: '#6366F1',
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                },
              }}
            >
              <AutorenewIcon />
            </IconButton>
          </Box>
          
          {alerts.length > 0 ? (
            <List sx={{ p: 0 }}>
              {alerts.slice(0, 5).map((alert, index) => (
                <ListItem 
                  key={alert.id} 
                  sx={{ 
                    bgcolor: alert.letto ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                    borderRadius: 2,
                    mb: 1,
                    border: '1px solid',
                    borderColor: alert.letto ? 'transparent' : 'rgba(99, 102, 241, 0.2)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.08)',
                      transform: 'translateX(8px)',
                    },
                  }}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      component={Link} 
                      to="/monitoraggio/alerts"
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        },
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 42 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: alert.tipo === 'allarme' 
                          ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' 
                          : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        color: 'white',
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {alert.tipo === 'allarme' ? <ErrorIcon fontSize="small" /> : <WarningIcon fontSize="small" />}
                    </Box>
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                        {alert.messaggio}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {alert.area} • {new Date(alert.data_generazione).toLocaleDateString('it-IT')}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 6,
                borderRadius: 2,
                border: '2px dashed rgba(0, 0, 0, 0.1)',
              }}
            >
              <NotificationsIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Nessuna attività recente o alert attivo
              </Typography>
            </Box>
          )}
          
          {alerts.length > 5 && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button 
                component={Link} 
                to="/monitoraggio/alerts" 
                variant="text"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  color: '#6366F1',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  },
                }}
              >
                Vedi tutti gli alert ({alerts.length})
              </Button>
            </Box>
          )}
        </Paper>
      </Grow>
    </Box>
  );
};

export default DashboardUnificata;