import { useCallback, useRef } from 'react';

/**
 * Fonction throttle pour limiter la fréquence d'exécution d'une fonction
 * Garantit qu'elle ne s'exécute pas plus d'une fois par intervalle de temps
 */
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  const throttledFunc = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      func.apply(this, args);
    } else {
      // Planifier un appel pour la fin de l'intervalle
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func.apply(this, args);
        timeoutId = null;
      }, delay - timeSinceLastCall);
    }
  } as T & { cancel: () => void };

  throttledFunc.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttledFunc;
}

/**
 * Hook pour créer une fonction de callback throttlée
 * Optimise les performances pour les événements fréquents comme le scroll
 */
export const useThrottledScroll = (
  callback: () => void,
  delay: number = 16 // ~60fps
): (() => void) => {
  const callbackRef = useRef(callback);
  const throttledRef = useRef<ReturnType<typeof throttle>>();

  // Mettre à jour la ref du callback
  callbackRef.current = callback;

  // Créer la fonction throttlée
  if (!throttledRef.current) {
    throttledRef.current = throttle(() => {
      try {
        callbackRef.current();
      } catch (error) {
        console.error('[useThrottledScroll] Erreur lors de l\'exécution du callback:', error);
      }
    }, delay);
  }

  // Nettoyer au démontage
  const cleanup = useCallback(() => {
    if (throttledRef.current) {
      throttledRef.current.cancel();
    }
  }, []);

  // Utiliser useEffect pour le nettoyage
  useCallback(() => {
    return cleanup;
  }, [cleanup]);

  return throttledRef.current;
};
