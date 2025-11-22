import type { ReactNode } from 'react';
import { Anchor, Fish, Hourglass, Ban } from 'lucide-react';
import { ProspectCategory } from './types';

const WhaleIcon = <Anchor className="h-8 w-8" />;
const FishIcon = <Fish className="h-8 w-8" />;
const PrematureIcon = <Hourglass className="h-8 w-8" />;
const InexploitableIcon = <Ban className="h-8 w-8" />;

export const CATEGORY_DETAILS: Record<
  ProspectCategory,
  {
    label: string;
    description: string;
    badgeClass: string;
    buttonClass: string;
    icon: ReactNode;
  }
> = {
  [ProspectCategory.Baleine]: {
    label: 'Baleine',
    description: 'Compte stratégique et prioritaire',
    badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-200 border-sky-500/30',
    buttonClass:
      'bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30',
    icon: WhaleIcon,
  },
  [ProspectCategory.Poisson]: {
    label: 'Poisson',
    description: 'Bon fit, opportunité standard',
    badgeClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-200 border-cyan-500/30',
    buttonClass:
      'bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30',
    icon: FishIcon,
  },
  [ProspectCategory.Premature]: {
    label: 'Prématuré',
    description: 'Potentiel mais timing non idéal',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-200 border-amber-500/30',
    buttonClass:
      'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30',
    icon: PrematureIcon,
  },
  [ProspectCategory.Inexploitable]: {
    label: 'Inexploitable',
    description: 'Non pertinent ou données insuffisantes',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-200 border-rose-500/30',
    buttonClass:
      'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30',
    icon: InexploitableIcon,
  },
};

export const CATEGORY_ORDER: ProspectCategory[] = [
  ProspectCategory.Baleine,
  ProspectCategory.Poisson,
  ProspectCategory.Premature,
  ProspectCategory.Inexploitable,
];
