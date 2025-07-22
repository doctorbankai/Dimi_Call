# Implementation Plan

- [x] 1. Create UpdateConfirmationDialog component


  - Create new component file with shadcn/ui Dialog components
  - Implement props interface for dialog state and callbacks
  - Add theme-aware styling and responsive design
  - Include update information display (version, release notes)
  - Add keyboard navigation support (Escape to close)
  - Write unit tests for component behavior
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. Modify TitleBar component for improved badge text


  - Update badge text logic to show "Mettre à jour" when update is downloaded
  - Modify tooltip text to reflect new action
  - Replace direct installUpdate call with dialog opening callback
  - Preserve existing styling and animations for downloaded state
  - Ensure backward compatibility with existing update states
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.4_

- [x] 3. Update App.tsx to integrate confirmation dialog


  - Add state management for dialog open/close
  - Create callback function to open confirmation dialog
  - Pass dialog state and callbacks to TitleBar component
  - Render UpdateConfirmationDialog component conditionally
  - Handle dialog confirmation to trigger actual update installation
  - _Requirements: 2.4, 2.5_

- [x] 4. Add TypeScript type definitions


  - Define UpdateConfirmationDialogProps interface
  - Update existing component prop types as needed
  - Ensure type safety for new callback functions
  - Add JSDoc comments for new functions and interfaces
  - _Requirements: All requirements (type safety)_

- [x] 5. Write comprehensive tests


  - Create unit tests for UpdateConfirmationDialog component
  - Test dialog opening/closing behavior
  - Test confirmation and cancellation flows
  - Test keyboard navigation (Escape key)
  - Test theme compatibility (light/dark modes)
  - Add integration tests for complete update flow
  - _Requirements: All requirements (testing coverage)_

- [x] 6. Update documentation and error handling



  - Add error handling for dialog state management
  - Implement fallback behavior if dialog fails to open
  - Update component documentation with new behavior
  - Add logging for debugging update confirmation flow
  - _Requirements: 2.4, 2.5, 4.4_