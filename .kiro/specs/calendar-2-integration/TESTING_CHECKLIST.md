# Calendar 2 - Testing Checklist

Use this checklist to verify that all Calendar 2 features are working correctly.

## 🚀 Pre-Testing Setup

- [ ] Application is running (`npm run dev`)
- [ ] Browser DevTools open (F12) to check for errors
- [ ] Sidebar is visible
- [ ] "Calendrier 2" menu item is visible

## 📋 Basic Integration Tests

### Sidebar & Navigation
- [ ] "Calendrier 2" menu item appears in sidebar
- [ ] Menu item has calendar icon
- [ ] Clicking menu item loads calendar page
- [ ] Menu item highlights when active
- [ ] Icon visible when sidebar collapsed
- [ ] Can navigate away and back to calendar

### Page Loading
- [ ] Calendar page loads without errors
- [ ] No console errors in DevTools
- [ ] Mock events are visible
- [ ] Calendar header displays correctly
- [ ] View switcher buttons visible

## 📅 View Mode Tests

### Year View
- [ ] Switch to year view
- [ ] All 12 months display
- [ ] Current month highlighted
- [ ] Events visible on correct dates
- [ ] Can click month to navigate
- [ ] Responsive on small screens

### Month View
- [ ] Switch to month view
- [ ] All days of month display
- [ ] Current day highlighted
- [ ] Events display on correct dates
- [ ] Multi-day events span correctly
- [ ] Event badges show correctly
- [ ] Can click day to view details

### Week View
- [ ] Switch to week view
- [ ] 7 days display
- [ ] Hourly time slots visible
- [ ] Events at correct times
- [ ] Multi-day events display
- [ ] Working hours highlighted (if configured)
- [ ] Can scroll through hours
- [ ] Current time indicator shows (if today)

### Day View
- [ ] Switch to day view
- [ ] Single day displays
- [ ] Detailed hourly breakdown
- [ ] Events at correct times
- [ ] Working hours highlighted (if configured)
- [ ] Can scroll through hours
- [ ] Current time indicator shows (if today)

### Agenda View
- [ ] Switch to agenda view
- [ ] Events listed chronologically
- [ ] Events grouped by day
- [ ] Can scroll through list
- [ ] Event details visible
- [ ] Dates formatted correctly

## 🧭 Navigation Tests

### Date Navigation
- [ ] "Today" button returns to current date
- [ ] Previous button goes to previous period
- [ ] Next button goes to next period
- [ ] Date range text updates correctly
- [ ] Navigation works in all views
- [ ] Date picker opens
- [ ] Can select specific date
- [ ] Calendar navigates to selected date

### View Persistence
- [ ] Selected view persists when navigating dates
- [ ] Selected date persists when switching views
- [ ] Can navigate and switch views smoothly

## 🎨 Event Display Tests

### Event Rendering
- [ ] Events display on correct dates
- [ ] Event colors display correctly
- [ ] Event titles visible
- [ ] Event times visible (week/day views)
- [ ] Multi-day events span correctly
- [ ] Overlapping events don't overlap visually
- [ ] Event hover effects work

### Event Interaction
- [ ] Can click event to view details
- [ ] Event details dialog opens
- [ ] Event details are correct
- [ ] Dialog closes properly
- [ ] Can click multiple events

## 🖱️ Drag & Drop Tests

### Month View DnD
- [ ] Can drag event to different day
- [ ] Visual feedback during drag
- [ ] Event updates after drop
- [ ] Can cancel drag (ESC key)
- [ ] Invalid drops are prevented

### Week View DnD
- [ ] Can drag event to different day
- [ ] Can drag event to different time
- [ ] Visual feedback during drag
- [ ] Event updates after drop
- [ ] Time updates correctly

### Day View DnD
- [ ] Can drag event to different time
- [ ] Visual feedback during drag
- [ ] Event updates after drop
- [ ] Time updates correctly

## 📝 Event Management Tests

### Add Event
- [ ] Add event button visible
- [ ] Add event dialog opens
- [ ] Can enter event title
- [ ] Can select start date/time
- [ ] Can select end date/time
- [ ] Can select event color
- [ ] Can enter description
- [ ] Can save event
- [ ] New event appears on calendar
- [ ] Dialog closes after save

### Edit Event
- [ ] Can open edit dialog from event
- [ ] Event details pre-filled
- [ ] Can modify title
- [ ] Can modify dates/times
- [ ] Can modify color
- [ ] Can modify description
- [ ] Can save changes
- [ ] Changes reflect on calendar
- [ ] Dialog closes after save

### Delete Event
- [ ] Can delete event from details dialog
- [ ] Confirmation prompt appears
- [ ] Event removed from calendar
- [ ] Dialog closes after delete

## ⚙️ Configuration Tests

### Badge Variant
- [ ] Settings button visible
- [ ] Can open settings
- [ ] Badge variant options visible
- [ ] Can select "dot" variant
- [ ] Events update to dot style
- [ ] Can select "colored" variant
- [ ] Events update to colored style
- [ ] Can select "mixed" variant
- [ ] Events update to mixed style

### Visible Hours
- [ ] Can change visible hours setting
- [ ] "All" shows all 24 hours
- [ ] "Working" shows working hours only
- [ ] "Events" shows hours with events
- [ ] Week/day views update accordingly

### Working Hours
- [ ] Can set working hours start
- [ ] Can set working hours end
- [ ] Working hours highlighted in week/day views
- [ ] Non-working hours visually distinct

### User Filter
- [ ] User filter dropdown visible
- [ ] Can select "All users"
- [ ] All events visible
- [ ] Can select specific user
- [ ] Only that user's events visible
- [ ] Filter persists across views

## 🎨 Theme Tests

### Light Mode
- [ ] Calendar displays in light mode
- [ ] All colors visible and readable
- [ ] Event colors distinct
- [ ] Text readable
- [ ] Borders and separators visible

### Dark Mode
- [ ] Switch to dark mode in settings
- [ ] Calendar updates to dark mode
- [ ] All colors visible and readable
- [ ] Event colors distinct
- [ ] Text readable
- [ ] Borders and separators visible

### Theme Switching
- [ ] Can switch themes without reload
- [ ] Calendar updates immediately
- [ ] No visual glitches
- [ ] All views work in both themes

## 📱 Responsive Design Tests

### Desktop (1920x1080)
- [ ] Calendar fills available space
- [ ] All controls visible
- [ ] Events readable
- [ ] No horizontal scroll
- [ ] Sidebar works correctly

### Tablet (768x1024)
- [ ] Calendar adapts to smaller width
- [ ] All controls accessible
- [ ] Events readable
- [ ] Navigation works
- [ ] Sidebar works correctly

### Mobile (375x667)
- [ ] Calendar adapts to mobile size
- [ ] Essential controls visible
- [ ] Can navigate dates
- [ ] Can view events
- [ ] Touch interactions work
- [ ] Sidebar collapses appropriately

### Sidebar Interaction
- [ ] Sidebar expands on hover
- [ ] Sidebar collapses when mouse leaves
- [ ] Calendar adjusts width accordingly
- [ ] No layout shifts or glitches

## ⚡ Performance Tests

### Initial Load
- [ ] Calendar loads in < 2 seconds
- [ ] No lag or freezing
- [ ] Events render quickly
- [ ] Smooth animations

### View Switching
- [ ] View switches are smooth
- [ ] No lag between views
- [ ] Animations are fluid
- [ ] No visual glitches

### Many Events
- [ ] Calendar handles 100+ events
- [ ] Scrolling is smooth
- [ ] No performance degradation
- [ ] Events render correctly

### Rapid Navigation
- [ ] Can click prev/next rapidly
- [ ] Calendar keeps up
- [ ] No errors or crashes
- [ ] Dates update correctly

## ♿ Accessibility Tests

### Keyboard Navigation
- [ ] Can tab through controls
- [ ] Focus indicators visible
- [ ] Can use arrow keys to navigate dates
- [ ] Enter/Space activate buttons
- [ ] Escape closes dialogs
- [ ] All interactive elements accessible

### Screen Reader
- [ ] Calendar has proper ARIA labels
- [ ] Events are announced
- [ ] Date changes announced
- [ ] Dialogs announced
- [ ] Navigation controls labeled

### Visual Accessibility
- [ ] High contrast mode works
- [ ] Focus indicators clear
- [ ] Event colors distinguishable
- [ ] Text size adequate
- [ ] Sufficient spacing

## 🔄 Integration Tests

### Navigation Flow
- [ ] Can navigate from Appels to Calendar 2
- [ ] Can navigate from Calendar 2 to Graphiques
- [ ] Can navigate back to Calendar 2
- [ ] Calendar state preserved
- [ ] No errors during navigation

### Browser Navigation
- [ ] Browser back button works
- [ ] Browser forward button works
- [ ] Can refresh page
- [ ] Calendar reloads correctly

### State Persistence
- [ ] Selected view persists during session
- [ ] Selected date persists during session
- [ ] Configuration persists during session
- [ ] User filter persists during session

## 🐛 Error Handling

### Console Errors
- [ ] No errors in console
- [ ] No warnings in console
- [ ] No network errors
- [ ] No React errors

### Edge Cases
- [ ] Can handle invalid dates
- [ ] Can handle empty event list
- [ ] Can handle very long event titles
- [ ] Can handle events spanning months
- [ ] Can handle events at midnight

## ✅ Final Verification

- [ ] All critical features work
- [ ] No blocking bugs found
- [ ] Performance is acceptable
- [ ] Theme integration works
- [ ] Responsive design works
- [ ] Accessibility is adequate
- [ ] Ready for production use

## 📊 Test Results Summary

**Date Tested**: _______________

**Tester**: _______________

**Total Tests**: 200+

**Passed**: _____

**Failed**: _____

**Blocked**: _____

**Notes**:
```
[Add any notes about issues found or observations]
```

## 🎯 Sign-Off

- [ ] All critical tests passed
- [ ] Known issues documented
- [ ] Ready for user acceptance testing
- [ ] Implementation approved

**Approved By**: _______________

**Date**: _______________

---

**Testing Tips**:
- Test in multiple browsers (Chrome, Firefox, Edge)
- Test with different screen sizes
- Test with different amounts of data
- Test edge cases and error conditions
- Document any issues found
