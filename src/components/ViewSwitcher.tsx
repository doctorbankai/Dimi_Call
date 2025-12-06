import { ButtonGroup } from '@/components/ui/button-group';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'cards' | 'table';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export function ViewSwitcher({ currentView, onViewChange, className }: ViewSwitcherProps) {
  return (
    <ButtonGroup
      className={cn('inline-flex', className)}
      role="group"
      aria-label="Sélectionner le mode d'affichage"
    >
      <Button
        variant={currentView === 'cards' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('cards')}
        aria-label="Vue en cartes"
        aria-pressed={currentView === 'cards'}
        className={cn(
          "h-9 px-3 shadow-none",
          currentView !== 'cards' && "bg-white dark:bg-card border-border/70"
        )}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Cards</span>
      </Button>
      <Button
        variant={currentView === 'table' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('table')}
        aria-label="Vue en tableau"
        aria-pressed={currentView === 'table'}
        className={cn(
          "h-9 px-3 shadow-none",
          currentView !== 'table' && "bg-white dark:bg-card border-border/70"
        )}
      >
        <Table2 className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Table</span>
      </Button>
    </ButtonGroup>
  );
}
