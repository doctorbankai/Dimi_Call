import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { useSupabaseAuth } from '../lib/auth-client';
import { Eye, EyeOff, Lock, Mail, Loader2, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { signInWithPassword } = useSupabaseAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginPage] Début de la soumission du formulaire.');
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Veuillez saisir votre email et votre mot de passe.');
      console.log('[LoginPage] Validation échouée: email ou mot de passe vide.');
      return;
    }

    setIsLoading(true);
    console.log(`[LoginPage] Tentative de connexion pour : ${email}`);

    const finalEmail = email.trim();
    const finalPassword = password.trim();

    try {
      // Sauvegarder la préférence "Se souvenir de moi"
      localStorage.setItem('dimicall_remember_me_pref', String(rememberMe));

      const result = await signInWithPassword(finalEmail, finalPassword);

      // signInWithPassword peut retourner soit une fonction de nettoyage, soit { data, error }
      if (result && typeof result === 'object' && 'error' in result) {
        const { error: signInError } = result;

        if (signInError) {
          console.error('[LoginPage] Erreur de connexion Supabase:', signInError);

          let errorMessage = 'Une erreur est survenue.';
          if (signInError && 'code' in signInError && (signInError as any).code) {
            errorMessage = `Erreur: ${signInError.message} (Code: ${(signInError as any).code})`;
          } else if (signInError.message === 'Invalid login credentials') {
            errorMessage = 'Email ou mot de passe incorrect. Avez-vous bien confirmé votre adresse email ?';
          } else {
            errorMessage = signInError.message || 'Erreur de connexion inconnue.';
          }
          setError(errorMessage);
        } else {
          console.log('[LoginPage] Connexion réussie.');
        }
      } else {
        // Si c'est une fonction de nettoyage, la connexion a réussi
        console.log('[LoginPage] Connexion réussie (fonction de nettoyage retournée).');
      }
    } catch (err) {
      console.error('[LoginPage] Erreur inattendue:', err);
      setError('Une erreur inattendue s\'est produite.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e as any);
    }
  };

  const handleCloseApp = async () => {
    if (window.electronAPI) {
      await window.electronAPI.closeApp();
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 relative">
      {/* Bouton de fermeture de l'application */}
      <button
        onClick={handleCloseApp}
        className="absolute top-4 right-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-muted-foreground hover:text-foreground hover:bg-destructive/20"
        title="Fermer l'application"
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Fermer l'application</span>
      </button>

      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Logo DimiCall */}
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-2xl shadow-lg">
            <Lock className="size-6" />
          </div>
          <span className="text-xl font-bold">DimiCall</span>
        </a>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Bienvenue</CardTitle>
            <CardDescription>
              Connectez-vous à votre espace DimiCall
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                {/* Email Field */}
                <Field>
                  <FieldLabel htmlFor="email">Adresse email</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="pl-10 h-11"
                      placeholder="nom@exemple.com"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </Field>

                {/* Password Field */}
                <Field>
                  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="pl-10 pr-10 h-11"
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </Field>

                {/* Remember Me Checkbox */}
                <div className="flex items-center space-x-2 my-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Se souvenir de moi
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive font-medium">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Field>
                  <Button
                    type="submit"
                    disabled={isLoading || !email.trim() || !password.trim()}
                    className="w-full h-11 font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connexion en cours...
                      </>
                    ) : (
                      'Se connecter'
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground px-6">
          Session sécurisée • Un seul appareil autorisé • Authentification obligatoire
        </p>
      </div>
    </div>
  );
};
