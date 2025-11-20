/**
 * Configuration automatique des utilisateurs
 * 
 * Ce module simplifie la gestion des utilisateurs en s'assurant qu'ils sont
 * correctement configurés dès leur création, sans nécessiter de requêtes SQL manuelles.
 */

import { supabase } from './supabase';

export interface UserSetupResult {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * Vérifie et configure automatiquement un utilisateur après sa création
 * Cette fonction s'assure que l'utilisateur a tous les champs nécessaires
 */
export async function ensureUserIsConfigured(userId: string): Promise<UserSetupResult> {
  try {
    // 1. Récupérer l'utilisateur actuel
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      console.error('[UserSetup] Erreur récupération utilisateur:', userError);
      return {
        success: false,
        message: `Impossible de récupérer l'utilisateur: ${userError?.message || 'Utilisateur non trouvé'}`
      };
    }

    const user = userData.user;
    
    // 2. Vérifier si l'utilisateur a déjà une licence
    const hasLicense = user.app_metadata?.license_expires_at;
    
    if (hasLicense) {
      console.log('[UserSetup] ✅ Utilisateur déjà configuré avec licence');
      return {
        success: true,
        message: 'Utilisateur déjà configuré',
        userId: user.id
      };
    }

    // 3. Ajouter une licence par défaut (1 an)
    const licenseExpiresAt = new Date();
    licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 1);
    
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...user.app_metadata,
        license_expires_at: licenseExpiresAt.toISOString()
      }
    });

    if (updateError) {
      console.error('[UserSetup] Erreur mise à jour utilisateur:', updateError);
      return {
        success: false,
        message: `Erreur lors de la configuration: ${updateError.message}`
      };
    }

    console.log('[UserSetup] ✅ Utilisateur configuré avec succès');
    return {
      success: true,
      message: 'Utilisateur configuré avec succès',
      userId: user.id
    };

  } catch (error: any) {
    console.error('[UserSetup] Erreur inattendue:', error);
    return {
      success: false,
      message: `Erreur inattendue: ${error.message}`
    };
  }
}

/**
 * Crée un nouvel utilisateur avec configuration automatique
 * Cette fonction remplace le processus manuel d'invitation + configuration SQL
 */
export async function createConfiguredUser(
  email: string,
  password: string,
  options?: {
    licenseMonths?: number; // Durée de la licence en mois (défaut: 12)
    autoConfirmEmail?: boolean; // Confirmer l'email automatiquement (défaut: true)
  }
): Promise<UserSetupResult> {
  try {
    const licenseMonths = options?.licenseMonths || 12;
    const autoConfirmEmail = options?.autoConfirmEmail !== false;

    // 1. Créer l'utilisateur
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: autoConfirmEmail,
      app_metadata: {
        license_expires_at: new Date(
          Date.now() + licenseMonths * 30 * 24 * 60 * 60 * 1000
        ).toISOString()
      }
    });

    if (error || !data.user) {
      console.error('[UserSetup] Erreur création utilisateur:', error);
      return {
        success: false,
        message: `Erreur lors de la création: ${error?.message || 'Utilisateur non créé'}`
      };
    }

    console.log('[UserSetup] ✅ Utilisateur créé et configuré:', data.user.email);
    return {
      success: true,
      message: `Utilisateur ${email} créé avec succès. Licence valide ${licenseMonths} mois.`,
      userId: data.user.id
    };

  } catch (error: any) {
    console.error('[UserSetup] Erreur inattendue:', error);
    return {
      success: false,
      message: `Erreur inattendue: ${error.message}`
    };
  }
}

/**
 * Prolonge la licence d'un utilisateur
 */
export async function extendUserLicense(
  userId: string,
  additionalMonths: number = 12
): Promise<UserSetupResult> {
  try {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      return {
        success: false,
        message: `Utilisateur non trouvé: ${userError?.message}`
      };
    }

    const user = userData.user;
    const currentExpiry = user.app_metadata?.license_expires_at 
      ? new Date(user.app_metadata.license_expires_at)
      : new Date();

    // Ajouter les mois à partir de la date d'expiration actuelle
    const newExpiry = new Date(currentExpiry);
    newExpiry.setMonth(newExpiry.getMonth() + additionalMonths);

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...user.app_metadata,
        license_expires_at: newExpiry.toISOString()
      }
    });

    if (updateError) {
      return {
        success: false,
        message: `Erreur lors de la prolongation: ${updateError.message}`
      };
    }

    return {
      success: true,
      message: `Licence prolongée de ${additionalMonths} mois jusqu'au ${newExpiry.toLocaleDateString()}`,
      userId: user.id
    };

  } catch (error: any) {
    return {
      success: false,
      message: `Erreur inattendue: ${error.message}`
    };
  }
}

/**
 * Vérifie si la licence d'un utilisateur est valide
 */
export function isLicenseValid(user: any): boolean {
  if (!user?.app_metadata?.license_expires_at) {
    return false;
  }

  const expiryDate = new Date(user.app_metadata.license_expires_at);
  return expiryDate > new Date();
}

/**
 * Obtient les informations de licence d'un utilisateur
 */
export function getLicenseInfo(user: any): {
  hasLicense: boolean;
  isValid: boolean;
  expiresAt?: Date;
  daysRemaining?: number;
} {
  const hasLicense = !!user?.app_metadata?.license_expires_at;
  
  if (!hasLicense) {
    return { hasLicense: false, isValid: false };
  }

  const expiresAt = new Date(user.app_metadata.license_expires_at);
  const now = new Date();
  const isValid = expiresAt > now;
  const daysRemaining = isValid 
    ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    hasLicense: true,
    isValid,
    expiresAt,
    daysRemaining
  };
}
