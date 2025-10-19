import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Contact, ContactStatus } from '../types';

// Configuration Supabase - À configurer via variables d'environnement ou interface utilisateur
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Logs de débogage pour la configuration
console.log('🔧 Configuration Supabase:');
console.log('URL:', SUPABASE_URL);
console.log('ANON_KEY présente:', SUPABASE_ANON_KEY ? 'Oui' : 'Non');
console.log('Variables d\'environnement disponibles:', Object.keys((import.meta as any).env || {}));

export interface SupabaseContact {
  id?: string;
  [key: string]: any; // Structure dynamique découverte à l'exécution
}

export interface RealtimeContactUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  contact: Contact;
  old_contact?: Contact;
}

class SupabaseService {
  private client!: SupabaseClient;
  private realtimeChannel: RealtimeChannel | null = null;
  private listeners: Array<(update: RealtimeContactUpdate) => void> = [];
  private isConfigured: boolean = false;
  private connectionTested: boolean = false;
  private discoveredColumns: string[] = [];

  constructor() {
    console.log('🔧 SupabaseService: Initialisation...');
    this.checkConfiguration();
  }

  private checkConfiguration() {
    console.log('🔧 SupabaseService: Vérification configuration...');
    
    const url = (import.meta as any).env?.VITE_SUPABASE_URL;
    const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    
    console.log('🔧 Variables détectées:', { 
      url: url ? `${url.substring(0, 20)}...` : 'undefined',
      anonKey: anonKey ? `${anonKey.substring(0, 20)}...` : 'undefined'
    });

    if (url && anonKey) {
      this.configure(url, anonKey);
    } else {
      console.log('❌ Configuration Supabase manquante');
    }
  }

  configure(url: string, anonKey: string) {
    console.log('🔧 Configuration Supabase:', { url: `${url.substring(0, 30)}...` });
    
    try {
      this.client = createClient(url, anonKey);
      this.isConfigured = true;
      console.log('✅ Client Supabase configuré');
    } catch (error) {
      console.error('❌ Erreur configuration client:', error);
      this.isConfigured = false;
    }
  }

  isReady(): boolean {
    return this.isConfigured && !!this.client;
  }

  async testConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    console.log('📡 Test de connexion Supabase...');
    
    if (!this.isReady()) {
      const error = 'Client Supabase non configuré';
      console.log('❌', error);
      return { success: false, error };
    }

    try {
      // Test simple : récupérer 1 enregistrement pour découvrir la structure
      console.log('🔄 Test avec table DimiTable...');
      const { data, error, count } = await this.client
        .from('DimiTable')
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        console.log('❌ Erreur Supabase:', error);
        return { 
          success: false, 
          error: `Erreur de chargement`, 
          details: {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          }
        };
      }

      // Découvrir les colonnes disponibles
      if (data && data.length > 0) {
        this.discoveredColumns = Object.keys(data[0]);
        console.log('✅ Colonnes découvertes:', this.discoveredColumns);
      }

      console.log('✅ Connexion Supabase réussie');
      console.log('📊 Statistiques:', { 
        totalCount: count, 
        sampleData: data?.length || 0,
        columns: this.discoveredColumns.length
      });

      this.connectionTested = true;
      return { 
        success: true, 
        details: { 
          totalCount: count, 
          sampleData: data?.length || 0,
          columns: this.discoveredColumns
        }
      };

    } catch (error: any) {
      console.log('❌ Exception lors du test:', error);
      return { 
        success: false, 
        error: `Erreur de connexion: ${error.message}`,
        details: error
      };
    }
  }

  initializeRealtime(tableName: string = 'DimiTable') {
    if (!this.isConfigured) {
      console.warn('⚠️ Supabase non configuré, impossible d\'initialiser le temps réel');
      return;
    }

    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }

    try {
      this.realtimeChannel = this.client
        .channel(`${tableName}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
          },
          (payload) => {
            console.log('📡 Changement temps réel reçu:', payload);
            
            try {
              const update: RealtimeContactUpdate = {
                type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                contact: this.mapSupabaseToContact(payload.new as any),
                old_contact: payload.old ? this.mapSupabaseToContact(payload.old as any) : undefined,
              };

              this.notifyListeners(update);
            } catch (error) {
              console.error('❌ Erreur lors du traitement du changement temps réel:', error);
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Statut de souscription temps réel:', status);
        });

      console.log(`✅ Temps réel initialisé pour la table ${tableName}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du temps réel:', error);
    }
  }

  onRealtimeUpdate(listener: (update: RealtimeContactUpdate) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(update: RealtimeContactUpdate) {
    this.listeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('❌ Erreur lors de la notification d\'un listener:', error);
      }
    });
  }

  async getContacts(page: number = 0, pageSize: number = 50, tableName: string = 'DimiTable'): Promise<{
    data: Contact[];
    totalCount: number;
    hasMore: boolean;
  }> {
    console.log('🔄 Récupération contacts:', { page, pageSize, tableName });

    if (!this.isReady()) {
      throw new Error('Service Supabase non configuré');
    }

    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Récupérer les données avec pagination
      const { data, error, count } = await this.client
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(from, to);

      if (error) {
        console.error('❌ Erreur récupération contacts:', error);
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      console.log('✅ Contacts récupérés:', { 
        count: data?.length || 0, 
        totalCount: count,
        page: page + 1
      });

      // Mapper les données Supabase vers le format Contact
      const contacts = (data || []).map((item, index) => this.mapSupabaseToContact(item, from + index));

      return {
        data: contacts,
        totalCount: count || 0,
        hasMore: (count || 0) > to + 1
      };

    } catch (error: any) {
      console.error('❌ Exception getContacts:', error);
      throw error;
    }
  }

  async createContact(contact: Omit<Contact, 'id' | 'numeroLigne'>, tableName: string = 'DimiTable'): Promise<Contact> {
    if (!this.isConfigured) {
      throw new Error('Supabase non configuré');
    }

    try {
      console.log('🔄 Création d\'un nouveau contact');
      
      const supabaseContact = this.mapContactToSupabase({
        ...contact,
        id: '', // Sera généré par Supabase
        numeroLigne: 0 // Sera calculé
      } as Contact);
      
      const { data, error } = await this.client
        .from(tableName)
        .insert([supabaseContact])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création:', error);
        throw error;
      }

      const newContact = this.mapSupabaseToContact(data);
      console.log('✅ Contact créé avec succès:', newContact.id);
      
      return newContact;
    } catch (error) {
      console.error('❌ Erreur lors de la création du contact:', error);
      throw error;
    }
  }

  async updateContact(id: string, updates: Partial<Contact>, tableName: string = 'DimiTable'): Promise<Contact> {
    if (!this.isConfigured) {
      throw new Error('Supabase non configuré');
    }

    try {
      console.log(`🔄 Mise à jour du contact ${id}`);
      
      const supabaseUpdates = this.mapContactToSupabase({
        id,
        ...updates
      } as Contact);

      const { data, error } = await this.client
        .from(tableName)
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
        throw error;
      }

      const updatedContact = this.mapSupabaseToContact(data);
      console.log('✅ Contact mis à jour avec succès');
      
      return updatedContact;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du contact:', error);
      throw error;
    }
  }

  async deleteContact(id: string, tableName: string = 'DimiTable'): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Supabase non configuré');
    }

    try {
      const { error } = await this.client
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression du contact:', error);
      throw error;
    }
  }

  async searchContacts(query: string, column?: string, tableName: string = 'DimiTable'): Promise<Contact[]> {
    if (!this.isConfigured) {
      throw new Error('Supabase non configuré');
    }

    try {
      let queryBuilder = this.client.from(tableName).select('*');

      if (column) {
        queryBuilder = queryBuilder.ilike(column, `%${query}%`);
      } else {
        queryBuilder = queryBuilder.or(
          `prenom.ilike.%${query}%,nom.ilike.%${query}%,telephone.ilike.%${query}%,email.ilike.%${query}%`
        );
      }

      const { data, error } = await queryBuilder.limit(100);

      if (error) throw error;

      return (data || []).map(this.mapSupabaseToContact);
    } catch (error) {
      console.error('Erreur lors de la recherche de contacts:', error);
      throw error;
    }
  }

  async bulkImportContacts(contacts: Omit<Contact, 'id' | 'numeroLigne'>[], tableName: string = 'DimiTable'): Promise<Contact[]> {
    if (!this.isConfigured) {
      throw new Error('Supabase non configuré');
    }

    try {
      const supabaseContacts = contacts.map((contact, index) => 
        this.mapContactToSupabase({
          ...contact,
          id: '', // Sera généré par Supabase
          numeroLigne: index + 1
        } as Contact)
      );
      
      const { data, error } = await this.client
        .from(tableName)
        .insert(supabaseContacts)
        .select();

      if (error) throw error;

      return (data || []).map(this.mapSupabaseToContact);
    } catch (error) {
      console.error('Erreur lors de l\'import en masse:', error);
      throw error;
    }
  }

  async broadcastCallStateChange(contactId: string, isActive: boolean, duration?: string) {
    if (!this.isConfigured || !this.realtimeChannel) {
      return;
    }

    try {
      await this.realtimeChannel.send({
        type: 'broadcast',
        event: 'call_state_change',
        payload: {
          contactId,
          isActive,
          duration,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la diffusion du changement d\'état d\'appel:', error);
    }
  }

  private mapSupabaseToContact(supabaseContact: SupabaseContact, numeroLigne: number = 0): Contact {
    // Mapping intelligent basé sur les colonnes découvertes
    const contact: Contact = {
      id: supabaseContact.UID || supabaseContact.id || `supabase_${numeroLigne}`,
      numeroLigne,
      prenom: this.getFieldValue(supabaseContact, ['prenom', 'Prenom', 'PRENOM']) || '',
      nom: this.getFieldValue(supabaseContact, ['nom', 'Nom', 'NOM']) || '',
      telephone: this.getFieldValue(supabaseContact, ['numero', 'telephone', 'Telephone', 'TELEPHONE']) || '',
      email: this.getFieldValue(supabaseContact, ['mail', 'email', 'Email', 'EMAIL']) || '',
      ecole: this.getFieldValue(supabaseContact, ['source', 'ecole', 'Source', 'ECOLE']) || '',
      statut: this.mapStatutFromSupabase(supabaseContact),
      commentaire: this.getFieldValue(supabaseContact, ['commentaires_appel_1', 'commentaire', 'Commentaire']) || '',
      dateRappel: this.getFieldValue(supabaseContact, ['date_rappel', 'dateRappel']) || '',
      heureRappel: this.getFieldValue(supabaseContact, ['heure_rappel', 'heureRappel']) || '',
      dateRDV: this.getFieldValue(supabaseContact, ['date_rdv', 'dateRDV']) || '',
      heureRDV: this.getFieldValue(supabaseContact, ['heure_rdv', 'heureRDV']) || '',
      dateAppel: this.getFieldValue(supabaseContact, ['date_appel_1', 'date_appel', 'dateAppel']) || '',
      heureAppel: this.getFieldValue(supabaseContact, ['heure_appel', 'heureAppel']) || '',
      dureeAppel: this.getFieldValue(supabaseContact, ['duree_appel', 'dureeAppel']) || '',
      uid_supabase: supabaseContact.UID || supabaseContact.id || undefined
    };

    return contact;
  }

  private mapStatutFromSupabase(supabaseContact: SupabaseContact): ContactStatus {
    const statutFinal = this.getFieldValue(supabaseContact, ['statut_final', 'statut', 'Statut']);
    const statutAppel = this.getFieldValue(supabaseContact, ['statut_appel_1', 'statut_appel']);
    
    // Utiliser le statut final en priorité, sinon le statut d'appel
    const statut = statutFinal || statutAppel || 'Non défini';
    
    // Mapper les statuts Supabase vers les statuts de l'application
    const statutMapping: Record<string, ContactStatus> = {
      'Non défini': ContactStatus.NonDefini,
      'Mauvais num': ContactStatus.MauvaisNum,
      'Répondeur': ContactStatus.Repondeur,
      'À rappeler': ContactStatus.ARappeler,
      'Pas intéressé': ContactStatus.PasInteresse,
      'Argumenté': ContactStatus.Argumente,
      'D0': ContactStatus.D0,
      'R0': ContactStatus.R0,
      'Liste noire': ContactStatus.ListeNoire,
      'Prématuré': ContactStatus.Premature,
    };
    
    return statutMapping[statut] || ContactStatus.NonDefini;
  }

  private getFieldValue(obj: any, possibleKeys: string[]): any {
    for (const key of possibleKeys) {
      if (obj.hasOwnProperty(key) && obj[key] !== null && obj[key] !== undefined) {
        return obj[key];
      }
    }
    return null;
  }

  private mapContactToSupabase(contact: Contact): Partial<SupabaseContact> {
    // Mapping inverse - utilise les colonnes découvertes si disponibles
    const supabaseContact: Partial<SupabaseContact> = {};

    // Champs de base toujours mappés
    if (contact.prenom) supabaseContact.prenom = contact.prenom;
    if (contact.nom) supabaseContact.nom = contact.nom;
    if (contact.telephone) supabaseContact.telephone = contact.telephone;
    if (contact.email) supabaseContact.email = contact.email;
    if (contact.ecole) supabaseContact.source = contact.ecole;
    if (contact.statut) supabaseContact.statut = contact.statut;
    if (contact.commentaire) supabaseContact.commentaire = contact.commentaire;

    // Champs optionnels
    if (contact.dateRappel) supabaseContact.date_rappel = contact.dateRappel;
    if (contact.heureRappel) supabaseContact.heure_rappel = contact.heureRappel;
    if (contact.dateRDV) supabaseContact.date_rdv = contact.dateRDV;
    if (contact.heureRDV) supabaseContact.heure_rdv = contact.heureRDV;
    if (contact.dateAppel) supabaseContact.date_appel = contact.dateAppel;
    if (contact.heureAppel) supabaseContact.heure_appel = contact.heureAppel;
    if (contact.dureeAppel) supabaseContact.duree_appel = contact.dureeAppel;

    return supabaseContact;
  }

  cleanup() {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
    this.listeners = [];
  }
}

// Instance singleton
export const supabaseService = new SupabaseService(); 