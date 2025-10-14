import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize, Smartphone, WifiOff, Loader2, Download, RefreshCw, Beaker } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Theme, CallMode } from '../types';
import { useCallMode } from '../context/ModeContext';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { BetaPreferencesService } from '../services/betaPreferencesService';

import packageJson from '../../package.json';

interface CustomMenuBarProps {
  theme: Theme;
  activeTab?: 'dimicall';
  onTabChange?: (tab: 'dimicall') => void;
  showDimiTable?: boolean;
  onSettingsClick?: () => void;
  userName?: string;
  userStatus?: 'online' | 'offline' | 'away';
  adbConnectionState?: any;
  adbConnecting?: boolean;
  activeCallContactId?: string | null;
  onAdbClick?: (e: React.MouseEvent) => void;
  updateState?: {
    checking: boolean;
    available: boolean;
    downloading: boolean;
    downloaded: boolean;
    progress: number;
    updateInfo?: { version: string } | null;
    enabled?: boolean;
  };
  isUpdateEnabled?: boolean;
  onUpdateClick?: () => void;
  onUpdateConfirmationOpen?: () => void;
}

export const CustomMenuBar: React.FC<CustomMenuBarProps> = ({ 
  theme, 
  activeTab = 'dimicall',
  onTabChange,
  showDimiTable = true,
  onSettingsClick,
  userName = "Dimitri Morel",
  userStatus = 'online',
  adbConnectionState,
  adbConnecting = false,
  activeCallContactId,
  onAdbClick,
  updateState,
  isUpdateEnabled = true,
  onUpdateClick,
  onUpdateConfirmationOpen
}) => {
  const { mode, setMode } = useCallMode();
  const [isMaximized, setIsMaximized] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [isMacOS, setIsMacOS] = useState(false);
  const [isBetaVersion, setIsBetaVersion] = useState(false);

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

    // Vérifier si c'est une version bêta
    const checkBetaVersion = () => {
      const betaPrefs = BetaPreferencesService.getBetaPreferences();
      const isCurrentBeta = BetaPreferencesService.isCurrentVersionBeta();
      setIsBetaVersion(betaPrefs.enabled || isCurrentBeta);
    };

    checkBetaVersion();

    // Log pour debug des mises à jour
    if (!isUpdateEnabled) {
      console.log('[TitleBar] Update badge hidden (updates disabled for this platform)');
    }

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


  // Fonction pour gérer le clic sur le badge de mise à jour
  const handleUpdateBadgeClick = () => {
    try {
      if (updateState?.downloaded && onUpdateConfirmationOpen) {
        console.log('🔄 Ouverture du dialog de confirmation de mise à jour');
        onUpdateConfirmationOpen();
      } else if (onUpdateClick) {
        console.log('🔄 Installation directe de la mise à jour (fallback)');
        onUpdateClick();
      } else {
        console.warn('⚠️ Aucune action de mise à jour disponible');
      }
    } catch (error) {
      console.error('❌ Erreur lors du clic sur le badge de mise à jour:', error);
      // Fallback: essayer l'installation directe si le dialog échoue
      if (onUpdateClick) {
        console.log('🔄 Tentative d\'installation directe après erreur');
        onUpdateClick();
      }
    }
  };

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
        // Layout pour macOS - Titre centré, pas de contrôles Windows
        <>
          {/* Espace pour les boutons macOS à gauche (traffic lights) */}
          <div className="w-24" />
          
          {/* Titre centré */}
          <div className="flex-1 flex justify-center items-center">
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-semibold", textColor)}>DimiCall</span>
              {isBetaVersion && (
                <Badge 
                  variant="outline" 
                  className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs px-1.5 py-0.5 h-5"
                >
                  <Beaker className="w-2.5 h-2.5 mr-1" />
                  BETA
                </Badge>
              )}
              {/* Badge ADB à côté du titre */}
              {adbConnectionState && onAdbClick && (
                <Badge 
                  variant={adbConnectionState.isConnected ? 'default' : 'outline'} 
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 cursor-pointer transition-all duration-200 hover:scale-105 text-xs h-6",
                    adbConnectionState.isConnected && "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
                    !adbConnectionState.isConnected && adbConnectionState.error && "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20",
                    !adbConnectionState.isConnected && !adbConnectionState.error && "bg-gray-500/10 text-gray-600 border-gray-500/20 hover:bg-gray-500/20",
                    adbConnecting && "animate-pulse",
                    activeCallContactId && "ring-1 ring-blue-500/50"
                  )}
                  onClick={onAdbClick}
                  title={`ADB ${adbConnectionState.isConnected ? 'Connecté' : 'Déconnecté'} - Clic pour ${adbConnectionState.isConnected ? 'déconnecter' : 'connecter'}`}
                >
                  {adbConnecting ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : adbConnectionState.isConnected ? (
                    <Smartphone className="w-2.5 h-2.5" />
                  ) : (
                    <WifiOff className="w-2.5 h-2.5" />
                  )}
                  <span className="font-medium">
                    {adbConnecting ? 'ADB...' : 
                     adbConnectionState.isConnected ? 'ADB' : 
                     adbConnectionState.error ? 'Err' : 'Off'}
                  </span>
                </Badge>
              )}
              {/* Badge de mise à jour */}
              {updateState?.downloaded && isUpdateEnabled && (
                <Badge 
                  variant="default" 
                  className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 cursor-pointer transition-all duration-200 hover:scale-105 text-xs h-6 px-2 py-0.5"
                  onClick={handleUpdateBadgeClick}
                  title="Mise à jour disponible - Cliquez pour installer"
                >
                  <Download className="w-2.5 h-2.5 mr-1" />
                  Mettre à jour
                </Badge>
              )}
            </div>
          </div>
          
        </>
      ) : (
        // Layout pour Windows/Linux - Design original
        <>
          {/* Logo et dropdown de navigation */}
          <div 
            className="flex items-center h-full pointer-events-auto"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {/* Logo et nom DimiCall */}
            <div className="flex items-center px-3 py-1 gap-2">
              <span className={cn("text-sm font-semibold", textColor)}>DimiCall</span>
              {isBetaVersion && (
                <Badge 
                  variant="outline" 
                  className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs px-1.5 py-0.5 h-5"
                >
                  <Beaker className="w-2.5 h-2.5 mr-1" />
                  BETA
                </Badge>
              )}
              {/* Badge ADB à côté du titre */}
              {adbConnectionState && onAdbClick && (
                <Badge 
                  variant={adbConnectionState.isConnected ? 'default' : 'outline'} 
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 cursor-pointer transition-all duration-200 hover:scale-105 text-xs h-6",
                    adbConnectionState.isConnected && "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
                    !adbConnectionState.isConnected && adbConnectionState.error && "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20",
                    !adbConnectionState.isConnected && !adbConnectionState.error && "bg-gray-500/10 text-gray-600 border-gray-500/20 hover:bg-gray-500/20",
                    adbConnecting && "animate-pulse",
                    activeCallContactId && "ring-1 ring-blue-500/50"
                  )}
                  onClick={onAdbClick}
                  title={`ADB ${adbConnectionState.isConnected ? 'Connecté' : 'Déconnecté'} - Clic pour ${adbConnectionState.isConnected ? 'déconnecter' : 'connecter'}`}
                >
                  {adbConnecting ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : adbConnectionState.isConnected ? (
                    <Smartphone className="w-2.5 h-2.5" />
                  ) : (
                    <WifiOff className="w-2.5 h-2.5" />
                  )}
                  <span className="font-medium">
                    {adbConnecting ? 'ADB...' : 
                     adbConnectionState.isConnected ? 'ADB' : 
                     adbConnectionState.error ? 'Err' : 'Off'}
                  </span>
                </Badge>
              )}
              {/* Badge de mise à jour */}
              {updateState?.downloaded && isUpdateEnabled && (
                <Badge 
                  variant="default" 
                  className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 cursor-pointer transition-all duration-200 hover:scale-105 text-xs h-6 px-2 py-0.5"
                  onClick={handleUpdateBadgeClick}
                  title="Mise à jour disponible - Cliquez pour installer"
                >
                  <Download className="w-2.5 h-2.5 mr-1" />
                  Mettre à jour
                </Badge>
              )}
            </div>
          </div>

          {/* Espace flexible pour permettre le drag */}
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
