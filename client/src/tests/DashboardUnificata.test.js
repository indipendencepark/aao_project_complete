import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardUnificata from '../pages/DashboardUnificata';

jest.mock('chart.js');
jest.mock('react-chartjs-2', () => ({
  Pie: () => <div data-testid="mock-pie-chart">Grafico a torta</div>,
  Bar: () => <div data-testid="mock-bar-chart">Grafico a barre</div>,
  Line: () => <div data-testid="mock-line-chart">Grafico a linee</div>
}));

describe('DashboardUnificata Component', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <DashboardUnificata />
      </BrowserRouter>
    );
  });

  test('renders dashboard title', () => {
    expect(screen.getByText('Dashboard Unificata AAO')).toBeInTheDocument();
  });

  test('renders all three module sections', () => {
    expect(screen.getByText('Diagnosi e Assessment')).toBeInTheDocument();
    expect(screen.getByText('Progettazione e Supporto')).toBeInTheDocument();
    expect(screen.getByText('Monitoraggio Continuativo')).toBeInTheDocument();
  });

  test('renders system status section', () => {
    expect(screen.getByText('Stato del Sistema AAO')).toBeInTheDocument();
    expect(screen.getByText('Fase di Diagnosi')).toBeInTheDocument();
    expect(screen.getByText('Fase di Progettazione')).toBeInTheDocument();
    expect(screen.getByText('Fase di Monitoraggio')).toBeInTheDocument();
    expect(screen.getByText('Alert Attivi')).toBeInTheDocument();
  });

  test('renders quick actions section', () => {
    expect(screen.getByText('Azioni Rapide')).toBeInTheDocument();
    expect(screen.getByText('Nuova Checklist')).toBeInTheDocument();
    expect(screen.getByText('Nuovo Intervento')).toBeInTheDocument();
    expect(screen.getByText('Gestione KPI')).toBeInTheDocument();
    expect(screen.getByText('Documenti AAO')).toBeInTheDocument();
  });

  test('renders charts', () => {
    expect(screen.getAllByTestId('mock-pie-chart').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('mock-bar-chart').length).toBeGreaterThan(0);
  });

  test('navigation buttons work correctly', () => {
    const diagnosiButton = screen.getByText('Vai al modulo', { selector: 'button' });
    expect(diagnosiButton).toBeInTheDocument();

    expect(diagnosiButton.closest('a')).toHaveAttribute('href', '/diagnosi');
  });
});
