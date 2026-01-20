import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export type CallSystemMode = 'standard' | 'max'

const STORAGE_KEY = 'dimicall-call-system-mode'

export const useCallSystem = () => {
    const [callMode, setCallMode] = useState<CallSystemMode>('standard')
    const [isInitialized, setIsInitialized] = useState(false)

    // Initialisation au chargement
    useEffect(() => {
        const initMode = async () => {
            try {
                // 1. Tenter de récupérer la préférence utilisateur
                const savedMode = localStorage.getItem(STORAGE_KEY) as CallSystemMode | null

                if (savedMode && (savedMode === 'standard' || savedMode === 'max')) {
                    setCallMode(savedMode)
                } else {
                    // 2. Sinon, déterminer le défaut selon la plateforme
                    // 'max' pour macOS, 'standard' pour les autres
                    // Note : on vérifie que window.electronAPI existe et a platform
                    const platform = window.electronAPI?.platform
                    if (platform === 'darwin') {
                        setCallMode('max')
                    } else {
                        setCallMode('standard')
                    }
                }
            } catch (error) {
                console.error('Erreur lors de l\'initialisation du mode d\'appel:', error)
            } finally {
                setIsInitialized(true)
            }
        }

        initMode()
    }, [])

    // Persistance lors du changement
    const setMode = (mode: CallSystemMode) => {
        setCallMode(mode)
        try {
            localStorage.setItem(STORAGE_KEY, mode)
        } catch (error) {
            console.error('Impossible de sauvegarder le mode d\'appel:', error)
        }
    }

    // Effectuer un appel selon le mode actuel
    // Retourne true si l'appel a été géré par le système (Mode Max)
    // Retourne false si l'appel doit être géré par l'app (Mode Standard)
    const performCall = async (phoneNumber: string): Promise<boolean> => {
        if (callMode === 'standard') {
            return false
        }

        try {
            if (window.electronAPI?.system?.callTel) {
                const result = await window.electronAPI.system.callTel(phoneNumber)
                if (!result.success) {
                    console.error('Erreur lors de l\'appel système:', result.error)
                    toast.error("Impossible de lancer l'appel système", {
                        description: result.error || "Une erreur inconnue est survenue."
                    })
                }
                return true
            } else {
                console.warn('API callTel non disponible, fallback standard')
                return false
            }
        } catch (error) {
            console.error('Exception lors de l\'appel système:', error)
            toast.error("Erreur critique lors de l'appel", {
                description: String(error)
            })
            return true
        }
    }

    return {
        callMode,
        setMode,
        performCall,
        isInitialized,
        isMac: window.electronAPI?.platform === 'darwin'
    }
}
