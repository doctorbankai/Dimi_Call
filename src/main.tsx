import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { AnimatePresence } from 'framer-motion'
import App from './App'
import { LoadingPage } from './components/LoadingPage'
import { RootErrorBoundary } from './components/RootErrorBoundary'
import { useSupabaseAuth } from './lib/auth-client'
import './index.css'
import './styles/table-interactions.css'
import { ModeProvider } from './context/ModeContext'
import './utils/disableLogs' // Désactiver tous les logs

// Fonction pour masquer l'écran de chargement HTML initial
const hideInitialLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen')
  if (loadingScreen) {
    loadingScreen.style.display = 'none'
  }
}

// Wrapper pour l'App avec gestion de l'écran de chargement moderne
const AppWithLoadingPage = () => {
  const { isLoading } = useSupabaseAuth();
  const [showLoadingPage, setShowLoadingPage] = useState(true);

  useEffect(() => {
    // Masquer immédiatement l'écran de chargement HTML
    hideInitialLoadingScreen();
  }, []);

  useEffect(() => {
    try {
      window.electronAPI?.notifyRendererReady?.();
    } catch (error) {
      console.error('[renderer] notifyRendererReady failed', error);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Attendre un peu avant de masquer la page de chargement pour une transition fluide
      setTimeout(() => {
        setShowLoadingPage(false);
      }, 1000);
    }
  }, [isLoading]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showLoadingPage && (
          <LoadingPage key="loading-page" onComplete={() => setShowLoadingPage(false)} />
        )}
      </AnimatePresence>
      {!showLoadingPage && <App appKey={(window as any).appUpdateKey || 0} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ModeProvider>
      <RootErrorBoundary>
        <AppWithLoadingPage />
      </RootErrorBoundary>
    </ModeProvider>
  </React.StrictMode>
)