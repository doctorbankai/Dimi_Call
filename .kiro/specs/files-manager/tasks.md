# Implementation Plan - Files Manager

## Overview

Ce plan d'implémentation décompose la création du Files Manager en tâches incrémentales et exécutables. Chaque tâche construit sur les précédentes et se termine par une intégration fonctionnelle. Les tâches marquées d'un astérisque (*) sont optionnelles et peuvent être sautées pour un MVP plus rapide.

---

## Tasks

- [x] 1. Setup project structure and core interfaces


  - Create directory structure for the Files Manager feature
  - Define TypeScript interfaces (FileNode, FileSystemState, FileOperation, etc.)
  - Create placeholder service files (fileManagerService.ts, fileTagService.ts, fileAttachmentService.ts)
  - _Requirements: 1.1, 2.1, 3.1_





- [ ] 2. Implement Electron IPC handlers for file system operations
  - [ ] 2.1 Create electron/handlers/fileHandlers.ts
    - Implement `file:list-directory` handler to read folder contents
    - Implement `file:create-folder` handler to create new folders
    - Implement `file:delete-item` handler to delete files/folders
    - Implement `file:rename-item` handler to rename files/folders
    - Implement `file:copy-item` handler to copy files/folders
    - Implement `file:move-item` handler to move files/folders
    - Implement `file:upload-files` handler to save uploaded files to C:\DimiCall

    - Implement `file:open-location` handler to open C:\DimiCall in Windows Explorer
    - Implement `file:get-file-info` handler to retrieve file metadata
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 10.2, 10.3, 10.4_


  - [ ] 2.2 Register IPC handlers in electron/main.ts
    - Import and register all file handlers
    - Ensure C:\DimiCall directory is created on app startup

    - _Requirements: 2.2, 10.3_


  - [ ] 2.3 Add TypeScript types for IPC in src/types.ts
    - Define IPC channel names as constants
    - Define request/response types for each handler
    - _Requirements: 2.1_

- [ ] 3. Implement fileManagerService.ts
  - [ ] 3.1 Implement file system operations
    - Create `listDirectory(path: string)` function using IPC

    - Create `createFolder(path: string, name: string)` function
    - Create `deleteItem(path: string)` function with confirmation
    - Create `renameItem(path: string, newName: string)` function
    - Create `copyItem(source: string, destination: string)` function
    - Create `moveItem(source: string, destination: string)` function

    - Create `uploadFiles(files: File[], destination: string)` function
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.2, 4.3_

  - [x] 3.2 Implement file metadata operations

    - Create `getFileInfo(path: string)` function to retrieve file details
    - Create `getFileIcon(extension: string)` function to return appropriate Lucide icon
    - Create `generateThumbnail(path: string)` function for image files
    - _Requirements: 6.1, 6.2, 6.3, 6.4_






  - [ ] 3.3 Implement storage management
    - Create `ensureStorageDirectory()` function to create C:\DimiCall if missing

    - Create `openStorageLocation()` function to open C:\DimiCall in Explorer
    - _Requirements: 10.2, 10.3, 10.4_

  - [ ] 3.4 Implement error handling
    - Create `FileError` class with error types (NOT_FOUND, PERMISSION_DENIED, etc.)

    - Add try-catch blocks to all service functions
    - Return structured error objects instead of throwing
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_


- [x] 4. Create FilesPage component with basic layout

  - [ ] 4.1 Create src/pages/FilesPage.tsx
    - Set up component with state management (currentPath, selectedItems, viewMode, etc.)
    - Implement ResizablePanelGroup layout (tree view + content view + preview)
    - Add basic styling with Tailwind classes
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 4.2 Implement navigation state management

    - Create `navigateToFolder(path: string)` function
    - Create `goBack()` function to navigate up one level
    - Persist currentPath in localStorage
    - _Requirements: 1.2, 1.3_


  - [ ] 4.3 Implement file selection logic
    - Create `selectFile(file: FileNode, multi: boolean)` function
    - Support Ctrl+Click for multi-selection

    - Support Shift+Click for range selection
    - _Requirements: 3.1, 3.2_




- [ ] 5. Implement FileManagerToolbar component
  - [ ] 5.1 Create src/components/FileManagerToolbar.tsx
    - Add Breadcrumb navigation showing current path
    - Add search Input with debouncing (300ms)
    - Add view mode toggle buttons (Grid/List/Details)
    - Add filter DropdownMenu (All, Documents, Images, Videos, Audio, Archives)

    - Add "Open Storage Location" Button
    - _Requirements: 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 10.1, 10.2_

  - [ ] 5.2 Implement breadcrumb click navigation
    - Make each breadcrumb segment clickable

    - Navigate to clicked folder level
    - _Requirements: 1.5_

  - [ ] 5.3 Implement search functionality
    - Filter files by name matching search term
    - Update content view in real-time
    - _Requirements: 7.1, 7.2_

  - [ ] 5.4 Implement file type filtering
    - Filter files by MIME type based on selected filter
    - Support "All" to show all files
    - _Requirements: 7.3, 7.4_

- [ ] 6. Implement FileTree component
  - [ ] 6.1 Create src/components/FileTree.tsx
    - Use ScrollArea for scrollable tree
    - Use Collapsible for expandable folders
    - Display folder hierarchy with indentation
    - Use Folder/FolderOpen icons from Lucide
    - _Requirements: 1.1, 1.2_

  - [ ] 6.2 Implement folder expansion/collapse
    - Track expanded folders in state
    - Load folder contents on expand
    - Persist expanded state in localStorage
    - _Requirements: 1.2_

  - [ ] 6.3 Implement folder click navigation
    - Navigate to clicked folder
    - Update content view
    - Highlight current folder in tree
    - _Requirements: 1.2_

- [ ] 7. Implement GridView component
  - [ ] 7.1 Create src/components/GridView.tsx
    - Use CSS Grid layout (auto-fill, minmax(120px, 1fr))
    - Display files as Card components with large icons
    - Show filename and tags as Badges
    - _Requirements: 5.2, 8.3_

  - [ ] 7.2 Implement file selection in grid
    - Highlight selected files
    - Support click and Ctrl+Click
    - _Requirements: 3.1_

  - [ ] 7.3 Implement double-click to open
    - Navigate into folders on double-click
    - Open files with default app on double-click
    - _Requirements: 1.3_

- [ ] 8. Implement ListView component
  - [ ] 8.1 Create src/components/ListView.tsx
    - Display files as compact list with small icons
    - Show filename and tags inline
    - Use ScrollArea for scrolling
    - _Requirements: 5.3, 8.3_

  - [ ] 8.2 Implement file selection in list
    - Highlight selected files
    - Support click and Ctrl+Click
    - _Requirements: 3.1_

  - [ ] 8.3 Implement double-click to open
    - Navigate into folders on double-click
    - Open files with default app on double-click

    - _Requirements: 1.3_


- [ ] 9. Implement DetailsView component
  - [ ] 9.1 Create src/components/DetailsView.tsx
    - Use Table component from shadcn
    - Use @tanstack/react-table for table logic

    - Display columns: Name, Size, Type, Date Modified, Tags
    - _Requirements: 5.4, 8.3_

  - [x] 9.2 Implement table sorting

    - Make columns sortable (click header to sort)
    - Support ascending/descending sort
    - _Requirements: 5.4_



  - [ ] 9.3 Implement file selection in table
    - Highlight selected rows
    - Support click and Ctrl+Click
    - _Requirements: 3.1_


  - [ ] 9.4 Implement double-click to open
    - Navigate into folders on double-click
    - Open files with default app on double-click
    - _Requirements: 1.3_


- [ ] 10. Implement FileContextMenu component
  - [x] 10.1 Create src/components/FileContextMenu.tsx

    - Use ContextMenu component from shadcn


    - Add menu items: Open, Rename, Copy, Cut, Paste, Delete, Add Tag, Attach to Contact, Attach to Call, Properties
    - Show keyboard shortcuts in menu
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.2, 9.1, 9.4_


  - [ ] 10.2 Implement context menu actions
    - Wire up each menu item to corresponding service function
    - Show confirmation dialog for Delete action
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


  - [ ] 10.3 Implement keyboard shortcuts
    - Add global keyboard listeners (Ctrl+C, Ctrl+X, Ctrl+V, Delete, F2)
    - Execute corresponding actions
    - _Requirements: 3.6_


- [ ] 11. Implement drag & drop functionality
  - [ ] 11.1 Add drop zone to FilesPage
    - Detect drag enter/leave events

    - Show visual drop zone indicator overlay

    - _Requirements: 4.1_

  - [ ] 11.2 Implement file drop handler
    - Extract files from drop event
    - Upload files to current folder using fileManagerService
    - Show progress indicator during upload
    - _Requirements: 4.2, 4.3, 4.6_


  - [ ] 11.3 Support folder drop
    - Recursively upload folder contents
    - Maintain folder structure
    - _Requirements: 4.3_


  - [ ] 11.4 Implement drag from content view
    - Make files draggable within the app
    - Support drag to move/copy files between folders

    - _Requirements: 3.4_

- [ ] 12. Implement FilePreview component
  - [x] 12.1 Create src/components/FilePreview.tsx

    - Use Card component for preview panel

    - Add close Button
    - Show file metadata (name, size, type, date)
    - _Requirements: 6.4, 6.5_

  - [ ] 12.2 Implement image preview
    - Display images using <img> tag
    - Add lazy loading

    - Support jpg, png, gif, svg, webp
    - _Requirements: 6.1_

  - [ ] 12.3 Implement text preview
    - Display text content in <pre> tag
    - Add syntax highlighting for json, md, csv

    - Support txt, md, json, csv
    - _Requirements: 6.2_

  - [ ] 12.4 Implement PDF preview
    - Display first page of PDF using iframe or canvas

    - Add "Open in viewer" button
    - _Requirements: 6.3_

- [ ] 13. Implement tag system
  - [ ] 13.1 Create src/services/fileTagService.ts
    - Implement `addTag(fileId: string, tag: string)` function
    - Implement `removeTag(fileId: string, tag: string)` function
    - Implement `getTags(fileId: string)` function
    - Implement `getFilesByTag(tag: string)` function
    - Store tags in localStorage or local database
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 13.2 Create src/components/TagDialog.tsx
    - Use Dialog component from shadcn
    - Add Input for new tag
    - Display existing tags as Badges with remove button
    - _Requirements: 8.1, 8.2_

  - [ ] 13.3 Integrate tags in views
    - Display tags as Badges in GridView, ListView, DetailsView
    - Make tags clickable to filter by tag
    - _Requirements: 8.3, 8.4_

  - [ ] 13.4 Create tag management panel
    - Add "Manage Tags" button in toolbar
    - Show all tags with usage count
    - Allow editing and deleting tags
    - _Requirements: 8.5_

- [ ] 14. Implement file attachment system
  - [ ] 14.1 Create src/services/fileAttachmentService.ts
    - Implement `attachToContact(fileId: string, contactId: string)` function
    - Implement `attachToCall(fileId: string, callId: string)` function
    - Implement `getContactAttachments(contactId: string)` function
    - Implement `getCallAttachments(callId: string)` function
    - Store attachments in localStorage or local database
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 14.2 Create src/components/AttachmentDialog.tsx
    - Use Dialog component from shadcn
    - Add search Input to filter contacts/calls
    - Display list of contacts/calls in ScrollArea
    - Add "Attach" Button
    - _Requirements: 9.1, 9.4_

  - [ ] 14.3 Integrate attachments in ContactTable
    - Add "Fichiers" column to contact table
    - Display attached files as Badges
    - Make badges clickable to open file
    - _Requirements: 9.3_

  - [ ] 14.4 Integrate attachments in AppelsCardsView
    - Add "Fichiers joints" section to call cards
    - Display attached files as Badges
    - Make badges clickable to open file
    - _Requirements: 9.5_

- [ ] 15. Implement performance optimizations
  - [ ] 15.1 Add virtualization for large file lists
    - Use @tanstack/react-virtual in GridView, ListView, DetailsView
    - Configure virtualizer with appropriate item size
    - Only render visible items
    - _Requirements: 13.1_

  - [ ] 15.2 Implement lazy loading for thumbnails
    - Use IntersectionObserver to detect visible items
    - Load thumbnails only when items come into view
    - Cache loaded thumbnails
    - _Requirements: 13.2_

  - [ ] 15.3 Add debouncing to search
    - Debounce search input by 300ms
    - Cancel previous search when new input arrives
    - _Requirements: 13.3_

  - [ ] 15.4 Implement folder cache
    - Cache folder contents in memory
    - Set expiration time to 5 minutes
    - Invalidate cache on file operations
    - _Requirements: 13.4_

  - [ ] 15.5 Add Web Workers for heavy operations
    - Create fileWorker.ts for file hashing
    - Offload thumbnail generation to worker
    - _Requirements: 13.5_

- [ ] 16. Implement error handling and notifications
  - [ ] 16.1 Add toast notifications
    - Use sonner (already in project) for all notifications
    - Show success toasts for completed operations
    - Show error toasts with clear messages
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 16.2 Implement error logging


    - Use electron-log (already in project) to log all errors



    - Include error type, message, path, and stack trace

    - _Requirements: 12.5_


  - [ ] 16.3 Add error recovery
    - Implement retry logic for failed operations (max 3 attempts)
    - Show "Retry" button in error toasts

    - _Requirements: 12.1_

  - [ ] 16.4 Create error boundary
    - Wrap FilesPage in React Error Boundary
    - Show fallback UI on component errors

    - Log errors to electron-log
    - _Requirements: 12.1_

- [ ] 17. Add accessibility features
  - [ ] 17.1 Implement keyboard navigation
    - Add arrow key navigation in file lists
    - Add Enter to open, Backspace to go back
    - Add keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V, Delete, F2, Ctrl+F, Escape)
    - _Requirements: 3.6_

  - [ ] 17.2 Add ARIA labels
    - Add aria-label to all buttons and inputs
    - Add role="tree" to FileTree
    - Add aria-selected to selected items
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 17.3 Add screen reader announcements
    - Announce folder navigation
    - Announce search results count
    - Announce operation success/failure
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 18. Integrate Files Manager into DimiCall
  - [ ] 18.1 Add Files menu item to AppSidebar
    - Import Folder icon from Lucide
    - Add SidebarMenuItem for Files
    - Wire up onClick to set viewMode to 'files'
    - _Requirements: 1.1_

  - [ ] 18.2 Add 'files' to ViewMode type in App.tsx
    - Update ViewMode type to include 'files'
    - Add conditional render for FilesPage
    - Persist viewMode in localStorage
    - _Requirements: 1.1_

  - [ ] 18.3 Test navigation between views
    - Verify switching from other views to Files works
    - Verify switching from Files to other views works
    - Verify state is preserved when switching back
    - _Requirements: 1.1, 1.2_

- [ ] 19. Add theme support and animations
  - [ ] 19.1 Verify theme support
    - Test Files Manager in light theme
    - Test Files Manager in dark theme
    - Ensure all components use CSS variables correctly
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 19.2 Add Framer Motion animations
    - Add fade-in animation for file items
    - Add scale animation for drag & drop
    - Add slide animation for panel transitions
    - Keep animations subtle (200-300ms duration)
    - _Requirements: 11.5_

- [ ] 20. Write tests
  - [ ] 20.1 Write unit tests for fileManagerService
    - Test listDirectory with valid and invalid paths
    - Test createFolder with valid and invalid names
    - Test deleteItem with confirmation
    - Test renameItem with name conflicts
    - Test copyItem and moveItem
    - Test uploadFiles with various file types
    - _Requirements: All_

  - [ ] 20.2 Write unit tests for fileTagService
    - Test addTag and removeTag
    - Test getTags and getFilesByTag
    - Test tag persistence
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 20.3 Write unit tests for fileAttachmentService
    - Test attachToContact and attachToCall
    - Test getContactAttachments and getCallAttachments
    - Test attachment persistence
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 20.4 Write integration tests
    - Test complete upload flow (drag & drop → file created in C:\DimiCall)
    - Test complete delete flow (delete in app → file removed from disk)
    - Test complete attachment flow (attach to contact → visible in ContactTable)
    - _Requirements: All_

- [ ] 21. Final polish and bug fixes
  - [ ] 21.1 Test all file operations
    - Create, delete, rename, copy, move files and folders
    - Verify all operations sync to C:\DimiCall
    - Test with various file types and sizes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 21.2 Test all view modes
    - Switch between Grid, List, and Details views
    - Verify all views display files correctly
    - Test selection and navigation in each view
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 21.3 Test search and filtering
    - Search for files by name
    - Filter by file type
    - Filter by tag
    - Verify results are accurate
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 21.4 Test drag & drop
    - Drag files from Windows Explorer to app
    - Drag folders from Windows Explorer to app
    - Drag files within the app
    - Verify all uploads work correctly
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 21.5 Test preview functionality
    - Preview images, text files, PDFs
    - Verify preview panel opens and closes
    - Test with unsupported file types
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 21.6 Test tag system
    - Add and remove tags
    - Filter by tags
    - Manage tags in tag panel
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 21.7 Test attachment system
    - Attach files to contacts
    - Attach files to calls
    - View attachments in ContactTable and AppelsCardsView
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 21.8 Test error handling
    - Test with insufficient disk space
    - Test with permission errors
    - Test with invalid file names
    - Verify error messages are clear
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 21.9 Test performance
    - Test with 1000+ files
    - Test with large files (1GB+)
    - Verify virtualization works
    - Verify no memory leaks
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ] 21.10 Test accessibility
    - Test keyboard navigation
    - Test with screen reader
    - Verify ARIA labels
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 21.11 Fix any bugs found during testing
    - Document bugs in a list
    - Prioritize critical bugs
    - Fix bugs one by one
    - Re-test after fixes
    - _Requirements: All_
