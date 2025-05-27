import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import App from '../App';

jest.mock('chart.js');
jest.mock('react-chartjs-2', () => ({
  Pie: () => <div data-testid="mock-pie-chart">Grafico a torta</div>,
  Bar: () => <div data-testid="mock-bar-chart">Grafico a barre</div>,
  Line: () => <div data-testid="mock-line-chart">Grafico a linee</div>
}));

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

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('App Integration Tests', () => {
  beforeEach(() => {

    mockNavigate.mockReset();

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  });

  test('renders main dashboard by default', () => {
    expect(screen.getByText('Dashboard Unificata AAO')).toBeInTheDocument();
    expect(screen.getByText('Stato del Sistema AAO')).toBeInTheDocument();
  });

  test('navigation between modules works correctly', async () => {

    const diagnosiLink = screen.getByText('Vai al modulo', { selector: 'button' });
    fireEvent.click(diagnosiLink);

    expect(diagnosiLink.closest('a')).toHaveAttribute('href', '/diagnosi');

    const progettazioneLink = screen.getAllByText('Vai al modulo', { selector: 'button' })[1];
    fireEvent.click(progettazioneLink);

    expect(progettazioneLink.closest('a')).toHaveAttribute('href', '/progettazione');

    const monitoraggioLink = screen.getAllByText('Vai al modulo', { selector: 'button' })[2];
    fireEvent.click(monitoraggioLink);

    expect(monitoraggioLink.closest('a')).toHaveAttribute('href', '/monitoraggio');
  });

  test('quick actions buttons have correct hrefs', () => {

    const nuovaChecklistButton = screen.getAllByText('Nuova Checklist')[1].closest('a');
    const nuovoInterventoButton = screen.getByText('Nuovo Intervento').closest('a');
    const gestioneKpiButton = screen.getByText('Gestione KPI').closest('a');
    const documentiButton = screen.getByText('Documenti AAO').closest('a');
    
    expect(nuovaChecklistButton).toHaveAttribute('href', '/diagnosi/nuova-checklist');
    expect(nuovoInterventoButton).toHaveAttribute('href', '/progettazione/nuovo-intervento');
    expect(gestioneKpiButton).toHaveAttribute('href', '/monitoraggio/kpi');
    expect(documentiButton).toHaveAttribute('href', '/progettazione/formalizzazione');
  });

  test('dashboard displays all required sections', () => {

    expect(screen.getByText('Diagnosi e Assessment')).toBeInTheDocument();
    expect(screen.getByText('Progettazione e Supporto')).toBeInTheDocument();
    expect(screen.getByText('Monitoraggio Continuativo')).toBeInTheDocument();
    expect(screen.getByText('Alert Attivi')).toBeInTheDocument();
    expect(screen.getByText('Azioni Rapide')).toBeInTheDocument();
  });

  test('dashboard displays charts correctly', () => {

    expect(screen.getAllByTestId('mock-pie-chart').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('mock-bar-chart').length).toBeGreaterThan(0);
  });
});
