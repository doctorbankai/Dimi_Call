import React, { useEffect, useState } from 'react';
import {
  Minus,
  Square,
  X,
  Maximize,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Theme } from '../types';
import packageJson from '../../package.json';

interface CustomMenuBarProps {
  theme: Theme;
  userName?: string;
}

export const CustomMenuBar: React.FC<CustomMenuBarProps> = ({
  theme,
  userName = 'DimiCall',
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
  const displayName = userName || 'DimiCall';
  const versionTone = theme === Theme.Dark ? 'text-muted-foreground/70' : 'text-muted-foreground/80';

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
        <div className="flex items-center flex-1 h-full px-3 overflow-hidden justify-between">
          <div className="flex items-center gap-2 text-[12px] font-semibold tracking-tight text-foreground/90 pointer-events-none select-none">
            <span className="text-sm font-bold leading-none">{displayName}</span>
            <span className={cn('text-xs leading-none', versionTone)}>v{appVersion}</span>
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
