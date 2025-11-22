
export enum Category {
  Baleine = 'Baleine',
  Poisson = 'Poisson',
  Premature = 'Prématuré',
  Inexploitable = 'Inexploitable',
}

export interface Profile {
  id: string;
  prenom: string;
  nom: string;
  // Add an optional status field to the Profile interface
  status?: Category;
}

export type ClassificationMap = Record<string, Category>;
