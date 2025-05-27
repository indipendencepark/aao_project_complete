import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DiagnosiModule from '../pages/diagnosi/DiagnosiModule';

describe('DiagnosiModule Component', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <DiagnosiModule />
      </BrowserRouter>
    );
  });

  test('renders diagnosi module title', () => {
    expect(screen.getByText('Diagnosi e Assessment')).toBeInTheDocument();
  });

  test('renders module description', () => {
    expect(screen.getByText(/valutazione degli assetti esistenti/i)).toBeInTheDocument();
  });

  test('renders all main sections', () => {
    expect(screen.getByText('Checklist di Valutazione')).toBeInTheDocument();
    expect(screen.getByText('Gap Analysis')).toBeInTheDocument();
    expect(screen.getByText('Report Diagnostico')).toBeInTheDocument();
  });

  test('renders action buttons', () => {
    expect(screen.getByText('Nuova Checklist')).toBeInTheDocument();
    expect(screen.getByText('Visualizza Gap')).toBeInTheDocument();
    expect(screen.getByText('Genera Report')).toBeInTheDocument();
  });

  test('navigation links have correct hrefs', () => {
    const nuovaChecklistButton = screen.getByText('Nuova Checklist').closest('a');
    const visualizzaGapButton = screen.getByText('Visualizza Gap').closest('a');
    const generaReportButton = screen.getByText('Genera Report').closest('a');
    
    expect(nuovaChecklistButton).toHaveAttribute('href', '/diagnosi/nuova-checklist');
    expect(visualizzaGapButton).toHaveAttribute('href', '/diagnosi/gap-analysis');
    expect(generaReportButton).toHaveAttribute('href', '/diagnosi/report');
  });
});
