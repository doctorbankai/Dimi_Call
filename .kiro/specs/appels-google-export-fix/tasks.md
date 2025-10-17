# Implementation Plan

- [x] 1. Add dynamic counter calculation hooks


  - Add `googleContactsCount` useMemo hook to calculate the number of contacts eligible for Google Contacts export (statuses: À rappeler, DO, RO, A0)
  - Add `calendarRemindersCount` useMemo hook to calculate the number of contacts with valid reminder dates
  - Place these hooks after the `exportOptions` state declaration (around line 328) in AppelsCardsView.tsx
  - Use the same filtering logic as in App.tsx (lines 1290-1312) to ensure consistency
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3_



- [ ] 2. Update "Contacts Google" menu option
  - Replace `disabled={true}` with `disabled={googleContactsCount === 0}` in the DropdownMenuCheckboxItem for "Contacts Google" (around line 893)
  - Add conditional rendering of the counter badge: `{googleContactsCount > 0 && (<span className="ml-auto text-xs text-muted-foreground">({googleContactsCount})</span>)}`


  - Ensure the option is enabled when there are eligible contacts and disabled when there are none
  - _Requirements: 1.3, 1.4, 1.5, 3.4_

- [x] 3. Update "Agenda Google" menu option


  - Replace `disabled={true}` with `disabled={calendarRemindersCount === 0}` in the DropdownMenuCheckboxItem for "Agenda Google" (around line 903)
  - Add conditional rendering of the counter badge: `{calendarRemindersCount > 0 && (<span className="ml-auto text-xs text-muted-foreground">({calendarRemindersCount})</span>)}`
  - Ensure the option is enabled when there are contacts with reminders and disabled when there are none
  - _Requirements: 2.3, 2.4, 2.5, 3.4_





- [ ] 4. Verify consistency with main App component
  - Compare the implementation with App.tsx to ensure identical filtering logic
  - Verify that the counter display format matches the main App component
  - Ensure reactive updates when the contacts list changes

  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ]* 5. Manual testing
- [ ]* 5.1 Test with eligible contacts for Google Contacts export
  - Create contacts with statuses: À rappeler, DO, RO, A0

  - Verify that "Contacts Google" option is enabled
  - Verify that the counter displays the correct number
  - _Requirements: 1.3, 1.4, 1.5_

- [x]* 5.2 Test with contacts having reminders

  - Create contacts with reminder dates
  - Verify that "Agenda Google" option is enabled
  - Verify that the counter displays the correct number
  - _Requirements: 2.3, 2.4, 2.5_


- [ ]* 5.3 Test without eligible contacts
  - Use only contacts with other statuses (e.g., "Appelé")
  - Verify that "Contacts Google" option is disabled
  - Verify that no counter is displayed
  - _Requirements: 1.4_

- [ ]* 5.4 Test without reminders
  - Use contacts without reminder dates
  - Verify that "Agenda Google" option is disabled
  - Verify that no counter is displayed
  - _Requirements: 2.4_

- [ ]* 5.5 Test consistency between pages
  - Compare behavior with the main page (App.tsx)
  - Verify that counters are identical
  - Verify that options are enabled/disabled in the same way
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
