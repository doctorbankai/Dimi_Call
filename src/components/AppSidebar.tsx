import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Settings, Calendar, Phone, BarChart3, Database, BookOpen, Sparkles, HelpCircle } from 'lucide-react';

interface AppSidebarProps {
  activeTab: 'dimicall';
  onTabChange: (tab: 'dimicall') => void;
  onSettingsClick: () => void;
  viewMode: 'table' | 'appels-cards' | 'graph' | 'db' | 'calendar-2' | 'annuaire' | 'prequalification';
  onChangeViewMode: (mode: 'table' | 'appels-cards' | 'graph' | 'db' | 'calendar-2' | 'annuaire' | 'prequalification') => void;
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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div
                className="flex aspect-square size-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'var(--chart-1)', color: '#ffffff' }}
              >
                <span className="font-extrabold text-[16px] leading-none" style={{ color: 'inherit' }}>D</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">DimiCall</span>
                <span className="truncate text-xs text-muted-foreground">Workspace</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Modes Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={viewMode === 'appels-cards'}
                onClick={() => onChangeViewMode('appels-cards')}
                tooltip="Appels"
              >
                <Phone />
                <span>Appels</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={viewMode === 'calendar-2'}
                onClick={() => onChangeViewMode('calendar-2')}
                tooltip="Calendrier"
              >
                <Calendar />
                <span>Calendrier</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={viewMode === 'prequalification'}
                onClick={() => onChangeViewMode('prequalification')}
                tooltip="Pré-qualification"
              >
                <Sparkles />
                <span>Pré-qualification</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={viewMode === 'graph'}
                onClick={() => onChangeViewMode('graph')}
                tooltip="Graphiques"
              >
                <BarChart3 />
                <span>Graphiques</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {pagesVisibility.showDonneesPage && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={viewMode === 'db'}
                  onClick={() => onChangeViewMode('db')}
                  tooltip="Données"
                >
                  <Database />
                  <span>Données</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={viewMode === 'annuaire'}
                onClick={() => onChangeViewMode('annuaire')}
                tooltip="Annuaire"
              >
                <BookOpen />
                <span>Annuaire</span>
              </SidebarMenuButton>
            </SidebarMenuItem>


          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onSettingsClick}
              tooltip="Réglages"
            >
              <Settings />
              <span>Réglages</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
