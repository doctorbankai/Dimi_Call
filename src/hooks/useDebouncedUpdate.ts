import { useMemo, useEffect, useCallback } from 'react';
import { Contact } from '../types';

interface DebouncedUpdateOptions {
  onUpdateContact: (contact: Partial<Contact> & { id: string }) => void;
  delays?: {
    comment?: number;
    date?: number;
    text?: number;
  };
}

/**
 * Hook pour debouncer les mises à jour de contacts
 * Réduit la fréquence des sauvegardes pendant la frappe
 */
export const useDebouncedUpdate = ({
  onUpdateContact,
  delays = {}
}: DebouncedUpdateOptions) => {
  const {
    comment: commentDelay = 300,
    date: dateDelay = 500,
    text: textDelay = 1000
  } = delays;

  // Debounce function implementation
  const debounce = <T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
    let timeoutId: NodeJS.Timeout | null = null;

    const debouncedFn = (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, wait);
    };

    debouncedFn.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    return debouncedFn;
  };

  // Debounced update functions
  const debouncedCommentUpdate = useMemo(
    () =>
      debounce((contactId: string, value: string) => {
        try {
          onUpdateContact({ id: contactId, commentaire: value });
        } catch (error) {
          console.error('[useDebouncedUpdate] Comment update error:', error);
        }
      }, commentDelay),
    [onUpdateContact, commentDelay]
  );

  const debouncedDateUpdate = useMemo(
    () =>
      debounce((contactId: string, field: keyof Contact, value: string) => {
        try {
          onUpdateContact({ id: contactId, [field]: value });
        } catch (error) {
          console.error('[useDebouncedUpdate] Date update error:', error);
        }
      }, dateDelay),
    [onUpdateContact, dateDelay]
  );

  const debouncedTextUpdate = useMemo(
    () =>
      debounce((contactId: string, field: keyof Contact, value: string) => {
        try {
          onUpdateContact({ id: contactId, [field]: value });
        } catch (error) {
          console.error('[useDebouncedUpdate] Text update error:', error);
        }
      }, textDelay),
    [onUpdateContact, textDelay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedCommentUpdate.cancel();
      debouncedDateUpdate.cancel();
      debouncedTextUpdate.cancel();
    };
  }, [debouncedCommentUpdate, debouncedDateUpdate, debouncedTextUpdate]);

  return {
    debouncedCommentUpdate,
    debouncedDateUpdate,
    debouncedTextUpdate
  };
};
