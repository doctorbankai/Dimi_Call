# Amélioration : Affichage des noms et prénoms dans les détails

## ✨ Nouvelle fonctionnalité

Lors de la vérification des numéros avec Supabase, le dialogue "Détails des numéros détectés" affiche maintenant le **prénom et nom** associés à chaque numéro.

## 🎯 Avant / Après

### Avant
```
+33 6 95 90 58 12                    [Liste noire]
Lignes concernées : Ligne 1, Ligne 2...
```

### Après
```
+33 6 95 90 58 12                    [Liste noire]
Trg Kacz
Lignes concernées : Ligne 1, Ligne 2...
```

## 🔧 Modifications techniques

### 1. Type de données étendu

**Fichier :** `src/components/ImportMappingDialog.tsx`

```typescript
// Avant
details: { phone: string; source: 'shared' | 'blacklist'; rows: number[] }[]

// Après
details: { 
  phone: string; 
  source: 'shared' | 'blacklist'; 
  rows: number[];
  prenom?: string;
  nom?: string;
}[]
```

### 2. Requêtes Supabase enrichies

```typescript
// Avant
client.from('shared_phone_numbers').select('normalized_phone')

// Après
client.from('shared_phone_numbers').select('normalized_phone, prenom, nom')
```

### 3. Affichage dans le dialogue

```tsx
<div className="flex flex-col gap-0.5">
  <span className="font-medium">{item.formattedPhone}</span>
  {(item.prenom || item.nom) && (
    <span className="text-[11px] text-muted-foreground">
      {[item.prenom, item.nom].filter(Boolean).join(' ')}
    </span>
  )}
</div>
```

## 📊 Données affichées

Pour chaque numéro détecté, le dialogue affiche maintenant :

1. **Numéro formaté** : `+33 6 95 90 58 12`
2. **Prénom et nom** : `Trg Kacz` (si disponibles)
3. **Badge de source** : `Liste noire` ou `Déjà partagé`
4. **Lignes concernées** : `Ligne 1, Ligne 2, ...`

## 🧪 Test

1. Importer le fichier `test-import-phone-formats.csv`
2. Cliquer sur "Voir les détails" dans l'alerte Supabase
3. Vérifier que le nom "Trg Kacz" apparaît sous le numéro `+33 6 95 90 58 12`

## 📝 Exemples de données Supabase

### Liste noire
| normalized_phone | prenom | nom |
|------------------|--------|-----|
| +33695905812 | Trg | Kacz |
| +33756926426 | Guillaume Fricker - Avocat | NULL |
| +33659359144 | Kévin | Huron |

### Numéros partagés
| normalized_phone | prenom | nom |
|------------------|--------|-----|
| +33669034450 | Chloé | BEAL |
| +33671926970 | Gaëtan | BAUDUSSEAU |
| +33631265816 | Cyprien | Clement |

## 🎨 Design

- Le prénom et nom sont affichés en **gris clair** (`text-muted-foreground`)
- Taille de police réduite (`text-[11px]`)
- Alignement vertical avec le numéro
- Gestion automatique des cas où le nom ou prénom est manquant

## ✅ Avantages

1. **Identification rapide** : Savoir immédiatement qui est associé au numéro
2. **Contexte enrichi** : Comprendre pourquoi un numéro est en liste noire
3. **Décision éclairée** : Choisir de supprimer ou garder les lignes en connaissance de cause

---

**Date** : 2025-01-20  
**Statut** : ✅ Implémenté et testé  
**Impact** : Amélioration UX - Information contextuelle
