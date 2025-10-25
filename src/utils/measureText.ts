/**
 * Utilitaire de mesure de texte précis via Canvas API
 * Équivalent à Excel AutoFit - mesure pixel-perfect du contenu
 */

export interface TextMeasurer {
  measure: (text: string) => number;
  clearCache: () => void;
}

/**
 * Crée un mesureur de texte basé sur Canvas API
 * @param font - Police CSS (ex: "12px Inter, system-ui")
 * @returns Instance de TextMeasurer avec cache intégré
 */
export function createTextMeasurer(
  font = '12px Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
): TextMeasurer {
  // Créer canvas hors-DOM pour mesures
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  
  ctx.font = font;
  
  // Cache pour éviter mesures répétées
  const cache = new Map<string, number>();
  
  return {
    measure: (text: string): number => {
      const key = text || '';
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      const width = Math.ceil(ctx.measureText(key).width);
      cache.set(key, width);
      
      return width;
    },
    
    clearCache: () => {
      cache.clear();
    }
  };
}

/**
 * Mesure la largeur optimale pour une colonne
 * @param texts - Échantillon de textes à mesurer (header + cellules)
 * @param measurer - Instance de TextMeasurer
 * @param options - Options de padding et contraintes
 * @returns Largeur optimale en pixels
 */
export function measureColumnWidth(
  texts: string[],
  measurer: TextMeasurer,
  options: {
    padding?: number;
    widgetPadding?: number;
    minSize?: number;
    maxSize?: number;
  } = {}
): number {
  const {
    padding = 24,        // px-3 = 12px * 2 + marge
    widgetPadding = 0,
    minSize = 80,
    maxSize = 800
  } = options;
  
  if (texts.length === 0) {
    return minSize;
  }
  
  // Mesurer tous les textes
  const widths = texts.map(text => measurer.measure(text));
  
  // Prendre le maximum
  const maxTextWidth = Math.max(...widths, 0);
  
  // Ajouter padding + widgets
  const totalWidth = maxTextWidth + padding + widgetPadding;
  
  // Clamp entre min et max
  return Math.floor(Math.max(minSize, Math.min(totalWidth, maxSize)));
}
