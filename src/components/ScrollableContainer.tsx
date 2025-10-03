import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollIndicators } from './ScrollIndicators';
import { useScrollState } from '@/hooks/useScrollState';
import { useThrottledScroll } from '@/hooks/useThrottledScroll';

interface ScrollableContainerProps {
  children: React.ReactNode;
  className?: string;
  onScrollChange?: (hasScrollLeft: boolean, hasScrollRight: boolean) => void;
}

/**
 * Conteneur avec scroll horizontal et détection de débordement
 * Affiche des indicateurs visuels quand du contenu est caché
 * Support du scroll au trackpad, souris (Shift+Molette) et tactile
 */
export const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
  children,
  className,
  onScrollChange
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollState = useScrollState(containerRef);
  const [localScrollState, setLocalScrollState] = useState({
    hasScrollLeft: false,
    hasScrollRight: false
  });

  // Fonction de mise à jour de l'état du scroll
  const updateScrollState = () => {
    if (!containerRef.current) return;

    try {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      const hasScrollLeft = scrollLeft > 0;
      const hasScrollRight = scrollLeft < scrollWidth - clientWidth - 1;

      setLocalScrollState({ hasScrollLeft, hasScrollRight });
      onScrollChange?.(hasScrollLeft, hasScrollRight);
    } catch (error) {
      console.error('[ScrollableContainer] Erreur lors de la mise à jour du scroll:', error);
    }
  };

  // Créer une version throttlée de la fonction de mise à jour
  const throttledUpdate = useThrottledScroll(updateScrollState, 16);

  // Mettre à jour l'état local quand scrollState change
  useEffect(() => {
    setLocalScrollState({
      hasScrollLeft: scrollState.hasScrollLeft,
      hasScrollRight: scrollState.hasScrollRight
    });
    onScrollChange?.(scrollState.hasScrollLeft, scrollState.hasScrollRight);
  }, [scrollState, onScrollChange]);

  // Gérer le scroll avec Shift+Molette
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Si Shift est pressé ou si c'est un scroll horizontal naturel
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        
        // Utiliser deltaX si disponible, sinon deltaY avec Shift
        const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        container.scrollLeft += delta;
        
        throttledUpdate();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [throttledUpdate]);

  return (
    <div className="relative">
      {/* Indicateurs de scroll */}
      <ScrollIndicators
        showLeft={localScrollState.hasScrollLeft}
        showRight={localScrollState.hasScrollRight}
      />

      {/* Conteneur scrollable */}
      <div
        ref={containerRef}
        className={cn(
          "overflow-x-auto overflow-y-hidden",
          "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
          "scroll-smooth",
          // Optimisations GPU
          "transform-gpu",
          "[backface-visibility:hidden]",
          "[will-change:scroll-position]",
          className
        )}
        onScroll={throttledUpdate}
        style={{
          // Optimisations CSS supplémentaires
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin'
        }}
      >
        {children}
      </div>
    </div>
  );
};
