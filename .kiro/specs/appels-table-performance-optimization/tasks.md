# Implementation Plan

## Overview

This implementation plan transforms the ContactTable component to use TanStack Table v8 with TanStack Virtual for optimal performance. Each task builds incrementally, ensuring the table remains functional throughout the migration. The plan prioritizes core virtualization first, then optimizations, maintaining 100% visual and functional parity.

---

## Tasks

- [ ] 1. Create memoized cell components
  - Extract cell rendering logic into separate memoized components to prevent unnecessary re-renders
  - Create MemoizedStatusCell, MemoizedCommentCell, MemoizedDateRappelCell, MemoizedDateTimeCell
  - Implement custom comparison functions for each memoized component
  - Add useCallback hooks for all event handlers within cell components
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 2. Define TanStack Table column definitions
  - Create columnDefinitions array using TanStack Table's ColumnDef type
  - Map existing column configuration to TanStack Table format
  - Define accessorKey, header, size, minSize for each column
  - Implement cell renderers using flexRender pattern
  - Add column meta data (canHide, icon, etc.)
  - Integrate memoized cell components into column definitions
  - _Requirements: 2.2, 2.5, 3.4, 4.2_

- [ ] 3. Integrate TanStack Table core
  - Import useReactTable hook and required model functions
  - Replace manual table state with TanStack Table state management
  - Configure table with getCoreRowModel and getSortedRowModel
  - Set up sorting state with onSortingChange handler
  - Configure column visibility state
  - Add table meta for passing callbacks (onUpdateContact, theme, etc.)
  - _Requirements: 2.1, 2.3, 2.4, 4.4_

- [ ] 4. Implement row virtualization with TanStack Virtual
  - Import useVirtualizer hook from @tanstack/react-virtual
  - Configure virtualizer with count, getScrollElement, estimateSize, overscan
  - Calculate paddingTop and paddingBottom for virtual scrolling
  - Update table body to render only virtualRows
  - Add data-index attribute to rows for virtualizer measurement
  - Implement measureElement callback for dynamic row heights
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 5. Refactor table header rendering
  - Update header to use table.getVisibleLeafColumns()
  - Implement column.getToggleSortingHandler() for sorting
  - Add sort indicators using column.getIsSorted()
  - Preserve sticky header styles with inline CSS
  - Maintain drag-and-drop column reordering (if applicable)
  - Ensure header icons and labels render correctly
  - _Requirements: 3.2, 4.4, 2.5_

- [ ] 6. Update row rendering with virtualization
  - Replace sortedContacts.map with virtualRows.map
  - Access actual row data using rows[virtualRow.index]
  - Remove Framer Motion animations from rows
  - Preserve row selection and hover states
  - Maintain active call highlighting
  - Add ref callback for virtualizer.measureElement
  - _Requirements: 1.1, 1.2, 3.3, 3.5, 5.5_

- [ ] 7. Refactor cell rendering
  - Update cells to use row.getVisibleCells()
  - Use flexRender for cell content rendering
  - Pass cell.getContext() to cell renderers
  - Preserve double-click inline editing
  - Maintain cell styling and className logic
  - Ensure all widgets (DateTimeCell, CommentWidget, StatusSelect) work correctly
  - _Requirements: 3.4, 4.1, 4.6_

- [ ] 8. Implement enhanced scroll to contact
  - Update scrollToContact to use virtualizer.scrollToIndex
  - Configure scroll options (align: 'center', behavior: 'smooth')
  - Maintain shouldAutoScrollRef flag for auto-scroll control
  - Test scroll behavior with large datasets
  - Ensure selected row is always visible after scroll
  - _Requirements: 4.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 9. Optimize event handlers with useCallback
  - Wrap handleSort in useCallback with proper dependencies
  - Wrap handleCellDoubleClick in useCallback
  - Wrap handleToggleColumnVisibility in useCallback
  - Wrap handleOpenReminderDialog in useCallback
  - Ensure all callbacks maintain referential equality
  - _Requirements: 5.2, 5.3_

- [ ] 10. Optimize computed values with useMemo
  - Wrap columnDefinitions in useMemo
  - Wrap visibleOrderedColumns calculation in useMemo
  - Remove manual sortedContacts calculation (use TanStack Table's getSortedRowModel)
  - Memoize virtualRows and totalSize from virtualizer
  - _Requirements: 5.3, 5.4_

- [ ] 11. Update column visibility management
  - Integrate column visibility with TanStack Table's columnVisibility state
  - Update handleToggleColumnVisibility to use table.setColumnVisibility
  - Ensure column visibility persists in localStorage
  - Test column show/hide with virtualization
  - _Requirements: 2.5, 4.3_

- [ ] 12. Preserve pagination integration
  - Verify PaginatedContactTable passes correct data to ContactTable
  - Ensure virtualization works with paginated data
  - Test page changes reset scroll position
  - Validate all page size options (25, 50, 100)
  - Maintain current page persistence in localStorage
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 13. Maintain import/export functionality
  - Verify drag-and-drop file import still works
  - Test ImportMappingDialog integration
  - Ensure empty state with import button displays correctly
  - Validate openImportMapping ref method
  - Test all file formats (.csv, .tsv, .xlsx, .xls)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 14. Preserve dialog integrations
  - Test ReminderDialog opens correctly from Date Rappel cell
  - Verify reminder data updates reflect in virtualized rows
  - Ensure dialog state management works with virtualization
  - Test all dialog interactions (save, cancel, close)
  - _Requirements: 4.7, 7.2_

- [ ] 15. Update keyboard navigation and accessibility
  - Test tab navigation through editable cells
  - Verify Enter/Escape key handling for cell editing
  - Ensure focus management works with virtualization
  - Validate ARIA attributes for sortable columns
  - Test screen reader compatibility
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 16. Optimize column type system
  - Verify useColumnTypes hook works with TanStack Table
  - Test ColumnTypeSelector component functionality
  - Ensure column type persistence in localStorage
  - Validate all column types render correct widgets
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 17. Remove Framer Motion animations
  - Remove motion.tr from row rendering
  - Remove AnimatePresence wrapper if no longer needed
  - Remove initial, animate, transition props from rows
  - Verify table still renders smoothly without animations
  - _Requirements: 5.5_

- [ ] 18. Add performance monitoring
  - Implement usePerformanceMonitor hook
  - Add performance.mark and performance.measure calls
  - Log render times for table and cells
  - Monitor scroll performance
  - Track memory usage with large datasets
  - _Requirements: 5.4_

- [ ] 19. Test with various dataset sizes
  - Test with 100 contacts (baseline)
  - Test with 500 contacts
  - Test with 1000 contacts
  - Test with 5000 contacts
  - Verify 60fps scroll performance with all sizes
  - Measure render times and compare to targets
  - _Requirements: 1.5_

- [ ] 20. Validate visual parity
  - Compare screenshots before and after optimization
  - Verify all colors, spacing, borders match exactly
  - Test sticky header with backdrop blur
  - Validate row hover and selection states
  - Check active call highlighting (green background)
  - Test in both light and dark themes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 21. Validate functional parity
  - Test inline cell editing (double-click)
  - Verify drag-and-drop column reordering
  - Test column visibility toggling
  - Validate sorting with visual indicators
  - Test row selection with auto-scroll
  - Verify all keyboard shortcuts work
  - Test reminder dialog integration
  - Validate empty state display
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ] 22. Performance benchmarking
  - Measure initial render time with 1000 contacts
  - Measure scroll FPS with rapid scrolling
  - Measure memory usage with 5000 contacts
  - Measure cell update time for single cell edit
  - Measure sort time with 1000 contacts
  - Compare all metrics to targets in design document
  - _Requirements: 1.5, 5.4_

- [ ] 23. Clean up and refactor
  - Remove old manual sorting logic
  - Remove unused state variables
  - Clean up commented code
  - Update TypeScript types if needed
  - Add JSDoc comments for complex functions
  - _Requirements: All_

- [ ] 24. Update documentation
  - Document new TanStack Table integration
  - Document virtualization configuration
  - Add performance optimization notes
  - Update component props documentation
  - Add migration notes for future developers
  - _Requirements: All_

---

## Notes

- **Incremental Development:** Each task builds on the previous one, ensuring the table remains functional throughout
- **Testing:** Test after each major task (especially tasks 4, 6, 7, 8) to catch issues early
- **Visual Parity:** Constantly compare with the original implementation to ensure no visual changes
- **Performance:** Monitor performance metrics after tasks 18, 19, 22 to validate improvements
- **Rollback:** Keep the original ContactTable.tsx as ContactTable.legacy.tsx until all tests pass
