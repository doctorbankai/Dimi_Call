import type { ReactNode } from 'react';
import { Anchor, Fish, Hourglass, Ban, SkipForward } from 'lucide-react';
import { ProspectCategory } from './types';
import { CategoryNamesService } from './services/categoryNamesService';

const WhaleIcon = <Anchor className="h-8 w-8" />;
const FishIcon = <Fish className="h-8 w-8" />;
const PrematureIcon = <Hourglass className="h-8 w-8" />;
const InexploitableIcon = <Ban className="h-8 w-8" />;
const PasserIcon = <SkipForward className="h-8 w-8" />;

// Fonction pour obtenir les détails avec les noms personnalisés
export const getCategoryDetails = (): Record<
  ProspectCategory,
  {
    label: string;
    description: string;
    badgeClass: string;
    buttonClass: string;
    icon: ReactNode;
  }
> => {
  const customNames = CategoryNamesService.getAllNames();
  
  return {
    [ProspectCategory.Baleine]: {
      label: customNames[ProspectCategory.Baleine],
      description: 'Compte stratégique et prioritaire',
      badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-200 border-sky-500/30',
      buttonClass:
        'bg-gradient-to-br from-sky-500/12 via-sky-500/8 to-indigo-500/12 text-foreground border-sky-500/35 shadow-[0_12px_32px_-18px_rgba(14,165,233,0.55)] hover:shadow-[0_12px_32px_-14px_rgba(14,165,233,0.65)] hover:border-sky-500/60',
      icon: WhaleIcon,
    },
    [ProspectCategory.Poisson]: {
      label: customNames[ProspectCategory.Poisson],
      description: 'Bon fit, opportunité standard',
      badgeClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-200 border-cyan-500/30',
      buttonClass:
        'bg-gradient-to-br from-cyan-500/12 via-cyan-400/10 to-emerald-500/12 text-foreground border-cyan-500/35 shadow-[0_12px_32px_-18px_rgba(16,185,129,0.55)] hover:shadow-[0_12px_32px_-14px_rgba(16,185,129,0.65)] hover:border-emerald-500/60',
      icon: FishIcon,
    },
    [ProspectCategory.Premature]: {
      label: customNames[ProspectCategory.Premature],
      description: 'Potentiel mais timing non idéal',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-200 border-amber-500/30',
      buttonClass:
        'bg-gradient-to-br from-amber-500/14 via-amber-400/10 to-orange-500/14 text-foreground border-amber-500/40 shadow-[0_12px_32px_-18px_rgba(245,158,11,0.55)] hover:shadow-[0_12px_32px_-14px_rgba(245,158,11,0.65)] hover:border-amber-500/65',
      icon: PrematureIcon,
    },
    [ProspectCategory.Inexploitable]: {
      label: customNames[ProspectCategory.Inexploitable],
      description: 'Non pertinent ou données insuffisantes',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-200 border-rose-500/30',
      buttonClass:
        'bg-gradient-to-br from-rose-500/14 via-rose-400/10 to-red-500/14 text-foreground border-rose-500/40 shadow-[0_12px_32px_-18px_rgba(244,63,94,0.55)] hover:shadow-[0_12px_32px_-14px_rgba(244,63,94,0.65)] hover:border-rose-500/65',
      icon: InexploitableIcon,
    },
    [ProspectCategory.Passer]: {
      label: customNames[ProspectCategory.Passer],
      description: 'Passer ce profil pour le moment',
      badgeClass: 'bg-gray-500/15 text-gray-700 dark:text-gray-200 border-gray-500/30',
      buttonClass:
        'bg-gradient-to-br from-gray-500/12 via-gray-400/10 to-gray-600/12 text-foreground border-gray-500/35 shadow-[0_12px_32px_-18px_rgba(107,114,128,0.45)] hover:shadow-[0_12px_32px_-14px_rgba(107,114,128,0.55)] hover:border-gray-500/60',
      icon: PasserIcon,
    },
  };
};

// Pour la compatibilité avec le code existant
export const CATEGORY_DETAILS = getCategoryDetails();

export const CATEGORY_ORDER: ProspectCategory[] = [
  ProspectCategory.Baleine,
  ProspectCategory.Poisson,
  ProspectCategory.Premature,
  ProspectCategory.Inexploitable,
];

export const MAIN_CATEGORIES: ProspectCategory[] = [
  ProspectCategory.Baleine,
  ProspectCategory.Poisson,
  ProspectCategory.Premature,
  ProspectCategory.Inexploitable,
];
