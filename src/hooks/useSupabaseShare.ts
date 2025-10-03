import { useEffect, useState } from 'react'
import { supabaseShareManager, type SupabaseShareState } from '@/services/supabaseShareService'

export const useSupabaseShare = () => {
  const [state, setState] = useState<SupabaseShareState>(() => supabaseShareManager.getState())

  useEffect(() => {
    const unsubscribe = supabaseShareManager.subscribe(setState)
    return () => unsubscribe()
  }, [])

  return {
    state,
    setEnabled: supabaseShareManager.setEnabled,
    triggerSync: supabaseShareManager.triggerSync,
    refreshSupabaseStatus: supabaseShareManager.refreshSupabaseStatus,
    downloadLogs: supabaseShareManager.downloadLogs,
  }
}


