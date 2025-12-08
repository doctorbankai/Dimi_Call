import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Settings, Calendar, Phone, BarChart3, Database, BookOpen, Sparkles, Files } from 'lucide-react';
interface AppSidebarProps {
  activeTab: 'dimicall';
  onTabChange: (tab: 'dimicall') => void;
  onSettingsClick: () => void;
  viewMode: 'table' | 'appels-cards' | 'graph' | 'db' | 'calendar-2' | 'annuaire' | 'files' | 'prequalification';
  onChangeViewMode: (mode: 'table' | 'appels-cards' | 'graph' | 'db' | 'calendar-2' | 'annuaire' | 'files' | 'prequalification') => void;
}

export function AppSidebar({
  activeTab,
  onTabChange,
  onSettingsClick,
  viewMode,
  onChangeViewMode,
}: AppSidebarProps) {
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
      className="h-full transition-[width] duration-200 ease-linear"
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3rem",
        } as React.CSSProperties
      }
    >
      <Sidebar
        variant="inset"
        collapsible="icon"
        className="h-full group-data-[variant=floating]:shadow-sm"
      >

      <SidebarContent className="flex-1 bg-sidebar backdrop-blur-sm">
        {/* Branding */}
        <div className="flex items-center gap-2 px-4 py-3 overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0" aria-label="DimiCall">
            <span className="font-extrabold text-[16px] leading-none">D</span>
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">DimiCall</span>
          </div>
        </div>
        <SidebarMenu>

          {/* Modes Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Modes</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === 'appels-cards'}
                  onClick={() => onChangeViewMode('appels-cards')}
                  tooltip="Appels"
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
                  tooltip="Calendrier"
                  className="w-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Calendrier</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === 'prequalification'}
                  onClick={() => onChangeViewMode('prequalification')}
                  tooltip="Pré-qualification"
                  className="w-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Pré-qualification</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === 'graph'}
                  onClick={() => onChangeViewMode('graph')}
                  tooltip="Graphiques"
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
                    tooltip="Données"
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
                  tooltip="Annuaire"
                  className="w-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Annuaire</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === 'files'}
                  onClick={() => onChangeViewMode('files')}
                  tooltip="Fichiers"
                  className="w-full justify-start gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <Files className="w-4 h-4" />
                  <span>Fichiers</span>
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
                  onClick={onSettingsClick}
                  tooltip="Réglages"
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

      </Sidebar>
    </div>
  );
} 
