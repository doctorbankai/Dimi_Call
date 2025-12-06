import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

interface ZapWidgetProps {
  value: string
  onChange: (newValue: string) => void
  quickComments: string[]
  rows?: number
}

export const ZapWidget: React.FC<ZapWidgetProps> = ({
  value,
  onChange,
  quickComments,
  rows = 4,
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const triggerIndexRef = useRef<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const filteredComments = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return quickComments
    return quickComments.filter((c) => c.toLowerCase().includes(q))
  }, [quickComments, query])

  const insertComment = (comment: string) => {
    const textarea = textareaRef.current
    const insertionPoint = triggerIndexRef.current ?? value.length
    const before = value.slice(0, insertionPoint)
    const after = value.slice(insertionPoint)
    const needsSpaceBefore = before && !before.endsWith(' ')
    const spacer = needsSpaceBefore ? ' ' : ''
    const newValue = `${before}${spacer}${comment}${after ? ' ' : ''}`.trimEnd()
    onChange(newValue)
    setOpen(false)
    setQuery("")
    triggerIndexRef.current = null
    // Replace text selection to after inserted comment
    requestAnimationFrame(() => {
      if (textarea) {
        const pos = `${before}${spacer}${comment}`.length
        textarea.focus()
        textarea.setSelectionRange(pos, pos)
      }
    })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setQuery("")
        triggerIndexRef.current = null
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative flex items-start gap-2" ref={containerRef}>
      <Textarea
        ref={textareaRef}
        value={value}
        placeholder="Tape “/” pour insérer un message rapide"
        onChange={(e) => {
          const next = e.target.value
          onChange(next)
          const caret = e.target.selectionStart ?? next.length
          const charBefore = next.charAt(caret - 1)
          if (charBefore === "/" && !open) {
            triggerIndexRef.current = caret - 1
            setOpen(true)
            setQuery("")
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "/" && !e.shiftKey && !open) {
            e.preventDefault()
            triggerIndexRef.current = e.currentTarget.selectionStart
            setOpen(true)
            setQuery("")
            return
          }
          if (e.key === "Escape") {
            setOpen(false)
            setQuery("")
            triggerIndexRef.current = null
          }
        }}
        rows={rows}
        className="flex-1"
      />
      {open && (
        <div className="absolute left-0 top-[calc(100%+0.4rem)] z-30 w-full max-w-sm rounded-md border bg-popover text-popover-foreground shadow-md">
          <Command>
            <CommandInput
              autoFocus
              placeholder="Choisir un message…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>Aucun message</CommandEmpty>
              <CommandGroup>
                {filteredComments.map((comment) => (
                  <CommandItem
                    key={comment}
                    value={comment}
                    onSelect={() => insertComment(comment)}
                    className="cursor-pointer"
                  >
                    {comment}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
