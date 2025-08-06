import React from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from '../../../components/ui/input';

describe('Input - Dark Mode Support', () => {
  it('renders date input with dark mode classes', () => {
    render(<Input type="date" data-testid="date-input" />);
    
    const input = screen.getByTestId('date-input');
    expect(input).toHaveAttribute('type', 'date');
    
    // Check that dark mode classes are applied
    const classes = input.className;
    expect(classes).toContain('[&::-webkit-calendar-picker-indicator]:dark:filter-[invert(1)_brightness(0.8)]');
    expect(classes).toContain('[&::-webkit-calendar-picker-indicator]:dark:opacity-80');
  });

  it('renders time input with dark mode classes', () => {
    render(<Input type="time" data-testid="time-input" />);
    
    const input = screen.getByTestId('time-input');
    expect(input).toHaveAttribute('type', 'time');
    
    // Check that dark mode classes are applied
    const classes = input.className;
    expect(classes).toContain('[&::-webkit-calendar-picker-indicator]:dark:filter-[invert(1)_brightness(0.8)]');
    expect(classes).toContain('[&::-webkit-calendar-picker-indicator]:dark:opacity-80');
  });

  it('does not apply dark mode classes to other input types', () => {
    render(<Input type="text" data-testid="text-input" />);
    
    const input = screen.getByTestId('text-input');
    expect(input).toHaveAttribute('type', 'text');
    
    // Check that dark mode classes are NOT applied
    const classes = input.className;
    expect(classes).not.toContain('[&::-webkit-calendar-picker-indicator]:dark:filter-[invert(1)_brightness(0.8)]');
    expect(classes).not.toContain('[&::-webkit-calendar-picker-indicator]:dark:opacity-80');
  });

  it('preserves existing functionality', () => {
    render(
      <Input 
        type="text" 
        placeholder="Test placeholder"
        className="custom-class"
        data-testid="test-input"
      />
    );
    
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('placeholder', 'Test placeholder');
    expect(input.className).toContain('custom-class');
  });

  it('maintains accessibility attributes', () => {
    render(
      <Input 
        type="date"
        aria-label="Date selector"
        aria-describedby="date-help"
        data-testid="accessible-input"
      />
    );
    
    const input = screen.getByTestId('accessible-input');
    expect(input).toHaveAttribute('aria-label', 'Date selector');
    expect(input).toHaveAttribute('aria-describedby', 'date-help');
  });
});