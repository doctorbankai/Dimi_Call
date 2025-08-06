import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HelpTutorialButtonProps } from '../types/help';
import HelpDialog from './HelpDialog';

const HelpTutorialButton: React.FC<HelpTutorialButtonProps> = ({ theme, className }) => {
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  const handleClick = () => {
    setIsHelpDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsHelpDialogOpen(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "p-2 rounded transition-all duration-200 focus:outline-none",
          "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
          className
        )}
        title="Aide et tutoriel"
        aria-label="Ouvrir l'aide et le tutoriel"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      <HelpDialog
        isOpen={isHelpDialogOpen}
        onClose={handleCloseDialog}
        theme={theme}
      />
    </>
  );
};

export default HelpTutorialButton;