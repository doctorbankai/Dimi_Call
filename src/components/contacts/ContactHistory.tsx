import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History } from 'lucide-react'

interface ContactHistoryItem {
  id: number
  appliedAt?: string | null
  displayDate: string
  status: string
  previousStatus?: string
  type: 'appel' | 'rappel' | 'rdv' | 'statut'
  meta: Array<{ label: string; value: string }>
  notes?: string
}

interface ContactHistoryProps {
  history: ContactHistoryItem[]
}

export const ContactHistory: React.FC<ContactHistoryProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-muted-foreground">
        <div className="rounded-full border bg-background p-4 shadow-sm mb-4">
          <History className="h-12 w-12 opacity-50" />
        </div>
        <p className="text-lg font-medium">Aucun historique enregistré</p>
        <p className="text-sm mt-2">Les interactions avec ce contact apparaîtront ici</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
        {history.map(item => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium">{item.displayDate}</span>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {item.status}
              </Badge>
            </div>

            {item.previousStatus && (
              <p className="text-xs text-muted-foreground mt-2">
                Depuis {item.previousStatus} ({item.type})
              </p>
            )}

            {item.notes && (
              <p className="text-sm mt-2 text-foreground">{item.notes}</p>
            )}

            {item.meta.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 mt-3">
                {item.meta.map((meta, idx) => (
                  <div key={idx} className="text-xs">
                    <span className="font-medium text-foreground">{meta.label}:</span>{' '}
                    <span className="text-muted-foreground">{meta.value}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
    </div>
  )
}
