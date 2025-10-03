import { useEffect, useRef, useCallback } from 'react';

/**
 * Fonction debounce pour limiter la fréquence d'exécution d'une fonction
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;

  const debouncedFunc = function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  } as T & { cancel: () => void };

  debouncedFunc.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFunc;
}

/**
 * Hook pour gérer les événements de redimensionnement avec debouncing
 * Optimise les performances en limitant la fréquence d'exécution
 */
export const useDebouncedResize = (callback: () => void, delay: number = 150) => {
  const callbackRef = useRef(callback);

  // Mettre à jour la ref à chaque render pour avoir toujours la dernière version
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    try {
      const handler = debounce(() => {
        callbackRef.current();
      }, delay);

      window.addEventListener('resize', handler);

      return () => {
        window.removeEventListener('resize', handler);
        handler.cancel();
      };
    } catch (error) {
      console.error('[useDebouncedResize] Erreur lors de la configuration:', error);
    }
  }, [delay]);
};
