/**
 * EXEMPLE D'INTÉGRATION DE ContactActionBar
 * 
 * Ce fichier montre comment intégrer la barre d'actions responsive
 * dans votre application. Copiez ce code dans votre composant principal
 * (probablement App.tsx) où vous affichez les détails du contact sélectionné.
 */

import React from 'react';
import { Contact, ContactStatus } from '../types';
import { ContactActionBar } from './ContactActionBar';

// Exemple d'utilisation dans un panneau latéral
export const ContactDetailsPanelExample: React.FC<{
  selectedContact: Contact | null;
  onUpdateContact: (updates: Partial<Contact> & { id: string }) => void;
  onCall: (contact: Contact) => void;
  onSms: (contact: Contact) => void;
  onEmail: (contact: Contact) => void;
  onQualify: (contact: Contact) => void;
  onReminder: (contact: Contact) => void;
  onAppointment: (contact: Contact) => void;
  onCalcom: (contact: Contact) => void;
  callDisabled?: boolean;
}> = ({
  selectedContact,
  onUpdateContact,
  onCall,
  onSms,
  onEmail,
  onQualify,
  onReminder,
  onAppointment,
  onCalcom,
  callDisabled = false
}) => {
  if (!selectedContact) {
    return null;
  }

  // Handler pour le changement de statut
  const handleStatusChange = (contactId: string, newStatus: ContactStatus) => {
    onUpdateContact({
      id: contactId,
      statut: newStatus
    });
  };

  return (
    <div className="w-80 border-l bg-background flex flex-col">
      {/* Barre d'actions en haut du panneau */}
      <div className="p-4 border-b">
        <ContactActionBar
          contact={selectedContact}
          onCall={onCall}
          onSms={onSms}
          onEmail={onEmail}
          onQualify={onQualify}
          onReminder={onReminder}
          onAppointment={onAppointment}
          onCalcom={onCalcom}
          onStatusChange={handleStatusChange}
          callDisabled={callDisabled}
          emailDisabled={!selectedContact.email}
        />
      </div>

      {/* Reste du contenu du panneau (informations détaillées, etc.) */}
      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-lg font-semibold mb-4">Détails du contact</h3>
        
        {/* Vos autres composants ici */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-sm">{selectedContact.email || 'Non renseigné'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Source</label>
            <p className="text-sm">{selectedContact.source || 'Non renseigné'}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Commentaire</label>
            <p className="text-sm">{selectedContact.commentaire || 'Aucun commentaire'}</p>
          </div>
          
          {/* Ajoutez d'autres champs selon vos besoins */}
        </div>
      </div>
    </div>
  );
};

/**
 * INSTRUCTIONS D'INTÉGRATION DANS APP.TSX:
 * 
 * 1. Importez le composant ContactActionBar:
 *    import { ContactActionBar } from './components/ContactActionBar';
 * 
 * 2. Trouvez l'endroit où vous affichez les détails du contact sélectionné
 *    (probablement un panneau latéral conditionnel)
 * 
 * 3. Ajoutez la ContactActionBar en haut de ce panneau:
 * 
 *    {selectedContact && (
 *      <div className="w-80 border-l bg-background flex flex-col">
 *        <div className="p-4 border-b">
 *          <ContactActionBar
 *            contact={selectedContact}
 *            onCall={handleCall}
 *            onSms={handleSms}
 *            onEmail={handleEmail}
 *            onQualify={handleQualify}
 *            onReminder={handleReminder}
 *            onAppointment={handleAppointment}
 *            onCalcom={handleCalcom}
 *            onStatusChange={(contactId, newStatus) => {
 *              updateContact({ id: contactId, statut: newStatus });
 *            }}
 *            callDisabled={!adbConnectionState.connected}
 *            emailDisabled={!selectedContact.email}
 *          />
 *        </div>
 *        
 *        {/* Reste du contenu du panneau *\/}
 *        <div className="flex-1 overflow-auto p-4">
 *          {/* Vos composants existants *\/}
 *        </div>
 *      </div>
 *    )}
 * 
 * 4. Assurez-vous que tous les handlers (handleCall, handleSms, etc.) 
 *    sont définis dans votre composant parent
 * 
 * 5. La barre s'adaptera automatiquement à la taille de l'écran et 
 *    activera le scroll horizontal si nécessaire
 */
