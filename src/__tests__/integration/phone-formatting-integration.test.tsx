import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContactTable } from '../../components/ContactTable';
import { Contact, ContactStatus, Theme } from '../../types';
import { formatPhoneNumber } from '../../services/dataService';

// Mock data with problematic phone number formats
const mockContactsWithProblematicPhones: Contact[] = [
  {
    id: '1',
    numeroLigne: 1,
    prenom: 'Jean',
    nom: 'Dupont',
    telephone: '0069540063', // Truncated with 00 prefix
    email: 'jean@example.com',
    statut: ContactStatus.NonDefini,
    commentaire: '',
    source: 'Test',
    dateRappel: '',
    heureRappel: '',
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: ''
  },
  {
    id: '2',
    numeroLigne: 2,
    prenom: 'Marie',
    nom: 'Martin',
    telephone: '+033610291377', // Malformed +033 prefix
    email: 'marie@example.com',
    statut: ContactStatus.NonDefini,
    commentaire: '',
    source: 'Test',
    dateRappel: '',
    heureRappel: '',
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: ''
  },
  {
    id: '3',
    numeroLigne: 3,
    prenom: 'Pierre',
    nom: 'Durand',
    telephone: '06551215174', // Extra digit
    email: 'pierre@example.com',
    statut: ContactStatus.NonDefini,
    commentaire: '',
    source: 'Test',
    dateRappel: '',
    heureRappel: '',
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: ''
  },
  {
    id: '4',
    numeroLigne: 4,
    prenom: 'Sophie',
    nom: 'Bernard',
    telephone: '+06028208067', // Malformed +0 prefix
    email: 'sophie@example.com',
    statut: ContactStatus.NonDefini,
    commentaire: '',
    source: 'Test',
    dateRappel: '',
    heureRappel: '',
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: ''
  },
  {
    id: '5',
    numeroLigne: 5,
    prenom: 'Luc',
    nom: 'Moreau',
    telephone: '07 64 87 78 96', // With spaces
    email: 'luc@example.com',
    statut: ContactStatus.NonDefini,
    commentaire: '',
    source: 'Test',
    dateRappel: '',
    heureRappel: '',
    dateRDV: '',
    heureRDV: '',
    dateAppel: '',
    heureAppel: '',
    dureeAppel: ''
  }
];

const mockProps = {
  contacts: mockContactsWithProblematicPhones,
  callStates: {},
  onSelectContact: jest.fn(),
  selectedContactId: null,
  onUpdateContact: jest.fn(),
  onDeleteContact: jest.fn(),
  activeCallContactId: null,
  theme: 'light' as Theme,
  visibleColumns: {
    '#': true,
    'Prénom': true,
    'Nom': true,
    'Téléphone': true,
    'Mail': true,
    'Statut': true,
    'Commentaire': true
  },
  columnHeaders: ['#', 'Prénom', 'Nom', 'Téléphone', 'Mail', 'Statut', 'Commentaire'],
  contactDataKeys: [null, 'prenom', 'nom', 'telephone', 'email', 'statut', 'commentaire'],
  onToggleColumnVisibility: jest.fn()
};

describe('Phone Number Formatting Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should format phone numbers correctly in ContactTable display', () => {
    render(<ContactTable {...mockProps} />);
    
    // Check that problematic phone numbers are formatted correctly
    expect(screen.getByText('+33 6 95 40 06 3')).toBeInTheDocument(); // 0069540063
    expect(screen.getByText('+33 6 10 29 13 77')).toBeInTheDocument(); // +033610291377
    expect(screen.getByText('+33 6 55 12 15 17')).toBeInTheDocument(); // 06551215174
    expect(screen.getByText('+33 6 02 82 08 06')).toBeInTheDocument(); // +06028208067
    expect(screen.getByText('+33 7 64 87 78 96')).toBeInTheDocument(); // 07 64 87 78 96
  });

  test('should handle large datasets without performance issues', () => {
    // Create a large dataset with various phone number formats
    const largeDataset: Contact[] = [];
    const phoneFormats = [
      '0612345678',
      '0069540063',
      '+033610291377',
      '06551215174',
      '+06028208067',
      '07 64 87 78 96'
    ];

    for (let i = 0; i < 1000; i++) {
      largeDataset.push({
        id: `contact-${i}`,
        numeroLigne: i + 1,
        prenom: `Prénom${i}`,
        nom: `Nom${i}`,
        telephone: phoneFormats[i % phoneFormats.length],
        email: `contact${i}@example.com`,
        statut: ContactStatus.NonDefini,
        commentaire: '',
        source: 'Test',
        dateRappel: '',
        heureRappel: '',
        dateRDV: '',
        heureRDV: '',
        dateAppel: '',
        heureAppel: '',
        dureeAppel: ''
      });
    }

    const largeDatasetProps = {
      ...mockProps,
      contacts: largeDataset
    };

    const startTime = performance.now();
    render(<ContactTable {...largeDatasetProps} />);
    const endTime = performance.now();

    const renderTime = endTime - startTime;
    
    // Should render within reasonable time (less than 2 seconds for 1000 contacts)
    expect(renderTime).toBeLessThan(2000);
    
    // Verify some formatted numbers are present
    expect(screen.getByText('+33 6 12 34 56 78')).toBeInTheDocument();
  });

  test('should maintain formatting consistency across different input types', () => {
    const testCases = [
      { input: '0612345678', expected: '+33 6 12 34 56 78' },
      { input: '0069540063', expected: '+33 6 95 40 06 3' },
      { input: '+033610291377', expected: '+33 6 10 29 13 77' },
      { input: '06551215174', expected: '+33 6 55 12 15 17' },
      { input: '+06028208067', expected: '+33 6 02 82 08 06' },
      { input: '07 64 87 78 96', expected: '+33 7 64 87 78 96' }
    ];

    testCases.forEach(testCase => {
      const result = formatPhoneNumber(testCase.input);
      expect(result).toBe(testCase.expected);
    });
  });

  test('should handle edge cases gracefully in table context', () => {
    const edgeCaseContacts: Contact[] = [
      {
        id: '1',
        numeroLigne: 1,
        prenom: 'Test1',
        nom: 'User1',
        telephone: '', // Empty phone
        email: 'test1@example.com',
        statut: ContactStatus.NonDefini,
        commentaire: '',
        source: 'Test',
        dateRappel: '',
        heureRappel: '',
        dateRDV: '',
        heureRDV: '',
        dateAppel: '',
        heureAppel: '',
        dureeAppel: ''
      },
      {
        id: '2',
        numeroLigne: 2,
        prenom: 'Test2',
        nom: 'User2',
        telephone: 'invalid-phone', // Invalid phone
        email: 'test2@example.com',
        statut: ContactStatus.NonDefini,
        commentaire: '',
        source: 'Test',
        dateRappel: '',
        heureRappel: '',
        dateRDV: '',
        heureRDV: '',
        dateAppel: '',
        heureAppel: '',
        dureeAppel: ''
      }
    ];

    const edgeCaseProps = {
      ...mockProps,
      contacts: edgeCaseContacts
    };

    // Should not throw errors when rendering with edge case data
    expect(() => {
      render(<ContactTable {...edgeCaseProps} />);
    }).not.toThrow();

    // Check that invalid phone numbers are handled gracefully
    expect(screen.getByText('N/A')).toBeInTheDocument(); // Empty phone should show N/A
    expect(screen.getByText('invalid-phone')).toBeInTheDocument(); // Invalid phone should show as-is
  });

  test('should format phone numbers consistently during contact updates', () => {
    const { rerender } = render(<ContactTable {...mockProps} />);
    
    // Initial render should show formatted phone
    expect(screen.getByText('+33 6 95 40 06 3')).toBeInTheDocument();
    
    // Update contact with new problematic phone number
    const updatedContacts = [...mockContactsWithProblematicPhones];
    updatedContacts[0] = {
      ...updatedContacts[0],
      telephone: '+033712345678' // New malformed number
    };
    
    const updatedProps = {
      ...mockProps,
      contacts: updatedContacts
    };
    
    rerender(<ContactTable {...updatedProps} />);
    
    // Should show newly formatted phone number
    expect(screen.getByText('+33 7 12 34 56 78')).toBeInTheDocument();
    expect(screen.queryByText('+33 6 95 40 06 3')).not.toBeInTheDocument();
  });
});