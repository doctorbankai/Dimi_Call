import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HelpContent from '../HelpContent';
import { Theme } from '../../types';
import { HelpSection } from '../../types/help';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';

describe('HelpContent', () => {
  const defaultProps = {
    section: HelpSection.Introduction,
    theme: Theme.Dark
  };

  it('renders section content correctly', () => {
    render(<HelpContent {...defaultProps} />);
    
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Découvrez DimiCall et ses fonctionnalités principales')).toBeInTheDocument();
    expect(screen.getByText('Bienvenue dans DimiCall')).toBeInTheDocument();
  });

  it('renders different content types', () => {
    render(<HelpContent {...defaultProps} />);
    
    // Should have headings
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    
    // Should have paragraphs
    expect(screen.getByText(/DimiCall est une application de gestion de contacts/)).toBeInTheDocument();
    
    // Should have lists
    expect(screen.getByText(/Gestion complète des contacts avec import\/export/)).toBeInTheDocument();
  });

  it('renders warning content type', () => {
    render(<HelpContent section={HelpSection.ContactManagement} theme={Theme.Dark} />);
    
    const warningElement = screen.getByText(/Attention : La suppression de contacts est définitive/);
    expect(warningElement).toBeInTheDocument();
    
    // Should have warning icon
    const warningContainer = warningElement.closest('div');
    expect(warningContainer).toHaveClass('bg-orange-500/10');
  });

  it('renders tip content type', () => {
    render(<HelpContent section={HelpSection.Introduction} theme={Theme.Dark} />);
    
    const tipElement = screen.getByText(/Conseil : Commencez par importer votre liste de contacts/);
    expect(tipElement).toBeInTheDocument();
    
    // Should have tip styling
    const tipContainer = tipElement.closest('div');
    expect(tipContainer).toHaveClass('bg-blue-500/10');
  });

  it('renders tip content type', () => {
    render(<HelpContent section={HelpSection.Introduction} theme={Theme.Dark} />);
    
    const tipElement = screen.getByText(/Conseil : Commencez par importer votre liste de contacts/);
    expect(tipElement).toBeInTheDocument();
    
    // Should have tip styling
    const tipContainer = tipElement.closest('div');
    expect(tipContainer).toHaveClass('bg-blue-500/10');
  });

  it('renders list items with bullet points', () => {
    render(<HelpContent {...defaultProps} />);
    
    const listItems = screen.getAllByText(/•/);
    expect(listItems.length).toBeGreaterThan(0);
  });

  it('handles different heading levels', () => {
    render(<HelpContent section={HelpSection.CallFeatures} theme={Theme.Dark} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('displays section icon and title', () => {
    render(<HelpContent {...defaultProps} />);
    
    const sectionTitle = screen.getByText('Introduction');
    expect(sectionTitle).toBeInTheDocument();
    
    // Should have section icon
    const iconContainer = sectionTitle.closest('div')?.querySelector('svg');
    expect(iconContainer).toBeInTheDocument();
  });

  it('handles unknown section gracefully', () => {
    render(<HelpContent section={'unknown-section' as HelpSection} theme={Theme.Dark} />);
    
    expect(screen.getByText('Contenu non disponible')).toBeInTheDocument();
  });

  it('renders scrollable content', () => {
    render(<HelpContent {...defaultProps} />);
    
    const contentContainer = screen.getByText('Introduction').closest('div')?.parentElement?.parentElement;
    expect(contentContainer).toHaveClass('overflow-y-auto');
  });

  it('applies responsive padding', () => {
    render(<HelpContent {...defaultProps} />);
    
    const contentWrapper = screen.getByText('Introduction').closest('div')?.parentElement;
    expect(contentWrapper).toHaveClass('p-6', 'sm:p-6', 'p-4');
  });

  it('renders content for different sections', () => {
    const { rerender } = render(<HelpContent {...defaultProps} />);
    
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    
    rerender(<HelpContent section={HelpSection.ContactManagement} theme={Theme.Dark} />);
    expect(screen.getByText('Gestion des contacts')).toBeInTheDocument();
    
    rerender(<HelpContent section={HelpSection.CallFeatures} theme={Theme.Dark} />);
    expect(screen.getByText('Fonctionnalités d\'appel')).toBeInTheDocument();
  });

  it('maintains proper text hierarchy', () => {
    render(<HelpContent section={HelpSection.CallFeatures} theme={Theme.Dark} />);
    
    const h1 = screen.getByRole('heading', { level: 1 });
    const h2s = screen.getAllByRole('heading', { level: 2 });
    
    expect(h1).toBeInTheDocument();
    expect(h2s.length).toBeGreaterThan(0);
    
    // Check text sizes
    expect(h1).toHaveClass('text-2xl');
    h2s.forEach(h2 => {
      expect(h2).toHaveClass('text-xl');
    });
  });
});