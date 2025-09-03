import { useState, useEffect, useCallback } from 'react';
import { ColumnDataType } from '../components/ColumnTypeSelector';

interface ColumnTypeMapping {
  [columnId: string]: ColumnDataType;
}

const STORAGE_KEY = 'contact-table-column-types';

// Mapping automatique des types basé sur les noms de colonnes
const AUTO_TYPE_MAPPING: Record<string, ColumnDataType> = {
  // Colonnes de base
  'index': 'number',
  'prenom': 'text',
  'nom': 'text',
  'telephone': 'phone',
  'email': 'email',
  'mail': 'email',
  'statut': 'status',
  'commentaire': 'comment',
  
  // Colonnes de dates
  'dateRappel': 'date',
  'dateRDV': 'date',
  'dateAppel': 'date',
  'date_rappel': 'date',
  'date_rdv': 'date',
  'date_appel': 'date',
  
  // Colonnes d'heures
  'heureRappel': 'time',
  'heureRDV': 'time',
  'heureAppel': 'time',
  'heure_rappel': 'time',
  'heure_rdv': 'time',
  'heure_appel': 'time',
  
  // Colonnes de durée
  'dureeAppel': 'duration',
  'duree_appel': 'duration',
  'duree': 'duration',
  
  // Colonnes de source
  'source': 'text',
  
  // Colonnes génériques
  'id': 'number',
  'comment': 'comment',
  'note': 'comment',
  'description': 'comment',
  'status': 'status',
  'etat': 'status',
  'type': 'status',
};

export const useColumnTypes = () => {
  const [columnTypes, setColumnTypes] = useState<ColumnTypeMapping>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Charger les types depuis le localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setColumnTypes(parsed);
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des types de colonnes:', error);
    }
    setIsInitialized(true);
  }, []);

  // Sauvegarder les types dans le localStorage
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(columnTypes));
      } catch (error) {
        console.warn('Erreur lors de la sauvegarde des types de colonnes:', error);
      }
    }
  }, [columnTypes, isInitialized]);

  // Détecter automatiquement le type d'une colonne
  const detectColumnType = useCallback((columnId: string, columnLabel: string): ColumnDataType => {
    // Vérifier d'abord si on a déjà un type sauvegardé
    if (columnTypes[columnId]) {
      return columnTypes[columnId];
    }

    // Détection automatique basée sur l'ID de la colonne
    const lowerId = columnId.toLowerCase();
    const lowerLabel = columnLabel.toLowerCase();
    
    // Vérifier le mapping automatique
    for (const [pattern, type] of Object.entries(AUTO_TYPE_MAPPING)) {
      if (lowerId.includes(pattern.toLowerCase()) || lowerLabel.includes(pattern.toLowerCase())) {
        return type;
      }
    }

    // Détection basée sur le contenu de la colonne (si disponible)
    // Cette logique peut être étendue plus tard

    return 'unknown';
  }, [columnTypes]);

  // Mettre à jour le type d'une colonne
  const updateColumnType = useCallback((columnId: string, newType: ColumnDataType) => {
    setColumnTypes(prev => ({
      ...prev,
      [columnId]: newType
    }));
  }, []);

  // Réinitialiser tous les types
  const resetColumnTypes = useCallback(() => {
    setColumnTypes({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Obtenir le type d'une colonne
  const getColumnType = useCallback((columnId: string, columnLabel: string): ColumnDataType => {
    return detectColumnType(columnId, columnLabel);
  }, [detectColumnType]);

  // Vérifier si une colonne a un type valide
  const hasValidType = useCallback((columnId: string): boolean => {
    const type = columnTypes[columnId];
    return type && type !== 'unknown';
  }, [columnTypes]);

  // Obtenir le nombre de colonnes avec des types valides
  const getValidTypeCount = useCallback((): number => {
    return Object.values(columnTypes).filter(type => type !== 'unknown').length;
  }, [columnTypes]);

  return {
    columnTypes,
    getColumnType,
    updateColumnType,
    resetColumnTypes,
    hasValidType,
    getValidTypeCount,
    isInitialized
  };
};
