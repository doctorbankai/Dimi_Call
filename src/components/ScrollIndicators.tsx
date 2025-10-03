import React from 'react';
import { cn } from '@/lib/utils';

interface ScrollIndicatorsProps {
  showLeft: boolean;
  showRight: boolean;
  className?: string;
}

/**
 * Composant qui affiche des indicateurs visuels (gradients) pour montrer
 * qu'il y a du contenu caché nécessitant un scroll horizontal
 */
export const ScrollIndicators: React.FC<ScrollIndicatorsProps> = ({
  showLeft,
  showRight,
  className = ''
}) => {
  return (
    <>
      {/* Gradient gauche - indique qu'il y a du contenu caché à gauche */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-8 pointer-events-none z-10",
          "bg-gradient-to-r from-background to-transparent",
          "transition-opacity duration-300 ease-in-out",
          showLeft ? "opacity-100" : "opacity-0",
          className
        )}
        aria-hidden="true"
      />
      
      {/* Gradient droit - indique qu'il y a du contenu caché à droite */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-10",
          "bg-gradient-to-l from-background to-transparent",
          "transition-opacity duration-300 ease-in-out",
          showRight ? "opacity-100" : "opacity-0",
          className
        )}
        aria-hidden="true"
      />
    </>
  );
};
