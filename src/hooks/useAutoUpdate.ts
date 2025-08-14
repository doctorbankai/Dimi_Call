import { useState, useEffect, useCallback } from 'react'
import { UpdateInfo, UpdateState, UseAutoUpdateResult, BetaPreferences } from '../types/update'
import { BetaPreferencesService } from '../services/betaPreferencesService'
import { ManualUpdateInfo } from '../services/PlatformUpdateService'

export const useAutoUpdate = (): UseAutoUpdateResult => {
  const [updateState, setUpdateState] = useState<UpdateState>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    error: null,
    progress: 0,
    updateInfo: null,
    enabled: true // Default to enabled, will be updated from main process
  })

  const [isUpdateEnabled, setIsUpdateEnabled] = useState<boolean>(true)
  const [manualUpdateInfo, setManualUpdateInfo] = useState<ManualUpdateInfo | null>(null)

  const [betaPreferences, setBetaPreferencesState] = useState<BetaPreferences>(() => 
    BetaPreferencesService.getBetaPreferences()
  )

  // Initialiser l'état depuis le main process
  useEffect(() => {
    const initializeUpdateState = async () => {
      if (!window.electronAPI?.getUpdateStatus) {
        console.warn('[useAutoUpdate] electronAPI.getUpdateStatus not available, using defaults')
        setIsUpdateEnabled(true) // Default to enabled in non-Electron environments
        return
      }

      try {
        const status = await window.electronAPI.getUpdateStatus()
        const enabled = status.updateEnabled !== false // Default to true if not specified
        
        setIsUpdateEnabled(enabled)
        setManualUpdateInfo(status.manualUpdateInfo || null)
        
        setUpdateState(prev => ({
          ...prev,
          available: enabled ? status.updateAvailable : false,
          downloaded: enabled ? status.updateDownloaded : false,
          updateInfo: enabled ? status.updateInfo : null,
          enabled
        }))
        
        console.log(`[useAutoUpdate] Updates enabled: ${enabled}`)
        if (!enabled && status.manualUpdateInfo) {
          console.log(`[useAutoUpdate] Manual update info:`, status.manualUpdateInfo)
        }
      } catch (error) {
        console.error('[useAutoUpdate] Error initializing update state:', error)
        
        // Set safe defaults on error
        setIsUpdateEnabled(false) // Disable updates on error for safety
        setUpdateState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Initialization error',
          enabled: false
        }))
      }
    }

    initializeUpdateState()
  }, [])



  // Configurer les listeners pour les événements de mise à jour (only if updates are enabled)
  useEffect(() => {
    if (!window.electronAPI) {
      console.warn('[useAutoUpdate] electronAPI not available, skipping event listeners setup')
      return
    }
    
    if (!isUpdateEnabled) {
      console.log('[useAutoUpdate] Skipping event listeners setup (updates disabled for this platform)')
      return
    }

    try {

    const handleUpdateChecking = () => {
      setUpdateState(prev => ({
        ...prev,
        checking: true,
        error: null
      }))
    }

    const handleUpdateAvailable = (updateInfo: UpdateInfo) => {
      setUpdateState(prev => ({
        ...prev,
        checking: false,
        available: true,
        downloading: true,
        updateInfo
      }))
    }

    const handleUpdateNotAvailable = () => {
      setUpdateState(prev => ({
        ...prev,
        checking: false,
        available: false,
        downloading: false,
        downloaded: false,
        updateInfo: null
      }))
    }

    const handleUpdateError = (error: string) => {
      setUpdateState(prev => ({
        ...prev,
        checking: false,
        downloading: false,
        error
      }))
    }

    const handleDownloadProgress = (progress: { percent: number }) => {
      setUpdateState(prev => ({
        ...prev,
        progress: Math.round(progress.percent)
      }))
    }

    const handleUpdateDownloaded = (updateInfo: UpdateInfo) => {
      setUpdateState(prev => ({
        ...prev,
        downloading: false,
        downloaded: true,
        progress: 100,
        updateInfo
      }))
    }

    // Enregistrer les listeners
    window.electronAPI.onUpdateChecking(handleUpdateChecking)
    window.electronAPI.onUpdateAvailable(handleUpdateAvailable)
    window.electronAPI.onUpdateNotAvailable(handleUpdateNotAvailable)
    window.electronAPI.onUpdateError(handleUpdateError)
    window.electronAPI.onUpdateDownloadProgress(handleDownloadProgress)
    window.electronAPI.onUpdateDownloaded(handleUpdateDownloaded)

      // Note: Les listeners electron ne sont pas nettoyés ici car electron-preload
      // ne fournit pas de méthode pour les supprimer facilement
      // et ils seront nettoyés automatiquement lors du rechargement de la page
    } catch (error) {
      console.error('[useAutoUpdate] Error setting up event listeners:', error)
      setUpdateState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Event listener setup error'
      }))
    }
  }, [isUpdateEnabled])

  const checkForUpdates = useCallback(async () => {
    if (!isUpdateEnabled) {
      console.warn('[useAutoUpdate] Update check blocked (updates disabled for this platform)')
      return
    }
    
    if (!window.electronAPI?.checkForUpdates) {
      console.warn('API de mise à jour non disponible')
      return
    }

    try {
      // Passer les préférences bêta à l'API Electron
      const result = await window.electronAPI.checkForUpdates(betaPreferences.enabled)
      if (result.status === 'error') {
        setUpdateState(prev => ({ ...prev, error: result.message }))
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des mises à jour:', error)
      setUpdateState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }))
    }
  }, [betaPreferences.enabled, isUpdateEnabled])

  const installUpdate = useCallback(async () => {
    if (!isUpdateEnabled) {
      console.warn('[useAutoUpdate] Update installation blocked (updates disabled for this platform)')
      return
    }
    
    if (!window.electronAPI?.installUpdate) {
      console.warn('API d\'installation de mise à jour non disponible')
      return
    }

    if (!updateState.downloaded) {
      console.warn('Aucune mise à jour téléchargée disponible')
      return
    }

    try {
      const result = await window.electronAPI.installUpdate()
      if (!result.success) {
        setUpdateState(prev => ({ 
          ...prev, 
          error: result.message || 'Erreur lors de l\'installation' 
        }))
      }
    } catch (error) {
      console.error('Erreur lors de l\'installation de la mise à jour:', error)
      setUpdateState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }))
    }
  }, [updateState.downloaded, isUpdateEnabled])

  const setBetaPreferences = useCallback((preferences: BetaPreferences) => {
    setBetaPreferencesState(preferences)
    BetaPreferencesService.setBetaPreferences(preferences)
    
    // Nettoyer les données obsolètes lors de la mise à jour des préférences
    BetaPreferencesService.cleanupObsoleteData()
  }, [betaPreferences])

  const revertToStable = useCallback(async () => {
    if (!window.electronAPI?.revertToStable) {
      console.warn('API de retour à la version stable non disponible')
      return
    }

    try {
      // Désactiver les préférences bêta
      const newPreferences: BetaPreferences = {
        ...betaPreferences,
        enabled: false,
        lastModified: Date.now(),
      }
      setBetaPreferences(newPreferences)
      
      // Appeler l'API Electron pour revenir à la version stable
      const result = await window.electronAPI.revertToStable()
      if (!result.success) {
        setUpdateState(prev => ({ 
          ...prev, 
          error: result.message || 'Erreur lors du retour à la version stable' 
        }))
      }
    } catch (error) {
      console.error('Erreur lors du retour à la version stable:', error)
      setUpdateState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }))
    }
  }, [betaPreferences, setBetaPreferences])

  return {
    updateState,
    checkForUpdates,
    installUpdate,
    betaPreferences,
    setBetaPreferences,
    revertToStable,
    isUpdateEnabled,
    manualUpdateInfo
  }
} 