import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogsViewer } from '../LogsViewer';
import { LogsService } from '../../services/logsService';

// Mock LogsService
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

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock confirm
global.confirm = jest.fn();

const mockLogsService = LogsService as jest.Mocked<typeof LogsService>;

describe('LogsViewer', () => {
  const mockLogs = [
    {
      id: '1',
      timestamp: Date.now() - 1000,
      level: 'error' as const,
      message: 'Test error message',
      source: 'console',
      stack: 'Error stack trace'
    },
    {
      id: '2',
      timestamp: Date.now() - 500,
      level: 'warn' as const,
      message: 'Test warning message',
      source: 'console'
    },
    {
      id: '3',
      timestamp: Date.now(),
      level: 'info' as const,
      message: 'Test info message',
      source: 'test'
    }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    mockLogsService.getLogs.mockReturnValue(mockLogs);
    mockLogsService.getLogCount.mockReturnValue(mockLogs.length);
    mockLogsService.isCapturingLogs.mockReturnValue(true);
    mockLogsService.addListener.mockReturnValue(() => {});
    mockLogsService.exportLogs.mockReturnValue('Mock exported logs');
    
    // Mock navigator.clipboard
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);
  });

  it('should render logs viewer with header', () => {
    render(<LogsViewer />);
    
    expect(screen.getByText('Logs système')).toBeInTheDocument();
    expect(screen.getByText('3 entrées • Capture active')).toBeInTheDocument();
  });

  it('should display logs in the list', () => {
    render(<LogsViewer />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Test warning message')).toBeInTheDocument();
    expect(screen.getByText('Test info message')).toBeInTheDocument();
  });

  it('should show log levels with correct styling', () => {
    render(<LogsViewer />);
    
    expect(screen.getByText('ERROR')).toBeInTheDocument();
    expect(screen.getByText('WARN')).toBeInTheDocument();
    expect(screen.getByText('INFO')).toBeInTheDocument();
  });

  it('should show stack trace in expandable details', () => {
    render(<LogsViewer />);
    
    const stackTraceToggle = screen.getByText('Stack trace');
    expect(stackTraceToggle).toBeInTheDocument();
    
    fireEvent.click(stackTraceToggle);
    expect(screen.getByText('Error stack trace')).toBeInTheDocument();
  });

  it('should filter logs by search term', async () => {
    const user = userEvent.setup();
    render(<LogsViewer />);
    
    // Open filters
    const filtersButton = screen.getByText('Filtres');
    await user.click(filtersButton);
    
    // Search for "error"
    const searchInput = screen.getByPlaceholderText('Rechercher dans les logs...');
    await user.type(searchInput, 'error');
    
    // Should call getLogs with search filter
    await waitFor(() => {
      expect(mockLogsService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          searchTerm: 'error'
        })
      );
    });
  });

  it('should filter logs by level', async () => {
    const user = userEvent.setup();
    render(<LogsViewer />);
    
    // Open filters
    const filtersButton = screen.getByText('Filtres');
    await user.click(filtersButton);
    
    // Click on error level filter
    const errorFilter = screen.getByText('Erreur');
    await user.click(errorFilter);
    
    // Should update the selected levels
    await waitFor(() => {
      expect(mockLogsService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          levels: expect.not.arrayContaining(['error'])
        })
      );
    });
  });

  it('should copy logs to clipboard', async () => {
    const user = userEvent.setup();
    render(<LogsViewer />);
    
    const copyButton = screen.getByText('Copier');
    await user.click(copyButton);
    
    expect(mockLogsService.exportLogs).toHaveBeenCalledWith('text');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Mock exported logs');
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Copié !')).toBeInTheDocument();
    });
  });

  it('should export logs as file', async () => {
    const user = userEvent.setup();
    
    // Mock document.createElement and appendChild
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation();
    const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation();
    
    render(<LogsViewer />);
    
    const exportButton = screen.getByText('Exporter');
    await user.click(exportButton);
    
    expect(mockLogsService.exportLogs).toHaveBeenCalledWith('text');
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    
    // Cleanup
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('should clear logs with confirmation', async () => {
    const user = userEvent.setup();
    (global.confirm as jest.Mock).mockReturnValue(true);
    
    render(<LogsViewer />);
    
    const clearButton = screen.getByText('Vider');
    await user.click(clearButton);
    
    expect(global.confirm).toHaveBeenCalledWith('Êtes-vous sûr de vouloir supprimer tous les logs ?');
    expect(mockLogsService.clearLogs).toHaveBeenCalled();
  });

  it('should not clear logs if user cancels confirmation', async () => {
    const user = userEvent.setup();
    (global.confirm as jest.Mock).mockReturnValue(false);
    
    render(<LogsViewer />);
    
    const clearButton = screen.getByText('Vider');
    await user.click(clearButton);
    
    expect(global.confirm).toHaveBeenCalled();
    expect(mockLogsService.clearLogs).not.toHaveBeenCalled();
  });

  it('should disable buttons when no logs are available', () => {
    mockLogsService.getLogs.mockReturnValue([]);
    mockLogsService.getLogCount.mockReturnValue(0);
    
    render(<LogsViewer />);
    
    expect(screen.getByText('Copier')).toBeDisabled();
    expect(screen.getByText('Exporter')).toBeDisabled();
    expect(screen.getByText('Vider')).toBeDisabled();
  });

  it('should show empty state when no logs match filters', () => {
    mockLogsService.getLogs.mockReturnValue([]);
    
    render(<LogsViewer />);
    
    expect(screen.getByText('Aucun log à afficher')).toBeInTheDocument();
    expect(screen.getByText('Aucun log ne correspond aux filtres')).toBeInTheDocument();
  });

  it('should show log counts by level', () => {
    render(<LogsViewer />);
    
    // Should show colored dots with counts
    const logCountsSection = screen.getByText('3 logs affichés sur 3').closest('div');
    expect(logCountsSection).toBeInTheDocument();
  });

  it('should toggle auto-scroll', async () => {
    const user = userEvent.setup();
    render(<LogsViewer />);
    
    const autoScrollButton = screen.getByText('Activé');
    await user.click(autoScrollButton);
    
    expect(screen.getByText('Désactivé')).toBeInTheDocument();
  });

  it('should format timestamps correctly', () => {
    render(<LogsViewer />);
    
    // Check that timestamps are displayed (exact format may vary based on locale)
    const timestampElements = screen.getAllByText(/\d{2}:\d{2}:\d{2}/);
    expect(timestampElements.length).toBeGreaterThan(0);
  });

  it('should subscribe to logs service updates', () => {
    render(<LogsViewer />);
    
    expect(mockLogsService.addListener).toHaveBeenCalled();
  });

  it('should handle clipboard copy errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));
    
    render(<LogsViewer />);
    
    const copyButton = screen.getByText('Copier');
    await user.click(copyButton);
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Erreur lors de la copie:', expect.any(Error));
    
    consoleErrorSpy.mockRestore();
  });

  it('should show capture status in header', () => {
    mockLogsService.isCapturingLogs.mockReturnValue(false);
    
    render(<LogsViewer />);
    
    expect(screen.getByText('3 entrées • Capture inactive')).toBeInTheDocument();
  });
});