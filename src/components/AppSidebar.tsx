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
import { Settings, User, Calendar, Crown, Phone, BarChart3, Database, PanelLeft, MailQuestion, HelpCircle } from 'lucide-react';
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
  viewMode: 'table' | 'graph' | 'db';
  onChangeViewMode: (mode: 'table' | 'graph' | 'db') => void;
  onTicketClick?: () => void;
  onHelpClick?: () => void;
  theme?: Theme;
}

export function AppSidebar({
  activeTab,
  onTabChange,
  onSettingsClick,
  userName = "Paul",
  userEmail = "paul@example.com",
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
  const appVersion = packageJson.version;
  const { mode, setMode } = useCallMode();
  const { state, setOpen } = useSidebar();
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
                  isActive={viewMode === 'table'}
                  onClick={() => onChangeViewMode('table')}
                  className="w-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <Phone className="w-4 h-4" />
                  <span>Appels</span>
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
            </SidebarMenu>
          </SidebarGroup>

          {/* Mode Client/Mandataire Section */}
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
                      checked={mode === CallMode.Mandataire}
                      onCheckedChange={(checked) => {
                        const newMode = checked ? CallMode.Mandataire : CallMode.Client;
                        setMode(newMode);
                      }}
                    />
                    <Badge variant={mode === CallMode.Mandataire ? 'default' : 'secondary'} className="text-xs">
                      Mandataire
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
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <span data-slot="avatar" className="relative flex size-8 shrink-0 overflow-hidden rounded-full w-8 h-8">
                <img data-slot="avatar-image" className="aspect-square size-full object-cover" alt={userEmail} src={
                  'data:image/svg+xml;base64,CiAgICAgIDxzdmcgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiB2aWV3Qm94PSIwIDAgMjAgMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICAgICAgPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMTAiIGZpbGw9IiNGNTlFMEIiLz4KICAgICAgICA8dGV4dCB4PSIxMCIgeT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iOCIgcG9pbnRlci1ldmVudHM9Im5vbmUiIGZvbnQtd2VpZ2h0PSI2MDAiPgogICAgICAgICAgIFAKICAgICAgICA8L3RleHQ+CiAgICAgIDwvc3ZnPgogICAg' } />
              </span>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[hsl(var(--background))] bg-green-500"></div>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium truncate">{userName}</div>
              <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
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
