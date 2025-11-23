import React, { useEffect, useMemo, useState } from 'react';
import { Contact, ContactStatus } from '../types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, PhoneOff, Mail, MessageSquare, Bell, Calendar, CalendarSearch, FileCheck, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatPhoneNumber } from '../services/dataService';
import StatusSelect from './StatusSelect';
import { cn } from '@/lib/utils';

interface CallControlProps {
  contact: Contact | null;
  isCalling: boolean;
  callStartTime: Date | null;
  onCall: () => void | Promise<void>;
  onHangUp: () => void | Promise<void>;
  onEmail?: () => void;
  onSms?: () => void;
  onStatusChange?: (status: ContactStatus) => void;
  onRappel?: () => void;
  onRendezVous?: () => void;
  onCalCom?: () => void;
  onQualification?: () => void;
  adbConnected?: boolean;
  className?: string;
  variant?: 'detailed' | 'compact';
  displayMode?: 'full' | 'actions-only';
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
  onSms,
  onStatusChange,
  onRappel,
  onRendezVous,
  onCalCom,
  onQualification,
  adbConnected = true,
  className,
  variant = 'detailed',
  displayMode = 'full',
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
    if (!contact) return '—';
    const prenom = String(contact.prenom || '').trim();
    const nom = String(contact.nom || '').trim();
    // Nettoyer les guillemets vides
    const cleanPrenom = prenom === '""' || prenom === "''" ? '' : prenom;
    const cleanNom = nom === '""' || nom === "''" ? '' : nom;
    const first = cleanPrenom[0] || '';
    const last = cleanNom[0] || '';
    const result = (first + last).toUpperCase().trim();
    return result || '—';
  }, [contact]);

  const displayName = useMemo(() => {
    if (!contact) return 'Aucun contact sélectionné';
    const prenom = (contact.prenom || '').trim();
    const nom = (contact.nom || '').trim();
    const name = `${prenom} ${nom}`.trim();
    return name || 'Sans nom';
  }, [contact]);

  const phone = useMemo(() => {
    if (!contact?.telephone) return '';
    let tel = String(contact.telephone).trim();
    // Nettoyer tous les types de guillemets vides ou valeurs invalides
    if (!tel || tel === '""' || tel === "''" || tel === '\"\"' || tel === '\'\'' || tel === '—' || tel === '-') return '';
    // Supprimer les guillemets au début et à la fin si présents
    tel = tel.replace(/^["']+|["']+$/g, '');
    if (!tel) return '';
    try {
      return formatPhoneNumber(tel);
    } catch {
      return tel;
    }
  }, [contact]);

  const email = useMemo(() => {
    if (!contact?.email) return '';
    return contact.email;
  }, [contact]);

  const canCall = !!contact && !isCalling && adbConnected;
  const canHangUp = isCalling;
  const isDetailed = displayMode === 'full' && variant === 'detailed';

  const renderPrimaryButtons = () => (
    <>
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
                className={cn(
                  "size-10 rounded-full transition-all duration-200 hover:scale-105 shrink-0",
                  "bg-red-500 hover:bg-red-600 text-white shadow-lg",
                  "focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="icon"
                aria-label="Appeler"
                title={contact ? "Appeler" : "Sélectionnez un contact"}
                onClick={() => onCall()}
                disabled={!canCall}
                className={cn(
                  "size-10 rounded-full transition-all duration-200 hover:scale-105 shrink-0",
                  "bg-green-500 hover:bg-green-600 text-white shadow-lg",
                  "focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isCalling
                ? "Raccrocher"
                : contact
                ? adbConnected
                  ? "Appeler ce contact"
                  : "Connectez l'appareil ADB pour appeler"
                : "Aucun contact sélectionné"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="SMS"
              title="SMS"
              onClick={() => onSms && onSms()}
              disabled={!contact}
              className={cn(
                "size-10 rounded-full transition-all duration-200 hover:scale-105 shrink-0",
                "border-2 hover:bg-accent hover:text-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Envoyer un SMS</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Email"
              title="Email"
              onClick={() => onEmail && onEmail()}
              disabled={!contact || !contact.email}
              className={cn(
                "size-10 rounded-full transition-all duration-200 hover:scale-105 shrink-0",
                "border-2 hover:bg-accent hover:text-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              <Mail className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ouvrir l'email</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );

  const renderOverflowMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "size-10 rounded-full transition-all duration-200 hover:scale-105 shrink-0",
            "border-2 hover:bg-accent hover:text-accent-foreground",
            "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
          )}
          aria-label="Plus d'actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Actions supplémentaires</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onQualification && (
          <DropdownMenuItem
            onClick={() => onQualification()}
            disabled={!contact}
            className="flex items-center gap-2"
          >
            <FileCheck className="h-4 w-4" />
            <span>Qualifier le contact</span>
          </DropdownMenuItem>
        )}
        {onRappel && (
          <DropdownMenuItem
            onClick={() => onRappel()}
            disabled={!contact}
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            <span>Programmer un rappel</span>
          </DropdownMenuItem>
        )}
        {onRendezVous && (
          <DropdownMenuItem
            onClick={() => onRendezVous()}
            disabled={!contact}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Programmer un rendez-vous</span>
          </DropdownMenuItem>
        )}
        {onCalCom && (
          <DropdownMenuItem
            onClick={() => onCalCom()}
            disabled={!contact}
            className="flex items-center gap-2"
          >
            <CalendarSearch className="h-4 w-4" />
            <span>Ouvrir Cal.com</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (displayMode === 'actions-only') {
    return (
      <div className={cn('flex items-center justify-end gap-2 flex-nowrap', className)}>
        {isCalling && (
          <span className="text-xs text-muted-foreground select-none whitespace-nowrap shrink-0" aria-live="polite">
            {duration}
          </span>
        )}
        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          {renderPrimaryButtons()}
          {/* Menu overflow visible uniquement sur petits écrans */}
          <div className="lg:hidden">
            {renderOverflowMenu()}
          </div>
          {/* Boutons secondaires visibles uniquement sur grands écrans */}
          <div className="hidden lg:flex items-center gap-2">
            {onQualification && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Qualification"
                      title="Qualifier le contact"
                      onClick={() => onQualification()}
                      disabled={!contact}
                      className={cn(
                        "size-10 rounded-full transition-all duration-200 hover:scale-105 shrink-0",
                        "border-2 hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                      )}
                    >
                      <FileCheck className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Qualifier le contact</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {onRappel && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Rappel"
                      title="Programmer un rappel"
                      onClick={() => onRappel()}
                      disabled={!contact}
                      className={cn(
                        "size-10 rounded-full transition-all duration-200 hover:scale-105 shrink-0",
                        "border-2 hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                      )}
                    >
                      <Bell className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Programmer un rappel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {onRendezVous && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Rendez-vous"
                      title="Programmer un rendez-vous"
                      onClick={() => onRendezVous()}
                      disabled={!contact}
                      className={cn(
                        "size-10 rounded-full transition-all duration-200 hover:scale-105 shrink-0",
                        "border-2 hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                      )}
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Programmer un rendez-vous</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {onCalCom && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Cal.com"
                      title="Ouvrir Cal.com"
                      onClick={() => onCalCom()}
                      disabled={!contact}
                      className={cn(
                        "size-10 rounded-full transition-all duration-200 hover:scale-105 shrink-0",
                        "border-2 hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                      )}
                    >
                      <CalendarSearch className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ouvrir Cal.com</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full overflow-x-auto', isDetailed && 'flex justify-center', className)}>
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm min-w-[280px]',
          isDetailed && 'w-fit flex-nowrap',
          !isDetailed && 'min-w-0 w-full border-none bg-transparent p-0 shadow-none gap-2 flex-nowrap'
        )}
      >
        {isDetailed && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium whitespace-nowrap" title={displayName}>
                {displayName}
              </span>
              {phone && (
                <span className="text-xs text-muted-foreground whitespace-nowrap" title={phone}>
                  {phone}
                </span>
              )}
            </div>
          </div>
        )}

        <div
          className={cn(
            'flex flex-wrap items-center gap-2',
            isDetailed ? 'ml-auto justify-end' : 'w-full justify-end'
          )}
        >
          {isDetailed && (
            <>
              <div className="hidden text-muted-foreground/50 text-sm sm:block">|</div>
              {email && (
                <>
                  <span className="text-xs text-muted-foreground whitespace-nowrap" title={email}>
                    {email}
                  </span>
                  <div className="hidden text-muted-foreground/50 text-sm sm:block">|</div>
                </>
              )}
              {contact && (
                <>
                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Statut:</span>
                    <StatusSelect
                      value={contact.statut}
                      onChange={(newStatus) => onStatusChange?.(newStatus)}
                      triggerClassName="w-[140px]"
                      contentClassName="text-xs"
                      size="sm"
                    />
                  </div>
                  <div className="hidden text-muted-foreground/50 text-sm sm:block">|</div>
                </>
              )}
            </>
          )}

          {isCalling && (
            <span className="text-xs text-muted-foreground select-none whitespace-nowrap shrink-0" aria-live="polite">
              {duration}
            </span>
          )}

        <div className="flex items-center gap-2 flex-nowrap">
          {renderPrimaryButtons()}
          {/* Menu overflow visible uniquement sur petits écrans */}
          <div className="lg:hidden">
            {renderOverflowMenu()}
          </div>
          {/* Boutons secondaires visibles uniquement sur grands écrans */}
          <div className="hidden lg:flex items-center gap-2">
              {onQualification && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Qualification"
                        title="Qualifier le contact"
                        onClick={() => onQualification()}
                        disabled={!contact}
                        className={cn(
                          "size-10 rounded-full transition-all duration-200 hover:scale-105 shrink-0",
                          "border-2 hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                        )}
                      >
                        <FileCheck className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Qualifier le contact</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {onRappel && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Rappel"
                        title="Programmer un rappel"
                        onClick={() => onRappel()}
                        disabled={!contact}
                        className={cn(
                          "size-10 rounded-full transition-all duration-200 hover:scale-105 shrink-0",
                          "border-2 hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                        )}
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Programmer un rappel</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {onRendezVous && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Rendez-vous"
                        title="Programmer un rendez-vous"
                        onClick={() => onRendezVous()}
                        disabled={!contact}
                        className={cn(
                          "size-10 rounded-full transition-all duration-200 hover:scale-105 shrink-0",
                          "border-2 hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                        )}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Programmer un rendez-vous</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {onCalCom && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Cal.com"
                        title="Ouvrir Cal.com"
                        onClick={() => onCalCom()}
                        disabled={!contact}
                        className={cn(
                          "size-10 rounded-full transition-all duration-200 hover:scale-105 shrink-0",
                          "border-2 hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                        )}
                      >
                        <CalendarSearch className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ouvrir Cal.com</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallControl;














