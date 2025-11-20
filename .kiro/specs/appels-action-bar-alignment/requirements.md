# Requirements Document

## Introduction

This feature addresses the vertical alignment of the contact action bar in the "Appels" (Calls) page table view. Currently, the contact information card (displaying avatar, name, phone number, and action buttons) appears below the page toolbar. The goal is to align these elements on the same horizontal line to improve visual hierarchy and space efficiency.

## Glossary

- **Contact Action Bar**: The card component displaying contact information (avatar, name, phone number) and action buttons (call, SMS, email, qualification, reminder, appointment, Cal.com)
- **Page Toolbar**: The top navigation bar containing the page title "Appels" and view switcher buttons (Cards/Table)
- **Appels Page**: The calls management page in the application
- **Table View**: The tabular display mode for the Appels page (as opposed to Cards view)

## Requirements

### Requirement 1

**User Story:** As a user viewing the Appels page in table mode, I want the contact action bar to be aligned horizontally with the page toolbar, so that I can see all relevant information and controls in a compact, organized layout.

#### Acceptance Criteria

1. WHEN the Appels page is displayed in table view, THE system SHALL position the contact action bar on the same horizontal line as the page toolbar
2. WHEN the viewport width is sufficient (desktop/tablet), THE system SHALL display the contact action bar aligned to the right side of the page toolbar
3. WHEN the viewport width is narrow (mobile), THE system SHALL wrap the contact action bar to a new line while maintaining proper spacing
4. WHEN both elements are on the same line, THE system SHALL vertically center-align the contact action bar with the page toolbar content
5. WHEN the layout changes, THE system SHALL maintain consistent spacing between the page toolbar elements and the contact action bar

### Requirement 2

**User Story:** As a user, I want the contact action bar to remain fully functional and readable after the alignment change, so that I can continue to interact with all contact actions without any usability issues.

#### Acceptance Criteria

1. WHEN the contact action bar is repositioned, THE system SHALL preserve all interactive functionality of the action buttons
2. WHEN the contact action bar is displayed, THE system SHALL ensure the contact name and phone number remain fully visible and readable
3. WHEN hovering over action buttons, THE system SHALL display tooltips with appropriate labels
4. WHEN the layout is responsive, THE system SHALL maintain touch-friendly button sizes on mobile devices
5. WHEN the contact action bar wraps on smaller screens, THE system SHALL maintain visual hierarchy and grouping of related elements

### Requirement 3

**User Story:** As a developer, I want the alignment solution to use existing Tailwind CSS utilities and maintain the current component structure, so that the implementation is maintainable and consistent with the codebase.

#### Acceptance Criteria

1. WHEN implementing the alignment, THE system SHALL use Tailwind CSS flexbox utilities for layout control
2. WHEN modifying the layout, THE system SHALL preserve the existing responsive breakpoints (sm, md)
3. WHEN updating styles, THE system SHALL maintain the current dark mode compatibility
4. WHEN changing the structure, THE system SHALL avoid breaking existing event handlers and component logic
5. WHEN the implementation is complete, THE system SHALL ensure no visual regressions in other views or pages
