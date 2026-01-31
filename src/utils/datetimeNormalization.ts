const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30)
const DAY_IN_MS = 24 * 60 * 60 * 1000
const MINUTES_PER_DAY = 24 * 60

const pad2 = (value: number): string => value.toString().padStart(2, '0')

const isValidDateParts = (year: number, month: number, day: number): boolean => {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return false
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false
  }
  const candidate = new Date(Date.UTC(year, month - 1, day))
  return candidate.getUTCFullYear() === year && candidate.getUTCMonth() + 1 === month && candidate.getUTCDate() === day
}

const buildIsoDate = (year: number, month: number, day: number): string | null => {
  if (!isValidDateParts(year, month, day)) {
    return null
  }
  return `${year.toString().padStart(4, '0')}-${pad2(month)}-${pad2(day)}`
}

const excelSerialToIsoDate = (serial: number): string | null => {
  if (!Number.isFinite(serial) || serial <= 0 || serial > 100000) {
    return null
  }
  const days = Math.floor(serial)
  const date = new Date(EXCEL_EPOCH_MS + days * DAY_IN_MS)
  return buildIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

const normalizeMinutesToTime = (totalMinutes: number): string | null => {
  if (!Number.isFinite(totalMinutes)) {
    return null
  }
  let minutes = Math.round(totalMinutes)
  if (minutes < 0) {
    return null
  }
  minutes %= MINUTES_PER_DAY
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${pad2(hours)}:${pad2(mins)}`
}

const excelSerialToTime = (serial: number): string | null => {
  if (!Number.isFinite(serial)) {
    return null
  }

  if (serial >= 1 && serial < 24) {
    const hours = Math.floor(serial)
    const minutes = Math.round((serial - hours) * 60)
    return normalizeMinutesToTime(hours * 60 + minutes)
  }

  if (serial >= 0 && serial < 1) {
    const totalMinutes = serial * MINUTES_PER_DAY
    return normalizeMinutesToTime(totalMinutes)
  }

  if (serial >= 24) {
    const wrapped = serial % 24
    return excelSerialToTime(wrapped)
  }

  return null
}

export const normalizeIsoDate = (raw: unknown): string | null => {
  if (raw === null || raw === undefined) {
    return null
  }

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return buildIsoDate(raw.getFullYear(), raw.getMonth() + 1, raw.getDate())
  }

  const trimmed = String(raw).trim()
  if (!trimmed) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  const isoWithTime = trimmed.match(/^(\d{4}-\d{2}-\d{2})[ T]/)
  if (isoWithTime) {
    return isoWithTime[1]
  }

  const numericCandidate = trimmed.replace(',', '.')
  if (/^\d+(\.\d+)?$/.test(numericCandidate)) {
    const serial = Number(numericCandidate)
    const fromSerial = excelSerialToIsoDate(serial)
    if (fromSerial) {
      return fromSerial
    }
  }

  const dateMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/)
  if (dateMatch) {
    const part1 = Number(dateMatch[1])
    const part2 = Number(dateMatch[2])
    let year = Number(dateMatch[3])
    if (dateMatch[3].length === 2) {
      year += year >= 70 ? 1900 : 2000
    }

    let month: number
    let day: number

    if (part1 > 12 && part2 <= 12) {
      day = part1
      month = part2
    } else if (part2 > 12 && part1 <= 12) {
      month = part1
      day = part2
    } else {
      // Cas ambigu (les deux <= 12) : on privilégie le format français JJ/MM
      day = part1
      month = part2
    }

    const iso = buildIsoDate(year, month, day)
    if (iso) {
      return iso
    }
  }

  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    return buildIsoDate(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate())
  }

  return null
}

export const normalizeTime24hValue = (raw: unknown): string | null => {
  if (raw === null || raw === undefined) {
    return null
  }

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return `${pad2(raw.getHours())}:${pad2(raw.getMinutes())}`
  }

  const trimmed = String(raw).trim()
  if (!trimmed) {
    return null
  }

  const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (timeMatch) {
    let hours = Number(timeMatch[1])
    let minutes = Number(timeMatch[2])
    const seconds = Number(timeMatch[3] ?? '0')

    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 99) {
      return null
    }

    if (seconds >= 30) {
      minutes += 1
    }

    return normalizeMinutesToTime(hours * 60 + minutes)
  }

  const frenchFormat = trimmed.match(/^(\d{1,2})h(\d{2})$/i)
  if (frenchFormat) {
    const hours = Number(frenchFormat[1])
    const minutes = Number(frenchFormat[2])
    return normalizeMinutesToTime(hours * 60 + minutes)
  }

  const ampmMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*([AP])\.?M\.?$/i)
  if (ampmMatch) {
    let hours = Number(ampmMatch[1])
    const minutes = Number(ampmMatch[2] ?? '0')
    const seconds = Number(ampmMatch[3] ?? '0')
    const period = ampmMatch[4].toUpperCase()

    if (hours === 12) {
      hours = 0
    }
    if (period === 'P') {
      hours += 12
    }

    const totalMinutes = hours * 60 + minutes + (seconds >= 30 ? 1 : 0)
    return normalizeMinutesToTime(totalMinutes)
  }

  const numericCandidate = trimmed.replace(',', '.')
  if (/^\d+(\.\d+)?$/.test(numericCandidate)) {
    const numeric = Number(numericCandidate)
    const fromExcel = excelSerialToTime(numeric)
    if (fromExcel) {
      return fromExcel
    }
    if (numeric >= 0 && numeric < 24) {
      const hours = Math.floor(numeric)
      const minutes = Math.round((numeric - hours) * 60)
      return normalizeMinutesToTime(hours * 60 + minutes)
    }
  }

  return null
}

export const normalizeDurationMmSs = (raw: unknown): string | null => {
  if (raw === null || raw === undefined) {
    return null
  }

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return `${pad2(raw.getMinutes())}:${pad2(raw.getSeconds())}`
  }

  const trimmed = String(raw).trim()
  if (!trimmed) {
    return null
  }

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const totalSeconds = Math.max(0, Math.round(Number(trimmed)))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${pad2(seconds)}`
  }

  const hmsMatch = trimmed.match(/^(\d{1,3}):(\d{2})(?::(\d{2}))?$/)
  if (hmsMatch) {
    const part1 = Number(hmsMatch[1])
    const part2 = Number(hmsMatch[2])
    const part3 = hmsMatch[3] ? Number(hmsMatch[3]) : undefined
    let totalSeconds = 0
    if (part3 !== undefined) {
      totalSeconds = part1 * 3600 + part2 * 60 + part3
    } else {
      totalSeconds = part1 * 60 + part2
    }
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${pad2(seconds)}`
  }

  return null
}

export const normalizeIsoDateTime = (raw: unknown): string | null => {
  if (raw === null || raw === undefined) {
    return null
  }

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString()
  }

  const trimmed = String(raw).trim()
  if (!trimmed) {
    return null
  }

  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)(Z|[+-]\d{2}:\d{2})?$/)
  if (!match) {
    return null
  }
  const [, datePart, timePart, zonePart] = match
  const isoCandidate = `${datePart}T${timePart}${zonePart ?? 'Z'}`
  const parsed = new Date(isoCandidate)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed.toISOString()
}


