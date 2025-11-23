import { ProspectCategory } from '../types';

const STORAGE_KEY = 'dimicall-prequalification-category-names';

export type CategoryNamesMap = Partial<Record<ProspectCategory, string>>;

const DEFAULT_NAMES: Record<ProspectCategory, string> = {
  [ProspectCategory.Baleine]: 'Baleine',
  [ProspectCategory.Poisson]: 'Poisson',
  [ProspectCategory.Premature]: 'Prématuré',
  [ProspectCategory.Inexploitable]: 'Inexploitable',
  [ProspectCategory.Passer]: 'Passer',
};

export const CategoryNamesService = {
  /**
   * Récupère les noms personnalisés depuis le localStorage
   */
  getCustomNames(): CategoryNamesMap {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved) as CategoryNamesMap;
      // Validation
      const valid: CategoryNamesMap = {};
      Object.values(ProspectCategory).forEach((category) => {
        if (parsed[category] && typeof parsed[category] === 'string' && parsed[category].trim()) {
          valid[category] = parsed[category].trim();
        }
      });
      return valid;
    } catch (error) {
      console.error('[Pré-qualification] Erreur lors du chargement des noms personnalisés', error);
      return {};
    }
  },

  /**
   * Sauvegarde les noms personnalisés dans le localStorage
   */
  saveCustomNames(names: CategoryNamesMap): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
    } catch (error) {
      console.error('[Pré-qualification] Erreur lors de la sauvegarde des noms personnalisés', error);
    }
  },

  /**
   * Récupère le nom d'une catégorie (personnalisé ou par défaut)
   */
  getCategoryName(category: ProspectCategory): string {
    const customNames = CategoryNamesService.getCustomNames();
    return customNames[category] || DEFAULT_NAMES[category];
  },

  /**
   * Réinitialise les noms aux valeurs par défaut
   */
  resetToDefaults(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[Pré-qualification] Erreur lors de la réinitialisation des noms', error);
    }
  },

  /**
   * Récupère tous les noms (personnalisés ou par défaut)
   */
  getAllNames(): Record<ProspectCategory, string> {
    const customNames = CategoryNamesService.getCustomNames();
    return {
      [ProspectCategory.Baleine]: customNames[ProspectCategory.Baleine] || DEFAULT_NAMES[ProspectCategory.Baleine],
      [ProspectCategory.Poisson]: customNames[ProspectCategory.Poisson] || DEFAULT_NAMES[ProspectCategory.Poisson],
      [ProspectCategory.Premature]: customNames[ProspectCategory.Premature] || DEFAULT_NAMES[ProspectCategory.Premature],
      [ProspectCategory.Inexploitable]: customNames[ProspectCategory.Inexploitable] || DEFAULT_NAMES[ProspectCategory.Inexploitable],
      [ProspectCategory.Passer]: customNames[ProspectCategory.Passer] || DEFAULT_NAMES[ProspectCategory.Passer],
    };
  },
};

