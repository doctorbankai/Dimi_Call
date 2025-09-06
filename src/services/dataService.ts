import { Contact, ContactStatus, ClientFile, EmailType, Civility, CallMode } from '../types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import Papa from 'papaparse'; // For CSV parsing
import * as XLSX from 'xlsx'; // For Excel parsing and writing
import { ExportColumnService } from './exportColumnService';

const LOCAL_STORAGE_KEY = 'dimiCallContacts';
const CALL_STATES_KEY = 'dimiCallCallStates';

// Clé pour la sauvegarde de la table importée
const IMPORTED_TABLE_KEY = 'dimicall_imported_table';
const IMPORTED_TABLE_METADATA_KEY = 'dimicall_imported_table_metadata';

// Utility function to format phone numbers
export const formatPhoneNumber = (phoneStr: string): string => {
  // Handle null, undefined, or empty inputs
  if (!phoneStr || typeof phoneStr !== 'string') return '';
  
  // Clean all characters except digits and +
  let cleaned = phoneStr.replace(/[^\d+]/g, "");
  
  // Early return for empty cleaned string
  if (!cleaned) return phoneStr;

  // Pattern 1: Malformed +033 prefix (high priority)
  const matchMalformed033 = cleaned.match(/^\+033(\d{9,10})$/);
  if (matchMalformed033) {
    const digits = matchMalformed033[1];
    // If 10 digits, take first 9; if 9 digits, use as is
    const num = digits.length === 10 ? digits.slice(0, 9) : digits;
    if (num.length === 9) {
      return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7,9)}`;
    }
  }

  // Pattern 2: Malformed +0 prefix
  const matchMalformedPlus0 = cleaned.match(/^\+0([67]\d{7,9})$/);
  if (matchMalformedPlus0) {
    const digits = matchMalformedPlus0[1];
    // Handle both truncated (8 digits) and normal (9 digits) and extra (10+ digits)
    if (digits.length >= 8) {
      const num = digits.length === 8 ? digits : digits.slice(0, 9);
      if (num.length === 8) {
        // Truncated mobile number
        return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7)}`;
      } else {
        // Standard 9-digit mobile
        return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7,9)}`;
      }
    }
  }

  // Pattern 3: Numbers with extra digits (11 digits starting with 0)
  const matchExtraDigits = cleaned.match(/^0([67]\d{9})$/);
  if (matchExtraDigits) {
    const digits = matchExtraDigits[1];
    // Take first 9 digits
    const num = digits.slice(0, 9);
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7,9)}`;
  }

  // Pattern 4: Truncated numbers (9 digits starting with 0, mobile/landline)
  const matchTruncated = cleaned.match(/^0([67]\d{7})$/);
  if (matchTruncated) {
    const num = matchTruncated[1];
    // Format as truncated with last digit isolated
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7)}`;
  }

  // Pattern 4b: Special case for numbers like '0069540063' (10 digits but should be truncated)
  // This handles cases where the number starts with 00 followed by mobile prefix
  const matchSpecialTruncated = cleaned.match(/^00([67]\d{7})$/);
  if (matchSpecialTruncated) {
    const num = matchSpecialTruncated[1];
    // Format as truncated with last digit isolated
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7)}`;
  }

  // Pattern 5: Standard +33(0) format - remove the 0 after +33
  if (cleaned.match(/^\+330/)) {
    cleaned = cleaned.replace(/^\+330/, '+33');
  }

  // Pattern 6: Number without + before 33
  if (cleaned.match(/^33\d{9}$/)) {
    cleaned = '+' + cleaned;
  }

  // Pattern 7: Already correct +33 format with 9 digits
  const matchCorrectPlus33 = cleaned.match(/^\+33(\d{9})$/);
  if (matchCorrectPlus33) {
    const num = matchCorrectPlus33[1];
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7,9)}`;
  }

  // Pattern 8: Standard 10-digit number starting with 0
  const matchStandard10 = cleaned.match(/^0(\d{9})$/);
  if (matchStandard10) {
    const num = matchStandard10[1];
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7,9)}`;
  }

  // Pattern 9: 9-digit mobile numbers (6 or 7 prefix)
  const matchMobile9 = cleaned.match(/^([67]\d{8})$/);
  if (matchMobile9) {
    const num = matchMobile9[1];
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7,9)}`;
  }

  // Pattern 10: 9-digit landline numbers (1-5 prefix)
  const matchLandline9 = cleaned.match(/^([1-5]\d{8})$/);
  if (matchLandline9) {
    const num = matchLandline9[1];
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7,9)}`;
  }

  // Pattern 11: 8-digit mobile numbers (truncated, no leading 0)
  const matchTruncatedMobile = cleaned.match(/^([67]\d{7})$/);
  if (matchTruncatedMobile) {
    const num = matchTruncatedMobile[1];
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7)}`;
  }

  // Pattern 12: +33 with malformed digits (handle extra 0s or irregular lengths)
  const matchPlus33Variant = cleaned.match(/^\+33(.+)$/);
  if (matchPlus33Variant) {
    let numPart = matchPlus33Variant[1];
    
    // Remove leading 0s
    while (numPart.startsWith('0') && numPart.length > 9) {
      numPart = numPart.substring(1);
    }
    
    // If exactly 9 digits, format normally
    if (numPart.length === 9) {
      return `+33 ${numPart[0]} ${numPart.slice(1,3)} ${numPart.slice(3,5)} ${numPart.slice(5,7)} ${numPart.slice(7,9)}`;
    }
    
    // If 8 digits and starts with 6/7, format as truncated mobile
    if (numPart.length === 8 && /^[67]/.test(numPart)) {
      return `+33 ${numPart[0]} ${numPart.slice(1,3)} ${numPart.slice(3,5)} ${numPart.slice(5,7)} ${numPart.slice(7)}`;
    }
    
    // If more than 9 digits, take first 9
    if (numPart.length > 9) {
      const truncated = numPart.slice(0, 9);
      return `+33 ${truncated[0]} ${truncated.slice(1,3)} ${truncated.slice(3,5)} ${truncated.slice(5,7)} ${truncated.slice(7,9)}`;
    }
  }

  // If no pattern matches, return original input
  return phoneStr;
};

// Load contacts from localStorage
export const loadContacts = (): Contact[] => {
  try {
    const stored = localStorage.getItem('dimiCallContacts');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading contacts from localStorage:', error);
  }
  return [];
};

// Save contacts to localStorage
export const saveContacts = (contacts: Contact[]): void => {
  try {
    localStorage.setItem('dimiCallContacts', JSON.stringify(contacts));
  } catch (error) {
    console.error('Error saving contacts to localStorage:', error);
  }
};

// Load call states from localStorage
export const loadCallStates = (): Record<string, { isCalling?: boolean; hasBeenCalled?: boolean }> => {
  try {
    const stored = localStorage.getItem('dimiCallStates');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading call states from localStorage:', error);
  }
  return {};
};

// Save call states to localStorage
export const saveCallStates = (states: Record<string, { isCalling?: boolean; hasBeenCalled?: boolean }>): void => {
  try {
    localStorage.setItem('dimiCallStates', JSON.stringify(states));
  } catch (error) {
    console.error('Error saving call states to localStorage:', error);
  }
};

// Normalize header names for CSV import
// Fonction pour normaliser les chaînes (supprimer accents, espaces, etc.)
const removeAccents = (str: string): string => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const normalizeHeader = (header: string): string => {
  // Nettoyage initial : supprimer espaces de début/fin, convertir en minuscules, supprimer accents
  const cleaned = removeAccents(header.trim().toLowerCase());
  
  // Mapping étendu avec toutes les variantes possibles
  const mapping: Record<string, string> = {
    // PRÉNOM - toutes variantes
    'prénom': 'prenom',
    'prenom': 'prenom',
    'firstname': 'prenom',
    'first_name': 'prenom',
    'first name': 'prenom',
    'fname': 'prenom',
    
    // NOM - toutes variantes  
    'nom': 'nom',
    'lastname': 'nom',
    'last_name': 'nom',
    'last name': 'nom',
    'lname': 'nom',
    'surname': 'nom',
    'family_name': 'nom',
    
    // TÉLÉPHONE - toutes variantes
    'téléphone': 'telephone',
    'telephone': 'telephone',
    'phone': 'telephone',
    'numero': 'telephone',
    'numéro': 'telephone',
    'number': 'telephone',
    'tel': 'telephone',
    'mobile': 'telephone',
    'gsm': 'telephone',
    'portable': 'telephone',
    'cellulaire': 'telephone',
    'tél': 'telephone',
    
    // EMAIL - toutes variantes
    'email': 'email',
    'e-mail': 'email',
    'mail': 'email',
    'mél': 'email',
    'mel': 'email',
    'courriel': 'email',
    'adresse_mail': 'email',
    'adresse mail': 'email',
    'email_address': 'email',
    
    // SOURCE/ÉCOLE - toutes variantes
    'école': 'source',
    'ecole': 'source',
    'source': 'source',
    'origin': 'source',
    'origine': 'source',
    'etablissement': 'source',
    'établissement': 'source',
    'institution': 'source',
    'university': 'source',
    'universite': 'source',
    'université': 'source',
    'school': 'source',
    
    // STATUT - toutes variantes
    'statut': 'statut',
    'status': 'statut',
    'état': 'statut',
    'etat': 'statut',
    'state': 'statut',
    
    // COMMENTAIRE - toutes variantes
    'commentaire': 'commentaire',
    'commentaires': 'commentaire',
    'comment': 'commentaire',
    'comments': 'commentaire',
    'note': 'commentaire',
    'notes': 'commentaire',
    'remarque': 'commentaire',
    'remarques': 'commentaire',
    'observation': 'commentaire',
    'observations': 'commentaire',
  };
  
  // Recherche directe
  if (mapping[cleaned]) {
    return mapping[cleaned];
  }
  
  // Si aucun mapping trouvé, retourner le header nettoyé
  console.warn(`⚠️ En-tête non reconnu: "${header}" → "${cleaned}"`);
  return cleaned;
};

// Fonction pour valider et analyser les en-têtes
const analyzeHeaders = (headers: string[]): { 
  valid: boolean; 
  warnings: string[]; 
  suggestions: string[];
  mappings: Record<string, string>;
} => {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const mappings: Record<string, string> = {};
  
  const requiredFields = ['prenom', 'nom', 'telephone'];
  const foundFields: Set<string> = new Set();
  
  headers.forEach(header => {
    const normalized = normalizeHeader(header);
    mappings[header] = normalized;
    
    if (requiredFields.includes(normalized)) {
      foundFields.add(normalized);
    }
    
    // Vérifications spécifiques
    if (header !== header.trim()) {
      warnings.push(`⚠️ En-tête avec espaces: "${header}"`);
    }
    
    if (normalized === removeAccents(header.trim().toLowerCase()) && header !== normalized) {
      suggestions.push(`💡 "${header}" sera normalisé en "${normalized}"`);
    }
  });
  
  // Vérifier les champs obligatoires
  const missingFields = requiredFields.filter(field => !foundFields.has(field));
  if (missingFields.length > 0) {
    warnings.push(`❌ Champs obligatoires manquants: ${missingFields.join(', ')}`);
    
    // Suggestions basées sur les en-têtes existants
    missingFields.forEach(missing => {
      const similarHeaders = headers.filter(h => 
        removeAccents(h.toLowerCase()).includes(missing.substring(0, 3))
      );
      if (similarHeaders.length > 0) {
        suggestions.push(`💡 Pour "${missing}", avez-vous voulu dire: ${similarHeaders.join(', ')} ?`);
      }
    });
  }
  
  return {
    valid: missingFields.length === 0,
    warnings,
    suggestions,
    mappings
  };
};

// Fonction pour détecter le délimiteur d'un fichier
const detectDelimiter = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const firstLine = text.split('\n')[0];
      
      // Compter les délimiteurs potentiels
      const tabCount = (firstLine.match(/\t/g) || []).length;
      const commaCount = (firstLine.match(/,/g) || []).length;
      const semicolonCount = (firstLine.match(/;/g) || []).length;
      
      // Déterminer le délimiteur le plus probable
      if (tabCount > commaCount && tabCount > semicolonCount) {
        resolve('\t'); // TSV
      } else if (semicolonCount > commaCount) {
        resolve(';'); // CSV européen
      } else {
        resolve(','); // CSV standard
      }
    };
    reader.onerror = () => resolve(','); // Par défaut CSV
    // Lire seulement les premiers 1024 caractères pour la détection
    reader.readAsText(file.slice(0, 1024));
  });
};

// Import contacts from file (CSV or Excel)
export const importContactsFromFile = async (file: File): Promise<Contact[]> => {
  // 🔍 Vérification préliminaire de la taille du fichier
  const fileSizeInMB = file.size / (1024 * 1024);
  console.log(`📄 Traitement du fichier: ${file.name} (${fileSizeInMB.toFixed(1)}MB)`);
  
  if (fileSizeInMB > 50) {
    throw new Error(`❌ Fichier trop volumineux (${fileSizeInMB.toFixed(1)}MB). Limite: 50MB pour éviter les crashes.`);
  }
  
  if (fileSizeInMB > 20) {
    console.warn(`⚠️ Fichier volumineux (${fileSizeInMB.toFixed(1)}MB), traitement avec précautions...`);
  }
  
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (fileExtension === 'csv' || fileExtension === 'tsv') {
    // Détecter automatiquement le délimiteur
    const delimiter = await detectDelimiter(file);
    console.log(`Délimiteur détecté: "${delimiter === '\t' ? 'TAB' : delimiter}"`);
    
    return new Promise((resolve, reject) => {
      const contacts: Contact[] = [];
      let rowIndex = 0;
      let headersValidated = false;
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: delimiter, // Utiliser le délimiteur détecté
        chunkSize: 1024 * 512, // 512KB chunks pour plus de stabilité
        chunk: (results: any, parser: any) => {
          // Validation des en-têtes sur le premier chunk seulement
          if (!headersValidated && results.meta && results.meta.fields) {
            const headerAnalysis = analyzeHeaders(results.meta.fields);
            
            console.log('📊 Analyse des en-têtes:');
            console.log('En-têtes détectés:', results.meta.fields);
            console.log('Mappings:', headerAnalysis.mappings);
            
            if (headerAnalysis.warnings.length > 0) {
              console.warn('⚠️ Avertissements:', headerAnalysis.warnings);
            }
            
            if (headerAnalysis.suggestions.length > 0) {
              console.log('💡 Suggestions:', headerAnalysis.suggestions);
            }
            
            headersValidated = true;
          }
          
          // Traitement par chunks pour éviter le blocage de l'UI
          try {
            const normalizedHeaders = results.meta.fields.map(normalizeHeader);

            const chunkContacts = results.data.map((row: any, index: number) => {
              rowIndex++;
              const contactData: Partial<Contact> = {
                id: uuidv4(),
                numeroLigne: rowIndex,
              };

              (results.meta.fields || []).forEach((originalHeader: string, i: number) => {
                const normalized = normalizedHeaders[i];
                if (normalized) {
                  (contactData as any)[normalized] = row[originalHeader];
                }
              });

              // Format phone number after mapping
              if (contactData.telephone) {
                contactData.telephone = formatPhoneNumber(contactData.telephone);
              }

              return contactData as Contact;
            });
            
            contacts.push(...chunkContacts);
            
            // Donner une pause à l'UI entre les chunks
            if (contacts.length % 500 === 0) {
              setTimeout(() => {
                // Continue parsing
              }, 5);
            }
          } catch (error) {
            parser.abort();
            reject(error);
          }
        },
        complete: (results: any) => {
          try {
            console.log(`Import CSV terminé: ${contacts.length} contacts traités`);
            resolve(contacts);
          } catch (error) {
            reject(error);
          }
        },
        error: (error: any) => {
          reject(error);
        },
        transformHeader: (header: string) => normalizeHeader(header.trim()),
      });
    });
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          console.log(`📊 Lecture du fichier Excel en cours...`);
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          
          // 🛡️ Options optimisées pour les gros fichiers
          const workbook = XLSX.read(data, { 
            type: 'array',
            dense: fileSizeInMB > 10, // Mode dense pour les gros fichiers
            cellText: false, // Éviter la conversion automatique de texte
            cellNF: false, // Désactiver le formatage des nombres
            cellHTML: false, // Désactiver le HTML
            cellFormula: false, // Ignorer les formules
            cellDates: false, // Éviter la conversion de dates automatique
            sheetStubs: false // Ignorer les cellules vides
          });
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // 📄 Traitement Excel optimisé avec gestion progressive
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: "" });
          
          if (jsonData.length === 0) {
            throw new Error('Le fichier Excel est vide');
          }
          
          // 1. Extraire les en-têtes originaux de la première ligne
          const originalHeaders = (jsonData[0] as string[]).map(h => h ? h.toString().trim() : '');
          const normalizedHeaders = originalHeaders.map(h => normalizeHeader(h));
          const contacts: Contact[] = [];
          
          // 📊 Validation des en-têtes pour Excel
          const headerAnalysis = analyzeHeaders(normalizedHeaders);
          console.log('📊 Analyse des en-têtes Excel:');
          console.log('En-têtes détectés:', originalHeaders);
          console.log('Mappings:', headerAnalysis.mappings);
          
          if (headerAnalysis.warnings.length > 0) {
            console.warn('⚠️ Avertissements:', headerAnalysis.warnings);
          }
          
          // 🚀 Traitement optimisé par chunks avec gestion mémoire
          const chunkSize = fileSizeInMB > 20 ? 50 : fileSizeInMB > 10 ? 100 : 250; // Plus petits chunks pour gros fichiers
          const totalRows = jsonData.length - 1;
          let processedRows = 0;
          
          console.log(`⚙️ Traitement par chunks de ${chunkSize} lignes...`);
          
          for (let i = 1; i < jsonData.length; i += chunkSize) {
            const chunk = jsonData.slice(i, i + chunkSize);
            const chunkContacts: Contact[] = [];
            
            for (let j = 0; j < chunk.length; j++) {
              const row = chunk[j] as any[];
              if (!row || row.length === 0) continue; // Ignorer les lignes vides
              
              const contactData: Partial<Contact> = {
                id: uuidv4(),
                numeroLigne: i + j,
              };

              // Mapper chaque colonne en utilisant l'en-tête original pour récupérer la valeur
              // et l'en-tête normalisé pour l'assigner au bon champ
              originalHeaders.forEach((originalHeader, index) => {
                const normalizedField = normalizedHeaders[index];
                if (normalizedField && row[index] !== undefined && row[index] !== null) {
                  const cellValue = row[index].toString().trim();
                  if (cellValue) {
                    (contactData as any)[normalizedField] = cellValue;
                  }
                }
              });

              // Format phone number after mapping
              if (contactData.telephone) {
                contactData.telephone = formatPhoneNumber(String(contactData.telephone));
              }

              // Set default status if not provided
              if (!contactData.statut) {
                contactData.statut = ContactStatus.NonDefini;
              }

              // Ne pas ajouter les contacts complètement vides
              if (contactData.prenom || contactData.nom || contactData.telephone || contactData.email) {
                chunkContacts.push(contactData as Contact);
              }
            }
            
            // Ajouter le chunk traité aux contacts globaux
            contacts.push(...chunkContacts);
            processedRows += chunk.length;
            
            // 🔄 Pause progressive pour éviter le blocage de l'UI et la saturation mémoire
            const pauseDuration = fileSizeInMB > 20 ? 25 : fileSizeInMB > 10 ? 15 : 10;
            if (i % (chunkSize * 3) === 0) {
              console.log(`⏳ Progression: ${Math.round((processedRows / totalRows) * 100)}% (${contacts.length} contacts valides)`);
              await new Promise(resolve => setTimeout(resolve, pauseDuration));
              
              // 🧹 Forcer le garbage collection si possible
              if ((window as any).gc) {
                (window as any).gc();
              }
            }
          }
          
          resolve(contacts);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  } else {
    throw new Error('Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls)');
  }
};

// Export contacts to file
export const exportContactsToFile = (contacts: Contact[], format: 'csv' | 'xlsx'): void => {
  try {
    console.log(`📤 Export de ${contacts.length} contacts au format ${format.toUpperCase()}`);
    
    // Valider la configuration avant l'export
    if (!ExportColumnService.validateColumnConfiguration()) {
      throw new Error('Configuration des colonnes d\'export invalide');
    }
    
    // Réorganiser les données selon le nouvel ordre
    const reorderedData = ExportColumnService.reorderDataForExport(contacts);
    
    if (reorderedData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }
    
    // Obtenir les en-têtes dans le bon ordre
    const headers = ExportColumnService.getExportHeaders(contacts[0]);
    
    // Convertir les objets réorganisés en tableaux pour Papa.unparse et XLSX
    const data = reorderedData.map(row => 
      headers.map(header => {
        const value = row[header];
        return value !== undefined ? value : '';
      })
    );

    // Generate filename with format: DimiCall_YYYY-MM-DD-HH-MM-SS
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
    
    if (format === 'csv') {
      const csvContent = Papa.unparse([headers, ...data]);
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `DimiCall_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✅ Export CSV réussi avec le nouvel ordre de colonnes: ${headers.length} colonnes`);
    } else if (format === 'xlsx') {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
      XLSX.writeFile(workbook, `DimiCall_${timestamp}.xlsx`);
      
      console.log(`✅ Export XLSX réussi avec le nouvel ordre de colonnes: ${headers.length} colonnes`);
    }
    
    // Afficher les statistiques de l'export
    const stats = ExportColumnService.getConfigurationStats();
    console.log(`📊 Statistiques: ${stats.totalColumns} colonnes configurées (${stats.virtualColumns} virtuelles)`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    
    // Fallback vers l'ancien format en cas d'erreur
    console.log('🔄 Tentative de fallback vers l\'ancien format...');
    try {
      exportContactsToFileLegacy(contacts, format);
      console.log('✅ Fallback réussi avec l\'ancien format');
    } catch (fallbackError) {
      console.error('❌ Échec du fallback:', fallbackError);
      throw new Error(`Export impossible: ${error.message}`);
    }
  }
};

/**
 * Version legacy de l'export (fallback)
 */
const exportContactsToFileLegacy = (contacts: Contact[], format: 'csv' | 'xlsx'): void => {
  const headers = [
    'Prénom', 'Nom', 'Téléphone', 'Mail', 'École/Source', 'Statut',
    'Commentaire', 'Date Rappel', 'Heure Rappel', 'Date RDV', 'Heure RDV',
    'Date Appel', 'Heure Appel', 'Durée Appel'
  ];

  const data = contacts.map(contact => [
    contact.prenom,
    contact.nom,
    contact.telephone,
    contact.email,
    contact.source,
    contact.statut,
    contact.commentaire,
    contact.dateRappel,
    contact.heureRappel,
    contact.dateRDV,
    contact.heureRDV,
    contact.dateAppel,
    contact.heureAppel,
    contact.dureeAppel
  ]);

  // Generate filename with format: DimiCall_YYYY-MM-DD-HH-MM-SS
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  
  if (format === 'csv') {
    const csvContent = Papa.unparse([headers, ...data]);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `DimiCall_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (format === 'xlsx') {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
    XLSX.writeFile(workbook, `DimiCall_${timestamp}.xlsx`);
  }
};

export const generateGmailComposeUrl = (
  contact: Contact,
  emailType: EmailType,
  civility: Civility,
  signatureName: string = ""
): string => {
  const emailTo = contact.email;
  const contactLastName = contact.nom || '';
  const titre = civility === Civility.Madame ? "Madame" : "Monsieur";
  const params = new URLSearchParams({ to: emailTo });
  
  // Charger les templates personnalisés
  const STORAGE_KEY = 'dimicall_email_templates';
  const MODE_STORAGE_KEY = 'dimicall-call-mode';
  let subject = "";
  let bodyTemplate = "";
  
  // Templates par défaut
  const defaultTemplates = {
    [EmailType.PremierContact]: {
      subject: "Arcanis Conseil - Premier Contact",
      body: "Bonjour {titre} {nom},\n\nPour resituer mon appel, je suis gérant privé au sein du cabinet de gestion de patrimoine Arcanis Conseil. Je vous envoie l'adresse de notre site web que vous puissiez en savoir d'avantage : https://arcanis-conseil.fr\n\nLe site est avant tout une vitrine, le mieux est de m'appeler si vous souhaitez davantage d'informations ou de prendre un créneau de 30 minutes dans mon agenda via ce lien : https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial?overlayCalendar=true\n\nBien à vous,"
    },
    [EmailType.D0Visio]: {
      subject: "Confirmation rendez-vous visio - Arcanis Conseil",
      body: "Bonjour {titre} {nom}, merci pour votre temps lors de notre échange téléphonique. \n\nSuite à notre appel, je vous confirme {rdv} en visio.\n\nPour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de vos leviers. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.\n\nJe vous invite à visiter notre site internet pour de plus amples renseignements avant le début de notre échange : www.arcanis-conseil.fr\n\nN'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.\n\nBien cordialement"
    },
    [EmailType.R0Interne]: {
      subject: "Confirmation rendez-vous présentiel - Arcanis Conseil",
      body: "Bonjour {titre} {nom}, merci pour votre temps lors de notre échange téléphonique. \n\nSuite à notre appel, je vous confirme {rdv} dans nos locaux au 22 rue la Boétie, 75008 Paris.\n\nPour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de vos leviers. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.\n\nJe vous invite à visiter notre site internet pour de plus amples renseignements avant le début de notre échange : www.arcanis-conseil.fr\n\nN'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.\n\nBien cordialement"
    },
    [EmailType.R0Externe]: {
      subject: "Confirmation rendez-vous présentiel - Arcanis Conseil",
      body: "Bonjour {titre} {nom}, merci pour votre temps lors de notre échange téléphonique. \n\nSuite à notre appel, je vous confirme {rdv} à {adresse}.\n\nPour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de vos leviers. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.\n\nJe vous invite à visiter notre site internet pour de plus amples renseignements avant le début de notre échange : www.arcanis-conseil.fr\n\nN'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.\n\nBien cordialement"
    }
  };

  // Essayer de charger les templates personnalisés
  let templates = defaultTemplates;
  let signature = signatureName || '';
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      // Choisir templates/signature selon le mode
      const modeSaved = localStorage.getItem(MODE_STORAGE_KEY) as CallMode | null;
      const isMandataire = modeSaved === CallMode.Mandataire;

      if (isMandataire && data.mandataireTemplates) {
        templates = data.mandataireTemplates;
      } else if (data.templates) {
        templates = data.templates;
      }

      if (isMandataire && data.mandataireSignature) {
        signature = data.mandataireSignature;
      } else if (data.signature) {
        signature = data.signature;
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des templates personnalisés:', error);
  }

  // Récupérer le template pour le type d'email
  const template = templates[emailType];
  if (template) {
    subject = template.subject;
    bodyTemplate = template.body;
  }

  // Gestion de la date et l'heure du RDV
  let rdvDetails = "notre entretien du [DATE ET HEURE]";
  if (contact.dateRDV && contact.heureRDV) {
    try {
      const date = new Date(`${contact.dateRDV}T${contact.heureRDV}`);
      if (!isNaN(date.getTime())) {
        const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = new Intl.DateTimeFormat('fr-FR', dateOptions).format(date);
        rdvDetails = `notre entretien du ${formattedDate} à ${contact.heureRDV}`;
      }
    } catch (e) {
      console.error("Erreur de formatage de la date du RDV", e);
    }
  }

  // Remplacement des variables dans le template
  let finalBody = bodyTemplate
    .replace(/{titre}/g, titre)
    .replace(/{nom}/g, contactLastName)
    .replace(/{signature}/g, signature)
    .replace(/{rdv}/g, rdvDetails)
    .replace(/{adresse}/g, '[ADRESSE CLIENT]')
    .replace(/\[DATE ET HEURE\]/g, 'date et heure à déterminer');

  params.set('su', subject);
  params.set('body', finalBody);

  return `https://mail.google.com/mail/?view=cm&fs=1&${params.toString()}`;
};

// Fonction auxiliaire pour construire le champ Notes pour Google Contacts
const buildNotesField = (contact: Contact): string => {
  const notes = [];
  
  // Informations de base
  if (contact.numeroLigne) {
    notes.push(`Ligne: ${contact.numeroLigne}`);
  }
  
  if (contact.source) {
    notes.push(`Source: ${contact.source}`);
  }
  
  // Statut (toujours inclus)
  notes.push(`Statut: ${contact.statut}`);
  
  // Commentaires
  if (contact.commentaire) {
    notes.push(`Commentaire: ${contact.commentaire}`);
  }
  
  // Dates et heures de rappel
  if (contact.dateRappel) {
    const rappelInfo = [`Date rappel: ${contact.dateRappel}`];
    if (contact.heureRappel) {
      rappelInfo.push(`Heure rappel: ${contact.heureRappel}`);
    }
    notes.push(rappelInfo.join(' - '));
  }
  
  // Dates et heures de RDV
  if (contact.dateRDV) {
    const rdvInfo = [`Date RDV: ${contact.dateRDV}`];
    if (contact.heureRDV) {
      rdvInfo.push(`Heure RDV: ${contact.heureRDV}`);
    }
    notes.push(rdvInfo.join(' - '));
  }
  
  // Dates et heures d'appel
  if (contact.dateAppel) {
    const appelInfo = [`Date appel: ${contact.dateAppel}`];
    if (contact.heureAppel) {
      appelInfo.push(`Heure appel: ${contact.heureAppel}`);
    }
    if (contact.dureeAppel) {
      appelInfo.push(`Durée: ${contact.dureeAppel}`);
    }
    notes.push(appelInfo.join(' - '));
  }
  
  // Lien internet
  if (contact.lien) {
    notes.push(`Lien: ${contact.lien}`);
  }
  
  // Informations personnelles supplémentaires
  if (contact.sexe) {
    notes.push(`Sexe: ${contact.sexe}`);
  }
  
  if (contact.don) {
    notes.push(`Don: ${contact.don}`);
  }
  
  if (contact.qualite) {
    notes.push(`Qualité: ${contact.qualite}`);
  }
  
  if (contact.type) {
    notes.push(`Type: ${contact.type}`);
  }
  
  if (contact.date) {
    notes.push(`Date générale: ${contact.date}`);
  }
  
  // Informations utilisateur
  if (contact.utilisateur) {
    notes.push(`Utilisateur: ${contact.utilisateur}`);
  }
  
  // Statuts spécialisés
  if (contact.statutAppel) {
    notes.push(`Statut appel: ${contact.statutAppel}`);
  }
  
  if (contact.statutRDV) {
    notes.push(`Statut RDV: ${contact.statutRDV}`);
  }
  
  if (contact.commentaireRDV) {
    notes.push(`Commentaire RDV: ${contact.commentaireRDV}`);
  }
  
  // Identifiants techniques (optionnels, pour le debug)
  if (contact.uid) {
    notes.push(`UID: ${contact.uid}`);
  }
  
  if (contact.uid_supabase) {
    notes.push(`UID Supabase: ${contact.uid_supabase}`);
  }
  
  return notes.join(' | ');
};

// Export contacts to Google Contacts CSV format
export const exportGoogleContactsCSV = (contacts: Contact[]): void => {
  // Filtrer les contacts par statut (À rappeler, DO, RO, A0)
  const filteredContacts = contacts.filter(contact => 
    contact.statut === ContactStatus.ARappeler ||
    contact.statut === ContactStatus.DO ||
    contact.statut === ContactStatus.RO ||
    contact.statut === ContactStatus.A0
  );

  if (filteredContacts.length === 0) {
    throw new Error('Aucun contact à exporter avec les statuts sélectionnés');
  }

  // Mapping vers le format Google Contacts officiel
  const googleContactsData = filteredContacts.map(contact => ({
    'Name Prefix': '',
    'First Name': contact.prenom || '',
    'Middle Name': '',
    'Last Name': contact.nom || '',
    'Name Suffix': '',
    'Phonetic First Name': '',
    'Phonetic Middle Name': '',
    'Phonetic Last Name': '',
    'Nickname': '',
    'File As': '',
    'E-mail 1 - Label': contact.email ? 'Home' : '',
    'E-mail 1 - Value': contact.email || '',
    'Phone 1 - Label': contact.telephone ? 'Mobile' : '',
    'Phone 1 - Value': contact.telephone || '',
    'Address 1 - Label': '',
    'Address 1 - Country': '',
    'Address 1 - Street': '',
    'Address 1 - Extended Address': '',
    'Address 1 - City': '',
    'Address 1 - Region': '',
    'Address 1 - Postal Code': '',
    'Address 1 - PO Box': '',
    'Organization Name': '',
    'Organization Title': '',
    'Organization Department': '',
    'Birthday': '',
    'Event 1 - Label': '',
    'Event 1 - Value': '',
    'Relation 1 - Label': '',
    'Relation 1 - Value': '',
    'Website 1 - Label': contact.lien ? 'Profile' : '',
    'Website 1 - Value': contact.lien || '',
    'Custom Field 1 - Label': 'Statut',
    'Custom Field 1 - Value': contact.statut || '',
    'Notes': buildNotesField(contact),
    'Labels': ''
  }));

  // Génération du CSV avec encodage UTF-8 BOM
  const csvContent = Papa.unparse(googleContactsData);
  const bom = '\uFEFF'; // UTF-8 BOM pour la compatibilité Google Contacts
  const blob = new Blob([bom + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Generate filename with format: google-contacts-export-YYYY-MM-DD-HH-MM-SS
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  
  // Téléchargement du fichier
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `google-contacts-export-${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Sauvegarde de la table importée avec protection contre la saturation
 */
export const saveImportedTable = (contacts: Contact[], metadata?: { 
  fileName?: string; 
  importDate?: string; 
  source?: 'csv' | 'xlsx' | 'supabase';
  totalRows?: number;
}): void => {
  try {
    // 🛡️ Protection contre les gros fichiers
    const maxContacts = 5000; // Limite à 5000 contacts pour éviter la saturation
    const limitedContacts = contacts.length > maxContacts ? contacts.slice(0, maxContacts) : contacts;
    
    const dataToSave = {
      contacts: limitedContacts,
      metadata: {
        fileName: metadata?.fileName || 'Table importée',
        importDate: metadata?.importDate || new Date().toISOString(),
        source: metadata?.source || 'csv',
        totalRows: metadata?.totalRows || contacts.length,
        truncated: contacts.length > maxContacts,
        truncatedFrom: contacts.length,
        version: '1.0'
      }
    };
    
    // 🔍 Vérification de la taille avant sauvegarde
    const serialized = JSON.stringify(dataToSave);
    const sizeInMB = new Blob([serialized]).size / (1024 * 1024);
    
    if (sizeInMB > 4) { // Limite à 4MB pour être sûr
      console.warn(`⚠️ Fichier trop volumineux (${sizeInMB.toFixed(1)}MB), sauvegarde des métadonnées uniquement`);
      
      // Sauvegarde seulement les métadonnées pour les gros fichiers
      const metadataOnly = {
        contacts: [], // Tableau vide
        metadata: {
          ...dataToSave.metadata,
          metadataOnly: true,
          reason: 'Fichier trop volumineux pour localStorage'
        }
      };
      
      localStorage.setItem(IMPORTED_TABLE_KEY, JSON.stringify(metadataOnly));
      console.log(`💾 Métadonnées sauvegardées uniquement (fichier ${sizeInMB.toFixed(1)}MB trop volumineux)`);
      return;
    }
    
    localStorage.setItem(IMPORTED_TABLE_KEY, JSON.stringify(dataToSave));
    
    if (contacts.length > maxContacts) {
      console.log(`💾 Table importée sauvegardée: ${limitedContacts.length}/${contacts.length} contacts (tronqué pour économiser l'espace)`);
    } else {
      console.log(`💾 Table importée sauvegardée: ${contacts.length} contacts`);
    }
    
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('❌ LocalStorage saturé ! Sauvegarde des métadonnées uniquement...');
      
      // Tentative de sauvegarde des métadonnées uniquement
      try {
        const metadataOnly = {
          contacts: [],
          metadata: {
            fileName: metadata?.fileName || 'Table importée',
            importDate: metadata?.importDate || new Date().toISOString(),
            source: metadata?.source || 'csv',
            totalRows: metadata?.totalRows || contacts.length,
            metadataOnly: true,
            reason: 'Quota localStorage dépassé',
            version: '1.0'
          }
        };
        
        // Nettoyer d'abord l'ancien contenu
        clearImportedTable();
        localStorage.setItem(IMPORTED_TABLE_KEY, JSON.stringify(metadataOnly));
        console.log(`💾 Métadonnées sauvegardées après nettoyage (${contacts.length} contacts non sauvegardés)`);
      } catch (secondaryError) {
        console.error('❌ Impossible de sauvegarder même les métadonnées:', secondaryError);
      }
    } else {
      console.error('❌ Erreur lors de la sauvegarde de la table importée:', error);
    }
  }
};

/**
 * Chargement de la table importée sauvegardée avec gestion des métadonnées seules
 */
export const loadImportedTable = (): { 
  contacts: Contact[]; 
  metadata?: { 
    fileName: string; 
    importDate: string; 
    source: 'csv' | 'xlsx' | 'supabase';
    totalRows: number;
    version: string;
    truncated?: boolean;
    truncatedFrom?: number;
    metadataOnly?: boolean;
    reason?: string;
  } 
} | null => {
  try {
    const saved = localStorage.getItem(IMPORTED_TABLE_KEY);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    
    // Validation basique des données
    if (!parsed.contacts || !Array.isArray(parsed.contacts)) {
      console.warn('⚠️ Format de table importée invalide, suppression...');
      clearImportedTable();
      return null;
    }
    
    // 📊 Gestion des différents cas de sauvegarde
    if (parsed.metadata?.metadataOnly) {
      console.log(`📂 Métadonnées chargées (${parsed.metadata.totalRows} contacts originaux - ${parsed.metadata.reason})`);
    } else if (parsed.metadata?.truncated) {
      console.log(`📂 Table tronquée chargée: ${parsed.contacts.length}/${parsed.metadata.truncatedFrom} contacts (${parsed.metadata?.fileName || 'Sans nom'})`);
    } else {
      console.log(`📂 Table importée chargée: ${parsed.contacts.length} contacts (${parsed.metadata?.fileName || 'Sans nom'})`);
    }
    
    return parsed;
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la table importée:', error);
    clearImportedTable();
    return null;
  }
};

/**
 * Suppression de la table importée sauvegardée
 */
export const clearImportedTable = (): void => {
  try {
    localStorage.removeItem(IMPORTED_TABLE_KEY);
    console.log('🗑️ Table importée supprimée');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la table importée:', error);
  }
};

/**
 * Vérification de l'existence d'une table importée
 */
export const hasImportedTable = (): boolean => {
  try {
    const saved = localStorage.getItem(IMPORTED_TABLE_KEY);
    return saved !== null && saved !== '';
  } catch {
    return false;
  }
};

/**
 * Nettoyage de la mémoire et optimisation pour les gros fichiers
 */
export const optimizeMemoryUsage = (): void => {
  try {
    // 🧹 Forcer le garbage collection si disponible (mode développement)
    if ((window as any).gc) {
      (window as any).gc();
      console.log('🧹 Garbage collection forcé');
    }
    
    // 📊 Afficher les informations mémoire si disponible
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      const used = Math.round(memory.usedJSHeapSize / 1048576);
      const total = Math.round(memory.totalJSHeapSize / 1048576);
      const limit = Math.round(memory.jsHeapSizeLimit / 1048576);
      
      console.log(`💾 Mémoire: ${used}MB utilisés / ${total}MB total (limite: ${limit}MB)`);
      
      // ⚠️ Avertissement si proche de la limite
      if (used / limit > 0.8) {
        console.warn(`⚠️ Utilisation mémoire élevée: ${Math.round((used / limit) * 100)}%`);
      }
    }
  } catch (error) {
    console.log('ℹ️ Informations mémoire non disponibles');
  }
};

/**
 * Vérification de l'espace disponible dans localStorage
 */
export const checkStorageQuota = (): { available: boolean; usedMB: number; percentage: number } => {
  try {
    // Estimer l'utilisation actuelle du localStorage
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    
    const usedMB = totalSize / (1024 * 1024);
    const estimatedLimit = 10; // ~10MB limite typique
    const percentage = (usedMB / estimatedLimit) * 100;
    
    console.log(`💽 LocalStorage: ${usedMB.toFixed(1)}MB utilisés (~${percentage.toFixed(0)}%)`);
    
    return {
      available: percentage < 80, // Considérer comme disponible si moins de 80%
      usedMB: usedMB,
      percentage: percentage
    };
  } catch (error) {
    console.warn('⚠️ Impossible de vérifier le quota localStorage');
    return { available: false, usedMB: 0, percentage: 100 };
  }
};

/**
 * Obtenir les métadonnées de la table importée sans charger les données
 */
export const getImportedTableMetadata = (): { 
  fileName: string; 
  importDate: string; 
  source: 'csv' | 'xlsx' | 'supabase';
  totalRows: number;
  version: string;
} | null => {
  try {
    const saved = localStorage.getItem(IMPORTED_TABLE_KEY);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    return parsed.metadata || null;
  } catch {
    return null;
  }
};

// ===== GOOGLE CALENDAR EXPORT UTILITIES =====

/**
 * Convertit une date du format YYYY-MM-DD vers MM/DD/YYYY pour Google Calendar
 */
export const formatDateForGoogleCalendar = (dateStr: string): string => {
  if (!dateStr || dateStr.trim() === '') {
    throw new Error('Date invalide pour le formatage Google Calendar');
  }
  
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) {
    throw new Error(`Format de date invalide: ${dateStr}. Attendu: YYYY-MM-DD`);
  }
  
  return `${month}/${day}/${year}`;
};

/**
 * Convertit une heure du format HH:mm vers HH:MM AM/PM pour Google Calendar
 */
export const formatTimeForGoogleCalendar = (timeStr: string): string => {
  if (!timeStr || timeStr.trim() === '') {
    return '';
  }
  
  const [hours, minutes] = timeStr.split(':');
  if (!hours || !minutes) {
    throw new Error(`Format d'heure invalide: ${timeStr}. Attendu: HH:mm`);
  }
  
  const hour24 = parseInt(hours, 10);
  const mins = parseInt(minutes, 10);
  
  if (isNaN(hour24) || isNaN(mins) || hour24 < 0 || hour24 > 23 || mins < 0 || mins > 59) {
    throw new Error(`Heure invalide: ${timeStr}`);
  }
  
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  
  return `${hour12}:${minutes.padStart(2, '0')} ${ampm}`;
};

/**
 * Retourne la même heure que l'heure de début (créneau de 0 minutes)
 */
export const calculateEndTime = (startTime: string): string => {
  if (!startTime || startTime.trim() === '') {
    return '';
  }
  
  const [hours, minutes] = startTime.split(':');
  if (!hours || !minutes) {
    throw new Error(`Format d'heure invalide: ${startTime}. Attendu: HH:mm`);
  }
  
  // Retourner la même heure (créneau de 0 minutes)
  return formatTimeForGoogleCalendar(startTime);
};

/**
 * Construit la description de l'événement de rappel avec les informations du contact
 */
export const buildReminderDescription = (contact: Contact): string => {
  const details = [];
  
  if (contact.telephone) details.push(`Téléphone: ${contact.telephone}`);
  if (contact.email) details.push(`Email: ${contact.email}`);
  if (contact.statut) details.push(`Statut: ${contact.statut}`);
  if (contact.source) details.push(`Source: ${contact.source}`);
  if (contact.commentaire) details.push(`Commentaire: ${contact.commentaire}`);
  
  return details.join('\n');
};

// ===== GOOGLE CALENDAR EXPORT MAIN FUNCTION =====

/**
 * Exporte les rappels de contacts vers un fichier CSV compatible Google Calendar
 */
export const exportGoogleCalendarCSV = (contacts: Contact[]): void => {
  // Filtrer les contacts ayant des dates de rappel définies
  const contactsWithReminders = contacts.filter(contact => 
    contact.dateRappel && contact.dateRappel.trim() !== ''
  );

  if (contactsWithReminders.length === 0) {
    throw new Error('Aucun rappel à exporter');
  }

  // Mapping vers le format Google Calendar
  const calendarEvents = contactsWithReminders.map(contact => {
    try {
      const startDate = formatDateForGoogleCalendar(contact.dateRappel);
      const startTime = contact.heureRappel ? formatTimeForGoogleCalendar(contact.heureRappel) : '';
      const endTime = contact.heureRappel ? calculateEndTime(contact.heureRappel) : '';
      const isAllDay = !contact.heureRappel || contact.heureRappel.trim() === '';

      return {
        'Subject': `Rappel: ${contact.prenom} ${contact.nom}`,
        'Start Date': startDate,
        'Start Time': startTime,
        'End Date': startDate,
        'End Time': endTime,
        'All Day Event': isAllDay ? 'True' : 'False',
        'Description': buildReminderDescription(contact),
        'Location': '',
        'Private': 'False'
      };
    } catch (error) {
      console.error(`Erreur lors du formatage du contact ${contact.prenom} ${contact.nom}:`, error);
      throw new Error(`Erreur de formatage pour le contact ${contact.prenom} ${contact.nom}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  });

  // Génération du CSV avec encodage UTF-8 BOM
  const csvContent = Papa.unparse(calendarEvents);
  const bom = '\uFEFF'; // UTF-8 BOM pour la compatibilité Google Calendar
  const blob = new Blob([bom + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Generate filename with format: google-calendar-export-YYYY-MM-DD-HH-MM-SS
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  const filename = `google-calendar-export-${timestamp}.csv`;
  
  // Téléchargement automatique du fichier
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Nettoyer l'URL pour libérer la mémoire
  URL.revokeObjectURL(url);
};