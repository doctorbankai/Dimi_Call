import { LucideIcon } from 'lucide-react';

export enum HelpSection {
  Introduction = 'introduction',
  ContactManagement = 'contact-management',
  CallFeatures = 'call-features',
  ToolsAndActions = 'tools-and-actions',
  CommonErrors = 'common-errors'
}

export interface HelpContentItem {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'warning' | 'tip';
  content: string | string[];
  level?: number; // Pour les headings (1-6)
}

export interface HelpSectionData {
  id: HelpSection;
  title: string;
  icon: LucideIcon;
  description: string;
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
}

export interface HelpSidebarProps {
  activeSection: HelpSection;
  onSectionChange: (section: HelpSection) => void;
  theme: any; // Using any to match existing Theme type
}

export interface HelpContentProps {
  section: HelpSection;
  theme: any; // Using any to match existing Theme type
}

export interface HelpDialogState {
  activeSection: HelpSection;
  searchQuery?: string;
}