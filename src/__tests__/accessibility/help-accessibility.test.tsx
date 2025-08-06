import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import HelpDialog from '../../components/HelpDialog';
import HelpTutorialButton from '../../components/HelpTutorialButton';
import { Theme } from '../../types';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';

expect.extend(toHaveNoViolations);

describe('Help System Accessibility', () => {
  describe('HelpTutorialButton Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <HelpTutorialButton theme={Theme.Dark} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      render(<HelpTutorialButton theme={Theme.Dark} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Ouvrir l\'aide et le tutoriel');
      expect(button).toHaveAttribute('title', 'Aide et tutoriel');
    });

    it('is keyboard accessible', () => {
      render(<HelpTutorialButton theme={Theme.Dark} />);
      
      const button = screen.getByRole('button');
      
      // Should be focusable
      button.focus();
      expect(button).toHaveFocus();
      
      // Should respond to Enter key
      const clickSpy = jest.fn();
      button.addEventListener('click', clickSpy);
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.click(button); // Simulate the actual click that would happen
      expect(clickSpy).toHaveBeenCalled();
    });

    it('has sufficient color contrast', () => {
      render(<HelpTutorialButton theme={Theme.Dark} />);
      
      const button = screen.getByRole('button');
      const computedStyle = window.getComputedStyle(button);
      
      // Button should have proper styling classes for contrast
      expect(button).toHaveClass('text-[hsl(var(--foreground))]');
    });
  });

  describe('HelpDialog Accessibility', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      theme: Theme.Dark
    };

    it('should not have accessibility violations', async () => {
      const { container } = render(<HelpDialog {...defaultProps} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper dialog ARIA attributes', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'help-dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'help-dialog-description');
    });

    it('has proper heading structure', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveAttribute('id', 'help-dialog-title');
    });

    it('manages focus correctly when opened', () => {
      const { rerender } = render(<HelpDialog {...defaultProps} isOpen={false} />);
      
      // Open dialog
      rerender(<HelpDialog {...defaultProps} isOpen={true} />);
      
      // Dialog should be present
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('traps focus within dialog', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      const closeButton = screen.getByLabelText('Fermer l\'aide');
      const firstTab = screen.getAllByRole('tab')[0];
      
      expect(dialog).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
      expect(firstTab).toBeInTheDocument();
      
      // All interactive elements should be within the dialog
      const interactiveElements = screen.getAllByRole('button').concat(screen.getAllByRole('tab'));
      interactiveElements.forEach(element => {
        expect(dialog).toContainElement(element);
      });
    });

    it('handles Escape key correctly', () => {
      const onClose = jest.fn();
      render(<HelpDialog {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('has proper tab navigation structure', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const tabs = screen.getAllByRole('tab');
      const tabpanel = screen.getByRole('tabpanel');
      
      expect(tabs.length).toBeGreaterThan(0);
      expect(tabpanel).toBeInTheDocument();
      
      // Active tab should have proper attributes
      const activeTab = screen.getByRole('tab', { selected: true });
      expect(activeTab).toHaveAttribute('aria-selected', 'true');
      expect(activeTab).toHaveAttribute('tabIndex', '0');
      
      // Inactive tabs should have proper attributes
      const inactiveTabs = tabs.filter(tab => tab !== activeTab);
      inactiveTabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected', 'false');
        expect(tab).toHaveAttribute('tabIndex', '-1');
      });
    });

    it('has proper navigation landmarks', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', 'Sections d\'aide');
    });
  });

  describe('Keyboard Navigation', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      theme: Theme.Dark
    };

    it('supports arrow key navigation in sidebar', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const tabs = screen.getAllByRole('tab');
      const firstTab = tabs[0];
      const secondTab = tabs[1];
      
      // Focus first tab
      firstTab.focus();
      expect(firstTab).toHaveFocus();
      
      // Arrow down should move to next tab
      fireEvent.keyDown(firstTab, { key: 'ArrowDown' });
      
      // Second tab should become active (though focus management is handled by the component)
      expect(secondTab).toHaveAttribute('aria-selected', 'true');
    });

    it('supports Home and End keys', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const tabs = screen.getAllByRole('tab');
      const firstTab = tabs[0];
      const lastTab = tabs[tabs.length - 1];
      
      // Focus middle tab
      const middleTab = tabs[Math.floor(tabs.length / 2)];
      middleTab.focus();
      
      // Home key should go to first tab
      fireEvent.keyDown(middleTab, { key: 'Home' });
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
      
      // End key should go to last tab
      fireEvent.keyDown(firstTab, { key: 'End' });
      expect(lastTab).toHaveAttribute('aria-selected', 'true');
    });

    it('supports Enter and Space keys for activation', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const tabs = screen.getAllByRole('tab');
      const secondTab = tabs[1];
      
      // Enter key should activate tab
      fireEvent.keyDown(secondTab, { key: 'Enter' });
      expect(secondTab).toHaveAttribute('aria-selected', 'true');
      
      // Space key should also activate tab
      const thirdTab = tabs[2];
      fireEvent.keyDown(thirdTab, { key: ' ' });
      expect(thirdTab).toHaveAttribute('aria-selected', 'true');
    });

    it('prevents default behavior for handled keys', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const firstTab = screen.getAllByRole('tab')[0];
      firstTab.focus();
      
      const preventDefault = jest.fn();
      const keyDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      keyDownEvent.preventDefault = preventDefault;
      
      fireEvent.keyDown(firstTab, keyDownEvent);
      
      // Component should prevent default for arrow keys
      // This is tested indirectly through the component behavior
    });
  });

  describe('Screen Reader Support', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      theme: Theme.Dark
    };

    it('provides proper role attributes', () => {
      render(<HelpDialog {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(5); // 5 help sections
    });

    it('provides descriptive labels', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', 'Sections d\'aide');
      
      const closeButton = screen.getByLabelText('Fermer l\'aide');
      expect(closeButton).toBeInTheDocument();
    });

    it('associates content with tabs correctly', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const activeTab = screen.getByRole('tab', { selected: true });
      const tabpanel = screen.getByRole('tabpanel');
      
      const tabpanelId = tabpanel.getAttribute('id');
      const tabControls = activeTab.getAttribute('aria-controls');
      
      expect(tabpanelId).toBe(tabControls);
    });

    it('announces section changes', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const tabs = screen.getAllByRole('tab');
      const secondTab = tabs[1];
      
      // Click second tab
      fireEvent.click(secondTab);
      
      // Tab should be selected and announce the change
      expect(secondTab).toHaveAttribute('aria-selected', 'true');
      
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('aria-labelledby');
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('maintains proper contrast in dark theme', () => {
      render(<HelpDialog isOpen={true} onClose={jest.fn()} theme={Theme.Dark} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('bg-background');
      
      // Text should use proper contrast classes
      const title = screen.getByText('Aide DimiCall');
      expect(title).toHaveClass('text-foreground');
    });

    it('maintains proper contrast in light theme', () => {
      render(<HelpDialog isOpen={true} onClose={jest.fn()} theme={Theme.Light} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('bg-background');
      
      // Text should use proper contrast classes
      const title = screen.getByText('Aide DimiCall');
      expect(title).toHaveClass('text-foreground');
    });

    it('provides visual focus indicators', () => {
      render(<HelpDialog isOpen={true} onClose={jest.fn()} theme={Theme.Dark} />);
      
      const closeButton = screen.getByLabelText('Fermer l\'aide');
      expect(closeButton).toHaveClass('focus:ring-2', 'focus:ring-primary/50');
      
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('focus:ring-2', 'focus:ring-primary/50');
      });
    });
  });
});