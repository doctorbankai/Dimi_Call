import { createClient } from '@supabase/supabase-js';

// Configuration Supabase - DOIT être configuré via variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vérification de la configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Configuration Supabase manquante!');
  console.error('Créez un fichier .env.local avec:');
  console.error('VITE_SUPABASE_URL=https://votre-projet.supabase.co');
  console.error('VITE_SUPABASE_ANON_KEY=votre_cle_anon');
  throw new Error('Configuration Supabase manquante - Voir .env.example');
}

// LOGS DE DÉBOGAGE (sans exposer les clés)
if (import.meta.env.DEV) {
  console.log('🔧 [DEBUG] Supabase configuré:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    keyPrefix: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'undefined'
  });
}

// Configuration du client avec options de sécurité
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Stockage sécurisé des tokens
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  // Options de sécurité supplémentaires
  global: {
    headers: {
      'X-Client-Info': 'dimicall-desktop',
    },
  },
});

// Types pour l'utilisateur
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    license_expires_at?: string;
  };
}

// Interface pour l'utilisateur de la base de données
export interface DatabaseUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
} 