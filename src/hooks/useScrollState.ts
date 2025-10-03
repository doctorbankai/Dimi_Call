import { useState, useEffect, RefObject } from 'react';

export interface ScrollState {
  hasScrollLeft: boolean;
  hasScrollRight: boolean;
  isScrollable: boolean;
}

/**
 * Hook pour gérer l'état du scroll horizontal d'un conteneur
 * Détecte si le contenu déborde et dans quelle direction
 */
export const useScrollState = (containerRef: RefObject<HTMLDivElement | null>): ScrollState => {
  const [scrollState, setScrollState] = useState<ScrollState>({
    hasScrollLeft: false,
    hasScrollRight: false,
    isScrollable: false
  });

  useEffect(() => {
    const checkScroll = () => {
      if (!containerRef.current) return;

      try {
        const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
        const hasScrollLeft = scrollLeft > 0;
        const hasScrollRight = scrollLeft < scrollWidth - clientWidth - 1;
        const isScrollable = scrollWidth > clientWidth;

        setScrollState({
          hasScrollLeft,
          hasScrollRight,
          isScrollable
        });
      } catch (error) {
        console.error('[useScrollState] Erreur lors de la vérification du scroll:', error);
        setScrollState({
          hasScrollLeft: false,
          hasScrollRight: false,
          isScrollable: false
        });
      }
    };

    checkScroll();

    // Observer les changements de taille du conteneur
    const resizeObserver = new ResizeObserver(checkScroll);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Observer les changements de taille de la fenêtre
    window.addEventListener('resize', checkScroll);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkScroll);
    };
  }, [containerRef]);

  return scrollState;
};
