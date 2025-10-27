import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Theme } from '../types';
// TitleBar is now minimal; keep only required imports

interface CustomMenuBarProps {
  theme: Theme;
  activeTab?: 'dimicall';
  onTabChange?: (tab: 'dimicall') => void;
  showDimiTable?: boolean;
  onSettingsClick?: () => void;
  userName?: string;
  userStatus?: 'online' | 'offline' | 'away';
  // Intentionally trimmed props: TitleBar now only hosts window controls
}

export const CustomMenuBar: React.FC<CustomMenuBarProps> = ({ 
  theme, 
  activeTab = 'dimicall',
  onTabChange,
  showDimiTable = true,
  onSettingsClick,
  userName = "Dimitri Morel",
  userStatus = 'online',
  // Removed props no longer used here
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [isMacOS, setIsMacOS] = useState(false);
  // Minimal state; no branding or badges

  useEffect(() => {
    // Vérifier si nous sommes dans Electron
    const checkElectron = async () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        setIsElectron(true);
        setIsMacOS(window.electronAPI.platform === 'darwin');
        const maxState = await window.electronAPI.isMaximized();
        setIsMaximized(maxState);
      }
    };
    
    checkElectron();

    // Plus de logique beta / badges ici

    // Écouter les événements de redimensionnement pour mettre à jour l'état maximisé
    const handleResize = async () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const maxState = await window.electronAPI.isMaximized();
        setIsMaximized(maxState);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);


  const handleMinimize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.minimizeApp();
    }
  };

  const handleMaximize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.maximizeApp();
      const maxState = await window.electronAPI.isMaximized();
      setIsMaximized(maxState);
    }
  };

  const handleClose = async () => {
    if (window.electronAPI) {
      await window.electronAPI.closeApp();
    }
  };

  // Si ce n'est pas Electron, ne pas afficher la barre de titre
  if (!isElectron) {
    return null;
  }

  // Utiliser les mêmes couleurs que l'application
  const menuBarBg = theme === Theme.Dark 
    ? 'bg-[hsl(var(--background))] border-b border-[hsl(var(--border))]' 
    : 'bg-[hsl(var(--background))] border-b border-[hsl(var(--border))]';
  
  const textColor = theme === Theme.Dark 
    ? 'text-[hsl(var(--foreground))]' 
    : 'text-[hsl(var(--foreground))]';

  const buttonHoverBg = theme === Theme.Dark 
    ? 'hover:bg-[hsl(var(--muted))]' 
    : 'hover:bg-[hsl(var(--muted))]';


  return (
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 z-[30000] flex items-center select-none pointer-events-none",
        isMacOS ? "h-8" : "h-8", // Hauteur adaptée selon la plateforme
        menuBarBg
      )}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {isMacOS ? (
        // macOS: keep a minimal drag region; OS provides traffic lights
        <div className="flex-1" />
      ) : (
        // Windows/Linux: only window controls
        <>
          <div className="flex-1" />
          {/* Contrôles de fenêtre Windows */}
          <div 
            className="flex h-full pointer-events-auto"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {/* Bouton Minimiser */}
            <button
              onClick={handleMinimize}
              className={cn(
                "w-12 h-full flex items-center justify-center transition-all duration-200 focus:outline-none",
                "rounded-none",
                buttonHoverBg,
                textColor
              )}
              title="Minimiser"
            >
              <Minus size={12} strokeWidth={2} />
            </button>

            {/* Bouton Maximiser/Restaurer */}
            <button
              onClick={handleMaximize}
              className={cn(
                "w-12 h-full flex items-center justify-center transition-all duration-200 focus:outline-none",
                "rounded-none",
                buttonHoverBg,
                textColor
              )}
              title={isMaximized ? "Restaurer" : "Maximiser"}
            >
              {isMaximized ? (
                <Square size={10} strokeWidth={2} />
              ) : (
                <Maximize size={10} strokeWidth={2} />
              )}
            </button>

            {/* Bouton Fermer */}
            <button
              onClick={handleClose}
              className={cn(
                "w-12 h-full flex items-center justify-center transition-all duration-200 focus:outline-none",
                "rounded-none hover:bg-red-500 hover:text-white",
                textColor
              )}
              title="Fermer"
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        </>
      )}

    </div>
  );
};

// Composant de compatibilité pour maintenir l'ancien nom
export const TitleBar = CustomMenuBar;
