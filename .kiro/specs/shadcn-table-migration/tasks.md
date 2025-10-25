# Implementation Plan

- [x] 1. Install and verify Shadcn components from registry


  - Install table component via MCP Shadcn Registry using `npx shadcn@latest add table`
  - Verify scroll-area component is present, install if missing
  - Check component compatibility with existing virtualization setup
  - _Requirements: 3.1, 3.2, 3.4, 3.5_





- [ ] 2. Create styling constants and configuration objects
  - [ ] 2.1 Create SHADCN_STYLES constant object in VirtualizedContactTable.tsx
    - Define all table container, header, body, row, and cell style classes


    - Include sort icon styles and state-specific classes
    - Use exact Shadcn class patterns from design document
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_



  - [ ] 2.2 Create SHADCN_SPACING configuration object
    - Define headerHeight (40px), rowHeight (36px), cellPadding, iconSize




    - Export as const for type safety
    - _Requirements: 1.2, 6.2, 6.5_

  - [x] 2.3 Create COLUMN_RESIZE_CONFIG object


    - Define fixed column widths for date/time/status columns
    - Define flexible column configurations with min, preferred, and grow values
    - Document the resize behavior for each column type
    - _Requirements: 2.1, 2.5_



- [ ] 3. Remove legacy 3D styling and heavy visual effects
  - [x] 3.1 Remove boxShadow from header cells



    - Locate all inline style objects with boxShadow properties (around line 620)
    - Remove boxShadow, backdropFilter, WebkitBackdropFilter, willChange, transform properties
    - Replace with Shadcn backdrop-blur classes
    - _Requirements: 1.1, 1.5, 6.6_


  - [ ] 3.2 Remove vertical borders from all cells
    - Remove border-r and last:border-r-0 classes from header cells
    - Remove border-r and last:border-r-0 classes from body cells
    - Verify no vertical lines appear in rendered table
    - _Requirements: 1.3, 6.7_


  - [ ] 3.3 Reduce header height from h-16 to h-10
    - Update header cell className to use h-10 instead of h-16

    - Adjust vertical alignment classes if needed
    - Update rowVirtualizer estimateSize to 36px




    - _Requirements: 1.2, 4.1_

- [ ] 4. Apply Shadcn styling classes to headers
  - [ ] 4.1 Update header container classes
    - Apply SHADCN_STYLES.tableHeader to sticky header container

    - Replace custom blur filters with bg-background/95 backdrop-blur
    - Add supports-[backdrop-filter]:bg-background/60 for browser compatibility
    - _Requirements: 1.5, 6.2, 9.1_

  - [x] 4.2 Update header cell classes

    - Apply SHADCN_STYLES.headerCell base classes
    - Add SHADCN_STYLES.headerCellSortable for sortable columns
    - Add first:rounded-tl-md and last:rounded-tr-md for corner rounding
    - Use text-muted-foreground for header text color




    - _Requirements: 6.2, 8.1, 8.2_

  - [ ] 4.3 Reorganize header cell content layout
    - Change from vertical flex-col to horizontal flex layout
    - Position column label and sort icon side-by-side with justify-between
    - Update sort icons to h-3 w-3 size
    - Apply text-muted-foreground to active sort icons, text-muted-foreground/40 to inactive

    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 5. Apply Shadcn styling classes to body rows and cells
  - [ ] 5.1 Update body row classes
    - Apply SHADCN_STYLES.bodyRow base classes

    - Replace custom selection styles with SHADCN_STYLES.bodyRowSelected (bg-accent text-accent-foreground)
    - Update active call styles with SHADCN_STYLES.bodyRowActiveCall
    - Use hover:bg-muted/50 for hover states
    - _Requirements: 6.3, 6.4_





  - [ ] 5.2 Update body cell classes
    - Apply SHADCN_STYLES.bodyCell (px-3 py-2 text-sm flex items-center flex-shrink-0)
    - Remove all border-r classes
    - Ensure flex-shrink-0 prevents cell collapse
    - _Requirements: 6.5, 6.7_


  - [ ] 5.3 Update INPUT_BASE_CLASS for inline editing
    - Change to "h-8 px-3 py-1 text-sm border-0 bg-transparent focus:bg-accent/50 transition-colors"
    - Ensure consistency with Shadcn input styling
    - Test inline editing still works correctly
    - _Requirements: 5.1, 6.5_



- [ ] 6. Implement column auto-resize system
  - [ ] 6.1 Create calculateResponsiveWidths function
    - Implement algorithm to calculate fixed column total width


    - Calculate available width for flexible columns (containerWidth - fixedWidth - margin)
    - Calculate total growth weight from flexible columns
    - Distribute available width proportionally based on grow factors
    - Enforce minimum and maximum width constraints




    - Return array of columns with calculatedWidth property
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 6.2 Integrate calculateResponsiveWidths with useMemo

    - Wrap function in useMemo with dependencies on visibleOrderedColumns and containerWidth
    - Add error handling with fallback to 100px widths
    - Add validation for minimum container width (320px)
    - _Requirements: 2.2, 4.3_




  - [ ] 6.3 Update column rendering to use calculated widths
    - Replace existing width/minWidth/maxWidth logic with calculatedWidth
    - Apply calculatedWidth to style.width for each header cell
    - Apply calculatedWidth to style.width for each body cell
    - Ensure flex-shrink-0 prevents unwanted resizing


    - _Requirements: 2.1, 2.5_

- [x] 7. Implement responsive breakpoint system



  - [ ] 7.1 Create useResponsiveColumns hook
    - Implement useState for screenSize ('sm' | 'md' | 'lg' | 'xl')
    - Add resize event listener with updateScreenSize function
    - Set breakpoints: <768px (sm), 768-1024px (md), 1024-1280px (lg), >1280px (xl)
    - Debounce resize events to prevent excessive recalculations
    - Return current screenSize

    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 7.2 Create MOBILE_COLUMN_CONFIG object
    - Define essential columns for sm breakpoint: ['#', 'Prénom', 'Nom', 'Statut', 'Commentaire']
    - Define columns for md breakpoint: add 'Téléphone', 'Date Rappel'

    - Set lg and xl to 'all' (show all visible columns)
    - _Requirements: 2.4, 7.1, 7.2_

  - [ ] 7.3 Create getVisibleColumnsForScreenSize function
    - Filter columns based on MOBILE_COLUMN_CONFIG for current screenSize
    - Return all columns if screenSize is 'lg' or 'xl'

    - Preserve column order from original configuration
    - _Requirements: 2.4, 7.1, 7.2_

  - [ ] 7.4 Integrate responsive columns into rendering
    - Call useResponsiveColumns hook to get current screenSize
    - Apply getVisibleColumnsForScreenSize before calculateResponsiveWidths
    - Update visibleOrderedColumns to respect screen size filtering

    - Test column visibility changes on viewport resize
    - _Requirements: 2.4, 7.1, 7.2, 7.3, 7.4_

- [ ] 8. Update container and wrapper styling
  - [x] 8.1 Update main table container

    - Replace existing container classes with SHADCN_STYLES.tableContainer
    - Apply "rounded-md border bg-background"
    - Remove transition-all and duration-300 classes
    - _Requirements: 9.1, 9.2_





  - [ ] 8.2 Add ScrollArea wrapper for horizontal scrolling
    - Wrap table content in Shadcn ScrollArea component
    - Apply "w-full whitespace-nowrap" classes
    - Ensure horizontal scroll works on narrow viewports
    - Test touch scrolling on mobile devices
    - _Requirements: 3.2, 9.3, 9.4_



- [ ] 9. Optimize virtualization for new row height
  - [x] 9.1 Update rowVirtualizer configuration




    - Change estimateSize from 40 to SHADCN_SPACING.rowHeight (36)
    - Verify overscan value is appropriate (10 rows)
    - Test scrolling performance with 5000+ contacts
    - _Requirements: 4.1, 4.2_


  - [ ] 9.2 Add dynamic overscan based on screen size
    - Create getOverscan function that returns overscan value based on screenSize
    - Use lower overscan (5) for mobile, higher (12) for wide screens
    - Apply to rowVirtualizer configuration
    - _Requirements: 4.2, 7.1_

- [x] 10. Preserve and verify all existing functionality

  - [ ] 10.1 Verify inline editing works
    - Test clicking cells to enter edit mode
    - Test blur and Enter key to commit changes
    - Test Escape key to cancel editing
    - Verify debounced updates still work
    - _Requirements: 5.1, 4.4_


  - [ ] 10.2 Verify sorting functionality
    - Test clicking sortable headers toggles sort direction
    - Verify sort icons display correctly (ArrowUp, ArrowDown, ArrowUpDown)
    - Test sort state persistence in localStorage
    - _Requirements: 5.2, 8.3, 8.4, 5.6_


  - [ ] 10.3 Verify selection and multi-select
    - Test row selection on click
    - Test Ctrl+click for multi-select
    - Test Shift+click for range select
    - Verify selected row styling (bg-accent text-accent-foreground)
    - _Requirements: 5.3, 6.4_

  - [ ] 10.4 Verify all cell widgets function
    - Test StatusSelect dropdown changes status correctly
    - Test CommentWidget quick comment insertion
    - Test DateTimeCell date picker
    - Test ReminderDialog opens and saves reminders
    - Test phone number formatting in telephone cells
    - _Requirements: 5.4, 4.5_

  - [ ] 10.5 Verify column visibility and reordering
    - Test column visibility toggle from toolbar
    - Test drag-and-drop column reordering
    - Verify localStorage persistence of column order and visibility
    - _Requirements: 5.5, 5.6_

  - [ ] 10.6 Verify keyboard navigation
    - Test Tab key navigation through cells
    - Test arrow key navigation
    - Test Enter key to edit cells
    - Test Escape key to cancel actions
    - _Requirements: 5.7_

- [ ] 11. Create visual regression test script
  - [ ] 11.1 Create scripts/test-table-ui.cjs
    - Implement test for header height equals 40px
    - Implement test for no boxShadow styles in DOM
    - Implement test for no border-r classes present
    - Implement test for Shadcn classes applied (text-muted-foreground, px-3)
    - Implement test for auto-resize on viewport changes
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 11.2 Create performance benchmark tests
    - Test render time for 5000 contacts < 100ms
    - Test scroll performance maintains 60fps
    - Test column recalculation time < 50ms
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 12. Final integration and testing
  - [ ] 12.1 Run visual regression tests
    - Execute scripts/test-table-ui.cjs
    - Verify all visual tests pass
    - Fix any styling inconsistencies found
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 12.2 Test on multiple screen sizes
    - Test on mobile viewport (375px width)
    - Test on tablet viewport (768px width)
    - Test on desktop viewport (1280px width)
    - Test on wide desktop viewport (1920px width)
    - Verify column visibility and widths adapt correctly
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 2.4_

  - [ ] 12.3 Test with large datasets
    - Load table with 5000+ contacts
    - Verify smooth scrolling performance
    - Verify no memory leaks during extended use
    - Test all interactions with large dataset
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 12.4 Accessibility verification
    - Test keyboard navigation completeness
    - Test screen reader announcements
    - Verify color contrast meets WCAG AA
    - Test with prefers-reduced-motion enabled
    - _Requirements: 5.7_

  - [ ] 12.5 Cross-browser testing
    - Test in Chrome (latest)
    - Test in Firefox (latest)
    - Test in Safari (latest)
    - Test in Edge (latest)
    - Verify backdrop-filter support fallback works
    - _Requirements: 1.5, 9.1_
