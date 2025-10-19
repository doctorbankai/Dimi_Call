/**
 * Test end-to-end pour l'export Google Contacts avec le statut A0
 * Vérifie que le statut A0 est correctement inclus dans l'export
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';
import { Contact, ContactStatus } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// Mock des services
jest.mock('../../services/dataService', () => ({
  ...jest.requireActual('../../services/dataService'),
  loadContacts: jest.fn(() => []),
  saveContacts: jest.fn(),
  loadCallStates: jest.fn(() => ({})),
  saveCallStates: jest.fn(),
  exportGoogleContactsCSV: jest.fn(),
  hasImportedTable: jest.fn(() => false),
}));

jest.mock('../../lib/auth-client', () => ({
  useSupabaseAuth: () => ({
    isAuthenticated: true,
    user: { email: 'test@example.com' },
    signIn: jest.fn(),
    signOut: jest.fn(),
    loading: false,
  }),
}));

jest.mock('../../hooks/useAutoUpdate', () => ({
  useAutoUpdate: () => ({
    updateState: { available: false, downloading: false, error: null },
    installUpdate: jest.fn(),
  }),
}));

jest.mock('../../hooks/useAdb', () => ({
  useAdb: () => ({
    connectionState: { isConnected: false },
    isConnecting: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    getLogs: jest.fn(),
    setAutoDetection: jest.fn(),
    restartAdbServer: jest.fn(),
    makeCall: jest.fn(),
    endCall: jest.fn(),
    sendSms: jest.fn(),
    getCurrentCallState: jest.fn(),
    getLastCallNumber: jest.fn(),
    checkCallState: jest.fn(),
    onCallEnd: jest.fn(),
  }),
}));

describe('A0 Status Google Export E2E', () => {
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
      statut: ContactStatus.A0,
      commentaire: 'Contact avec statut A0',
      dateRappel: '',
      heureRappel: '',
      dateRDV: '',
      heureRDV: '',
      dateAppel: '',
      heureAppel: '',
      dureeAppel: '',
      sexe: 'F',
      type: 'Prospect',
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
      statut: ContactStatus.D0,
      commentaire: 'Rendez-vous confirmé',
      dateRappel: '',
      heureRappel: '',
      dateRDV: '2024-01-20',
      heureRDV: '10:00',
      dateAppel: '',
      heureAppel: '',
      dureeAppel: '',
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
    const { loadContacts } = require('../../services/dataService');
    loadContacts.mockReturnValue(mockContacts);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  test('should display correct count in Google Contacts button badge including A0 status', async () => {
    render(<App />);

    // Attendre que l'application se charge
    await waitFor(() => {
      expect(screen.getByText('Jean')).toBeInTheDocument();
    });

    // Chercher le bouton Google Contacts
    const contactsButton = screen.getByTitle(/Exporter.*contacts.*vers Google Contacts/);
    expect(contactsButton).toBeInTheDocument();

    // Vérifier que le badge affiche 3 (ARappeler + A0 + D0)
    const badge = contactsButton.querySelector('[data-slot="badge"]');
    expect(badge).toHaveTextContent('3');
  });

  test('should include A0 status in tooltip text', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Jean')).toBeInTheDocument();
    });

    // Chercher le bouton Google Contacts et vérifier le tooltip
    const contactsButton = screen.getByTitle(/Exporter 3 contacts \(À rappeler, D0, R0, A0\) vers Google Contacts/);
    expect(contactsButton).toBeInTheDocument();
  });

  test('should call exportGoogleContactsCSV when clicking the button', async () => {
    const { exportGoogleContactsCSV } = require('../../services/dataService');
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Jean')).toBeInTheDocument();
    });

    // Cliquer sur le bouton Google Contacts
    const contactsButton = screen.getByTitle(/Exporter.*contacts.*vers Google Contacts/);
    fireEvent.click(contactsButton);

    // Vérifier que la fonction d'export a été appelée
    expect(exportGoogleContactsCSV).toHaveBeenCalledWith(mockContacts);
  });

  test('should disable button when no eligible contacts exist', async () => {
    const contactsWithoutEligibleStatuses: Contact[] = [
      {
        ...mockContacts[0],
        statut: ContactStatus.PasInteresse
      },
      {
        ...mockContacts[1],
        statut: ContactStatus.ListeNoire
      }
    ];

    const { loadContacts } = require('../../services/dataService');
    loadContacts.mockReturnValue(contactsWithoutEligibleStatuses);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Jean')).toBeInTheDocument();
    });

    // Chercher le bouton Google Contacts et vérifier qu'il est désactivé
    const contactsButton = screen.getByTitle(/Aucun contact à exporter/);
    expect(contactsButton).toBeDisabled();

    // Vérifier qu'il n'y a pas de badge
    const badge = contactsButton.querySelector('[data-slot="badge"]');
    expect(badge).not.toBeInTheDocument();
  });

  test('should work with only A0 status contacts', async () => {
    const onlyA0Contacts: Contact[] = [
      {
        ...mockContacts[1], // Marie avec statut A0
      }
    ];

    const { loadContacts } = require('../../services/dataService');
    loadContacts.mockReturnValue(onlyA0Contacts);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Marie')).toBeInTheDocument();
    });

    // Vérifier que le bouton est activé avec 1 contact
    const contactsButton = screen.getByTitle(/Exporter 1 contacts.*vers Google Contacts/);
    expect(contactsButton).toBeEnabled();

    // Vérifier que le badge affiche 1
    const badge = contactsButton.querySelector('[data-slot="badge"]');
    expect(badge).toHaveTextContent('1');
  });

  test('should handle mixed statuses correctly', async () => {
    const mixedContacts: Contact[] = [
      { ...mockContacts[0], statut: ContactStatus.ARappeler }, // Éligible
      { ...mockContacts[1], statut: ContactStatus.A0 },        // Éligible
      { ...mockContacts[2], statut: ContactStatus.R0 },        // Éligible
      { ...mockContacts[3], statut: ContactStatus.PasInteresse } // Non éligible
    ];

    const { loadContacts } = require('../../services/dataService');
    loadContacts.mockReturnValue(mixedContacts);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Jean')).toBeInTheDocument();
    });

    // Vérifier que le bouton affiche 3 contacts éligibles
    const contactsButton = screen.getByTitle(/Exporter 3 contacts.*vers Google Contacts/);
    expect(contactsButton).toBeEnabled();

    const badge = contactsButton.querySelector('[data-slot="badge"]');
    expect(badge).toHaveTextContent('3');
  });
});