/**
 * Service de réorganisation des colonnes pour l'export
 */

import { 
  EXPORT_COLUMN_ORDER, 
  ExportColumnConfig, 
  validateColumnConfiguration,
  getSortedColumnOrder 
} from '../config/exportColumnOrder';

export class ExportColumnService {
  /**
   * Réorganise les données selon le nouvel ordre de colonnes
   */
  static reorderDataForExport(data: any[]): any[] {
    if (!data || data.length === 0) {
      console.warn('ExportColumnService: Aucune donnée à réorganiser');
      return [];
    }

    console.log(`ExportColumnService: Réorganisation de ${data.length} lignes de données`);
    
    // Valider la configuration avant de procéder
    const validation = validateColumnConfiguration();
    if (!validation.isValid) {
      console.error('ExportColumnService: Configuration invalide:', validation.errors);
      throw new Error(`Configuration des colonnes invalide: ${validation.errors.join(', ')}`);
    }

    return data.map((row, index) => {
      try {
        return this.reorderRowForExport(row);
      } catch (error) {
        console.error(`ExportColumnService: Erreur lors de la réorganisation de la ligne ${index}:`, error);
        throw new Error(`Erreur lors de la réorganisation de la ligne ${index}: ${error}`);
      }
    });
  }

  /**
   * Réorganise une ligne de données selon le nouvel ordre
   */
  private static reorderRowForExport(row: any): any {
    if (!row || typeof row !== 'object') {
      console.warn('ExportColumnService: Ligne de données invalide:', row);
      return {};
    }

    const reorderedRow: any = {};
    const sortedColumns = getSortedColumnOrder();

    // Ajouter les colonnes dans l'ordre défini
    sortedColumns.forEach(columnConfig => {
      if (columnConfig.isVirtual) {
        // Colonne virtuelle - ajouter une valeur vide
        reorderedRow[columnConfig.exportName] = columnConfig.defaultValue || '';
      } else if (columnConfig.dataProperty) {
        // Colonne existante - copier la valeur
        const value = row[columnConfig.dataProperty];
        reorderedRow[columnConfig.exportName] = value !== undefined ? value : '';
      } else {
        // Cas d'erreur - colonne non-virtuelle sans propriété
        console.warn(`ExportColumnService: Colonne non-virtuelle sans dataProperty: ${columnConfig.exportName}`);
        reorderedRow[columnConfig.exportName] = '';
      }
    });

    // Ajouter les colonnes restantes qui ne sont pas dans la configuration
    this.addRemainingColumns(row, reorderedRow);

    return reorderedRow;
  }

  /**
   * Ajoute les colonnes restantes qui ne sont pas dans la configuration
   */
  private static addRemainingColumns(originalRow: any, reorderedRow: any): void {
    // Créer un set des propriétés déjà configurées
    const configuredProperties = new Set(
      EXPORT_COLUMN_ORDER
        .filter(config => !config.isVirtual && config.dataProperty)
        .map(config => config.dataProperty)
    );

    // Créer un set des noms d'export déjà utilisés
    const usedExportNames = new Set(
      EXPORT_COLUMN_ORDER.map(config => config.exportName)
    );

    // Ajouter les propriétés non configurées
    Object.keys(originalRow).forEach(key => {
      if (!configuredProperties.has(key) && !usedExportNames.has(key)) {
        reorderedRow[key] = originalRow[key];
      }
    });
  }

  /**
   * Obtient l'ordre des colonnes pour l'export
   */
  static getExportColumnOrder(): string[] {
    const sortedColumns = getSortedColumnOrder();
    return sortedColumns.map(config => config.exportName);
  }

  /**
   * Obtient les en-têtes pour l'export avec les colonnes restantes
   */
  static getExportHeaders(sampleData?: any): string[] {
    const configuredHeaders = this.getExportColumnOrder();
    
    if (!sampleData) {
      return configuredHeaders;
    }

    // Ajouter les colonnes restantes trouvées dans les données
    const configuredProperties = new Set(
      EXPORT_COLUMN_ORDER
        .filter(config => !config.isVirtual && config.dataProperty)
        .map(config => config.dataProperty)
    );

    const usedExportNames = new Set(configuredHeaders);
    const remainingHeaders: string[] = [];

    Object.keys(sampleData).forEach(key => {
      if (!configuredProperties.has(key) && !usedExportNames.has(key)) {
        remainingHeaders.push(key);
      }
    });

    return [...configuredHeaders, ...remainingHeaders];
  }

  /**
   * Valide la configuration des colonnes
   */
  static validateColumnConfiguration(): boolean {
    const validation = validateColumnConfiguration();
    if (!validation.isValid) {
      console.error('ExportColumnService: Erreurs de configuration:', validation.errors);
      return false;
    }
    return true;
  }

  /**
   * Obtient des statistiques sur la configuration
   */
  static getConfigurationStats(): {
    totalColumns: number;
    dataColumns: number;
    virtualColumns: number;
    virtualColumnNames: string[];
  } {
    const virtualColumns = EXPORT_COLUMN_ORDER.filter(config => config.isVirtual);
    const dataColumns = EXPORT_COLUMN_ORDER.filter(config => !config.isVirtual);

    return {
      totalColumns: EXPORT_COLUMN_ORDER.length,
      dataColumns: dataColumns.length,
      virtualColumns: virtualColumns.length,
      virtualColumnNames: virtualColumns.map(config => config.exportName)
    };
  }

  /**
   * Crée un mapping des anciennes colonnes vers les nouvelles
   */
  static createColumnMapping(oldHeaders: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    oldHeaders.forEach(oldHeader => {
      // Chercher une correspondance dans la configuration
      const config = EXPORT_COLUMN_ORDER.find(
        config => config.exportName === oldHeader || config.dataProperty === oldHeader
      );
      
      if (config) {
        mapping[oldHeader] = config.exportName;
      } else {
        // Garder le nom original pour les colonnes non configurées
        mapping[oldHeader] = oldHeader;
      }
    });

    return mapping;
  }

  /**
   * Vérifie si une colonne est virtuelle
   */
  static isVirtualColumn(columnName: string): boolean {
    const config = EXPORT_COLUMN_ORDER.find(config => config.exportName === columnName);
    return config ? config.isVirtual : false;
  }

  /**
   * Obtient la valeur par défaut d'une colonne virtuelle
   */
  static getVirtualColumnDefaultValue(columnName: string): string {
    const config = EXPORT_COLUMN_ORDER.find(
      config => config.exportName === columnName && config.isVirtual
    );
    return config?.defaultValue || '';
  }

  /**
   * Debug: Affiche la configuration actuelle
   */
  static debugConfiguration(): void {
    console.log('=== Configuration des colonnes d\'export ===');
    const sortedColumns = getSortedColumnOrder();
    
    sortedColumns.forEach(config => {
      const type = config.isVirtual ? 'VIRTUELLE' : 'DONNÉES';
      const property = config.dataProperty || 'N/A';
      console.log(`${config.order}. ${config.exportName} (${type}) → ${property}`);
    });

    const stats = this.getConfigurationStats();
    console.log('\n=== Statistiques ===');
    console.log(`Total: ${stats.totalColumns}, Données: ${stats.dataColumns}, Virtuelles: ${stats.virtualColumns}`);
    console.log(`Colonnes virtuelles: ${stats.virtualColumnNames.join(', ')}`);
  }
}