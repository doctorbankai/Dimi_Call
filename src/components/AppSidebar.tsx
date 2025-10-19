import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarMenuBadge,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from '@/components/ui/sidebar';
import { Settings, User, Calendar, Crown, Phone, BarChart3, Database, PanelLeft, MailQuestion, HelpCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserProfileDialog } from './UserProfileDialog';
import { TicketForm } from './TicketForm';
import HelpDialog from './HelpDialog';
import { useSupabaseAuth } from '../lib/auth-client';
import packageJson from '../../package.json';
import { Theme, CallMode } from '../types';
import { useCallMode } from '../context/ModeContext';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface AppSidebarProps {
  activeTab: 'dimicall';
  onTabChange: (tab: 'dimicall') => void;
  onSettingsClick: () => void;
  userName?: string;
  userEmail?: string;
  hasSpecialAccess?: boolean;
  onLogout?: () => void;
  viewMode: 'table' | 'appels-cards' | 'graph' | 'db' | 'calendar-2' | 'annuaire';
  onChangeViewMode: (mode: 'table' | 'appels-cards' | 'graph' | 'db' | 'calendar-2' | 'annuaire') => void;
  onTicketClick?: () => void;
  onHelpClick?: () => void;
  theme?: Theme;
}

export function AppSidebar({
  activeTab,
  onTabChange,
  onSettingsClick,
  userName,
  userEmail,
  hasSpecialAccess = true,
  onLogout,
  viewMode,
  onChangeViewMode,
  onTicketClick,
  onHelpClick,
  theme = Theme.Dark,
}: AppSidebarProps) {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const auth = useSupabaseAuth();
  
  // Charger la visibilité des pages
  const [pagesVisibility, setPagesVisibility] = useState<{
    showAppelsPage: boolean;
    showDonneesPage: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('dimicall_pages_visibility');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la visibilité des pages:', error);
    }
    return { showAppelsPage: false, showDonneesPage: false };
  });

  // Extraire les vraies informations utilisateur
  const realUserEmail = auth.user?.email || userEmail || "Utilisateur";
  const realUserName = userName || auth.user?.user_metadata?.full_name || 
    (realUserEmail.includes('@') ? realUserEmail.split('@')[0] : realUserEmail);
  
  // Générer les initiales pour l'avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  // Générer l'avatar SVG avec les initiales
  const generateAvatarSVG = (initials: string, email: string) => {
    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', 
      '#1abc9c', '#34495e', '#e67e22', '#8e44ad', '#16a085'
    ];
    const colorIndex = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    const svg = `
      <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="14" fill="${backgroundColor}"/>
        <text x="14" y="18" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="600">
          ${initials}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const userInitials = getInitials(realUserName);
  const avatarSrc = generateAvatarSVG(userInitials, realUserEmail);
  const appVersion = packageJson.version;
  const { mode, setMode } = useCallMode();
  const { state, setOpen } = useSidebar();
  
  // Écouter les changements de visibilité des pages
  React.useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('dimicall_pages_visibility');
        if (saved) {
          setPagesVisibility(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la visibilité des pages:', error);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  return (
    <div
      className="fixed left-0 top-8 h-[calc(100vh-2rem)] z-[10001] transition-[width] duration-200 ease-linear"
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3rem",
          width: state === "collapsed" ? "var(--sidebar-width-icon)" : "var(--sidebar-width)"
        } as React.CSSProperties
      }
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Sidebar
        collapsible="icon"
        className="h-full shadow-2xl"
      >

      <SidebarContent className="flex-1 bg-sidebar backdrop-blur-sm">
        <SidebarMenu>

          {/* Modes Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Modes</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === 'appels-cards'}
                  onClick={() => onChangeViewMode('appels-cards')}
                  className="w-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <Phone className="w-4 h-4" />
                  <span>Appels</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === 'calendar-2'}
                  onClick={() => onChangeViewMode('calendar-2')}
                  className="w-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Calendrier</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === 'graph'}
                  onClick={() => onChangeViewMode('graph')}
                  className="w-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Graphiques</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {pagesVisibility.showDonneesPage && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={viewMode === 'db'}
                    onClick={() => onChangeViewMode('db')}
                    className="w-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                  >
                    <Database className="w-4 h-4" />
                    <span>Données</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === 'annuaire'}
                  onClick={() => onChangeViewMode('annuaire')}
                  className="w-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Annuaire</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* Mode Client/Apporteur Section */}
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Mode d'appel</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center justify-between w-full p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={mode === CallMode.Client ? 'default' : 'secondary'} className="text-xs">
                      Client
                    </Badge>
                    <Switch
                      checked={mode === CallMode.Apporteur}
                      onCheckedChange={(checked) => {
                        const newMode = checked ? CallMode.Apporteur : CallMode.Client;
                        setMode(newMode);
                      }}
                    />
                    <Badge variant={mode === CallMode.Apporteur ? 'default' : 'secondary'} className="text-xs">
                      Apporteur
                    </Badge>
                  </div>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* Assistance Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Assistance</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsTicketFormOpen(true)}
                  className="w-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <MailQuestion className="w-4 h-4" />
                  <span>Envoyer un ticket</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsHelpDialogOpen(true)}
                  className="w-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Aide et tutoriel</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onSettingsClick}
                  className="w-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <Settings className="w-4 h-4" />
                  <span>Réglages</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto pb-0">
        <Button
          variant="ghost"
          onClick={() => setIsProfileDialogOpen(true)}
          className="w-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 h-auto p-3 hover:bg-accent"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0 group-data-[collapsible=icon]:justify-center">
            <div className="relative group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
              <span data-slot="avatar" className="relative flex size-8 shrink-0 overflow-hidden rounded-full w-8 h-8 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:w-7 group-data-[collapsible=icon]:h-7">
                <img
                  data-slot="avatar-image"
                  className="aspect-square size-full object-cover"
                  alt={realUserEmail}
                  src={avatarSrc}
                />
              </span>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[hsl(var(--background))] bg-green-500 group-data-[collapsible=icon]:w-1.5 group-data-[collapsible=icon]:h-1.5 group-data-[collapsible=icon]:-bottom-0 group-data-[collapsible=icon]:-right-0"></div>
            </div>
            <div className="flex-1 min-w-0 text-left group-data-[collapsible=icon]:hidden">
              <div className="text-sm font-medium truncate">{realUserName}</div>
              <div className="text-xs text-muted-foreground truncate">{realUserEmail}</div>
            </div>
          </div>
        </Button>
      </SidebarFooter>

      {/* Dialogue de profil utilisateur */}
      <UserProfileDialog 
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
      />

      {/* Formulaire de ticket */}
      <TicketForm 
        isOpen={isTicketFormOpen} 
        onOpenChange={setIsTicketFormOpen}
        userEmail={auth.user?.email}
        appVersion={appVersion}
      />

      {/* Dialogue d'aide */}
      <HelpDialog
        isOpen={isHelpDialogOpen}
        onClose={() => setIsHelpDialogOpen(false)}
        theme={theme}
      />
      </Sidebar>
    </div>
  );
} 
