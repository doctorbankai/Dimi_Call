import React from 'react';
import { supabaseLogger } from '@/lib/supabase-logger';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export interface DisconnectInfo {
  reason: 'offline' | 'in_call' | 'remote_signout' | 'user_deleted' | 'token_refresh_failed' | 'unknown';
  details?: string;
}

interface Props {
  open: boolean;
  info: DisconnectInfo | null;
  onClose?: () => void;
  onRetry?: () => void;
}

export const SupabaseDisconnectDialog: React.FC<Props> = ({ open, info, onClose, onRetry }) => {
  const title = 'Vous avez été déconnecté';

  const reasonText = (() => {
    switch (info?.reason) {
      case 'offline': return "Perte de connexion internet détectée.";
      case 'in_call': return "Appel en cours. La déconnexion est différée jusqu'à la fin de l'appel.";
      case 'remote_signout': return "La session a été révoquée depuis un autre appareil.";
      case 'user_deleted': return "Le compte utilisateur a été désactivé/supprimé dans Supabase.";
      case 'token_refresh_failed': return "Le rafraîchissement du jeton d'authentification a échoué.";
      default: return "Raison inconnue.";
    }
  })();

  const handleDownload = () => {
    supabaseLogger.download();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {reasonText}
            {info?.details ? (
              <span className="block mt-2 text-muted-foreground">Détails: {info.details}</span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="secondary" onClick={handleDownload}>Télécharger les logs</Button>
          {onRetry ? (
            <Button onClick={onRetry}>Réessayer</Button>
          ) : null}
          {onClose ? (
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};


