import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HelpDialog from '../../components/HelpDialog';
import HelpSidebar from '../../components/HelpSidebar';
import HelpContent from '../../components/HelpContent';
import { Theme } from '../../types';
import { HelpSection } from '../../types/help';

// Mock window.matchMedia for responsive tests
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

describe('Help System Responsive Design', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(mockMatchMedia),
    });
  });

  describe('HelpDialog Responsive Behavior', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      theme: Theme.Dark
    };

    it('applies responsive classes to dialog content', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      const dialogContent = dialog.firstChild as HTMLElement;
      
      expect(dialogContent).toHaveClass('max-w-6xl');
      expect(dialogContent).toHaveClass('sm:max-w-4xl');
      expect(dialogContent).toHaveClass('md:max-w-5xl');
      expect(dialogContent).toHaveClass('lg:max-w-6xl');
    });

    it('applies responsive height classes', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      const dialogContent = dialog.firstChild as HTMLElement;
      
      expect(dialogContent).toHaveClass('h-[85vh]');
      expect(dialogContent).toHaveClass('sm:h-[80vh]');
      expect(dialogContent).toHaveClass('md:h-[85vh]');
    });

    it('uses responsive flex direction for main content', () => {
      render(<HelpDialog {...defaultProps} />);
      
      // Find the main content container
      const mainContent = screen.getByRole('dialog').querySelector('.flex.flex-1.min-h-0');
      
      expect(mainContent).toHaveClass('sm:flex-row');
      expect(mainContent).toHaveClass('flex-col');
    });

    it('adapts footer layout for small screens', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const footer = screen.getByText('DimiCall - Guide d\'utilisation').closest('div');
      
      expect(footer).toHaveClass('sm:flex-row');
      expect(footer).toHaveClass('flex-col');
      expect(footer).toHaveClass('sm:gap-0');
      expect(footer).toHaveClass('gap-2');
    });

    it('hides certain elements on small screens', () => {
      render(<HelpDialog {...defaultProps} />);
      
      const hiddenOnSmall = screen.getByText('DimiCall - Guide d\'utilisation');
      expect(hiddenOnSmall).toHaveClass('hidden', 'sm:inline');
    });
  });

  describe('HelpSidebar Responsive Behavior', () => {
    const defaultProps = {
      activeSection: HelpSection.Introduction,
      onSectionChange: jest.fn(),
      theme: Theme.Dark
    };

    it('applies responsive width classes', () => {
      const { container } = render(<HelpSidebar {...defaultProps} />);
      
      const sidebar = container.firstChild as HTMLElement;
      
      expect(sidebar).toHaveClass('w-64');
      expect(sidebar).toHaveClass('sm:w-64');
      expect(sidebar).toHaveClass('w-full');
    });

    it('applies responsive border classes', () => {
      const { container } = render(<HelpSidebar {...defaultProps} />);
      
      const sidebar = container.firstChild as HTMLElement;
      
      expect(sidebar).toHaveClass('border-r');
      expect(sidebar).toHaveClass('sm:border-r');
      expect(sidebar).toHaveClass('border-b');
      expect(sidebar).toHaveClass('sm:border-b-0');
    });

    it('applies responsive height classes', () => {
      const { container } = render(<HelpSidebar {...defaultProps} />);
      
      const sidebar = container.firstChild as HTMLElement;
      
      expect(sidebar).toHaveClass('h-full');
      expect(sidebar).toHaveClass('sm:h-full');
      expect(sidebar).toHaveClass('h-auto');
    });

    it('hides keyboard navigation hint on small screens', () => {
      render(<HelpSidebar {...defaultProps} />);
      
      const navigationHint = screen.getByText(/Navigation :/);
      const hintContainer = navigationHint.closest('div');
      
      expect(hintContainer).toHaveClass('hidden', 'sm:block');
    });
  });

  describe('HelpContent Responsive Behavior', () => {
    const defaultProps = {
      section: HelpSection.Introduction,
      theme: Theme.Dark
    };

    it('applies responsive padding to content', () => {
      const { container } = render(<HelpContent {...defaultProps} />);
      
      const contentWrapper = container.querySelector('.p-6');
      
      expect(contentWrapper).toHaveClass('p-6');
      expect(contentWrapper).toHaveClass('sm:p-6');
      expect(contentWrapper).toHaveClass('p-4');
    });

    it('maintains readability on small screens', () => {
      render(<HelpContent {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-2xl');
      
      const paragraphs = screen.getAllByText(/DimiCall est une application/);
      paragraphs.forEach(p => {
        expect(p).toHaveClass('leading-relaxed');
      });
    });

    it('handles long content with proper overflow', () => {
      const { container } = render(<HelpContent {...defaultProps} />);
      
      const scrollContainer = container.querySelector('.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('h-full');
    });
  });

  describe('Cross-Platform Visual Consistency', () => {
    it('renders consistently across different viewport sizes', () => {
      const { container, rerender } = render(
        <HelpDialog isOpen={true} onClose={jest.fn()} theme={Theme.Dark} />
      );
      
      // Test different viewport scenarios by checking responsive classes
      const dialog = screen.getByRole('dialog');
      const dialogContent = dialog.firstChild as HTMLElement;
      
      // Should have all responsive breakpoint classes
      expect(dialogContent).toHaveClass(
        'max-w-6xl',
        'sm:max-w-4xl',
        'md:max-w-5xl',
        'lg:max-w-6xl'
      );
      
      // Test theme switching
      rerender(<HelpDialog isOpen={true} onClose={jest.fn()} theme={Theme.Light} />);
      
      const updatedDialog = screen.getByRole('dialog');
      expect(updatedDialog).toBeInTheDocument();
    });

    it('maintains proper spacing and layout on different screen sizes', () => {
      render(<HelpDialog isOpen={true} onClose={jest.fn()} theme={Theme.Dark} />);
      
      // Check header spacing
      const header = screen.getByText('Aide DimiCall').closest('div');
      expect(header).toHaveClass('px-6', 'py-4');
      
      // Check footer spacing
      const footer = screen.getByText('Section :').closest('div');
      expect(footer).toHaveClass('px-6', 'py-3');
    });
  });

  describe('Content Readability Tests', () => {
    it('maintains proper text hierarchy on all screen sizes', () => {
      render(<HelpContent section={HelpSection.Introduction} theme={Theme.Dark} />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      
      expect(h1).toHaveClass('text-2xl', 'font-bold');
      h2s.forEach(h2 => {
        expect(h2).toHaveClass('text-xl', 'font-semibold');
      });
    });

    it('provides adequate spacing between content elements', () => {
      render(<HelpContent section={HelpSection.Introduction} theme={Theme.Dark} />);
      
      const paragraphs = screen.getAllByText(/DimiCall/);
      paragraphs.forEach(p => {
        if (p.tagName === 'P') {
          expect(p).toHaveClass('mb-4');
        }
      });
    });

    it('handles list items with proper spacing', () => {
      render(<HelpContent section={HelpSection.Introduction} theme={Theme.Dark} />);
      
      const lists = screen.getByText(/Gestion complète des contacts/).closest('ul');
      expect(lists).toHaveClass('mb-4', 'space-y-2');
    });
  });

  describe('Interactive Element Sizing', () => {
    it('maintains proper button sizes across screen sizes', () => {
      render(<HelpSidebar 
        activeSection={HelpSection.Introduction} 
        onSectionChange={jest.fn()} 
        theme={Theme.Dark} 
      />);
      
      const buttons = screen.getAllByRole('tab');
      buttons.forEach(button => {
        expect(button).toHaveClass('px-3', 'py-2.5');
      });
    });

    it('provides adequate touch targets', () => {
      render(<HelpDialog isOpen={true} onClose={jest.fn()} theme={Theme.Dark} />);
      
      const closeButton = screen.getByLabelText('Fermer l\'aide');
      expect(closeButton).toHaveClass('w-8', 'h-8');
      
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        // Should have adequate padding for touch
        expect(tab).toHaveClass('px-3', 'py-2.5');
      });
    });
  });

  describe('Overflow and Scrolling Behavior', () => {
    it('handles content overflow correctly', () => {
      const { container } = render(
        <HelpContent section={HelpSection.CallFeatures} theme={Theme.Dark} />
      );
      
      const scrollContainer = container.querySelector('.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('h-full');
    });

    it('maintains sidebar scrolling on small screens', () => {
      const { container } = render(
        <HelpSidebar 
          activeSection={HelpSection.Introduction} 
          onSectionChange={jest.fn()} 
          theme={Theme.Dark} 
        />
      );
      
      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar).toHaveClass('overflow-y-auto');
    });
  });

  describe('Theme Consistency Across Components', () => {
    it('applies consistent theming in dark mode', () => {
      render(<HelpDialog isOpen={true} onClose={jest.fn()} theme={Theme.Dark} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('bg-background');
      
      const title = screen.getByText('Aide DimiCall');
      expect(title).toHaveClass('text-foreground');
    });

    it('applies consistent theming in light mode', () => {
      render(<HelpDialog isOpen={true} onClose={jest.fn()} theme={Theme.Light} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('bg-background');
      
      const title = screen.getByText('Aide DimiCall');
      expect(title).toHaveClass('text-foreground');
    });

    it('maintains consistent border and background colors', () => {
      render(<HelpDialog isOpen={true} onClose={jest.fn()} theme={Theme.Dark} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('border', 'border-border');
      
      const footer = screen.getByText('Section :').closest('div');
      expect(footer).toHaveClass('border-t', 'border-border', 'bg-muted/30');
    });
  });
});