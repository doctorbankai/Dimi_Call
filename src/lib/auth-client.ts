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



  useEffect(() => {
    setIsLoading(true);
    // 1. Récupérer la session initiale
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // TENTATIVE DE RESTAURATION MANUELLE SI SESSION NULLE
      if (!session) {
        try {
          const backupSessionStr = localStorage.getItem('dimicall_session_backup');
          // Vérifier d'abord si "Se souvenir de moi" est actif
          const rememberMePref = localStorage.getItem('dimicall_remember_me_pref');

          if (backupSessionStr && rememberMePref !== 'false') {
            console.log('[Auth] ⚠️ Session initialement nulle, tentative de restauration depuis backup...');
            const backupSession = JSON.parse(backupSessionStr);

            if (backupSession?.refresh_token && backupSession?.access_token) {
              const { data, error } = await supabase.auth.setSession({
                access_token: backupSession.access_token,
                refresh_token: backupSession.refresh_token,
              });

              if (!error && data.session) {
                console.log('[Auth] ✅ Session restaurée avec succès depuis le backup!');
                session = data.session;
                supabaseLogger.log('Session manually restored from backup', { userId: data.user?.id });
              } else {
                console.warn('[Auth] ❌ Échec de la restauration manuelle:', error);
                // Nettoyer si invalide
                localStorage.removeItem('dimicall_session_backup');
              }
            }
          }
        } catch (e) {
          console.error('[Auth] Erreur lors de la tentative de restauration:', e);
        }
      }

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

          // SAUVEGARDE DU BACKUP DE SESSION
          try {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
              const rememberMePref = localStorage.getItem('dimicall_remember_me_pref');
              // On sauvegarde si la préférence n'est pas explicitement 'false' (donc true ou null par défaut)
              if (rememberMePref !== 'false') {
                localStorage.setItem('dimicall_session_backup', JSON.stringify(nextSession));
              }
            }
          } catch (e) {
            console.error('[Auth] Erreur sauvegarde backup session:', e);
          }

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

    // 3. Vérification périodique supprimée pour réduire la charge DB
    // L'utilisateur sera déconnecté naturellement à l'expiration du token ou via onAuthStateChange


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
      // clearInterval(userVerificationInterval); // Supprimé
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Fonction pour enregistrer la session active et révoquer les autres
  const registerActiveSession = async (userId: string, sessionId: string) => {
    try {
      console.log('[Auth] Enregistrement de la session active...');

      // Enregistrer cette session dans la table active_sessions
      const { error: insertError } = await supabase
        .from('active_sessions')
        .upsert({
          user_id: userId,
          session_id: sessionId,
          device_info: navigator.userAgent,
          ip_address: 'client', // L'IP réelle sera capturée côté serveur si nécessaire
          last_activity: new Date().toISOString(),
        }, {
          onConflict: 'user_id,session_id'
        });

      if (insertError) {
        console.warn('[Auth] Erreur lors de l\'enregistrement de la session:', insertError);
        supabaseLogger.warn('registerActiveSession failed', insertError);
      } else {
        console.log('[Auth] ✅ Session enregistrée avec succès');
        supabaseLogger.log('Active session registered', { userId, sessionId: sessionId.substring(0, 10) + '...' });
      }

    } catch (error) {
      console.error('[Auth] Erreur lors de l\'enregistrement de la session:', error);
      supabaseLogger.error('registerActiveSession threw', error);
    }
  };

  // Fonction pour surveiller les sessions concurrentes en temps réel
  const monitorConcurrentSessions = (userId: string, currentSessionId: string) => {
    console.log('[Auth] Démarrage de la surveillance des sessions concurrentes...');

    // Écouter les changements dans la table active_sessions
    const channel = supabase
      .channel('session-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'active_sessions',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('[Auth] Nouvelle session détectée:', payload);

          // Si une nouvelle session est créée et ce n'est pas la nôtre
          if (payload.new && payload.new.session_id !== currentSessionId) {
            console.warn('[Auth] 🚨 Connexion depuis un autre appareil détectée!');
            supabaseLogger.warn('Concurrent session detected', {
              newSessionId: payload.new.session_id?.substring(0, 10) + '...',
              currentSessionId: currentSessionId.substring(0, 10) + '...'
            });

            // Déconnecter cette session
            await supabase.auth.signOut();

            // Afficher une notification à l'utilisateur
            if (typeof window !== 'undefined') {
              alert('Votre compte a été connecté depuis un autre appareil. Vous avez été déconnecté.');
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[Auth] Arrêt de la surveillance des sessions');
      channel.unsubscribe();
    };
  };

  // Connexion par email et mot de passe avec protection anti-partage
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

    // Si la connexion réussit, enregistrer la session et surveiller les concurrentes
    if (!error && data.session && data.user) {
      console.log('[auth-client] Connexion réussie, enregistrement de la session.');
      setSession(data.session);
      setUser(data.user);
      supabaseLogger.log('signInWithPassword success', { userId: data.user?.id });

      // Enregistrer cette session comme active (déclenche le trigger SQL qui supprime les autres)
      const sessionId = (data.session as any).access_token?.substring(0, 20) || crypto.randomUUID();
      await registerActiveSession(data.user.id, sessionId);

      // Démarrer la surveillance des sessions concurrentes
      const unsubscribe = monitorConcurrentSessions(data.user.id, sessionId);

      // Nettoyer la surveillance lors de la déconnexion
      return () => unsubscribe();
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
      // Nettoyage complet
      localStorage.removeItem('dimicall_session_backup');
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