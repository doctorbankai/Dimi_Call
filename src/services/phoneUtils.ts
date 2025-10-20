const PHONE_REGEX = /(?:\+\d{1,3}[\s.-]*)?(?:\(0\)[\s.-]*)?\d(?:[\s.-]*\d){5,14}/g

export const extractPhoneCandidates = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.flatMap(extractPhoneCandidates)
  }
  let str = String(value)
  if (!str.trim()) return []

  // Nettoyage des formats fréquents
  str = str
    .replace(/Tél\.?/gi, ' ')
    .replace(/Téléphone/gi, ' ')
    .replace(/\s+/g, ' ')

  const matches = str.match(PHONE_REGEX)
  if (!matches) return []

  return matches.map((match) => match.replace(/[^0-9+]/g, '')).filter(Boolean)
}

/**
 * Normalise un numéro de téléphone pour la comparaison avec Supabase
 * Convertit tous les formats vers le format international normalisé : +33XXXXXXXXX (sans espaces)
 * 
 * Exemples:
 * - "695905812" -> "+33695905812"
 * - "06 95 90 58 12" -> "+33695905812"
 * - "+33 6 95 90 58 12" -> "+33695905812"
 * - "0695905812" -> "+33695905812"
 * 
 * @param phoneStr - Le numéro de téléphone à normaliser
 * @returns Le numéro normalisé au format +33XXXXXXXXX ou une chaîne vide si invalide
 */
export const normalizePhoneNumber = (phoneStr: string | undefined | null): string => {
  if (!phoneStr || typeof phoneStr !== 'string') return '';
  
  // Nettoyer tous les caractères sauf les chiffres et le +
  let cleaned = phoneStr.replace(/[^\d+]/g, '');
  
  if (!cleaned) return '';

  // Cas 1: Commence par +33 (déjà au bon format de base)
  if (cleaned.startsWith('+33')) {
    // Supprimer le 0 après +33 si présent (+330 -> +33)
    cleaned = cleaned.replace(/^\+330/, '+33');
    // Garder seulement +33 suivi de 9 chiffres
    const match = cleaned.match(/^\+33(\d{9})/);
    return match ? `+33${match[1]}` : '';
  }

  // Cas 2: Commence par 33 (sans +)
  if (cleaned.startsWith('33') && cleaned.length >= 11) {
    const digits = cleaned.substring(2);
    // Prendre les 9 premiers chiffres après 33
    const match = digits.match(/^(\d{9})/);
    return match ? `+33${match[1]}` : '';
  }

  // Cas 3: Commence par 0 (format français local)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Retirer le 0 initial et ajouter +33
    const digits = cleaned.substring(1);
    return `+33${digits}`;
  }

  // Cas 4: 9 chiffres sans préfixe (format mobile/fixe sans le 0)
  if (cleaned.length === 9 && /^[1-9]/.test(cleaned)) {
    return `+33${cleaned}`;
  }

  // Cas 5: Formats malformés courants
  // +033XXXXXXXXX -> +33XXXXXXXXX
  if (cleaned.startsWith('+033')) {
    const digits = cleaned.substring(4);
    const match = digits.match(/^(\d{9})/);
    return match ? `+33${match[1]}` : '';
  }

  // Cas 6: 00 33 XXXXXXXXX (format international alternatif)
  if (cleaned.startsWith('0033')) {
    const digits = cleaned.substring(4);
    const match = digits.match(/^(\d{9})/);
    return match ? `+33${match[1]}` : '';
  }

  // Si aucun format reconnu, retourner vide
  console.warn(`[normalizePhoneNumber] Format non reconnu: "${phoneStr}" -> "${cleaned}"`);
  return '';
}

