import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MonitoraggioModule from '../pages/monitoraggio/MonitoraggioModule';

jest.mock('chart.js');
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart">Grafico a linee</div>,
  Bar: () => <div data-testid="mock-bar-chart">Grafico a barre</div>,
  Pie: () => <div data-testid="mock-pie-chart">Grafico a torta</div>
}));

describe('MonitoraggioModule Component', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <MonitoraggioModule />
      </BrowserRouter>
    );
  });

  test('renders monitoraggio module title', () => {
    expect(screen.getByText('Monitoraggio Continuativo')).toBeInTheDocument();
  });

  test('renders module description', () => {
    expect(screen.getByText(/monitoraggio dei KPI/i)).toBeInTheDocument();
  });

  test('renders all main sections', () => {
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Gestione KPI')).toBeInTheDocument();
    expect(screen.getByText('Alert')).toBeInTheDocument();
    expect(screen.getByText('Analisi Scostamenti')).toBeInTheDocument();
  });

  test('renders action buttons', () => {
    expect(screen.getByText('Visualizza Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Gestisci KPI')).toBeInTheDocument();
    expect(screen.getByText('Gestisci Alert')).toBeInTheDocument();
    expect(screen.getByText('Analizza Scostamenti')).toBeInTheDocument();
  });

  test('navigation links have correct hrefs', () => {
    const dashboardButton = screen.getByText('Visualizza Dashboard').closest('a');
    const kpiButton = screen.getByText('Gestisci KPI').closest('a');
    const alertButton = screen.getByText('Gestisci Alert').closest('a');
    const scostamentiButton = screen.getByText('Analizza Scostamenti').closest('a');
    
    expect(dashboardButton).toHaveAttribute('href', '/monitoraggio/dashboard');
    expect(kpiButton).toHaveAttribute('href', '/monitoraggio/kpi');
    expect(alertButton).toHaveAttribute('href', '/monitoraggio/alerts');
    expect(scostamentiButton).toHaveAttribute('href', '/monitoraggio/scostamenti');
  });
});
