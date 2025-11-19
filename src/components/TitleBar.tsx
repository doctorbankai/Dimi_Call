import React, { useEffect, useMemo, useState } from 'react';
import {
  Minus,
  Square,
  X,
  Maximize,
  DownloadCloud,
  Smartphone,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Theme } from '../types';
import packageJson from '../../package.json';
import { Badge } from '@/components/ui/badge';
import { AdbConnectionState } from '@/services/adbService';
import { BetaPreferences, UpdateState } from '@/types/update';
import { Spinner } from '@/components/ui/spinner';

interface CustomMenuBarProps {
  theme: Theme;
  userName?: string;
  adbConnectionState?: AdbConnectionState;
  adbConnecting?: boolean;
  onAdbClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  updateState?: UpdateState;
  onUpdateClick?: () => void;
  onUpdateConfirmationOpen?: () => void;
  betaPreferences?: BetaPreferences | null;
  isUpdateEnabled?: boolean;
}

const FALLBACK_UPDATE_STATE: UpdateState = {
  checking: false,
  available: false,
  downloading: false,
  downloaded: false,
  error: null,
  progress: 0,
  updateInfo: null,
  enabled: true,
};

export const CustomMenuBar: React.FC<CustomMenuBarProps> = ({
  theme,
  userName = 'DimiCall',
  adbConnectionState,
  adbConnecting = false,
  onAdbClick,
  updateState,
  onUpdateClick,
  onUpdateConfirmationOpen,
  betaPreferences,
  isUpdateEnabled,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [isMacOS, setIsMacOS] = useState(false);

  useEffect(() => {
    const checkElectron = async () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        setIsElectron(true);
        setIsMacOS(window.electronAPI.platform === 'darwin');
        const maxState = await window.electronAPI.isMaximized();
        setIsMaximized(maxState);
      }
    };

    checkElectron();

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

  const appVersion = packageJson?.version ?? '';
  const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;

  const menuBarBg = 'bg-[hsl(var(--background))] border-b border-[hsl(var(--border))]';

  const buttonHoverBg = 'hover:bg-[hsl(var(--muted))]';
  const textColor = 'text-[hsl(var(--foreground))]';

  const effectiveUpdateState = updateState ?? FALLBACK_UPDATE_STATE;
  const updatesAllowed = (isUpdateEnabled ?? effectiveUpdateState.enabled ?? true) && !effectiveUpdateState.error;

  const normalizedVersion = appVersion.toLowerCase();
  const isBetaBuild = /\b(beta|alpha|rc|preview|canary)\b/.test(normalizedVersion);
  const showBetaBadge = Boolean(betaPreferences?.enabled) || isBetaBuild;

  const updateBadgeLabel = useMemo(() => {
    if (!updatesAllowed) {
      return null;
    }

    if (effectiveUpdateState.checking) {
      return 'MAJ...';
    }
    if (effectiveUpdateState.downloading) {
      const progress = Math.max(0, Math.min(100, Math.round(effectiveUpdateState.progress ?? 0)));
      return `${progress}%`;
    }
    if (effectiveUpdateState.downloaded) {
      return 'Mettre à jour';
    }
    if (effectiveUpdateState.available) {
      return 'MAJ';
    }
    return null;
  }, [effectiveUpdateState, updatesAllowed]);

  const updateBadgeIntent = effectiveUpdateState.downloaded
    ? 'ready'
    : effectiveUpdateState.downloading
    ? 'progress'
    : effectiveUpdateState.checking
    ? 'checking'
    : 'idle';

  const canInteractWithUpdate = Boolean(
    (effectiveUpdateState.downloaded && onUpdateConfirmationOpen) || onUpdateClick
  );

  const handleUpdateBadgeClick = () => {
    if (!canInteractWithUpdate) {
      return;
    }

    if (effectiveUpdateState.downloaded && onUpdateConfirmationOpen) {
      onUpdateConfirmationOpen();
      return;
    }

    onUpdateClick?.();
  };

  const renderUpdateBadge = () => {
    if (!updateBadgeLabel) {
      return null;
    }

    const baseClasses =
      'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors';
    const palette = {
      ready: 'bg-emerald-600/10 text-emerald-700 border-emerald-200 dark:text-emerald-100',
      progress: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-100',
      checking: 'bg-sky-500/10 text-sky-700 border-sky-200 dark:text-sky-100',
      idle: 'bg-muted text-muted-foreground border-transparent',
    } as const;

    const intent = palette[updateBadgeIntent as keyof typeof palette];
    const iconColor =
      updateBadgeIntent === 'ready'
        ? 'text-emerald-600 dark:text-emerald-200'
        : updateBadgeIntent === 'progress'
        ? 'text-amber-600 dark:text-amber-200'
        : updateBadgeIntent === 'checking'
        ? 'text-sky-600 dark:text-sky-200'
        : 'text-muted-foreground';

    return (
      <button
        type="button"
        onClick={handleUpdateBadgeClick}
        disabled={!canInteractWithUpdate}
        aria-label="Statut des mises à jour"
        className={cn(baseClasses, intent, 'focus-visible:outline-none disabled:opacity-60')}
        style={noDragRegion}
        title={
          effectiveUpdateState.downloaded
            ? 'Nouvelle version téléchargée - cliquer pour installer'
            : effectiveUpdateState.downloading
            ? 'Téléchargement de la mise à jour'
            : effectiveUpdateState.checking
            ? 'Recherche de mises à jour'
            : 'Mise à jour disponible'
        }
      >
        {effectiveUpdateState.downloading || effectiveUpdateState.checking ? (
          <Spinner className={cn('size-3.5', iconColor)} />
        ) : (
          <DownloadCloud className={cn('w-3.5 h-3.5', iconColor)} />
        )}
        <span className="tracking-wide">{updateBadgeLabel}</span>
        {effectiveUpdateState.downloading && (
          <span className="text-[11px] font-medium text-muted-foreground">
            {Math.round(effectiveUpdateState.progress ?? 0)}%
          </span>
        )}
      </button>
    );
  };

  const adbState = adbConnectionState;
  const shouldShowAdbBadge = Boolean(adbState);

  const adbConnected = Boolean(adbState?.isConnected);
  const adbBadgeText = adbConnected
    ? 'ADB connecté'
    : adbConnecting
    ? 'Connexion ADB...'
    : 'ADB déconnecté';

  const adbBadgeTitle = adbConnected
    ? `Appareil Android prêt${adbState?.device?.name ? ` (${adbState.device.name})` : ''}`
    : adbConnecting
    ? 'Connexion ADB en cours'
    : adbState?.error ?? 'Aucun appareil ADB détecté';

  const adbPalette = adbConnected
    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-100'
    : 'bg-rose-500/10 text-rose-700 border-rose-200 dark:text-rose-100';

  const adbBadgeClasses = cn(
    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
    adbPalette,
    adbConnecting && 'animate-pulse'
  );

  if (!isElectron) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-[30000] flex items-center h-8 select-none pointer-events-none',
          menuBarBg
        )}
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center flex-1 h-full px-2 overflow-hidden justify-end">
          <div className="flex items-center gap-2 pointer-events-auto" style={noDragRegion}>
            {showBetaBadge && (
              <Badge className="rounded-full border border-purple-300/70 bg-purple-600/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-700 dark:text-purple-100">
                BETA
              </Badge>
            )}
            {renderUpdateBadge()}
            {shouldShowAdbBadge && (
              <button
                type="button"
                onClick={onAdbClick}
                disabled={!onAdbClick}
                aria-label="Statut ADB"
                title={adbBadgeTitle}
                className="focus-visible:outline-none disabled:opacity-60"
                style={noDragRegion}
              >
                <span className={adbBadgeClasses}>
                  {adbConnecting ? (
                    <RefreshCcw className={cn('w-3.5 h-3.5', !adbConnected && 'text-rose-600')} />
                  ) : adbConnected ? (
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-200" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-200" />
                  )}
                  <span className="tracking-wide">{adbBadgeText}</span>
                  {adbConnected && typeof adbState?.batteryLevel === 'number' && (
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {adbState.batteryLevel}%
                    </span>
                  )}
                </span>
              </button>
            )}
          </div>
        </div>

        {!isMacOS && (
          <div className="flex h-full pointer-events-auto" style={noDragRegion}>
            <button
              onClick={handleMinimize}
              className={cn(
                'w-12 h-full flex items-center justify-center transition-all duration-200 focus:outline-none',
                'rounded-none',
                buttonHoverBg,
                textColor
              )}
              title="Minimiser"
            >
              <Minus size={12} strokeWidth={2} />
            </button>

            <button
              onClick={handleMaximize}
              className={cn(
                'w-12 h-full flex items-center justify-center transition-all duration-200 focus:outline-none',
                'rounded-none',
                buttonHoverBg,
                textColor
              )}
              title={isMaximized ? 'Restaurer' : 'Maximiser'}
            >
              {isMaximized ? (
                <Square size={10} strokeWidth={2} />
              ) : (
                <Maximize size={10} strokeWidth={2} />
              )}
            </button>

            <button
              onClick={handleClose}
              className={cn(
                'w-12 h-full flex items-center justify-center transition-all duration-200 focus:outline-none',
                'rounded-none hover:bg-red-500 hover:text-white',
                textColor
              )}
              title="Fermer"
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

    </>
  );
};

export const TitleBar = CustomMenuBar;
