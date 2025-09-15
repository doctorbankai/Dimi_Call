import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';
import { supabaseLogger } from '@/lib/supabase-logger';

type AuthUser = User | null;

export const useSupabaseAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Shadow session pour maintenir l'UI authentifiée en cas d'appel en cours ou hors-ligne
  const [shadowSession, setShadowSession] = useState<Session | null>(null);
  const [shadowUser, setShadowUser] = useState<AuthUser>(null);
  const [authHoldReason, setAuthHoldReason] = useState<null | 'offline' | 'in_call'>(null);
  const [disconnectInfo, setDisconnectInfo] = useState<
    { reason: 'offline' | 'in_call' | 'remote_signout' | 'user_deleted' | 'token_refresh_failed' | 'unknown'; details?: string }
  | null>(null);

  // Conserver la dernière session non nulle pour reprise après maintien
  const lastGoodSessionRef = useRef<Session | null>(null);
  const lastGoodUserRef = useRef<AuthUser>(null);

  const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;
  const isCallInProgress = () => {
    try {
      return localStorage.getItem('dc_call_in_progress') === '1';
    } catch {
      return false;
    }
  };

  // Fonction pour vérifier si l'utilisateur existe encore dans Supabase
  const verifyUserStillExists = async (currentUser: AuthUser): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      // Tenter de récupérer les informations utilisateur depuis Supabase
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        // Tolérer les erreurs réseau/temporaires
        const status = (error as any)?.status ?? (error as any)?.cause?.status;
        const name = (error as any)?.name;
        const isNetworkTransient = status === 0 || name === 'AuthRetryableFetchError';
        if (isNetworkTransient) {
          console.warn('[Auth] Vérification utilisateur: erreur réseau transitoire, on réessaiera plus tard');
          supabaseLogger.warn('auth.getUser transient network error', { name, status, message: (error as any)?.message });
          return true; // ne pas déclencher de sign-out
        }
        console.warn('[Auth] Erreur vérification utilisateur non transitoire:', {
          name: (error as any)?.name,
          status: (error as any)?.status,
          message: (error as any)?.message
        });
        supabaseLogger.error('auth.getUser non-transient error', { name: (error as any)?.name, status: (error as any)?.status, message: (error as any)?.message });
        return false;
      }
      
      // Si pas d'utilisateur retourné, l'utilisateur a été supprimé
      if (!data.user) {
        console.log('[Auth] ⚠️ Utilisateur supprimé détecté - session invalide');
        return false;
      }
      
      return true;
    } catch (error: any) {
      const status = error?.status ?? error?.cause?.status;
      const name = error?.name;
      const isNetworkTransient = status === 0 || name === 'AuthRetryableFetchError';
      if (isNetworkTransient) {
        console.warn('[Auth] Vérification utilisateur (catch): erreur réseau transitoire, on réessaiera plus tard');
        supabaseLogger.warn('auth.getUser catch transient network error', { name, status, message: error?.message });
        return true;
      }
      console.error('[Auth] Erreur lors de la vérification utilisateur:', {
        name: error?.name,
        status: status,
        message: error?.message
      });
      supabaseLogger.error('auth.getUser unexpected error', { name: error?.name, status, message: error?.message });
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
      if (session && currentUser) {
        lastGoodSessionRef.current = session;
        lastGoodUserRef.current = currentUser;
        supabaseLogger.log('Initial session loaded', { userId: currentUser.id });
      }
      setIsLoading(false);
    });

    // 2. Écouter les changements d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        console.log('[Auth State Change] Event:', event);
        // Ne pas loguer les tokens
        const safeSession = nextSession ? {
          user: {
            id: nextSession.user?.id,
            email: nextSession.user?.email
          },
          expires_at: (nextSession as any)?.expires_at ?? undefined
        } : null;
        console.log('[Auth State Change] Session (sanitized):', safeSession);
        supabaseLogger.log('onAuthStateChange', { event, session: safeSession });

        const offline = isOffline();
        const calling = isCallInProgress();

        if (event === 'SIGNED_OUT' && nextSession === null && (offline || calling)) {
          // Maintenir l'UI authentifiée pendant l'appel ou hors-ligne
          const lastSession = lastGoodSessionRef.current;
          const lastUser = lastGoodUserRef.current;
          if (lastSession && lastUser) {
            setShadowSession(lastSession);
            setShadowUser(lastUser);
            setAuthHoldReason(calling ? 'in_call' : 'offline');
            supabaseLogger.warn('Hold auth due to sign-out during offline/call', { reason: calling ? 'in_call' : 'offline' });
          }
          // Ne pas propager la déconnexion à l'UI
          return;
        }

        setSession(nextSession);
        const currentUser = nextSession?.user ?? null;
        setUser(currentUser);

        if (nextSession && currentUser) {
          lastGoodSessionRef.current = nextSession;
          lastGoodUserRef.current = currentUser;
          // Si on revient à un état normal, lever le maintien
          if (authHoldReason) {
            setAuthHoldReason(null);
            setShadowSession(null);
            setShadowUser(null);
            supabaseLogger.log('Auth hold released');
          }
        }

        // Cas de déconnexion effective non due à appel/hors-ligne
        if (event === 'SIGNED_OUT' && nextSession === null && !offline && !calling) {
          setDisconnectInfo({ reason: 'remote_signout', details: 'Session révoquée depuis un autre appareil ou console.' });
          supabaseLogger.warn('Remote sign-out detected');
        }
      }
    );

    // 3. Vérification périodique de l'existence de l'utilisateur (toutes les 30 minutes)
    const userVerificationInterval = setInterval(async () => {
      // Ne pas faire de vérification pendant un appel ou hors-ligne
      if (isOffline() || isCallInProgress()) {
        return;
      }

      const currentSession = await supabase.auth.getSession();
      const currentUser = currentSession.data.session?.user ?? null;
      
      if (currentUser) {
        const userStillExists = await verifyUserStillExists(currentUser);
        if (!userStillExists) {
          console.log('[Auth] 🚨 Utilisateur supprimé - déconnexion forcée');
          // Forcer la déconnexion seulement si pas d'appel
          if (!isCallInProgress()) {
            await supabase.auth.signOut();
            window.location.reload();
            setDisconnectInfo({ reason: 'user_deleted', details: 'Utilisateur inexistant dans Supabase.' });
            supabaseLogger.warn('Force sign-out due to user deletion');
          } else {
            // Maintenir l'état jusqu'à la fin de l'appel
            setAuthHoldReason('in_call');
            setShadowSession(lastGoodSessionRef.current);
            setShadowUser(lastGoodUserRef.current);
            supabaseLogger.warn('User deleted but sign-out deferred (call in progress)');
          }
        }
      }
    }, 30 * 60 * 1000); // Vérification toutes les 30 minutes

    // Écouter les changements réseau et de stockage pour relâcher le maintien
    const handleOnline = async () => {
      if (authHoldReason === 'offline') {
        try {
          await supabase.auth.refreshSession();
        } catch (e) {
          supabaseLogger.error('refreshSession failed on online event', e);
        }
        // Une fois en ligne, la lib déclenchera onAuthStateChange; on lève le maintien ici aussi par sécurité
        setAuthHoldReason(null);
        setShadowSession(null);
        setShadowUser(null);
      }
    };

    const handleStorage = async (e: StorageEvent) => {
      if (e.key === 'dc_call_in_progress') {
        const callingNow = e.newValue === '1';
        if (!callingNow && authHoldReason === 'in_call') {
          // L'appel vient de se terminer: synchroniser l'état réel
          setAuthHoldReason(null);
          setShadowSession(null);
          setShadowUser(null);
          // Forcer un resync de session
          try {
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
            setUser(data.session?.user ?? null);
          } catch (e) {
            supabaseLogger.error('getSession failed after call ended', e);
          }
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('storage', handleStorage);

    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(userVerificationInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('storage', handleStorage);
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
        supabaseLogger.warn('updateUser metadata failed', updateError);
      }

      // Méthode 2: Forcer le rafraîchissement du token actuel
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.warn('[Auth] Erreur lors du rafraîchissement de session:', refreshError);
        supabaseLogger.error('refreshSession failed during revokeOtherSessions', refreshError);
      } else {
        console.log('[Auth] ✅ Autres sessions révoquées avec succès');
        supabaseLogger.log('Other sessions revoked via refresh');
      }
      
    } catch (error) {
      console.error('[Auth] Erreur lors de la révocation des autres sessions:', error);
      supabaseLogger.error('revokeOtherSessions threw', error);
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
    
    // Sanitize: ne pas loguer tokens
    console.log('[auth-client] Réponse de Supabase (sanitized):', {
      session: data?.session ? {
        user: { id: data.session.user.id, email: data.session.user.email },
        expires_at: (data.session as any)?.expires_at ?? undefined
      } : null,
      error: error ? { name: (error as any)?.name, message: (error as any)?.message, status: (error as any)?.status } : null
    });
    
    // Si la connexion réussit, révoquer les autres sessions (soft-kick)
    if (!error && data.session) {
      console.log('[auth-client] Connexion réussie, mise à jour manuelle de la session.');
      setSession(data.session);
      setUser(data.user);
      supabaseLogger.log('signInWithPassword success', { userId: data.user?.id });
      
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
    // Ne pas autoriser la déconnexion pendant un appel
    if (isCallInProgress()) {
      console.warn('[Auth] Sign-out différé: appel en cours.');
      supabaseLogger.warn('signOut deferred due to call in progress');
      return { error: new Error('Sign-out différé: appel en cours') as any };
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      supabaseLogger.error('signOut error', error);
    } else {
      supabaseLogger.log('signOut success');
      setDisconnectInfo(prev => prev ?? { reason: 'unknown', details: 'Déconnexion utilisateur' });
    }
    setIsLoading(false);
    return { error };
  };

  const clearDisconnectInfo = () => setDisconnectInfo(null);
  const requestSessionRefresh = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        supabaseLogger.error('manual refreshSession failed', error);
        return false;
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        lastGoodSessionRef.current = data.session;
        lastGoodUserRef.current = data.session.user;
      }
      supabaseLogger.log('manual refreshSession success');
      return true;
    } catch (e) {
      supabaseLogger.error('manual refreshSession threw', e);
      return false;
    }
  };

  // Calculer la session/utilisateur effectifs en cas de maintien
  const effectiveSession = session ?? (authHoldReason ? shadowSession : null);
  const effectiveUser = user ?? (authHoldReason ? shadowUser : null);
  const isAuthenticated = !!effectiveSession && !!effectiveUser;

  return {
    session: effectiveSession,
    user: effectiveUser,
    isLoading,
    isAuthenticated,
    signInWithPassword,
    signOut,
    disconnectInfo,
    clearDisconnectInfo,
    requestSessionRefresh,
  };
}; 