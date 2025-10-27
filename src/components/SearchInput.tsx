import React from 'react'
import { Input } from '@/components/ui/input'
import { Search as SearchIcon, Command } from 'lucide-react'

type SearchInputProps = {
  placeholder?: string
  onFocus?: () => void
  onOpenCommand?: () => void
}

export const SearchInput: React.FC<SearchInputProps> = ({ placeholder = 'Search...', onFocus, onOpenCommand }) => {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="pl-10 pr-16 bg-background/60 h-9"
        onFocus={onFocus}
        onClick={onOpenCommand}
        readOnly
      />
      <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded-sm bg-muted px-1.5 font-mono text-xs font-medium">
        <Command className="size-3" />
        <span>k</span>
      </kbd>
    </div>
  )
}

export default SearchInput
