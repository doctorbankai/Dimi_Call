import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CallMode } from '../types';

interface ModeContextValue {
  mode: CallMode;
  setMode: (mode: CallMode) => void;
}

const MODE_STORAGE_KEY = 'dimicall-call-mode';

const ModeContext = createContext<ModeContextValue | undefined>(undefined);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<CallMode>(() => {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY);
      return saved === CallMode.Apporteur ? CallMode.Apporteur : CallMode.Client;
    } catch {
      return CallMode.Client;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {}
  }, [mode]);

  const setMode = (newMode: CallMode) => {
    setModeState(newMode);
  };

  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return (
    <ModeContext.Provider value={value}>{children}</ModeContext.Provider>
  );
};

export const useCallMode = (): ModeContextValue => {
  const ctx = useContext(ModeContext);
  // Fournir un fallback non-bloquant pour éviter les crashs si le provider n'est pas encore monté
  if (!ctx) {
    return {
      mode: CallMode.Client,
      setMode: () => {},
    };
  }
  return ctx;
};


