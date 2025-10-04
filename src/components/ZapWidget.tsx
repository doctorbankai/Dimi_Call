import React from 'react'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

interface ZapWidgetProps {
  value: string
  onChange: (newValue: string) => void
  quickComments: string[]
  rows?: number
}

export const ZapWidget: React.FC<ZapWidgetProps> = ({
  value,
  onChange,
  quickComments,
  rows = 4,
}) => {
  const handleQuickCommentSelect = (comment: string) => {
    const newValue = value ? `${value} ${comment}` : comment
    onChange(newValue)
  }

  return (
    <div className="flex items-start gap-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="flex-1"
      />
      <Select onValueChange={handleQuickCommentSelect}>
        <SelectTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 mt-1 hover:bg-primary/10"
            title="Ajouter un commentaire rapide"
          >
            <Zap className="h-4 w-4" />
          </Button>
        </SelectTrigger>
        <SelectContent>
          {quickComments.map((comment) => (
            <SelectItem key={comment} value={comment}>
              {comment}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
