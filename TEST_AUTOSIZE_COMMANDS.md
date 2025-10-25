# 🧪 Commandes de Test - Autosize Canvas

## 🎯 Tests Automatisés

### 1. Vérifier TypeScript
```bash
# Vérifier qu'il n'y a pas d'erreurs TypeScript
npm run type-check

# Ou avec tsc directement
npx tsc --noEmit
```

**Résultat attendu :**
```
✅ 0 erreur
⚠️ Warnings OK (variables non utilisées)
```

---

### 2. Tests Existants
```bash
# Tests UI
node scripts/test-table-ui.cjs

# Tests Performance
node scripts/test-table-performance.cjs
```

**Résultat attendu :**
```
✅ Tous les tests passent
✅ Performance < 50ms
✅ FPS > 50
```

---

## 🔍 Tests Manuels

### 1. Test Emails Longs

**Procédure :**
1. Ouvrir l'application
2. Aller dans "Appels" → Mode Table
3. Importer des contacts avec emails longs :
   ```
   louis.franchois@verylongdomainname.com
   marie.dupont@anotherlongdomain.fr
   jean-martin@extremelylongdomainname.com
   ```
4. Vérifier que les emails sont visibles en entier

**Résultat attendu :**
- ✅ Email complet visible (ou presque)
- ✅ Largeur colonne : 300-400px
- ✅ Pas de truncate inutile (`...`)

**Commande pour générer des données de test :**
```javascript
// Dans la console DevTools
const testEmails = [
  'louis.franchois@verylongdomainname.com',
  'marie.dupont@anotherlongdomain.fr',
  'jean-martin@extremelylongdomainname.com',
  'sophie.bernard@yetanotherlongdomain.com',
  'thomas.petit@superlongdomainname.fr'
];

// Copier dans le presse-papier
copy(testEmails.join('\n'));
```

---

### 2. Test Commentaires Longs

**Procédure :**
1. Ouvrir l'application
2. Aller dans "Appels" → Mode Table
3. Ajouter des commentaires longs :
   ```
   "Commentaire très long avec beaucoup de détails sur le contact et ses préférences"
   "Rappeler demain matin à 9h pour discuter du projet en cours et des prochaines étapes"
   "Contact intéressé par nos services, à recontacter la semaine prochaine pour un devis"
   ```
4. Vérifier que les commentaires sont visibles jusqu'à 100 chars

**Résultat attendu :**
- ✅ Commentaire visible jusqu'à 100 chars
- ✅ Largeur colonne : 400-600px
- ✅ Bouton Zap visible

**Commande pour générer des données de test :**
```javascript
// Dans la console DevTools
const testComments = [
  'Commentaire très long avec beaucoup de détails sur le contact et ses préférences',
  'Rappeler demain matin à 9h pour discuter du projet en cours et des prochaines étapes',
  'Contact intéressé par nos services, à recontacter la semaine prochaine pour un devis',
  'Personne très sympathique, à rappeler dans 2 semaines pour faire le point sur sa situation',
  'Demande de documentation envoyée par email, attendre retour avant de recontacter'
];

copy(testComments.join('\n'));
```

---

### 3. Test Liens Longs

**Procédure :**
1. Ouvrir l'application
2. Aller dans "Appels" → Mode Table
3. Ajouter des liens longs :
   ```
   https://example.com/very/long/path/to/resource
   https://www.longdomainname.com/page/subpage/article
   https://another-long-domain.fr/documentation/guide/tutorial
   ```
4. Vérifier que les URLs sont visibles jusqu'à 80 chars

**Résultat attendu :**
- ✅ URL visible jusqu'à 80 chars
- ✅ Largeur colonne : 250-400px
- ✅ Pas de truncate inutile

**Commande pour générer des données de test :**
```javascript
// Dans la console DevTools
const testLinks = [
  'https://example.com/very/long/path/to/resource',
  'https://www.longdomainname.com/page/subpage/article',
  'https://another-long-domain.fr/documentation/guide/tutorial',
  'https://superlongdomain.com/category/subcategory/item/details',
  'https://extremelylongdomainname.fr/section/page/content'
];

copy(testLinks.join('\n'));
```

---

### 4. Test Performance

**Procédure :**
1. Ouvrir l'application
2. Aller dans "Appels" → Mode Table
3. Importer 1000+ contacts
4. Ouvrir DevTools → Performance
5. Cliquer "Record"
6. Scroller rapidement de haut en bas
7. Arrêter l'enregistrement
8. Vérifier FPS

**Résultat attendu :**
- ✅ FPS > 50
- ✅ Pas de lag visible
- ✅ Temps calcul autosize < 50ms

**Commande pour mesurer FPS :**
```javascript
// Dans la console DevTools
let lastTime = performance.now();
let frames = 0;

function measureFPS() {
  frames++;
  const currentTime = performance.now();
  const elapsed = currentTime - lastTime;
  
  if (elapsed >= 1000) {
    console.log(`FPS: ${frames}`);
    frames = 0;
    lastTime = currentTime;
  }
  
  requestAnimationFrame(measureFPS);
}

measureFPS();
```

---

### 5. Test Alignement Header/Body

**Procédure :**
1. Ouvrir l'application
2. Aller dans "Appels" → Mode Table
3. Vérifier visuellement l'alignement des colonnes
4. Ouvrir StatusSelect → vérifier pas de décalage
5. Ouvrir DatePicker → vérifier pas de décalage
6. Cliquer bouton Bell → vérifier pas de décalage

**Résultat attendu :**
- ✅ Header et body parfaitement alignés
- ✅ Pas de décalage lors de l'ouverture des popovers
- ✅ Pas de reset scroll horizontal

**Commande pour vérifier alignement :**
```javascript
// Dans la console DevTools
const headers = document.querySelectorAll('[class*="headerCell"]');
const cells = document.querySelectorAll('[class*="bodyCell"]');

headers.forEach((header, i) => {
  const headerWidth = header.getBoundingClientRect().width;
  const cellWidth = cells[i]?.getBoundingClientRect().width;
  
  if (Math.abs(headerWidth - cellWidth) > 2) {
    console.error(`Décalage colonne ${i}: header=${headerWidth}px, cell=${cellWidth}px`);
  } else {
    console.log(`✅ Colonne ${i} alignée: ${headerWidth}px`);
  }
});
```

---

### 6. Test Responsive

**Procédure :**
1. Ouvrir l'application
2. Aller dans "Appels" → Mode Table
3. Tester sur mobile (< 768px)
   - Ouvrir DevTools → Toggle device toolbar
   - Sélectionner "iPhone 12 Pro"
4. Tester sur tablet (768-1024px)
   - Sélectionner "iPad"
5. Tester sur desktop (> 1024px)
   - Sélectionner "Responsive" → 1920x1080

**Résultat attendu :**
- ✅ Colonnes adaptées à la largeur écran
- ✅ Scroll horizontal si nécessaire
- ✅ Pas de débordement

**Commande pour tester responsive :**
```javascript
// Dans la console DevTools
const widths = [375, 768, 1024, 1920];

widths.forEach(width => {
  window.resizeTo(width, 800);
  setTimeout(() => {
    const container = document.querySelector('[class*="tableContainer"]');
    const containerWidth = container?.clientWidth;
    console.log(`Largeur ${width}px → Container: ${containerWidth}px`);
  }, 500);
});
```

---

## 📊 Métriques à Collecter

### 1. Largeurs de Colonnes

**Commande :**
```javascript
// Dans la console DevTools
const columns = document.querySelectorAll('[class*="headerCell"]');

columns.forEach((col, i) => {
  const width = col.getBoundingClientRect().width;
  const label = col.textContent?.trim();
  console.log(`Colonne ${i} (${label}): ${width}px`);
});
```

**Résultat attendu :**
```
Colonne 0 (#): 50px
Colonne 1 (Prénom): 120px
Colonne 2 (Nom): 130px
Colonne 3 (Téléphone): 150px
Colonne 4 (Mail): 309px ← Augmenté !
Colonne 5 (Commentaire): 485px ← Augmenté !
Colonne 6 (Lien): 320px ← Augmenté !
...
```

---

### 2. Taux de Truncate

**Commande :**
```javascript
// Dans la console DevTools
const cells = document.querySelectorAll('[class*="bodyCell"]');
let truncated = 0;
let total = 0;

cells.forEach(cell => {
  const text = cell.textContent?.trim();
  if (text && text.includes('...')) {
    truncated++;
  }
  total++;
});

const rate = (truncated / total * 100).toFixed(1);
console.log(`Taux de truncate: ${rate}% (${truncated}/${total})`);
```

**Résultat attendu :**
```
Taux de truncate: 8.5% (85/1000)
← Avant: 55% (550/1000)
```

---

### 3. Temps de Calcul Autosize

**Commande :**
```javascript
// Dans la console DevTools
// Ajouter dans useColumnAutosize.ts (temporaire)
console.time('autosize');
// ... calcul autosize ...
console.timeEnd('autosize');
```

**Résultat attendu :**
```
autosize: 42.3ms ← < 50ms ✅
```

---

### 4. Mémoire Utilisée

**Commande :**
```javascript
// Dans la console DevTools
if (performance.memory) {
  const used = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
  const total = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(1);
  console.log(`Mémoire: ${used} MB / ${total} MB`);
}
```

**Résultat attendu :**
```
Mémoire: 52.3 MB / 100.0 MB
← Avant: 50.1 MB / 100.0 MB (+2.2 MB acceptable)
```

---

## ✅ Checklist de Validation

### Avant de Déployer

- [ ] **TypeScript** : 0 erreur
- [ ] **Tests automatisés** : Tous passent
- [ ] **Emails longs** : Visibles en entier
- [ ] **Commentaires longs** : Visibles jusqu'à 100 chars
- [ ] **Liens longs** : Visibles jusqu'à 80 chars
- [ ] **Performance** : FPS > 50, temps < 50ms
- [ ] **Alignement** : Header/body parfaits
- [ ] **Responsive** : Fonctionne mobile/desktop
- [ ] **Widgets** : Pas de décalage
- [ ] **Taux truncate** : < 15%

### Après Déploiement

- [ ] **Monitoring** : Vérifier performance en production
- [ ] **Feedback** : Collecter retours utilisateurs
- [ ] **Métriques** : Comparer avant/après
- [ ] **Ajustements** : Tweaker min/max si nécessaire

---

## 🎉 Conclusion

Tous les tests doivent passer avant de déployer en production. Si un test échoue, consulter :

1. **CONSIGNES_DEVELOPER_AUTOSIZE.md** → Troubleshooting
2. **TANSTACK_TABLE_AUTOSIZE_IMPLEMENTATION_GUIDE.md** → Architecture
3. **AUTOSIZE_METRICS_COMPARISON.md** → Métriques attendues

**Bon courage !** 🚀

---

**Date** : ${new Date().toLocaleDateString('fr-FR')}  
**Version** : 1.0
