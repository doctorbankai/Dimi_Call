import React, { useState, useEffect } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { HelpDialogProps, HelpSection } from '../types/help';
import HelpSidebar from './HelpSidebar';
import HelpContent from './HelpContent';

const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose, theme }) => {
  const [activeSection, setActiveSection] = useState<HelpSection>(HelpSection.Introduction);

  // Reset to introduction when dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveSection(HelpSection.Introduction);
    }
  }, [isOpen]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-6xl w-full h-[85vh] p-0 gap-0",
          "bg-background border border-border",
          "sm:max-w-4xl md:max-w-5xl lg:max-w-6xl",
          "sm:h-[80vh] md:h-[85vh]"
        )}
        aria-labelledby="help-dialog-title"
        aria-describedby="help-dialog-description"
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <DialogTitle 
                id="help-dialog-title"
                className="text-xl font-semibold text-foreground"
              >
                Aide DimiCall
              </DialogTitle>
              <p 
                id="help-dialog-description" 
                className="text-sm text-muted-foreground mt-1"
              >
                Guide complet d'utilisation de l'application
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="flex flex-1 min-h-0 sm:flex-row flex-col">
          {/* Sidebar */}
          <div className="flex-shrink-0 sm:block">
            <HelpSidebar
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              theme={theme}
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
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground sm:flex-row flex-col sm:gap-0 gap-2">
            <div className="flex items-center gap-4 sm:gap-4 gap-2">
              <span className="hidden sm:inline">DimiCall - Guide d'utilisation</span>
              <span className="sm:inline hidden">•</span>
              <span>Utilisez Échap pour fermer</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Section :</span>
              <span className="font-medium text-foreground">
                {activeSection.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;