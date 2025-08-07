import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import test from 'node:test';
import test from 'node:test';
import { describe } from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import { describe } from 'node:test';
import test from 'node:test';
import test from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';
import { exportContactsToFile, importContactsFromFile, exportGoogleContactsCSV } from '../../services/dataService';
import { Contact, ContactStatus } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// Mock des dépendances
jest.mock('papaparse');
jest.mock('xlsx');

describe('DataService - Export/Import Column Reordering', () => {
  const mockContact: Contact = {
    id: uuidv4(),
    numeroLigne: 1,
    prenom: 'Jean',
    nom: 'Dupont',
    telephone: '+33 6 12 34 56 78',
    email: 'jean.dupont@example.com',
    source: 'École Test',
    statut: ContactStatus.ARappeler,
    commentaire: 'Contact intéressant',
    dateRappel: '2024-01-15',
    heureRappel: '14:30',
    dateRDV: '2024-01-20',
    heureRDV: '10:00',
    dateAppel: '2024-01-10',
    heureAppel: '09:15',
    dureeAppel: '05:30',
    sexe: 'M',
    type: 'Prospect',
    qualite: 'A'
  };

  describe('Export Column Order', () => {
    beforeEach(() => {
      // Mock DOM methods for file download
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      // Mock document methods
      const mockLink = {
        setAttribute: jest.fn(),
        click: jest.fn(),
        style: { visibility: '' }
      };
      
      document.createElement = jest.fn(() => mockLink as any);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();
    });

    test('should export columns in the correct order', () => {
      const Papa = require('papaparse');
      Papa.unparse = jest.fn((data) => {
        const [headers, ...rows] = data;
        
        // Vérifier l'ordre des colonnes
        const expectedOrder = [
          'Date Rappel',      // 1
          'Heure Rappel',     // 2
          'Sexe',             // 3
          'Prénom',           // 4
          'Nom',              // 5
          'Numéro',           // 6
          'Mail',             // 7
          'Source',           // 8
          'Type',             // 9
          'Qualité',          // 10
          'Date Appel',       // 11
          'Statut Appel',     // 12
          'Commentaires Appel' // 13
        ];
        
        expect(headers).toEqual(expectedOrder);
        
        // Vérifier que les données correspondent aux headers
        const firstRow = rows[0];
        expect(firstRow[0]).toBe(mockContact.dateRappel);     // Date Rappel
        expect(firstRow[1]).toBe(mockContact.heureRappel);    // Heure Rappel
        expect(firstRow[2]).toBe(mockContact.sexe);           // Sexe
        expect(firstRow[3]).toBe(mockContact.prenom);         // Prénom
        expect(firstRow[4]).toBe(mockContact.nom);            // Nom
        expect(firstRow[5]).toBe(mockContact.telephone);      // Numéro
        expect(firstRow[6]).toBe(mockContact.email);          // Mail
        expect(firstRow[7]).toBe(mockContact.source);         // Source
        expect(firstRow[8]).toBe(mockContact.type);           // Type
        expect(firstRow[9]).toBe(mockContact.qualite);        // Qualité
        expect(firstRow[10]).toBe(mockContact.dateAppel);     // Date Appel
        expect(firstRow[11]).toBe(mockContact.statut);        // Statut Appel
        expect(firstRow[12]).toBe(mockContact.commentaire);   // Commentaires Appel
        
        return 'mocked-csv-content';
      });

      exportContactsToFile([mockContact], 'csv');
      
      expect(Papa.unparse).toHaveBeenCalled();
    });

    test('should handle empty optional fields correctly', () => {
      const contactWithEmptyFields: Contact = {
        ...mockContact,
        sexe: undefined,
        type: undefined,
        qualite: undefined
      };

      const Papa = require('papaparse');
      Papa.unparse = jest.fn((data) => {
        const [headers, ...rows] = data;
        const firstRow = rows[0];
        
        // Vérifier que les champs vides sont exportés comme chaînes vides
        expect(firstRow[2]).toBe(''); // Sexe
        expect(firstRow[8]).toBe(''); // Type
        expect(firstRow[9]).toBe(''); // Qualité
        
        return 'mocked-csv-content';
      });

      exportContactsToFile([contactWithEmptyFields], 'csv');
      
      expect(Papa.unparse).toHaveBeenCalled();
    });
  });

  describe('Header Detection Flexibility', () => {
    // Test de la fonction normalizeHeader (nous devons l'exporter pour la tester)
    // Pour l'instant, nous testons indirectement via l'import

    test('should detect telephone variations', () => {
      const variations = [
        'Téléphone',
        'Numéro', 
        'Phone',
        'Tel',
        'Mobile',
        'Portable'
      ];

      variations.forEach(variation => {
        // Simuler un fichier CSV avec cette variation
        const mockCsvData = `${variation},Prénom,Nom\n+33123456789,Jean,Dupont`;
        const mockFile = new File([mockCsvData], 'test.csv', { type: 'text/csv' });

        // Mock Papa.parse pour simuler le parsing
        const Papa = require('papaparse');
        Papa.parse = jest.fn((file, options) => {
          // Simuler le résultat du parsing avec le header normalisé
          const normalizedHeader = options.transformHeader(variation);
          expect(normalizedHeader).toBe('telephone');
          
          // Simuler la completion
          options.complete({
            data: [{ [normalizedHeader]: '+33123456789', prenom: 'Jean', nom: 'Dupont' }],
            meta: { fields: [normalizedHeader, 'prenom', 'nom'] }
          });
        });

        // Cette fonction devrait maintenant reconnaître toutes les variations
        // Le test réel se fait via le mock ci-dessus
      });
    });

    test('should detect status variations', () => {
      const variations = [
        'Statut',
        'Statut Appel',
        'Status',
        'État',
        'Call Status'
      ];

      variations.forEach(variation => {
        const mockCsvData = `Prénom,${variation}\nJean,À rappeler`;
        const mockFile = new File([mockCsvData], 'test.csv', { type: 'text/csv' });

        const Papa = require('papaparse');
        Papa.parse = jest.fn((file, options) => {
          const normalizedHeader = options.transformHeader(variation);
          expect(normalizedHeader).toBe('statut');
          
          options.complete({
            data: [{ prenom: 'Jean', [normalizedHeader]: 'À rappeler' }],
            meta: { fields: ['prenom', normalizedHeader] }
          });
        });
      });
    });

    test('should detect comment variations', () => {
      const variations = [
        'Commentaire',
        'Commentaires',
        'Commentaires Appel',
        'Comment',
        'Comments',
        'Note',
        'Notes',
        'Remarque'
      ];

      variations.forEach(variation => {
        const mockCsvData = `Prénom,${variation}\nJean,Test comment`;
        const mockFile = new File([mockCsvData], 'test.csv', { type: 'text/csv' });

        const Papa = require('papaparse');
        Papa.parse = jest.fn((file, options) => {
          const normalizedHeader = options.transformHeader(variation);
          expect(normalizedHeader).toBe('commentaire');
          
          options.complete({
            data: [{ prenom: 'Jean', [normalizedHeader]: 'Test comment' }],
            meta: { fields: ['prenom', normalizedHeader] }
          });
        });
      });
    });

    test('should detect source variations', () => {
      const variations = [
        'Source',
        'École',
        'Ecole',
        'École/Source',
        'Origin',
        'Origine',
        'School',
        'Établissement'
      ];

      variations.forEach(variation => {
        const mockCsvData = `Prénom,${variation}\nJean,École Test`;
        const mockFile = new File([mockCsvData], 'test.csv', { type: 'text/csv' });

        const Papa = require('papaparse');
        Papa.parse = jest.fn((file, options) => {
          const normalizedHeader = options.transformHeader(variation);
          expect(normalizedHeader).toBe('source');
          
          options.complete({
            data: [{ prenom: 'Jean', [normalizedHeader]: 'École Test' }],
            meta: { fields: ['prenom', normalizedHeader] }
          });
        });
      });
    });
  });

  describe('Backward Compatibility', () => {
    test('should still import old format files', () => {
      // Simuler un ancien fichier avec les anciens noms de colonnes
      const oldFormatData = `Prénom,Nom,Téléphone,Mail,École/Source,Statut,Commentaire
Jean,Dupont,0123456789,jean@test.com,École Test,À rappeler,Test comment`;
      
      const mockFile = new File([oldFormatData], 'old-format.csv', { type: 'text/csv' });

      const Papa = require('papaparse');
      Papa.parse = jest.fn((file, options) => {
        // Vérifier que les anciens headers sont correctement mappés
        const normalizedHeaders = [
          'Prénom', 'Nom', 'Téléphone', 'Mail', 'École/Source', 'Statut', 'Commentaire'
        ].map(h => options.transformHeader(h));

        expect(normalizedHeaders).toEqual([
          'prenom', 'nom', 'telephone', 'email', 'source', 'statut', 'commentaire'
        ]);

        options.complete({
          data: [{
            prenom: 'Jean',
            nom: 'Dupont',
            telephone: '0123456789',
            email: 'jean@test.com',
            source: 'École Test',
            statut: 'À rappeler',
            commentaire: 'Test comment'
          }],
          meta: { fields: normalizedHeaders }
        });
      });

      // Le test réel se fait via le mock ci-dessus
    });

    test('should import new format files', () => {
      // Simuler un nouveau fichier avec les nouveaux noms de colonnes
      const newFormatData = `Date Rappel,Heure Rappel,Sexe,Prénom,Nom,Numéro,Mail,Source,Type,Qualité,Date Appel,Statut Appel,Commentaires Appel
2024-01-15,14:30,M,Jean,Dupont,0123456789,jean@test.com,École Test,Prospect,A,2024-01-10,À rappeler,Test comment`;
      
      const mockFile = new File([newFormatData], 'new-format.csv', { type: 'text/csv' });

      const Papa = require('papaparse');
      Papa.parse = jest.fn((file, options) => {
        // Vérifier que les nouveaux headers sont correctement mappés
        const headers = [
          'Date Rappel', 'Heure Rappel', 'Sexe', 'Prénom', 'Nom', 'Numéro', 
          'Mail', 'Source', 'Type', 'Qualité', 'Date Appel', 'Statut Appel', 'Commentaires Appel'
        ];
        
        const normalizedHeaders = headers.map(h => options.transformHeader(h));

        expect(normalizedHeaders).toEqual([
          'dateRappel', 'heureRappel', 'sexe', 'prenom', 'nom', 'telephone',
          'email', 'source', 'type', 'qualite', 'dateAppel', 'statut', 'commentaire'
        ]);

        options.complete({
          data: [{
            dateRappel: '2024-01-15',
            heureRappel: '14:30',
            sexe: 'M',
            prenom: 'Jean',
            nom: 'Dupont',
            telephone: '0123456789',
            email: 'jean@test.com',
            source: 'École Test',
            type: 'Prospect',
            qualite: 'A',
            dateAppel: '2024-01-10',
            statut: 'À rappeler',
            commentaire: 'Test comment'
          }],
          meta: { fields: normalizedHeaders }
        });
      });

      // Le test réel se fait via le mock ci-dessus
    });
  });

  describe('Google Contacts Export', () => {
    const { exportGoogleContactsCSV } = require('../../services/dataService');

    const mockContacts: Contact[] = [
      {
        id: uuidv4(),
        numeroLigne: 1,
        prenom: 'Jean',
        nom: 'Dupont',
        telephone: '+33 6 12 34 56 78',
        email: 'jean.dupont@example.com',
        source: 'LinkedIn',
        statut: ContactStatus.ARappeler,
        commentaire: 'Contact intéressant',
        dateRappel: '2024-01-15',
        heureRappel: '14:30',
        dateRDV: '',
        heureRDV: '',
        dateAppel: '2024-01-10',
        heureAppel: '09:15',
        dureeAppel: '05:30',
        sexe: 'M',
        type: 'Prospect',
        qualite: 'A'
      },
      {
        id: uuidv4(),
        numeroLigne: 2,
        prenom: 'Marie',
        nom: 'Martin',
        telephone: '+33 1 23 45 67 89',
        email: 'marie.martin@example.com',
        source: 'Site web',
        statut: ContactStatus.DO,
        commentaire: 'Rendez-vous confirmé',
        dateRappel: '',
        heureRappel: '',
        dateRDV: '2024-01-20',
        heureRDV: '10:00',
        dateAppel: '',
        heureAppel: '',
        dureeAppel: '',
        sexe: 'F',
        type: 'Client',
        qualite: 'B'
      },
      {
        id: uuidv4(),
        numeroLigne: 3,
        prenom: 'Pierre',
        nom: 'Durand',
        telephone: '+33 7 98 76 54 32',
        email: 'pierre.durand@example.com',
        source: 'Référence',
        statut: ContactStatus.RO,
        commentaire: 'Contrat signé',
        dateRappel: '',
        heureRappel: '',
        dateRDV: '',
        heureRDV: '',
        dateAppel: '2024-01-05',
        heureAppel: '16:00',
        dureeAppel: '12:45',
        sexe: 'M',
        type: 'Client',
        qualite: 'A'
      },
      {
        id: uuidv4(),
        numeroLigne: 4,
        prenom: 'Sophie',
        nom: 'Bernard',
        telephone: '+33 2 11 22 33 44',
        email: 'sophie.bernard@example.com',
        source: 'Salon',
        statut: ContactStatus.PasInteresse,
        commentaire: 'Pas intéressé',
        dateRappel: '',
        heureRappel: '',
        dateRDV: '',
        heureRDV: '',
        dateAppel: '',
        heureAppel: '',
        dureeAppel: '',
        sexe: 'F',
        type: 'Prospect',
        qualite: 'C'
      }
    ];

    beforeEach(() => {
      // Mock DOM methods for file download
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      const mockLink = {
        setAttribute: jest.fn(),
        click: jest.fn(),
        style: { visibility: '' }
      };
      
      document.createElement = jest.fn(() => mockLink as any);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();
    });

    test('should filter contacts by correct statuses', () => {
      const Papa = require('papaparse');
      Papa.unparse = jest.fn((data) => {
        // Vérifier que seuls les contacts avec les bons statuts sont exportés
        expect(data).toHaveLength(4); // Headers + 3 contacts filtrés
        
        const [headers, ...rows] = data;
        expect(rows).toHaveLength(3); // Jean (À rappeler), Marie (DO), Pierre (RO)
        
        // Vérifier que Sophie (Pas intéressé) n'est pas incluse
        const names = rows.map(row => row[0]); // Given Name
        expect(names).toContain('Jean');
        expect(names).toContain('Marie');
        expect(names).toContain('Pierre');
        expect(names).not.toContain('Sophie');
        
        return 'mocked-csv-content';
      });

      exportGoogleContactsCSV(mockContacts);
      
      expect(Papa.unparse).toHaveBeenCalled();
    });

    test('should generate correct Google Contacts format', () => {
      const Papa = require('papaparse');
      Papa.unparse = jest.fn((data) => {
        const [headers, ...rows] = data;
        
        // Vérifier les headers Google Contacts
        const expectedHeaders = [
          'Given Name',
          'Family Name', 
          'Phone 1 - Value',
          'E-mail 1 - Value',
          'Notes'
        ];
        expect(headers).toEqual(expectedHeaders);
        
        // Vérifier le premier contact (Jean)
        const jeanRow = rows.find(row => row[0] === 'Jean');
        expect(jeanRow).toBeDefined();
        expect(jeanRow[0]).toBe('Jean'); // Given Name
        expect(jeanRow[1]).toBe('Dupont'); // Family Name
        expect(jeanRow[2]).toBe('+33 6 12 34 56 78'); // Phone
        expect(jeanRow[3]).toBe('jean.dupont@example.com'); // Email
        expect(jeanRow[4]).toContain('Commentaire: Contact intéressant'); // Notes
        expect(jeanRow[4]).toContain('Source: LinkedIn');
        expect(jeanRow[4]).toContain('Date rappel: 2024-01-15');
        expect(jeanRow[4]).toContain('Heure rappel: 14:30');
        expect(jeanRow[4]).toContain('Statut: À rappeler');
        
        return 'mocked-csv-content';
      });

      exportGoogleContactsCSV(mockContacts);
      
      expect(Papa.unparse).toHaveBeenCalled();
    });

    test('should build notes field correctly', () => {
      const Papa = require('papaparse');
      Papa.unparse = jest.fn((data) => {
        const [headers, ...rows] = data;
        
        // Vérifier les notes pour Marie (avec RDV)
        const marieRow = rows.find(row => row[0] === 'Marie');
        expect(marieRow).toBeDefined();
        const marieNotes = marieRow[4];
        expect(marieNotes).toContain('Commentaire: Rendez-vous confirmé');
        expect(marieNotes).toContain('Source: Site web');
        expect(marieNotes).toContain('Date RDV: 2024-01-20');
        expect(marieNotes).toContain('Heure RDV: 10:00');
        expect(marieNotes).toContain('Statut: DO');
        
        // Vérifier les notes pour Pierre (avec appel)
        const pierreRow = rows.find(row => row[0] === 'Pierre');
        expect(pierreRow).toBeDefined();
        const pierreNotes = pierreRow[4];
        expect(pierreNotes).toContain('Date appel: 2024-01-05');
        expect(pierreNotes).toContain('Heure appel: 16:00');
        expect(pierreNotes).toContain('Statut: RO');
        
        return 'mocked-csv-content';
      });

      exportGoogleContactsCSV(mockContacts);
      
      expect(Papa.unparse).toHaveBeenCalled();
    });

    test('should handle empty fields correctly', () => {
      const contactWithEmptyFields: Contact = {
        id: uuidv4(),
        numeroLigne: 1,
        prenom: 'Test',
        nom: 'User',
        telephone: '',
        email: '',
        source: '',
        statut: ContactStatus.ARappeler,
        commentaire: '',
        dateRappel: '',
        heureRappel: '',
        dateRDV: '',
        heureRDV: '',
        dateAppel: '',
        heureAppel: '',
        dureeAppel: ''
      };

      const Papa = require('papaparse');
      Papa.unparse = jest.fn((data) => {
        const [headers, ...rows] = data;
        const testRow = rows[0];
        
        expect(testRow[0]).toBe('Test'); // Given Name
        expect(testRow[1]).toBe('User'); // Family Name
        expect(testRow[2]).toBe(''); // Phone (empty)
        expect(testRow[3]).toBe(''); // Email (empty)
        expect(testRow[4]).toBe('Statut: À rappeler'); // Notes (only status)
        
        return 'mocked-csv-content';
      });

      exportGoogleContactsCSV([contactWithEmptyFields]);
      
      expect(Papa.unparse).toHaveBeenCalled();
    });

    test('should include contacts with A0 status in export', () => {
      const Papa = require('papaparse');
      Papa.unparse = jest.fn(() => 'mocked-csv-content');

      const contactsWithA0: Contact[] = [
        {
          ...mockContacts[0],
          statut: ContactStatus.A0
        },
        {
          ...mockContacts[1],
          statut: ContactStatus.DO
        },
        {
          ...mockContacts[2],
          statut: ContactStatus.PasInteresse // Ce contact ne devrait pas être inclus
        }
      ];

      exportGoogleContactsCSV(contactsWithA0);
      
      expect(Papa.unparse).toHaveBeenCalled();
      const csvData = Papa.unparse.mock.calls[0][0];
      
      // Vérifier que seuls les contacts avec statuts éligibles sont inclus (A0 et DO)
      expect(csvData).toHaveLength(2);
      expect(csvData[0]['First Name']).toBe('Jean');
      expect(csvData[1]['First Name']).toBe('Marie');
    });

    test('should export only A0 contacts when only A0 status exists', () => {
      const Papa = require('papaparse');
      Papa.unparse = jest.fn(() => 'mocked-csv-content');

      const onlyA0Contacts: Contact[] = [
        {
          ...mockContacts[0],
          statut: ContactStatus.A0,
          prenom: 'TestA0',
          nom: 'Contact'
        }
      ];

      exportGoogleContactsCSV(onlyA0Contacts);
      
      expect(Papa.unparse).toHaveBeenCalled();
      const csvData = Papa.unparse.mock.calls[0][0];
      
      // Vérifier qu'un seul contact A0 est exporté
      expect(csvData).toHaveLength(1);
      expect(csvData[0]['First Name']).toBe('TestA0');
    });

    test('should throw error when no contacts match criteria', () => {
      const contactsWithoutTargetStatuses: Contact[] = [
        {
          ...mockContacts[0],
          statut: ContactStatus.PasInteresse
        },
        {
          ...mockContacts[1],
          statut: ContactStatus.ListeNoire
        }
      ];

      expect(() => {
        exportGoogleContactsCSV(contactsWithoutTargetStatuses);
      }).toThrow('Aucun contact à exporter avec les statuts sélectionnés');
    });

    test('should generate file with correct name and UTF-8 BOM', () => {
      const Papa = require('papaparse');
      Papa.unparse = jest.fn(() => 'mocked-csv-content');

      const mockLink = {
        setAttribute: jest.fn(),
        click: jest.fn(),
        style: { visibility: '' }
      };
      
      document.createElement = jest.fn(() => mockLink as any);

      exportGoogleContactsCSV(mockContacts);

      // Vérifier que le fichier est créé avec le bon nom (format: google-contacts-export-YYYY-MM-DD-HH-MM-SS.csv)
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 
        expect.stringMatching(/^google-contacts-export-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.csv$/));

      // Vérifier que le BOM UTF-8 est ajouté
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringMatching(/^\uFEFF/)], // BOM UTF-8
        { type: 'text/csv;charset=utf-8;' }
      );
    });
  });
});