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
    <div
      className={cn('inline-flex items-center p-0.5 rounded-lg bg-muted/40', className)}
      role="group"
      aria-label="Sélectionner le mode d'affichage"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('cards')}
        aria-label="Vue en cartes"
        aria-pressed={currentView === 'cards'}
        className={cn(
          "h-7 px-2.5 text-xs rounded-md transition-all",
          currentView === 'cards' 
            ? "bg-background shadow-sm text-foreground" 
            : "text-muted-foreground hover:text-foreground hover:bg-transparent"
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span className="hidden sm:inline ml-1.5">Cards</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('table')}
        aria-label="Vue en tableau"
        aria-pressed={currentView === 'table'}
        className={cn(
          "h-7 px-2.5 text-xs rounded-md transition-all",
          currentView === 'table' 
            ? "bg-background shadow-sm text-foreground" 
            : "text-muted-foreground hover:text-foreground hover:bg-transparent"
        )}
      >
        <Table2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline ml-1.5">Table</span>
      </Button>
    </div>
  );
}
