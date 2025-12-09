import React from 'react'
import log from 'electron-log/renderer'

type RootErrorBoundaryProps = {
  children: React.ReactNode
}

type RootErrorBoundaryState = {
  hasError: boolean
  message?: string
}

export class RootErrorBoundary extends React.Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  state: RootErrorBoundaryState = {
    hasError: false,
    message: undefined
  }

  static getDerivedStateFromError(error: unknown): RootErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    try {
      log.error('[Renderer] Erreur critique capturée par RootErrorBoundary', error, info.componentStack)
    } catch (loggingError) {
      console.error('Erreur lors du log RootErrorBoundary', loggingError)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
          <div className="text-xl font-semibold">Une erreur est survenue au démarrage</div>
          <div className="text-sm text-muted-foreground">
            Merci de relancer l'application. Si le problème persiste, envoyez les logs au support.
          </div>
          {this.state.message ? (
            <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Détail: {this.state.message}
            </div>
          ) : null}
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Relancer l'application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

