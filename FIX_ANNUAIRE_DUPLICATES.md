# 🔧 Correction des doublons dans l'Annuaire

## ❌ Problème identifié

L'annuaire affichait des **doublons de contacts** :
- Guillaume Fricker apparaissait 2 fois
- Louis Franchois apparaissait 2 fois  
- M. NICOLAS CORNET apparaissait 2 fois
- Marc DURANCE apparaissait 2 fois

### Cause du problème

Le regroupement des événements se faisait par `contact_id`, qui peut être différent pour le même numéro de téléphone. Résultat : plusieurs entrées pour la même personne.

```typescript
// ❌ AVANT - Regroupement par contact_id
const grouped = new Map<string, StatusEventRecord[]>();
for (const event of events) {
  const contactId = safeTrim(event.contact_id);  // Peut varier !
  if (!grouped.has(contactId)) {
    grouped.set(contactId, []);
  }
  grouped.get(contactId)!.push(event);
}
```

## ✅ Solution implémentée

### 1. Regroupement par numéro de téléphone

Le regroupement se fait maintenant par **numéro de téléphone normalisé** :

```typescript
// ✅ APRÈS - Regroupement par téléphone
const grouped = new Map<string, StatusEventRecord[]>();

for (const event of events) {
  const telephone = safeTrim(event.telephone);
  if (!telephone) continue;
  
  // Normaliser le numéro (enlever espaces, tirets, points)
  const normalizedPhone = telephone.replace(/[\s\-\.]/g, '');
  
  if (!grouped.has(normalizedPhone)) {
    grouped.set(normalizedPhone, []);
  }
  grouped.get(normalizedPhone)!.push(event);
}
```

### 2. ID de contact basé sur le téléphone

L'ID du contact est maintenant généré à partir du numéro de téléphone :

```typescript
// ✅ ID stable basé sur le téléphone
const normalizedPhone = telephone.replace(/[\s\-\.]/g, '');
const contactId = normalizedPhone 
  ? `contact-phone-${normalizedPhone}` 
  : `contact-${latest.id ?? Math.random().toString(36).slice(2)}`;
```

## 🎯 Résultat

### Avant
```
Guillaume Fricker - +33 7 56 92 64 26 (Répondeur)
Guillaume Fricker - +33 7 56 92 64 26 (Liste Noire)
Louis Franchois - +33 6 01 13 35 82 (Non Défini)
Louis Franchois - +33 6 01 13 35 82 (D0)
```

### Après
```
Guillaume Fricker - +33 7 56 92 64 26 (Liste Noire)
  └─ Historique: Répondeur → Liste Noire
Louis Franchois - +33 6 01 13 35 82 (D0)
  └─ Historique: Non Défini → D0
```

## 📊 Avantages

1. **Contacts uniques** : Un seul contact par numéro de téléphone
2. **Historique complet** : Tous les événements d'un même numéro sont regroupés
3. **IDs stables** : Les attachements de fichiers fonctionnent correctement
4. **Normalisation** : Les variations de format de téléphone sont gérées
   - `+33 6 01 13 35 82`
   - `+33601133582`
   - `+33-6-01-13-35-82`
   - Tous regroupés ensemble !

## 🔍 Normalisation des numéros

La fonction de normalisation retire :
- Espaces : ` `
- Tirets : `-`
- Points : `.`

Exemples :
- `+33 6 01 13 35 82` → `+33601133582`
- `06-01-13-35-82` → `0601133582`
- `06.01.13.35.82` → `0601133582`

## 📝 Fichiers modifiés

- `src/components/AnnuairePage.tsx`
  - Fonction `transformEventsToContacts()` : Regroupement par téléphone
  - Fonction `buildDirectoryContact()` : ID basé sur le téléphone

## ✅ Tests à effectuer

1. **Vérifier l'absence de doublons**
   - Ouvrir l'annuaire
   - Vérifier qu'il n'y a qu'une seule entrée par numéro de téléphone

2. **Vérifier l'historique**
   - Cliquer sur un contact
   - Onglet "Historique"
   - Tous les événements du même numéro doivent apparaître

3. **Vérifier les attachements**
   - Les fichiers attachés doivent rester liés au bon contact
   - L'ID stable basé sur le téléphone garantit la cohérence

## 🚀 Impact

- **Moins de confusion** : Un contact = une personne
- **Meilleure traçabilité** : Tout l'historique au même endroit
- **Base de données plus propre** : Pas de doublons visuels
- **Compatibilité** : Les attachements de fichiers fonctionnent correctement

## 📌 Note importante

Si vous aviez déjà attaché des fichiers à des contacts dupliqués, vous devrez peut-être les réattacher après cette correction, car les IDs de contacts ont changé pour être basés sur le numéro de téléphone.

Pour nettoyer les anciens attachements :
```javascript
localStorage.removeItem('dimicall-file-attachments');
```
