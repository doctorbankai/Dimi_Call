# Implementation Plan

- [x] 1. Create DateCalculationService utility


  - Implement date calculation functions for relative date selection
  - Add validation methods for date ranges and formats
  - Create unit label formatting with French localization and proper pluralization
  - Write comprehensive unit tests for all calculation scenarios including edge cases
  - _Requirements: 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5_



- [ ] 2. Create RelativeDateSelector component
  - Build quantity input field with number validation (1-999 range)
  - Implement unit selector dropdown with French labels (jour(s), semaine(s), mois, année(s))
  - Add real-time date calculation and preview display
  - Implement proper accessibility attributes and keyboard navigation


  - Write unit tests for component behavior and validation
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3. Create ReminderDialog component structure
  - Build dialog layout with header, contact info, and action buttons
  - Implement existing manual date/time input fields using current DateTimeCell pattern


  - Add dialog state management for date, time, and relative selector values
  - Integrate with existing dialog infrastructure and styling
  - Write unit tests for dialog rendering and basic interactions
  - _Requirements: 1.1, 2.1, 3.4_

- [x] 4. Implement bidirectional synchronization logic


  - Add logic to update manual date field when relative selectors change
  - Add logic to reset relative selectors when manual date field is modified
  - Implement state management to track which input method is active
  - Ensure data consistency between both input methods
  - Write unit tests for synchronization scenarios
  - _Requirements: 3.1, 3.2, 3.3_



- [ ] 5. Add validation and error handling
  - Implement input validation for quantity field (positive integers only)
  - Add date range validation (no past dates, max 10 years future)
  - Create error message display system with French localization
  - Add warning messages for edge cases (dates too far in future)
  - Disable save button when validation fails


  - Write unit tests for all validation scenarios
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.3, 3.5_

- [ ] 6. Integrate ReminderDialog with ContactTable
  - Add reminder scheduling action button to contact table actions
  - Implement dialog opening logic with contact context
  - Connect dialog save functionality to existing contact update system


  - Ensure proper contact data flow and state updates
  - Write integration tests for complete reminder scheduling flow
  - _Requirements: 1.1, 3.3, 3.4_

- [ ] 7. Implement accessibility and mobile optimization
  - Add proper ARIA labels and descriptions for screen readers



  - Implement keyboard navigation (Tab, Enter, Escape)
  - Optimize touch interactions for mobile devices
  - Test with screen readers and keyboard-only navigation
  - Ensure responsive design works on various screen sizes
  - Write accessibility-focused tests
  - _Requirements: 2.2, 2.4, 2.5_

- [ ] 8. Add comprehensive error handling and edge cases
  - Handle leap year calculations correctly
  - Manage month-end date calculations (e.g., Jan 31 + 1 month)
  - Add proper error boundaries and fallback states
  - Implement graceful degradation for calculation failures
  - Test all edge cases with automated tests
  - _Requirements: 1.3, 1.4, 1.5, 3.5_

- [ ] 9. Create end-to-end tests for complete user workflows
  - Test complete reminder scheduling workflow from contact selection to save
  - Verify data persistence and contact updates
  - Test switching between manual and relative date selection methods
  - Validate French localization and pluralization in real usage
  - Test accessibility compliance with automated tools
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_