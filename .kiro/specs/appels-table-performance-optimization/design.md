# Design Document

## Overview

This design implements a high-performance virtualized table for the "Appels" page using TanStack Table v8 and TanStack Virtual v3. The solution maintains 100% visual and functional parity with the current implementation while dramatically improving performance for large datasets through row virtualization and optimized re-rendering strategies.

**Key Performance Improvements:**
- Only renders visible rows (viewport + overscan buffer)
- Eliminates expensive Framer Motion animations on rows
- Implements React.memo and useCallback for optimal re-renders
- Uses TanStack Table's built-in sorting and state management
- Maintains smooth 60fps scrolling with 1000+ contacts

**No Visual Changes:**
- Exact same styling, colors, spacing
- All widgets preserved (DateTimeCell, CommentWidget, StatusSelect)
- Sticky header with backdrop blur
- Row selection and hover states
- Active call highlighting

## Architecture

### Component Hierarchy

```
PaginatedContactTable (unchanged wrapper)
  └── ContactTable (refactored with virtualization)
      ├── TanStack Table Instance (useReactTable)
      ├── TanStack Virtual Instance (useVirtualizer)
      ├── Sticky Header (preserved)
      ├── Virtualized Body
      │   ├── VirtualizedRow (memoized)
      │   │   └── TableCell
      │   │       └── CellContent (memoized widgets)
      │   └── ...
      └── Dialogs (ReminderDialog, etc.)
```

### Data Flow

```
App State (contacts array)
  ↓
PaginatedContactTable (pagination logic)
  ↓
ContactTable (virtualization + table logic)
  ↓
TanStack Table (sorting, column management)
  ↓
TanStack Virtual (viewport calculation)
  ↓
Render only visible rows
```

## Components and Interfaces

### 1. ContactTable Refactoring

**Current Issues:**
- Renders all contacts regardless of visibility
- Framer Motion on every row causes performance bottlenecks
- No memoization of cell components
- Manual sorting implementation

**New Implementation:**

```typescript
// Core hooks
const table = useReactTable<Contact>({
  data: sortedContacts,
  columns: columnDefinitions,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  state: {
    sorting: sortConfig,
    columnVisibility: visibleColumnsState,
  },
  onSortingChange: setSortConfig,
  // ... other options
});

const rows = table.getRowModel().rows;

const virtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 40, // Estimated row height in pixels
  overscan: 10, // Render 10 extra rows above/below viewport
  measureElement: (element) => element?.getBoundingClientRect().height,
});

const virtualRows = virtualizer.getVirtualItems();
const totalSize = virtualizer.getTotalSize();
```

**Key Changes:**
1. Replace manual sorting with `getSortedRowModel()`
2. Use `useVirtualizer` for row virtualization
3. Remove Framer Motion from rows
4. Implement memoized cell components

### 2. Column Definitions

**Structure:**

```typescript
type ContactColumnDef = ColumnDef<Contact> & {
  id: string;
  canHide: boolean;
  icon: React.ComponentType<any>;
  minWidth?: string;
};

const columnDefinitions = useMemo<ContactColumnDef[]>(() => [
  {
    id: 'numeroLigne',
    accessorKey: 'numeroLigne',
    header: '#',
    size: 60,
    minSize: 60,
    canHide: false,
    icon: Hash,
    cell: ({ row }) => (
      <span className="font-medium text-center block">
        {contacts.findIndex(c => c.id === row.original.id) + 1}
      </span>
    ),
  },
  {
    id: 'prenom',
    accessorKey: 'prenom',
    header: 'Prénom',
    size: 120,
    minSize: 100,
    canHide: false,
    icon: User,
    cell: ({ getValue }) => (
      <span className="cursor-pointer hover:text-primary transition-colors font-medium">
        {getValue() || 'N/A'}
      </span>
    ),
  },
  {
    id: 'telephone',
    accessorKey: 'telephone',
    header: 'Téléphone',
    size: 150,
    minSize: 150,
    canHide: true,
    icon: Phone,
    cell: ({ getValue }) => (
      <span className="cursor-pointer hover:text-primary transition-colors font-mono">
        {getValue() ? formatPhoneNumber(getValue() as string) : 'N/A'}
      </span>
    ),
  },
  {
    id: 'statut',
    accessorKey: 'statut',
    header: 'Statut',
    size: 150,
    canHide: true,
    icon: FileText,
    cell: ({ row, table }) => (
      <MemoizedStatusCell
        contact={row.original}
        onUpdateContact={table.options.meta?.onUpdateContact}
      />
    ),
  },
  {
    id: 'commentaire',
    accessorKey: 'commentaire',
    header: 'Commentaire',
    size: 200,
    canHide: false,
    icon: MessageCircle,
    cell: ({ row, getValue, table }) => (
      <MemoizedCommentCell
        value={getValue() as string}
        contactId={row.original.id}
        onUpdateContact={table.options.meta?.onUpdateContact}
        theme={table.options.meta?.theme}
      />
    ),
  },
  {
    id: 'dateRappel',
    accessorKey: 'dateRappel',
    header: 'Date Rappel',
    size: 180,
    canHide: true,
    icon: CalendarIcon,
    cell: ({ row, getValue, table }) => (
      <MemoizedDateRappelCell
        value={getValue() as string}
        contact={row.original}
        onUpdateContact={table.options.meta?.onUpdateContact}
        onOpenReminderDialog={table.options.meta?.onOpenReminderDialog}
        theme={table.options.meta?.theme}
      />
    ),
  },
  // ... other columns
], [contacts, theme, onUpdateContact, onOpenReminderDialog]);
```

**Column Meta Data:**

```typescript
declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    onUpdateContact: (contact: Partial<Contact> & { id: string }) => void;
    onOpenReminderDialog: (contact: Contact) => void;
    theme: Theme;
  }
}
```

### 3. Memoized Cell Components

**Purpose:** Prevent unnecessary re-renders when other cells update.

```typescript
// Memoized Status Cell
const MemoizedStatusCell = React.memo<{
  contact: Contact;
  onUpdateContact: (contact: Partial<Contact> & { id: string }) => void;
}>(({ contact, onUpdateContact }) => {
  const handleChange = useCallback((newStatus: ContactStatus) => {
    onUpdateContact({
      id: contact.id,
      statut: newStatus,
    });
  }, [contact.id, onUpdateContact]);

  return (
    <StatusSelect
      value={contact.statut || ContactStatus.NonDefini}
      onChange={handleChange}
      triggerClassName="border-none bg-transparent p-0 h-auto"
      contentClassName="bg-popover border shadow-lg"
      size="sm"
    />
  );
}, (prev, next) => {
  // Custom comparison: only re-render if status changes
  return prev.contact.statut === next.contact.statut;
});

// Memoized Comment Cell
const MemoizedCommentCell = React.memo<{
  value: string;
  contactId: string;
  onUpdateContact: (contact: Partial<Contact> & { id: string }) => void;
  theme: Theme;
}>(({ value, contactId, onUpdateContact, theme }) => {
  const handleChange = useCallback((newComment: string) => {
    onUpdateContact({
      id: contactId,
      commentaire: newComment,
    });
  }, [contactId, onUpdateContact]);

  return (
    <CommentWidget
      value={value || ''}
      onChange={handleChange}
      theme={theme}
    />
  );
}, (prev, next) => {
  return prev.value === next.value && prev.theme === next.theme;
});

// Memoized Date Rappel Cell with Bell Button
const MemoizedDateRappelCell = React.memo<{
  value: string;
  contact: Contact;
  onUpdateContact: (contact: Partial<Contact> & { id: string }) => void;
  onOpenReminderDialog: (contact: Contact) => void;
  theme: Theme;
}>(({ value, contact, onUpdateContact, onOpenReminderDialog, theme }) => {
  const handleDateChange = useCallback((newDate: string) => {
    onUpdateContact({
      id: contact.id,
      dateRappel: newDate,
    });
  }, [contact.id, onUpdateContact]);

  const handleBellClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onOpenReminderDialog(contact);
  }, [contact, onOpenReminderDialog]);

  return (
    <div className="flex items-center justify-center gap-1">
      <DateTimeCell
        value={value || ''}
        type="date"
        onChange={handleDateChange}
        theme={theme}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-primary"
        title="Programmer un rappel"
        onClick={handleBellClick}
      >
        <Bell className="h-4 w-4" />
      </Button>
    </div>
  );
}, (prev, next) => {
  return prev.value === next.value && 
         prev.contact.id === next.contact.id &&
         prev.theme === next.theme;
});

// Memoized DateTime Cell
const MemoizedDateTimeCell = React.memo<{
  value: string;
  type: 'date' | 'time';
  contactId: string;
  field: keyof Contact;
  onUpdateContact: (contact: Partial<Contact> & { id: string }) => void;
  theme: Theme;
}>(({ value, type, contactId, field, onUpdateContact, theme }) => {
  const handleChange = useCallback((newValue: string) => {
    onUpdateContact({
      id: contactId,
      [field]: newValue,
    });
  }, [contactId, field, onUpdateContact]);

  return (
    <DateTimeCell
      value={value || ''}
      type={type}
      onChange={handleChange}
      theme={theme}
    />
  );
}, (prev, next) => {
  return prev.value === next.value && prev.theme === next.theme;
});
```

### 4. Virtualized Row Rendering

**Implementation:**

```typescript
// In ContactTable component
const virtualRows = virtualizer.getVirtualItems();
const totalSize = virtualizer.getTotalSize();

// Padding for virtual scrolling
const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
const paddingBottom = virtualRows.length > 0
  ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
  : 0;

return (
  <div 
    ref={scrollContainerRef}
    className="border rounded-t-lg scrollbar-hidden relative bg-background transition-all duration-300 h-full overflow-auto"
    style={{
      position: 'relative',
      height: '100%',
    }}
  >
    <Table 
      className="relative w-full table-auto min-w-[560px] md:min-w-0"
      style={{ 
        borderCollapse: 'separate', 
        borderSpacing: 0,
      }}
    >
      {/* Sticky Header */}
      <TableHeader 
        className="[&_tr]:border-b sticky-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 101,
          backgroundColor: 'hsl(var(--background))',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      >
        <TableRow className="hover:bg-transparent border-b">
          {table.getVisibleLeafColumns().map((column) => (
            <TableHead
              key={column.id}
              style={{
                width: column.getSize(),
                minWidth: column.columnDef.minSize,
              }}
              onClick={column.getToggleSortingHandler()}
              className={cn(
                "text-foreground h-16 align-middle whitespace-nowrap px-2 py-1.5 text-center font-medium text-xs select-none",
                column.getCanSort() && "cursor-pointer hover:bg-muted"
              )}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="flex items-center justify-center gap-1 w-full">
                  <span className="inline-flex items-center gap-1.5 truncate text-xs font-medium">
                    {TABLE_HEADER_ICONS[column.columnDef.header as string]}
                    <span className="truncate">{column.columnDef.header}</span>
                  </span>
                  {column.getCanSort() && (
                    <>
                      {column.getIsSorted() === 'asc' && <ArrowUp className="w-3 h-3" />}
                      {column.getIsSorted() === 'desc' && <ArrowDown className="w-3 h-3" />}
                      {!column.getIsSorted() && <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />}
                    </>
                  )}
                </div>
              </div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      {/* Virtualized Body */}
      <TableBody>
        {/* Top padding for virtual scroll */}
        {paddingTop > 0 && (
          <tr>
            <td style={{ height: `${paddingTop}px` }} />
          </tr>
        )}

        {/* Render only visible rows */}
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          const isSelected = selectedContactId === row.original.id;
          const isActiveCall = activeCallContactId === row.original.id;

          return (
            <TableRow
              key={row.id}
              data-contact-id={row.original.id}
              data-index={virtualRow.index}
              ref={(node) => virtualizer.measureElement(node)}
              className={cn(
                !isSelected && "hover:bg-muted/50",
                "cursor-pointer transition-colors duration-150",
                isSelected && "bg-blue-500/20 dark:bg-blue-500/30 text-foreground",
                isActiveCall && !isSelected && (
                  theme === Theme.Dark
                    ? "bg-green-900/20 hover:bg-green-900/30"
                    : "bg-green-100 hover:bg-green-200"
                )
              )}
              onClick={() => {
                shouldAutoScrollRef.current = true;
                onSelectContact(row.original);
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className="px-2 py-1.5 text-xs text-center align-middle"
                  style={{
                    width: cell.column.getSize(),
                    minWidth: cell.column.columnDef.minSize,
                  }}
                  onDoubleClick={() => {
                    if (cell.column.id !== 'numeroLigne') {
                      handleCellDoubleClick(
                        row.original.id,
                        cell.column.id as keyof Contact,
                        cell.getValue()
                      );
                    }
                  }}
                >
                  <div className="flex items-center justify-center min-h-[32px]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          );
        })}

        {/* Bottom padding for virtual scroll */}
        {paddingBottom > 0 && (
          <tr>
            <td style={{ height: `${paddingBottom}px` }} />
          </tr>
        )}
      </TableBody>
    </Table>
  </div>
);
```

### 5. Scroll to Contact Implementation

**Enhanced with Virtualization:**

```typescript
const scrollToContact = useCallback((contactId: string) => {
  if (!scrollContainerRef.current) return;

  const contactIndex = rows.findIndex(row => row.original.id === contactId);
  if (contactIndex === -1) return;

  // Use virtualizer's scrollToIndex for smooth scrolling
  virtualizer.scrollToIndex(contactIndex, {
    align: 'center',
    behavior: 'smooth',
  });
}, [rows, virtualizer]);

// Expose via ref
useImperativeHandle(ref, () => ({
  scrollToContact,
  openImportMapping: async (file: File) => {
    await prepareAndOpenMappingDialog(file);
  }
}), [scrollToContact]);
```

## Data Models

### TanStack Table State

```typescript
interface TableState {
  sorting: SortingState;
  columnVisibility: VisibilityState;
  columnOrder: string[];
}

type SortingState = Array<{
  id: string;
  desc: boolean;
}>;

type VisibilityState = Record<string, boolean>;
```

### Virtualizer Configuration

```typescript
interface VirtualizerOptions {
  count: number;              // Total number of rows
  getScrollElement: () => HTMLElement | null;
  estimateSize: () => number; // Estimated row height
  overscan: number;           // Extra rows to render
  measureElement?: (element: Element) => void;
}
```

## Error Handling

### Virtualization Edge Cases

1. **Empty Dataset:**
   - Display EmptyState component
   - Virtualizer handles count: 0 gracefully

2. **Rapid Scrolling:**
   - Overscan buffer prevents blank spaces
   - measureElement ensures accurate heights

3. **Dynamic Row Heights:**
   - Use measureElement for actual heights
   - Virtualizer adjusts automatically

4. **Selection During Scroll:**
   - scrollToIndex ensures selected row is visible
   - Smooth behavior prevents jarring jumps

### Performance Safeguards

```typescript
// Debounce expensive operations
const debouncedSort = useMemo(
  () => debounce((sortConfig: SortingState) => {
    setSortConfig(sortConfig);
  }, 100),
  []
);

// Throttle scroll events if needed
const throttledScroll = useMemo(
  () => throttle(() => {
    // Handle scroll-dependent logic
  }, 16), // ~60fps
  []
);
```

## Testing Strategy

### Performance Testing

1. **Benchmark Tests:**
   - Measure render time with 100, 500, 1000, 5000 contacts
   - Compare before/after optimization
   - Target: <16ms render time for 60fps

2. **Scroll Performance:**
   - Test rapid scrolling with large datasets
   - Measure frame drops
   - Verify overscan buffer effectiveness

3. **Memory Usage:**
   - Monitor memory consumption with large datasets
   - Verify proper cleanup on unmount
   - Check for memory leaks

### Functional Testing

1. **Virtualization:**
   - Verify only visible rows are rendered
   - Test scroll to contact functionality
   - Validate row height calculations

2. **Sorting:**
   - Test all column sorts (asc/desc/none)
   - Verify sort persistence in localStorage
   - Test sort with virtualization

3. **Cell Editing:**
   - Test inline editing with virtualization
   - Verify double-click activation
   - Test keyboard shortcuts (Enter/Escape)

4. **Selection:**
   - Test row selection with auto-scroll
   - Verify selection highlighting
   - Test selection persistence during scroll

5. **Column Management:**
   - Test column visibility toggling
   - Verify drag-and-drop reordering
   - Test column type changes

### Visual Regression Testing

1. **Screenshot Comparison:**
   - Compare before/after screenshots
   - Verify pixel-perfect match
   - Test all themes (light/dark)

2. **Interaction Testing:**
   - Test hover states
   - Verify active call highlighting
   - Test selection states

### Integration Testing

1. **Pagination:**
   - Test page changes with virtualization
   - Verify scroll reset on page change
   - Test all page sizes (25, 50, 100)

2. **Import/Export:**
   - Test file import with virtualization
   - Verify data updates reflect in virtual rows
   - Test export functionality

3. **Dialogs:**
   - Test ReminderDialog integration
   - Verify ImportMappingDialog
   - Test all modal interactions

## Performance Metrics

### Target Metrics

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Initial Render (1000 contacts) | ~500ms | <100ms | 5x faster |
| Scroll FPS | 30-40fps | 60fps | 1.5-2x smoother |
| Memory Usage (5000 contacts) | ~200MB | <100MB | 2x reduction |
| Cell Update Time | ~50ms | <10ms | 5x faster |
| Sort Time (1000 contacts) | ~200ms | <50ms | 4x faster |

### Monitoring

```typescript
// Performance monitoring hook
const usePerformanceMonitor = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          console.log(`${entry.name}: ${entry.duration}ms`);
        }
      }
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, []);
};

// Usage in ContactTable
performance.mark('table-render-start');
// ... render logic
performance.mark('table-render-end');
performance.measure('table-render', 'table-render-start', 'table-render-end');
```

## Migration Strategy

### Phase 1: Preparation
1. Add TanStack Table column definitions
2. Create memoized cell components
3. Set up performance monitoring

### Phase 2: Core Implementation
1. Integrate useReactTable hook
2. Implement useVirtualizer
3. Refactor row rendering

### Phase 3: Optimization
1. Remove Framer Motion from rows
2. Implement React.memo for cells
3. Add useCallback for handlers

### Phase 4: Testing & Validation
1. Run performance benchmarks
2. Execute functional tests
3. Perform visual regression testing

### Phase 5: Cleanup
1. Remove old sorting logic
2. Clean up unused code
3. Update documentation

## Rollback Plan

If issues arise:
1. Feature flag to toggle virtualization
2. Keep old implementation as fallback
3. Gradual rollout to users
4. Monitor error rates and performance

```typescript
const USE_VIRTUALIZATION = process.env.REACT_APP_USE_VIRTUALIZATION === 'true';

return USE_VIRTUALIZATION ? (
  <VirtualizedContactTable {...props} />
) : (
  <LegacyContactTable {...props} />
);
```
