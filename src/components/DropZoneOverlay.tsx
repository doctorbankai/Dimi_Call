import React from 'react'
import { Upload } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DropZoneOverlayProps {
  isVisible: boolean
  isDragActive: boolean
}

export const DropZoneOverlay: React.FC<DropZoneOverlayProps> = ({
  isVisible,
  isDragActive,
}) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
      <Card
        className={cn(
          "border-2 border-dashed p-12 transition-all duration-200 ease-in-out",
          isDragActive 
            ? "border-primary bg-primary/10 scale-105" 
            : "border-muted-foreground/25 scale-100"
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <Upload 
            className={cn(
              "h-12 w-12 transition-colors duration-200",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )} 
          />
          <div className="text-center">
            <p className="text-lg font-medium">
              {isDragActive ? "Déposez le fichier ici" : "Glissez un fichier pour l'importer"}
            </p>
            <p className="text-sm text-muted-foreground">
              Formats acceptés: .csv, .tsv, .xlsx, .xls
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
