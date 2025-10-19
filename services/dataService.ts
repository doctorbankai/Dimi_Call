import { Contact, ContactStatus, ClientFile, EmailType, Civility } from '../types';
import { isValidUrl } from '../src/lib/utils';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import Papa from 'papaparse'; // For CSV parsing
import * as XLSX from 'xlsx'; // For Excel parsing and writing


const LOCAL_STORAGE_KEY = 'dimiCallContacts';
const CALL_STATES_KEY = 'dimiCallCallStates';

// Utility function to format phone numbers
export const formatPhoneNumber = (phoneStr: string): string => {
  // Remove all non-digit characters except +
  const cleaned = phoneStr.replace(/[^\d+]/g, '');
  
  // If it starts with +33, format as French number
  if (cleaned.startsWith('+33')) {
    const number = cleaned.slice(3);
    if (number.length === 9) {
      return `+33 ${number.slice(0, 1)} ${number.slice(1, 3)} ${number.slice(3, 5)} ${number.slice(5, 7)} ${number.slice(7, 9)}`;
    }
  }
  
  // If it starts with 0 and has 10 digits, format as French number
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  }
  
  // Return as-is if no formatting rule matches
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

// Fonction utilitaire pour supprimer les accents et normaliser les chaînes
const removeAccents = (str: string): string => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Fonction utilitaire pour normaliser complètement un header
const normalizeString = (str: string): string => {
  return removeAccents(str.trim().toLowerCase())
    .replace(/[^a-z0-9]/g, '') // Supprimer tous les caractères spéciaux, espaces, ponctuation
    .replace(/\s+/g, ''); // Supprimer les espaces multiples
};

// Normalize header names for CSV import with flexible detection
const normalizeHeader = (header: string): string => {
  // Nettoyage initial : supprimer espaces de début/fin, convertir en minuscules, supprimer accents
  const cleaned = normalizeString(header);
  
  // Mapping exhaustif avec toutes les variantes possibles
  const mapping: Record<string, string> = {
    // PRÉNOM - toutes variantes
    'prenom': 'prenom',
    'prénom': 'prenom',
    'firstname': 'prenom',
    'firstname': 'prenom',
    'firstnme': 'prenom',
    'fname': 'prenom',
    
    // NOM - toutes variantes  
    'nom': 'nom',
    'lastname': 'nom',
    'lastname': 'nom',
    'lastnam': 'nom',
    'lname': 'nom',
    'surname': 'nom',
    'familyname': 'nom',
    
    // TÉLÉPHONE/NUMÉRO - toutes variantes (très flexible)
    'telephone': 'telephone',
    'téléphone': 'telephone',
    'phone': 'telephone',
    'numero': 'telephone',
    'numéro': 'telephone',
    'number': 'telephone',
    'tel': 'telephone',
    'tél': 'telephone',
    'mobile': 'telephone',
    'gsm': 'telephone',
    'portable': 'telephone',
    'cellulaire': 'telephone',
    'cell': 'telephone',
    
    // EMAIL - toutes variantes
    'email': 'email',
    'mail': 'email',
    'mél': 'email',
    'mel': 'email',
    'courriel': 'email',
    'adressemail': 'email',
    'emailaddress': 'email',
    
    // SOURCE/ÉCOLE - toutes variantes (mapping vers 'source')
    'source': 'source',
    'école': 'source',
    'ecole': 'source',
    'origin': 'source',
    'origine': 'source',
    'etablissement': 'source',
    'établissement': 'source',
    'institution': 'source',
    'university': 'source',
    'universite': 'source',
    'université': 'source',
    'school': 'source',
    'ecolesource': 'source',
    'provenance': 'source',
    
    // STATUT - toutes variantes (mapping vers 'statut')
    'statut': 'statut',
    'statutappel': 'statut',
    'status': 'statut',
    'callstatus': 'statut',
    'état': 'statut',
    'etat': 'statut',
    'state': 'statut',
    
    // COMMENTAIRE - toutes variantes (mapping vers 'commentaire')
    'commentaire': 'commentaire',
    'commentaires': 'commentaire',
    'commentairesappel': 'commentaire',
    'comment': 'commentaire',
    'comments': 'commentaire',
    'note': 'commentaire',
    'notes': 'commentaire',
    'remarque': 'commentaire',
    'remarques': 'commentaire',
    'observation': 'commentaire',
    'observations': 'commentaire',
    
    // SEXE - toutes variantes
    'sexe': 'sexe',
    'genre': 'sexe',
    'gender': 'sexe',
    'civilité': 'sexe',
    'civilite': 'sexe',
    'civility': 'sexe',
    
    // TYPE - toutes variantes
    'type': 'type',
    'catégorie': 'type',
    'categorie': 'type',
    'category': 'type',
    'typologie': 'type',
    
    // QUALITÉ - toutes variantes
    'qualité': 'qualite',
    'qualite': 'qualite',
    'quality': 'qualite',
    'niveau': 'qualite',
    'grade': 'qualite',
    
    // DATE RAPPEL - toutes variantes
    'daterappel': 'dateRappel',
    'datederappel': 'dateRappel',
    'rappeldate': 'dateRappel',
    'callbackdate': 'dateRappel',
    
    // HEURE RAPPEL - toutes variantes
    'heurerappel': 'heureRappel',
    'heurederappel': 'heureRappel',
    'rappelheure': 'heureRappel',
    'callbacktime': 'heureRappel',
    
    // DATE APPEL - toutes variantes
    'dateappel': 'dateAppel',
    'datedappel': 'dateAppel',
    'appeldate': 'dateAppel',
    'calldate': 'dateAppel',
    
    // DATE RDV - toutes variantes
    'daterdv': 'dateRDV',
    'daterendezous': 'dateRDV',
    'rdvdate': 'dateRDV',
    'appointmentdate': 'dateRDV',
    
    // HEURE RDV - toutes variantes
    'heurerdv': 'heureRDV',
    'heurerendezous': 'heureRDV',
    'rdvheure': 'heureRDV',
    'appointmenttime': 'heureRDV',
    
    // DURÉE APPEL - toutes variantes
    'dureeappel': 'dureeAppel',
    'dureedappel': 'dureeAppel',
    'callduration': 'dureeAppel',
    'duration': 'dureeAppel',
    'duree': 'dureeAppel',
    
    // LIEN - toutes variantes
    'lien': 'lien',
    'link': 'lien',
    'url': 'lien',
    'site': 'lien',
    'website': 'lien',
    'siteweb': 'lien',
    'siteinternet': 'lien',
    'webpage': 'lien',
    'weblink': 'lien'
  };
  
  // Recherche directe avec le header normalisé
  if (mapping[cleaned]) {
    return mapping[cleaned];
  }
  
  // Recherche par correspondance partielle pour plus de flexibilité
  for (const [key, value] of Object.entries(mapping)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      console.log(`🔍 Correspondance partielle trouvée: "${header}" → "${key}" → "${value}"`);
      return value;
    }
  }
  
  // Si aucun mapping trouvé, retourner le header nettoyé
  console.warn(`⚠️ En-tête non reconnu: "${header}" → "${cleaned}"`);
  return cleaned;
};

// Import contacts from file (CSV or Excel)
export const importContactsFromFile = async (file: File): Promise<Contact[]> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (fileExtension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => normalizeHeader(header.trim()),
        complete: (results) => {
          try {
            const contacts: Contact[] = results.data.map((row: any, index: number) => {
              // Validation de l'URL si présente
              const lienValue = row.lien || '';
              if (lienValue && !isValidUrl(lienValue)) {
                console.warn(`⚠️ URL invalide pour le contact ligne ${index + 1}: "${lienValue}"`);
              }
              
              return {
                id: uuidv4(),
                numeroLigne: index + 1,
                prenom: row.prenom || '',
                nom: row.nom || '',
                telephone: formatPhoneNumber(row.telephone || ''),
                email: row.email || '',
                source: row.source || '', // Changé de 'ecole' vers 'source'
                statut: Object.values(ContactStatus).includes(row.statut) ? row.statut : ContactStatus.NonDefini,
                commentaire: row.commentaire || '',
                dateRappel: row.dateRappel || '',
                heureRappel: row.heureRappel || '',
                dateRDV: row.dateRDV || '',
                heureRDV: row.heureRDV || '',
                dateAppel: row.dateAppel || '',
                heureAppel: row.heureAppel || '',
                dureeAppel: row.dureeAppel || '',
                // Ajouter les nouveaux champs optionnels
                sexe: row.sexe || '',
                type: row.type || '',
                qualite: row.qualite || '',
                lien: lienValue
              };
            });
            resolve(contacts);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            reject(new Error('Le fichier Excel doit contenir au moins une ligne d\'en-têtes et une ligne de données'));
            return;
          }
          
          const headers = (jsonData[0] as string[]).map(h => normalizeHeader(h.toString().trim()));
          const contacts: Contact[] = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            const contact: Contact = {
              id: uuidv4(),
              numeroLigne: i,
              prenom: '',
              nom: '',
              telephone: '',
              email: '',
              source: '', // Changé de 'ecole' vers 'source'
              statut: ContactStatus.NonDefini,
              commentaire: '',
              dateRappel: '',
              heureRappel: '',
              dateRDV: '',
              heureRDV: '',
              dateAppel: '',
              heureAppel: '',
              dureeAppel: '',
              // Ajouter les nouveaux champs optionnels
              sexe: '',
              type: '',
              qualite: '',
              lien: ''
            };
            
            headers.forEach((header, index) => {
              const value = row[index]?.toString() || '';
              switch (header) {
                case 'prenom':
                  contact.prenom = value;
                  break;
                case 'nom':
                  contact.nom = value;
                  break;
                case 'telephone':
                  contact.telephone = formatPhoneNumber(value);
                  break;
                case 'email':
                  contact.email = value;
                  break;
                case 'source':
                  contact.source = value;
                  break;
                case 'sexe':
                  contact.sexe = value;
                  break;
                case 'type':
                  contact.type = value;
                  break;
                case 'qualite':
                  contact.qualite = value;
                  break;
                case 'lien':
                  // Validation de l'URL lors de l'importation
                  if (value && !isValidUrl(value)) {
                    console.warn(`⚠️ URL invalide pour le contact ligne ${i}: "${value}"`);
                  }
                  contact.lien = value;
                  break;
                case 'statut':
                  contact.statut = Object.values(ContactStatus).includes(value as ContactStatus) ? value as ContactStatus : ContactStatus.NonDefini;
                  break;
                case 'commentaire':
                  contact.commentaire = value;
                  break;
              }
            });
            
            contacts.push(contact);
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
  // Nouvel ordre des colonnes selon les spécifications
  const headers = [
    'Date Rappel',      // 1
    'Heure Rappel',     // 2
    'Sexe',             // 3
    'Prénom',           // 4
    'Nom',              // 5
    'Numéro',           // 6 (renommé de "Téléphone")
    'Mail',             // 7
    'Source',           // 8 (renommé de "École/Source")
    'Type',             // 9
    'Qualité',          // 10
    'Date Appel',       // 11
    'Statut Appel',     // 12 (renommé de "Statut")
    'Commentaires Appel' // 13 (renommé de "Commentaire")
  ];

  // Mapping des données selon le nouvel ordre
  const data = contacts.map(contact => [
    contact.dateRappel || '',      // Date Rappel
    contact.heureRappel || '',     // Heure Rappel
    contact.sexe || '',            // Sexe
    contact.prenom || '',          // Prénom
    contact.nom || '',             // Nom
    contact.telephone || '',       // Numéro (anciennement Téléphone)
    contact.email || '',           // Mail
    contact.source || '',          // Source (anciennement École/Source)
    contact.type || '',            // Type
    contact.qualite || '',         // Qualité
    contact.dateAppel || '',       // Date Appel
    contact.statut || '',          // Statut Appel (anciennement Statut)
    contact.commentaire || ''      // Commentaires Appel (anciennement Commentaire)
  ]);

  if (format === 'csv') {
    const csvContent = Papa.unparse([headers, ...data]);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (format === 'xlsx') {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
    XLSX.writeFile(workbook, `contacts_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
};

// Fonction auxiliaire pour construire le champ Notes pour Google Contacts
const buildNotesField = (contact: Contact): string => {
  const notes = [];
  
  if (contact.commentaire) {
    notes.push(`Commentaire: ${contact.commentaire}`);
  }
  
  if (contact.source) {
    notes.push(`Source: ${contact.source}`);
  }
  
  if (contact.dateRappel) {
    notes.push(`Date rappel: ${contact.dateRappel}`);
    if (contact.heureRappel) {
      notes.push(`Heure rappel: ${contact.heureRappel}`);
    }
  }
  
  if (contact.dateRDV) {
    notes.push(`Date RDV: ${contact.dateRDV}`);
    if (contact.heureRDV) {
      notes.push(`Heure RDV: ${contact.heureRDV}`);
    }
  }
  
  if (contact.dateAppel) {
    notes.push(`Date appel: ${contact.dateAppel}`);
    if (contact.heureAppel) {
      notes.push(`Heure appel: ${contact.heureAppel}`);
    }
  }
  
  notes.push(`Statut: ${contact.statut}`);
  
  return notes.join(' | ');
};

// Export contacts to Google Contacts CSV format
export const exportGoogleContactsCSV = (contacts: Contact[]): void => {
  // Filtrer les contacts par statut (À rappeler, D0, R0)
  const filteredContacts = contacts.filter(contact => 
    contact.statut === ContactStatus.ARappeler ||
    contact.statut === ContactStatus.D0 ||
    contact.statut === ContactStatus.R0
  );

  if (filteredContacts.length === 0) {
    throw new Error('Aucun contact à exporter avec les statuts sélectionnés');
  }

  // Mapping vers le format Google Contacts
  const googleContactsData = filteredContacts.map(contact => ({
    'Given Name': contact.prenom || '',
    'Family Name': contact.nom || '',
    'Phone 1 - Value': contact.telephone || '',
    'E-mail 1 - Value': contact.email || '',
    'Notes': buildNotesField(contact)
  }));

  // Génération du CSV avec encodage UTF-8 BOM
  const csvContent = Papa.unparse(googleContactsData);
  const bom = '\uFEFF'; // UTF-8 BOM pour la compatibilité Google Contacts
  const blob = new Blob([bom + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Téléchargement du fichier
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `google-contacts-export-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateGmailComposeUrl = (
  emailTo: string,
  nom: string, // Full name (Prénom Nom)
  emailType: EmailType,
  civility: Civility,
  signatureName: string = ""
): string => {
  const titre = civility === Civility.Monsieur ? "Monsieur" : "Madame";
  const contactLastName = nom.split(' ').slice(1).join(' ') || nom; // Attempt to get last name

  const params: Record<string, string> = {
    view: 'cm',
    fs: '1',
    tf: '1',
    to: emailTo,
  };
  let subject = "";
  let bodyTemplate = "";

  const commonPart =
    `Pour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, ` +
    `d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), ` +
    `puis de vous donner un diagnostic de votre situation. Notre métier est de vous apporter un conseil pertinent et personnalisé sur ` +
    `l'optimisation de votre patrimoine.\n\n` +
    `Vous pouvez également visiter notre site internet pour de plus amples renseignements : www.arcanis-conseil.fr\n\n` +
    `N'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.\n\n` +
    `Bien cordialement,${signatureName ? `\n${signatureName}` : ''}`;

  switch (emailType) {
    case EmailType.D0Visio:
      subject = "Confirmation rendez-vous visio - Arcanis Conseil";
      bodyTemplate =
        `Bonjour ${titre} ${contactLastName},\n\n` +
        `Merci pour votre temps lors de notre échange téléphonique.\n\n` +
        `Suite à notre appel, je vous confirme notre entretien du [DATE ET HEURE] en visio.\n\n${commonPart}`;
      break;
    case EmailType.R0Interne:
      subject = "Confirmation rendez-vous présentiel - Arcanis Conseil";
      bodyTemplate =
        `Bonjour ${titre} ${contactLastName},\n\n` +
        `Merci pour votre temps lors de notre échange téléphonique.\n\n` +
        `Suite à notre appel, je vous confirme notre entretien du [DATE ET HEURE] dans nos locaux au 22 rue la Boétie, 75008 Paris.\n\n${commonPart}`;
      break;
    case EmailType.R0Externe:
      subject = "Confirmation rendez-vous présentiel - Arcanis Conseil";
      bodyTemplate =
        `Bonjour ${titre} ${contactLastName},\n\n` +
        `Merci pour votre temps lors de notre échange téléphonique.\n\n` +
        `Suite à notre appel, je vous confirme notre entretien du [DATE ET HEURE] à [ADRESSE CLIENT].\n\n${commonPart}`;
      break;
    case EmailType.PremierContact:
      subject = "Arcanis Conseil - Premier Contact";
      bodyTemplate =
        `Bonjour ${titre} ${contactLastName},\n\n` +
        `Pour resituer mon appel, je suis gérant privé au sein du cabinet de gestion de patrimoine Arcanis Conseil. ` +
        `Je vous envoie l'adresse de notre site web que vous puissiez en savoir d'avantage : https://arcanis-conseil.fr\n\n` +
        `Le site est avant tout une vitrine, le mieux est de m'appeler si vous souhaitez davantage d'informations ` +
        `ou de prendre un créneau de 30 minutes dans mon agenda via ce lien : https://calendly.com/dimitri-morel-arcanis-conseil/audit\n\n` +
        `Bien à vous,${signatureName ? `\n${signatureName}` : ''}`;
      break;
  }

  const finalBody = bodyTemplate
    .replace("[DATE ET HEURE]", "date et heure à déterminer")
    .replace("[ADRESSE CLIENT]", "l'adresse que vous m'avez communiquée");

  params['su'] = subject;
  params['body'] = finalBody;

  const queryParams = new URLSearchParams(params);
  return `https://mail.google.com/mail/u/0/?${queryParams.toString()}`;
};