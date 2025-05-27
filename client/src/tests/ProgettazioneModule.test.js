import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProgettazioneModule from '../pages/progettazione/ProgettazioneModule';

describe('ProgettazioneModule Component', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <ProgettazioneModule />
      </BrowserRouter>
    );
  });

  test('renders progettazione module title', () => {
    expect(screen.getByText('Progettazione e Supporto all\'Implementazione')).toBeInTheDocument();
  });

  test('renders module description', () => {
    expect(screen.getByText(/definizione degli interventi/i)).toBeInTheDocument();
  });

  test('renders all main sections', () => {
    expect(screen.getByText('Interventi')).toBeInTheDocument();
    expect(screen.getByText('Piano d\'Azione')).toBeInTheDocument();
    expect(screen.getByText('Formalizzazione Assetti')).toBeInTheDocument();
  });

  test('renders action buttons', () => {
    expect(screen.getByText('Nuovo Intervento')).toBeInTheDocument();
    expect(screen.getByText('Gestisci Piano')).toBeInTheDocument();
    expect(screen.getByText('Documenti')).toBeInTheDocument();
  });

  test('navigation links have correct hrefs', () => {
    const nuovoInterventoButton = screen.getByText('Nuovo Intervento').closest('a');
    const gestisciPianoButton = screen.getByText('Gestisci Piano').closest('a');
    const documentiButton = screen.getByText('Documenti').closest('a');
    
    expect(nuovoInterventoButton).toHaveAttribute('href', '/progettazione/interventi');
    expect(gestisciPianoButton).toHaveAttribute('href', '/progettazione/piano-azione');
    expect(documentiButton).toHaveAttribute('href', '/progettazione/formalizzazione');
  });
});
