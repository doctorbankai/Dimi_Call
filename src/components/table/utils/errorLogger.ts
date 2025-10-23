// Centralized error logging utility for table components
// Provides structured logging with context and rate limiting

interface ErrorContext {
  component?: string;
  action?: string;
  contactId?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

interface LogEntry {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context: ErrorContext;
  count: number; // For rate limiting duplicate errors
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: LogEntry[] = [];
  private maxLogs = 50;
  private rateLimitMap = new Map<string, { count: number; lastTime: number }>();
  private rateLimitWindow = 60000; // 1 minute
  private maxDuplicates = 5;

  private constructor() {
    this.loadPersistedLogs();
    this.setupGlobalErrorHandler();
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private setupGlobalErrorHandler() {
    // Listen for unhandled errors in table components
    window.addEventListener('error', (event) => {
      if (event.filename?.includes('table') || event.message?.includes('table')) {
        this.logError(event.error || new Error(event.message), {
          component: 'global',
          action: 'unhandled_error',
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          }
        });
      }
    });

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && typeof event.reason === 'object' && 
          (event.reason.stack?.includes('table') || event.reason.message?.includes('table'))) {
        this.logError(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          {
            component: 'global',
            action: 'unhandled_promise_rejection',
          }
        );
      }
    });
  }

  private generateErrorKey(error: Error, context: Partial<ErrorContext>): string {
    // Create unique key for rate limiting based on error type and location
    const errorType = error.name || 'UnknownError';
    const component = context.component || 'unknown';
    const action = context.action || 'unknown';
    const message = error.message?.slice(0, 100) || 'no-message';
    
    return `${errorType}-${component}-${action}-${this.hashCode(message)}`;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private shouldLog(errorKey: string): boolean {
    const now = Date.now();
    const rateLimit = this.rateLimitMap.get(errorKey);

    if (!rateLimit) {
      this.rateLimitMap.set(errorKey, { count: 1, lastTime: now });
      return true;
    }

    // Reset counter if window has passed
    if (now - rateLimit.lastTime > this.rateLimitWindow) {
      this.rateLimitMap.set(errorKey, { count: 1, lastTime: now });
      return true;
    }

    // Increment counter
    rateLimit.count++;
    rateLimit.lastTime = now;

    // Only log if under the limit
    return rateLimit.count <= this.maxDuplicates;
  }

  private createErrorContext(context: Partial<ErrorContext> = {}): ErrorContext {
    return {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId(),
      ...context,
    };
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('dimicall-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('dimicall-session-id', sessionId);
    }
    return sessionId;
  }

  public logError(error: Error, context: Partial<ErrorContext> = {}) {
    try {
      const errorKey = this.generateErrorKey(error, context);
      
      if (!this.shouldLog(errorKey)) {
        return; // Skip logging due to rate limiting
      }

      const logEntry: LogEntry = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        level: 'error',
        message: error.message || 'Unknown error',
        error: {
          name: error.name || 'Error',
          message: error.message || 'Unknown error',
          stack: error.stack,
        },
        context: this.createErrorContext(context),
        count: this.rateLimitMap.get(errorKey)?.count || 1,
      };

      this.addLog(logEntry);
      this.persistLogs();

      // Console logging for development
      if (process.env.NODE_ENV === 'development') {
        console.group(`🚨 Table Error [${logEntry.id}]`);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        console.error('Context:', logEntry.context);
        console.error('Count:', logEntry.count);
        console.groupEnd();
      }

      // Emit event for external monitoring
      this.emitErrorEvent(logEntry);
    } catch (loggingError) {
      // Don't let logging errors crash the app
      console.warn('Failed to log error:', loggingError);
    }
  }

  public logWarning(message: string, context: Partial<ErrorContext> = {}) {
    try {
      const logEntry: LogEntry = {
        id: `warning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        level: 'warning',
        message,
        context: this.createErrorContext(context),
        count: 1,
      };

      this.addLog(logEntry);
      this.persistLogs();

      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Table Warning [${logEntry.id}]:`, message, logEntry.context);
      }

      this.emitErrorEvent(logEntry);
    } catch (loggingError) {
      console.warn('Failed to log warning:', loggingError);
    }
  }

  public logInfo(message: string, context: Partial<ErrorContext> = {}) {
    try {
      const logEntry: LogEntry = {
        id: `info-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        level: 'info',
        message,
        context: this.createErrorContext(context),
        count: 1,
      };

      this.addLog(logEntry);
      this.persistLogs();

      if (process.env.NODE_ENV === 'development') {
        console.info(`ℹ️ Table Info [${logEntry.id}]:`, message, logEntry.context);
      }

      this.emitErrorEvent(logEntry);
    } catch (loggingError) {
      console.warn('Failed to log info:', loggingError);
    }
  }

  private addLog(logEntry: LogEntry) {
    this.logs.unshift(logEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  private persistLogs() {
    try {
      // Only persist errors and warnings, not info logs
      const persistentLogs = this.logs.filter(log => log.level !== 'info');
      localStorage.setItem('dimicall-error-logs', JSON.stringify(persistentLogs));
    } catch (error) {
      // Silent fail - localStorage might be full or disabled
    }
  }

  private loadPersistedLogs() {
    try {
      const stored = localStorage.getItem('dimicall-error-logs');
      if (stored) {
        const parsed = JSON.parse(stored) as LogEntry[];
        this.logs = Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      // Silent fail - invalid JSON or other parsing error
      this.logs = [];
    }
  }

  private emitErrorEvent(logEntry: LogEntry) {
    try {
      window.dispatchEvent(new CustomEvent('dimicall-log-entry', {
        detail: logEntry
      }));
    } catch (error) {
      // Silent fail
    }
  }

  // Public methods for retrieving logs
  public getLogs(level?: 'error' | 'warning' | 'info'): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  public getErrorCount(): number {
    return this.logs.filter(log => log.level === 'error').length;
  }

  public getWarningCount(): number {
    return this.logs.filter(log => log.level === 'warning').length;
  }

  public clearLogs() {
    this.logs = [];
    this.rateLimitMap.clear();
    try {
      localStorage.removeItem('dimicall-error-logs');
    } catch (error) {
      // Silent fail
    }
  }

  // Export logs for debugging
  public exportLogs(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      logs: this.logs,
      rateLimit: Array.from(this.rateLimitMap.entries()),
    }, null, 2);
  }
}

// Singleton instance
const errorLogger = ErrorLogger.getInstance();

// Convenience functions
export const logError = (error: Error, context?: Partial<ErrorContext>) => {
  errorLogger.logError(error, context);
};

export const logWarning = (message: string, context?: Partial<ErrorContext>) => {
  errorLogger.logWarning(message, context);
};

export const logInfo = (message: string, context?: Partial<ErrorContext>) => {
  errorLogger.logInfo(message, context);
};

export const getLogs = (level?: 'error' | 'warning' | 'info') => {
  return errorLogger.getLogs(level);
};

export const getErrorCount = () => errorLogger.getErrorCount();
export const getWarningCount = () => errorLogger.getWarningCount();
export const clearLogs = () => errorLogger.clearLogs();
export const exportLogs = () => errorLogger.exportLogs();

// Make logger available globally for debugging
if (process.env.NODE_ENV === 'development') {
  (window as any).dimicallErrorLogger = errorLogger;
}

export default errorLogger;
export type { ErrorContext, LogEntry };