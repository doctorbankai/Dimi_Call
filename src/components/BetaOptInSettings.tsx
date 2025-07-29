import React, { useState, useCallback } from 'react';
import { BetaPreferences } from '../types/update';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from './ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Beaker, Shield, ArrowLeft, Code } from 'lucide-react';

export interface BetaOptInSettingsProps {
  /** Préférences bêta actuelles */
  betaPreferences: BetaPreferences;
  
  /** Callback appelé quand les préférences changent */
  onPreferencesChange: (preferences: BetaPreferences) => void;
  
  /** Indique si une version bêta est actuellement utilisée */
  isCurrentVersionBeta: boolean;
  
  /** Callback pour revenir à la version stable */
  onRevertToStable?: () => void;
  
  /** Indique si le processus de retour à la version stable est en cours */
  isRevertingToStable?: boolean;

  /** État actuel des DevTools */
  devToolsEnabled: boolean;
  
  /** Callback pour activer/désactiver les DevTools */
  onDevToolsToggle: (enabled: boolean) => void;
}

export const BetaOptInSettings: React.FC<BetaOptInSettingsProps> = ({
  betaPreferences,
  onPreferencesChange,
  isCurrentVersionBeta,
  onRevertToStable,
  isRevertingToStable = false,
  devToolsEnabled,
  onDevToolsToggle,
}) => {
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);

  const handleBetaToggle = useCallback((checked: boolean) => {
    if (checked && !betaPreferences.hasBeenWarned) {
      // Première activation : afficher l'avertissement
      setShowWarningDialog(true);
    } else {
      // Changement direct
      onPreferencesChange({
        ...betaPreferences,
        enabled: checked,
        lastModified: Date.now(),
      });
    }
  }, [betaPreferences, onPreferencesChange]);

  const handleWarningConfirm = useCallback(() => {
    // Marquer comme averti et activer les versions bêta
    onPreferencesChange({
      ...betaPreferences,
      enabled: true,
      hasBeenWarned: true,
      lastModified: Date.now(),
    });
    setShowWarningDialog(false);
  }, [betaPreferences, onPreferencesChange]);

  const handleWarningCancel = useCallback(() => {
    setShowWarningDialog(false);
  }, []);

  const handleRevertToStable = useCallback(() => {
    setShowRevertDialog(true);
  }, []);

  const handleRevertConfirm = useCallback(() => {
    if (onRevertToStable) {
      onRevertToStable();
    }
    setShowRevertDialog(false);
  }, [onRevertToStable]);

  const handleRevertCancel = useCallback(() => {
    setShowRevertDialog(false);
  }, []);

  return (
    <>
      <div className="space-y-4">
        {/* Section principale */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-md bg-orange-500/10 flex items-center justify-center">
            <Beaker className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">Versions bêta</h4>
                {isCurrentVersionBeta && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    BETA
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Recevez les nouvelles fonctionnalités en avant-première
              </p>
            </div>

            {/* Checkbox d'activation */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="beta-opt-in"
                checked={betaPreferences.enabled}
                onCheckedChange={handleBetaToggle}
                disabled={isRevertingToStable}
              />
              <label
                htmlFor="beta-opt-in"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Recevoir les versions bêta
              </label>
            </div>

            {/* Informations supplémentaires */}
            {betaPreferences.enabled && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-orange-800 dark:text-orange-200">
                    <p className="font-medium mb-1">Versions bêta activées</p>
                    <ul className="space-y-1 text-orange-700 dark:text-orange-300">
                      <li>• Nouvelles fonctionnalités en test</li>
                      <li>• Outils de débogage automatiquement activés</li>
                      <li>• Mises à jour plus fréquentes</li>
                      <li>• Possibilité de bugs ou d'instabilités</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton de retour à la version stable */}
            {isCurrentVersionBeta && onRevertToStable && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevertToStable}
                disabled={isRevertingToStable}
                className="text-xs"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                {isRevertingToStable ? 'Retour en cours...' : 'Revenir à la version stable'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Section DevTools */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center">
            <Code className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="font-medium text-sm">Outils de développement</h4>
              <p className="text-xs text-muted-foreground">
                Activez les DevTools pour analyser et déboguer l'application
              </p>
            </div>

            {/* Checkbox DevTools */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="devtools-toggle"
                checked={devToolsEnabled}
                onCheckedChange={onDevToolsToggle}
                disabled={isRevertingToStable}
              />
              <label
                htmlFor="devtools-toggle"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Activer les outils de développement (Ctrl+Shift+I)
              </label>
            </div>

            {/* Informations DevTools */}
            {devToolsEnabled && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Code className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">DevTools activés</p>
                    <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                      <li>• Accès à la console de développement</li>
                      <li>• Inspection des éléments et du DOM</li>
                      <li>• Débogage JavaScript et analyse des performances</li>
                      <li>• Utile pour reporter des bugs et analyser les problèmes</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog d'avertissement pour la première activation */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Activer les versions bêta
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Vous êtes sur le point d'activer les versions bêta de DimiCall
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                ⚠️ Important à savoir
              </h4>
              <ul className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>Les versions bêta peuvent contenir des bugs ou des fonctionnalités instables</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>Les outils de débogage (Ctrl+Shift+I) seront automatiquement activés</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>Vous recevrez des mises à jour plus fréquentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>Vous pouvez revenir aux versions stables à tout moment</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                💡 Recommandations
              </h4>
              <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>• Sauvegardez régulièrement vos données importantes</li>
                <li>• Signalez les bugs rencontrés via les outils de débogage</li>
                <li>• Utilisez les versions bêta dans un environnement de test si possible</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleWarningCancel}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleWarningConfirm}
              className="w-full sm:w-auto order-1 sm:order-2 bg-orange-600 hover:bg-orange-700"
            >
              J'accepte, activer les versions bêta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation pour le retour à la version stable */}
      <Dialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Revenir à la version stable
            </DialogTitle>
            <DialogDescription>
              Vous allez revenir à la dernière version stable de DimiCall
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Ce qui va se passer :</strong>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>• Téléchargement de la dernière version stable</li>
                <li>• Désactivation automatique des outils de débogage</li>
                <li>• Redémarrage de l'application</li>
                <li>• Vos données seront conservées</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleRevertCancel}>
              Annuler
            </Button>
            <Button onClick={handleRevertConfirm}>
              Confirmer le retour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};