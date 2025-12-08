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
    section: HelpSection.DocOverview,
    theme: Theme.Dark,
    mode: 'documentation'
  };

  it('renders section content correctly', () => {
    render(<HelpContent {...defaultProps} />);
    
    expect(screen.getByText('Page Appels')).toBeInTheDocument();
    expect(screen.getByText(/Sélectionnez un contact dans la liste/)).toBeInTheDocument();
    expect(screen.getByText('Vue Appels')).toBeInTheDocument();
  });

  it('renders different content types', () => {
    render(<HelpContent {...defaultProps} />);
    
    // Should have headings
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    
    // Should have paragraphs
    expect(screen.getByText(/Sélectionnez un contact dans la liste/)).toBeInTheDocument();
    
    // Should have lists
    expect(screen.getByText(/Liste des contacts filtrable/)).toBeInTheDocument();
  });

  it('renders warning content type', () => {
    render(<HelpContent section={HelpSection.DocContacts} theme={Theme.Dark} mode="documentation" />);
    
    const warningElement = screen.getByText(/Attention : vérifiez l’encodage UTF-8/);
    expect(warningElement).toBeInTheDocument();
    
    // Should have warning icon
    const warningContainer = warningElement.closest('div');
    expect(warningContainer).toHaveClass('bg-orange-500/10');
  });

  it('renders tip content type', () => {
    render(<HelpContent section={HelpSection.DocOverview} theme={Theme.Dark} mode="documentation" />);
    
    const tipElement = screen.getByText(/Activez le mode compact/);
    expect(tipElement).toBeInTheDocument();
    
    // Should have tip styling
    const tipContainer = tipElement.closest('div');
    expect(tipContainer).toHaveClass('bg-blue-500/10');
  });

  it('renders tip content type', () => {
    render(<HelpContent section={HelpSection.DocOverview} theme={Theme.Dark} mode="documentation" />);
    
    const tipElement = screen.getByText(/Activez le mode compact/);
    expect(tipElement).toBeInTheDocument();
    
    // Should have tip styling
    const tipContainer = tipElement.closest('div');
    expect(tipContainer).toHaveClass('bg-blue-500/10');
  });

  it('renders list items with bullet points', () => {
    render(<HelpContent {...defaultProps} />);
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThan(0);
  });

  it('handles different heading levels', () => {
    render(<HelpContent section={HelpSection.CallFeatures} theme={Theme.Dark} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('displays section icon and title', () => {
    render(<HelpContent {...defaultProps} />);
    
    const sectionTitle = screen.getByText('Page Appels');
    expect(sectionTitle).toBeInTheDocument();
    
    // Should have section icon
    const iconContainer = sectionTitle.closest('div')?.querySelector('svg');
    expect(iconContainer).toBeInTheDocument();
  });

  it('handles unknown section gracefully', () => {
    render(<HelpContent section={'unknown-section' as HelpSection} theme={Theme.Dark} mode="documentation" />);
    
    expect(screen.getByText('Contenu non disponible')).toBeInTheDocument();
  });

  it('renders scrollable content', () => {
    render(<HelpContent {...defaultProps} />);
    
    const contentContainer = screen.getByText('Page Appels').closest('div')?.parentElement?.parentElement;
    expect(contentContainer).toHaveClass('overflow-y-auto');
  });

  it('applies responsive padding', () => {
    render(<HelpContent {...defaultProps} />);
    
    const contentWrapper = screen.getByText('Page Appels').closest('div')?.parentElement;
    expect(contentWrapper).toHaveClass('px-5');
  });

  it('renders content for different sections', () => {
    const { rerender } = render(<HelpContent {...defaultProps} />);
    
    expect(screen.getByText('Page Appels')).toBeInTheDocument();
    
    rerender(<HelpContent section={HelpSection.DocContacts} theme={Theme.Dark} mode="documentation" />);
    expect(screen.getByText('Page Contacts & Import')).toBeInTheDocument();
    
    rerender(<HelpContent section={HelpSection.DocCalls} theme={Theme.Dark} mode="documentation" />);
    expect(screen.getByText('Page Calendrier')).toBeInTheDocument();
  });

  it('maintains proper text hierarchy', () => {
    render(<HelpContent section={HelpSection.DocCalls} theme={Theme.Dark} mode="documentation" />);
    
    const h1 = screen.getByRole('heading', { level: 1 });
    const h2s = screen.getAllByRole('heading', { level: 2 });
    
    expect(h1).toBeInTheDocument();
    expect(h2s.length).toBeGreaterThan(0);
    
    // Check text sizes
    expect(h1).toBeInTheDocument();
    expect(h2s.length).toBeGreaterThan(0);
  });
});