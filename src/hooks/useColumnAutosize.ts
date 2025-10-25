import { useLayoutEffect, useState, useRef } from 'react';
import { Contact } from '../types';
import { createTextMeasurer, measureColumnWidth } from '../utils/measureText';

export interface ColumnSizeConfig {
  id: string;
  label: string;
  minSize: number;
  maxSize: number;
  widgetPadding: number;
}

export interface UseColumnAutosizeOptions {
  data: Contact[];
  columns: ColumnSizeConfig[];
  sampleSize?: number;
  enabled?: boolean;
}

export interface ColumnSizes {
  [columnId: string]: number;
}

/**
 * Hook d'autosize intelligent pour colonnes de table
 * Mesure le contenu réel via Canvas API (comme Excel AutoFit)
 * 
 * @param data - Données du tableau
 * @param columns - Configuration des colonnes
 * @param sampleSize - Nombre de lignes à échantillonner (défaut: 50)
 * @param enabled - Activer/désactiver l'autosize
 * @returns Objet avec les tailles calculées par colonne
 */
export function useColumnAutosize({
  data,
  columns,
  sampleSize = 50,
  enabled = true
}: UseColumnAutosizeOptions): ColumnSizes {
  const [sizes, setSizes] = useState<ColumnSizes>({});
  const measurerRef = useRef(createTextMeasurer());
  
  useLayoutEffect(() => {
    if (!enabled || data.length === 0 || columns.length === 0) {
      return;
    }
    
    const measurer = measurerRef.current;
    const newSizes: ColumnSizes = {};
    
    // Échantillonner les données
    const sample = data.slice(0, Math.min(sampleSize, data.length));
    
    // Mesurer chaque colonne
    for (const col of columns) {
      const texts: string[] = [];
      
      // Ajouter le header
      texts.push(col.label);
      
      // Extraire les textes de l'échantillon
      for (const row of sample) {
        let text = '';
        
        switch (col.id) {
          case 'numeroLigne':
          case 'index':
            text = String(data.indexOf(row) + 1);
            break;
          case 'prenom':
            text = row.prenom || 'N/A';
            break;
          case 'nom':
            text = row.nom || 'N/A';
            break;
          case 'telephone':
            text = row.telephone || 'N/A';
            break;
          case 'email':
            // Limiter à 50 chars pour mesure
            text = (row.email || 'N/A').substring(0, 50);
            break;
          case 'source':
            text = row.source || 'N/A';
            break;
          case 'commentaire':
            // Limiter à 100 chars pour mesure
            text = (row.commentaire || 'Commentaire...').substring(0, 100);
            break;
          case 'lien':
            // Limiter à 80 chars pour mesure
            text = (row.lien || 'N/A').substring(0, 80);
            break;
          case 'statut':
            text = row.statut || 'Non défini';
            break;
          case 'dateRappel':
          case 'dateRDV':
          case 'dateAppel':
            // ✅ Mesurer "Sélectionner" au lieu de "00/00/00" car c'est ce qui s'affiche
            text = row[col.id as keyof Contact] as string || 'Sélectionner';
            break;
          case 'heureRappel':
          case 'heureRDV':
          case 'heureAppel':
            // ✅ Mesurer "Heure" au lieu de "00:00" car c'est ce qui s'affiche
            text = row[col.id as keyof Contact] as string || 'Heure';
            break;
          case 'dureeAppel':
            text = row.dureeAppel || '0s';
            break;
          case 'sexe':
            text = row.sexe || 'N/A';
            break;
          case 'don':
            text = row.don || 'N/A';
            break;
          case 'type':
            text = row.type || 'N/A';
            break;
          case 'qualite':
            text = row.qualite || 'N/A';
            break;
          case 'date':
            text = row.date || '00/00/00';
            break;
          case 'uid':
            text = row.uid || 'N/A';
            break;
          default:
            text = String((row as any)[col.id] || 'N/A');
        }
        
        texts.push(text);
      }
      
      // Mesurer la largeur optimale
      const width = measureColumnWidth(texts, measurer, {
        padding: 24,
        widgetPadding: col.widgetPadding,
        minSize: col.minSize,
        maxSize: col.maxSize
      });
      
      newSizes[col.id] = width;
    }
    
    setSizes(newSizes);
    
    // Cleanup
    return () => {
      measurer.clearCache();
    };
  }, [data, columns, sampleSize, enabled]);
  
  return sizes;
}
