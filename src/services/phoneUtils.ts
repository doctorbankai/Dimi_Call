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

