/**
 * Service utilitaire pour les calculs de dates relatives et la validation
 * Utilisé pour la fonctionnalité de sélection de dates de rappel
 */

export type TimeUnit = 'days' | 'weeks' | 'months' | 'years';

export interface RelativeDateConfig {
  quantity: number;
  unit: TimeUnit;
  calculatedDate: string;
}

export interface DateValidationResult {
  isValid: boolean;
  errorMessage?: string;
  warningMessage?: string;
}

export class DateCalculationService {
  private static readonly MAX_YEARS_FUTURE = 10;
  private static readonly MIN_QUANTITY = 1;
  private static readonly MAX_QUANTITY = 999;

  /**
   * Calcule une date future basée sur une quantité et une unité de temps
   */
  static calculateFutureDate(quantity: number, unit: TimeUnit): string {
    if (!this.isValidQuantity(quantity)) {
      throw new Error('Quantité invalide');
    }

    const now = new Date();
    const futureDate = new Date(now);

    switch (unit) {
      case 'days':
        futureDate.setDate(now.getDate() + quantity);
        break;
      case 'weeks':
        futureDate.setDate(now.getDate() + (quantity * 7));
        break;
      case 'months':
        futureDate.setMonth(now.getMonth() + quantity);
        break;
      case 'years':
        futureDate.setFullYear(now.getFullYear() + quantity);
        break;
      default:
        throw new Error('Unité de temps invalide');
    }

    return this.formatDateToISO(futureDate);
  }

  /**
   * Formate une date pour l'affichage en français
   */
  static formatDateForDisplay(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Valide qu'une date est dans les limites acceptables
   */
  static validateDateRange(dateString: string): DateValidationResult {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(now.getFullYear() + this.MAX_YEARS_FUTURE);

      // Réinitialiser les heures pour une comparaison de dates uniquement
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (dateOnly < nowOnly) {
        return {
          isValid: false,
          errorMessage: 'La date ne peut pas être dans le passé'
        };
      }

      if (date > maxFutureDate) {
        return {
          isValid: false,
          errorMessage: `La date ne peut pas dépasser ${this.MAX_YEARS_FUTURE} ans dans le futur`
        };
      }

      // Avertissement pour les dates très éloignées (plus de 2 ans)
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(now.getFullYear() + 2);
      
      if (date > twoYearsFromNow) {
        return {
          isValid: true,
          warningMessage: 'Cette date est très éloignée dans le futur'
        };
      }

      return { isValid: true };
    } catch {
      return {
        isValid: false,
        errorMessage: 'Format de date invalide'
      };
    }
  }

  /**
   * Retourne le label approprié pour une unité avec la bonne forme grammaticale
   */
  static getUnitLabel(unit: TimeUnit, quantity: number): string {
    const isSingular = quantity === 1;

    switch (unit) {
      case 'days':
        return isSingular ? 'jour' : 'jours';
      case 'weeks':
        return isSingular ? 'semaine' : 'semaines';
      case 'months':
        return 'mois'; // Invariable en français
      case 'years':
        return isSingular ? 'année' : 'années';
      default:
        return unit;
    }
  }

  /**
   * Génère le texte de prévisualisation pour la sélection relative
   */
  static getPreviewText(quantity: number, unit: TimeUnit): string {
    if (!this.isValidQuantity(quantity)) {
      return '';
    }

    const unitLabel = this.getUnitLabel(unit, quantity);
    return `Dans ${quantity} ${unitLabel}`;
  }

  /**
   * Valide qu'une quantité est dans les limites acceptables
   */
  static isValidQuantity(quantity: number): boolean {
    return Number.isInteger(quantity) && 
           quantity >= this.MIN_QUANTITY && 
           quantity <= this.MAX_QUANTITY;
  }

  /**
   * Valide le format d'une date ISO (YYYY-MM-DD)
   */
  static isValidDateFormat(dateString: string): boolean {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDateRegex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Valide le format d'une heure (HH:mm)
   */
  static isValidTimeFormat(timeString: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }

  /**
   * Formate une date en format ISO (YYYY-MM-DD)
   */
  private static formatDateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Obtient la date actuelle au format ISO
   */
  static getCurrentDateISO(): string {
    return this.formatDateToISO(new Date());
  }

  /**
   * Calcule la différence en jours entre deux dates
   */
  static getDaysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}