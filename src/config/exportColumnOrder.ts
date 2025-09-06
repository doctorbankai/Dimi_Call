/**
 * Configuration centralisée de l'ordre des colonnes pour l'export
 */

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

/**
 * Nouvel ordre des colonnes pour l'export
 * Ordre requis : Date Rappel, Heure Rappel, Sexe, Prénom, Nom, Téléphone, Mail, 
 * École/Source, Type, Qualité, Lien, Date Appel, Heure Appel, Statut, Commentaire, 
 * puis toutes les autres colonnes restantes
 */
export const EXPORT_COLUMN_ORDER: ExportColumnConfig[] = [
  { exportName: 'Date Rappel', dataProperty: 'dateRappel', order: 1, isVirtual: false },
  { exportName: 'Heure Rappel', dataProperty: 'heureRappel', order: 2, isVirtual: false },
  { exportName: 'Sexe', dataProperty: null, order: 3, isVirtual: true, defaultValue: '' },
  { exportName: 'Prénom', dataProperty: 'prenom', order: 4, isVirtual: false },
  { exportName: 'Nom', dataProperty: 'nom', order: 5, isVirtual: false },
  { exportName: 'Téléphone', dataProperty: 'telephone', order: 6, isVirtual: false },
  { exportName: 'Mail', dataProperty: 'email', order: 7, isVirtual: false },
  { exportName: 'École/Source', dataProperty: 'source', order: 8, isVirtual: false },
  { exportName: 'Type', dataProperty: null, order: 9, isVirtual: true, defaultValue: '' },
  { exportName: 'Qualité', dataProperty: null, order: 10, isVirtual: true, defaultValue: '' },
  { exportName: 'Lien', dataProperty: 'lien', order: 11, isVirtual: false },
  { exportName: 'Date Appel', dataProperty: 'dateAppel', order: 12, isVirtual: false },
  { exportName: 'Heure Appel', dataProperty: 'heureAppel', order: 13, isVirtual: false },
  { exportName: 'Statut', dataProperty: 'statut', order: 14, isVirtual: false },
  { exportName: 'Commentaire', dataProperty: 'commentaire', order: 15, isVirtual: false },
  { exportName: 'Date RDV', dataProperty: 'dateRDV', order: 16, isVirtual: false },
  { exportName: 'Heure RDV', dataProperty: 'heureRDV', order: 17, isVirtual: false },
];

/**
 * Mapping des anciennes colonnes vers les nouvelles pour la compatibilité
 */
export const LEGACY_COLUMN_MAPPING: Record<string, string> = {
  'Prénom': 'prenom',
  'Nom': 'nom',
  'Téléphone': 'telephone',
  'Mail': 'email',
  'École/Source': 'source',
  'Statut': 'statut',
  'Commentaire': 'commentaire',
  'Date Rappel': 'dateRappel',
  'Heure Rappel': 'heureRappel',
  'Date RDV': 'dateRDV',
  'Heure RDV': 'heureRDV',
  'Date Appel': 'dateAppel',
  'Heure Appel': 'heureAppel',
  'Durée Appel': 'dureeAppel',
  'Lien': 'lien'
};

/**
 * Valide la configuration des colonnes d'export
 */
export const validateColumnConfiguration = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Vérifier les ordres dupliqués
  const orders = EXPORT_COLUMN_ORDER.map(config => config.order);
  const uniqueOrders = new Set(orders);
  if (orders.length !== uniqueOrders.size) {
    const duplicates = orders.filter((order, index) => orders.indexOf(order) !== index);
    errors.push(`Ordres de colonnes dupliqués détectés: ${[...new Set(duplicates)].join(', ')}`);
  }
  
  // Vérifier les noms de colonnes dupliqués
  const names = EXPORT_COLUMN_ORDER.map(config => config.exportName);
  const uniqueNames = new Set(names);
  if (names.length !== uniqueNames.size) {
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
    errors.push(`Noms de colonnes dupliqués détectés: ${[...new Set(duplicateNames)].join(', ')}`);
  }
  
  // Vérifier que les ordres commencent à 1 et sont consécutifs
  const sortedOrders = [...orders].sort((a, b) => a - b);
  for (let i = 0; i < sortedOrders.length; i++) {
    if (sortedOrders[i] !== i + 1) {
      errors.push(`Les ordres de colonnes doivent être consécutifs à partir de 1. Ordre manquant ou incorrect: ${i + 1}`);
      break;
    }
  }
  
  // Vérifier que les colonnes virtuelles ont des propriétés null
  const virtualColumnsWithProperties = EXPORT_COLUMN_ORDER.filter(
    config => config.isVirtual && config.dataProperty !== null
  );
  if (virtualColumnsWithProperties.length > 0) {
    const invalidColumns = virtualColumnsWithProperties.map(config => config.exportName);
    errors.push(`Les colonnes virtuelles ne doivent pas avoir de dataProperty: ${invalidColumns.join(', ')}`);
  }
  
  // Vérifier que les colonnes non-virtuelles ont des propriétés
  const nonVirtualColumnsWithoutProperties = EXPORT_COLUMN_ORDER.filter(
    config => !config.isVirtual && !config.dataProperty
  );
  if (nonVirtualColumnsWithoutProperties.length > 0) {
    const invalidColumns = nonVirtualColumnsWithoutProperties.map(config => config.exportName);
    errors.push(`Les colonnes non-virtuelles doivent avoir une dataProperty: ${invalidColumns.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Obtient la liste des colonnes virtuelles
 */
export const getVirtualColumns = (): ExportColumnConfig[] => {
  return EXPORT_COLUMN_ORDER.filter(config => config.isVirtual);
};

/**
 * Obtient la liste des colonnes de données
 */
export const getDataColumns = (): ExportColumnConfig[] => {
  return EXPORT_COLUMN_ORDER.filter(config => !config.isVirtual);
};

/**
 * Obtient l'ordre des colonnes trié par position
 */
export const getSortedColumnOrder = (): ExportColumnConfig[] => {
  return [...EXPORT_COLUMN_ORDER].sort((a, b) => a.order - b.order);
};

/**
 * Trouve une configuration de colonne par nom d'export
 */
export const findColumnConfigByExportName = (exportName: string): ExportColumnConfig | undefined => {
  return EXPORT_COLUMN_ORDER.find(config => config.exportName === exportName);
};

/**
 * Trouve une configuration de colonne par propriété de données
 */
export const findColumnConfigByDataProperty = (dataProperty: string): ExportColumnConfig | undefined => {
  return EXPORT_COLUMN_ORDER.find(config => config.dataProperty === dataProperty);
};