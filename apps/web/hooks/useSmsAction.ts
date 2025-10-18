import { useState } from 'react';
import { toast } from 'sonner';

export function useSmsAction() {
  const [isLoading, setIsLoading] = useState(false);

  const sendSmsAction = async (phoneNumber: string, message: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Utiliser l'API Electron IPC au lieu de fetch
      if (!window.electron?.adb?.sendSms) {
        throw new Error('API Electron ADB non disponible');
      }

      const result = await window.electron.adb.sendSms(phoneNumber, message);

      if (result.success) {
        toast.success(result.message || 'Application SMS ouverte avec succès');
        console.log('SMS préparé avec succès:', result);
        
        // Afficher un avertissement si présent
        if (result.warning) {
          toast.warning(result.warning);
        }
      } else {
        toast.error(result.error || 'Erreur lors de l\'ouverture de l\'application SMS');
        console.error('Erreur SMS:', result);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du SMS:', error);
      toast.error('Impossible d\'ouvrir l\'application SMS');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendSmsAction,
    isLoading,
  };
} 
