import React, { useState } from 'react';
import { ReminderDialog } from './ReminderDialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { Contact, ContactStatus } from '../types';

// Composant de test pour vérifier que le ReminderDialog fonctionne
export const TestReminderButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const testContact: Contact = {
    id: 'test-1',
    numeroLigne: 1,
    prenom: 'Gérard',
    nom: 'Test',
    telephone: '0123456789',
    email: 'gerard@test.com',
    source: 'Test',
    statut: ContactStatus.ARappeler,
    commentaire: 'Contact de test',
    dateRappel: '',
    heureRappel: '',
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: ''
  };

  const handleSave = (date: string, time: string) => {
    console.log('Rappel sauvegardé:', { date, time });
    alert(`Rappel sauvegardé: ${date} à ${time}`);
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4">Test du Dialog de Rappel</h3>
      
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Bell className="h-4 w-4" />
        Ouvrir le Dialog de Rappel
      </Button>

      <ReminderDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        contact={testContact}
        onSave={handleSave}
      />

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Ce bouton devrait ouvrir le dialog avec:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Champs de date et heure manuels</li>
          <li>Section "Sélection rapide" avec quantité et unité</li>
          <li>Prévisualisation des dates calculées</li>
          <li>Boutons Annuler et Sauvegarder</li>
        </ul>
      </div>
    </div>
  );
};