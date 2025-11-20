import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ContactCard } from './ContactCard'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DirectoryContact {
  id: string
  fullName: string
  prenom: string
  nom: string
  telephone: string
  email?: string
  status: string
  previousStatus?: string
  commentaire?: string
  reminder?: { date?: string; time?: string; label: string }
  rdv?: { date?: string; time?: string; label: string }
  lastCall?: { date?: string; time?: string; duration?: string; label: string }
  history: any[]
  events: any[]
  lastUpdatedAt?: string | null
  lastUpdatedLabel?: string
  totalEvents: number
  numeroLigne: number
}

interface ContactCardsGridProps {
  contacts: DirectoryContact[]
  selectedId: string | null
  onSelectContact: (id: string) => void
}

export const ContactCardsGrid: React.FC<ContactCardsGridProps> = ({
  contacts,
  selectedId,
  onSelectContact,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const loaderRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(40)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const displayedContacts = useMemo(
    () => contacts.slice(0, Math.min(visibleCount, contacts.length)),
    [contacts, visibleCount]
  )

  // Scroll vers l'élément sélectionné
  useEffect(() => {
    if (!selectedId) return

    const timeoutId = setTimeout(() => {
      const node = scrollRef.current?.querySelector<HTMLDivElement>(`[data-contact-id="${selectedId}"]`)

      if (!node) {
        const contactIndex = contacts.findIndex(c => c.id === selectedId)
        if (contactIndex !== -1 && contactIndex >= visibleCount) {
          setVisibleCount(contactIndex + 20)
          setTimeout(() => {
            const retryNode = scrollRef.current?.querySelector<HTMLDivElement>(`[data-contact-id="${selectedId}"]`)
            retryNode?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 200)
        }
        return
      }

      const container = scrollRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const nodeRect = node.getBoundingClientRect()

      const isVisible =
        nodeRect.top >= containerRect.top &&
        nodeRect.bottom <= containerRect.bottom

      if (!isVisible) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [selectedId, visibleCount, contacts])

  // Lazy loading au scroll
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollHeight - scrollTop - clientHeight < 500 && visibleCount < contacts.length) {
        setVisibleCount(prev => Math.min(prev + 40, contacts.length))
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [visibleCount, contacts.length])

  useEffect(() => {
    const sentinel = loaderRef.current
    const container = scrollRef.current
    if (!sentinel || !container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && visibleCount < contacts.length) {
            setIsLoadingMore(true)
            setTimeout(() => {
              setVisibleCount((prev) => Math.min(prev + 40, contacts.length))
              setIsLoadingMore(false)
            }, 120)
          }
        })
      },
      { root: container, rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [visibleCount, contacts.length])

  return (
    <ScrollArea className="h-full w-full" ref={scrollRef}>
      <div className="grid gap-4 p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {displayedContacts.map((contact) => (
        <div key={contact.id} data-contact-id={contact.id}>
          <ContactCard
            contact={contact}
            isSelected={contact.id === selectedId}
            onClick={() => onSelectContact(contact.id)}
          />
        </div>
      ))}
    </div>

      <div ref={loaderRef} className="flex justify-center p-4">
        {contacts.length > visibleCount && (
          <div className="text-xs text-muted-foreground">
            {isLoadingMore ? 'Chargement...' : 'Défilez pour charger davantage'}
          </div>
        )}
      </div>

      {contacts.length === 0 && (
        <div className="flex items-center justify-center h-full text-center text-muted-foreground p-8">
          <div>
            <p className="text-lg font-medium">Aucun contact trouvé</p>
            <p className="text-sm mt-2">Essayez de modifier vos filtres de recherche</p>
          </div>
        </div>
      )}
    </ScrollArea>
  )
}
