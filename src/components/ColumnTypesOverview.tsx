import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw,
  Settings,
  Info
} from 'lucide-react';
import { ColumnDataType } from './ColumnTypeSelector';
import { useColumnTypes } from '../hooks/useColumnTypes';
import { cn } from '../lib/utils';

interface ColumnTypesOverviewProps {
  className?: string;
}

const TYPE_COLORS: Record<ColumnDataType, string> = {
  text: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200',
  number: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200',
  phone: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200',
  email: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200',
  date: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200',
  time: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-200',
  duration: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-200',
  comment: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200',
  status: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-200',
  unknown: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200',
};

const TYPE_ICONS: Record<ColumnDataType, React.ComponentType<any>> = {
  text: Info,
  number: Info,
  phone: Info,
  email: Info,
  date: Info,
  time: Info,
  duration: Info,
  comment: Info,
  status: Info,
  unknown: HelpCircle,
};

export const ColumnTypesOverview: React.FC<ColumnTypesOverviewProps> = ({ className }) => {
  const { 
    columnTypes, 
    getValidTypeCount, 
    resetColumnTypes, 
    isInitialized 
  } = useColumnTypes();

  const totalColumns = Object.keys(columnTypes).length;
  const validTypes = getValidTypeCount();
  const unknownTypes = totalColumns - validTypes;

  if (!isInitialized) {
    return null;
  }

  return (
    <div className={cn(
      "p-4 border rounded-lg bg-card",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Types de colonnes détectés</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetColumnTypes}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Résumé des types */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <div>
            <div className="text-sm font-medium text-green-700 dark:text-green-300">
              {validTypes}
            </div>
            <div className="text-xs text-muted-foreground">
              Types reconnus
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
          <AlertCircle className="w-4 h-4 text-orange-600" />
          <div>
            <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
              {unknownTypes}
            </div>
            <div className="text-xs text-muted-foreground">
              À définir
            </div>
          </div>
        </div>
      </div>

      {/* Détail des types */}
      {totalColumns > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Répartition des types :
          </div>
          
          <div className="flex flex-wrap gap-1">
            {Object.entries(columnTypes).map(([columnId, type]) => {
              const Icon = TYPE_ICONS[type];
              return (
                <Badge
                  key={columnId}
                  variant="outline"
                  className={cn(
                    "text-xs px-2 py-1 border",
                    TYPE_COLORS[type]
                  )}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {columnId}: {type}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Message d'aide */}
      {totalColumns === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            Aucun type de colonne défini pour le moment.
          </p>
          <p className="text-xs mt-1">
            Les types seront automatiquement détectés lors de l'import de données.
          </p>
        </div>
      )}

      {/* Conseils */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">💡 Conseils d'import :</p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
              <li>• Assurez-vous d'avoir une colonne "Téléphone" pour les appels</li>
              <li>• Les colonnes "Nom" et "Prénom" sont essentielles</li>
              <li>• Utilisez le sélecteur de type pour corriger la détection automatique</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
