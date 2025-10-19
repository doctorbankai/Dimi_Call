import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Contact, ContactStatus } from '../types';

// Configuration Supabase - À configurer via variables d'environnement ou interface utilisateur
const DEFAULT_SUPABASE_URL = 'https://oqnagwoqlhqtnhfiakom.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xbmFnd29xbGhxdG5oZmlha29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTY5MzAsImV4cCI6MjA2NDk5MjkzMH0.8IjJYZRT9B8PRsP40S7-wvY2achfwoZ6NEaZSFNHRgY';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;



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
  
  // Getter pour accéder au client Supabase depuis d'autres services
  getClient(): SupabaseClient {
    if (!this.isReady()) {
      throw new Error('Client Supabase non configuré');
    }
    return this.client;
  }
  private realtimeChannel: RealtimeChannel | null = null;
  private listeners: Array<(update: RealtimeContactUpdate) => void> = [];
  private isConfigured: boolean = false;
  private connectionTested: boolean = false;
  private discoveredColumns: string[] = [];
  private currentUrl: string = '';
  private currentKey: string = '';
  private idColumnName: string = 'id'; // Nom de la colonne d'identité détectée

  constructor() {
    this.bootstrapConfiguration();
  }

  private bootstrapConfiguration() {
    const stored = this.loadConfigFromStorage();
    if (stored.url && stored.key) {
      this.configure(stored.url, stored.key);
      return;
    }

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      this.configure(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }

  private loadConfigFromStorage(): { url: string; key: string } {
    try {
      const config = localStorage.getItem('supabase_config');
      if (config) {
        const parsed = JSON.parse(config);
        return {
          url: parsed.url || '',
          key: parsed.anon_key || ''
        };
      }
    } catch (error) {
      // Configuration non trouvée
    }
    return { url: '', key: '' };
  }

  private saveConfigToStorage(url: string, key: string) {
    try {
      const config = { url, anon_key: key };
      localStorage.setItem('supabase_config', JSON.stringify(config));
    } catch (error) {
      console.error('❌ Erreur sauvegarde configuration:', error);
    }
  }

  // Nouvelle méthode pour configuration manuelle (comme dans l'ancienne app)
  configureManually(url: string, anonKey: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        this.configure(url, anonKey);
        
        // Tester la connexion
        this.testConnection().then((result) => {
          if (result.success) {
            // Sauvegarder la configuration si elle fonctionne
            this.saveConfigToStorage(url, anonKey);
            resolve({ success: true });
          } else {
            resolve({ success: false, error: result.error });
          }
        }).catch((error) => {
          resolve({ success: false, error: error.message });
        });
        
      } catch (error: any) {
        resolve({ success: false, error: error.message });
      }
    });
  }

  configure(url: string, anonKey: string) {
    if (!url || !anonKey) {
      console.warn('⚠️ Configuration Supabase incomplète')
      this.isConfigured = false
      this.client = undefined as any
      this.currentUrl = ''
      this.currentKey = ''
      return
    }

    try {
      this.client = createClient(url, anonKey)
      this.isConfigured = true
      this.currentUrl = url
      this.currentKey = anonKey
    } catch (error) {
      console.error('❌ Erreur configuration client:', error)
      this.isConfigured = false
      this.client = undefined as any
    }
  }

  isReady(): boolean {
    return this.isConfigured && !!this.client
  }

  ensureConfigured(): boolean {
    if (this.isReady()) return true

    this.bootstrapConfiguration()
    return this.isReady()
  }

  getConnectionInfo(): { url: string; configured: boolean } {
    return {
      url: this.currentUrl,
      configured: this.isConfigured
    };
  }

  async testConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    console.log('📡 Test de connexion Supabase...');
    
    if (!this.ensureConfigured()) {
      const error = 'Client Supabase non configuré';
      console.log('❌', error);
      return { success: false, error };
    }

    try {
      const tablesToProbe: Array<{ name: string; fallbackColumns?: string[] }> = [
        { name: 'DimiTable', fallbackColumns: ['id', 'contact_id', 'new_status', 'applied_at'] },
        { name: 'shared_phone_numbers', fallbackColumns: ['id', 'phone_number', 'normalized_phone', 'metadata'] },
        { name: 'shared_blacklist_numbers', fallbackColumns: ['id', 'phone_number', 'normalized_phone', 'reason', 'metadata'] },
      ];

      let lastError: any = null;
      let permissionDenied = false;

      for (const table of tablesToProbe) {
        console.log(`🔄 Test avec table ${table.name}...`);
        const { data, error, count } = await this.client
          .from(table.name)
          .select('*', { count: 'exact' })
          .limit(1);

        if (error) {
          lastError = error;
          if (error.code === '42501' || error.code === 'PGRST301') {
            // Permission denied (RLS). Continuer avec une table alternative.
            permissionDenied = true;
            console.warn(`⚠️ Accès restreint à ${table.name} (RLS). Tentative avec une autre table...`, error);
            continue;
          }
          console.log('❌ Erreur Supabase:', error);
          break;
        }

        // Découvrir les colonnes disponibles
        if (data && data.length > 0) {
          this.discoveredColumns = Object.keys(data[0]);
        } else if (table.fallbackColumns) {
          this.discoveredColumns = table.fallbackColumns;
        } else {
          this.discoveredColumns = [];
        }
        console.log('✅ Colonnes découvertes:', this.discoveredColumns);

        console.log('✅ Connexion Supabase réussie');
        console.log('📊 Statistiques:', {
          tableTested: table.name,
          totalCount: count,
          sampleData: data?.length || 0,
          columns: this.discoveredColumns.length,
        });

        this.connectionTested = true;
        return {
          success: true,
          details: {
            tableTested: table.name,
            totalCount: count,
            sampleData: data?.length || 0,
            columns: this.discoveredColumns,
            limitedAccess: permissionDenied,
          },
        };
      }

      if (permissionDenied && !lastError) {
        // Nous avons uniquement rencontré des refus d'accès mais aucune erreur critique
        this.connectionTested = true;
        return {
          success: true,
          details: {
            tableTested: null,
            limitedAccess: true,
          },
        };
      }

      const errorDetails = lastError
        ? {
            code: lastError.code,
            message: lastError.message,
            details: lastError.details,
            hint: lastError.hint,
          }
        : undefined;

      return {
        success: false,
        error: lastError?.message || 'Erreur de chargement',
        details: errorDetails,
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

    if (!this.isConfigured) {
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

  async getRawSupabaseData(page: number = 0, pageSize: number = 1000, tableName: string = 'DimiTable'): Promise<{
    data: any[];
    totalCount: number;
    columns: string[];
    hasMore: boolean;
  }> {
    this.checkConfiguration();
    
    try {
      console.log(`🔍 getRawSupabaseData: Début de la requête - page=${page}, pageSize=${pageSize}, tableName=${tableName}`);
      
      const startRange = page * pageSize;
      const endRange = startRange + pageSize - 1;
      
      console.log(`📊 getRawSupabaseData: Range demandé - startRange=${startRange}, endRange=${endRange}`);
      
      // Test simple d'abord sans range pour voir si on peut récupérer des données
      if (page === 0) {
        console.log('🧪 Test simple sans range pour vérifier la connectivité...');
        const testQuery = await this.client
          .from(tableName)
          .select('*')
          .limit(5);
          
        console.log('🧪 Résultat test simple:', {
          data: testQuery.data ? `${testQuery.data.length} éléments` : 'null',
          error: testQuery.error ? testQuery.error.message : 'null'
        });
        
        if (testQuery.error) {
          console.error('❌ Erreur dans le test simple:', testQuery.error);
          throw testQuery.error;
        }
        
        if (testQuery.data && testQuery.data.length > 0) {
          console.log('🧪 Premier enregistrement du test:', testQuery.data[0]);
        }
      }
      
      // Requête principale avec range
      console.log('📡 Exécution de la requête principale avec range...');
      const { data, error, count } = await this.client
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(startRange, endRange);

      console.log(`📊 getRawSupabaseData: Résultat Supabase:`, {
        data: data ? `${data.length} éléments` : 'null',
        error: error ? error.message : 'null',
        count: count,
        startRange,
        endRange
      });

      if (error) {
        console.error('❌ getRawSupabaseData: Erreur Supabase:', error);
        console.error('❌ Détails de l\'erreur:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (!data) {
        console.warn('⚠️ getRawSupabaseData: data est null');
        return {
          data: [],
          totalCount: count || 0,
          columns: this.discoveredColumns,
          hasMore: false
        };
      }

      console.log(`✅ getRawSupabaseData: ${data.length} enregistrements récupérés`);
      
      if (data.length > 0) {
        console.log(`🔍 getRawSupabaseData: Premier enregistrement:`, data[0]);
        console.log(`🔍 getRawSupabaseData: Clés du premier enregistrement:`, Object.keys(data[0]));
        
        // Découvrir les colonnes depuis le premier enregistrement
        if (this.discoveredColumns.length === 0) {
          this.discoveredColumns = Object.keys(data[0]);
          console.log(`📋 getRawSupabaseData: Colonnes découvertes:`, this.discoveredColumns);
          
          // Détecter la colonne d'identité
          this.detectIdColumn();
        }
      } else {
        console.warn('⚠️ getRawSupabaseData: Aucun enregistrement dans la réponse');
      }

      const hasMore = count ? (startRange + data.length) < count : false;
      
      console.log(`📊 getRawSupabaseData: Résultat final:`, {
        dataLength: data.length,
        totalCount: count,
        columnsLength: this.discoveredColumns.length,
        hasMore,
        nextStartRange: hasMore ? startRange + data.length : 'N/A'
      });

      return {
        data: data,
        totalCount: count || 0,
        columns: this.discoveredColumns,
        hasMore
      };

    } catch (error) {
      console.error('❌ getRawSupabaseData: Erreur complète:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
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
      console.log('🔄 Mise à jour du contact:', { id, updates });
      console.log('📊 Colonnes découvertes:', this.discoveredColumns);
      
      // S'assurer que les colonnes sont découvertes
      if (this.discoveredColumns.length === 0) {
        console.log('⚠️ Colonnes non découvertes, tentative de récupération...');
        try {
          await this.getRawSupabaseData(0, 1, tableName);
          console.log('✅ Colonnes découvertes:', this.discoveredColumns);
        } catch (discoverError) {
          console.warn('⚠️ Impossible de découvrir les colonnes:', discoverError);
          // Continue sans découverte de colonnes
        }
      } else {
        console.log('✅ Colonnes déjà découvertes:', this.discoveredColumns.length, 'colonnes');
      }
      
      // Mapper les updates vers le format Supabase
      const supabaseUpdates = this.mapContactToSupabase({
        id,
        ...updates
      } as Contact);

      // Ne pas inclure l'ID dans les updates
      delete supabaseUpdates.id;
      delete supabaseUpdates.UID;

      // Supprimer les champs undefined, null ou vides ET valider les colonnes
      const cleanUpdates = Object.fromEntries(
        Object.entries(supabaseUpdates).filter(([key, value]) => {
          // Garder les valeurs false et 0, mais exclure undefined, null et chaînes vides
          if (value === undefined || value === null) return false;
          if (typeof value === 'string' && value.trim() === '') return false;
          
          // Valider que la colonne existe (seulement si on a découvert des colonnes)
          if (this.discoveredColumns.length > 0 && !this.validateColumn(key)) {
            console.warn(`⚠️ Colonne '${key}' non trouvée dans la table, ignorée`);
            return false;
          }
          
          return true;
        })
      );

      console.log('📝 Updates Supabase avant nettoyage:', supabaseUpdates);
      console.log('📝 Updates Supabase nettoyés:', cleanUpdates);

      // Vérifier qu'il y a des données à mettre à jour
      if (Object.keys(cleanUpdates).length === 0) {
        console.warn('⚠️ Le nettoyage des données a résulté en un objet de mise à jour vide. Aucune requête UPDATE ne sera envoyée.', {
            originalUpdates: updates,
            mappedSupabase: supabaseUpdates
        });
        
        // Puisque rien n'a été mis à jour, nous pouvons considérer l'opération comme "réussie" mais sans effet.
        // On relit le contact pour s'assurer qu'il est toujours là et on le retourne.
        const { data: existingData, error: fetchError } = await this.client
          .from(tableName)
          .select('*')
          .eq(this.idColumnName, id)
          .single();

        if (fetchError) {
            console.error(`❌ Erreur en tentant de relire le contact ${id} après une mise à jour vide.`, fetchError);
            throw fetchError;
        }
        if (!existingData) throw new Error(`Contact avec l'ID ${id} non trouvé après une tentative de mise à jour vide.`);

        console.log('✅ Opération terminée sans mise à jour, retour du contact existant.');
        return this.mapSupabaseToContact(existingData);
      }

      console.log(`🚀 Envoi de la requête UPDATE vers ${tableName} pour ID ${id}`);
      console.log('🔍 Validation avant envoi:', {
        targetTable: tableName,
        targetId: id,
        updateKeys: Object.keys(cleanUpdates),
        updateValues: cleanUpdates,
        clientUrl: this.currentUrl,
        columnValidation: Object.keys(cleanUpdates).map(key => ({
          column: key,
          isValid: this.validateColumn(key),
          inDiscovered: this.discoveredColumns.includes(key)
        }))
      });

      // Test de la table et vérification de l'existence de l'enregistrement
      try {
        console.log(`🔍 Test de connectivité et vérification de l'enregistrement...`);
        console.log(`   - Table: ${tableName}`);
        console.log(`   - Colonne d'identité: ${this.idColumnName}`);
        console.log(`   - ID recherché: ${id}`);
        
        const testResult = await this.client
          .from(tableName)
          .select(this.idColumnName)
          .eq(this.idColumnName, id)
          .maybeSingle();
        
        if (testResult.error) {
          console.error('❌ Erreur lors du test de connectivité:', testResult.error);
          throw new Error(`Problème de connectivité avec la table ${tableName}: ${testResult.error.message}`);
        }

        if (!testResult.data) {
          console.warn('⚠️ L\'enregistrement avec l\'ID spécifié n\'existe pas:', {
            id,
            idColumn: this.idColumnName,
            table: tableName,
            url: `${this.currentUrl}/rest/v1/${tableName}?${this.idColumnName}=eq.${id}`
          });
          
          // Essayer de lister quelques enregistrements pour débugger
          console.log('🔍 Listage des premiers enregistrements pour débugger...');
          const debugResult = await this.client
            .from(tableName)
            .select(`${this.idColumnName}`)
            .limit(5);
          
          if (debugResult.data) {
            console.log('📋 Échantillon d\'IDs existants:', debugResult.data.map((r: any) => r[this.idColumnName]));
          }
          
          throw new Error(`Aucun enregistrement trouvé avec l'ID ${id} dans la colonne ${this.idColumnName}`);
        }
        
        console.log('✅ Enregistrement trouvé, poursuite de la mise à jour');
      } catch (testError) {
        console.error('❌ Test de pré-vérification échoué:', testError);
        throw testError;
      }

      console.log(`🔄 Mise à jour avec colonne d'identité: ${this.idColumnName} = ${id}`);
      // Logging détaillé de la requête
      console.log('ACTION: UPDATE', {
        table: tableName,
        idColumn: this.idColumnName,
        id: id,
        updates: cleanUpdates,
      });

      // Étape 1: Exécuter la mise à jour sans .select() pour isoler l'opération d'écriture.
      const { error: updateError, count: updateCount } = await this.client
        .from(tableName)
        .update(cleanUpdates)
        .eq(this.idColumnName, id);
      
      console.log('📊 Résultat de l\'Étape 1 (UPDATE):', { updateError, updateCount });

      if (updateError) {
        console.error('❌ Échec de l\'Étape 1: UPDATE a échoué.', {
          message: updateError.message,
          details: updateError.details,
          code: updateError.code,
        });
        
        if (updateError.message.includes('406')) {
          console.error("🚨 L'erreur 406 s'est produite pendant l'UPDATE. C'est inhabituel. Vérifiez les RLS et les headers.");
        }
        throw updateError;
      }

      // Vérification critique du updateCount
      if (updateCount === null || updateCount === 0) {
        console.warn('⚠️ updateCount est null/0, mais cela peut être normal avec Supabase', {
          updateCount,
          updateError: updateError ? String(updateError) : 'none',
          updateId: id,
          updateObject: updates
        });
        
        // Si pas d'erreur SQL ET updateCount null (comportement normal Supabase)
        if (!updateError && updateCount === null) {
          console.log('✅ Pas d\'erreur SQL - updateCount null est acceptable avec Supabase');
          // Continuons vers l'étape 2 pour vérifier si la modification a eu lieu
        } else if (updateCount === 0) {
          // updateCount = 0 signifie vraiment aucune ligne modifiée
          throw new Error(`Aucune ligne modifiée - Vérifiez les politiques RLS UPDATE (updateCount: ${updateCount}). ` +
            'Causes possibles: ID inexistant, politiques RLS restrictives, ou objet de mise à jour vide.');
        }
      } else {
        console.log(`✅ ${updateCount} ligne(s) modifiée(s) avec succès`);
      }
      
      // Étape 2: Récupérer l'enregistrement mis à jour avec un SELECT séparé pour isoler l'opération de lecture.
      console.log(`ACTION: SELECT après UPDATE pour ${this.idColumnName}=${id}`);
      const { data, error: selectError } = await this.client
        .from(tableName)
        .select('*')
        .eq(this.idColumnName, id)
        .maybeSingle(); // Utiliser maybeSingle pour éviter l'erreur si la ligne a "disparu"

      if (selectError) {
        console.error('❌ Échec de l\'Étape 2: SELECT après UPDATE a échoué.', {
          message: selectError.message,
          details: selectError.details,
          code: selectError.code,
        });
        throw new Error(`Le contact a été mis à jour, mais sa relecture a échoué. Problème de RLS ? Erreur: ${selectError.message}`);
      }

      if (!data) {
        // Ce cas est maintenant le plus informatif avec maybeSingle()
        console.error("❌ Échec de l'Étape 2: La relecture n'a retourné aucune donnée (data is null).", {
            cause: "L'enregistrement est inaccessible via RLS juste après la mise à jour, ou a été supprimé simultanément.",
            id,
            idColumn: this.idColumnName
        });
        throw new Error(`Contact avec l'ID ${id} est devenu inaccessible après la mise à jour.`);
      }

      console.log(`✅ Étape 2/2: Relecture du contact ${id} réussie.`);
      return this.mapSupabaseToContact(data);
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
      console.log(`🗑️ Suppression avec colonne d'identité: ${this.idColumnName} = ${id}`);
      const { error } = await this.client
        .from(tableName)
        .delete()
        .eq(this.idColumnName, id);

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

  /**
   * Recherche globale optimisée dans toute la base de données
   * Utilise le Full Text Search de PostgreSQL pour des performances maximales
   */
  async searchInFullDatabase(
    query: string, 
    searchColumn: string = 'all',
    page: number = 0,
    pageSize: number = 250,
    tableName: string = 'DimiTable'
  ): Promise<{
    data: any[];
    totalCount: number;
    hasMore: boolean;
    searchQuery: string;
  }> {
    if (!this.isConfigured) {
      throw new Error('Supabase non configuré');
    }

    if (!query || query.trim().length === 0) {
      // Si pas de recherche, retourner les données paginées normales
      const result = await this.getRawSupabaseData(page, pageSize, tableName);
      return {
        data: result.data,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        searchQuery: ''
      };
    }

    try {
      console.log(`🔍 Recherche globale: "${query}" dans colonne: ${searchColumn}`);
      
      const startRange = page * pageSize;
      const endRange = startRange + pageSize - 1;
      const sanitizedQuery = query.trim();

      let queryBuilder = this.client.from(tableName).select('*', { count: 'exact' });

      if (searchColumn === 'all') {
        // Colonnes de texte recherchables (exclut les UUIDs et autres types non-textuels)
        const searchableTextColumns = [
          'prenom',
          'nom', 
          'telephone',
          'numero',
          'email',
          'mail',
          'commentaire',
          'commentaires_appel_1',
          'statut',
          'statut_final',
          'adresse',
          'ville',
          'code_postal',
          'entreprise',
          'poste'
        ];

        // Construire la recherche OR seulement sur les colonnes textuelles
        const searchConditions = searchableTextColumns
          .map(col => `${col}.ilike.%${sanitizedQuery}%`)
          .join(',');

        queryBuilder = queryBuilder.or(searchConditions);

      } else if (searchColumn && searchColumn !== 'all') {
        // Recherche dans une colonne spécifique
        // Vérifier si c'est une colonne UUID ou numérique
        if (searchColumn.toLowerCase().includes('id') || searchColumn.toLowerCase() === 'uid') {
          // Pour les UUIDs, utiliser une recherche exacte ou une conversion en texte
          if (this.isValidUUID(sanitizedQuery)) {
            queryBuilder = queryBuilder.eq(searchColumn, sanitizedQuery);
          } else {
            // Conversion UUID en texte pour recherche partielle
            queryBuilder = queryBuilder.like(`${searchColumn}::text`, `%${sanitizedQuery}%`);
          }
        } else {
          // Pour les autres colonnes, utiliser ILIKE normal
          queryBuilder = queryBuilder.ilike(searchColumn, `%${sanitizedQuery}%`);
        }
      } else {
        // Fallback : recherche sur les colonnes principales seulement
        queryBuilder = queryBuilder.or(
          `prenom.ilike.%${sanitizedQuery}%,nom.ilike.%${sanitizedQuery}%,telephone.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`
        );
      }

      // Appliquer la pagination
      queryBuilder = queryBuilder.range(startRange, endRange);

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('❌ Erreur lors de la recherche globale:', error);
        throw error;
      }

      console.log(`✅ Recherche globale: ${data?.length || 0} résultats trouvés sur ${count || 0} total`);

      return {
        data: data || [],
        totalCount: count || 0,
        hasMore: count ? (startRange + (data?.length || 0)) < count : false,
        searchQuery: sanitizedQuery
      };

    } catch (error) {
      console.error('❌ Erreur lors de la recherche globale:', error);
      throw error;
    }
  }

  /**
   * Vérifie si une chaîne est un UUID valide
   */
  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Obtient les colonnes recherchables (exclut les UUIDs, dates, etc.)
   */
  private getSearchableColumns(): string[] {
    // Colonnes connues comme étant recherchables
    const knownSearchableColumns = [
      'prenom', 'nom', 'telephone', 'numero', 'email', 'mail',
      'commentaire', 'commentaires_appel_1', 'statut', 'statut_final',
      'adresse', 'ville', 'code_postal', 'entreprise', 'poste',
      'fonction', 'departement', 'notes'
    ];

    // Si on a découvert les colonnes, filtrer intelligemment
    if (this.discoveredColumns.length > 0) {
      return this.discoveredColumns.filter(col => {
        const colLower = col.toLowerCase();
        
        // Exclure les colonnes UUID/ID
        if (colLower.includes('id') || colLower === 'uid') return false;
        
        // Exclure les colonnes de date/timestamp
        if (colLower.includes('date') || colLower.includes('time') || 
            colLower.includes('created') || colLower.includes('updated')) return false;
        
        // Exclure les colonnes numériques pures
        if (colLower.includes('count') || colLower.includes('number') || 
            colLower === 'age' || colLower.includes('price')) return false;
        
        // Inclure les colonnes qui semblent être du texte
        return true;
      });
    }

    // Fallback vers les colonnes connues
    return knownSearchableColumns;
  }

  /**
   * Recherche avec gestion intelligente des types de colonnes
   */
  async searchInFullDatabaseSmart(
    query: string, 
    searchColumn: string = 'all',
    page: number = 0,
    pageSize: number = 250,
    tableName: string = 'DimiTable'
  ): Promise<{
    data: any[];
    totalCount: number;
    hasMore: boolean;
    searchQuery: string;
  }> {
    if (!this.isConfigured) {
      throw new Error('Supabase non configuré');
    }

    if (!query || query.trim().length === 0) {
      const result = await this.getRawSupabaseData(page, pageSize, tableName);
      return {
        data: result.data,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        searchQuery: ''
      };
    }

    try {
      console.log(`🔍 Recherche intelligente: "${query}" dans colonne: ${searchColumn}`);
      
      const startRange = page * pageSize;
      const endRange = startRange + pageSize - 1;
      const sanitizedQuery = query.trim();

      let queryBuilder = this.client.from(tableName).select('*', { count: 'exact' });

      if (searchColumn === 'all') {
        // Utiliser les colonnes recherchables découvertes dynamiquement
        const searchableColumns = this.getSearchableColumns();
        console.log(`📋 Colonnes recherchables détectées:`, searchableColumns);

        if (searchableColumns.length > 0) {
          const searchConditions = searchableColumns
            .map(col => `${col}.ilike.%${sanitizedQuery}%`)
            .join(',');

          queryBuilder = queryBuilder.or(searchConditions);
        } else {
          // Fallback minimal
          queryBuilder = queryBuilder.or(
            `prenom.ilike.%${sanitizedQuery}%,nom.ilike.%${sanitizedQuery}%`
          );
        }
      } else if (searchColumn && searchColumn !== 'all') {
        // Recherche dans une colonne spécifique avec gestion des types
        if (this.isUUIDColumn(searchColumn)) {
          if (this.isValidUUID(sanitizedQuery)) {
            queryBuilder = queryBuilder.eq(searchColumn, sanitizedQuery);
          } else {
            queryBuilder = queryBuilder.like(`${searchColumn}::text`, `%${sanitizedQuery}%`);
          }
        } else {
          queryBuilder = queryBuilder.ilike(searchColumn, `%${sanitizedQuery}%`);
        }
      }

      queryBuilder = queryBuilder.range(startRange, endRange);
      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('❌ Erreur lors de la recherche intelligente:', error);
        throw error;
      }

      console.log(`✅ Recherche intelligente: ${data?.length || 0} résultats sur ${count || 0} total`);

      return {
        data: data || [],
        totalCount: count || 0,
        hasMore: count ? (startRange + (data?.length || 0)) < count : false,
        searchQuery: sanitizedQuery
      };

    } catch (error) {
      console.error('❌ Erreur lors de la recherche intelligente:', error);
      throw error;
    }
  }

  /**
   * Détermine si une colonne est de type UUID
   */
  private isUUIDColumn(columnName: string): boolean {
    const colLower = columnName.toLowerCase();
    return colLower.includes('id') || colLower === 'uid' || colLower.includes('uuid');
  }

  /**
   * Recherche Full Text Search avancée (nécessite une colonne tsvector)
   * Plus performante pour de gros volumes de données si configurée
   */
  async searchWithFullTextSearch(
    query: string,
    page: number = 0,
    pageSize: number = 250,
    tableName: string = 'DimiTable'
  ): Promise<{
    data: any[];
    totalCount: number;
    hasMore: boolean;
  }> {
    if (!this.isConfigured) {
      throw new Error('Supabase non configuré');
    }

    try {
      const startRange = page * pageSize;
      const endRange = startRange + pageSize - 1;
      
      // Utilise to_tsvector et to_tsquery pour une recherche Full Text optimisée
      // Cette approche nécessiterait une colonne search_vector dans la table
      const { data, error, count } = await this.client
        .from(tableName)
        .select('*', { count: 'exact' })
        .textSearch('fts', query, {
          type: 'websearch',
          config: 'french'
        })
        .range(startRange, endRange);

      if (error) throw error;

      return {
        data: data || [],
        totalCount: count || 0,
        hasMore: count ? (startRange + (data?.length || 0)) < count : false
      };

    } catch (error) {
      // Fallback vers la recherche normale si FTS n'est pas configuré
      console.warn('⚠️ Full Text Search non disponible, fallback vers recherche normale');
      return this.searchInFullDatabase(query, 'all', page, pageSize, tableName);
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
      id: supabaseContact[this.idColumnName] || supabaseContact.UID || supabaseContact.id || `supabase_${numeroLigne}`,
      numeroLigne,
      prenom: this.getFieldValue(supabaseContact, ['prenom', 'Prenom', 'PRENOM']) || '',
      nom: this.getFieldValue(supabaseContact, ['nom', 'Nom', 'NOM']) || '',
      telephone: this.getFieldValue(supabaseContact, ['numero', 'telephone', 'Telephone', 'TELEPHONE']) || '',
      email: this.getFieldValue(supabaseContact, ['mail', 'email', 'Email', 'EMAIL']) || '',
      source: this.getFieldValue(supabaseContact, ['source', 'ecole', 'Source', 'ECOLE']) || '',
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

  private validateColumn(columnName: string): boolean {
    // Si pas de colonnes découvertes, on accepte (pour la compatibilité)
    if (this.discoveredColumns.length === 0) {
      console.warn(`⚠️ Validation de colonne '${columnName}' sans découverte préalable`);
      return true;
    }
    
    // Vérifier si la colonne existe dans la table
    const isValid = this.discoveredColumns.includes(columnName);
    if (!isValid) {
      console.warn(`❌ Colonne '${columnName}' non trouvée dans les colonnes découvertes:`, this.discoveredColumns.slice(0, 10));
    }
    return isValid;
  }

  async forceRediscoverColumns(tableName: string = 'DimiTable'): Promise<void> {
    console.log('🔄 Redécouverte forcée des colonnes...');
    this.discoveredColumns = [];
    try {
      await this.getRawSupabaseData(0, 1, tableName);
      console.log('✅ Redécouverte terminée:', this.discoveredColumns.length, 'colonnes trouvées');
    } catch (error) {
      console.error('❌ Erreur lors de la redécouverte:', error);
      throw error;
    }
  }

  private detectIdColumn(): void {
    // Ordre de priorité pour détecter la colonne d'identité
    const idCandidates = ['UID', 'id', 'ID', 'uid', 'uuid', 'UUID'];
    
    for (const candidate of idCandidates) {
      if (this.discoveredColumns.includes(candidate)) {
        this.idColumnName = candidate;
        console.log(`🔑 Colonne d'identité détectée: ${this.idColumnName}`);
        return;
      }
    }
    
    // Fallback : chercher une colonne contenant 'id'
    const idColumn = this.discoveredColumns.find(col => 
      col.toLowerCase().includes('id') || col.toLowerCase().includes('uid')
    );
    
    if (idColumn) {
      this.idColumnName = idColumn;
      console.log(`🔑 Colonne d'identité détectée (fallback): ${this.idColumnName}`);
    } else {
      console.warn('⚠️ Aucune colonne d\'identité trouvée, utilisation de "id" par défaut');
      this.idColumnName = 'id';
    }
  }

  private mapContactToSupabase(contact: Contact): Partial<SupabaseContact> {
    // Mapping inverse - utilise les noms de colonnes Supabase découverts
    const supabaseContact: Partial<SupabaseContact> = {};

    console.log('🔄 Mapping contact vers Supabase:', { 
      contactId: contact.id,
      discoveredColumns: this.discoveredColumns.length,
      discoveredColumnsNames: this.discoveredColumns,
      contactFields: Object.keys(contact)
    });

    // L'ID est traité séparément et ne doit pas être inclus dans les updates
    if (contact.id && !contact.id.startsWith('supabase_')) {
      supabaseContact.id = contact.id;
    }

    // Champs de base toujours mappés vers les noms de colonnes Supabase
    if (contact.prenom !== undefined && contact.prenom !== null && this.validateColumn('prenom')) {
      supabaseContact.prenom = contact.prenom;
    }
    if (contact.nom !== undefined && contact.nom !== null && this.validateColumn('nom')) {
      supabaseContact.nom = contact.nom;
    }
    if (contact.telephone !== undefined && contact.telephone !== null && this.validateColumn('numero')) {
      supabaseContact.numero = contact.telephone; // numero dans Supabase
    }
    if (contact.email !== undefined && contact.email !== null && this.validateColumn('mail')) {
      supabaseContact.mail = contact.email; // mail dans Supabase
    }
    if (contact.source !== undefined && contact.source !== null && this.validateColumn('source')) {
      supabaseContact.source = contact.source;
    }
    
    // Pour le statut, mapper vers la colonne appropriée selon ce qui existe
    if (contact.statut !== undefined && contact.statut !== null) {
      // Essayer différentes colonnes de statut selon ce qui existe
      if (this.validateColumn('statut_final')) {
        supabaseContact.statut_final = contact.statut;
      } else if (this.validateColumn('statut')) {
        supabaseContact.statut = contact.statut;
      } else {
        console.warn('⚠️ Aucune colonne de statut valide trouvée');
      }
    }
    
    if (contact.commentaire !== undefined && contact.commentaire !== null) {
      // Essayer différentes colonnes de commentaire selon ce qui existe
      if (this.validateColumn('commentaires_appel_1')) {
        supabaseContact.commentaires_appel_1 = contact.commentaire;
      } else if (this.validateColumn('commentaire')) {
        supabaseContact.commentaire = contact.commentaire;
      } else {
        console.warn('⚠️ Aucune colonne de commentaire valide trouvée');
      }
    }

    // Champs optionnels - utiliser les noms de colonnes Supabase
    if (contact.dateRappel !== undefined && contact.dateRappel !== null && this.validateColumn('date_rappel')) {
      supabaseContact.date_rappel = contact.dateRappel;
    }
    if (contact.heureRappel !== undefined && contact.heureRappel !== null && this.validateColumn('heure_rappel')) {
      supabaseContact.heure_rappel = contact.heureRappel;
    }
    if (contact.dateRDV !== undefined && contact.dateRDV !== null && this.validateColumn('date_rdv')) {
      supabaseContact.date_rdv = contact.dateRDV;
    }
    if (contact.heureRDV !== undefined && contact.heureRDV !== null && this.validateColumn('heure_rdv')) {
      supabaseContact.heure_rdv = contact.heureRDV;
    }
    if (contact.dateAppel !== undefined && contact.dateAppel !== null) {
      // Essayer date_appel_1 en priorité puis date_appel
      if (this.validateColumn('date_appel_1')) {
        supabaseContact.date_appel_1 = contact.dateAppel;
      } else if (this.validateColumn('date_appel')) {
        supabaseContact.date_appel = contact.dateAppel;
      } else {
        console.warn('⚠️ Aucune colonne de date d\'appel valide trouvée');
      }
    }
    if (contact.heureAppel !== undefined && contact.heureAppel !== null && this.validateColumn('heure_appel')) {
      supabaseContact.heure_appel = contact.heureAppel;
    }
    if (contact.dureeAppel !== undefined && contact.dureeAppel !== null && this.validateColumn('duree_appel')) {
      supabaseContact.duree_appel = contact.dureeAppel;
    }

    // Champs spéciaux
    if (contact.sexe !== undefined && contact.sexe !== null && this.validateColumn('sexe')) {
      supabaseContact.sexe = contact.sexe;
    }
    if (contact.don !== undefined && contact.don !== null && this.validateColumn('don')) {
      supabaseContact.don = contact.don;
    }
    if (contact.qualite !== undefined && contact.qualite !== null && this.validateColumn('qualite')) {
      supabaseContact.qualite = contact.qualite;
    }
    if (contact.type !== undefined && contact.type !== null && this.validateColumn('type')) {
      supabaseContact.type = contact.type;
    }
    if (contact.date !== undefined && contact.date !== null && this.validateColumn('date')) {
      supabaseContact.date = contact.date;
    }
    if (contact.uid !== undefined && contact.uid !== null && this.validateColumn('UID')) {
      supabaseContact.UID = contact.uid;
    }

    console.log('✅ Mapping terminé:', {
      inputFields: Object.keys(contact).filter(k => contact[k as keyof Contact] !== undefined && contact[k as keyof Contact] !== null),
      outputFields: Object.keys(supabaseContact),
      supabaseContact
    });

    return supabaseContact;
  }

  // Nouvelle méthode pour mettre à jour un champ directement sans mapping Contact
  async updateRawField(id: string, fieldName: string, value: any, tableName: string = 'DimiTable'): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Supabase non configuré');
    }

    try {
      console.log('🔄 Mise à jour champ brut:', { id, fieldName, value, tableName });
      
      // Valider que la colonne existe
      if (this.discoveredColumns.length > 0 && !this.validateColumn(fieldName)) {
        throw new Error(`Colonne '${fieldName}' non trouvée dans la table ${tableName}`);
      }

      // Préparer l'objet de mise à jour
      const updates = { [fieldName]: value };

      console.log(`🚀 UPDATE ${tableName} SET ${fieldName} = ${value} WHERE ${this.idColumnName} = ${id}`);

      // Exécuter la mise à jour
      const { error: updateError, count: updateCount } = await this.client
        .from(tableName)
        .update(updates)
        .eq(this.idColumnName, id);

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour du champ:', updateError);
        throw updateError;
      }

      console.log(`✅ Champ ${fieldName} mis à jour avec succès (${updateCount} ligne(s) affectée(s))`);
      
    } catch (error) {
      console.error('❌ Erreur updateRawField:', error);
      throw error;
    }
  }

  cleanup() {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
    this.listeners = [];
  }

  /**
   * Met à jour les données d'un contact en trouvant le prochain slot d'appel disponible
   * Logique: si date_appel_1 et statut_appel_1 sont remplis, passer à appel_2, etc.
   */
  async updateContactWithNewCall(
    uid: string, 
    newCallData: {
      date_appel?: string;
      statut_appel?: string;
      commentaires_appel?: string;
    },
    tableName: string = 'DimiTable'
  ): Promise<{ success: boolean; usedSlot: number; error?: string }> {
    if (!this.isConfigured) {
      throw new Error('Supabase non configuré');
    }

    try {
      // 1. Récupérer les données actuelles du contact
      const { data: existingData, error: fetchError } = await this.client
        .from(tableName)
        .select('*')
        .eq('UID', uid)
        .single();

      if (fetchError) {
        throw new Error(`Erreur lors de la récupération du contact: ${fetchError.message}`);
      }

      if (!existingData) {
        throw new Error(`Contact avec UID ${uid} non trouvé`);
      }

      // 2. Trouver le prochain slot disponible (1, 2, 3, 4)
      let availableSlot = 0;
      
      for (let i = 1; i <= 4; i++) {
        const dateField = `date_appel_${i}`;
        const statutField = `statut_appel_${i}`;
        
        // Un slot est considéré comme libre si date_appel ET statut_appel sont vides
        const dateValue = existingData[dateField];
        const statutValue = existingData[statutField];
        
        if (!dateValue || !statutValue || 
            String(dateValue).trim() === '' || 
            String(statutValue).trim() === '') {
          availableSlot = i;
          break;
        }
      }

      if (availableSlot === 0) {
        return {
          success: false,
          usedSlot: 0,
          error: 'Tous les slots d\'appel sont occupés (maximum 4 appels par contact)'
        };
      }

      // 3. Préparer les données de mise à jour
      const updateData: any = {};
      
      if (newCallData.date_appel) {
        updateData[`date_appel_${availableSlot}`] = newCallData.date_appel;
      }
      
      if (newCallData.statut_appel) {
        updateData[`statut_appel_${availableSlot}`] = newCallData.statut_appel;
      }
      
      if (newCallData.commentaires_appel) {
        updateData[`commentaires_appel_${availableSlot}`] = newCallData.commentaires_appel;
      }

      // 4. Effectuer la mise à jour
      const { error: updateError } = await this.client
        .from(tableName)
        .update(updateData)
        .eq('UID', uid);

      if (updateError) {
        throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
      }

      return {
        success: true,
        usedSlot: availableSlot
      };

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du contact:', error);
      return {
        success: false,
        usedSlot: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Mise à jour en masse pour l'import de fichiers
   * Traite plusieurs contacts avec la logique de slots d'appel
   */
  async batchUpdateContactsWithCalls(
    importData: Array<{
      UID: string;
      date_appel?: string;
      statut_appel?: string;
      commentaires_appel?: string;
      [key: string]: any; // Pour d'autres champs éventuels
    }>,
    tableName: string = 'DimiTable'
  ): Promise<{
    success: number;
    failed: number;
    results: Array<{
      uid: string;
      success: boolean;
      usedSlot?: number;
      error?: string;
    }>;
  }> {
    if (!this.isConfigured) {
      throw new Error('Supabase non configuré');
    }

    const results: Array<{
      uid: string;
      success: boolean;
      usedSlot?: number;
      error?: string;
    }> = [];

    let successCount = 0;
    let failedCount = 0;

    // Traiter chaque contact un par un pour gérer la logique des slots
    for (const contact of importData) {
      if (!contact.UID) {
        results.push({
          uid: 'INCONNU',
          success: false,
          error: 'UID manquant'
        });
        failedCount++;
        continue;
      }

      try {
        const result = await this.updateContactWithNewCall(
          contact.UID,
          {
            date_appel: contact.date_appel,
            statut_appel: contact.statut_appel,
            commentaires_appel: contact.commentaires_appel
          },
          tableName
        );

        results.push({
          uid: contact.UID,
          success: result.success,
          usedSlot: result.usedSlot,
          error: result.error
        });

        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }

      } catch (error) {
        results.push({
          uid: contact.UID,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
        failedCount++;
      }

      // Petit délai pour éviter de surcharger la base
      if (importData.length > 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      results
    };
  }
}

// Instance singleton
export const supabaseService = new SupabaseService(); 