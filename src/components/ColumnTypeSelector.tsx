import React, { useState } from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Phone, 
  Mail, 
  Hash, 
  Calendar, 
  Clock, 
  Timer, 
  MessageCircle, 
  FileText,
  HelpCircle,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';

export type ColumnDataType = 
  | 'text'
  | 'number'
  | 'phone'
  | 'email'
  | 'date'
  | 'time'
  | 'duration'
  | 'comment'
  | 'status'
  | 'unknown';

interface ColumnTypeSelectorProps {
  columnId: string;
  columnLabel: string;
  currentType?: ColumnDataType;
  onTypeChange: (columnId: string, newType: ColumnDataType) => void;
  className?: string;
}

const TYPE_OPTIONS: Array<{
  value: ColumnDataType;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}> = [
  { value: 'text', label: 'Texte', icon: User, description: 'Nom, prénom, commentaire' },
  { value: 'number', label: 'Numéro', icon: Hash, description: 'ID, numéros' },
  { value: 'phone', label: 'Téléphone', icon: Phone, description: 'Numéros de téléphone' },
  { value: 'email', label: 'Email', icon: Mail, description: 'Adresses email' },
  { value: 'date', label: 'Date', icon: Calendar, description: 'Dates (RDV, rappel, appel)' },
  { value: 'time', label: 'Heure', icon: Clock, description: 'Heures (RDV, rappel, appel)' },
  { value: 'duration', label: 'Durée', icon: Timer, description: 'Durée d\'appel' },
  { value: 'comment', label: 'Commentaire', icon: MessageCircle, description: 'Notes, commentaires' },
  { value: 'status', label: 'Statut', icon: FileText, description: 'Statuts, états' },
  { value: 'unknown', label: 'Non reconnu', icon: HelpCircle, description: 'Type à définir' },
];

export const ColumnTypeSelector: React.FC<ColumnTypeSelectorProps> = ({
  columnId,
  columnLabel,
  currentType = 'unknown',
  onTypeChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTypeChange = (newType: ColumnDataType) => {
    onTypeChange(columnId, newType);
    setIsOpen(false);
  };

  const getCurrentTypeConfig = () => {
    return TYPE_OPTIONS.find(option => option.value === currentType) || TYPE_OPTIONS[TYPE_OPTIONS.length - 1];
  };

  const currentConfig = getCurrentTypeConfig();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 px-2 text-xs font-normal hover:bg-muted/80 transition-colors",
            currentType === 'unknown' && "text-muted-foreground/60",
            className
          )}
        >
                  <div className="flex items-center justify-center">
          <currentConfig.icon className="w-3 h-3" />
        </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="w-64 p-2"
        side="bottom"
        sideOffset={4}
      >
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Type de données pour "{columnLabel}"
          </div>
          
          {TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = currentType === option.value;
            
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleTypeChange(option.value)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md transition-colors",
                  isSelected 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted/80"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} />
                
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-medium text-sm",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {option.description}
                  </div>
                </div>
                
                {isSelected && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
