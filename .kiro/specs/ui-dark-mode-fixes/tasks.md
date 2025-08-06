# Implementation Plan

- [x] 1. Fix dark mode visibility for date/time input icons


  - Add CSS styles to make date/time picker icons visible in dark mode
  - Use CSS filters and webkit pseudo-elements to control icon appearance
  - Test icon visibility across different browsers and themes
  - _Requirements: 1.1, 1.2, 1.3, 1.4_



- [ ] 2. Update time unit labels from "année(s)" to "an(s)"
  - Modify TIME_UNITS constant in RelativeDateSelector component
  - Update the years label from "année(s)" to "an(s)"

  - Verify date calculations still work correctly with the new label


  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Add new "A0" contact status with distinct colors


- [ ] 3.1 Extend ContactStatus enum with A0 value
  - Add A0 = "A0" to the ContactStatus enum in types.ts
  - Ensure the new status integrates with existing type system
  - _Requirements: 3.1_



- [x] 3.2 Define color scheme for A0 status

  - Add A0 color configuration to STATUS_COLORS in constants.tsx
  - Choose distinct colors that work well in both light and dark modes
  - Ensure sufficient contrast for accessibility
  - _Requirements: 3.2, 3.3_

- [x] 3.3 Update STATUS_OPTIONS array


  - Add the new A0 status to the STATUS_OPTIONS array in constants.tsx
  - Verify the status appears in all relevant dropdowns and selectors
  - _Requirements: 3.4, 3.5_

- [x] 4. Enhance Input component for better dark mode support


  - Add specific CSS classes for date and time input types
  - Implement webkit calendar picker indicator styling
  - Add CSS variables for theme-aware icon filtering
  - Test input appearance in both light and dark themes

  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 5. Create reusable TimePicker component
  - Extract the existing time picker widget into a reusable component
  - Implement proper TypeScript interfaces for props
  - Add support for disabled state and custom styling


  - Ensure touch-friendly interaction for mobile devices
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6. Update ReminderDialog to use enhanced components
  - Replace basic time input with custom TimePicker component where appropriate


  - Verify that date/time inputs have proper dark mode styling
  - Test the complete reminder creation workflow
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Add CSS styles for dark mode date/time icons



  - Create CSS rules targeting webkit calendar picker indicators
  - Implement filter-based approach for icon color inversion
  - Add fallback styles for non-webkit browsers
  - Test across Chrome, Firefox, Safari, and Edge
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 8. Update all components using contact status
  - Verify ContactTable properly displays the new A0 status
  - Update any status filtering logic to include A0
  - Ensure export/import functionality handles the new status
  - Test status selection in all relevant dialogs and forms
  - _Requirements: 3.4, 3.5_

- [ ] 9. Write comprehensive tests for all changes
  - Create unit tests for the new A0 status functionality
  - Add tests for time unit label changes
  - Write integration tests for dark mode icon visibility
  - Create accessibility tests for contrast and screen reader compatibility
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

- [ ] 10. Validate and test complete implementation
  - Perform end-to-end testing of all modified components
  - Verify theme switching works correctly with all changes
  - Test contact management workflow with new A0 status
  - Validate accessibility compliance for all modifications
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_