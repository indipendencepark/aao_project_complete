import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Typography } from '@mui/material'; // Aggiunto Typography per NotFound
import { itIT } from '@mui/material/locale';

// Layout
import MainLayout from './components/layouts/MainLayout';

// Pagine (Importa solo quelle che definisci nelle rotte sotto)
import DashboardUnificata from './pages/DashboardUnificata';

// Modulo Diagnosi
import DiagnosiModule from './pages/diagnosi/DiagnosiModule';
import NuovaChecklist from './pages/diagnosi/NuovaChecklist';
import ChecklistPage from './pages/diagnosi/ChecklistPage';
import GapAnalysisPage from './pages/diagnosi/GapAnalysisPage';
import ReportPage from './pages/diagnosi/ReportPage';

// Modulo Progettazione
import ProgettazioneModule from './pages/progettazione/ProgettazioneModule';
import InterventiPage from './pages/progettazione/InterventiPage';
import PianoAzionePage from './pages/progettazione/PianoAzionePage';
import FormalizzazionePage from './pages/progettazione/FormalizzazionePage';

// Modulo Monitoraggio
import MonitoraggioModule from './pages/monitoraggio/MonitoraggioModule';
import KpiPage from './pages/monitoraggio/KpiPage';
import DashboardPage from './pages/monitoraggio/DashboardPage'; // NB: Nome simile a DashboardUnificata
import AlertsPage from './pages/monitoraggio/AlertsPage';
import ScostamentiPage from './pages/monitoraggio/ScostamentiPage';

// Componente semplice per rotte non trovate
const NotFoundPage = () => <Typography variant="h4" sx={{ mt: 4, textAlign: 'center' }}>404 - Pagina Non Trovata</Typography>;


// Tema personalizzato (come prima)
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
      // Dentro la funzione App() in App.js
// ...
      <Router>
        <Routes>
          {/* Rotta Padre con il Layout */}
          <Route path="/" element={<MainLayout />}>
            {/* Rotte Figlie */}
            <Route index element={<DashboardUnificata />} />

            {/* Modulo Diagnosi */}
            <Route path="diagnosi/*" element={<DiagnosiModule />} /> {/* <-- Aggiunto /* */}

            {/* Modulo Progettazione */}
            <Route path="progettazione/*" element={<ProgettazioneModule />} /> {/* <-- Aggiunto /* */}

            {/* Modulo Monitoraggio */}
            <Route path="monitoraggio/*" element={<MonitoraggioModule />} /> {/* <-- Aggiunto /* */}

             {/* Rotta per path non trovati */}
             <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Altre rotte fuori MainLayout (es. /login) */}

        </Routes>
      </Router>
// ...
    </ThemeProvider>
  );
}

export default App;