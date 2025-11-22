
import { Category } from './types';
import type { ReactNode } from 'react';

import whalePng from './icons/whale.png';
import fishPng from './icons/fish.png';
import prematurePng from './icons/prématuré.png';
import indesirablePng from './icons/indésirable.png';

const WhaleIcon = <img src={whalePng} alt="Baleine" className="w-12 h-12" />;
const FishIcon = <img src={fishPng} alt="Poisson" className="w-12 h-12" />;
const HourglassIcon = <img src={prematurePng} alt="Prématuré" className="w-12 h-12" />;
const XCircleIcon = <img src={indesirablePng} alt="Inexploitable" className="w-12 h-12" />;

export const CATEGORY_DETAILS: {
  [key in Category]: {
    label: string;
    style: string;
    icon: ReactNode;
  };
} = {
  [Category.Baleine]: {
    label: 'Baleine',
    style: 'bg-blue-600 hover:bg-blue-500 text-white',
    icon: WhaleIcon,
  },
  [Category.Poisson]: {
    label: 'Poisson',
    style: 'bg-cyan-500 hover:bg-cyan-400 text-white',
    icon: FishIcon,
  },
  [Category.Premature]: {
    label: 'Prématuré',
    style: 'bg-amber-500 hover:bg-amber-400 text-white',
    icon: HourglassIcon,
  },
  [Category.Inexploitable]: {
    label: 'Inexploitable',
    style: 'bg-red-600 hover:bg-red-500 text-white',
    icon: XCircleIcon,
  },
};
