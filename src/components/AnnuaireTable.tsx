import React, { useCallback, useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import StatusSelect from '@/components/StatusSelect';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatPhoneNumber } from '@/services/dataService';
import { ContactStatus } from '@/types';

interface DirectoryContact {
  id: string;
  fullName: string;
  prenom: string;
  nom: string;
  telephone: string;
  email?: string;
  status: string;
  previousStatus?: string;
  commentaire?: string;
  reminder?: { date?: string; time?: string; label: string };
  rdv?: { date?: string; time?: string; label: string };
  lastCall?: { date?: string; time?: string; duration?: string; label: string };
  history: any[];
  events: any[];
  lastUpdatedAt?: string | null;
  lastUpdatedLabel?: string;
  totalEvents: number;
  numeroLigne: number;
}

export type AnnuaireEditableField =
  | 'prenom'
  | 'nom'
  | 'email'
  | 'commentaire'
  | 'status'
  | 'dateRappel'
  | 'heureRappel'
  | 'dateRDV'
  | 'heureRDV'
  | 'dateAppel'
  | 'heureAppel'
  | 'dureeAppel';

interface AnnuaireTableProps {
  contacts: DirectoryContact[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean | 'indeterminate') => void;
  onContactClick: (contact: DirectoryContact) => void;
  loading: boolean;
  theme?: 'dark' | 'light';
  onUpdateField: (contactId: string, field: AnnuaireEditableField, value: string) => Promise<void>;
}


type SortKey = keyof DirectoryContact | 'fullName';

const statusKey = (value?: string | null): string => {
  if (!value) return '';
  return String(value)
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
};

const toContactStatus = (value: string | undefined): ContactStatus => {
  if (!value) {
    return ContactStatus.NonDefini;
  }
  const normalized = value.trim().toLowerCase();
  const match = Object.values(ContactStatus).find((status) => status.toLowerCase() === normalized);
  return match ?? ContactStatus.NonDefini;
};



export function AnnuaireTable({
  contacts,
  selectedIds,
  onToggleSelection,
  onToggleSelectAll,
  onContactClick,
  loading,
  onUpdateField,
}: AnnuaireTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('numeroLigne');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editing, setEditing] = useState<{ id: string; field: string; value: string } | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedContacts = useMemo(() => {
    const sorted = [...contacts].sort((a, b) => {
      let aVal: any = a[sortKey as keyof DirectoryContact];
      let bVal: any = b[sortKey as keyof DirectoryContact];

      if (sortKey === 'fullName') {
        aVal = a.fullName;
        bVal = b.fullName;
      }

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDir === 'asc' ? -1 : 1;
      if (bVal == null) return sortDir === 'asc' ? 1 : -1;

      const aStr = String(aVal);
      const bStr = String(bVal);
      const cmp = aStr.localeCompare(bStr, 'fr', { sensitivity: 'base', numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [contacts, sortKey, sortDir]);

  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));
  const someSelected = contacts.some((c) => selectedIds.has(c.id)) && !allSelected;

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground" />;
    }
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const startEdit = (id: string, field: string, value: any) => {
    setEditing({ id, field, value: String(value ?? '') });
  };

  const commitEdit = useCallback(async () => {
    if (!editing) {
      return;
    }
    const { id, field, value } = editing;
    await onUpdateField(id, field as AnnuaireEditableField, value);
    setEditing(null);
  }, [editing, onUpdateField]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void commitEdit();
    }
    if (e.key === 'Escape') {
      setEditing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <Table className="relative w-full table-auto min-w-[1200px]">
          <TableHeader
            className="[&_tr]:border-b"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 90,
              backgroundColor: 'hsl(var(--background))',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="px-2 py-1.5 text-center text-xs min-w-[38px]">
                <Checkbox
                  checked={allSelected ? true : (someSelected ? 'indeterminate' as any : false)}
                  onCheckedChange={(v) => onToggleSelectAll(v as boolean | 'indeterminate')}
                  aria-label="Tout sélectionner"
                />
              </TableHead>
              <TableHead
                onClick={() => handleSort('numeroLigne')}
                className="px-2 py-1.5 text-center text-xs min-w-[60px] cursor-pointer select-none"
              >
                <div className="inline-flex items-center gap-1 justify-center">
                  # <SortIcon column="numeroLigne" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('prenom')}
                className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none"
              >
                <div className="inline-flex items-center gap-1 justify-center">
                  Prénom <SortIcon column="prenom" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('nom')}
                className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none"
              >
                <div className="inline-flex items-center gap-1 justify-center">
                  Nom <SortIcon column="nom" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('telephone')}
                className="px-2 py-1.5 text-center text-xs min-w-[150px] cursor-pointer select-none"
              >
                <div className="inline-flex items-center gap-1 justify-center">
                  Téléphone <SortIcon column="telephone" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('email')}
                className="px-2 py-1.5 text-center text-xs min-w-[150px] cursor-pointer select-none"
              >
                <div className="inline-flex items-center gap-1 justify-center">
                  Email <SortIcon column="email" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('status')}
                className="px-2 py-1.5 text-center text-xs min-w-[100px] cursor-pointer select-none"
              >
                <div className="inline-flex items-center gap-1 justify-center">
                  Statut <SortIcon column="status" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('commentaire')}
                className="px-2 py-1.5 text-center text-xs min-w-[120px] cursor-pointer select-none"
              >
                <div className="inline-flex items-center gap-1 justify-center">
                  Commentaire <SortIcon column="commentaire" />
                </div>
              </TableHead>
              <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Date Rappel</TableHead>
              <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Heure Rappel</TableHead>
              <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Date RDV</TableHead>
              <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Heure RDV</TableHead>
              <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Date Appel</TableHead>
              <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Heure Appel</TableHead>
              <TableHead className="px-2 py-1.5 text-center text-xs min-w-[100px]">Durée Appel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedContacts.length === 0 ? (
              <TableRow>
                <TableCell className="p-4 text-center text-muted-foreground" colSpan={15}>
                  Aucun contact à afficher.
                </TableCell>
              </TableRow>
            ) : (
              sortedContacts.map((contact) => {
                const isSelected = selectedIds.has(contact.id);
                return (
                  <TableRow
                    key={contact.id}
                    className={`${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/40 ' : ''
                    }hover:bg-muted/50 cursor-pointer transition-colors duration-150 border-b`}
                    onClick={() => onContactClick(contact)}
                  >
                    <TableCell
                      className="px-2 py-1.5 text-xs text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(v) => onToggleSelection(contact.id, !!v)}
                        aria-label="Sélectionner la ligne"
                      />
                    </TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap">
                      {contact.numeroLigne}
                    </TableCell>
                    <TableCell
                      className="px-2 py-1.5 text-xs text-center whitespace-nowrap"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEdit(contact.id, 'prenom', contact.prenom);
                      }}
                    >
                      {editing?.id === contact.id && editing.field === 'prenom' ? (
                        <input
                          className="h-7 px-2 text-xs border rounded w-full"
                          value={editing.value}
                          autoFocus
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => void commitEdit()}
                          onKeyDown={onKeyDown}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        contact.prenom || ''
                      )}
                    </TableCell>
                    <TableCell
                      className="px-2 py-1.5 text-xs text-center whitespace-nowrap"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEdit(contact.id, 'nom', contact.nom);
                      }}
                    >
                      {editing?.id === contact.id && editing.field === 'nom' ? (
                        <input
                          className="h-7 px-2 text-xs border rounded w-full"
                          value={editing.value}
                          autoFocus
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => void commitEdit()}
                          onKeyDown={onKeyDown}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        contact.nom || ''
                      )}
                    </TableCell>
                    <TableCell className="px-2 py-1.5 text-xs text-center whitespace-nowrap font-mono">
                      {formatPhoneNumber(contact.telephone)}
                    </TableCell>
                    <TableCell
                      className="px-2 py-1.5 text-xs text-center whitespace-nowrap"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEdit(contact.id, 'email', contact.email);
                      }}
                    >
                      {editing?.id === contact.id && editing.field === 'email' ? (
                        <input
                          className="h-7 px-2 text-xs border rounded w-full"
                          value={editing.value}
                          autoFocus
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => void commitEdit()}
                          onKeyDown={onKeyDown}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate block max-w-[180px] mx-auto" title={contact.email}>
                          {contact.email || ''}
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className="px-2 py-1.5 text-xs text-center whitespace-nowrap"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <StatusSelect
                        value={toContactStatus(contact.status)}
                        onChange={(nextStatus) => {
                          void onUpdateField(contact.id, 'status', nextStatus);
                        }}
                        size="sm"
                        triggerClassName="min-w-[120px]"
                        contentClassName="min-w-[200px]"
                      />
                    </TableCell>
                    <TableCell
                      className="px-2 py-1.5 text-xs text-center whitespace-nowrap"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEdit(contact.id, 'commentaire', contact.commentaire);
                      }}
                    >
                      {editing?.id === contact.id && editing.field === 'commentaire' ? (
                        <input
                          className="h-7 px-2 text-xs border rounded w-full"
                          value={editing.value}
                          autoFocus
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => void commitEdit()}
                          onKeyDown={onKeyDown}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate block max-w-[180px] mx-auto" title={contact.commentaire}>
                          {contact.commentaire || ''}
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className="px-2 py-1.5 text-xs text-center whitespace-nowrap"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEdit(contact.id, 'dateRappel', contact.reminder?.date ?? '');
                      }}
                    >
                      {editing?.id === contact.id && editing.field === 'dateRappel' ? (
                        <input
                          type="date"
                          className="h-7 px-2 text-xs border rounded w-full"
                          value={editing.value}
                          autoFocus
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => void commitEdit()}
                          onKeyDown={onKeyDown}
                          onClick={(event) => event.stopPropagation()}
                        />
                      ) : (
                        contact.reminder?.date || ''
                      )}
                    </TableCell>
                    <TableCell
                      className="px-2 py-1.5 text-xs text-center whitespace-nowrap"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEdit(contact.id, 'heureRappel', contact.reminder?.time ?? '');
                      }}
                    >
                      {editing?.id === contact.id && editing.field === 'heureRappel' ? (
                        <input
                          type="time"
                          className="h-7 px-2 text-xs border rounded w-full"
                          value={editing.value}
                          autoFocus
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => void commitEdit()}
                          onKeyDown={onKeyDown}
                          onClick={(event) => event.stopPropagation()}
                        />
                      ) : (
                        contact.reminder?.time || ''
                      )}
                    </TableCell>
                    <TableCell
                      className="px-2 py-1.5 text-xs text-center whitespace-nowrap"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEdit(contact.id, 'dateRDV', contact.rdv?.date ?? '');
                      }}
                    >
                      {editing?.id === contact.id && editing.field === 'dateRDV' ? (
                        <input
                          type="date"
                          className="h-7 px-2 text-xs border rounded w-full"
                          value={editing.value}
                          autoFocus
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => void commitEdit()}
                          onKeyDown={onKeyDown}
                          onClick={(event) => event.stopPropagation()}
                        />
                      ) : (
                        contact.rdv?.date || ''
                      )}
                    </TableCell>
                    <TableCell
                      className="px-2 py-1.5 text-xs text-center whitespace-nowrap"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEdit(contact.id, 'heureRDV', contact.rdv?.time ?? '');
                      }}
                    >
                      {editing?.id === contact.id && editing.field === 'heureRDV' ? (
                        <input
                          type="time"
                          className="h-7 px-2 text-xs border rounded w-full"
                          value={editing.value}
                          autoFocus
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => void commitEdit()}
                          onKeyDown={onKeyDown}
                          onClick={(event) => event.stopPropagation()}
                        />
                      ) : (
                        contact.rdv?.time || ''
                      )}
                    </TableCell>
                    <TableCell
                      className="px-2 py-1.5 text-xs text-center whitespace-nowrap"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEdit(contact.id, 'dateAppel', contact.lastCall?.date ?? '');
                      }}
                    >
                      {editing?.id === contact.id && editing.field === 'dateAppel' ? (
                        <input
                          type="date"
                          className="h-7 px-2 text-xs border rounded w-full"
                          value={editing.value}
                          autoFocus
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => void commitEdit()}
                          onKeyDown={onKeyDown}
                          onClick={(event) => event.stopPropagation()}
                        />
                      ) : (
                        contact.lastCall?.date || ''
                      )}
                    </TableCell>
                    <TableCell
                      className="px-2 py-1.5 text-xs text-center whitespace-nowrap"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEdit(contact.id, 'heureAppel', contact.lastCall?.time ?? '');
                      }}
                    >
                      {editing?.id === contact.id && editing.field === 'heureAppel' ? (
                        <input
                          type="time"
                          className="h-7 px-2 text-xs border rounded w-full"
                          value={editing.value}
                          autoFocus
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => void commitEdit()}
                          onKeyDown={onKeyDown}
                          onClick={(event) => event.stopPropagation()}
                        />
                      ) : (
                        contact.lastCall?.time || ''
                      )}
                    </TableCell>
                    <TableCell
                      className="px-2 py-1.5 text-xs text-center whitespace-nowrap"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEdit(contact.id, 'dureeAppel', contact.lastCall?.duration ?? '');
                      }}
                    >
                      {editing?.id === contact.id && editing.field === 'dureeAppel' ? (
                        <input
                          className="h-7 px-2 text-xs border rounded w-full"
                          value={editing.value}
                          autoFocus
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => void commitEdit()}
                          onKeyDown={onKeyDown}
                          onClick={(event) => event.stopPropagation()}
                        />
                      ) : (
                        contact.lastCall?.duration || ''
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
