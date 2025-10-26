/**
 * Service utilitaire pour les calculs de dates relatives et la validation
 * Utilisé pour la fonctionnalité de sélection de dates de rappel
 */

export type TimeUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

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
      case 'minutes':
        futureDate.setMinutes(now.getMinutes() + quantity);
        break;
      case 'hours':
        futureDate.setHours(now.getHours() + quantity);
        break;
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
   * Calcule une date et heure futures basées sur une quantité et une unité de temps
   * Utilisé pour les minutes et heures
   */
  static calculateFutureDateWithTime(quantity: number, unit: 'minutes' | 'hours'): { date: string; time: string } {
    if (!this.isValidQuantity(quantity)) {
      throw new Error('Quantité invalide');
    }

    const now = new Date();
    const futureDate = new Date(now);

    switch (unit) {
      case 'minutes':
        futureDate.setMinutes(now.getMinutes() + quantity);
        break;
      case 'hours':
        futureDate.setHours(now.getHours() + quantity);
        break;
      default:
        throw new Error('Unité de temps invalide pour le calcul avec heure');
    }

    const date = this.formatDateToISO(futureDate);
    const hours = futureDate.getHours().toString().padStart(2, '0');
    const minutes = futureDate.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;

    return { date, time };
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
      // Si la chaîne est au format date seule (YYYY-MM-DD), on valide au jour près
      const isDateOnly = this.isValidDateFormat(dateString);

      if (isDateOnly) {
        // Parser la date manuellement pour éviter les problèmes de fuseau horaire
        const [yearStr, monthStr, dayStr] = dateString.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1; // Les mois commencent à 0
        const day = parseInt(dayStr, 10);
        
        // Créer les dates en heure locale pour une comparaison correcte
        const dateOnly = new Date(year, month, day);
        const now = new Date();
        const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Réinitialiser les heures pour une comparaison au jour près
        dateOnly.setHours(0, 0, 0, 0);
        nowOnly.setHours(0, 0, 0, 0);

        console.log('[DateCalculationService] Validation de date:', {
          dateString,
          dateOnly: dateOnly.toISOString(),
          nowOnly: nowOnly.toISOString(),
          isPast: dateOnly < nowOnly,
          dateTime: dateOnly.getTime(),
          nowTime: nowOnly.getTime()
        });

        if (dateOnly < nowOnly) {
          return {
            isValid: false,
            errorMessage: 'La date ne peut pas être dans le passé'
          };
        }

        // Vérifier la limite future
        const maxFutureDate = new Date(now.getFullYear() + this.MAX_YEARS_FUTURE, now.getMonth(), now.getDate());
        maxFutureDate.setHours(0, 0, 0, 0);
        
        if (dateOnly > maxFutureDate) {
          return {
            isValid: false,
            errorMessage: `La date ne peut pas dépasser ${this.MAX_YEARS_FUTURE} ans dans le futur`
          };
        }

        // Avertissement pour les dates très éloignées (plus de 2 ans)
        const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
        twoYearsFromNow.setHours(0, 0, 0, 0);

        if (dateOnly > twoYearsFromNow) {
          return {
            isValid: true,
            warningMessage: 'Cette date est très éloignée dans le futur'
          };
        }

        return { isValid: true };
      }

      // Pour les dates avec heure
      const date = new Date(dateString);
      const now = new Date();
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(now.getFullYear() + this.MAX_YEARS_FUTURE);

      // Si l'heure est présente dans la chaîne, appliquer une validation à la minute près
      if (date <= now) {
        return {
          isValid: false,
          errorMessage: 'Le rappel doit être programmé dans le futur'
        };
      }

      if (date > maxFutureDate) {
        return {
          isValid: false,
          errorMessage: `La date ne peut pas dépasser ${this.MAX_YEARS_FUTURE} ans dans le futur`
        };
      }

      // Avertissement pour les rappels très proches (moins de 5 minutes)
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      if (date < fiveMinutesFromNow) {
        return {
          isValid: true,
          warningMessage: 'Ce rappel est programmé dans moins de 5 minutes'
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
      case 'minutes':
        return isSingular ? 'minute' : 'minutes';
      case 'hours':
        return isSingular ? 'heure' : 'heures';
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
   * Valide le format d'une heure (HH:mm ou format 12h avec AM/PM)
   */
  static isValidTimeFormat(timeString: string): boolean {
    if (!timeString || timeString.trim() === '') {
      return true; // L'heure vide est valide (optionnelle)
    }
    
    // Format 24h (HH:mm)
    const time24Regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (time24Regex.test(timeString)) {
      return true;
    }
    
    // Format 12h (h:mm AM/PM ou hh:mm AM/PM)
    const time12Regex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    return time12Regex.test(timeString);
  }

  /**
   * Convertit une heure du format 12h (AM/PM) vers le format 24h (HH:mm)
   */
  static convertTo24Hour(timeString: string): string {
    if (!timeString || timeString.trim() === '') {
      return '';
    }

    // Si déjà au format 24h, retourner tel quel
    const time24Regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (time24Regex.test(timeString)) {
      return timeString;
    }

    // Parser le format 12h
    const time12Regex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i;
    const match = timeString.match(time12Regex);
    
    if (!match) {
      return timeString; // Retourner tel quel si format invalide
    }

    let hour = parseInt(match[1], 10);
    const minute = match[2];
    const period = match[3].toUpperCase();

    // Conversion
    if (period === 'AM') {
      if (hour === 12) hour = 0; // Minuit
    } else { // PM
      if (hour !== 12) hour += 12; // Après-midi/soir
    }

    return `${hour.toString().padStart(2, '0')}:${minute}`;
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