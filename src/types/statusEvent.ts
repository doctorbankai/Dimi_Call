export interface StatusEventRecord {
  id: number;
  contact_id?: string | null;
  old_status?: string | null;
  new_status?: string | null;
  newStatus?: string | null;
  applied_at?: string | null;
  prenom?: string | null;
  nom?: string | null;
  telephone?: string | null;
  email?: string | null;
  mail?: string | null;
  commentaire?: string | null;
  comment?: string | null;
  dateRappel?: string | null;
  heureRappel?: string | null;
  dateRDV?: string | null;
  heureRDV?: string | null;
  dateAppel?: string | null;
  heureAppel?: string | null;
  dureeAppel?: string | null;
  dateEntree?: string | null;
  heureEntree?: string | null;
}
