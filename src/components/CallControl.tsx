import React, { useEffect, useMemo, useState } from 'react';
import { Contact } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, PhoneOff, Mail, MessageSquare } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatPhoneNumber } from '../services/dataService';

interface CallControlProps {
  contact: Contact | null;
  isCalling: boolean;
  callStartTime: Date | null;
  onCall: () => void | Promise<void>;
  onHangUp: () => void | Promise<void>;
  onEmail?: () => void;
  onSmsMonsieur?: () => void;
  onSmsMadame?: () => void;
  adbConnected?: boolean;
}

const formatDuration = (ms: number): string => {
  if (ms <= 0 || Number.isNaN(ms)) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const CallControl: React.FC<CallControlProps> = ({
  contact,
  isCalling,
  callStartTime,
  onCall,
  onHangUp,
  onEmail,
  onSmsMonsieur,
  onSmsMadame,
  adbConnected = true,
}) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (!isCalling || !callStartTime) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isCalling, callStartTime]);

  const duration = useMemo(() => {
    if (!isCalling || !callStartTime) return '00:00';
    return formatDuration(Date.now() - callStartTime.getTime());
  }, [isCalling, callStartTime, now]);

  const initials = useMemo(() => {
    const first = contact?.prenom?.[0] || '';
    const last = contact?.nom?.[0] || '';
    return (first + last).toUpperCase() || '—';
  }, [contact]);

  const displayName = useMemo(() => {
    if (!contact) return 'Aucun contact sélectionné';
    const prenom = (contact.prenom || '').trim();
    const nom = (contact.nom || '').trim();
    const name = `${prenom} ${nom}`.trim();
    return name || 'Sans nom';
  }, [contact]);

  const phone = useMemo(() => {
    if (!contact?.telephone) return '—';
    try {
      return formatPhoneNumber(contact.telephone);
    } catch {
      return contact.telephone;
    }
  }, [contact]);

  const canCall = !!contact && !isCalling && adbConnected;
  const canHangUp = isCalling;

  return (
    <div className="flex items-center bg-card rounded-lg p-3 shadow-sm border min-w-[280px] w-full md:w-auto">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium truncate max-w-[160px] md:max-w-[200px]" title={displayName}>{displayName}</span>
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[180px] md:max-w-[220px]" title={phone}>{phone}</span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3 pl-2 md:pl-3 flex-shrink-0">
        {isCalling && (
          <span className="text-xs text-muted-foreground select-none" aria-live="polite">{duration}</span>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {isCalling ? (
                <Button
                  variant="destructive"
                  size="icon"
                  aria-label="Raccrocher l'appel"
                  title="Raccrocher l'appel"
                  onClick={() => onHangUp()}
                  disabled={!canHangUp}
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="icon"
                  aria-label="Appeler"
                  title={contact ? 'Appeler' : 'Sélectionnez un contact'}
                  onClick={() => onCall()}
                  disabled={!canCall}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isCalling
                  ? 'Raccrocher'
                  : contact
                  ? adbConnected
                    ? 'Appeler ce contact'
                    : "Connectez l'appareil ADB pour appeler"
                  : 'Aucun contact sélectionné'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Email */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Email"
                title="Email"
                onClick={() => onEmail && onEmail()}
                disabled={!contact}
              >
                <Mail className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ouvrir l'email</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* SMS Dropdown (identique au ruban) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="SMS"
              title="SMS"
              disabled={!contact}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 border shadow-lg bg-popover text-popover-foreground z-50" align="end">
            <DropdownMenuLabel className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Envoyer SMS
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onSmsMonsieur && onSmsMonsieur()} disabled={!contact} className="cursor-pointer">
                Monsieur {contact?.nom || ''}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSmsMadame && onSmsMadame()} disabled={!contact} className="cursor-pointer">
                Madame {contact?.nom || ''}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default CallControl;


