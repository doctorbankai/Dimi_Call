import React, { useState, useEffect } from 'react';
import { Contact, Theme, EmailType, SmsType, Civility, QualificationStatutMarital, QualificationSituationPro } from '../types';
import { Button, Input, Select, Modal } from './Common';
import { generateGmailComposeUrl, generateSmsMessage } from '../services/dataService';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogPortal
} from '@/components/ui/dialog';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Input as ShadcnInput } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ReminderDialog } from './ReminderDialog';
import { QualificationDialog } from './QualificationDialog';
import { TimePicker } from '@/components/ui/time-picker';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  showNotification: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
  onUpdateContact?: (updatedFields: Partial<Contact> & { id: string }) => void;
}

const EmailDialog: React.FC<EmailDialogProps> = ({ isOpen, onClose, contact, showNotification, onUpdateContact }) => {
  const [emailType, setEmailType] = useState<EmailType>(EmailType.PremierContact);
  const [civility, setCivility] = useState<Civility>(Civility.Monsieur);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Initialiser les champs avec les données existantes du contact
  useEffect(() => {
    if (contact) {
      // Pré-remplir la date si elle existe dans le contact
      if (contact.dateRDV) {
        try {
          const dateRDV = new Date(contact.dateRDV);
          // Vérifier que la date est valide
          if (!isNaN(dateRDV.getTime())) {
            setSelectedDate(dateRDV);
          }
        } catch (error) {
          console.warn('Format de date invalide dans dateRDV:', contact.dateRDV);
        }
      }

      // Pré-remplir l'heure si elle existe dans le contact
      if (contact.heureRDV) {
        setSelectedTime(contact.heureRDV);
      }
    }
  }, [contact]);

  // Fonction pour mettre Ã€Â  jour la date du contact
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (contact && onUpdateContact && date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      onUpdateContact({ id: contact.id, dateRDV: formattedDate });
    }
  };

  // Fonction pour mettre Ã€Â  jour l'heure du contact
  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (contact && onUpdateContact) {
      onUpdateContact({ id: contact.id, heureRDV: time });
    }
  };

  if (!contact) return null;

  const needsDateTime = emailType === EmailType.D0Visio || emailType === EmailType.R0Interne || emailType === EmailType.R0Externe;

  const handleGenerateEmail = () => {
    if (!contact.email || !contact.email.includes('@')) {
      showNotification('error', 'Adresse email invalide ou manquante');
      return;
    }

    // Créer un contact modifié avec la date et l'heure sélectionnées si nécessaire
    const contactWithDateTime = { ...contact };
    if (needsDateTime && selectedDate && selectedTime) {
      contactWithDateTime.dateRDV = format(selectedDate, 'yyyy-MM-dd');
      contactWithDateTime.heureRDV = selectedTime;
    }

    const emailUrl = generateGmailComposeUrl(contactWithDateTime, emailType, civility);

    try {
      window.open(emailUrl, '_blank');
      showNotification('success', 'Email Gmail ouvert dans un nouvel onglet');
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de Gmail:', error);
      showNotification('error', 'Impossible d\'ouvrir Gmail. Vérifiez que votre navigateur autorise les pop-ups.');
    }
  };

  const emailTypeOptions = [
    { value: EmailType.PremierContact, label: 'Premier Contact' },
    { value: EmailType.D0Visio, label: 'D0 Visio' },
    { value: EmailType.R0Interne, label: 'R0 Interne' },
    { value: EmailType.R0Externe, label: 'R0 Externe' }
  ];

  const civilityOptions = [
    { value: Civility.Monsieur, label: 'Monsieur' },
    { value: Civility.Madame, label: 'Madame' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Générer un Email" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Contact</label>
            <div className="p-2 bg-muted text-muted-foreground rounded border text-sm">
              <div><strong>Nom:</strong> {contact.prenom} {contact.nom}</div>
              <div><strong>Email:</strong> {contact.email}</div>
            </div>
          </div>
          <div className="space-y-3">
            <ShadcnSelect value={civility} onValueChange={(value) => setCivility(value as Civility)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Civilité" />
              </SelectTrigger>
              <SelectContent className="z-[100002]">
                {civilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>

            <ShadcnSelect value={emailType} onValueChange={(value) => setEmailType(value as EmailType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Type d'email" />
              </SelectTrigger>
              <SelectContent className="z-[100002]">
                {emailTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>
          </div>
        </div>

        {needsDateTime && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium text-foreground">Planification du rendez-vous</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="date-picker" className="text-sm">
                  Date du rendez-vous
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <ShadcnButton
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP', { locale: fr }) : <span>Sélectionner une date</span>}
                    </ShadcnButton>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100002]">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="time-picker" className="text-sm">
                  Heure du rendez-vous
                </Label>
                <TimePicker
                  id="time-picker"
                  value={selectedTime}
                  onChange={handleTimeChange}
                  placeholder="HH:mm"
                  zIndex={100002}
                />
              </div>
            </div>
          </div>
        )}

        <div className="bg-muted text-muted-foreground p-3 rounded text-sm">
          <strong>Aperçu:</strong> Email {emailTypeOptions.find(opt => opt.value === emailType)?.label} pour {civilityOptions.find(opt => opt.value === civility)?.label} {contact.prenom} {contact.nom}
          {needsDateTime && selectedDate && selectedTime && (
            <div className="mt-1">
              <strong>Rendez-vous:</strong> {format(selectedDate, 'PPPP', { locale: fr })} Ã€Â  {selectedTime}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            variant="primary"
            onClick={handleGenerateEmail}
            disabled={needsDateTime && (!selectedDate || !selectedTime)}
          >
            Générer Email Gmail
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface SmsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  onSendSms: (civility: Civility, smsType: SmsType, dateISO?: string, time?: string) => void;
  onUpdateContact?: (updatedFields: Partial<Contact> & { id: string }) => void;
}

const SmsDialog: React.FC<SmsDialogProps> = ({ isOpen, onClose, contact, onSendSms, onUpdateContact }) => {
  const [civility, setCivility] = useState<Civility>(Civility.Monsieur);
  const [smsType, setSmsType] = useState<SmsType>(SmsType.PremierContact);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [previewMessage, setPreviewMessage] = useState<string>('');

  useEffect(() => {
    if (contact) {
      if (contact.dateRDV) {
        try {
          const dateRDV = new Date(contact.dateRDV);
          if (!isNaN(dateRDV.getTime())) {
            setSelectedDate(dateRDV);
          }
        } catch { }
      }
      if (contact.heureRDV) {
        setSelectedTime(contact.heureRDV);
      }
    }
  }, [contact]);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (contact && onUpdateContact && date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      onUpdateContact({ id: contact.id, dateRDV: formattedDate });
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (contact && onUpdateContact) {
      onUpdateContact({ id: contact.id, heureRDV: time });
    }
  };

  if (!contact) return null;

  const needsDateTime = smsType === SmsType.D0Visio || smsType === SmsType.R0Interne || smsType === SmsType.R0Externe;

  // Mettre Ã  jour la prévisualisation du message Ã  chaque changement
  useEffect(() => {
    if (!contact) return;
    try {
      const merged: Contact = {
        ...contact,
        dateRDV: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : contact.dateRDV,
        heureRDV: selectedTime || contact.heureRDV,
      };
      const msg = generateSmsMessage(merged, smsType, civility);
      setPreviewMessage(msg);
    } catch {
      const titre = civility === Civility.Madame ? 'Madame' : 'Monsieur';
      setPreviewMessage('Bonjour ' + titre + ' ' + (contact?.nom || '') + ', ...');
    }
  }, [contact, civility, smsType, selectedDate, selectedTime]);

  const handleSendSms = () => {
    const dateISO = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
    onSendSms(civility, smsType, dateISO, selectedTime || undefined);
  };

  const civilityOptions = [
    { value: Civility.Monsieur, label: 'Monsieur' },
    { value: Civility.Madame, label: 'Madame' }
  ];

  const smsTypeOptions = [
    { value: SmsType.PremierContact, label: 'Premier Contact' },
    { value: SmsType.D0Visio, label: 'D0 Visio' },
    { value: SmsType.R0Interne, label: 'R0 Interne' },
    { value: SmsType.R0Externe, label: 'R0 Externe' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Envoyer un SMS" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Contact</label>
            <div className="p-2 bg-muted text-muted-foreground rounded border text-sm">
              <div><strong>Nom:</strong> {contact.prenom} {contact.nom}</div>
              <div><strong>Téléphone:</strong> {contact.telephone}</div>
            </div>
          </div>
          <div className="space-y-3">
            <ShadcnSelect value={civility} onValueChange={(value) => setCivility(value as Civility)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Civilité" />
              </SelectTrigger>
              <SelectContent className="z-[100002]">
                {civilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>

            <ShadcnSelect value={smsType} onValueChange={(value) => setSmsType(value as SmsType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Type de SMS" />
              </SelectTrigger>
              <SelectContent className="z-[100002]">
                {smsTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div></div>
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Prévisualisation du message</label>
            <div className="h-full p-3 bg-muted/40 text-foreground rounded border text-sm whitespace-pre-wrap">
              {previewMessage}
            </div>
          </div>
        </div>
        {needsDateTime && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium text-foreground">Planification du rendez-vous</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="sms-date-picker" className="text-sm">
                  Date du rendez-vous
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <ShadcnButton
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP', { locale: fr }) : <span>Sélectionner une date</span>}
                    </ShadcnButton>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100002]">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="sms-time-picker" className="text-sm">
                  Heure du rendez-vous
                </Label>
                <TimePicker
                  id="sms-time-picker"
                  value={selectedTime}
                  onChange={handleTimeChange}
                  placeholder="HH:mm"
                  zIndex={100002}
                />
              </div>
            </div>
          </div>
        )}

        <div className="bg-muted text-muted-foreground p-3 rounded text-sm">
          <strong>Aperçu:</strong> SMS {smsTypeOptions.find(opt => opt.value === smsType)?.label} pour {civilityOptions.find(opt => opt.value === civility)?.label} {contact.prenom} {contact.nom}
          {needsDateTime && selectedDate && selectedTime && (
            <div className="mt-1">
              <strong>Rendez-vous:</strong> {format(selectedDate, 'PPPP', { locale: fr })} Ã€Â  {selectedTime}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            variant="primary"
            onClick={handleSendSms}
            disabled={needsDateTime && (!selectedDate || !selectedTime)}
          >
            Envoyer SMS
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface RappelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  onSave: (date: string, time: string) => void;
}

const RappelDialog: React.FC<RappelDialogProps> = ({ isOpen, onClose, contact, onSave }) => {
  // Utiliser notre nouveau ReminderDialog avec les sélecteurs relatifs
  return (
    <ReminderDialog
      isOpen={isOpen}
      onClose={onClose}
      contact={contact}
      initialDate={contact?.dateRappel || ''}
      initialTime={contact?.heureRappel || ''}
      onSave={onSave}
    />
  );
};

interface RendezVousDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  onSave: (date: string, time: string) => void;
}

const RendezVousDialog: React.FC<RendezVousDialogProps> = ({ isOpen, onClose, contact, onSave }) => {
  const [date, setDate] = useState<Date | undefined>(() => {
    if (!contact?.dateRDV) return undefined;
    const parsed = new Date(contact.dateRDV);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  });
  const [time, setTime] = useState(contact?.heureRDV || '');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const modalContentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contact) return;
    if (contact.dateRDV) {
      const parsed = new Date(contact.dateRDV);
      setDate(isNaN(parsed.getTime()) ? undefined : parsed);
    } else {
      setDate(undefined);
    }
    setTime(contact.heureRDV || '');
  }, [contact]);

  const handleSave = () => {
    onSave(date ? format(date, 'yyyy-MM-dd') : '', time);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Programmer un Rendez-vous" size="sm">
      <div className="space-y-4" ref={modalContentRef}>
        <p className="text-sm text-muted-foreground">
          Contact: <strong>{contact?.prenom} {contact?.nom}</strong>
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    "bg-white text-foreground border-slate-300 dark:bg-slate-900/60 dark:border-slate-600",
                    "focus-visible:ring-2 focus-visible:ring-primary/20 shadow-none",
                    !date && "text-muted-foreground"
                  )}
                  aria-label="Choisir une date de rendez-vous"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'dd MMM yyyy', { locale: fr }) : "Choisir une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 z-[100003]"
                align="start"
                side="bottom"
                sideOffset={6}
                collisionPadding={10}
                collisionBoundary={modalContentRef.current || undefined}
                container={modalContentRef.current || undefined}
              >
                <Calendar
                  mode="single"
                  locale={fr}
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate || undefined);
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <TimePicker
            value={time}
            onChange={setTime}
            placeholder="HH:mm"
            container={modalContentRef.current}
            zIndex={100002}
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSave}>Sauvegarder</Button>
        </div>
      </div>
    </Modal>
  );
};



interface GenericInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  theme: Theme;
}

const GenericInfoDialogComponent: React.FC<GenericInfoDialogProps> = ({ isOpen, onClose, title, content, theme }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        {content}
        <div className="flex justify-end pt-4">
          <Button variant="primary" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </Modal>
  );
};

export { EmailDialog, SmsDialog, RappelDialog, RendezVousDialog, QualificationDialog, GenericInfoDialogComponent as GenericInfoDialog };


