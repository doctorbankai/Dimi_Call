# Design Document - Shadcn Table Migration

## Overview

This design document outlines the architectural approach for migrating VirtualizedContactTable.tsx from its current custom-styled implementation to a Shadcn UI-compliant design system. The migration will transform the visual appearance while maintaining 100% functional parity, including virtualization performance, inline editing, sorting, filtering, and all existing widgets.

The design follows a phased approach that prioritizes visual impact first, then implements intelligent column sizing, and finally optimizes for responsive behavior. The core principle is to adopt Shadcn's minimal, flat design language while preserving the advanced features that make this table powerful.

## Architecture

### Component Structure

The VirtualizedContactTable will maintain its current architecture with the following enhancements:

```
VirtualizedContactTable (Main Component)
├── Styling Layer (NEW)
│   ├── SHADCN_STYLES constants
│   ├── COLUMN_RESIZE_CONFIG
│   └── SHADCN_SPACING
├── State Management (EXISTING)
│   ├── Column configuration
│   ├── Sort state
│   ├── Selection state
│   └── Edit state
├── Hooks Layer (ENHANCED)
│   ├── useVirtualizer (existing)
│   ├── useDebouncedUpdate (existing)
│   ├── useResponsiveColumns (NEW)
│   └── useColumnWidthCalculation (NEW)
├── Rendering Layer
│   ├── Header Section (REDESIGNED)
│   ├── Virtualized Body (ENHANCED)
│   └── Cell Widgets (PRESERVED)
└── Shadcn Components (INTEGRATED)
    ├── Table, TableHeader, TableBody, TableRow, TableHead, TableCell
    ├── ScrollArea
    └── Existing: Button, Input, Select, Popover, Card
```

### Design Principles

1. **Minimal Visual Weight**: Remove all 3D effects, heavy shadows, and excessive borders
2. **Intelligent Spacing**: Use Shadcn's standard spacing (px-3 py-2) for consistency
3. **Responsive by Default**: Columns adapt automatically to viewport changes
4. **Performance First**: No regression in virtualization or rendering performance
5. **Accessibility Maintained**: Preserve all ARIA labels and keyboard navigation

## Components and Interfaces

### 1. Styling Constants

#### SHADCN_STYLES Object

```typescript
const SHADCN_STYLES = {
  // Container
  tableContainer: "rounded-md border bg-background",
  
  // Header
  tableHeader: "sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
  headerRow: "flex border-b",
  headerCell: "h-10 flex items-center px-3 py-2 text-left text-xs font-medium text-muted-foreground select-none transition-colors",
  headerCellSortable: "cursor-pointer hover:bg-muted/50",
  headerCellFirst: "first:rounded-tl-md",
  headerCellLast: "last:rounded-tr-md",
  
  // Body
  tableBody: "relative",
  bodyRow: "flex border-b border-border hover:bg-muted/50 cursor-pointer transition-colors",
  bodyRowSelected: "bg-accent text-accent-foreground",
  bodyRowActiveCall: "bg-green-50 hover:bg-green-100 dark:bg-green-950/50 dark:hover:bg-green-950/80",
  bodyCell: "px-3 py-2 text-sm flex items-center flex-shrink-0",
  
  // Sort Icons
  sortIcon: "h-3 w-3 text-muted-foreground transition-colors",
  sortIconInactive: "h-3 w-3 text-muted-foreground/40",
  sortIconContainer: "flex items-center ml-2"
} as const;
```

#### SHADCN_SPACING Configuration

```typescript
const SHADCN_SPACING = {
  headerHeight: 40,      // h-10 in pixels
  rowHeight: 36,         // Compact row height
  cellPadding: 'px-3 py-2',
  iconSize: 'h-3 w-3',
  headerIconSize: 'h-3.5 w-3.5'
} as const;
```

### 2. Column Resize System

#### COLUMN_RESIZE_CONFIG

This configuration defines the behavior of each column type:

```typescript
const COLUMN_RESIZE_CONFIG = {
  // Fixed-width columns (never resize)
  fixed: {
    '#': 50,
    'Statut': 120,
    'Date Rappel': 110,
    'Heure Rappel': 80,
    'Date RDV': 110,
    'Heure RDV': 80,
    'Date Appel': 110,
    'Heure Appel': 80,
    'Durée Appel': 70,
    'Sexe': 60,
    'Don': 60,
    'Type': 80,
    'Qualité': 80,
    'Date': 100,
    'UID': 100
  },
  
  // Flexible columns (grow/shrink proportionally)
  flexible: {
    'Prénom': { min: 100, preferred: 140, grow: 1 },
    'Nom': { min: 100, preferred: 140, grow: 1 },
    'Téléphone': { min: 120, preferred: 150, grow: 0.5 },
    'Mail': { min: 150, preferred: 220, grow: 2 },
    'Source': { min: 80, preferred: 120, grow: 0.5 },
    'Commentaire': { min: 200, preferred: 300, grow: 3 },
    'Lien': { min: 120, preferred: 180, grow: 1.5 }
  }
} as const;

interface FlexibleColumnConfig {
  min: number;        // Minimum width in pixels
  preferred: number;  // Ideal width in pixels
  grow: number;       // Growth factor (higher = more space)
}
```

#### Column Width Calculation Algorithm

```typescript
const calculateResponsiveWidths = useMemo(() => {
  const containerWidth = scrollContainerRef.current?.clientWidth || 1200;
  
  // Step 1: Calculate total width of fixed columns
  const fixedColumns = visibleOrderedColumns.filter(col => 
    COLUMN_RESIZE_CONFIG.fixed[col.label as keyof typeof COLUMN_RESIZE_CONFIG.fixed]
  );
  
  const fixedWidth = fixedColumns.reduce((sum, col) => 
    sum + COLUMN_RESIZE_CONFIG.fixed[col.label as keyof typeof COLUMN_RESIZE_CONFIG.fixed], 0
  );
  
  // Step 2: Calculate available width for flexible columns
  const availableWidth = Math.max(0, containerWidth - fixedWidth - 20); // 20px margin
  
  // Step 3: Get flexible columns and calculate total weight
  const flexibleColumns = visibleOrderedColumns.filter(col =>
    COLUMN_RESIZE_CONFIG.flexible[col.label as keyof typeof COLUMN_RESIZE_CONFIG.flexible]
  );
  
  const totalWeight = flexibleColumns.reduce((sum, col) => {
    const config = COLUMN_RESIZE_CONFIG.flexible[col.label as keyof typeof COLUMN_RESIZE_CONFIG.flexible];
    return sum + (config?.grow || 1);
  }, 0);
  
  // Step 4: Distribute available width proportionally
  return visibleOrderedColumns.map(col => {
    // Fixed column
    const fixedSize = COLUMN_RESIZE_CONFIG.fixed[col.label as keyof typeof COLUMN_RESIZE_CONFIG.fixed];
    if (fixedSize) {
      return { ...col, calculatedWidth: `${fixedSize}px` };
    }
    
    // Flexible column
    const flexConfig = COLUMN_RESIZE_CONFIG.flexible[col.label as keyof typeof COLUMN_RESIZE_CONFIG.flexible];
    if (flexConfig && totalWeight > 0) {
      const proportionalWidth = (availableWidth * flexConfig.grow) / totalWeight;
      const finalWidth = Math.max(
        flexConfig.min,
        Math.min(proportionalWidth, flexConfig.preferred * 1.5)
      );
      return { ...col, calculatedWidth: `${Math.floor(finalWidth)}px` };
    }
    
    // Fallback
    return { ...col, calculatedWidth: '100px' };
  });
}, [visibleOrderedColumns, scrollContainerRef.current?.clientWidth]);
```

### 3. Responsive Breakpoint Hook

```typescript
type ScreenSize = 'sm' | 'md' | 'lg' | 'xl';

const useResponsiveColumns = (): ScreenSize => {
  const [screenSize, setScreenSize] = useState<ScreenSize>('lg');
  
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize('sm');
      else if (width < 1024) setScreenSize('md');
      else if (width < 1280) setScreenSize('lg');
      else setScreenSize('xl');
    };
    
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);
  
  return screenSize;
};
```

### 4. Mobile Column Configuration

```typescript
const MOBILE_COLUMN_CONFIG = {
  sm: ['#', 'Prénom', 'Nom', 'Statut', 'Commentaire'],
  md: ['#', 'Prénom', 'Nom', 'Téléphone', 'Statut', 'Commentaire', 'Date Rappel'],
  lg: 'all', // Show all visible columns
  xl: 'all'
};

const getVisibleColumnsForScreenSize = (
  columns: ColumnConfig[],
  screenSize: ScreenSize
): ColumnConfig[] => {
  const allowedColumns = MOBILE_COLUMN_CONFIG[screenSize];
  
  if (allowedColumns === 'all') {
    return columns;
  }
  
  return columns.filter(col => allowedColumns.includes(col.label));
};
```

## Data Models

### Enhanced Column Configuration

```typescript
interface ColumnConfig {
  id: string;
  key: keyof Contact | 'index';
  label: string;
  icon: React.ComponentType<any>;
  width?: string;              // Deprecated - will be removed
  minWidth?: string;           // Deprecated - will be removed
  calculatedWidth?: string;    // NEW - computed by resize algorithm
  canHide: boolean;
  canSort: boolean;
  defaultVisible: boolean;
  resizeType?: 'fixed' | 'flexible'; // NEW - determines resize behavior
}
```

### Row Variant State

```typescript
type RowVariant = 'default' | 'selected' | 'activeCall';

const getRowVariant = (isSelected: boolean, isActiveCall: boolean): RowVariant => {
  if (isSelected) return 'selected';
  if (isActiveCall) return 'activeCall';
  return 'default';
};

const getRowClasses = (variant: RowVariant): string => {
  const baseClasses = SHADCN_STYLES.bodyRow;
  
  switch (variant) {
    case 'selected':
      return cn(baseClasses, SHADCN_STYLES.bodyRowSelected);
    case 'activeCall':
      return cn(baseClasses, SHADCN_STYLES.bodyRowActiveCall);
    default:
      return baseClasses;
  }
};
```

## Error Handling

### Resize Calculation Fallbacks

```typescript
const calculateResponsiveWidths = useMemo(() => {
  try {
    const containerWidth = scrollContainerRef.current?.clientWidth || 1200;
    
    // Validation
    if (containerWidth < 320) {
      console.warn('Container width too small, using minimum 320px');
      containerWidth = 320;
    }
    
    // ... calculation logic ...
    
  } catch (error) {
    console.error('Column width calculation failed:', error);
    // Fallback to fixed widths
    return visibleOrderedColumns.map(col => ({
      ...col,
      calculatedWidth: '100px'
    }));
  }
}, [visibleOrderedColumns, scrollContainerRef.current?.clientWidth]);
```

### Virtualization Performance Guards

```typescript
const rowVirtualizer = useVirtualizer({
  count: sortedContacts.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => SHADCN_SPACING.rowHeight, // Use constant
  overscan: 10,
  // Error boundary
  onChange: (instance) => {
    if (instance.scrollOffset < 0) {
      console.warn('Negative scroll offset detected, resetting');
      instance.scrollToOffset(0);
    }
  }
});
```

## Testing Strategy

### Visual Regression Tests

```javascript
// scripts/test-table-ui.cjs

const tests = [
  {
    name: 'Header height is 40px',
    test: () => {
      const headers = document.querySelectorAll('[data-header-cell]');
      return Array.from(headers).every(h => h.offsetHeight === 40);
    }
  },
  {
    name: 'No boxShadow styles present',
    test: () => {
      const allElements = document.querySelectorAll('*');
      return Array.from(allElements).every(el => {
        const style = window.getComputedStyle(el);
        return style.boxShadow === 'none' || style.boxShadow === '';
      });
    }
  },
  {
    name: 'No vertical borders (border-r)',
    test: () => {
      const cells = document.querySelectorAll('[data-cell]');
      return Array.from(cells).every(cell => {
        return !cell.className.includes('border-r');
      });
    }
  },
  {
    name: 'Shadcn classes applied',
    test: () => {
      const headers = document.querySelectorAll('[data-header-cell]');
      return Array.from(headers).every(h => {
        return h.className.includes('text-muted-foreground') &&
               h.className.includes('px-3');
      });
    }
  },
  {
    name: 'Auto-resize responds to viewport changes',
    test: async () => {
      const initialWidth = window.innerWidth;
      window.resizeTo(1024, 768);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const columns = document.querySelectorAll('[data-column]');
      const hasResized = Array.from(columns).some(col => {
        const width = parseInt(col.style.width);
        return width > 0 && width < 500;
      });
      
      window.resizeTo(initialWidth, window.innerHeight);
      return hasResized;
    }
  }
];
```

### Performance Benchmarks

```javascript
// Ensure no performance regression
const performanceTests = [
  {
    name: 'Render 5000 contacts in < 100ms',
    test: async () => {
      const start = performance.now();
      // Trigger render with 5000 contacts
      const end = performance.now();
      return (end - start) < 100;
    }
  },
  {
    name: 'Scroll performance maintains 60fps',
    test: async () => {
      const frames = [];
      const measureFrame = () => {
        frames.push(performance.now());
        if (frames.length < 60) {
          requestAnimationFrame(measureFrame);
        }
      };
      
      // Trigger scroll
      requestAnimationFrame(measureFrame);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Calculate average FPS
      const avgFrameTime = frames.reduce((a, b, i) => 
        i > 0 ? a + (b - frames[i-1]) : 0, 0
      ) / (frames.length - 1);
      
      return (1000 / avgFrameTime) >= 58; // Allow 2fps tolerance
    }
  }
];
```

### Unit Tests for Column Calculation

```typescript
describe('Column Width Calculation', () => {
  it('should allocate fixed widths correctly', () => {
    const columns = [
      { label: '#', key: 'index' },
      { label: 'Statut', key: 'statut' }
    ];
    
    const result = calculateResponsiveWidths(columns, 1200);
    
    expect(result[0].calculatedWidth).toBe('50px');
    expect(result[1].calculatedWidth).toBe('120px');
  });
  
  it('should distribute flexible column space proportionally', () => {
    const columns = [
      { label: 'Prénom', key: 'prenom' },  // grow: 1
      { label: 'Commentaire', key: 'commentaire' }  // grow: 3
    ];
    
    const result = calculateResponsiveWidths(columns, 1200);
    
    const prenomWidth = parseInt(result[0].calculatedWidth);
    const commentWidth = parseInt(result[1].calculatedWidth);
    
    // Commentaire should be ~3x wider than Prénom
    expect(commentWidth / prenomWidth).toBeCloseTo(3, 0.5);
  });
  
  it('should respect minimum widths', () => {
    const columns = [
      { label: 'Mail', key: 'email' }  // min: 150
    ];
    
    const result = calculateResponsiveWidths(columns, 200);
    
    expect(parseInt(result[0].calculatedWidth)).toBeGreaterThanOrEqual(150);
  });
});
```

## Implementation Phases

### Phase 1: Visual Transformation (Priority 1 - 30 min)

**Goal**: Immediate visual impact with minimal code changes

1. Remove all `boxShadow` inline styles
2. Remove `backdropFilter` and `WebkitBackdropFilter`
3. Change header height from `h-16` to `h-10`
4. Remove all `border-r` classes
5. Apply `SHADCN_STYLES.headerCell` to headers
6. Apply `SHADCN_STYLES.bodyCell` to cells

**Files Modified**: `src/components/VirtualizedContactTable.tsx` (lines 620-680)

### Phase 2: Shadcn Class Application (Priority 2 - 45 min)

**Goal**: Complete styling consistency with Shadcn

1. Create `SHADCN_STYLES` constant object
2. Replace all header classes with Shadcn equivalents
3. Replace all row classes with Shadcn equivalents
4. Update hover states to use `hover:bg-muted/50`
5. Update selected states to use `bg-accent text-accent-foreground`
6. Update sort icons to use `h-3 w-3` sizing
7. Reorganize header layout from vertical to horizontal

**Files Modified**: `src/components/VirtualizedContactTable.tsx`

### Phase 3: Auto-Resize Implementation (Priority 3 - 60 min)

**Goal**: Intelligent column width management

1. Create `COLUMN_RESIZE_CONFIG` constant
2. Implement `calculateResponsiveWidths` function
3. Implement `useResponsiveColumns` hook
4. Create `getVisibleColumnsForScreenSize` function
5. Update column rendering to use calculated widths
6. Add resize event listener with debouncing
7. Test on multiple viewport sizes

**Files Modified**: 
- `src/components/VirtualizedContactTable.tsx`
- New: `src/hooks/useResponsiveColumns.ts` (optional extraction)

### Phase 4: Responsive Mobile Optimization (Priority 4 - 30 min)

**Goal**: Excellent mobile experience

1. Implement `MOBILE_COLUMN_CONFIG`
2. Add ScrollArea wrapper for horizontal scroll
3. Test on mobile breakpoints (< 768px)
4. Adjust touch targets for mobile
5. Verify all interactions work on touch devices

**Files Modified**: `src/components/VirtualizedContactTable.tsx`

### Phase 5: Testing & Validation (Priority 5 - 30 min)

**Goal**: Ensure quality and performance

1. Create `scripts/test-table-ui.cjs`
2. Run visual regression tests
3. Run performance benchmarks
4. Verify all widgets still function
5. Test keyboard navigation
6. Test screen reader compatibility

**Files Created**: `scripts/test-table-ui.cjs`

## Shadcn Component Integration

### Required Components

```bash
# Install missing Shadcn components
npx shadcn@latest add table
npx shadcn@latest add scroll-area  # If not already present
```

### Component Usage Pattern

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

// Wrapper structure
<div className={SHADCN_STYLES.tableContainer}>
  <ScrollArea className="w-full">
    <div className="relative">
      {/* Header */}
      <div className={SHADCN_STYLES.tableHeader}>
        <div className={SHADCN_STYLES.headerRow}>
          {/* Header cells */}
        </div>
      </div>
      
      {/* Virtualized Body */}
      <div className={SHADCN_STYLES.tableBody}>
        {/* Virtual rows */}
      </div>
    </div>
  </ScrollArea>
</div>
```

**Note**: We maintain custom virtualization instead of using Shadcn's Table components directly, as they don't support virtualization out of the box. We adopt Shadcn's styling classes while keeping our virtualization logic.

## Design Decisions & Rationales

### 1. Why Not Use Shadcn Table Components Directly?

**Decision**: Use Shadcn styling classes but maintain custom rendering logic.

**Rationale**: 
- Shadcn's Table components don't support virtualization
- Our table needs to render 5000+ contacts efficiently
- @tanstack/react-virtual requires direct DOM control
- Shadcn classes provide the visual consistency we need

### 2. Why Separate Fixed and Flexible Columns?

**Decision**: Create two distinct column categories with different resize behaviors.

**Rationale**:
- Date/time columns have predictable content widths
- Text columns (email, comment) benefit from extra space
- Users expect status indicators to be consistently sized
- Prevents awkward column proportions on wide screens

### 3. Why Remove Vertical Borders?

**Decision**: Eliminate all `border-r` classes between columns.

**Rationale**:
- Modern data tables (Google Sheets, Notion) use whitespace for separation
- Shadcn design philosophy emphasizes minimal visual weight
- Borders create visual clutter with many columns
- Hover states provide sufficient row delineation

### 4. Why Reduce Header Height?

**Decision**: Change from 64px (h-16) to 40px (h-10).

**Rationale**:
- Shadcn standard for table headers is h-10
- More vertical space for data rows
- Horizontal layout eliminates need for tall headers
- Matches user expectations from other Shadcn tables

### 5. Why Use Growth Factors Instead of Percentages?

**Decision**: Implement proportional growth system with weights.

**Rationale**:
- More flexible than fixed percentages
- Adapts better to different screen sizes
- Allows fine-tuned control (e.g., Comment gets 3x more space than Name)
- Respects minimum widths while maximizing space usage

## Accessibility Considerations

### Preserved Features

1. **Keyboard Navigation**: All existing keyboard shortcuts maintained
2. **ARIA Labels**: All aria-label attributes preserved
3. **Focus Management**: Tab order and focus indicators unchanged
4. **Screen Reader Support**: Table semantics maintained
5. **Color Contrast**: Shadcn colors meet WCAG AA standards

### Enhanced Features

1. **Reduced Motion**: Transition classes respect `prefers-reduced-motion`
2. **High Contrast**: Shadcn's muted colors work well in high contrast mode
3. **Touch Targets**: Mobile breakpoints ensure 44px minimum touch targets

## Performance Optimization

### Memoization Strategy

```typescript
// Memoize expensive calculations
const calculatedColumns = useMemo(
  () => calculateResponsiveWidths(visibleOrderedColumns, containerWidth),
  [visibleOrderedColumns, containerWidth]
);

// Memoize row renderer
const renderRow = useCallback((virtualRow, contact) => {
  // ... rendering logic
}, [calculatedColumns, selectedContacts, editingCell]);
```

### Debouncing Resize Events

```typescript
const [containerWidth, setContainerWidth] = useState(1200);

useEffect(() => {
  const handleResize = debounce(() => {
    setContainerWidth(scrollContainerRef.current?.clientWidth || 1200);
  }, 150);
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### Virtual Scrolling Optimization

```typescript
// Adjust overscan based on screen size
const getOverscan = (screenSize: ScreenSize): number => {
  switch (screenSize) {
    case 'sm': return 5;   // Mobile: fewer rows
    case 'md': return 8;   // Tablet: moderate
    case 'lg': return 10;  // Desktop: more rows
    case 'xl': return 12;  // Wide: most rows
  }
};

const rowVirtualizer = useVirtualizer({
  count: sortedContacts.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => SHADCN_SPACING.rowHeight,
  overscan: getOverscan(screenSize),
});
```

## Migration Checklist

- [ ] Phase 1: Remove 3D effects and reduce header height
- [ ] Phase 2: Apply all Shadcn style classes
- [ ] Phase 3: Implement column auto-resize system
- [ ] Phase 4: Add responsive breakpoints
- [ ] Phase 5: Create and run test suite
- [ ] Verify all widgets function correctly
- [ ] Verify performance benchmarks pass
- [ ] Verify accessibility features preserved
- [ ] Update documentation
- [ ] Deploy to staging for user testing

## Expected Outcomes

### Visual Results

- Clean, flat appearance matching Shadcn examples
- Headers reduced from 64px to 40px
- No visible vertical grid lines
- Subtle hover states with `bg-muted/50`
- Consistent spacing using `px-3 py-2`

### Functional Results

- All existing features work identically
- Column widths adapt intelligently to screen size
- Mobile users see essential columns only
- Performance maintained at 60fps scrolling
- No increase in bundle size (using existing Shadcn components)

### User Experience Results

- More data visible on screen (shorter headers)
- Less visual clutter (no borders)
- Better readability (Shadcn color palette)
- Responsive on all devices
- Familiar Shadcn interaction patterns
