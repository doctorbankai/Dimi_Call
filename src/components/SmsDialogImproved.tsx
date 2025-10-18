import React, { useState, useEffect } from 'react';
import { Contact, SmsType, Civility } from '../types';
import { Button, Modal } from './Common';
import { generateSmsMessage } from '../services/dataService';
import { Label } from '@/components/ui/label';
import { 
  Select as ShadcnSelect, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button as ShadcnButton } from '@/components/ui/button';
import { TimePicker } from '@/components/ui/time-picker';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SmsDialogImprovedProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  onSendSms: (civility: Civility, smsType: SmsType, dateISO?: string, time?: string) => void;
  onUpdateContact?: (updatedFields: Partial<Contact> & { id: string }) => void;
}

export const SmsDialogImproved: React.FC<SmsDialogImprovedProps> = ({ 
  isOpen, 
  onClose, 
  contact, 
  onSendSms, 
  onUpdateContact 
}) => {
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
        } catch {}
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

  // Mettre à jour la prévisualisation du message à chaque changement
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
      <div className="space-y-6">
        {/* Section Contact et Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Informations du contact */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-semibold mb-2 text-foreground">Destinataire</label>
            <div className="p-4 bg-gradient-to-br from-muted/50 to-muted rounded-lg border border-border/50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Nom</span>
              </div>
              <p className="text-sm font-medium text-foreground">{contact.prenom} {contact.nom}</p>
              <div className="pt-2 border-t border-border/30">
                <span className="text-xs font-medium text-muted-foreground">Téléphone</span>
                <p className="text-sm font-mono text-foreground mt-1">{contact.telephone}</p>
              </div>
            </div>
          </div>

          {/* Configuration du SMS */}
          <div className="lg:col-span-2 space-y-4">
            <label className="block text-sm font-semibold mb-2 text-foreground">Configuration du message</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Civilité</Label>
                <ShadcnSelect value={civility} onValueChange={(value) => setCivility(value as Civility)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Civilité" />
                  </SelectTrigger>
                  <SelectContent className="z-[20001]">
                    {civilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </ShadcnSelect>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Type de SMS</Label>
                <ShadcnSelect value={smsType} onValueChange={(value) => setSmsType(value as SmsType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Type de SMS" />
                  </SelectTrigger>
                  <SelectContent className="z-[20001]">
                    {smsTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </ShadcnSelect>
              </div>
            </div>

            {/* Planification du rendez-vous */}
            {needsDateTime && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">Planification</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="sms-date-picker" className="text-xs text-muted-foreground">
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
                          {selectedDate ? format(selectedDate, 'PPP', { locale: fr }) : <span>Sélectionner</span>}
                        </ShadcnButton>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[20001]">
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
                  <div className="space-y-2">
                    <Label htmlFor="sms-time-picker" className="text-xs text-muted-foreground">
                      Heure du rendez-vous
                    </Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <TimePicker
                        id="sms-time-picker"
                        value={selectedTime}
                        onChange={handleTimeChange}
                        placeholder="HH:mm"
                        zIndex={20001}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prévisualisation du message */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm font-semibold text-foreground">Prévisualisation</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="relative">
            <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 text-foreground rounded-lg border-2 border-primary/20 shadow-sm min-h-[150px] flex items-start">
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {previewMessage}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button 
            variant="primary" 
            onClick={handleSendSms}
            disabled={needsDateTime && (!selectedDate || !selectedTime)}
            className="min-w-[140px]"
          >
            Envoyer SMS
          </Button>
        </div>
      </div>
    </Modal>
  );
};
