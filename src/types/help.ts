import { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type HelpCategory = 'documentation' | 'depannage';

export enum HelpSection {
  DocOverview = 'doc-overview',
  DocContacts = 'doc-contacts',
  DocCalls = 'doc-calls',
  DocProductivity = 'doc-productivity',
  DocGraph = 'doc-graph',
  DocAnnuaire = 'doc-annuaire',
  DocFiles = 'doc-files',
  TroubleshootAdb = 'troubleshoot-adb',
  TroubleshootImport = 'troubleshoot-import',
  TroubleshootPerformance = 'troubleshoot-performance',
  TroubleshootUpdates = 'troubleshoot-updates',
  // Aliases pour compatibilité ascendante
  Introduction = 'doc-overview',
  ContactManagement = 'doc-contacts',
  CallFeatures = 'doc-calls',
  ToolsAndActions = 'doc-productivity',
  CommonErrors = 'troubleshoot-adb',
  Settings = 'doc-overview'
}

export interface HelpQuickAction {
  title: string;
  description: string;
  shortcut?: string;
  icon?: ReactNode;
}

export interface HelpContentItem {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'warning' | 'tip' | 'quickstart';
  content: string | string[] | HelpQuickAction[];
  level?: number; // Pour les headings (1-6)
}

export interface HelpSectionData {
  id: HelpSection;
  title: string;
  icon: LucideIcon;
  description: string;
  category: HelpCategory;
  content: HelpContentItem[];
}

export interface HelpTutorialButtonProps {
  theme: any; // Using any to match existing Theme type
  className?: string;
}

export interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  theme: any; // Using any to match existing Theme type
  initialSection?: HelpSection;
  mode?: HelpCategory;
}

export interface HelpSidebarProps {
  activeSection: HelpSection;
  onSectionChange: (section: HelpSection) => void;
  theme: any; // Using any to match existing Theme type
  mode?: HelpCategory;
}

export interface HelpContentProps {
  section: HelpSection;
  theme: any; // Using any to match existing Theme type
  mode?: HelpCategory;
}

export interface HelpDialogState {
  activeSection: HelpSection;
  searchQuery?: string;
}