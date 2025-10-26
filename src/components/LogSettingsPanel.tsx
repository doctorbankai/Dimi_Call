import { useState, useEffect } from 'react';
import { logConfigService, type LogConfig, type LogLevel } from '../services/logConfig';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, RotateCcw } from 'lucide-react';

export function LogSettingsPanel() {
  const [logConfig, setLogConfig] = useState<LogConfig>(logConfigService.getConfig());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const unsubscribe = logConfigService.addListener((newConfig) => {
      setLogConfig(newConfig);
      setHasChanges(false);
    });

    return unsubscribe;
  }, []);

  const handleConfigChange = (updates: Partial<LogConfig>) => {
    const newConfig = { ...logConfig, ...updates };
    setLogConfig(newConfig);
    setHasChanges(true);
  };

  const handleLevelChange = (category: keyof LogConfig['logLevels'], level: LogLevel) => {
    const newConfig = {
      ...logConfig,
      logLevels: { ...logConfig.logLevels, [category]: level }
    };
    setLogConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = () => {
    logConfigService.updateConfig(logConfig);
    setHasChanges(false);
  };

  const handleReset = () => {
    logConfigService.reset();
    setLogConfig(logConfigService.getConfig());
    setHasChanges(false);
  };

  const categories: Array<{ key: keyof LogConfig['logLevels']; label: string; description: string }> = [
    { key: 'adb', label: 'ADB', description: 'Logs de connexion Android Debug Bridge' },
    { key: 'contacts', label: 'Contacts', description: 'Logs de synchronisation des contacts' },
    { key: 'components', label: 'Composants', description: 'Logs des composants React' },
    { key: 'supabase', label: 'Supabase', description: 'Logs de la base de données' },
    { key: 'import', label: 'Import', description: 'Logs d\'import CSV/Excel' },
    { key: 'general', label: 'Général', description: 'Logs généraux de l\'application' },
  ];

  const levelOptions: Array<{ value: LogLevel; label: string; description: string }> = [
    { value: 'off', label: 'Désactivé', description: 'Aucun log' },
    { value: 'error', label: 'Erreurs', description: 'Erreurs uniquement' },
    { value: 'warn', label: 'Avertissements', description: 'Erreurs + avertissements' },
    { value: 'info', label: 'Informations', description: 'Erreurs + avertissements + infos' },
    { value: 'debug', label: 'Debug', description: 'Tous les logs (verbose)' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuration des Logs</CardTitle>
          <CardDescription>
            Contrôlez le niveau de détail des logs pour chaque catégorie. 
            Réduire les logs améliore les performances.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Options globales */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Options Globales</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="debug-logs">Logs de Debug</Label>
                <p className="text-xs text-muted-foreground">
                  Active les logs détaillés pour le développement
                </p>
              </div>
              <Switch
                id="debug-logs"
                checked={logConfig.enableDebugLogs}
                onCheckedChange={(checked) => handleConfigChange({ enableDebugLogs: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="verbose-logs">Logs Verbeux</Label>
                <p className="text-xs text-muted-foreground">
                  Affiche tous les détails (peut ralentir l'application)
                </p>
              </div>
              <Switch
                id="verbose-logs"
                checked={logConfig.enableVerboseLogs}
                onCheckedChange={(checked) => handleConfigChange({ enableVerboseLogs: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="performance-logs">Logs de Performance</Label>
                <p className="text-xs text-muted-foreground">
                  Mesure et affiche les temps d'exécution
                </p>
              </div>
              <Switch
                id="performance-logs"
                checked={logConfig.enablePerformanceLogs}
                onCheckedChange={(checked) => handleConfigChange({ enablePerformanceLogs: checked })}
              />
            </div>
          </div>

          {/* Niveaux par catégorie */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Niveaux par Catégorie</h3>
            
            <div className="grid gap-4">
              {categories.map((category) => (
                <div key={category.key} className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-0.5">
                    <Label htmlFor={`level-${category.key}`} className="font-medium">
                      {category.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                  <Select
                    value={logConfig.logLevels[category.key]}
                    onValueChange={(value) => handleLevelChange(category.key, value as LogLevel)}
                  >
                    <SelectTrigger id={`level-${category.key}`} className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {levelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Avertissement */}
          {logConfig.enableVerboseLogs && (
            <div className="flex items-start gap-2 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Les logs verbeux peuvent générer beaucoup de données et ralentir l'application.
                Utilisez cette option uniquement pour le débogage.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex-1"
            >
              Enregistrer
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recommandations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Production:</strong> Utilisez "Erreurs" pour toutes les catégories
          </p>
          <p>
            <strong>Développement:</strong> Utilisez "Informations" ou "Debug" selon vos besoins
          </p>
          <p>
            <strong>Performance:</strong> Désactivez les logs ADB et Contacts si vous n'en avez pas besoin
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
