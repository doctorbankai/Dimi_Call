import { create } from 'zustand';
import { Contact } from '../../types';

interface SortConfig { key: keyof Contact | null; direction: 'asc' | 'desc' | null }

interface TableState {
  selectedContactId: string | null;
  sort: SortConfig;
  visibleColumns: Record<string, boolean>;
  setSelected: (id: string | null) => void;
  setSort: (sort: SortConfig) => void;
  setVisibleColumns: (vc: Record<string, boolean>) => void;
}

export const useTableStore = create<TableState>((set) => ({
  selectedContactId: null,
  sort: { key: null, direction: null },
  visibleColumns: {},
  setSelected: (id) => set({ selectedContactId: id }),
  setSort: (sort) => set({ sort }),
  setVisibleColumns: (vc) => set({ visibleColumns: vc }),
}));
