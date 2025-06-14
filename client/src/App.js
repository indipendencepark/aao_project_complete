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

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#f50057' },
    success: { main: '#4caf50' },
    warning: { main: '#ff9800' },
    error: { main: '#f44336' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: { styleOverrides: { root: { borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}},
    MuiPaper: { styleOverrides: { root: { borderRadius: 8 }}},
    MuiButton: { styleOverrides: { root: { borderRadius: 8, textTransform: 'none' }}},
  },
}, itIT);

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