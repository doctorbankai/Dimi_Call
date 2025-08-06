import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HelpTutorialButton from '../HelpTutorialButton';
import { Theme } from '../../types';

// Mock the HelpDialog component
jest.mock('../HelpDialog', () => {
  return function MockHelpDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return isOpen ? (
      <div data-testid="help-dialog">
        <button onClick={onClose}>Close Dialog</button>
      </div>
    ) : null;
  };
});

describe('HelpTutorialButton', () => {
  const defaultProps = {
    theme: Theme.Dark,
    className: 'test-class'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the help button correctly', () => {
    render(<HelpTutorialButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Aide et tutoriel');
  });

  it('applies the correct CSS classes', () => {
    render(<HelpTutorialButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    expect(button).toHaveClass('test-class');
    expect(button).toHaveClass('p-2');
    expect(button).toHaveClass('rounded');
    expect(button).toHaveClass('transition-all');
  });

  it('opens the help dialog when clicked', () => {
    render(<HelpTutorialButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    fireEvent.click(button);
    
    expect(screen.getByTestId('help-dialog')).toBeInTheDocument();
  });

  it('closes the help dialog when close is triggered', () => {
    render(<HelpTutorialButton {...defaultProps} />);
    
    // Open dialog
    const button = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    fireEvent.click(button);
    
    expect(screen.getByTestId('help-dialog')).toBeInTheDocument();
    
    // Close dialog
    const closeButton = screen.getByText('Close Dialog');
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId('help-dialog')).not.toBeInTheDocument();
  });

  it('renders with different themes', () => {
    const { rerender } = render(<HelpTutorialButton theme={Theme.Dark} />);
    
    let button = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    expect(button).toBeInTheDocument();
    
    rerender(<HelpTutorialButton theme={Theme.Light} />);
    
    button = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    expect(button).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<HelpTutorialButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    expect(button).toHaveAttribute('aria-label', 'Ouvrir l\'aide et le tutoriel');
    expect(button).toHaveAttribute('title', 'Aide et tutoriel');
  });

  it('contains the help icon', () => {
    render(<HelpTutorialButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /ouvrir l'aide et le tutoriel/i });
    const icon = button.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('w-4', 'h-4');
  });
});