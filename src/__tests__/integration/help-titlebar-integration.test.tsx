import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TitleBar } from '../../components/TitleBar';
import { Theme } from '../../types';

// Mock the auth hook
jest.mock('../../lib/auth-client', () => ({
  useSupabaseAuth: () => ({
    isAuthenticated: true,
    user: { email: 'test@example.com' }
  })
}));

// Mock the beta preferences service
jest.mock('../../services/betaPreferencesService', () => ({
  BetaPreferencesService: {
    getBetaPreferences: () => ({ enabled: false }),
    isCurrentVersionBeta: () => false
  }
}));

// Mock electron API
const mockElectronAPI = {
  platform: 'win32',
  isMaximized: jest.fn().mockResolvedValue(false),
  minimizeApp: jest.fn(),
  maximizeApp: jest.fn(),
  closeApp: jest.fn()
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
});

// Mock package.json
jest.mock('../../../package.json', () => ({
  version: '1.0.0'
}));

describe('TitleBar Help Integration', () => {
  const defaultProps = {
    theme: Theme.Dark,
    onSettingsClick: jest.fn(),
    userName: 'Test User',
    userStatus: 'online' as const,
    adbConnectionState: { isConnected: false, error: null },
    adbConnecting: false,
    activeCallContactId: null,
    onAdbClick: jest.fn(),
    updateState: {
      checking: false,
      available: false,
      downloading: false,
      downloaded: false,
      progress: 0,
      updateInfo: null
    },
    onUpdateClick: jest.fn(),
    onUpdateConfirmationOpen: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders help button in Windows layout', async () => {
    render(<TitleBar {...defaultProps} />);
    
    // Wait for electron check to complete
    await screen.findByText('DimiCall');
    
    const helpButton = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    expect(helpButton).toBeInTheDocument();
    expect(helpButton).toHaveAttribute('title', 'Aide et tutoriel');
  });

  it('renders help button in macOS layout', async () => {
    mockElectronAPI.platform = 'darwin';
    
    render(<TitleBar {...defaultProps} />);
    
    // Wait for electron check to complete
    await screen.findByText('DimiCall');
    
    const helpButton = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    expect(helpButton).toBeInTheDocument();
  });

  it('positions help button correctly between ticket and settings buttons', async () => {
    render(<TitleBar {...defaultProps} />);
    
    await screen.findByText('DimiCall');
    
    const ticketButton = screen.getByRole('button', { name: /envoyer un ticket/i });
    const helpButton = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    const settingsButton = screen.getByRole('button', { name: /réglages/i });
    
    expect(ticketButton).toBeInTheDocument();
    expect(helpButton).toBeInTheDocument();
    expect(settingsButton).toBeInTheDocument();
    
    // Check order in DOM
    const buttonContainer = helpButton.parentElement;
    const buttons = Array.from(buttonContainer?.children || []);
    const ticketIndex = buttons.indexOf(ticketButton);
    const helpIndex = buttons.indexOf(helpButton);
    const settingsIndex = buttons.indexOf(settingsButton);
    
    expect(helpIndex).toBeGreaterThan(ticketIndex);
    expect(settingsIndex).toBeGreaterThan(helpIndex);
  });

  it('opens help dialog when help button is clicked', async () => {
    render(<TitleBar {...defaultProps} />);
    
    await screen.findByText('DimiCall');
    
    const helpButton = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    fireEvent.click(helpButton);
    
    // Help dialog should open
    expect(screen.getByText('Aide DimiCall')).toBeInTheDocument();
    expect(screen.getByText('Guide complet d\'utilisation de l\'application')).toBeInTheDocument();
  });

  it('applies consistent styling with other title bar buttons', async () => {
    render(<TitleBar {...defaultProps} />);
    
    await screen.findByText('DimiCall');
    
    const ticketButton = screen.getByRole('button', { name: /envoyer un ticket/i });
    const helpButton = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    const settingsButton = screen.getByRole('button', { name: /réglages/i });
    
    // All buttons should have similar classes
    const expectedClasses = ['p-2', 'rounded', 'transition-all', 'duration-200'];
    
    expectedClasses.forEach(className => {
      expect(ticketButton).toHaveClass(className);
      expect(helpButton).toHaveClass(className);
      expect(settingsButton).toHaveClass(className);
    });
  });

  it('respects theme changes', async () => {
    const { rerender } = render(<TitleBar {...defaultProps} theme={Theme.Dark} />);
    
    await screen.findByText('DimiCall');
    
    let helpButton = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    expect(helpButton).toBeInTheDocument();
    
    rerender(<TitleBar {...defaultProps} theme={Theme.Light} />);
    
    helpButton = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    expect(helpButton).toBeInTheDocument();
  });

  it('maintains proper pointer events and app region styling', async () => {
    render(<TitleBar {...defaultProps} />);
    
    await screen.findByText('DimiCall');
    
    const helpButton = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    const buttonContainer = helpButton.parentElement;
    
    expect(buttonContainer).toHaveClass('pointer-events-auto');
    expect(buttonContainer).toHaveStyle({ WebkitAppRegion: 'no-drag' });
  });

  it('works when settings callback is not provided', async () => {
    render(<TitleBar {...defaultProps} onSettingsClick={undefined} />);
    
    await screen.findByText('DimiCall');
    
    // Help button should not be rendered when settings section is not shown
    expect(screen.queryByRole('button', { name: /ouvrir l'aide et le tutoriel/i })).not.toBeInTheDocument();
  });

  it('handles help dialog close correctly', async () => {
    render(<TitleBar {...defaultProps} />);
    
    await screen.findByText('DimiCall');
    
    const helpButton = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    fireEvent.click(helpButton);
    
    // Dialog should be open
    expect(screen.getByText('Aide DimiCall')).toBeInTheDocument();
    
    // Close dialog with Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Dialog should be closed
    expect(screen.queryByText('Aide DimiCall')).not.toBeInTheDocument();
  });

  it('maintains help button functionality with different update states', async () => {
    const propsWithUpdate = {
      ...defaultProps,
      updateState: {
        checking: false,
        available: true,
        downloading: false,
        downloaded: true,
        progress: 100,
        updateInfo: { version: '1.1.0' }
      }
    };
    
    render(<TitleBar {...propsWithUpdate} />);
    
    await screen.findByText('DimiCall');
    
    const helpButton = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    expect(helpButton).toBeInTheDocument();
    
    fireEvent.click(helpButton);
    expect(screen.getByText('Aide DimiCall')).toBeInTheDocument();
  });

  it('maintains help button functionality with ADB connected', async () => {
    const propsWithAdb = {
      ...defaultProps,
      adbConnectionState: { isConnected: true, error: null }
    };
    
    render(<TitleBar {...propsWithAdb} />);
    
    await screen.findByText('DimiCall');
    
    const helpButton = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    expect(helpButton).toBeInTheDocument();
    
    fireEvent.click(helpButton);
    expect(screen.getByText('Aide DimiCall')).toBeInTheDocument();
  });
});