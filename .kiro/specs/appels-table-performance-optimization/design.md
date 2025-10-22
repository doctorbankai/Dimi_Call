# Design Document - Optimisation de Performance de la Table Appels

## Overview

Ce design implémente une solution de virtualisation haute performance pour la table "Appels" en utilisant TanStack Table v8 (headless table management) et TanStack Virtual v3 (row virtualization). La solution actuelle rend TOUTES les lignes dans le DOM (1000+), causant des problèmes de performance critiques. Cette refonte migrera vers une architecture moderne tout en préservant 100% des fonctionnalités et de l'apparence visuelle.

**Objectifs de Performance:**
- Temps de chargement initial < 500ms (vs ~5-10s actuellement)
- Scroll fluide à 60 FPS constant
- Édition de cellule réactive < 100ms
- Mémoire utilisée < 200MB (vs ~800MB actuellement)
- Render seulement ~40 lignes visibles (vs 1000+ actuellement)

**Technologies:**
- TanStack Table v8.21.3 (déjà installé)
- TanStack Virtual v3.13.12 (déjà installé)
- React 19.2.0 avec hooks optimisés
- Shadcn/ui components (préservés)

## Architecture

### Vue d'Ensemble du Flux de Données

```
┌─────────────────────────────────────────────────────────────────┐
│                    AppelsCardsView (Parent)                      │
│  - Gère l'état global (contacts, selectedContactId, etc.)       │
│  - Gère les filtres, recherche, tri                              │
│  - Passe les données filtrées à PaginatedContactTable            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              PaginatedContactTable (Wrapper)                     │
│  - Gère la pagination (usePagination hook)                       │
│  - Calcule paginatedData (slice des contacts)                    │
│  - Passe les données paginées à VirtualizedContactTable          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│          VirtualizedContactTable (Nouveau Component)             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  TanStack Table (useReactTable)                           │  │
│  │  - Gère les colonnes (visibility, order, sorting)        │  │
│  │  - Fournit table.getRowModel().rows                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                     │                                             │
│                     ▼                                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  TanStack Virtual (useVirtualizer)                        │  │
│  │  - Calcule les lignes visibles (virtualItems)            │  │
│  │  - Gère le scroll et le positionnement                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                     │                                             │
│                     ▼                                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Render Loop (virtualItems.map)                          │  │
│  │  - Rend seulement ~40 lignes visibles                    │  │
│  │  - Utilise React.memo pour les cellules                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Hiérarchie des Composants

```
AppelsCardsView
├── ViewSwitcher (Cards/Table toggle)
├── StatusCompletionChart
├── Toolbar (Filters, Search, Actions)
└── PaginatedContactTable
    ├── VirtualizedContactTable (NOUVEAU)
    │   ├── Table (shadcn/ui)
    │   │   ├── TableHeader (sticky)
    │   │   │   └── SortableHeaderCell (React.memo)
    │   │   └── TableBody (virtual container)
    │   │       └── VirtualRow (React.memo) x ~40
    │   │           ├── TableCell (React.memo)
    │   │           │   ├── StatusSelect
    │   │           │   ├── CommentWidget
    │   │           │   ├── DateTimeCell
    │   │           │   ├── TimePickerWithClear
    │   │           │   └── EditableCell
    │   │           └── ...
    │   ├── ReminderDialog
    │   └── ImportMappingDialog
    └── TablePagination
```


## Components and Interfaces

### 1. VirtualizedContactTable (Nouveau Composant Principal)

**Responsabilités:**
- Intégrer TanStack Table pour la gestion de table headless
- Intégrer TanStack Virtual pour la virtualisation des lignes
- Gérer le sticky header avec styles inline
- Exposer scrollToContact via ref pour le scroll automatique
- Préserver tous les widgets de cellules existants

**Props Interface:**
```typescript
interface VirtualizedContactTableProps {
  contacts: Contact[]                    // Données paginées depuis PaginatedContactTable
  callStates: CallStates
  onSelectContact: (contact: Contact | null) => void
  selectedContactId: string | null
  onUpdateContact: (contact: Partial<Contact> & { id: string }) => void
  onDeleteContact: (contactId: string) => void
  activeCallContactId: string | null
  theme: Theme
  visibleColumns: Record<string, boolean>
  columnHeaders: string[]
  contactDataKeys: (keyof Contact | null)[]
  onToggleColumnVisibility: (header: string) => void
  availableColumns?: string[]
  onFileImport?: (file: File) => Promise<void>
}

export interface VirtualizedContactTableRef {
  scrollToContact: (contactId: string) => void
}
```

**État Interne:**
```typescript
// TanStack Table state
const [sorting, setSorting] = useState<SortingState>([])
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
const [columnOrder, setColumnOrder] = useState<string[]>([])

// Édition inline state
const [editingCell, setEditingCell] = useState<{
  contactId: string
  field: keyof Contact
} | null>(null)
const [editValue, setEditValue] = useState('')

// Dialog state
const [reminderDialog, setReminderDialog] = useState<{
  isOpen: boolean
  contact: Contact | null
}>({ isOpen: false, contact: null })

// Refs
const scrollContainerRef = useRef<HTMLDivElement>(null)
const shouldAutoScrollRef = useRef(false)
```


### 2. TanStack Table Integration

**Configuration:**
```typescript
// Définition des colonnes avec TanStack Table
const columns = useMemo<ColumnDef<Contact>[]>(() => {
  return columnHeaders.map((header, index) => {
    const dataKey = contactDataKeys[index]
    
    return {
      id: header,
      accessorKey: dataKey || 'index',
      header: ({ column }) => (
        <SortableHeaderCell
          column={column}
          label={header}
          icon={TABLE_HEADER_ICONS[header]}
        />
      ),
      cell: ({ row, column }) => (
        <MemoizedCell
          contact={row.original}
          columnKey={dataKey as keyof Contact}
          columnId={column.id}
          isSelected={row.original.id === selectedContactId}
          onUpdate={onUpdateContact}
          onOpenReminder={handleOpenReminderDialog}
          theme={theme}
        />
      ),
      enableSorting: true,
      enableHiding: !['#', 'Prénom', 'Nom', 'Commentaire'].includes(header),
    }
  })
}, [columnHeaders, contactDataKeys, selectedContactId, theme])

// Instance TanStack Table
const table = useReactTable({
  data: contacts,
  columns,
  state: {
    sorting,
    columnVisibility,
    columnOrder,
  },
  onSortingChange: setSorting,
  onColumnVisibilityChange: setColumnVisibility,
  onColumnOrderChange: setColumnOrder,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  enableRowSelection: true,
  getRowId: (row) => row.id,
})
```

**Avantages:**
- Gestion automatique du tri avec getSortedRowModel()
- Gestion de la visibilité des colonnes avec columnVisibility state
- Gestion de l'ordre des colonnes avec columnOrder state
- API headless flexible pour le rendu custom


### 3. TanStack Virtual Integration

**Configuration:**
```typescript
// Virtualizer pour les lignes
const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 40, // Hauteur estimée d'une ligne en pixels
  overscan: 10, // Nombre de lignes à rendre au-dessus/en-dessous du viewport
  measureElement:
    typeof window !== 'undefined' &&
    navigator.userAgent.indexOf('Firefox') === -1
      ? (element) => element?.getBoundingClientRect().height
      : undefined,
})

// Accès aux lignes virtuelles
const virtualRows = rowVirtualizer.getVirtualItems()
const totalSize = rowVirtualizer.getTotalSize()

// Padding pour compenser les lignes non rendues
const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0
const paddingBottom =
  virtualRows.length > 0
    ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
    : 0
```

**Rendu Virtualisé:**
```typescript
<div
  ref={scrollContainerRef}
  className="overflow-auto h-full"
  style={{ position: 'relative' }}
>
  <Table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
    {/* Sticky Header */}
    <TableHeader style={{ position: 'sticky', top: 0, zIndex: 101 }}>
      {table.getHeaderGroups().map(headerGroup => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map(header => (
            <TableHead key={header.id} style={getStickyHeaderStyles()}>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
    
    {/* Virtual Body */}
    <TableBody>
      {/* Padding supérieur pour les lignes non rendues */}
      {paddingTop > 0 && (
        <tr>
          <td style={{ height: `${paddingTop}px` }} />
        </tr>
      )}
      
      {/* Lignes virtuelles visibles */}
      {virtualRows.map((virtualRow) => {
        const row = table.getRowModel().rows[virtualRow.index]
        return (
          <MemoizedTableRow
            key={row.id}
            row={row}
            virtualRow={virtualRow}
            isSelected={row.original.id === selectedContactId}
            isActiveCall={row.original.id === activeCallContactId}
            callState={callStates[row.original.id]}
            onSelect={() => {
              shouldAutoScrollRef.current = true
              onSelectContact(row.original)
            }}
            theme={theme}
          />
        )
      })}
      
      {/* Padding inférieur pour les lignes non rendues */}
      {paddingBottom > 0 && (
        <tr>
          <td style={{ height: `${paddingBottom}px` }} />
        </tr>
      )}
    </TableBody>
  </Table>
</div>
```

**Avantages:**
- Render seulement ~40 lignes (overscan: 10 = 20 visibles + 10 au-dessus + 10 en-dessous)
- Scroll fluide avec positionnement absolu
- Mesure dynamique des hauteurs de lignes si nécessaire
- API scrollToIndex pour le scroll automatique


### 4. Optimisation avec React.memo et useMemo

**MemoizedTableRow Component:**
```typescript
interface MemoizedTableRowProps {
  row: Row<Contact>
  virtualRow: VirtualItem
  isSelected: boolean
  isActiveCall: boolean
  callState?: CallState
  onSelect: () => void
  theme: Theme
}

const MemoizedTableRow = React.memo<MemoizedTableRowProps>(
  ({ row, virtualRow, isSelected, isActiveCall, callState, onSelect, theme }) => {
    return (
      <TableRow
        data-contact-id={row.original.id}
        data-index={virtualRow.index}
        ref={rowVirtualizer.measureElement}
        className={cn(
          'cursor-pointer transition-colors duration-150',
          !isSelected && 'hover:bg-muted/50',
          isSelected && 'bg-blue-500/20 dark:bg-blue-500/30',
          isActiveCall && 'bg-green-900/20 hover:bg-green-900/30'
        )}
        onClick={onSelect}
        style={{
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`,
        }}
      >
        {row.getVisibleCells().map(cell => (
          <MemoizedCell
            key={cell.id}
            cell={cell}
            contact={row.original}
            isSelected={isSelected}
            theme={theme}
          />
        ))}
      </TableRow>
    )
  },
  (prev, next) => {
    // Comparaison shallow optimisée
    return (
      prev.row.id === next.row.id &&
      prev.isSelected === next.isSelected &&
      prev.isActiveCall === next.isActiveCall &&
      prev.virtualRow.index === next.virtualRow.index &&
      prev.virtualRow.size === next.virtualRow.size &&
      prev.callState?.isCalling === next.callState?.isCalling
    )
  }
)
```

**MemoizedCell Component:**
```typescript
interface MemoizedCellProps {
  cell: Cell<Contact, unknown>
  contact: Contact
  isSelected: boolean
  theme: Theme
}

const MemoizedCell = React.memo<MemoizedCellProps>(
  ({ cell, contact, isSelected, theme }) => {
    const columnKey = cell.column.id as keyof Contact
    
    return (
      <TableCell className="px-2 py-1.5 text-xs text-center">
        <div className="flex items-center justify-center min-h-[32px]">
          {renderCellContent(contact, columnKey, theme)}
        </div>
      </TableCell>
    )
  },
  (prev, next) => {
    const prevValue = prev.contact[prev.cell.column.id as keyof Contact]
    const nextValue = next.contact[next.cell.column.id as keyof Contact]
    
    return (
      prev.cell.id === next.cell.id &&
      prevValue === nextValue &&
      prev.isSelected === next.isSelected
    )
  }
)
```

**Avantages:**
- Évite les re-renders inutiles des lignes non modifiées
- Comparaison shallow personnalisée pour une performance optimale
- Isolation des mises à jour au niveau cellule


### 5. Gestion des Widgets de Cellules (Préservés)

**Stratégie de Rendu:**
```typescript
const renderCellContent = (
  contact: Contact,
  columnKey: keyof Contact,
  theme: Theme
) => {
  switch (columnKey) {
    case 'statut':
      return (
        <StatusSelect
          value={contact.statut || ContactStatus.NonDefini}
          onChange={(newStatus) => {
            onUpdateContact({ id: contact.id, statut: newStatus })
          }}
          triggerClassName="border-none bg-transparent p-0 h-auto"
          size="sm"
        />
      )
    
    case 'commentaire':
      return (
        <CommentWidget
          value={contact.commentaire || ''}
          onChange={(newComment) => {
            debouncedUpdate(contact.id, 'commentaire', newComment)
          }}
          theme={theme}
        />
      )
    
    case 'dateRappel':
      return (
        <div className="flex items-center justify-center gap-1">
          <DateTimeCell
            value={contact.dateRappel || ''}
            type="date"
            onChange={(newDate) => {
              debouncedUpdate(contact.id, 'dateRappel', newDate)
            }}
            theme={theme}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenReminderDialog(contact)
            }}
          >
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      )
    
    case 'heureRappel':
    case 'heureRDV':
    case 'heureAppel':
      return (
        <DateTimeCell
          value={contact[columnKey] || ''}
          type="time"
          onChange={(newTime) => {
            debouncedUpdate(contact.id, columnKey, newTime)
          }}
          theme={theme}
        />
      )
    
    case 'dateRDV':
    case 'dateAppel':
      return (
        <DateTimeCell
          value={contact[columnKey] || ''}
          type="date"
          onChange={(newDate) => {
            debouncedUpdate(contact.id, columnKey, newDate)
          }}
          theme={theme}
        />
      )
    
    case 'prenom':
    case 'nom':
    case 'telephone':
    case 'email':
    case 'source':
      return (
        <EditableCell
          value={contact[columnKey] || ''}
          onDoubleClick={() => {
            setEditingCell({ contactId: contact.id, field: columnKey })
            setEditValue(contact[columnKey] || '')
          }}
          isEditing={
            editingCell?.contactId === contact.id &&
            editingCell?.field === columnKey
          }
          editValue={editValue}
          onEditChange={setEditValue}
          onEditCommit={() => {
            onUpdateContact({ id: contact.id, [columnKey]: editValue })
            setEditingCell(null)
          }}
          onEditCancel={() => setEditingCell(null)}
        />
      )
    
    default:
      return <span>{contact[columnKey] || 'N/A'}</span>
  }
}
```

**Debounced Update Hook:**
```typescript
const debouncedUpdate = useMemo(
  () =>
    debounce((contactId: string, field: keyof Contact, value: any) => {
      onUpdateContact({ id: contactId, [field]: value })
    }, 300),
  [onUpdateContact]
)

// Cleanup on unmount
useEffect(() => {
  return () => {
    debouncedUpdate.cancel()
  }
}, [debouncedUpdate])
```

**Avantages:**
- Tous les widgets existants sont préservés (StatusSelect, CommentWidget, DateTimeCell, etc.)
- Debouncing de 300ms pour réduire les appels onUpdateContact
- Édition inline préservée avec double-click


## Data Models

### Contact Interface (Existant - Inchangé)
```typescript
interface Contact {
  id: string
  numeroLigne?: number
  sexe?: string
  prenom?: string
  nom?: string
  telephone?: string
  email?: string
  statut?: ContactStatus
  commentaire?: string
  source?: string
  type?: string
  qualite?: string
  lien?: string
  dateRappel?: string
  heureRappel?: string
  dateRDV?: string
  heureRDV?: string
  dateAppel?: string
  heureAppel?: string
  dureeAppel?: string
  don?: string
  date?: string
  uid?: string
}
```

### TanStack Table Types
```typescript
import { ColumnDef, Row, Cell, SortingState, VisibilityState } from '@tanstack/react-table'

type ContactColumnDef = ColumnDef<Contact>
type ContactRow = Row<Contact>
type ContactCell = Cell<Contact, unknown>
```

### TanStack Virtual Types
```typescript
import { VirtualItem, Virtualizer } from '@tanstack/react-virtual'

type ContactVirtualizer = Virtualizer<HTMLDivElement, Element>
type ContactVirtualItem = VirtualItem
```

### Persistence Types
```typescript
interface ColumnConfig {
  order: string[]
  visibility: Record<string, boolean>
  sorting: SortingState
}

interface VirtualizerConfig {
  overscan: number
  estimateSize: number
}

// LocalStorage keys
const STORAGE_KEYS = {
  COLUMN_ORDER: 'dimicall-column-order',
  COLUMN_VISIBILITY: 'appels2-visible-columns',
  SORT_CONFIG: 'dimicall-sort-config',
  CURRENT_PAGE: 'dimicall-current-page',
  ITEMS_PER_PAGE: 'dimicall-items-per-page',
} as const
```


## Error Handling

### 1. Virtualizer Initialization Errors

**Problème:** Le scrollElement peut ne pas être disponible immédiatement.

**Solution:**
```typescript
const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 40,
  overscan: 10,
  enabled: !!scrollContainerRef.current, // Désactiver si pas de ref
})

// Fallback si virtualizer non initialisé
if (!scrollContainerRef.current) {
  return <div>Chargement...</div>
}
```

### 2. Scroll to Contact Errors

**Problème:** Le contact peut ne pas exister dans les données filtrées/paginées.

**Solution:**
```typescript
const scrollToContact = useCallback((contactId: string) => {
  if (!scrollContainerRef.current) {
    console.warn('[VirtualizedContactTable] Scroll container not available')
    return
  }
  
  const rowIndex = table.getRowModel().rows.findIndex(
    row => row.original.id === contactId
  )
  
  if (rowIndex === -1) {
    console.warn(`[VirtualizedContactTable] Contact ${contactId} not found in current view`)
    toast.info('Contact non visible dans la vue actuelle')
    return
  }
  
  try {
    rowVirtualizer.scrollToIndex(rowIndex, {
      align: 'center',
      behavior: 'smooth',
    })
  } catch (error) {
    console.error('[VirtualizedContactTable] Scroll error:', error)
  }
}, [table, rowVirtualizer])
```

### 3. Update Errors avec Debouncing

**Problème:** Les updates rapides peuvent causer des conflits.

**Solution:**
```typescript
const debouncedUpdate = useMemo(
  () =>
    debounce((contactId: string, field: keyof Contact, value: any) => {
      try {
        onUpdateContact({ id: contactId, [field]: value })
      } catch (error) {
        console.error('[VirtualizedContactTable] Update error:', error)
        toast.error('Erreur de sauvegarde', {
          description: 'Impossible de sauvegarder la modification'
        })
      }
    }, 300),
  [onUpdateContact]
)
```

### 4. Persistence Errors

**Problème:** localStorage peut être plein ou désactivé.

**Solution:**
```typescript
const saveToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`[VirtualizedContactTable] Failed to save ${key}:`, error)
    // Continue sans bloquer l'UI
  }
}

const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : defaultValue
  } catch (error) {
    console.warn(`[VirtualizedContactTable] Failed to load ${key}:`, error)
    return defaultValue
  }
}
```

### 5. Measure Element Errors (Firefox)

**Problème:** Firefox peut avoir des problèmes avec measureElement.

**Solution:**
```typescript
const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 40,
  overscan: 10,
  // Désactiver measureElement sur Firefox
  measureElement:
    typeof window !== 'undefined' &&
    navigator.userAgent.indexOf('Firefox') === -1
      ? (element) => element?.getBoundingClientRect().height
      : undefined,
})
```


## Testing Strategy

### 1. Unit Tests

**Composants à Tester:**
- VirtualizedContactTable
- MemoizedTableRow
- MemoizedCell
- renderCellContent function
- debouncedUpdate hook

**Tests Critiques:**
```typescript
describe('VirtualizedContactTable', () => {
  it('should render only visible rows', () => {
    const contacts = generateMockContacts(1000)
    render(<VirtualizedContactTable contacts={contacts} {...props} />)
    
    // Vérifier que seulement ~40 lignes sont dans le DOM
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeLessThan(50)
  })
  
  it('should scroll to contact when scrollToContact is called', () => {
    const ref = createRef<VirtualizedContactTableRef>()
    render(<VirtualizedContactTable ref={ref} contacts={contacts} {...props} />)
    
    act(() => {
      ref.current?.scrollToContact('contact-500')
    })
    
    // Vérifier que le contact est visible
    expect(screen.getByText('Contact 500')).toBeInTheDocument()
  })
  
  it('should debounce updates', async () => {
    const onUpdateContact = jest.fn()
    render(<VirtualizedContactTable onUpdateContact={onUpdateContact} {...props} />)
    
    // Modifier rapidement 3 fois
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'A' } })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'AB' } })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ABC' } })
    
    // Attendre le debounce (300ms)
    await waitFor(() => {
      expect(onUpdateContact).toHaveBeenCalledTimes(1)
      expect(onUpdateContact).toHaveBeenCalledWith({ id: 'contact-1', commentaire: 'ABC' })
    }, { timeout: 500 })
  })
  
  it('should preserve all cell widgets', () => {
    render(<VirtualizedContactTable contacts={[mockContact]} {...props} />)
    
    expect(screen.getByRole('combobox')).toBeInTheDocument() // StatusSelect
    expect(screen.getByPlaceholderText('Commentaire...')).toBeInTheDocument() // CommentWidget
    expect(screen.getByRole('button', { name: /sélectionner/i })).toBeInTheDocument() // DateTimeCell
  })
})

describe('MemoizedTableRow', () => {
  it('should not re-render when unrelated props change', () => {
    const renderSpy = jest.fn()
    const TestRow = React.memo(MemoizedTableRow, () => {
      renderSpy()
      return false
    })
    
    const { rerender } = render(<TestRow {...props} />)
    
    // Changer une prop non liée
    rerender(<TestRow {...props} theme="dark" />)
    
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })
})
```

### 2. Performance Tests

**Métriques à Mesurer:**
```typescript
describe('Performance Tests', () => {
  it('should load 1000 contacts in < 500ms', async () => {
    const contacts = generateMockContacts(1000)
    const startTime = performance.now()
    
    render(<VirtualizedContactTable contacts={contacts} {...props} />)
    
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(0)
    })
    
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(500)
  })
  
  it('should maintain 60 FPS during scroll', async () => {
    const contacts = generateMockContacts(1000)
    render(<VirtualizedContactTable contacts={contacts} {...props} />)
    
    const scrollContainer = screen.getByRole('table').parentElement
    
    // Simuler un scroll rapide
    const frameTimings: number[] = []
    let lastTime = performance.now()
    
    for (let i = 0; i < 100; i++) {
      fireEvent.scroll(scrollContainer, { target: { scrollTop: i * 40 } })
      const currentTime = performance.now()
      frameTimings.push(currentTime - lastTime)
      lastTime = currentTime
    }
    
    // Vérifier que 90% des frames sont < 16.67ms (60 FPS)
    const goodFrames = frameTimings.filter(t => t < 16.67).length
    expect(goodFrames / frameTimings.length).toBeGreaterThan(0.9)
  })
  
  it('should use < 200MB memory with 1000 contacts', () => {
    const contacts = generateMockContacts(1000)
    
    if (performance.memory) {
      const initialMemory = performance.memory.usedJSHeapSize
      
      render(<VirtualizedContactTable contacts={contacts} {...props} />)
      
      const finalMemory = performance.memory.usedJSHeapSize
      const memoryUsed = (finalMemory - initialMemory) / 1024 / 1024 // MB
      
      expect(memoryUsed).toBeLessThan(200)
    }
  })
})
```

### 3. Integration Tests

**Scénarios à Tester:**
```typescript
describe('Integration Tests', () => {
  it('should work with pagination', () => {
    const contacts = generateMockContacts(1000)
    render(
      <PaginatedContactTable
        contacts={contacts}
        initialItemsPerPage={25}
        {...props}
      />
    )
    
    // Vérifier que seulement 25 contacts sont passés à VirtualizedContactTable
    expect(screen.getAllByRole('row').length).toBeLessThan(35) // 25 + overscan
  })
  
  it('should preserve selection across pagination', () => {
    const contacts = generateMockContacts(100)
    render(<PaginatedContactTable contacts={contacts} {...props} />)
    
    // Sélectionner un contact
    fireEvent.click(screen.getByText('Contact 10'))
    expect(screen.getByText('Contact 10')).toHaveClass('bg-blue-500/20')
    
    // Changer de page
    fireEvent.click(screen.getByText('Page suivante'))
    
    // Revenir à la page 1
    fireEvent.click(screen.getByText('Page précédente'))
    
    // Vérifier que la sélection est préservée
    expect(screen.getByText('Contact 10')).toHaveClass('bg-blue-500/20')
  })
  
  it('should work with sorting', () => {
    const contacts = generateMockContacts(100)
    render(<VirtualizedContactTable contacts={contacts} {...props} />)
    
    // Cliquer sur l'en-tête "Nom" pour trier
    fireEvent.click(screen.getByText('Nom'))
    
    // Vérifier que les contacts sont triés
    const rows = screen.getAllByRole('row')
    const firstContact = within(rows[1]).getByText(/Contact/)
    const secondContact = within(rows[2]).getByText(/Contact/)
    
    expect(firstContact.textContent! < secondContact.textContent!).toBe(true)
  })
})
```

### 4. Visual Regression Tests

**Captures d'Écran à Comparer:**
- Table avec 1000 contacts (vue initiale)
- Table avec ligne sélectionnée
- Table avec appel actif
- Table avec sticky header lors du scroll
- Table avec colonnes masquées
- Table avec tri appliqué

**Outil:** Playwright ou Chromatic


## Performance Optimizations

### 1. Memoization Strategy

**Composants Memoized:**
```typescript
// Ligne complète
const MemoizedTableRow = React.memo(TableRow, rowComparator)

// Cellule individuelle
const MemoizedCell = React.memo(Cell, cellComparator)

// En-tête de colonne
const MemoizedHeaderCell = React.memo(HeaderCell, headerComparator)

// Widgets de cellules
const MemoizedStatusSelect = React.memo(StatusSelect)
const MemoizedCommentWidget = React.memo(CommentWidget)
const MemoizedDateTimeCell = React.memo(DateTimeCell)
```

**Comparateurs Optimisés:**
```typescript
const rowComparator = (prev: RowProps, next: RowProps) => {
  // Comparaison rapide des props critiques
  if (prev.row.id !== next.row.id) return false
  if (prev.isSelected !== next.isSelected) return false
  if (prev.isActiveCall !== next.isActiveCall) return false
  if (prev.virtualRow.index !== next.virtualRow.index) return false
  
  // Comparaison shallow des données du contact
  const prevContact = prev.row.original
  const nextContact = next.row.original
  
  // Comparer seulement les champs visibles
  for (const key of prev.visibleColumns) {
    if (prevContact[key] !== nextContact[key]) return false
  }
  
  return true
}
```

### 2. Debouncing Strategy

**Updates Debounced:**
```typescript
// Commentaires - 300ms
const debouncedCommentUpdate = useMemo(
  () => debounce((id, value) => onUpdateContact({ id, commentaire: value }), 300),
  [onUpdateContact]
)

// Dates/Heures - 500ms (plus de temps pour sélectionner)
const debouncedDateUpdate = useMemo(
  () => debounce((id, field, value) => onUpdateContact({ id, [field]: value }), 500),
  [onUpdateContact]
)

// Texte libre (Prénom, Nom, etc.) - 1000ms
const debouncedTextUpdate = useMemo(
  () => debounce((id, field, value) => onUpdateContact({ id, [field]: value }), 1000),
  [onUpdateContact]
)
```

### 3. Virtual Scrolling Configuration

**Paramètres Optimaux:**
```typescript
const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 40, // Hauteur moyenne d'une ligne
  overscan: 10, // 10 lignes au-dessus + 10 en-dessous = 20 lignes buffer
  measureElement: // Mesure dynamique seulement si nécessaire
    typeof window !== 'undefined' &&
    navigator.userAgent.indexOf('Firefox') === -1
      ? (element) => element?.getBoundingClientRect().height
      : undefined,
  scrollPaddingStart: 0,
  scrollPaddingEnd: 0,
  initialOffset: 0,
  enabled: true,
})
```

**Calcul du Nombre de Lignes Rendues:**
- Viewport height: ~600px
- Row height: 40px
- Visible rows: 600 / 40 = 15 lignes
- Overscan: 10 lignes au-dessus + 10 en-dessous
- **Total rendered: 15 + 20 = 35 lignes** (vs 1000+ actuellement)

### 4. Lazy Loading des Widgets

**Stratégie:**
```typescript
// Charger les widgets lourds seulement quand nécessaires
const LazyStatusSelect = lazy(() => import('./StatusSelect'))
const LazyCommentWidget = lazy(() => import('./CommentWidget'))
const LazyDateTimeCell = lazy(() => import('./DateTimeCell'))

// Utiliser Suspense pour le fallback
<Suspense fallback={<Skeleton className="h-8 w-full" />}>
  <LazyStatusSelect {...props} />
</Suspense>
```

### 5. CSS Optimizations

**Sticky Header Performance:**
```typescript
const getStickyHeaderStyles = (): React.CSSProperties => ({
  position: 'sticky',
  top: 0,
  zIndex: 101,
  backgroundColor: 'hsl(var(--background))',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  boxShadow: '0 2px 8px 0 rgb(0 0 0 / 0.1)',
  borderBottom: '1px solid hsl(var(--border))',
  // Force hardware acceleration
  willChange: 'transform',
  transform: 'translateZ(0)',
})
```

**Row Positioning:**
```typescript
// Utiliser transform au lieu de top/left pour de meilleures performances
<TableRow
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: `${virtualRow.size}px`,
    transform: `translateY(${virtualRow.start}px)`, // GPU-accelerated
  }}
>
```

### 6. Event Handling Optimization

**Throttled Scroll Handler:**
```typescript
const handleScroll = useCallback(
  throttle(() => {
    // Logique de scroll si nécessaire
  }, 16), // ~60 FPS
  []
)

useEffect(() => {
  const scrollElement = scrollContainerRef.current
  if (!scrollElement) return
  
  scrollElement.addEventListener('scroll', handleScroll, { passive: true })
  
  return () => {
    scrollElement.removeEventListener('scroll', handleScroll)
    handleScroll.cancel()
  }
}, [handleScroll])
```

### 7. Bundle Size Optimization

**Code Splitting:**
```typescript
// Séparer VirtualizedContactTable dans son propre chunk
const VirtualizedContactTable = lazy(() => 
  import('./VirtualizedContactTable')
)

// Dans AppelsCardsView
{viewMode === 'table' && (
  <Suspense fallback={<TableSkeleton />}>
    <VirtualizedContactTable {...props} />
  </Suspense>
)}
```

**Tree Shaking:**
```typescript
// Importer seulement les fonctions nécessaires de TanStack
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'

import {
  useVirtualizer,
} from '@tanstack/react-virtual'
```

### 8. Memory Management

**Cleanup Strategy:**
```typescript
useEffect(() => {
  // Cleanup des debounced functions
  return () => {
    debouncedCommentUpdate.cancel()
    debouncedDateUpdate.cancel()
    debouncedTextUpdate.cancel()
  }
}, [debouncedCommentUpdate, debouncedDateUpdate, debouncedTextUpdate])

useEffect(() => {
  // Cleanup du virtualizer
  return () => {
    rowVirtualizer.measure() // Reset measurements
  }
}, [rowVirtualizer])
```

**Weak References pour les Caches:**
```typescript
// Utiliser WeakMap pour les caches de cellules
const cellCache = new WeakMap<Contact, Map<string, any>>()

const getCachedCellValue = (contact: Contact, field: string) => {
  if (!cellCache.has(contact)) {
    cellCache.set(contact, new Map())
  }
  return cellCache.get(contact)!.get(field)
}
```


## Migration Strategy

### Phase 1: Préparation (Sans Breaking Changes)

**Objectif:** Préparer le terrain sans casser l'existant.

**Actions:**
1. Créer le nouveau composant `VirtualizedContactTable.tsx` en parallèle
2. Créer les composants memoized (`MemoizedTableRow`, `MemoizedCell`)
3. Créer les hooks utilitaires (`useDebouncedUpdate`, `useVirtualizerConfig`)
4. Ajouter les tests unitaires pour les nouveaux composants
5. Documenter l'API du nouveau composant

**Durée Estimée:** 2-3 jours

### Phase 2: Feature Flag Implementation

**Objectif:** Permettre de basculer entre l'ancienne et la nouvelle table.

**Implementation:**
```typescript
// Dans AppelsCardsView.tsx
const [useVirtualizedTable, setUseVirtualizedTable] = useState(() => {
  try {
    const saved = localStorage.getItem('dimicall-use-virtualized-table')
    return saved === 'true'
  } catch {
    return false
  }
})

// Render conditionnel
{viewMode === 'table' && (
  useVirtualizedTable ? (
    <VirtualizedContactTable
      ref={contactTableRef}
      contacts={filteredContacts}
      {...tableProps}
    />
  ) : (
    <PaginatedContactTable
      ref={contactTableRef}
      contacts={filteredContacts}
      {...tableProps}
    />
  )
)}

// Toggle dans les settings
<Switch
  checked={useVirtualizedTable}
  onCheckedChange={(checked) => {
    setUseVirtualizedTable(checked)
    localStorage.setItem('dimicall-use-virtualized-table', String(checked))
  }}
/>
```

**Durée Estimée:** 1 jour

### Phase 3: Testing & Validation

**Objectif:** Valider que la nouvelle table fonctionne correctement.

**Tests à Effectuer:**
1. Tests unitaires (Jest + React Testing Library)
2. Tests d'intégration (avec pagination, tri, filtrage)
3. Tests de performance (Lighthouse, React DevTools Profiler)
4. Tests visuels (Playwright screenshots)
5. Tests manuels avec 1000+ contacts
6. Tests de compatibilité (Chrome, Firefox, Safari, Edge)

**Métriques de Succès:**
- ✅ Temps de chargement initial < 500ms
- ✅ Scroll fluide à 60 FPS
- ✅ Édition de cellule < 100ms
- ✅ Mémoire utilisée < 200MB
- ✅ Tous les tests passent
- ✅ Aucune régression visuelle

**Durée Estimée:** 2-3 jours

### Phase 4: Rollout Progressif

**Objectif:** Déployer progressivement la nouvelle table.

**Stratégie:**
1. **Semaine 1:** Feature flag activé pour 10% des utilisateurs
2. **Semaine 2:** Si pas de bugs critiques, 50% des utilisateurs
3. **Semaine 3:** Si pas de bugs critiques, 100% des utilisateurs
4. **Semaine 4:** Supprimer l'ancienne table et le feature flag

**Monitoring:**
```typescript
// Logger les métriques de performance
useEffect(() => {
  if (useVirtualizedTable) {
    const loadTime = performance.now() - startTime
    
    // Envoyer à un service d'analytics
    analytics.track('virtualized_table_load', {
      loadTime,
      contactCount: contacts.length,
      browser: navigator.userAgent,
    })
  }
}, [useVirtualizedTable, contacts.length])
```

**Durée Estimée:** 4 semaines

### Phase 5: Cleanup

**Objectif:** Supprimer l'ancien code et finaliser la migration.

**Actions:**
1. Supprimer `ContactTable.tsx` (ancien composant)
2. Renommer `VirtualizedContactTable.tsx` en `ContactTable.tsx`
3. Supprimer le feature flag
4. Mettre à jour la documentation
5. Créer un changelog détaillé

**Durée Estimée:** 1 jour

### Rollback Plan

**Si des problèmes critiques sont détectés:**

1. **Désactiver immédiatement le feature flag:**
```typescript
localStorage.setItem('dimicall-use-virtualized-table', 'false')
window.location.reload()
```

2. **Identifier et logger le problème:**
```typescript
try {
  // Code de la nouvelle table
} catch (error) {
  console.error('[VirtualizedContactTable] Critical error:', error)
  
  // Envoyer à un service d'erreur
  errorTracking.captureException(error, {
    context: 'virtualized_table',
    contactCount: contacts.length,
  })
  
  // Fallback vers l'ancienne table
  setUseVirtualizedTable(false)
  toast.error('Erreur détectée, retour à l\'ancienne table')
}
```

3. **Hotfix et redéploiement:**
- Corriger le bug identifié
- Tester en local
- Déployer un hotfix
- Réactiver progressivement le feature flag


## Implementation Notes

### 1. Compatibilité avec l'Existant

**Props Interface Identique:**
Le nouveau `VirtualizedContactTable` doit accepter exactement les mêmes props que l'ancien `ContactTable` pour faciliter le remplacement:

```typescript
// Ancien ContactTable props
interface ContactTableProps {
  contacts: Contact[]
  callStates: CallStates
  onSelectContact: (contact: Contact | null) => void
  selectedContactId: string | null
  onUpdateContact: (contact: Partial<Contact> & { id: string }) => void
  onDeleteContact: (contactId: string) => void
  activeCallContactId: string | null
  theme: Theme
  visibleColumns: Record<string, boolean>
  columnHeaders: string[]
  contactDataKeys: (keyof Contact | null)[]
  onToggleColumnVisibility: (header: string) => void
  availableColumns?: string[]
  onFileImport?: (file: File) => Promise<void>
}

// Nouveau VirtualizedContactTable props - IDENTIQUE
interface VirtualizedContactTableProps extends ContactTableProps {}
```

**Ref Interface Identique:**
```typescript
export interface ContactTableRef {
  scrollToContact: (contactId: string) => void
  openImportMapping?: (file: File) => Promise<void>
}
```

### 2. Gestion des Colonnes Dynamiques

**Problème:** Les colonnes peuvent être ajoutées/supprimées dynamiquement.

**Solution:**
```typescript
// Synchroniser columnHeaders avec TanStack Table columns
useEffect(() => {
  const newColumns = columnHeaders.map((header, index) => ({
    id: header,
    accessorKey: contactDataKeys[index] || 'index',
    header: header,
    // ... autres configs
  }))
  
  table.setOptions((prev) => ({
    ...prev,
    columns: newColumns,
  }))
}, [columnHeaders, contactDataKeys])
```

### 3. Sticky Header avec Virtualisation

**Défi:** Le sticky header doit rester fixe pendant le scroll virtuel.

**Solution:**
```typescript
// Structure HTML correcte
<div ref={scrollContainerRef} className="overflow-auto h-full">
  <Table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
    {/* Sticky Header - TOUJOURS rendu */}
    <TableHeader
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 101,
        backgroundColor: 'hsl(var(--background))',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Headers */}
    </TableHeader>
    
    {/* Virtual Body */}
    <TableBody style={{ position: 'relative' }}>
      {/* Padding supérieur */}
      {paddingTop > 0 && (
        <tr>
          <td style={{ height: `${paddingTop}px` }} />
        </tr>
      )}
      
      {/* Lignes virtuelles */}
      {virtualRows.map((virtualRow) => (
        <TableRow
          key={virtualRow.key}
          data-index={virtualRow.index}
          ref={rowVirtualizer.measureElement}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          {/* Cellules */}
        </TableRow>
      ))}
      
      {/* Padding inférieur */}
      {paddingBottom > 0 && (
        <tr>
          <td style={{ height: `${paddingBottom}px` }} />
        </tr>
      )}
    </TableBody>
  </Table>
</div>
```

### 4. Animations Framer Motion

**Problème:** Les animations Framer Motion sur chaque ligne sont coûteuses.

**Solution:** Supprimer les animations ou les limiter aux interactions critiques.

```typescript
// AVANT (lent)
<motion.tr
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, delay: contactIndex * 0.01 }}
>

// APRÈS (rapide)
<tr className="transition-colors duration-150">
  {/* Seulement transition CSS pour hover/selection */}
</tr>
```

### 5. Gestion du Focus et de l'Accessibilité

**Maintenir l'Accessibilité:**
```typescript
<TableRow
  role="row"
  tabIndex={0}
  aria-selected={isSelected}
  aria-label={`Contact ${contact.prenom} ${contact.nom}`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelectContact(contact)
    }
  }}
>
```

### 6. Debugging et Monitoring

**Dev Tools:**
```typescript
// Mode debug pour le développement
const DEBUG = process.env.NODE_ENV === 'development'

useEffect(() => {
  if (DEBUG) {
    console.log('[VirtualizedContactTable] Render stats:', {
      totalContacts: contacts.length,
      visibleRows: virtualRows.length,
      virtualizedRange: {
        start: virtualRows[0]?.index,
        end: virtualRows[virtualRows.length - 1]?.index,
      },
      totalSize: rowVirtualizer.getTotalSize(),
    })
  }
}, [contacts.length, virtualRows, rowVirtualizer])
```

**Performance Monitoring:**
```typescript
// Mesurer le temps de rendu
useEffect(() => {
  const startTime = performance.now()
  
  return () => {
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    if (renderTime > 100) {
      console.warn(`[VirtualizedContactTable] Slow render: ${renderTime}ms`)
    }
  }
})
```

### 7. Considérations Electron

**Problème:** Electron peut avoir des comportements différents du navigateur.

**Solutions:**
```typescript
// Détecter l'environnement Electron
const isElectron = typeof window !== 'undefined' && 
  window.process?.type === 'renderer'

// Ajuster les paramètres de virtualisation
const overscan = isElectron ? 15 : 10 // Plus de buffer dans Electron

// Désactiver certaines optimisations si nécessaire
const measureElement = isElectron
  ? undefined // Pas de mesure dynamique dans Electron
  : (element) => element?.getBoundingClientRect().height
```

### 8. Gestion des Données Asynchrones

**Problème:** Les contacts peuvent être chargés de manière asynchrone.

**Solution:**
```typescript
// Loading state
if (contacts.length === 0 && isLoading) {
  return <TableSkeleton rows={25} />
}

// Empty state
if (contacts.length === 0 && !isLoading) {
  return <EmptyState />
}

// Normal render
return <VirtualizedContactTable contacts={contacts} {...props} />
```

