import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download } from 'lucide-react';
import { UpdateInfo, UpdateConfirmationDialogProps } from '../types/update';

export const UpdateConfirmationDialog: React.FC<UpdateConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  updateInfo
}) => {
  // Gérer la fermeture avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        console.log('🔄 Fermeture du dialog de mise à jour via Échap');
        onClose();
      }
    };

    if (isOpen) {
      console.log('🔄 Ouverture du dialog de confirmation de mise à jour');
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleConfirm = () => {
    try {
      console.log('✅ Mise à jour confirmée par l\'utilisateur');
      onConfirm();
      onClose();
    } catch (error) {
      console.error('❌ Erreur lors de la confirmation de mise à jour:', error);
      // En cas d'erreur, on ferme quand même le dialog pour éviter de bloquer l'utilisateur
      onClose();
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">
                Mise à jour disponible
              </DialogTitle>
              {updateInfo?.version && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    Version {updateInfo.version}
                  </Badge>
                  {updateInfo.isBeta && (
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                      BETA
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
        </DialogHeader>

        {/* Message d'avertissement */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
              Êtes-vous sûr de vouloir installer la mise à jour ?
            </p>
            <p className="text-amber-700 dark:text-amber-300">
              Il est recommandé de sauvegarder votre travail avant de continuer. 
              L'application va redémarrer automatiquement après l'installation.
            </p>
          </div>
        </div>



        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            className="w-full sm:w-auto order-1 sm:order-2 bg-blue-600 hover:bg-blue-700"
          >
            Oui, mettre à jour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};