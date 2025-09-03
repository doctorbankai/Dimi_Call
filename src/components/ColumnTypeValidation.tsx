import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info,
  Phone,
  User,
  Mail
} from 'lucide-react';
import { ColumnDataType } from './ColumnTypeSelector';
import { useColumnTypes } from '../hooks/useColumnTypes';
import { cn } from '../lib/utils';

interface ColumnTypeValidationProps {
  className?: string;
  onValidationComplete?: (isValid: boolean) => void;
}

// Types requis pour un import de contacts valide
const REQUIRED_TYPES: Record<string, ColumnDataType[]> = {
  'phone': ['phone'], // Au moins une colonne téléphone
  'name': ['text'],   // Au moins une colonne nom/prénom
  'email': ['email'], // Optionnel mais recommandé
};

// Types recommandés pour un bon import
const RECOMMENDED_TYPES: ColumnDataType[] = ['phone', 'text', 'email', 'date', 'time', 'comment', 'status'];

export const ColumnTypeValidation: React.FC<ColumnTypeValidationProps> = ({ 
  className,
  onValidationComplete 
}) => {
  const { columnTypes, getValidTypeCount } = useColumnTypes();

  // Vérifier si les types requis sont présents
  const hasRequiredTypes = () => {
    const types = Object.values(columnTypes);
    
    // Vérifier qu'il y a au moins une colonne téléphone
    const hasPhone = types.includes('phone');
    
    // Vérifier qu'il y a au moins une colonne texte (nom/prénom)
    const hasText = types.includes('text');
    
    return hasPhone && hasText;
  };

  // Vérifier les types recommandés
  const getRecommendedTypesCount = () => {
    const types = Object.values(columnTypes);
    return RECOMMENDED_TYPES.filter(type => types.includes(type)).length;
  };

  // Obtenir le score de validation (0-100)
  const getValidationScore = () => {
    const required = hasRequiredTypes() ? 50 : 0;
    const recommended = Math.min(getRecommendedTypesCount() * 10, 50);
    return required + recommended;
  };

  const validationScore = getValidationScore();
  const isValid = hasRequiredTypes();
  const recommendedCount = getRecommendedTypesCount();

  // Notifier le composant parent du résultat de validation
  React.useEffect(() => {
    if (onValidationComplete) {
      onValidationComplete(isValid);
    }
  }, [isValid, onValidationComplete]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-950/30';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30';
    return 'text-red-600 bg-red-50 dark:bg-red-950/30';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle2;
    if (score >= 60) return AlertTriangle;
    return XCircle;
  };

  const ScoreIcon = getScoreIcon(validationScore);

  return (
    <div className={cn(
      "p-4 border rounded-lg bg-card",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Info className="w-4 h-4 text-muted-foreground" />
          Validation des types de colonnes
        </h3>
        
        <Badge 
          variant="outline" 
          className={cn(
            "px-2 py-1 text-xs font-medium",
            getScoreColor(validationScore)
          )}
        >
          <ScoreIcon className="w-3 h-3 mr-1" />
          {validationScore}/100
        </Badge>
      </div>

      {/* Résumé de validation */}
      <div className="space-y-3 mb-4">
        {/* Types requis */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Types requis :
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-md text-sm",
              columnTypes && Object.values(columnTypes).includes('phone')
                ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
            )}>
              {columnTypes && Object.values(columnTypes).includes('phone') ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>Colonne téléphone</span>
            </div>
            
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-md text-sm",
              columnTypes && Object.values(columnTypes).includes('text')
                ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
            )}>
              {columnTypes && Object.values(columnTypes).includes('text') ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <User className="w-4 h-4 text-muted-foreground" />
              <span>Colonne nom/prénom</span>
            </div>
          </div>
        </div>

        {/* Types recommandés */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Types recommandés ({recommendedCount}/{RECOMMENDED_TYPES.length}) :
          </div>
          
          <div className="flex flex-wrap gap-1">
            {RECOMMENDED_TYPES.map((type) => {
              const hasType = columnTypes && Object.values(columnTypes).includes(type);
              return (
                <Badge
                  key={type}
                  variant="outline"
                  className={cn(
                    "text-xs px-2 py-1",
                    hasType 
                      ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200"
                      : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400"
                  )}
                >
                  {hasType ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {type}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messages de validation */}
      {isValid ? (
        <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              ✅ Import prêt ! Vos colonnes contiennent les types requis.
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              ⚠️ Import impossible. Assurez-vous d'avoir au moins une colonne téléphone et une colonne nom/prénom.
            </span>
          </div>
        </div>
      )}

      {/* Conseils d'amélioration */}
      {validationScore < 80 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">💡 Pour améliorer votre score :</p>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• Ajoutez des colonnes email pour un meilleur suivi</li>
                <li>• Incluez des colonnes de dates pour les rappels et RDV</li>
                <li>• Ajoutez des colonnes de commentaires pour les notes</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
