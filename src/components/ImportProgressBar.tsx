import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface ImportProgressBarProps {
  progress: number
  message: string
  isVisible: boolean
}

export const ImportProgressBar: React.FC<ImportProgressBarProps> = ({
  progress,
  message,
  isVisible,
}) => {
  const [shouldRender, setShouldRender] = useState(isVisible)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
    } else if (progress === 100) {
      // Masquer après 2 secondes quand l'import est terminé
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      setShouldRender(false)
    }
  }, [isVisible, progress])

  if (!shouldRender) return null

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 p-4 shadow-lg animate-in slide-in-from-bottom-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Import en cours...</span>
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} />
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </Card>
  )
}
