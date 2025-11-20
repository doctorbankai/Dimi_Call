import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Filtre les valeurs vides/nulles/undefined/N/A et retourne une chaîne propre
 * @param values - Les valeurs à filtrer et concaténer
 * @returns Une chaîne propre sans valeurs vides
 */
export const filterAndJoin = (...values: (string | null | undefined)[]): string => {
  return values
    .filter(val => val && val.trim() !== '' && val.toLowerCase() !== 'n/a' && val !== 'null' && val !== 'undefined')
    .map(val => val!.trim())
    .join(' ')
    .trim();
};

/**
 * Supprime les accents d'une chaîne de caractères
 * @param str - La chaîne à normaliser
 * @returns La chaîne sans accents
 */
export const removeAccents = (str: string): string => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Gérer les ligatures spéciales qui ne sont pas normalisées par NFD
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'OE')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'AE');
};

// Variables globales pour garder les références des fenêtres de recherche
let linkedInWindowRef: Window | null = null;
let googleWindowRef: Window | null = null;
let linkWindowRef: Window | null = null;

/**
 * Ouvre une URL LinkedIn dans une fenêtre dédiée qui sera réutilisée pour tous les liens LinkedIn
 * Si la fenêtre existe déjà, elle sera réutilisée et rechargée avec la nouvelle URL
 * @param url - L'URL LinkedIn à ouvrir
 */
export const openLinkedInWindow = (url: string): void => {
  // Vérifier si la fenêtre existe déjà et n'est pas fermée
  if (linkedInWindowRef && !linkedInWindowRef.closed) {
    try {
      // Naviguer vers la nouvelle URL dans la fenêtre existante (recharge la page)
      linkedInWindowRef.location.href = url;
      // Donner le focus à la fenêtre
      linkedInWindowRef.focus();
    } catch (error) {
      // En cas d'erreur (ex: fenêtre fermée), créer une nouvelle fenêtre
      console.log('Erreur lors du rechargement de la fenêtre LinkedIn, création d\'une nouvelle fenêtre');
      linkedInWindowRef = window.open(url, 'dimicall-linkedin-window', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
  } else {
    // Créer une nouvelle fenêtre et garder la référence
    linkedInWindowRef = window.open(url, 'dimicall-linkedin-window', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  }
};

/**
 * Ouvre une URL Google dans une fenêtre dédiée qui sera réutilisée pour toutes les recherches Google
 * Si la fenêtre existe déjà, elle sera réutilisée et rechargée avec la nouvelle URL
 * @param url - L'URL Google à ouvrir
 */
export const openGoogleWindow = (url: string): void => {
  // Vérifier si la fenêtre existe déjà et n'est pas fermée
  if (googleWindowRef && !googleWindowRef.closed) {
    try {
      // Naviguer vers la nouvelle URL dans la fenêtre existante (recharge la page)
      googleWindowRef.location.href = url;
      // Donner le focus à la fenêtre
      googleWindowRef.focus();
    } catch (error) {
      // En cas d'erreur (ex: fenêtre fermée), créer une nouvelle fenêtre
      console.log('Erreur lors du rechargement de la fenêtre Google, création d\'une nouvelle fenêtre');
      googleWindowRef = window.open(url, 'dimicall-google-window', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
  } else {
    // Créer une nouvelle fenêtre et garder la référence
    googleWindowRef = window.open(url, 'dimicall-google-window', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  }
};

/**
 * Génère une URL de recherche LinkedIn et l'ouvre dans la fenêtre dédiée
 * @param prenom - Prénom de la personne à rechercher (peut contenir des accents)
 * @param nom - Nom de la personne à rechercher (peut contenir des accents)
 * @param type - Type du contact (optionnel, inclus dans la requête)
 * @param source - Source du contact (optionnel, incluse dans la requête)
 */
export const searchLinkedIn = (prenom: string, nom: string, type?: string, source?: string): void => {
  // Normaliser les accents avant de créer la requête
  const normalizedPrenom = removeAccents(prenom);
  const normalizedNom = removeAccents(nom);

  // Inclure le contexte (type/école/source) s'il est fourni
  const normalizedType = removeAccents(type ?? '');
  const normalizedSource = removeAccents(source ?? '');

  const query = filterAndJoin(normalizedPrenom, normalizedNom, normalizedType, normalizedSource);
  if (!query) {
    console.warn('Aucune valeur valide pour la recherche LinkedIn');
    return;
  }
  const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
  openLinkedInWindow(url);
};

/**
 * Génère une URL de recherche Google et l'ouvre dans la fenêtre dédiée
 * @param prenom - Prénom de la personne à rechercher
 * @param nom - Nom de la personne à rechercher
 * @param type - Type du contact (optionnel, ignoré)
 * @param source - Source du contact (optionnel, ignoré)
 */
export const searchGoogle = (prenom: string, nom: string, type?: string, source?: string): void => {
  // Ne prendre en compte que le prénom et le nom
  const query = filterAndJoin(prenom, nom);
  if (!query) {
    console.warn('Aucune valeur valide pour la recherche Google');
    return;
  }
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  openGoogleWindow(url);
};

/**
 * Ouvre un lien direct dans une fenêtre dédiée qui sera réutilisée pour tous les liens
 * Si la fenêtre existe déjà, elle sera réutilisée et rechargée avec la nouvelle URL
 * @param url - L'URL à ouvrir
 */
export const openDirectLink = (url: string): void => {
  if (!isValidUrl(url)) {
    console.warn('URL invalide:', url);
    return;
  }

  // Assurer que l'URL a un protocole
  const fullUrl = url.startsWith('http') ? url : `https://${url}`;

  // Vérifier si la fenêtre existe déjà et n'est pas fermée
  if (linkWindowRef && !linkWindowRef.closed) {
    try {
      // Naviguer vers la nouvelle URL dans la fenêtre existante (recharge la page)
      linkWindowRef.location.href = fullUrl;
      // Donner le focus à la fenêtre
      linkWindowRef.focus();
    } catch (error) {
      // En cas d'erreur (ex: fenêtre fermée), créer une nouvelle fenêtre
      console.log('Erreur lors du rechargement de la fenêtre Lien, création d\'une nouvelle fenêtre');
      linkWindowRef = window.open(fullUrl, 'dimicall-link-window', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
  } else {
    // Créer une nouvelle fenêtre et garder la référence
    linkWindowRef = window.open(fullUrl, 'dimicall-link-window', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  }
};

/**
 * Valide si une chaîne est une URL valide
 * @param url - L'URL à valider
 * @returns true si l'URL est valide, false sinon
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }

  try {
    // Essayer de créer un objet URL pour valider
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};
