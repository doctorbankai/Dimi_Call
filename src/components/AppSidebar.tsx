import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarMenuBadge,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Settings, User, Calendar, Crown, Phone, BarChart3, Database, PanelLeft, MailQuestion, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" className="top-8 h-[calc(100svh-2rem)]">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">DimiCall</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1">
        <SidebarMenu>

          {/* Modes Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Modes</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === 'table'}
                  onClick={() => onChangeViewMode('table')}
                  className="w-full justify-start gap-3"
                >
                  <Phone className="w-4 h-4" />
                  <span>Appels</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === 'graph'}
                  onClick={() => onChangeViewMode('graph')}
                  className="w-full justify-start gap-3"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Graphiques</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === 'db'}
                  onClick={() => onChangeViewMode('db')}
                  className="w-full justify-start gap-3"
                >
                  <Database className="w-4 h-4" />
                  <span>Données</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* Assistance Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Assistance</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onTicketClick}
                  className="w-full justify-start gap-3"
                >
                  <MailQuestion className="w-4 h-4" />
                  <span>Envoyer un ticket</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onHelpClick}
                  className="w-full justify-start gap-3"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Aide et tutoriel</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onSettingsClick}
                  className="w-full justify-start gap-3"
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3 hover:bg-accent"
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
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Préférences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onLogout && (
              <DropdownMenuItem onClick={onLogout}>
                Déconnexion
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
} 