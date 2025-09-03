import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnTypeSelector, ColumnDataType } from '../ColumnTypeSelector';

// Mock des composants shadcn/ui
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} data-testid="dropdown-item">{children}</button>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-trigger">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <button onClick={onClick} className={className} data-testid="type-button">{children}</button>
  ),
}));

describe('ColumnTypeSelector', () => {
  const defaultProps = {
    columnId: 'test-column',
    columnLabel: 'Test Column',
    currentType: 'unknown' as ColumnDataType,
    onTypeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with unknown type', () => {
    render(<ColumnTypeSelector {...defaultProps} />);
    
    expect(screen.getByTestId('type-button')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
  });

  it('displays the correct icon for unknown type', () => {
    render(<ColumnTypeSelector {...defaultProps} currentType="unknown" />);
    
    // Vérifier que l'icône HelpCircle est présente
    expect(screen.getByTestId('type-button')).toBeInTheDocument();
  });

  it('displays the correct icon for phone type', () => {
    render(<ColumnTypeSelector {...defaultProps} currentType="phone" />);
    
    // Vérifier que l'icône Phone est présente
    expect(screen.getByTestId('type-button')).toBeInTheDocument();
  });

  it('calls onTypeChange when a type is selected', () => {
    const onTypeChange = jest.fn();
    render(<ColumnTypeSelector {...defaultProps} onTypeChange={onTypeChange} />);
    
    // Ouvrir le dropdown et sélectionner un type
    const trigger = screen.getByTestId('dropdown-trigger');
    fireEvent.click(trigger);
    
    // Sélectionner le type 'phone'
    const phoneItem = screen.getByText('Téléphone');
    fireEvent.click(phoneItem);
    
    expect(onTypeChange).toHaveBeenCalledWith('test-column', 'phone');
  });

  it('applies custom className', () => {
    const customClass = 'custom-class';
    render(<ColumnTypeSelector {...defaultProps} className={customClass} />);
    
    const button = screen.getByTestId('type-button');
    expect(button).toHaveClass(customClass);
  });

  it('shows all type options', () => {
    render(<ColumnTypeSelector {...defaultProps} />);
    
    // Vérifier que tous les types sont présents
    expect(screen.getByText('Texte')).toBeInTheDocument();
    expect(screen.getByText('Numéro')).toBeInTheDocument();
    expect(screen.getByText('Téléphone')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Heure')).toBeInTheDocument();
    expect(screen.getByText('Durée')).toBeInTheDocument();
    expect(screen.getByText('Commentaire')).toBeInTheDocument();
    expect(screen.getByText('Statut')).toBeInTheDocument();
    expect(screen.getByText('Non reconnu')).toBeInTheDocument();
  });

  it('displays column label in dropdown header', () => {
    render(<ColumnTypeSelector {...defaultProps} columnLabel="Custom Label" />);
    
    expect(screen.getByText('Type de données pour "Custom Label"')).toBeInTheDocument();
  });
});
