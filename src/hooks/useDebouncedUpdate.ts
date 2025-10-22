import { useMemo, useEffect } from 'react'
import { Contact } from '../types'
import { toast } from 'sonner'

// Fonction debounce simple
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }) as T & { cancel: () => void }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debounced
}

interface UseDebouncedUpdateOptions {
  onUpdateContact: (contact: Partial<Contact> & { id: string }) => void
  delays?: {
    comment?: number
    date?: number
    text?: number
  }
}

export function useDebouncedUpdate({ onUpdateContact, delays = {} }: UseDebouncedUpdateOptions) {
  const defaultDelays = {
    comment: delays.comment || 300, // Commentaires - 300ms
    date: delays.date || 500, // Dates/Heures - 500ms
    text: delays.text || 1000, // Texte libre - 1000ms
  }

  // Créer les fonctions debounced
  const debouncedCommentUpdate = useMemo(
    () =>
      debounce((contactId: string, value: string) => {
        try {
          onUpdateContact({ id: contactId, commentaire: value })
        } catch (error) {
          console.error('[useDebouncedUpdate] Comment update error:', error)
          toast.error('Erreur de sauvegarde', {
            description: 'Impossible de sauvegarder le commentaire',
          })
        }
      }, defaultDelays.comment),
    [onUpdateContact, defaultDelays.comment]
  )

  const debouncedDateUpdate = useMemo(
    () =>
      debounce((contactId: string, field: keyof Contact, value: string) => {
        try {
          onUpdateContact({ id: contactId, [field]: value })
        } catch (error) {
          console.error('[useDebouncedUpdate] Date update error:', error)
          toast.error('Erreur de sauvegarde', {
            description: 'Impossible de sauvegarder la date',
          })
        }
      }, defaultDelays.date),
    [onUpdateContact, defaultDelays.date]
  )

  const debouncedTextUpdate = useMemo(
    () =>
      debounce((contactId: string, field: keyof Contact, value: string) => {
        try {
          onUpdateContact({ id: contactId, [field]: value })
        } catch (error) {
          console.error('[useDebouncedUpdate] Text update error:', error)
          toast.error('Erreur de sauvegarde', {
            description: 'Impossible de sauvegarder la modification',
          })
        }
      }, defaultDelays.text),
    [onUpdateContact, defaultDelays.text]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedCommentUpdate.cancel()
      debouncedDateUpdate.cancel()
      debouncedTextUpdate.cancel()
    }
  }, [debouncedCommentUpdate, debouncedDateUpdate, debouncedTextUpdate])

  return {
    debouncedCommentUpdate,
    debouncedDateUpdate,
    debouncedTextUpdate,
  }
}
