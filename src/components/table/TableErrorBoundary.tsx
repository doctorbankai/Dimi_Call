import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { Theme } from '../../types';

interface Props {
  children: ReactNode;
  theme?: Theme;
  fallbackTitle?: string;
  onRetry?: () => void;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorContext {
  timestamp: number;
  userAgent: string;
  url: string;
  context?: string;
  contactCount?: number;
  selectedContactId?: string;
}

class TableErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: '',
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `table-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error with context for debugging (non-intrusive)
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const context: ErrorContext = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: this.props.context || 'table',
      // Add table-specific context if available
      contactCount: this.getContactCount(),
      selectedContactId: this.getSelectedContactId(),
    };

    // Console logging for development
    console.group(`🚨 Table Error [${this.state.errorId}]`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Context:', context);
    console.groupEnd();

    // Store error in localStorage for offline debugging (non-blocking)
    try {
      const errorLog = {
        id: this.state.errorId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo,
        context,
      };

      const existingLogs = JSON.parse(localStorage.getItem('dimicall-error-logs') || '[]');
      const updatedLogs = [errorLog, ...existingLogs].slice(0, 10); // Keep only last 10 errors
      localStorage.setItem('dimicall-error-logs', JSON.stringify(updatedLogs));
    } catch (logError) {
      // Silent fail - don't crash the error boundary itself
      console.warn('Failed to log error:', logError);
    }

    // Emit custom event for external error monitoring (if available)
    try {
      window.dispatchEvent(new CustomEvent('dimicall-table-error', {
        detail: { error, errorInfo, context, errorId: this.state.errorId }
      }));
    } catch {
      // Silent fail
    }
  };

  private getContactCount = (): number => {
    try {
      // Try to get contact count from various sources
      const contacts = (window as any).dimicallContacts || [];
      return Array.isArray(contacts) ? contacts.length : 0;
    } catch {
      return 0;
    }
  };

  private getSelectedContactId = (): string | undefined => {
    try {
      return (window as any).dimicallSelectedContactId || undefined;
    } catch {
      return undefined;
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount += 1;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
      });
      
      // Call custom retry handler if provided
      this.props.onRetry?.();
      
      // Emit retry event
      try {
        window.dispatchEvent(new CustomEvent('dimicall-table-retry', {
          detail: { retryCount: this.retryCount, maxRetries: this.maxRetries }
        }));
      } catch {
        // Silent fail
      }
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private copyErrorDetails = () => {
    const errorDetails = {
      id: this.state.errorId,
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        // Could show a toast here but keeping it minimal
        console.log('Error details copied to clipboard');
      })
      .catch(() => {
        // Fallback: select text for manual copy
        console.log('Please manually copy error details from console');
      });
  };

  public render() {
    if (this.state.hasError) {
      const canRetry = this.retryCount < this.maxRetries;
      const isDark = this.props.theme === Theme.Dark;

      return (
        <div className="h-full w-full flex items-center justify-center p-4">
          <Card className={`w-full max-w-2xl ${isDark ? 'bg-card' : 'bg-card'}`}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Error Icon */}
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>

                {/* Error Title */}
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    {this.props.fallbackTitle || 'Problème temporaire avec le tableau'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Une erreur inattendue s'est produite. Vos données sont sécurisées.
                  </p>
                </div>

                {/* Error ID for debugging */}
                <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs text-muted-foreground">
                  ID: {this.state.errorId}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  {canRetry && (
                    <Button 
                      onClick={this.handleRetry} 
                      variant="default"
                      size="sm"
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Réessayer ({this.maxRetries - this.retryCount} restant)
                    </Button>
                  )}
                  
                  <Button 
                    onClick={this.handleReload} 
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Recharger l'application
                  </Button>

                  <Button 
                    onClick={this.copyErrorDetails} 
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Copier détails
                  </Button>
                </div>

                {/* Development Info */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="w-full text-left">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      Détails techniques (développement)
                    </summary>
                    <div className="mt-2 p-3 bg-muted/30 rounded-lg text-xs font-mono overflow-auto max-h-32">
                      <div className="mb-2">
                        <strong>Error:</strong> {this.state.error.message}
                      </div>
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="whitespace-pre-wrap text-xs mt-1">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Helpful Links */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Si le problème persiste :</p>
                  <ul className="text-left space-y-1 ml-4">
                    <li>• Vérifiez la console développeur (F12)</li>
                    <li>• Essayez de rafraîchir la page</li>
                    <li>• Vérifiez que vos données sont au bon format</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TableErrorBoundary;