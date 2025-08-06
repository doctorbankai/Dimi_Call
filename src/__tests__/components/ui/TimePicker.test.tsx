import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimePicker } from '../../../components/ui/time-picker';

describe('TimePicker', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<TimePicker {...defaultProps} />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('HH:mm')).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<TimePicker {...defaultProps} value="14:30" />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('14:30');
  });

  it('calls onChange when input value changes', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    
    render(<TimePicker {...defaultProps} onChange={mockOnChange} />);
    
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '15:45');
    
    expect(mockOnChange).toHaveBeenCalledWith('15:45');
  });

  it('opens popover when clicked', async () => {
    const user = userEvent.setup();
    
    render(<TimePicker {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    await waitFor(() => {
      expect(screen.getByText('Heures')).toBeInTheDocument();
      expect(screen.getByText('Minutes')).toBeInTheDocument();
    });
  });

  it('selects time from popover', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    
    render(<TimePicker {...defaultProps} onChange={mockOnChange} />);
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    await waitFor(() => {
      expect(screen.getByText('Heures')).toBeInTheDocument();
    });
    
    // Click on hour 14
    const hour14 = screen.getByRole('button', { name: '14' });
    await user.click(hour14);
    
    expect(mockOnChange).toHaveBeenCalledWith('14:00');
  });

  it('handles disabled state', () => {
    render(<TimePicker {...defaultProps} disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('supports custom placeholder', () => {
    render(<TimePicker {...defaultProps} placeholder="Select time" />);
    
    expect(screen.getByPlaceholderText('Select time')).toBeInTheDocument();
  });

  it('supports accessibility attributes', () => {
    render(
      <TimePicker 
        {...defaultProps} 
        aria-label="Time selector"
        aria-describedby="time-help"
        id="time-input"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Time selector');
    expect(input).toHaveAttribute('aria-describedby', 'time-help');
    expect(input).toHaveAttribute('id', 'time-input');
  });
});