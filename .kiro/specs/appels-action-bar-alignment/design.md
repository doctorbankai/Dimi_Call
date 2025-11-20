# Design Document

## Overview

This design addresses the vertical alignment issue in the Appels page table view where the contact action bar (displaying contact information and action buttons) currently appears below the page toolbar. The solution will reposition these elements to share the same horizontal line, creating a more compact and organized layout.

The implementation will leverage Tailwind CSS flexbox utilities to create a responsive layout that adapts gracefully across different viewport sizes while maintaining all existing functionality.

## Architecture

The solution involves modifying the toolbar structure in the `AppelsCardsView` component to use a single-row flexbox layout that accommodates both the page toolbar elements and the contact action bar.

### Current Structure

```tsx
<div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-2 pb-2">
  <div className="flex items-center gap-4">
    {/* Title and View Switcher */}
  </div>
  <div className="flex flex-wrap items-center gap-2">
    {/* Action buttons */}
  </div>
</div>

{/* Contact Action Bar - separate element below */}
<ContactActionBar ... />
```

### Proposed Structure

```tsx
<div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-2 pb-2">
  <div className="flex items-center gap-4">
    {/* Title and View Switcher */}
  </div>
  <div className="flex flex-wrap items-center gap-2">
    {/* Contact Action Bar integrated here */}
    <ContactActionBar ... />
  </div>
</div>
```

## Components and Interfaces

### Modified Components

#### AppelsCardsView Toolbar

The toolbar section will be restructured to include the contact action bar within the same flex container:

- **Container**: `flex flex-wrap items-center justify-between` - Allows wrapping on small screens
- **Left Section**: Title + View Switcher (Cards/Table buttons)
- **Right Section**: Contact Action Bar (avatar, name, phone, action buttons)

#### ContactActionBar Component

The existing `ContactActionBar` component will be used without modification to its internal structure. Only its positioning within the parent layout will change.

### Responsive Behavior

- **Desktop (≥768px)**: Single row with contact bar aligned to the right
- **Tablet (640px-767px)**: May wrap to two rows depending on content width
- **Mobile (<640px)**: Wraps to multiple rows with full-width elements

## Data Models

No data model changes are required. This is purely a UI layout modification.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Horizontal alignment on desktop

*For any* viewport width ≥768px, the contact action bar and page toolbar should be positioned on the same horizontal line (same vertical offset from the top of the container).

**Validates: Requirements 1.1, 1.4**

### Property 2: Right alignment on sufficient viewport

*For any* viewport width ≥768px, the contact action bar should be aligned to the right edge of the toolbar container.

**Validates: Requirements 1.2**

### Property 3: Responsive wrapping behavior

*For any* viewport width <640px, the contact action bar should wrap to a new line below the page toolbar elements.

**Validates: Requirements 1.3**

### Property 4: Consistent spacing preservation

*For any* viewport size, the spacing between toolbar elements should remain consistent with the design system (gap-3 = 0.75rem).

**Validates: Requirements 1.5**

### Property 5: Interactive functionality preservation

*For any* action button in the contact action bar, clicking the button should trigger its associated callback function correctly after repositioning.

**Validates: Requirements 2.1**

### Property 6: Text visibility preservation

*For any* contact displayed in the action bar, the contact name and phone number text should not be clipped or hidden (overflow: visible or proper truncation with ellipsis).

**Validates: Requirements 2.2**

### Property 7: Tooltip functionality

*For any* action button with a tooltip, hovering over the button should display the tooltip with the correct label text.

**Validates: Requirements 2.3**

### Property 8: Touch-friendly button sizes

*For any* viewport width <640px, all action buttons should maintain a minimum touch target size of 40x40px.

**Validates: Requirements 2.4**

### Property 9: Dark mode compatibility

*For any* theme setting (light or dark), the contact action bar should render with appropriate colors that maintain contrast and readability.

**Validates: Requirements 3.3**

### Property 10: Event handler preservation

*For any* interactive element in the contact action bar, the element's event handlers should remain attached and functional after the layout change.

**Validates: Requirements 3.4**

## Error Handling

### Layout Overflow

If the combined width of toolbar elements exceeds the container width, the flexbox `flex-wrap` property will automatically wrap elements to the next line. This is the expected behavior and not an error condition.

### Missing Contact Data

If no contact is selected, the contact action bar should not be rendered. This is handled by conditional rendering in the parent component.

### Responsive Breakpoint Edge Cases

At breakpoint boundaries (e.g., exactly 768px), the layout should gracefully transition between states without visual glitches. This is ensured by using standard Tailwind breakpoints.

## Testing Strategy

### Unit Tests

Unit tests will verify:

1. **Component rendering**: Contact action bar renders within the toolbar container
2. **Conditional rendering**: Action bar only renders when a contact is selected
3. **Props passing**: All required props are correctly passed to ContactActionBar
4. **Event handlers**: Button click handlers are properly wired

### Property-Based Tests

Property-based tests will verify the correctness properties defined above:

1. **Layout properties** (Properties 1-4): Test alignment, positioning, and spacing across various viewport widths
2. **Functionality properties** (Properties 5, 7, 10): Test interactive elements work correctly
3. **Visual properties** (Properties 6, 8, 9): Test visibility, sizing, and theming

Each property test will:
- Generate random viewport widths within relevant ranges
- Generate random contact data
- Verify the property holds for all generated inputs

### Visual Regression Testing

Manual visual testing will be performed to verify:
- No unintended layout changes in other views
- Smooth responsive transitions
- Consistent visual hierarchy

### Browser Compatibility Testing

Test across:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if applicable)

## Implementation Notes

### CSS Classes to Use

- **Container**: `flex flex-wrap items-center justify-between gap-3`
- **Alignment**: `items-center` for vertical centering
- **Spacing**: `gap-3` (0.75rem) for consistent spacing
- **Responsive**: Use existing `sm:`, `md:` breakpoints as needed

### Files to Modify

1. `src/components/AppelsCardsView.tsx` - Main toolbar structure
2. Potentially `src/components/ContactActionBar.tsx` - Only if wrapper classes need adjustment

### Accessibility Considerations

- Maintain proper ARIA labels on toolbar elements
- Ensure keyboard navigation order remains logical
- Preserve focus management for interactive elements

### Performance Considerations

This is a pure CSS layout change with no performance implications. No JavaScript calculations or DOM manipulations are required for the alignment.

## Migration Strategy

This is a non-breaking change that only affects the visual layout. No data migration or API changes are required.

### Rollback Plan

If issues arise, the change can be easily reverted by restoring the previous toolbar structure from version control.

## Future Enhancements

- Add animation transitions for responsive layout changes
- Consider collapsing action buttons into a dropdown menu on very small screens
- Add user preference for toolbar layout (compact vs. expanded)
