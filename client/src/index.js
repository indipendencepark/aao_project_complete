import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// Importa provider localizzazione e adapter
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'; // <-- QUESTA RIGA
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';       // <-- E QUESTA RIGA
import { it } from 'date-fns/locale'; // Importa locale italiano

const root = ReactDOM.createRoot(document.getElementById('root'));
// Da così:
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

// A così:
root.render(
    <React.StrictMode>
      {/* Wrappa l'intera App */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
        <App />
      </LocalizationProvider>
    </React.StrictMode>
  );
reportWebVitals();