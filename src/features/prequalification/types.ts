export enum ProspectCategory {
  Baleine = 'Baleine',
  Poisson = 'Poisson',
  Premature = 'Prématuré',
  Inexploitable = 'Inexploitable',
}

export interface ProspectProfile {
  id: string;
  prenom: string;
  nom: string;
  status?: ProspectCategory;
}

export type ClassificationMap = Record<string, ProspectCategory>;

export type PreQualificationStep = 'upload' | 'classify' | 'summary';
