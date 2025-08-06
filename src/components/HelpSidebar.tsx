import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { HelpSidebarProps, HelpSection } from '../types/help';
import { getAllHelpSections } from '../data/helpContent';

const HelpSidebar: React.FC<HelpSidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  theme 
}) => {
  const sections = getAllHelpSections();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!sidebarRef.current?.contains(document.activeElement)) return;

      const currentIndex = sections.findIndex(section => section.id === activeSection);
      let newIndex = currentIndex;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          newIndex = Math.min(currentIndex + 1, sections.length - 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          newIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = sections.length - 1;
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          // Already handled by button click
          return;
        default:
          return;
      }

      if (newIndex !== currentIndex) {
        onSectionChange(sections[newIndex].id);
        // Focus the new active button
        setTimeout(() => {
          const activeButton = sidebarRef.current?.querySelector(`[data-section="${sections[newIndex].id}"]`) as HTMLButtonElement;
          activeButton?.focus();
        }, 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, onSectionChange, sections]);

  const handleSectionClick = (sectionId: HelpSection) => {
    onSectionChange(sectionId);
  };

  const handleKeyPress = (event: React.KeyboardEvent, sectionId: HelpSection) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSectionClick(sectionId);
    }
  };

  return (
    <div 
      ref={sidebarRef}
      className="w-64 sm:w-64 w-full bg-muted/30 border-r sm:border-r border-b sm:border-b-0 border-border h-full sm:h-full h-auto overflow-y-auto"
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Aide et tutoriel
        </h2>
        
        <nav className="space-y-1" role="navigation" aria-label="Sections d'aide">
          {sections.map((section) => {
            const isActive = section.id === activeSection;
            
            return (
              <button
                key={section.id}
                data-section={section.id}
                onClick={() => handleSectionClick(section.id)}
                onKeyDown={(e) => handleKeyPress(e, section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                  "hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50",
                  isActive && "bg-primary/10 text-primary border border-primary/20",
                  !isActive && "text-muted-foreground hover:text-foreground"
                )}
                role="tab"
                aria-selected={isActive}
                aria-controls={`help-content-${section.id}`}
                tabIndex={isActive ? 0 : -1}
              >
                <div className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0",
                  isActive ? "bg-primary/20" : "bg-muted/50"
                )}>
                  <section.icon className={cn(
                    "w-4 h-4",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-medium text-sm truncate",
                    isActive ? "text-primary" : "text-foreground"
                  )}>
                    {section.title}
                  </div>
                  <div className={cn(
                    "text-xs truncate mt-0.5",
                    isActive ? "text-primary/70" : "text-muted-foreground"
                  )}>
                    {section.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Keyboard navigation hint */}
      <div className="px-4 pb-4 mt-auto hidden sm:block">
        <div className="bg-muted/50 rounded-lg p-3 border">
          <p className="text-xs text-muted-foreground">
            <strong>Navigation :</strong> Utilisez les flèches ↑↓ pour naviguer, Entrée pour sélectionner
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpSidebar;