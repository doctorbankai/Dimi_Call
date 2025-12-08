import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { HelpSidebarProps, HelpSection } from '../types/help';
import { getHelpSectionsByCategory } from '../data/helpContent';

const HelpSidebar: React.FC<HelpSidebarProps> = ({
  activeSection,
  onSectionChange,
  theme,
  mode
}) => {
  const currentMode = mode ?? 'documentation';
  const sections = useMemo(() => getHelpSectionsByCategory(currentMode), [currentMode]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSearchQuery('');
  }, [currentMode]);

  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sections;
    return sections.filter(section => 
      section.title.toLowerCase().includes(query) ||
      section.description.toLowerCase().includes(query)
    );
  }, [searchQuery, sections]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!sidebarRef.current?.contains(document.activeElement)) return;

      const currentIndex = filteredSections.findIndex(section => section.id === activeSection);
      let newIndex = currentIndex;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          newIndex = Math.min(Math.max(currentIndex, 0) + 1, filteredSections.length - 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          newIndex = Math.max((currentIndex === -1 ? 0 : currentIndex) - 1, 0);
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = filteredSections.length - 1;
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          // Already handled by button click
          return;
        default:
          return;
      }

      if (newIndex !== currentIndex && filteredSections[newIndex]) {
        onSectionChange(filteredSections[newIndex].id);
        // Focus the new active button
        setTimeout(() => {
          const activeButton = sidebarRef.current?.querySelector(`[data-section="${filteredSections[newIndex].id}"]`) as HTMLButtonElement;
          activeButton?.focus();
        }, 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, onSectionChange, filteredSections]);

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
      className="w-full sm:w-72 bg-background border-r sm:border-r border-b sm:border-b-0 border-border/60 h-full sm:h-full h-auto overflow-y-auto"
    >
      <div className="p-4 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une section..."
            className="w-full px-3 py-2 pr-9 rounded-lg border border-border/60 bg-background text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Rechercher dans l'aide"
          />
          <div className="absolute inset-y-0 right-2 flex items-center">
            <span className="text-[11px] px-2 py-1 rounded bg-muted text-muted-foreground border">
              Ctrl + F
            </span>
          </div>
        </div>
        
        <nav className="space-y-1" role="navigation" aria-label="Sections d'aide">
          {filteredSections.map((section) => {
            const isActive = section.id === activeSection;
            
            return (
              <button
                key={section.id}
                data-section={section.id}
                onClick={() => handleSectionClick(section.id)}
                onKeyDown={(e) => handleKeyPress(e, section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 border",
                  "hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40",
                  isActive && "bg-primary/10 text-primary border-primary/30 shadow-sm",
                  !isActive && "text-muted-foreground hover:text-foreground border-transparent"
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

          {filteredSections.length === 0 && (
            <div className="text-sm text-muted-foreground px-2 py-3 border border-dashed border-border/60 rounded-lg">
              Aucune section trouvée. Essayez un autre terme.
            </div>
          )}
        </nav>
      </div>
      
    </div>
  );
};

export default HelpSidebar;