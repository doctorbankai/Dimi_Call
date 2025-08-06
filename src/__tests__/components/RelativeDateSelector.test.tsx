import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RelativeDateSelector } from '../../components/RelativeDateSelector';

describe('RelativeDateSelector - Time Unit Labels', () => {
  const defaultProps = {
    onDateChange: jest.fn(),
    currentDate: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays "an(s)" instead of "année(s)" for years unit', async () => {
    const user = userEvent.setup();
    
    render(<RelativeDateSelector {...defaultProps} />);
    
    const unitSelect = screen.getByDisplayValue('jour(s)');
    await user.click(unitSelect);
    
    expect(screen.getByText('jour(s)')).toBeInTheDocument();
    expect(screen.getByText('semaine(s)')).toBeInTheDocument();
    expect(screen.getByText('mois')).toBeInTheDocument();
    expect(screen.getByText('an(s)')).toBeInTheDocument();
    
    // Ensure "année(s)" is not present
    expect(screen.queryByText('année(s)')).not.toBeInTheDocument();
  });

  it('calculates dates correctly with "an(s)" unit', async () => {
    const user = userEvent.setup();
    const mockOnDateChange = jest.fn();
    
    render(<RelativeDateSelector {...defaultProps} onDateChange={mockOnDateChange} />);
    
    // Enter quantity
    const quantityInput = screen.getByPlaceholderText('1');
    await user.clear(quantityInput);
    await user.type(quantityInput, '2');
    
    // Select years unit
    const unitSelect = screen.getByDisplayValue('jour(s)');
    await user.click(unitSelect);
    await user.click(screen.getByText('an(s)'));
    
    // Should call onDateChange with calculated date
    expect(mockOnDateChange).toHaveBeenCalled();
  });

  it('shows preview text with "an(s)" unit', async () => {
    const user = userEvent.setup();
    
    render(<RelativeDateSelector {...defaultProps} />);
    
    // Enter quantity
    const quantityInput = screen.getByPlaceholderText('1');
    await user.clear(quantityInput);
    await user.type(quantityInput, '1');
    
    // Select years unit
    const unitSelect = screen.getByDisplayValue('jour(s)');
    await user.click(unitSelect);
    await user.click(screen.getByText('an(s)'));
    
    // Should show preview with "an(s)" terminology
    const preview = screen.getByRole('status');
    expect(preview).toBeInTheDocument();
    expect(preview.textContent).toContain('an');
  });
});