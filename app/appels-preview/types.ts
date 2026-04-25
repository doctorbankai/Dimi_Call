export interface Contact {
  id: string
  prenom: string
  nom: string
  telephone: string
  email: string
  source: string
  type: string
  statut: ContactStatus
  dateRappel?: string
  heureRappel?: string
  dateRDV?: string
  heureRDV?: string
  notes: string
}

export enum ContactStatus {
  NonDefini = "non_defini",
  Interesse = "interesse",
  PasInteresse = "pas_interesse",
  Rappeler = "rappeler",
  RDV = "rdv",
  Absent = "absent",
  Injoignable = "injoignable",
}

export const statusConfig: Record<ContactStatus, { label: string; color: string }> = {
  [ContactStatus.NonDefini]: { label: "Non défini", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  [ContactStatus.Interesse]: { label: "Intéressé", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  [ContactStatus.PasInteresse]: { label: "Pas intéressé", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  [ContactStatus.Rappeler]: { label: "Rappeler", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  [ContactStatus.RDV]: { label: "RDV", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  [ContactStatus.Absent]: { label: "Absent", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  [ContactStatus.Injoignable]: { label: "Injoignable", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
}

export type ViewMode = "cards" | "table"
