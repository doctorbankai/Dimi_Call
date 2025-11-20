import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { UserPlus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { createConfiguredUser } from '@/lib/user-setup';

export const UserManagementDialog: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [licenseMonths, setLicenseMonths] = useState('12');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const result = await createConfiguredUser(email, password, {
        licenseMonths: parseInt(licenseMonths) || 12,
        autoConfirmEmail: true
      });

      setResult(result);

      if (result.success) {
        // Réinitialiser le formulaire après succès
        setTimeout(() => {
          setEmail('');
          setPassword('');
          setLicenseMonths('12');
          setResult(null);
          setIsOpen(false);
        }, 2000);
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `Erreur: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Créer un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            L'utilisateur sera automatiquement configuré et prêt à se connecter.
            Plus besoin de requêtes SQL manuelles !
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateUser}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Adresse email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="utilisateur@exemple.com"
                required
                disabled={isLoading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                minLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 6 caractères
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="license">Durée de la licence (mois)</FieldLabel>
              <Input
                id="license"
                type="number"
                value={licenseMonths}
                onChange={(e) => setLicenseMonths(e.target.value)}
                min="1"
                max="120"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Par défaut : 12 mois (1 an)
              </p>
            </Field>

            {result && (
              <div className={`p-3 rounded-lg border ${
                result.success 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                  : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    result.success 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {result.message}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Créer
                  </>
                )}
              </Button>
            </div>
          </FieldGroup>
        </form>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>✨ Automatique :</strong> L'utilisateur sera créé avec :
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1 ml-4 list-disc">
            <li>Email confirmé automatiquement</li>
            <li>Rôle "authenticated" configuré</li>
            <li>Licence valide pour la durée spécifiée</li>
            <li>Prêt à se connecter immédiatement</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};
