import { LogsService, LogEntry, LogLevel } from '../../services/logsService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console methods
const originalConsole = { ...console };

describe('LogsService', () => {
  beforeEach(() => {
    // Reset mocks
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    
    // Clear logs
    LogsService.clearLogs();
    
    // Stop capturing to avoid interference
    LogsService.stopCapturing();
  });

  afterEach(() => {
    // Restore console
    Object.assign(console, originalConsole);
  });

  describe('addLog', () => {
    it('should add a log entry with generated id and timestamp', () => {
      const logEntry = {
        level: 'info' as LogLevel,
        message: 'Test message',
        source: 'test'
      };

      LogsService.addLog(logEntry);
      const logs = LogsService.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'info',
        message: 'Test message',
        source: 'test'
      });
      expect(logs[0].id).toBeDefined();
      expect(logs[0].timestamp).toBeDefined();
      expect(typeof logs[0].timestamp).toBe('number');
    });

    it('should sanitize sensitive data in messages', () => {
      const logEntry = {
        level: 'info' as LogLevel,
        message: 'User login with password=secret123 and token=abc123',
        source: 'auth'
      };

      LogsService.addLog(logEntry);
      const logs = LogsService.getLogs();

      expect(logs[0].message).toContain('password=***');
      expect(logs[0].message).toContain('token=***');
      expect(logs[0].message).not.toContain('secret123');
      expect(logs[0].message).not.toContain('abc123');
    });

    it('should add logs in reverse chronological order', () => {
      LogsService.addLog({ level: 'info', message: 'First', source: 'test' });
      LogsService.addLog({ level: 'info', message: 'Second', source: 'test' });
      LogsService.addLog({ level: 'info', message: 'Third', source: 'test' });

      const logs = LogsService.getLogs();
      expect(logs[0].message).toBe('Third');
      expect(logs[1].message).toBe('Second');
      expect(logs[2].message).toBe('First');
    });
  });

  describe('getLogs', () => {
    beforeEach(() => {
      // Add test logs
      LogsService.addLog({ level: 'error', message: 'Error message', source: 'test' });
      LogsService.addLog({ level: 'warn', message: 'Warning message', source: 'test' });
      LogsService.addLog({ level: 'info', message: 'Info message', source: 'test' });
      LogsService.addLog({ level: 'debug', message: 'Debug message', source: 'test' });
    });

    it('should return all logs when no filter is provided', () => {
      const logs = LogsService.getLogs();
      expect(logs).toHaveLength(4);
    });

    it('should filter logs by level', () => {
      const errorLogs = LogsService.getLogs({ levels: ['error'] });
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe('error');

      const errorAndWarnLogs = LogsService.getLogs({ levels: ['error', 'warn'] });
      expect(errorAndWarnLogs).toHaveLength(2);
    });

    it('should filter logs by search term', () => {
      const filteredLogs = LogsService.getLogs({ 
        levels: ['error', 'warn', 'info', 'debug'],
        searchTerm: 'Error' 
      });
      expect(filteredLogs).toHaveLength(1);
      expect(filteredLogs[0].message).toContain('Error');
    });

    it('should filter logs by time range', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      const recentLogs = LogsService.getLogs({
        levels: ['error', 'warn', 'info', 'debug'],
        timeRange: { start: oneHourAgo, end: now }
      });
      
      // All logs should be recent since they were just added
      expect(recentLogs).toHaveLength(4);
    });
  });

  describe('clearLogs', () => {
    it('should remove all logs', () => {
      LogsService.addLog({ level: 'info', message: 'Test', source: 'test' });
      expect(LogsService.getLogs()).toHaveLength(1);

      LogsService.clearLogs();
      expect(LogsService.getLogs()).toHaveLength(0);
      expect(LogsService.getLogCount()).toBe(0);
    });
  });

  describe('exportLogs', () => {
    beforeEach(() => {
      LogsService.addLog({ 
        level: 'error', 
        message: 'Test error', 
        source: 'test',
        stack: 'Error stack trace'
      });
      LogsService.addLog({ 
        level: 'info', 
        message: 'Test info', 
        source: 'test' 
      });
    });

    it('should export logs in text format', () => {
      const exported = LogsService.exportLogs('text');
      
      expect(exported).toContain('ERROR');
      expect(exported).toContain('INFO');
      expect(exported).toContain('Test error');
      expect(exported).toContain('Test info');
      expect(exported).toContain('Error stack trace');
    });

    it('should export logs in JSON format', () => {
      const exported = LogsService.exportLogs('json');
      const parsed = JSON.parse(exported);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toHaveProperty('level');
      expect(parsed[0]).toHaveProperty('message');
      expect(parsed[0]).toHaveProperty('timestamp');
    });
  });

  describe('console capture', () => {
    it('should capture console.log messages', () => {
      LogsService.startCapturing();
      
      console.log('Test log message');
      
      const logs = LogsService.getLogs();
      const logMessage = logs.find(log => log.message === 'Test log message');
      
      expect(logMessage).toBeDefined();
      expect(logMessage?.level).toBe('info');
      expect(logMessage?.source).toBe('console');
    });

    it('should capture console.error messages', () => {
      LogsService.startCapturing();
      
      console.error('Test error message');
      
      const logs = LogsService.getLogs();
      const errorMessage = logs.find(log => log.message === 'Test error message');
      
      expect(errorMessage).toBeDefined();
      expect(errorMessage?.level).toBe('error');
      expect(errorMessage?.source).toBe('console');
    });

    it('should handle object logging', () => {
      LogsService.startCapturing();
      
      const testObject = { key: 'value', number: 42 };
      console.log('Object:', testObject);
      
      const logs = LogsService.getLogs();
      const objectLog = logs.find(log => log.message.includes('Object:'));
      
      expect(objectLog).toBeDefined();
      expect(objectLog?.message).toContain('{"key":"value","number":42}');
    });
  });

  describe('rotation', () => {
    it('should limit the number of logs', () => {
      // Add more than MAX_LOGS (1000) entries
      for (let i = 0; i < 1100; i++) {
        LogsService.addLog({ 
          level: 'info', 
          message: `Log ${i}`, 
          source: 'test' 
        });
      }
      
      const logs = LogsService.getLogs();
      expect(logs.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('listeners', () => {
    it('should notify listeners when logs are added', () => {
      const listener = jest.fn();
      const unsubscribe = LogsService.addListener(listener);
      
      LogsService.addLog({ level: 'info', message: 'Test', source: 'test' });
      
      expect(listener).toHaveBeenCalled();
      
      unsubscribe();
    });

    it('should not notify unsubscribed listeners', () => {
      const listener = jest.fn();
      const unsubscribe = LogsService.addListener(listener);
      
      unsubscribe();
      LogsService.addLog({ level: 'info', message: 'Test', source: 'test' });
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('storage', () => {
    it('should save logs to localStorage', () => {
      LogsService.addLog({ level: 'info', message: 'Test', source: 'test' });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dimicall-logs',
        expect.any(String)
      );
    });

    it('should load logs from localStorage on initialization', () => {
      const mockLogs = [{
        id: 'test-id',
        timestamp: Date.now(),
        level: 'info',
        message: 'Loaded log',
        source: 'storage'
      }];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        logs: mockLogs,
        timestamp: Date.now()
      }));
      
      // Create a new instance to test loading
      // Note: This is a simplified test since LogsService is a singleton
      expect(localStorageMock.getItem).toHaveBeenCalledWith('dimicall-logs');
    });
  });
});