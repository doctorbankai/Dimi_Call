# Requirements Document - Files Manager

## Introduction

Le Files Manager est un gestionnaire de fichiers intégré à l'application DimiCall qui permet aux utilisateurs de gérer leurs fichiers et dossiers de manière intuitive. Cette fonctionnalité offre une interface moderne et épurée basée sur shadcn/ui, avec synchronisation automatique vers le système de fichiers local (C:\DimiCall). Le gestionnaire supporte tous les types de fichiers sans limitation de taille et s'intègre parfaitement avec les autres fonctionnalités de DimiCall (contacts, appels, etc.).

## Glossary

- **Files Manager**: Le système de gestion de fichiers intégré à DimiCall
- **DimiCall Storage**: Le dossier local C:\DimiCall où tous les fichiers sont stockés
- **File Node**: Un fichier ou dossier dans l'arborescence
- **Tree View**: La vue en arborescence affichant la structure des dossiers
- **Content View**: La zone principale affichant le contenu du dossier sélectionné
- **Drag & Drop**: Fonctionnalité permettant de glisser-déposer des fichiers
- **File Preview**: Prévisualisation du contenu d'un fichier (images, PDFs, texte)
- **File Attachment**: Association d'un fichier à un contact ou un appel
- **Tag System**: Système de catégorisation des fichiers par tags
- **View Mode**: Mode d'affichage (grille, liste, détails)
- **Electron IPC**: Communication entre le processus principal et le renderer d'Electron

## Requirements

### Requirement 1: Structure et Navigation

**User Story:** En tant qu'utilisateur, je veux naviguer facilement dans mes fichiers avec une interface claire, afin de retrouver rapidement mes documents.

#### Acceptance Criteria

1. WHEN the user opens the Files page, THE Files Manager SHALL display a tree view on the left showing the folder hierarchy and a content view on the right showing the current folder contents
2. WHEN the user clicks on a folder in the tree view, THE Files Manager SHALL update the content view to display that folder's contents within 200 milliseconds
3. WHEN the user double-clicks on a folder in the content view, THE Files Manager SHALL navigate into that folder and update both views accordingly
4. THE Files Manager SHALL display a breadcrumb navigation bar showing the current path with clickable segments
5. WHEN the user clicks on a breadcrumb segment, THE Files Manager SHALL navigate to that folder level

### Requirement 2: Stockage Local Automatique

**User Story:** En tant qu'utilisateur, je veux que mes fichiers soient automatiquement sauvegardés sur mon disque C, afin de les retrouver même en dehors de l'application.

#### Acceptance Criteria

1. WHEN a file is created or uploaded in the Files Manager, THE Files Manager SHALL automatically create the corresponding file in C:\DimiCall within 500 milliseconds
2. WHEN a folder is created in the Files Manager, THE Files Manager SHALL automatically create the corresponding folder in C:\DimiCall within 200 milliseconds
3. WHEN a file or folder is deleted in the Files Manager, THE Files Manager SHALL remove the corresponding item from C:\DimiCall within 500 milliseconds
4. WHEN a file or folder is renamed in the Files Manager, THE Files Manager SHALL rename the corresponding item in C:\DimiCall within 500 milliseconds
5. WHEN a file or folder is moved in the Files Manager, THE Files Manager SHALL move the corresponding item in C:\DimiCall within 1 second

### Requirement 3: Opérations sur les Fichiers

**User Story:** En tant qu'utilisateur, je veux effectuer toutes les opérations standard sur mes fichiers (créer, supprimer, renommer, copier, déplacer), afin de gérer efficacement mes documents.

#### Acceptance Criteria

1. WHEN the user right-clicks on a file or folder, THE Files Manager SHALL display a context menu with options: Open, Rename, Copy, Cut, Delete, Properties
2. WHEN the user selects "Rename" from the context menu, THE Files Manager SHALL enable inline editing of the file/folder name
3. WHEN the user selects "Copy" or "Cut", THE Files Manager SHALL store the item reference in the clipboard
4. WHEN the user selects "Paste" in a folder, THE Files Manager SHALL copy or move the clipboard item to that folder
5. WHEN the user selects "Delete", THE Files Manager SHALL display a confirmation dialog before removing the item
6. THE Files Manager SHALL support keyboard shortcuts: Ctrl+C (copy), Ctrl+X (cut), Ctrl+V (paste), Delete (delete), F2 (rename)

### Requirement 4: Upload et Drag & Drop

**User Story:** En tant qu'utilisateur, je veux pouvoir glisser-déposer des fichiers depuis l'explorateur Windows vers l'application, afin d'importer rapidement mes documents.

#### Acceptance Criteria

1. WHEN the user drags files from Windows Explorer over the Files Manager, THE Files Manager SHALL display a visual drop zone indicator
2. WHEN the user drops files onto the Files Manager, THE Files Manager SHALL upload all files to the current folder and update the view within 2 seconds per file
3. WHEN the user drops a folder onto the Files Manager, THE Files Manager SHALL recursively upload the folder and all its contents
4. THE Files Manager SHALL support uploading files of any type without restriction
5. THE Files Manager SHALL support uploading files of any size without restriction
6. WHEN a file upload is in progress, THE Files Manager SHALL display a progress indicator showing the upload percentage

### Requirement 5: Modes d'Affichage Multiples

**User Story:** En tant qu'utilisateur, je veux choisir entre différents modes d'affichage (grille, liste, détails), afin d'adapter la vue à mes besoins.

#### Acceptance Criteria

1. THE Files Manager SHALL provide three view modes: Grid View, List View, and Details View
2. WHEN the user selects Grid View, THE Files Manager SHALL display files as large icons in a responsive grid layout
3. WHEN the user selects List View, THE Files Manager SHALL display files as small icons with names in a compact list
4. WHEN the user selects Details View, THE Files Manager SHALL display files in a table with columns: Name, Size, Type, Date Modified
5. THE Files Manager SHALL persist the selected view mode in localStorage and restore it on next session

### Requirement 6: Prévisualisation des Fichiers

**User Story:** En tant qu'utilisateur, je veux prévisualiser mes fichiers (images, PDFs, texte) sans les ouvrir, afin de vérifier rapidement leur contenu.

#### Acceptance Criteria

1. WHEN the user clicks on an image file (jpg, png, gif, svg, webp), THE Files Manager SHALL display a preview panel showing the image
2. WHEN the user clicks on a text file (txt, md, json, csv), THE Files Manager SHALL display a preview panel showing the text content with syntax highlighting
3. WHEN the user clicks on a PDF file, THE Files Manager SHALL display a preview panel showing the first page of the PDF
4. WHEN the user clicks on an unsupported file type, THE Files Manager SHALL display file metadata (name, size, type, date) instead of a preview
5. THE Files Manager SHALL provide a "Close Preview" button to hide the preview panel

### Requirement 7: Recherche et Filtrage

**User Story:** En tant qu'utilisateur, je veux rechercher et filtrer mes fichiers par nom, type ou tag, afin de trouver rapidement ce que je cherche.

#### Acceptance Criteria

1. THE Files Manager SHALL provide a search input field in the toolbar
2. WHEN the user types in the search field, THE Files Manager SHALL filter the content view to show only files/folders matching the search term within 300 milliseconds
3. THE Files Manager SHALL support filtering by file type through a dropdown menu (All, Documents, Images, Videos, Audio, Archives)
4. WHEN the user selects a file type filter, THE Files Manager SHALL display only files of that type
5. THE Files Manager SHALL support filtering by tags when tags are assigned to files

### Requirement 8: Système de Tags

**User Story:** En tant qu'utilisateur, je veux ajouter des tags à mes fichiers pour les catégoriser, afin de mieux organiser mes documents.

#### Acceptance Criteria

1. WHEN the user right-clicks on a file and selects "Add Tag", THE Files Manager SHALL display a tag input dialog
2. WHEN the user enters a tag name and confirms, THE Files Manager SHALL associate that tag with the file
3. THE Files Manager SHALL display tags as colored badges on files in all view modes
4. WHEN the user clicks on a tag badge, THE Files Manager SHALL filter the view to show all files with that tag
5. THE Files Manager SHALL provide a tag management panel to view, edit, and delete all tags

### Requirement 9: Intégration avec Contacts et Appels

**User Story:** En tant qu'utilisateur, je veux attacher des fichiers à mes contacts et appels, afin de centraliser toutes les informations liées.

#### Acceptance Criteria

1. WHEN the user right-clicks on a file and selects "Attach to Contact", THE Files Manager SHALL display a contact selection dialog
2. WHEN the user selects a contact, THE Files Manager SHALL create an association between the file and that contact
3. WHEN the user views a contact's details, THE Contact View SHALL display all attached files with links to open them
4. WHEN the user right-clicks on a file and selects "Attach to Call", THE Files Manager SHALL display a call selection dialog
5. WHEN the user selects a call, THE Files Manager SHALL create an association between the file and that call record

### Requirement 10: Bouton d'Ouverture de l'Emplacement

**User Story:** En tant qu'utilisateur, je veux ouvrir le dossier C:\DimiCall dans l'explorateur Windows, afin d'accéder directement à mes fichiers.

#### Acceptance Criteria

1. THE Files Manager SHALL display a "Open Storage Location" button in the toolbar
2. WHEN the user clicks the "Open Storage Location" button, THE Files Manager SHALL open the C:\DimiCall folder in Windows Explorer
3. IF the C:\DimiCall folder does not exist, THE Files Manager SHALL create it before opening Windows Explorer
4. THE Files Manager SHALL use Electron's shell.openPath API to open the folder

### Requirement 11: Design Shadcn/UI

**User Story:** En tant qu'utilisateur, je veux une interface moderne et cohérente avec le reste de l'application, afin d'avoir une expérience utilisateur fluide.

#### Acceptance Criteria

1. THE Files Manager SHALL use exclusively shadcn/ui components for all UI elements
2. THE Files Manager SHALL follow the existing DimiCall design system (colors, spacing, typography)
3. THE Files Manager SHALL support both light and dark themes consistently
4. THE Files Manager SHALL use Lucide React icons for all icons
5. THE Files Manager SHALL provide smooth animations and transitions using Framer Motion

### Requirement 12: Gestion des Erreurs

**User Story:** En tant qu'utilisateur, je veux être informé clairement en cas d'erreur, afin de comprendre ce qui s'est passé et comment le résoudre.

#### Acceptance Criteria

1. WHEN a file operation fails, THE Files Manager SHALL display a toast notification with a clear error message
2. WHEN a file cannot be uploaded due to insufficient disk space, THE Files Manager SHALL display an error message indicating the space required
3. WHEN a file cannot be deleted due to permissions, THE Files Manager SHALL display an error message explaining the permission issue
4. WHEN the C:\DimiCall folder cannot be accessed, THE Files Manager SHALL display an error dialog with troubleshooting steps
5. THE Files Manager SHALL log all errors to the Electron log system for debugging purposes

### Requirement 13: Performance et Optimisation

**User Story:** En tant qu'utilisateur, je veux que le gestionnaire de fichiers reste rapide même avec des milliers de fichiers, afin de ne pas ralentir mon travail.

#### Acceptance Criteria

1. WHEN displaying a folder with more than 1000 files, THE Files Manager SHALL use virtualization to render only visible items
2. THE Files Manager SHALL load file thumbnails lazily as they come into view
3. WHEN searching through files, THE Files Manager SHALL debounce search input by 300 milliseconds to avoid excessive filtering
4. THE Files Manager SHALL cache folder contents for 5 minutes to reduce file system reads
5. THE Files Manager SHALL use Web Workers for heavy operations like file hashing or thumbnail generation
