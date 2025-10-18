# DateTimePicker Component

## Description

Composant shadcn personnalisé qui combine un sélecteur de date (`Calendar`) et un sélecteur d'heure (`ScrollArea`) dans une interface unifiée.

## Composants shadcn utilisés

- ✅ `Calendar` - Sélecteur de date officiel shadcn
- ✅ `ScrollArea` - Listes scrollables pour heures/minutes
- ✅ `Popover` - Conteneur dropdown
- ✅ `Button` - Boutons de sélection

## Fonctionnalités

- 📅 Sélection de date avec calendrier shadcn
- ⏰ Sélection d'heure (heures: 00-23, minutes: 00-59)
- 🎨 Design cohérent avec le système shadcn
- ♿ Accessible (navigation clavier, ARIA)
- 🌍 Localisé en français (date-fns)
- 🎯 Z-index configurable pour les modales
- 📱 Responsive

## Props

```typescript
interface DateTimePickerProps {
  value?: Date                    // Date/heure sélectionnée
  onChange?: (date: Date | undefined) => void  // Callback de changement
  placeholder?: string            // Texte placeholder (défaut: "Sélectionner date et heure")
  disabled?: boolean              // Désactiver le composant
  className?: string              // Classes CSS additionnelles
  zIndex?: number                 // Z-index du popover (défaut: 20100)
  container?: HTMLElement | null  // Conteneur pour le portal
}
```

## Utilisation

### Exemple basique

```tsx
import { DateTimePicker } from '@/components/ui/date-time-picker'

function MyComponent() {
  const [date, setDate] = useState<Date>()

  return (
    <DateTimePicker
      value={date}
      onChange={setDate}
      placeholder="Choisir une date et heure"
    />
  )
}
```

### Exemple avec valeur initiale

```tsx
import { DateTimePicker } from '@/components/ui/date-time-picker'

function MyComponent() {
  const [date, setDate] = useState<Date>(new Date())

  return (
    <DateTimePicker
      value={date}
      onChange={setDate}
    />
  )
}
```

### Exemple dans une modale (z-index élevé)

```tsx
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Dialog, DialogContent } from '@/components/ui/dialog'

function MyDialog() {
  const [date, setDate] = useState<Date>()

  return (
    <Dialog>
      <DialogContent>
        <DateTimePicker
          value={date}
          onChange={setDate}
          zIndex={20100}  // Au-dessus du dialogue (z-index: 20000)
        />
      </DialogContent>
    </Dialog>
  )
}
```

### Exemple avec container personnalisé

```tsx
import { DateTimePicker } from '@/components/ui/date-time-picker'

function MyComponent() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [date, setDate] = useState<Date>()

  return (
    <div ref={containerRef}>
      <DateTimePicker
        value={date}
        onChange={setDate}
        container={containerRef.current}
      />
    </div>
  )
}
```

## Format d'affichage

- **Bouton:** `PPP 'à' HH:mm` (ex: "18 octobre 2025 à 14:30")
- **Heure actuelle:** `HH:mm` (ex: "14:30")
- **Locale:** Français (date-fns/locale/fr)

## Comportement

1. **Sélection de date:** Cliquer sur une date dans le calendrier met à jour la date tout en conservant l'heure
2. **Sélection d'heure:** Cliquer sur une heure/minute met à jour l'heure tout en conservant la date
3. **Valeur initiale:** Si aucune date n'est sélectionnée, la sélection d'une heure crée une nouvelle date avec la date du jour
4. **Highlight:** L'heure/minute actuelle est mise en surbrillance avec le variant "default"

## Accessibilité

- Navigation au clavier dans le calendrier
- Scroll dans les listes d'heures/minutes
- Bouton avec état disabled
- Labels visuels clairs ("Heures", "Minutes")

## Styling

Le composant utilise les classes Tailwind et les variants shadcn :
- `variant="outline"` pour le bouton trigger
- `variant="default"` pour l'heure/minute sélectionnée
- `variant="ghost"` pour les autres options
- Classes responsive et spacing cohérents

## Dépendances

```json
{
  "date-fns": "^3.x",
  "lucide-react": "^0.x",
  "react": "^18.x"
}
```

## Fichier source

`src/components/ui/date-time-picker.tsx`
