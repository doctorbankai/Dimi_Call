# Implementation Plan - Calendar 2 Integration

- [x] 1. Copy calendar module structure


  - Create `src/calendar/` directory in Dimicall project
  - Copy all files from `big-calendar/src/calendar/` to `Dimi_Call/src/calendar/`
  - Preserve complete directory structure (components, contexts, hooks subdirectories)
  - Verify all TypeScript files are copied correctly
  - _Requirements: 2.1, 3.1, 4.1, 5.1, 8.1_


- [ ] 2. Copy calendar helper functions and utilities
  - Copy `big-calendar/src/calendar/helpers.ts` to `Dimi_Call/src/calendar/helpers.ts`
  - Copy `big-calendar/src/calendar/interfaces.ts` to `Dimi_Call/src/calendar/interfaces.ts`
  - Copy `big-calendar/src/calendar/types.ts` to `Dimi_Call/src/calendar/types.ts`
  - Copy `big-calendar/src/calendar/schemas.ts` to `Dimi_Call/src/calendar/schemas.ts`
  - Copy `big-calendar/src/calendar/mocks.ts` to `Dimi_Call/src/calendar/mocks.ts`
  - Copy `big-calendar/src/calendar/requests.ts` to `Dimi_Call/src/calendar/requests.ts`

  - _Requirements: 4.1, 5.1, 8.1_

- [ ] 3. Copy calendar context provider
  - Copy `big-calendar/src/calendar/contexts/calendar-context.tsx` to `Dimi_Call/src/calendar/contexts/calendar-context.tsx`
  - Verify CalendarProvider exports correctly

  - Verify useCalendar hook exports correctly
  - _Requirements: 2.1, 3.1, 3.2, 3.3, 5.1_

- [x] 4. Copy calendar hooks

  - Copy `big-calendar/src/calendar/hooks/use-update-event.ts` to `Dimi_Call/src/calendar/hooks/use-update-event.ts`
  - Verify hook dependencies are available
  - _Requirements: 4.1, 4.2_

- [ ] 5. Copy calendar view components
  - Copy `big-calendar/src/calendar/components/year-view/` directory to `Dimi_Call/src/calendar/components/year-view/`
  - Copy `big-calendar/src/calendar/components/month-view/` directory to `Dimi_Call/src/calendar/components/month-view/`

  - Copy `big-calendar/src/calendar/components/week-and-day-view/` directory to `Dimi_Call/src/calendar/components/week-and-day-view/`
  - Copy `big-calendar/src/calendar/components/agenda-view/` directory to `Dimi_Call/src/calendar/components/agenda-view/`
  - Verify all view components render correctly
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 6. Copy calendar header components
  - Copy `big-calendar/src/calendar/components/header/` directory to `Dimi_Call/src/calendar/components/header/`

  - Verify calendar-header.tsx exports correctly
  - Verify date-navigator.tsx exports correctly
  - Verify today-button.tsx exports correctly
  - Verify user-select.tsx exports correctly
  - _Requirements: 2.2, 3.2, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 7. Copy drag and drop components
  - Copy `big-calendar/src/calendar/components/dnd/` directory to `Dimi_Call/src/calendar/components/dnd/`

  - Verify dnd-provider.tsx exports correctly
  - Verify draggable-event.tsx exports correctly
  - Verify droppable-day-cell.tsx exports correctly
  - Verify droppable-time-block.tsx exports correctly
  - Verify custom-drag-layer.tsx exports correctly
  - _Requirements: 4.1, 4.2, 4.3_


- [ ] 8. Copy dialog components
  - Copy `big-calendar/src/calendar/components/dialogs/` directory to `Dimi_Call/src/calendar/components/dialogs/`
  - Verify add-event-dialog.tsx exports correctly
  - Verify edit-event-dialog.tsx exports correctly
  - Verify event-details-dialog.tsx exports correctly


  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 9. Copy calendar configuration components
  - Copy `big-calendar/src/calendar/components/change-badge-variant-input.tsx` to `Dimi_Call/src/calendar/components/change-badge-variant-input.tsx`
  - Copy `big-calendar/src/calendar/components/change-visible-hours-input.tsx` to `Dimi_Call/src/calendar/components/change-visible-hours-input.tsx`
  - Copy `big-calendar/src/calendar/components/change-working-hours-input.tsx` to `Dimi_Call/src/calendar/components/change-working-hours-input.tsx`
  - Copy `big-calendar/src/calendar/components/client-container.tsx` to `Dimi_Call/src/calendar/components/client-container.tsx`
  - _Requirements: 2.2, 3.2, 4.1_



- [ ] 10. Verify and copy missing UI components
  - Check if `src/components/ui/accordion.tsx` exists in Dimicall, copy from big-calendar if missing
  - Check if `src/components/ui/avatar.tsx` exists in Dimicall, copy from big-calendar if missing


  - Check if `src/components/ui/avatar-group.tsx` exists in Dimicall, copy from big-calendar if missing
  - Check if `src/components/ui/single-calendar.tsx` exists in Dimicall, copy from big-calendar if missing
  - Check if `src/components/ui/single-day-picker.tsx` exists in Dimicall, copy from big-calendar if missing
  - Check if `src/components/ui/time-input.tsx` exists in Dimicall, copy from big-calendar if missing
  - Verify all other shadcn/ui components are present (badge, button, dialog, form, input, label, popover, scroll-area, select, skeleton, switch, textarea, tooltip)
  - _Requirements: 2.1, 2.4, 7.1, 7.2, 7.3, 7.4_



- [ ] 11. Copy utility functions
  - Check if `src/lib/utils.ts` exists with `cn` function, copy from big-calendar if missing
  - Check if `src/hooks/use-disclosure.ts` exists, copy from big-calendar if missing
  - Verify utility functions work correctly
  - _Requirements: 2.1, 2.4_



- [ ] 12. Verify dependencies in package.json
  - Check if `react-dnd` is installed, add if missing
  - Check if `react-dnd-html5-backend` is installed, add if missing
  - Check if `date-fns` is installed, add if missing
  - Check if `zod` is installed, add if missing
  - Run `npm install` if any dependencies were added
  - _Requirements: 8.1, 8.2, 8.3_



- [ ] 13. Create Calendar2 page component
  - Create `src/pages/Calendar2.tsx` file
  - Import CalendarProvider from `@/calendar/contexts/calendar-context`
  - Import ClientContainer from `@/calendar/components/client-container`
  - Import mockEvents from `@/calendar/mocks`
  - Implement page component with CalendarProvider wrapper

  - Add proper TypeScript types
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

- [ ] 14. Add Calendar 2 menu item to sidebar
  - Locate AppSidebar component file
  - Find the "Modes" section in the sidebar
  - Add new menu item for "Calendrier 2" after existing "Calendrier" item
  - Use calendar icon (lucide-calendar)
  - Add onClick handler to navigate to calendar-2 route
  - Add active state highlighting when on Calendar 2 page
  - Ensure icon is visible when sidebar is collapsed
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 15. Add routing for Calendar 2 page
  - Locate application routing configuration
  - Add route for `/calendar-2` path
  - Link route to Calendar2 page component
  - Verify route navigation works correctly
  - Test direct URL access to `/calendar-2`
  - _Requirements: 1.2, 2.1_

- [ ] 16. Verify theme integration
  - Test calendar in light mode
  - Test calendar in dark mode
  - Verify theme switching works without page reload
  - Check all event colors display correctly in both themes
  - Verify calendar header adapts to theme
  - Verify all dialogs adapt to theme
  - _Requirements: 2.4, 7.1, 7.2, 7.3, 7.4_

- [ ] 17. Test year view functionality
  - Navigate to year view
  - Verify all 12 months are displayed
  - Verify events appear on correct dates
  - Test clicking on a month to navigate
  - Verify responsive layout on different screen sizes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3, 6.4_

- [ ] 18. Test month view functionality
  - Navigate to month view
  - Verify all days of month are displayed
  - Verify events appear on correct dates
  - Test clicking on a day to view details
  - Verify multi-day events span correctly
  - Test event badges display correctly
  - Verify responsive layout on different screen sizes
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4_

- [ ] 19. Test week view functionality
  - Navigate to week view
  - Verify 7 days are displayed with hourly time slots
  - Verify events appear at correct times
  - Test scrolling through hours
  - Verify working hours are highlighted
  - Test visible hours configuration
  - Verify multi-day events display correctly
  - Verify responsive layout on different screen sizes
  - _Requirements: 3.1, 3.2, 3.3, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4_

- [ ] 20. Test day view functionality
  - Navigate to day view
  - Verify single day is displayed with detailed hourly breakdown
  - Verify events appear at correct times
  - Test scrolling through hours
  - Verify working hours are highlighted
  - Test visible hours configuration
  - Verify current time indicator displays correctly
  - Verify responsive layout on different screen sizes
  - _Requirements: 3.1, 3.2, 3.3, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4_

- [ ] 21. Test agenda view functionality
  - Navigate to agenda view
  - Verify events are listed chronologically
  - Verify events are grouped by day
  - Test scrolling through event list
  - Verify event details are displayed correctly
  - Verify responsive layout on different screen sizes
  - _Requirements: 3.1, 3.2, 3.3, 3.8, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 6.4_

- [ ] 22. Test date navigation
  - Test "Today" button returns to current date
  - Test previous/next navigation in all views
  - Verify date range text updates correctly
  - Test date picker for selecting specific dates
  - Verify navigation preserves current view mode
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 23. Test event display and interaction
  - Verify events display on correct dates
  - Test clicking on event to view details
  - Verify event hover effects work
  - Test event color coding
  - Verify multi-day events span correctly
  - Test overlapping events display without overlap
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 24. Test drag and drop functionality
  - Test dragging events between days in month view
  - Test dragging events between time slots in week view
  - Test dragging events between time slots in day view
  - Verify visual feedback during drag
  - Verify event updates after drop
  - Test drag cancellation (ESC key or invalid drop)
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 25. Test event dialogs
  - Test opening add event dialog
  - Test creating new event with all fields
  - Test opening edit event dialog
  - Test modifying existing event
  - Test opening event details dialog
  - Test deleting event
  - Verify all dialogs close correctly
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 26. Test calendar configuration
  - Test changing badge variant (dot, colored, mixed)
  - Test changing visible hours (all, working, events)
  - Test changing working hours range
  - Verify configurations persist during session
  - Verify configurations affect calendar display correctly
  - _Requirements: 3.2, 4.1_

- [ ] 27. Test user filtering
  - Test filtering events by user
  - Test viewing all users' events
  - Verify user avatars display correctly
  - Verify user filter persists during navigation
  - _Requirements: 4.1, 4.2_

- [ ] 28. Test responsive design
  - Test calendar on desktop (1920x1080)
  - Test calendar on tablet (768x1024)
  - Test calendar on mobile (375x667)
  - Verify layout adapts appropriately
  - Verify touch interactions work on mobile
  - Test with sidebar collapsed
  - Test with sidebar expanded
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 29. Test performance
  - Measure initial page load time (should be < 2 seconds)
  - Test view switching performance (should be smooth)
  - Test with many events (100+)
  - Verify calendar remains responsive
  - Test rapid date navigation



  - Verify no memory leaks during extended use
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 30. Test accessibility
  - Test keyboard navigation (Tab, Arrow keys, Enter, Escape)
  - Test with screen reader
  - Verify all interactive elements have ARIA labels
  - Verify focus indicators are visible
  - Test high contrast mode
  - Verify color-blind friendly event colors
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 31. Final integration testing
  - Test navigating from other pages to Calendar 2
  - Test navigating from Calendar 2 to other pages
  - Verify sidebar active state updates correctly
  - Test theme switching while on Calendar 2 page
  - Verify no console errors or warnings
  - Test browser back/forward navigation
  - Verify calendar state persists during navigation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 7.1, 7.2, 7.3, 7.4_

- [ ] 32. Documentation and cleanup
  - Document any path adjustments made
  - Document any dependency additions
  - Remove any unused copied files
  - Verify all imports use correct paths
  - Add comments for integration points
  - Update project README if needed
  - _Requirements: 1.1, 2.1, 8.1_
