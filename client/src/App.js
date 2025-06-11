import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Typography } from '@mui/material';
import { itIT } from '@mui/material/locale';

import MainLayout from './components/layouts/MainLayout';

import DashboardUnificata from './pages/DashboardUnificata';

import DiagnosiModule from './pages/diagnosi/DiagnosiModule';
import NuovaChecklist from './pages/diagnosi/NuovaChecklist';
import ChecklistPage from './pages/diagnosi/ChecklistPage';
import GapAnalysisPage from './pages/diagnosi/GapAnalysisPage';
import ReportPage from './pages/diagnosi/ReportPage';

import ProgettazioneModule from './pages/progettazione/ProgettazioneModule';
import InterventiPage from './pages/progettazione/InterventiPage';
import PianoAzionePage from './pages/progettazione/PianoAzionePage';
import FormalizzazionePage from './pages/progettazione/FormalizzazionePage';

import MonitoraggioModule from './pages/monitoraggio/MonitoraggioModule';
import KpiPage from './pages/monitoraggio/KpiPage';
import DashboardPage from './pages/monitoraggio/DashboardPage';
import AlertsPage from './pages/monitoraggio/AlertsPage';
import ScostamentiPage from './pages/monitoraggio/ScostamentiPage';

const NotFoundPage = () => <Typography variant="h4" sx={{ mt: 4, textAlign: 'center' }}>404 - Pagina Non Trovata</Typography>;

// Tema moderno con colori vibranti e design accattivante
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366F1', // Indigo moderno
      light: '#818CF8',
      dark: '#4F46E5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#EC4899', // Pink vivace
      light: '#F472B6',
      dark: '#DB2777',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981', // Emerald
      light: '#34D399',
      dark: '#059669',
    },
    warning: {
      main: '#F59E0B', // Amber
      light: '#FCD34D',
      dark: '#D97706',
    },
    error: {
      main: '#EF4444', // Red moderno
      light: '#F87171',
      dark: '#DC2626',
    },
    info: {
      main: '#3B82F6', // Blue
      light: '#60A5FA',
      dark: '#2563EB',
    },
    background: {
      default: '#F8FAFC', // Sfondo molto chiaro
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.05)',
    '0px 8px 16px rgba(0, 0, 0, 0.05)',
    '0px 12px 24px rgba(0, 0, 0, 0.05)',
    '0px 16px 32px rgba(0, 0, 0, 0.05)',
    '0px 20px 40px rgba(0, 0, 0, 0.05)',
    '0px 24px 48px rgba(0, 0, 0, 0.06)',
    '0px 28px 56px rgba(0, 0, 0, 0.07)',
    '0px 32px 64px rgba(0, 0, 0, 0.08)',
    '0px 36px 72px rgba(0, 0, 0, 0.09)',
    '0px 40px 80px rgba(0, 0, 0, 0.10)',
    '0px 44px 88px rgba(0, 0, 0, 0.11)',
    '0px 48px 96px rgba(0, 0, 0, 0.12)',
    '0px 52px 104px rgba(0, 0, 0, 0.13)',
    '0px 56px 112px rgba(0, 0, 0, 0.14)',
    '0px 60px 120px rgba(0, 0, 0, 0.15)',
    '0px 64px 128px rgba(0, 0, 0, 0.16)',
    '0px 68px 136px rgba(0, 0, 0, 0.17)',
    '0px 72px 144px rgba(0, 0, 0, 0.18)',
    '0px 76px 152px rgba(0, 0, 0, 0.19)',
    '0px 80px 160px rgba(0, 0, 0, 0.20)',
    '0px 84px 168px rgba(0, 0, 0, 0.21)',
    '0px 88px 176px rgba(0, 0, 0, 0.22)',
    '0px 92px 184px rgba(0, 0, 0, 0.23)',
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 30px 60px rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.95rem',
          fontWeight: 500,
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.8rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
            },
            '&.Mui-focused': {
              boxShadow: '0px 4px 20px rgba(99, 102, 241, 0.15)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        },
        head: {
          backgroundColor: '#F8FAFC',
          fontWeight: 600,
          fontSize: '0.875rem',
          color: '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.04)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '4px 0px 24px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          marginBottom: 4,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.16)',
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontSize: '0.875rem',
        },
        standardSuccess: {
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
        },
        standardError: {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#DC2626',
        },
        standardWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: '#D97706',
        },
        standardInfo: {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#2563EB',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.04)',
          marginBottom: 12,
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '0 0 12px 0',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0px 20px 60px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '8px 12px',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
  },
}, itIT);

// Aggiungi stili globali per animazioni fluide
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  
  * {
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  }
  
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #F1F5F9;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #CBD5E1;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #94A3B8;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .fade-in {
    animation: fadeIn 0.5s ease-out;
  }
  
  .slide-in {
    animation: slideIn 0.5s ease-out;
  }
`;

// Inietta gli stili globali
const styleSheet = document.createElement("style");
styleSheet.innerText = globalStyles;
document.head.appendChild(styleSheet);

function App() {
  console.log("RENDER: App Component con Nested Routes");
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DashboardUnificata />} />

            <Route path="diagnosi/*" element={<DiagnosiModule />} />

            <Route path="progettazione/*" element={<ProgettazioneModule />} />

            <Route path="monitoraggio/*" element={<MonitoraggioModule />} />

             <Route path="*" element={<NotFoundPage />} />
          </Route>

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;