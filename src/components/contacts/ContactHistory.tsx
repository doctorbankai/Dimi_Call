import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, Calendar, Bell, Phone, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const statusKey = (value?: string | null): string => {
  if (!value) return ''
  return String(value)
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

const getStatusBadgeClasses = (status: string): string => {
  const key = statusKey(status)
  if (key.startsWith('nondefin')) return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700'
  if (key.includes('mauvais')) return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800'
  if (key.includes('repondeur')) return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800'
  if (key.includes('rappeler')) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800'
  if (key.includes('pasinter')) return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800'
  if (key.includes('argument')) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800'
  if (key === 'do' || key === 'r0') return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800'
  if (key.includes('listenoi')) return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800'
  if (key.includes('prematur')) return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800'
  if (key === 'a0') return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800'
  return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700'
}

const getEventIcon = (type: ContactHistoryItem['type']) => {
  switch (type) {
    case 'rdv':
      return { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' }
    case 'rappel':
      return { icon: Bell, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' }
    case 'appel':
      return { icon: Phone, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' }
    default:
      return { icon: History, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' }
  }
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
      {history.map(item => {
        const { icon: Icon, color, bg } = getEventIcon(item.type)

        return (
          <Card key={item.id} className="p-4 overflow-hidden relative">
            {/* Vertical accent line */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-1", color.replace('text-', 'bg-'))} />

            <div className="flex items-start justify-between gap-4 pl-2">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-full shrink-0", bg)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.displayDate}</span>
                  <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn('text-xs shrink-0 px-2.5 py-1 border', getStatusBadgeClasses(item.status))}
              >
                {item.status}
              </Badge>
            </div>

            <div className="pl-14 mt-3 space-y-3">
              {item.previousStatus && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.previousStatus}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-medium text-foreground">{item.status}</span>
                </div>
              )}

              {item.notes && (
                <div className="bg-muted/50 p-3 rounded-md text-sm text-foreground italic border border-muted">
                  "{item.notes}"
                </div>
              )}

              {item.meta.length > 0 && (
                <div className="grid gap-2 mt-2">
                  {item.meta.map((meta, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-muted-foreground w-20 shrink-0">{meta.label}:</span>
                      <span className="text-foreground font-medium">{meta.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
