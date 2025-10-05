# Design Document - Calendar 2 Integration

## Overview

This design document outlines the technical approach for integrating the big-calendar component library into the Dimicall application. The integration will be a direct copy-paste of the existing big-calendar codebase with minimal modifications to ensure compatibility with Dimicall's architecture.

## Architecture

### High-Level Structure

```
Dimi_Call/
├── src/
│   ├── calendar/                    # Complete big-calendar module (copied)
│   │   ├── components/
│   │   │   ├── agenda-view/
│   │   │   ├── year-view/
│   │   │   ├── month-view/
│   │   │   ├── week-and-day-view/
│   │   │   ├── header/
│   │   │   ├── dnd/
│   │   │   └── dialogs/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── helpers.ts
│   │   ├── interfaces.ts
│   │   ├── types.ts
│   │   ├── schemas.ts
│   │   ├── mocks.ts
│   │   └── requests.ts
│   └── pages/
│       └── Calendar2.tsx            # New page component
```

### Integration Points

1. **Sidebar Navigation**: Add "Calendar 2" menu item to AppSidebar component
2. **Routing**: Add route for `/calendar-2` page
3. **Theme Integration**: Calendar will use existing Dimicall theme system
4. **Component Library**: Calendar uses shadcn/ui components (already present in Dimicall)

## Components and Interfaces

### Core Calendar Components (from big-calendar)

#### 1. Calendar Context Provider
- **File**: `src/calendar/contexts/calendar-context.tsx`
- **Purpose**: Manages calendar state (selected date, view mode, events, etc.)
- **Key State**:
  - `selectedDate`: Current date being viewed
  - `view`: Current view mode (year/month/week/day/agenda)
  - `events`: Array of calendar events
  - `badgeVariant`: Display style for event badges
  - `visibleHours`: Time range to display
  - `workingHours`: Working hours configuration

#### 2. Calendar Views
All view components will be copied as-is:

- **CalendarYearView**: Grid of 12 months
- **CalendarMonthView**: Monthly calendar with events
- **CalendarWeekView**: 7-day view with hourly slots
- **CalendarDayView**: Single day with detailed hourly breakdown
- **CalendarAgendaView**: List view of upcoming events

#### 3. Calendar Header
- **File**: `src/calendar/components/header/calendar-header.tsx`
- **Features**:
  - View switcher (year/month/week/day/agenda)
  - Date navigator (previous/next/today)
  - User filter
  - Settings (badge variant, visible hours, working hours)

#### 4. Event Components
- **EventBlock**: Draggable event display for week/day views
- **MonthEventBadge**: Event display for month view
- **EventBullet**: Color indicator for events
- **AgendaEventCard**: Event card for agenda view

#### 5. Dialog Components
- **AddEventDialog**: Create new events
- **EditEventDialog**: Modify existing events
- **EventDetailsDialog**: View event information

#### 6. Drag & Drop Components
- **DndProvider**: React DnD context wrapper
- **DraggableEvent**: Makes events draggable
- **DroppableTimeBlock**: Drop target for time slots
- **DroppableDay Cell**: Drop target for day cells
- **CustomDragLayer**: Visual feedback during drag

### Helper Functions

#### Calendar Helpers (`src/calendar/helpers.ts`)
- `getCalendarCells()`: Generate calendar grid
- `getCurrentEvents()`: Filter events for current view
- `getEventsCount()`: Count events for a date
- `navigateDate()`: Handle date navigation
- `rangeText()`: Format date range display
- `calculateMonthEventPositions()`: Position events in month view
- `getEventBlockStyle()`: Calculate event block dimensions
- `groupEvents()`: Group overlapping events
- `getVisibleHours()`: Calculate visible time range
- `isWorkingHour()`: Check if hour is in working hours

## Data Models

### Event Interface
```typescript
interface IEvent {
  id: number;
  startDate: string;        // ISO 8601 format
  endDate: string;          // ISO 8601 format
  title: string;
  color: TEventColor;       // 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' | 'orange'
  description: string;
  user: IUser;
}
```

### User Interface
```typescript
interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}
```

### Calendar Cell Interface
```typescript
interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
```

### Type Definitions
```typescript
type TCalendarView = 'year' | 'month' | 'week' | 'day' | 'agenda';
type TEventColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' | 'orange';
type TBadgeVariant = 'dot' | 'colored' | 'mixed';
type TVisibleHours = 'all' | 'working' | 'events';
type TWorkingHours = { from: number; to: number };
```

## Page Structure

### Calendar2 Page Component

```typescript
// src/pages/Calendar2.tsx
import { CalendarProvider } from '@/calendar/contexts/calendar-context';
import { ClientContainer } from '@/calendar/components/client-container';
import { mockEvents } from '@/calendar/mocks';

export default function Calendar2() {
  return (
    <div className="h-screen flex flex-col">
      <CalendarProvider initialEvents={mockEvents}>
        <ClientContainer />
      </CalendarProvider>
    </div>
  );
}
```

### Client Container Component
The `ClientContainer` component (from big-calendar) handles:
- Calendar header rendering
- View switching
- Event management
- Responsive layout

## Theme Integration

### Color Mapping
The calendar uses Tailwind CSS classes that are compatible with Dimicall's theme system:

- **Light Mode**: Uses standard Tailwind colors
- **Dark Mode**: Uses `dark:` prefixed classes
- **Event Colors**: Predefined color palette (blue, green, red, yellow, purple, gray, orange)

### CSS Variables
Calendar components use CSS variables from Dimicall's global styles:
- `--background`
- `--foreground`
- `--border`
- `--primary`
- `--secondary`
- `--muted`
- `--accent`

## Sidebar Integration

### Modification to AppSidebar Component

Add new menu item in the "Modes" section:

```typescript
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative">
  <button 
    data-slot="sidebar-menu-button" 
    data-sidebar="menu-button" 
    data-size="default" 
    data-active={activeTab === 'calendar-2'}
    onClick={() => onTabChange('calendar-2')}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar w-4 h-4">
      <path d="M8 2v4"></path>
      <path d="M16 2v4"></path>
      <rect width="18" height="18" x="3" y="4" rx="2"></rect>
      <path d="M3 10h18"></path>
    </svg>
    <span>Calendrier 2</span>
  </button>
</li>
```

## Routing

### Route Configuration
Add route in the application router:

```typescript
{
  path: '/calendar-2',
  component: Calendar2,
  label: 'Calendrier 2'
}
```

## Dependencies

### Required npm Packages (already in Dimicall)
- `react` - Core React library
- `react-dom` - React DOM rendering
- `date-fns` - Date manipulation
- `react-dnd` - Drag and drop functionality
- `react-dnd-html5-backend` - HTML5 backend for react-dnd
- `zod` - Schema validation
- `@radix-ui/*` - UI primitives (via shadcn/ui)
- `tailwindcss` - Styling
- `class-variance-authority` - Variant management
- `clsx` - Class name utility

### Additional Dependencies (if not present)
Check if these are in Dimicall's package.json:
- `react-dnd`: ^16.0.1
- `react-dnd-html5-backend`: ^16.0.1

## File Copy Strategy

### Phase 1: Copy Calendar Module
1. Copy entire `src/calendar/` directory from big-calendar to Dimicall
2. Preserve all subdirectories and file structure
3. No modifications to calendar files

### Phase 2: Copy UI Components (if missing)
Check if these shadcn/ui components exist in Dimicall:
- `accordion.tsx`
- `avatar.tsx`
- `avatar-group.tsx`
- `badge.tsx`
- `button.tsx`
- `dialog.tsx`
- `form.tsx`
- `input.tsx`
- `label.tsx`
- `popover.tsx`
- `scroll-area.tsx`
- `select.tsx`
- `single-calendar.tsx`
- `single-day-picker.tsx`
- `skeleton.tsx`
- `switch.tsx`
- `textarea.tsx`
- `time-input.tsx`
- `tooltip.tsx`

If missing, copy from big-calendar's `src/components/ui/`

### Phase 3: Copy Utilities
1. Copy `src/lib/utils.ts` if not present (cn function)
2. Copy `src/hooks/use-disclosure.ts` if not present

### Phase 4: Create Page Component
1. Create `src/pages/Calendar2.tsx`
2. Import and use CalendarProvider and ClientContainer

### Phase 5: Update Sidebar
1. Modify AppSidebar component to add "Calendrier 2" menu item
2. Add navigation handler

### Phase 6: Update Routing
1. Add route for `/calendar-2`
2. Link to Calendar2 page component

## Error Handling

### Event Loading Errors
- Display error message if events fail to load
- Provide retry mechanism
- Fallback to empty calendar view

### Drag & Drop Errors
- Validate drop targets before allowing drop
- Show error toast if drop fails
- Revert event to original position on error

### Date Navigation Errors
- Validate date ranges
- Prevent navigation to invalid dates
- Handle timezone issues gracefully

## Performance Optimization

### Event Rendering
- Use React.memo for event components
- Virtualize long event lists in agenda view
- Lazy load event details

### Calendar Grid
- Memoize calendar cell calculations
- Use useMemo for expensive computations
- Optimize re-renders with useCallback

### Drag & Drop
- Debounce drag updates
- Use requestAnimationFrame for smooth animations
- Minimize DOM manipulations during drag

## Testing Strategy

### Component Testing
- Test each calendar view renders correctly
- Verify event display in all views
- Test date navigation
- Validate drag & drop functionality

### Integration Testing
- Test sidebar navigation to calendar page
- Verify theme switching
- Test responsive behavior
- Validate event CRUD operations

### User Acceptance Testing
- Verify all requirements are met
- Test on different screen sizes
- Validate accessibility
- Check performance with many events

## Accessibility

### Keyboard Navigation
- Tab through calendar controls
- Arrow keys for date navigation
- Enter/Space to select dates
- Escape to close dialogs

### Screen Reader Support
- ARIA labels for all interactive elements
- Announce date changes
- Describe event details
- Provide context for drag operations

### Visual Accessibility
- High contrast mode support
- Focus indicators
- Color-blind friendly event colors
- Sufficient text size and spacing

## Migration Notes

### Path Adjustments
All imports in copied files use `@/` alias which should work with Dimicall's tsconfig.json:
```typescript
import { cn } from "@/lib/utils";
import { useCalendar } from "@/calendar/contexts/calendar-context";
```

### No Breaking Changes
- Calendar module is self-contained
- No modifications to existing Dimicall code (except sidebar and routing)
- Can be removed without affecting other features

### Future Enhancements (Not in Scope)
- Supabase integration for event storage
- Link events to contacts
- Email/SMS reminders
- Calendar sync with external services
- Multi-user calendar sharing

## Deployment Considerations

### Build Process
- Ensure all calendar files are included in build
- Verify tree-shaking doesn't remove needed code
- Check bundle size impact

### Browser Compatibility
- Test drag & drop in all target browsers
- Verify date-fns locale support
- Check CSS grid support

### Mobile Considerations
- Touch-friendly drag & drop
- Responsive layout for small screens
- Optimized performance on mobile devices

## Summary

This design provides a straightforward copy-paste integration of the big-calendar component into Dimicall. The calendar will function as a standalone module with minimal integration points (sidebar and routing), making it easy to implement and maintain. All calendar functionality, including multiple views, drag & drop, and event management, will be preserved exactly as in the original big-calendar project.
