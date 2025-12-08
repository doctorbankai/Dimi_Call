import React, { useState, useEffect, useMemo } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { HelpDialogProps, HelpSection } from '../types/help';
import HelpSidebar from './HelpSidebar';
import HelpContent from './HelpContent';
import { getHelpSectionsByCategory } from '../data/helpContent';

const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose, theme, initialSection, mode = 'documentation' }) => {
  const sections = useMemo(() => getHelpSectionsByCategory(mode), [mode]);
  const fallbackSection = sections[0]?.id ?? HelpSection.DocOverview;
  const [activeSection, setActiveSection] = useState<HelpSection>(
    initialSection && sections.some((s) => s.id === initialSection) ? initialSection : fallbackSection
  );

  // Reset when dialog opens or mode/initial changes
  useEffect(() => {
    if (isOpen) {
      const target =
        (initialSection && sections.some((s) => s.id === initialSection) && initialSection) ||
        fallbackSection;
      setActiveSection(target);
    }
  }, [isOpen, initialSection, fallbackSection, sections]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleSectionChange = (section: HelpSection) => {
    setActiveSection(section);
  };

  const modeLabel = mode === 'documentation' ? 'Documentation' : 'Dépannage';
  const modeDescription =
    mode === 'documentation'
      ? 'Guides concis pour prendre en main DimiCall.'
      : 'Résolution rapide des problèmes courants.';
  const activeSectionTitle = sections.find((s) => s.id === activeSection)?.title ?? modeLabel;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-5xl w-full h-[80vh] p-0 gap-0",
          "bg-background/95 border border-border/60 backdrop-blur",
          "sm:max-w-4xl md:max-w-5xl lg:max-w-5xl",
          "sm:h-[78vh] md:h-[82vh]",
          "flex flex-col overflow-hidden rounded-2xl shadow-xl"
        )}
        aria-labelledby="help-dialog-title"
        aria-describedby="help-dialog-description"
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 p-0 !pb-0 !gap-0 !border-b-0">
          <div className="px-5 py-4 border-b border-border/60 bg-background sticky top-0 z-10">
            <div className="flex items-start sm:items-center gap-3 justify-between">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <DialogTitle 
                    id="help-dialog-title"
                    className="text-lg font-semibold text-foreground"
                  >
                    {modeLabel} DimiCall
                  </DialogTitle>
                  <p 
                    id="help-dialog-description" 
                    className="text-sm text-muted-foreground mt-1"
                  >
                    {modeDescription}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border">
                  Mis à jour en continu
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-full border border-border/60 bg-background px-2.5 py-2 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  aria-label="Fermer l'aide"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="flex flex-1 min-h-0 sm:flex-row flex-col bg-background">
          {/* Sidebar */}
          <div className="flex-shrink-0 sm:block">
            <HelpSidebar
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              theme={theme}
              mode={mode}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <div 
              id={`help-content-${activeSection}`}
              role="tabpanel"
              aria-labelledby={`help-section-${activeSection}`}
              className="h-full"
            >
              <HelpContent
                section={activeSection}
                theme={theme}
                mode={mode}
              />
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;