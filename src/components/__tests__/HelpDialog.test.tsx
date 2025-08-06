import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HelpDialog from '../HelpDialog';
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
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the child components
jest.mock('../HelpSidebar', () => {
  return function MockHelpSidebar({ 
    activeSection, 
    onSectionChange 
  }: { 
    activeSection: HelpSection; 
    onSectionChange: (section: HelpSection) => void;
  }) {
    return (
      <div data-testid="help-sidebar">
        <div>Active: {activeSection}</div>
        <button onClick={() => onSectionChange(HelpSection.ContactManagement)}>
          Change Section
        </button>
      </div>
    );
  };
});

jest.mock('../HelpContent', () => {
  return function MockHelpContent({ section }: { section: HelpSection }) {
    return <div data-testid="help-content">Content for: {section}</div>;
  };
});

describe('HelpDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    theme: Theme.Dark
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<HelpDialog {...defaultProps} />);
    
    expect(screen.getByText('Aide DimiCall')).toBeInTheDocument();
    expect(screen.getByText('Guide complet d\'utilisation de l\'application')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<HelpDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Aide DimiCall')).not.toBeInTheDocument();
  });

  it('renders sidebar and content components', () => {
    render(<HelpDialog {...defaultProps} />);
    
    expect(screen.getByTestId('help-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('help-content')).toBeInTheDocument();
  });

  it('starts with Introduction section active', () => {
    render(<HelpDialog {...defaultProps} />);
    
    expect(screen.getByText('Active: introduction')).toBeInTheDocument();
    expect(screen.getByText('Content for: introduction')).toBeInTheDocument();
  });

  it('handles section changes', () => {
    render(<HelpDialog {...defaultProps} />);
    
    const changeSectionButton = screen.getByText('Change Section');
    fireEvent.click(changeSectionButton);
    
    expect(screen.getByText('Active: contact-management')).toBeInTheDocument();
    expect(screen.getByText('Content for: contact-management')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<HelpDialog {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Fermer l\'aide');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handles Escape key press', () => {
    const onClose = jest.fn();
    render(<HelpDialog {...defaultProps} onClose={onClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not handle Escape when dialog is closed', () => {
    const onClose = jest.fn();
    render(<HelpDialog {...defaultProps} isOpen={false} onClose={onClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('resets to Introduction when dialog opens', () => {
    const { rerender } = render(<HelpDialog {...defaultProps} isOpen={false} />);
    
    // Change section while closed (shouldn't be visible)
    rerender(<HelpDialog {...defaultProps} isOpen={true} />);
    
    expect(screen.getByText('Active: introduction')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<HelpDialog {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'help-dialog-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'help-dialog-description');
    
    expect(screen.getByText('Aide DimiCall')).toHaveAttribute('id', 'help-dialog-title');
    expect(screen.getByText('Guide complet d\'utilisation de l\'application')).toHaveAttribute('id', 'help-dialog-description');
  });

  it('displays current section in footer', () => {
    render(<HelpDialog {...defaultProps} />);
    
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    
    // Change section
    const changeSectionButton = screen.getByText('Change Section');
    fireEvent.click(changeSectionButton);
    
    expect(screen.getByText('Contact Management')).toBeInTheDocument();
  });

  it('renders footer with proper information', () => {
    render(<HelpDialog {...defaultProps} />);
    
    expect(screen.getByText('DimiCall - Guide d\'utilisation')).toBeInTheDocument();
    expect(screen.getByText('Utilisez Échap pour fermer')).toBeInTheDocument();
    expect(screen.getByText('Section :')).toBeInTheDocument();
  });
});