# Design Document

## Overview

Cette fonctionnalité modifie l'ordre des colonnes lors de l'export des données pour respecter un nouvel ordre spécifique. Elle inclut également l'ajout de trois nouvelles colonnes vides (Sexe, Type, Qualité) qui n'existent pas dans la structure de données actuelle mais doivent apparaître dans l'export pour permettre un remplissage manuel ultérieur.

## Architecture

### Composants affectés

1. **Service d'export** - Modification de la logique de génération des colonnes
2. **Mapping des colonnes** - Création d'un système de mapping pour le nouvel ordre
3. **Gestion des colonnes virtuelles** - Ajout des colonnes vides (Sexe, Type, Qualité)
4. **Compatibilité import** - Maintien de la compatibilité avec les anciens formats

### Stratégie d'implémentation

1. **Configuration centralisée** : Définir l'ordre des colonnes dans une configuration
2. **Colonnes virtuelles** : Ajouter les nouvelles colonnes uniquement à l'export
3. **Mapping flexible** : Permettre l'ajout facile de nouvelles colonnes à l'avenir
4. **Rétrocompatibilité** : Maintenir la compatibilité avec les imports existants

## Components and Interfaces

### 1. Configuration de l'ordre des colonnes

```typescript
// src/config/exportColumnOrder.ts
export interface ExportColumnConfig {
  /** Nom de la colonne tel qu'il apparaît dans l'export */
  exportName: string;
  /** Nom de la propriété dans les données (null pour les colonnes virtuelles) */
  dataProperty: string | null;
  /** Position dans l'ordre d'export */
  order: number;
  /** Indique si c'est une colonne virtuelle (vide) */
  isVirtual: boolean;
  /** Valeur par défaut pour les colonnes virtuelles */
  defaultValue?: string;
}

export const EXPORT_COLUMN_ORDER: ExportColumnConfig[] = [
  { exportName: 'Date Rappel', dataProperty: 'dateRappel', order: 1, isVirtual: false },
  { exportName: 'Heure Rappel', dataProperty: 'heureRappel', order: 2, isVirtual: false },
  { exportName: 'Sexe', dataProperty: null, order: 3, isVirtual: true, defaultValue: '' },
  { exportName: 'Prénom', dataProperty: 'prenom', order: 4, isVirtual: false },
  { exportName: 'Nom', dataProperty: 'nom', order: 5, isVirtual: false },
  { exportName: 'Téléphone', dataProperty: 'telephone', order: 6, isVirtual: false },
  { exportName: 'Mail', dataProperty: 'mail', order: 7, isVirtual: false },
  { exportName: 'École/Source', dataProperty: 'source', order: 8, isVirtual: false },
  { exportName: 'Type', dataProperty: null, order: 9, isVirtual: true, defaultValue: '' },
  { exportName: 'Qualité', dataProperty: null, order: 10, isVirtual: true, defaultValue: '' },
  { exportName: 'Lien', dataProperty: 'lien', order: 11, isVirtual: false },
  { exportName: 'Date Appel', dataProperty: 'dateAppel', order: 12, isVirtual: false },
  { exportName: 'Heure Appel', dataProperty: 'heureAppel', order: 13, isVirtual: false },
  { exportName: 'Statut', dataProperty: 'statut', order: 14, isVirtual: false },
  { exportName: 'Commentaire', dataProperty: 'commentaire', order: 15, isVirtual: false },
];
```

### 2. Service de réorganisation des colonnes

```typescript
// src/services/exportColumnService.ts
export class ExportColumnService {
  /**
   * Réorganise les données selon le nouvel ordre de colonnes
   */
  static reorderDataForExport(data: any[]): any[] {
    if (!data || data.length === 0) return [];

    return data.map(row => this.reorderRowForExport(row));
  }

  /**
   * Réorganise une ligne de données selon le nouvel ordre
   */
  private static reorderRowForExport(row: any): any {
    const reorderedRow: any = {};

    // Ajouter les colonnes dans l'ordre défini
    EXPORT_COLUMN_ORDER.forEach(columnConfig => {
      if (columnConfig.isVirtual) {
        // Colonne virtuelle - ajouter une valeur vide
        reorderedRow[columnConfig.exportName] = columnConfig.defaultValue || '';
      } else if (columnConfig.dataProperty && row[columnConfig.dataProperty] !== undefined) {
        // Colonne existante - copier la valeur
        reorderedRow[columnConfig.exportName] = row[columnConfig.dataProperty];
      } else {
        // Propriété manquante - valeur vide
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
    const configuredProperties = new Set(
      EXPORT_COLUMN_ORDER
        .filter(config => !config.isVirtual && config.dataProperty)
        .map(config => config.dataProperty)
    );

    Object.keys(originalRow).forEach(key => {
      if (!configuredProperties.has(key) && !reorderedRow[key]) {
        reorderedRow[key] = originalRow[key];
      }
    });
  }

  /**
   * Obtient l'ordre des colonnes pour l'export
   */
  static getExportColumnOrder(): string[] {
    const orderedColumns = EXPORT_COLUMN_ORDER
      .sort((a, b) => a.order - b.order)
      .map(config => config.exportName);

    return orderedColumns;
  }

  /**
   * Valide la configuration des colonnes
   */
  static validateColumnConfiguration(): boolean {
    const orders = EXPORT_COLUMN_ORDER.map(config => config.order);
    const uniqueOrders = new Set(orders);
    
    if (orders.length !== uniqueOrders.size) {
      console.error('Erreur : Ordres de colonnes dupliqués détectés');
      return false;
    }

    return true;
  }
}
```

### 3. Extension du service d'export existant

```typescript
// Modification du service d'export existant
export class DataService {
  /**
   * Exporte les données avec le nouvel ordre de colonnes
   */
  static exportToCSV(data: any[], filename: string = 'export.csv'): void {
    try {
      // Valider la configuration
      if (!ExportColumnService.validateColumnConfiguration()) {
        throw new Error('Configuration des colonnes invalide');
      }

      // Réorganiser les données
      const reorderedData = ExportColumnService.reorderDataForExport(data);
      
      if (reorderedData.length === 0) {
        console.warn('Aucune donnée à exporter');
        return;
      }

      // Obtenir l'ordre des colonnes
      const columnOrder = ExportColumnService.getExportColumnOrder();
      
      // Générer le CSV avec l'ordre spécifié
      const csvContent = this.generateCSVWithColumnOrder(reorderedData, columnOrder);
      
      // Télécharger le fichier
      this.downloadCSV(csvContent, filename);
      
      console.log('Export réussi avec le nouvel ordre de colonnes');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      throw error;
    }
  }

  /**
   * Génère le contenu CSV avec un ordre de colonnes spécifique
   */
  private static generateCSVWithColumnOrder(data: any[], columnOrder: string[]): string {
    if (data.length === 0) return '';

    // Créer l'en-tête avec l'ordre spécifié
    const headers = columnOrder.join(',');
    
    // Créer les lignes de données
    const rows = data.map(row => {
      return columnOrder.map(column => {
        const value = row[column] || '';
        // Échapper les guillemets et encapsuler si nécessaire
        return this.escapeCSVValue(value);
      }).join(',');
    });

    return [headers, ...rows].join('\n');
  }

  /**
   * Échappe les valeurs CSV
   */
  private static escapeCSVValue(value: any): string {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // Si la valeur contient des virgules, guillemets ou retours à la ligne
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      // Échapper les guillemets en les doublant et encapsuler
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }
}
```

### 4. Gestion de la rétrocompatibilité

```typescript
// src/services/importCompatibilityService.ts
export class ImportCompatibilityService {
  /**
   * Détecte le format d'un fichier importé (ancien ou nouveau)
   */
  static detectImportFormat(headers: string[]): 'legacy' | 'new' | 'unknown' {
    const newFormatIndicators = ['Sexe', 'Type', 'Qualité'];
    const hasNewColumns = newFormatIndicators.some(indicator => 
      headers.includes(indicator)
    );

    if (hasNewColumns) return 'new';

    // Vérifier si c'est l'ancien format
    const legacyIndicators = ['Prénom', 'Nom', 'Téléphone'];
    const hasLegacyColumns = legacyIndicators.every(indicator => 
      headers.includes(indicator)
    );

    return hasLegacyColumns ? 'legacy' : 'unknown';
  }

  /**
   * Normalise les données importées vers le format interne
   */
  static normalizeImportedData(data: any[], format: 'legacy' | 'new'): any[] {
    if (format === 'new') {
      // Supprimer les colonnes virtuelles qui pourraient contenir des données
      return data.map(row => {
        const { Sexe, Type, Qualité, ...normalizedRow } = row;
        return normalizedRow;
      });
    }

    // Format legacy - pas de transformation nécessaire
    return data;
  }
}
```

## Data Models

### 1. Configuration des colonnes

```typescript
interface ExportColumnConfig {
  exportName: string;      // Nom affiché dans l'export
  dataProperty: string | null;  // Propriété des données (null = virtuelle)
  order: number;          // Position dans l'export
  isVirtual: boolean;     // Colonne virtuelle (vide)
  defaultValue?: string;  // Valeur par défaut
}
```

### 2. Métadonnées d'export

```typescript
interface ExportMetadata {
  columnCount: number;
  virtualColumnCount: number;
  dataColumnCount: number;
  exportDate: string;
  format: 'new' | 'legacy';
}
```

## Error Handling

### 1. Validation de la configuration

```typescript
const validateConfiguration = (): ValidationResult => {
  const errors: string[] = [];
  
  // Vérifier les ordres dupliqués
  const orders = EXPORT_COLUMN_ORDER.map(c => c.order);
  const duplicates = orders.filter((order, index) => orders.indexOf(order) !== index);
  if (duplicates.length > 0) {
    errors.push(`Ordres dupliqués: ${duplicates.join(', ')}`);
  }
  
  // Vérifier les noms dupliqués
  const names = EXPORT_COLUMN_ORDER.map(c => c.exportName);
  const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicateNames.length > 0) {
    errors.push(`Noms de colonnes dupliqués: ${duplicateNames.join(', ')}`);
  }
  
  return { isValid: errors.length === 0, errors };
};
```

### 2. Gestion des erreurs d'export

```typescript
const handleExportError = (error: Error, data: any[]): void => {
  console.error('Erreur lors de l\'export:', error);
  
  // Tentative de fallback vers l'ancien format
  try {
    console.log('Tentative d\'export avec l\'ancien format...');
    exportWithLegacyFormat(data);
  } catch (fallbackError) {
    console.error('Échec du fallback:', fallbackError);
    throw new Error('Export impossible avec les deux formats');
  }
};
```

## Testing Strategy

### 1. Tests unitaires

```typescript
describe('ExportColumnService', () => {
  test('should reorder columns according to configuration');
  test('should add virtual columns with empty values');
  test('should preserve all existing data');
  test('should handle missing properties gracefully');
  test('should add remaining columns at the end');
});

describe('ImportCompatibilityService', () => {
  test('should detect new format correctly');
  test('should detect legacy format correctly');
  test('should normalize imported data correctly');
});
```

### 2. Tests d'intégration

```typescript
describe('Export Integration', () => {
  test('should export with correct column order');
  test('should handle empty datasets');
  test('should maintain data integrity');
  test('should be compatible with import');
});
```

### 3. Tests end-to-end

```typescript
describe('Export-Import Workflow', () => {
  test('should complete full export-import cycle');
  test('should handle legacy file imports');
  test('should handle new format imports');
});
```

## Implementation Details

### 1. Migration strategy

1. **Phase 1** : Implémenter le nouveau service sans affecter l'export existant
2. **Phase 2** : Intégrer le nouveau service dans l'export
3. **Phase 3** : Tester la compatibilité avec les imports existants
4. **Phase 4** : Déployer avec fallback vers l'ancien format

### 2. Configuration management

- Configuration centralisée dans un fichier dédié
- Validation au démarrage de l'application
- Possibilité d'ajouter facilement de nouvelles colonnes
- Logs détaillés pour le débogage

### 3. Performance considerations

- Réorganisation en mémoire pour éviter les I/O multiples
- Validation de configuration mise en cache
- Optimisation pour les gros datasets
- Gestion de la mémoire pour les exports volumineux

## Security Considerations

### 1. Validation des données

- Validation des noms de colonnes
- Échappement approprié des valeurs CSV
- Protection contre l'injection de formules
- Limitation de la taille des exports

### 2. Intégrité des données

- Vérification de l'intégrité après réorganisation
- Checksums pour les gros exports
- Logs d'audit pour les opérations d'export
- Sauvegarde des configurations critiques