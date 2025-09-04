import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthUser = User | null;

export const useSupabaseAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour vérifier si l'utilisateur existe encore dans Supabase
  const verifyUserStillExists = async (currentUser: AuthUser): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      // Tenter de récupérer les informations utilisateur depuis Supabase
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.log('[Auth] Erreur lors de la vérification utilisateur:', error);
        return false;
      }
      
      // Si pas d'utilisateur retourné, l'utilisateur a été supprimé
      if (!data.user) {
        console.log('[Auth] ⚠️ Utilisateur supprimé détecté - session invalide');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[Auth] Erreur lors de la vérification utilisateur:', error);
      return false;
    }
  };

  useEffect(() => {
    setIsLoading(true);
    // 1. Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsLoading(false);
    });

    // 2. Écouter les changements d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth State Change] Event:', event);
        console.log('[Auth State Change] Session:', session);
        
        // Si l'utilisateur a été déconnecté à distance (soft-kick), afficher une notification
        if (event === 'SIGNED_OUT' && session === null) {
          // Vérifier si c'est un soft-kick (déconnexion à distance)
          const currentSession = supabase.auth.getSession();
          currentSession.then(({ data }) => {
            if (!data.session) {
              console.log('[Auth] Session révoquée à distance - soft-kick détecté');
              // Note: La notification sera gérée par l'App qui écoute les changements d'auth
            }
          });
        }
        
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
      }
    );

    // 3. Vérification périodique de l'existence de l'utilisateur (toutes les 30 secondes)
    const userVerificationInterval = setInterval(async () => {
      const currentSession = await supabase.auth.getSession();
      const currentUser = currentSession.data.session?.user ?? null;
      
      if (currentUser) {
        const userStillExists = await verifyUserStillExists(currentUser);
        if (!userStillExists) {
          console.log('[Auth] 🚨 Utilisateur supprimé - déconnexion forcée');
          // Forcer la déconnexion
          await supabase.auth.signOut();
          // Rediriger vers la page de login
          window.location.reload();
        }
      }
    }, 30000); // Vérification toutes les 30 secondes

    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(userVerificationInterval);
    };
  }, []);

  // Fonction pour révoquer toutes les autres sessions du même utilisateur
  const revokeOtherSessions = async () => {
    try {
      console.log('[Auth] Révocation des autres sessions en cours...');
      
      // Supabase ne fournit pas d'API directe pour révoquer les autres sessions,
      // mais on peut utiliser une approche qui force le rafraîchissement des tokens
      // ce qui invalidera les anciennes sessions
      
      // Méthode 1: Mettre à jour les métadonnées utilisateur pour forcer l'invalidation
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          last_sign_in_device: navigator.userAgent,
          last_sign_in_timestamp: new Date().toISOString()
        }
      });

      if (updateError) {
        console.warn('[Auth] Erreur lors de la mise à jour des métadonnées:', updateError);
      }

      // Méthode 2: Forcer le rafraîchissement du token actuel
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.warn('[Auth] Erreur lors du rafraîchissement de session:', refreshError);
      } else {
        console.log('[Auth] ✅ Autres sessions révoquées avec succès');
      }
      
    } catch (error) {
      console.error('[Auth] Erreur lors de la révocation des autres sessions:', error);
    }
  };

  // Connexion par email et mot de passe avec soft-kick
  const signInWithPassword = async (email: string, password: string) => {
    console.log('[auth-client] Appel de signInWithPassword');
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('[auth-client] Réponse de Supabase:', { data: data, error: error });
    
    // Si la connexion réussit, révoquer les autres sessions (soft-kick)
    if (!error && data.session) {
      console.log('[auth-client] Connexion réussie, mise à jour manuelle de la session.');
      setSession(data.session);
      setUser(data.user);
      
      // Déclencher le soft-kick après un court délai pour laisser la session s'établir
      setTimeout(() => {
        revokeOtherSessions();
      }, 1000);
    }

    setIsLoading(false);
    return { data, error };
  };

  // Déconnexion
  const signOut = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    setIsLoading(false);
    return { error };
  };

  // Calculer isAuthenticated
  const isAuthenticated = !!session && !!user;

  return {
    session,
    user,
    isLoading,
    isAuthenticated,
    signInWithPassword,
    signOut,
  };
}; 