import React, { useCallback, useMemo } from 'react';
import { Contact, ContactStatus } from '../types';
import { cn } from '@/lib/utils';
import { ScrollableContainer } from './ScrollableContainer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import StatusSelect from './StatusSelect';
import {
  Phone,
  Mail,
  MessageSquare,
  FileCheck,
  Bell,
  Calendar,
  CalendarSearch
} from 'lucide-react';
import { formatPhoneNumber } from '../services/dataService';


interface ContactActionBarProps {
  contact: Contact;
  onCall: (contact: Contact) => void;
  onSms: (contact: Contact) => void;
  onEmail: (contact: Contact) => void;
  onQualify: (contact: Contact) => void;
  onReminder: (contact: Contact) => void;
  onAppointment: (contact: Contact) => void;
  onCalcom: (contact: Contact) => void;
  onStatusChange: (contactId: string, newStatus: ContactStatus) => void;
  callDisabled?: boolean;
  emailDisabled?: boolean;
  className?: string;
}

/**
 * Barre d'actions responsive pour un contact
 * Affiche les informations du contact et les boutons d'action
 * S'adapte automatiquement à la taille de l'écran avec scroll horizontal
 * 
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 */
export const ContactActionBar = React.memo<ContactActionBarProps>(({
  contact,
  onCall,
  onSms,
  onEmail,
  onQualify,
  onReminder,
  onAppointment,
  onCalcom,
  onStatusChange,
  callDisabled = false,
  emailDisabled = false,
  className = ''
}) => {
  // Mémoriser les initiales pour éviter les recalculs
  const initials = useMemo(() => {
    const prenomInitial = contact.prenom?.charAt(0)?.toUpperCase() || '';
    const nomInitial = contact.nom?.charAt(0)?.toUpperCase() || '';
    return `${prenomInitial}${nomInitial}` || '?';
  }, [contact.prenom, contact.nom]);

  // Mémoriser le nom complet
  const fullName = useMemo(() => {
    return `${contact.prenom || ''} ${contact.nom || ''}`.trim() || 'Contact sans nom';
  }, [contact.prenom, contact.nom]);

  // Mémoriser le téléphone formaté
  const formattedPhone = useMemo(() => {
    return contact.telephone ? formatPhoneNumber(contact.telephone) : null;
  }, [contact.telephone]);

  // Callbacks optimisés avec useCallback
  const handleCall = useCallback(() => onCall(contact), [onCall, contact]);
  const handleSms = useCallback(() => onSms(contact), [onSms, contact]);
  const handleEmail = useCallback(() => onEmail(contact), [onEmail, contact]);
  const handleQualify = useCallback(() => onQualify(contact), [onQualify, contact]);
  const handleReminder = useCallback(() => onReminder(contact), [onReminder, contact]);
  const handleAppointment = useCallback(() => onAppointment(contact), [onAppointment, contact]);
  const handleCalcom = useCallback(() => onCalcom(contact), [onCalcom, contact]);
  
  const handleStatusChange = useCallback((newStatus: ContactStatus) => {
    onStatusChange(contact.id, newStatus);
  }, [onStatusChange, contact.id]);

  // Gérer la navigation au clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const container = e.currentTarget.querySelector('.action-bar-scroll') as HTMLElement;
    if (!container) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      container.scrollBy({ left: -100, behavior: 'smooth' });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      container.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };

  // Gérer le focus pour scroller automatiquement vers l'élément
  const handleFocus = (e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.scrollIntoView) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  // Note: Les préférences de mouvement réduit sont gérées via CSS
  // @media (prefers-reduced-motion: reduce) dans contact-action-bar.css

  return (
    <TooltipProvider>
      <div 
        className={cn("action-bar-container", className)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        role="toolbar"
        aria-label="Actions du contact"
        aria-orientation="horizontal"
      >
        <ScrollableContainer className="action-bar-scroll">
          {/* Section informations du contact */}
          <div className="contact-info-section">
            {/* Avatar */}
            <Avatar className="contact-avatar">
              <AvatarFallback className="contact-avatar-fallback">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Informations textuelles */}
            <div className="contact-text-info">
              <span className="contact-name" title={fullName}>
                {fullName}
              </span>
              {formattedPhone && (
                <span className="contact-phone" title={contact.telephone}>
                  {formattedPhone}
                </span>
              )}
            </div>
          </div>

          {/* Séparateur */}
          <div className="action-bar-separator">|</div>

          {/* Section sélecteur de statut */}
          <div className="status-selector-section">
            <span className="status-label">Statut:</span>
            <StatusSelect
              value={contact.statut || ContactStatus.NonDefini}
              onChange={handleStatusChange}
              triggerClassName="status-selector border-none bg-transparent p-0 h-auto"
              contentClassName="bg-popover border shadow-lg"
              size="sm"
            />
          </div>

          {/* Séparateur */}
          <div className="action-bar-separator">|</div>

          {/* Section boutons d'action */}
          <div className="action-buttons-section">
            {/* Bouton Appel (priorité haute) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="action-button action-button-call"
                  onClick={handleCall}
                  disabled={callDisabled}
                  aria-label="Appeler"
                >
                  <Phone className="action-button-icon" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Appeler</p>
              </TooltipContent>
            </Tooltip>

            {/* Bouton SMS (priorité haute) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="action-button action-button-secondary"
                  onClick={handleSms}
                  aria-label="SMS"
                >
                  <MessageSquare className="action-button-icon" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>SMS</p>
              </TooltipContent>
            </Tooltip>

            {/* Bouton Email (priorité moyenne) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="action-button action-button-secondary"
                  onClick={handleEmail}
                  disabled={emailDisabled}
                  aria-label="Email"
                >
                  <Mail className="action-button-icon" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Email</p>
              </TooltipContent>
            </Tooltip>

            {/* Bouton Qualification (priorité moyenne) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="action-button action-button-secondary"
                  onClick={handleQualify}
                  aria-label="Qualification"
                >
                  <FileCheck className="action-button-icon" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Qualifier le contact</p>
              </TooltipContent>
            </Tooltip>

            {/* Bouton Rappel (priorité basse) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="action-button action-button-secondary"
                  onClick={handleReminder}
                  aria-label="Rappel"
                >
                  <Bell className="action-button-icon" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Programmer un rappel</p>
              </TooltipContent>
            </Tooltip>

            {/* Bouton Rendez-vous (priorité basse) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="action-button action-button-secondary"
                  onClick={handleAppointment}
                  aria-label="Rendez-vous"
                >
                  <Calendar className="action-button-icon" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Programmer un rendez-vous</p>
              </TooltipContent>
            </Tooltip>

            {/* Bouton Cal.com (priorité basse) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="action-button action-button-secondary"
                  onClick={handleCalcom}
                  aria-label="Cal.com"
                >
                  <CalendarSearch className="action-button-icon" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ouvrir Cal.com</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </ScrollableContainer>
      </div>
    </TooltipProvider>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour optimiser les re-renders
  // Ne re-render que si les props importantes changent
  return (
    prevProps.contact.id === nextProps.contact.id &&
    prevProps.contact.prenom === nextProps.contact.prenom &&
    prevProps.contact.nom === nextProps.contact.nom &&
    prevProps.contact.telephone === nextProps.contact.telephone &&
    prevProps.contact.statut === nextProps.contact.statut &&
    prevProps.callDisabled === nextProps.callDisabled &&
    prevProps.emailDisabled === nextProps.emailDisabled
  );
});

ContactActionBar.displayName = 'ContactActionBar';
