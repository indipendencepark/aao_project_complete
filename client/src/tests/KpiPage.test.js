import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import KpiPage from '../pages/monitoraggio/KpiPage';

// Mock dei componenti che utilizzano Chart.js
jest.mock('chart.js');
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart">Grafico a linee</div>,
  Bar: () => <div data-testid="mock-bar-chart">Grafico a barre</div>
}));

// Mock dei componenti Material-UI DatePicker
jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: function MockAdapter() {
    return {};
  }
}));

jest.mock('@mui/x-date-pickers', () => ({
  LocalizationProvider: ({ children }) => <div>{children}</div>,
  DatePicker: ({ label, onChange }) => (
    <div data-testid="mock-date-picker">
      <label>{label}</label>
      <input type="text" onChange={(e) => onChange(new Date())} />
    </div>
  )
}));

describe('KpiPage Component', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <KpiPage />
      </BrowserRouter>
    );
  });

  test('renders KPI management title', () => {
    expect(screen.getByText('Gestione KPI')).toBeInTheDocument();
  });

  test('renders KPI table with headers', () => {
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Area')).toBeInTheDocument();
    expect(screen.getByText('Frequenza')).toBeInTheDocument();
    expect(screen.getByText('Ultimo Valore')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('Stato')).toBeInTheDocument();
    expect(screen.getByText('Azioni')).toBeInTheDocument();
  });

  test('renders filter controls', () => {
    expect(screen.getByLabelText('Area')).toBeInTheDocument();
    expect(screen.getByLabelText('Frequenza')).toBeInTheDocument();
  });

  test('renders new KPI button', () => {
    expect(screen.getByText('Nuovo KPI')).toBeInTheDocument();
  });

  test('clicking on Nuovo KPI button shows the form', () => {
    fireEvent.click(screen.getByText('Nuovo KPI'));
    expect(screen.getByText('Torna alla lista')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome KPI')).toBeInTheDocument();
    expect(screen.getByLabelText('Descrizione')).toBeInTheDocument();
    expect(screen.getByLabelText('Area')).toBeInTheDocument();
    expect(screen.getByLabelText('Frequenza Rilevazione')).toBeInTheDocument();
    expect(screen.getByLabelText('Unità di Misura')).toBeInTheDocument();
    expect(screen.getByLabelText('Valore Target')).toBeInTheDocument();
    expect(screen.getByLabelText('Soglia di Attenzione')).toBeInTheDocument();
    expect(screen.getByLabelText('Soglia di Allarme')).toBeInTheDocument();
  });

  test('back button in new KPI form works', () => {
    fireEvent.click(screen.getByText('Nuovo KPI'));
    fireEvent.click(screen.getByText('Torna alla lista'));
    expect(screen.getByText('Gestione KPI')).toBeInTheDocument();
    expect(screen.queryByText('Torna alla lista')).not.toBeInTheDocument();
  });
});
