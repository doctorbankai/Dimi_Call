import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HelpSidebar from '../HelpSidebar';
import { Theme } from '../../types';
import { HelpSection } from '../../types/help';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

describe('HelpSidebar', () => {
  const defaultProps = {
    activeSection: HelpSection.Introduction,
    onSectionChange: jest.fn(),
    theme: Theme.Dark
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all help sections', () => {
    render(<HelpSidebar {...defaultProps} />);
    
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Gestion des contacts')).toBeInTheDocument();
    expect(screen.getByText('Fonctionnalités d\'appel')).toBeInTheDocument();
    expect(screen.getByText('Outils et actions')).toBeInTheDocument();
    expect(screen.getByText('Erreurs fréquentes')).toBeInTheDocument();
  });

  it('highlights the active section', () => {
    render(<HelpSidebar {...defaultProps} activeSection={HelpSection.ContactManagement} />);
    
    const activeButton = screen.getByRole('tab', { selected: true });
    expect(activeButton).toHaveTextContent('Gestion des contacts');
    expect(activeButton).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onSectionChange when a section is clicked', () => {
    const onSectionChange = jest.fn();
    render(<HelpSidebar {...defaultProps} onSectionChange={onSectionChange} />);
    
    const contactManagementButton = screen.getByText('Gestion des contacts');
    fireEvent.click(contactManagementButton);
    
    expect(onSectionChange).toHaveBeenCalledWith(HelpSection.ContactManagement);
  });

  it('handles keyboard navigation with arrow keys', () => {
    const onSectionChange = jest.fn();
    render(<HelpSidebar {...defaultProps} onSectionChange={onSectionChange} />);
    
    const activeButton = screen.getByRole('tab', { selected: true });
    activeButton.focus();
    
    // Arrow down should move to next section
    fireEvent.keyDown(activeButton, { key: 'ArrowDown' });
    
    expect(onSectionChange).toHaveBeenCalledWith(HelpSection.ContactManagement);
  });

  it('handles keyboard navigation with arrow up', () => {
    const onSectionChange = jest.fn();
    render(<HelpSidebar {...defaultProps} activeSection={HelpSection.ContactManagement} onSectionChange={onSectionChange} />);
    
    const activeButton = screen.getByRole('tab', { selected: true });
    activeButton.focus();
    
    // Arrow up should move to previous section
    fireEvent.keyDown(activeButton, { key: 'ArrowUp' });
    
    expect(onSectionChange).toHaveBeenCalledWith(HelpSection.Introduction);
  });

  it('handles Home key to go to first section', () => {
    const onSectionChange = jest.fn();
    render(<HelpSidebar {...defaultProps} activeSection={HelpSection.Settings} onSectionChange={onSectionChange} />);
    
    const activeButton = screen.getByRole('tab', { selected: true });
    activeButton.focus();
    
    fireEvent.keyDown(activeButton, { key: 'Home' });
    
    expect(onSectionChange).toHaveBeenCalledWith(HelpSection.Introduction);
  });

  it('handles End key to go to last section', () => {
    const onSectionChange = jest.fn();
    render(<HelpSidebar {...defaultProps} onSectionChange={onSectionChange} />);
    
    const activeButton = screen.getByRole('tab', { selected: true });
    activeButton.focus();
    
    fireEvent.keyDown(activeButton, { key: 'End' });
    
    expect(onSectionChange).toHaveBeenCalledWith(HelpSection.CommonErrors);
  });

  it('handles Enter key press on sections', () => {
    const onSectionChange = jest.fn();
    render(<HelpSidebar {...defaultProps} onSectionChange={onSectionChange} />);
    
    const contactManagementButton = screen.getByText('Gestion des contacts');
    fireEvent.keyDown(contactManagementButton, { key: 'Enter' });
    
    expect(onSectionChange).toHaveBeenCalledWith(HelpSection.ContactManagement);
  });

  it('handles Space key press on sections', () => {
    const onSectionChange = jest.fn();
    render(<HelpSidebar {...defaultProps} onSectionChange={onSectionChange} />);
    
    const contactManagementButton = screen.getByText('Gestion des contacts');
    fireEvent.keyDown(contactManagementButton, { key: ' ' });
    
    expect(onSectionChange).toHaveBeenCalledWith(HelpSection.ContactManagement);
  });

  it('displays section descriptions', () => {
    render(<HelpSidebar {...defaultProps} />);
    
    expect(screen.getByText('Découvrez DimiCall et ses fonctionnalités principales')).toBeInTheDocument();
    expect(screen.getByText('Import, export et manipulation des contacts')).toBeInTheDocument();
  });

  it('shows keyboard navigation hint', () => {
    render(<HelpSidebar {...defaultProps} />);
    
    expect(screen.getByText(/Navigation :/)).toBeInTheDocument();
    expect(screen.getByText(/Utilisez les flèches ↑↓ pour naviguer/)).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<HelpSidebar {...defaultProps} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Sections d\'aide');
    
    const tabs = screen.getAllByRole('tab');
    tabs.forEach(tab => {
      expect(tab).toHaveAttribute('aria-controls');
      expect(tab).toHaveAttribute('aria-selected');
    });
  });

  it('sets correct tabIndex for active and inactive sections', () => {
    render(<HelpSidebar {...defaultProps} activeSection={HelpSection.Introduction} />);
    
    const activeTab = screen.getByRole('tab', { selected: true });
    expect(activeTab).toHaveAttribute('tabIndex', '0');
    
    const inactiveTabs = screen.getAllByRole('tab').filter(tab => tab.getAttribute('aria-selected') === 'false');
    inactiveTabs.forEach(tab => {
      expect(tab).toHaveAttribute('tabIndex', '-1');
    });
  });

  it('renders section icons', () => {
    render(<HelpSidebar {...defaultProps} />);
    
    const buttons = screen.getAllByRole('tab');
    buttons.forEach(button => {
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });
});