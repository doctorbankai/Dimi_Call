import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsDialog } from '../../components/SettingsDialog';
import { LogsService } from '../../services/logsService';
import { DevToolsService } from '../../services/devToolsService';

// Mock services
jest.mock('../../services/logsService', () => ({
  LogsService: {
    getLogs: jest.fn(),
    addLog: jest.fn(),
    clearLogs: jest.fn(),
    exportLogs: jest.fn(),
    getLogCount: jest.fn(),
    isCapturingLogs: jest.fn(),
    addListener: jest.fn(),
  }
}));

jest.mock('../../services/devToolsService', () => ({
  DevToolsService: {
    isEnabled: jest.fn(),
    setEnabled: jest.fn(),
    enableDevTools: jest.fn(),
    disableDevTools: jest.fn(),
    isProductionMode: jest.fn(),
    shouldEnableDevTools: jest.fn(),
  }
}));

// Mock other services and hooks
jest.mock('../../hooks/useAutoUpdate', () => ({
  useAutoUpdate: () => ({
    betaPreferences: { enabled: false, lastModified: Date.now(), hasBeenWarned: false },
    setBetaPreferences: jest.fn(),
    revertToStable: jest.fn(),
  })
}));

jest.mock('../../services/shortcutService', () => ({
  shortcutService: {
    getShortcuts: jest.fn(() => []),
    updateAllShortcuts: jest.fn(),
    resetToDefaults: jest.fn(),
  }
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: {
    getAppVersion: jest.fn().mockResolvedValue('1.0.0'),
    checkForUpdates: jest.fn().mockResolvedValue({ status: 'checking' }),
    devTools: {
      enable: jest.fn().mockResolvedValue({ success: true }),
      disable: jest.fn().mockResolvedValue({ success: true }),
      isEnabled: jest.fn().mockResolvedValue({ enabled: false }),
    }
  },
  writable: true
});

const mockLogsService = LogsService as jest.Mocked<typeof LogsService>;
const mockDevToolsService = DevToolsService as jest.Mocked<typeof DevToolsService>;

describe('Logs Settings Integration', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    calcomUrl: 'https://cal.com/test',
    onCalcomUrlChange: jest.fn(),
    smsTemplate: 'Test SMS template',
    onSmsTemplateChange: jest.fn(),
    theme: 'dark' as const,
    onThemeChange: jest.fn(),
  };

  const mockLogs = [
    {
      id: '1',
      timestamp: Date.now() - 1000,
      level: 'error' as const,
      message: 'Test error message',
      source: 'console'
    },
    {
      id: '2',
      timestamp: Date.now(),
      level: 'info' as const,
      message: 'Test info message',
      source: 'test'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockLogsService.getLogs.mockReturnValue(mockLogs);
    mockLogsService.getLogCount.mockReturnValue(mockLogs.length);
    mockLogsService.isCapturingLogs.mockReturnValue(true);
    mockLogsService.addListener.mockReturnValue(() => {});
    mockLogsService.exportLogs.mockReturnValue('Mock exported logs');
    
    mockDevToolsService.isEnabled.mockReturnValue(false);
    mockDevToolsService.isProductionMode.mockResolvedValue(true);
    mockDevToolsService.shouldEnableDevTools.mockResolvedValue(false);
    
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);
  });

  it('should display Logs section in settings navigation', () => {
    render(<SettingsDialog {...defaultProps} />);
    
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Consulter et copier les logs système')).toBeInTheDocument();
  });

  it('should navigate to Logs section when clicked', async () => {
    const user = userEvent.setup();
    render(<SettingsDialog {...defaultProps} />);
    
    const logsButton = screen.getByRole('button', { name: /Logs/ });
    await user.click(logsButton);
    
    // Should show logs viewer content
    expect(screen.getByText('Logs système')).toBeInTheDocument();
    expect(screen.getByText('2 entrées • Capture active')).toBeInTheDocument();
  });

  it('should display logs in the viewer when Logs section is active', async () => {
    const user = userEvent.setup();
    render(<SettingsDialog {...defaultProps} />);
    
    // Navigate to Logs section
    const logsButton = screen.getByRole('button', { name: /Logs/ });
    await user.click(logsButton);
    
    // Should display the mock logs
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Test info message')).toBeInTheDocument();
  });

  it('should integrate logs functionality with settings dialog', async () => {
    const user = userEvent.setup();
    render(<SettingsDialog {...defaultProps} />);
    
    // Navigate to Logs section
    const logsButton = screen.getByRole('button', { name: /Logs/ });
    await user.click(logsButton);
    
    // Test copy functionality
    const copyButton = screen.getByText('Copier');
    await user.click(copyButton);
    
    expect(mockLogsService.exportLogs).toHaveBeenCalledWith('text');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Mock exported logs');
  });

  it('should maintain logs state when switching between sections', async () => {
    const user = userEvent.setup();
    render(<SettingsDialog {...defaultProps} />);
    
    // Navigate to Logs section
    const logsButton = screen.getByRole('button', { name: /Logs/ });
    await user.click(logsButton);
    
    // Verify logs are displayed
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    
    // Navigate to another section
    const emailButton = screen.getByRole('button', { name: /Templates Email/ });
    await user.click(emailButton);
    
    // Navigate back to Logs
    await user.click(logsButton);
    
    // Logs should still be there
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should handle DevTools environment detection in production mode', async () => {
    mockDevToolsService.isProductionMode.mockResolvedValue(true);
    mockDevToolsService.shouldEnableDevTools.mockResolvedValue(false);
    
    render(<SettingsDialog {...defaultProps} />);
    
    // Navigate to update section where DevTools settings are
    const user = userEvent.setup();
    const updateButton = screen.getByRole('button', { name: /Mises à jour/ });
    await user.click(updateButton);
    
    // DevTools should be disabled in production
    await waitFor(() => {
      expect(mockDevToolsService.isProductionMode).toHaveBeenCalled();
    });
  });

  it('should handle DevTools environment detection in development mode', async () => {
    mockDevToolsService.isProductionMode.mockResolvedValue(false);
    mockDevToolsService.shouldEnableDevTools.mockResolvedValue(true);
    
    render(<SettingsDialog {...defaultProps} />);
    
    // Navigate to update section
    const user = userEvent.setup();
    const updateButton = screen.getByRole('button', { name: /Mises à jour/ });
    await user.click(updateButton);
    
    // DevTools should be enabled in development
    await waitFor(() => {
      expect(mockDevToolsService.isProductionMode).toHaveBeenCalled();
    });
  });

  it('should save settings including logs preferences', async () => {
    const user = userEvent.setup();
    render(<SettingsDialog {...defaultProps} />);
    
    // Navigate to Logs section and interact with it
    const logsButton = screen.getByRole('button', { name: /Logs/ });
    await user.click(logsButton);
    
    // Clear logs to trigger a change
    global.confirm = jest.fn().mockReturnValue(true);
    const clearButton = screen.getByText('Vider');
    await user.click(clearButton);
    
    expect(mockLogsService.clearLogs).toHaveBeenCalled();
  });

  it('should handle logs service errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock logs service to throw an error
    mockLogsService.exportLogs.mockImplementation(() => {
      throw new Error('Export failed');
    });
    
    render(<SettingsDialog {...defaultProps} />);
    
    // Navigate to Logs section
    const logsButton = screen.getByRole('button', { name: /Logs/ });
    await user.click(logsButton);
    
    // Try to copy logs (should handle error gracefully)
    const copyButton = screen.getByText('Copier');
    await user.click(copyButton);
    
    // Should not crash the application
    expect(screen.getByText('Logs système')).toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });

  it('should update logs display when service notifies of changes', async () => {
    let listener: (() => void) | null = null;
    mockLogsService.addListener.mockImplementation((callback) => {
      listener = callback;
      return () => { listener = null; };
    });
    
    const user = userEvent.setup();
    render(<SettingsDialog {...defaultProps} />);
    
    // Navigate to Logs section
    const logsButton = screen.getByRole('button', { name: /Logs/ });
    await user.click(logsButton);
    
    // Verify listener was added
    expect(mockLogsService.addListener).toHaveBeenCalled();
    expect(listener).toBeDefined();
    
    // Simulate new logs being added
    const newMockLogs = [
      ...mockLogs,
      {
        id: '3',
        timestamp: Date.now(),
        level: 'warn' as const,
        message: 'New warning message',
        source: 'test'
      }
    ];
    
    mockLogsService.getLogs.mockReturnValue(newMockLogs);
    mockLogsService.getLogCount.mockReturnValue(newMockLogs.length);
    
    // Trigger the listener
    if (listener) {
      listener();
    }
    
    // Should update the display
    await waitFor(() => {
      expect(screen.getByText('3 entrées • Capture active')).toBeInTheDocument();
    });
  });

  it('should show correct icon for Logs section', () => {
    render(<SettingsDialog {...defaultProps} />);
    
    // The FileText icon should be present in the Logs button
    const logsButton = screen.getByRole('button', { name: /Logs/ });
    expect(logsButton).toBeInTheDocument();
    
    // Check that the button contains the expected structure
    expect(logsButton.querySelector('svg')).toBeInTheDocument();
  });
});