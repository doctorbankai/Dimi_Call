# Implementation Plan

- [x] 1. Enrichir l'extraction des métadonnées dans syncSharedPhoneNumbers


  - Modifier la construction de l'objet `sample` pour inclure le champ `source`
  - Utiliser `extractString(row, ['source', 'origine', 'provenance'])` pour extraire la source
  - Ajouter une valeur par défaut `'Données'` si aucune source n'est trouvée
  - _Requirements: 1.1, 3.1, 3.2, 3.3_



- [ ] 2. Modifier le payload de syncSharedPhoneNumbers pour inclure les métadonnées
  - Modifier la fonction `map()` qui construit le payload pour `shared_phone_numbers`
  - Ajouter les champs `prenom`, `nom` et `source` au payload
  - Utiliser `entry.sample.prenom || null` pour gérer les valeurs vides
  - Utiliser `entry.sample.nom || null` pour gérer les valeurs vides


  - Utiliser `entry.sample.source || 'Données'` pour fournir une valeur par défaut
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 3. Enrichir l'extraction des métadonnées dans syncSharedBlacklistNumbers


  - Modifier la construction de l'objet `sample` pour inclure le champ `source`
  - Utiliser `extractString(row, ['source', 'origine', 'provenance'])` pour extraire la source
  - Ajouter une valeur par défaut `'Données'` si aucune source n'est trouvée
  - _Requirements: 2.1, 3.1, 3.2, 3.3_

- [x] 4. Modifier le payload de syncSharedBlacklistNumbers pour inclure les métadonnées


  - Modifier la fonction `map()` qui construit le payload pour `shared_blacklist_numbers`
  - Ajouter les champs `prenom`, `nom` et `source` au payload
  - Utiliser `entry.sample.prenom || null` pour gérer les valeurs vides
  - Utiliser `entry.sample.nom || null` pour gérer les valeurs vides
  - Utiliser `entry.sample.source || 'Données'` pour fournir une valeur par défaut



  - _Requirements: 2.1, 2.3, 2.4_

- [ ] 5. Ajouter des logs pour la validation des métadonnées synchronisées
  - Dans `syncSharedPhoneNumbers`, calculer le nombre de contacts avec métadonnées complètes (prenom ET nom ET source non-null)
  - Dans `syncSharedBlacklistNumbers`, calculer le nombre de contacts avec métadonnées complètes
  - Ajouter ces statistiques dans l'objet retourné par les fonctions (nouveau champ `withMetadata`)
  - Logger ces statistiques dans `runSync()` après une synchronisation réussie
  - _Requirements: 4.1, 4.2_

- [ ] 6. Tester la synchronisation avec des données réelles
  - Vérifier manuellement dans Supabase que les colonnes `prenom`, `nom`, `source` sont remplies
  - Vérifier les logs pour confirmer les statistiques de métadonnées
  - Tester avec des événements ayant des métadonnées partielles (seulement prenom, ou seulement nom)
  - Vérifier que les valeurs NULL sont correctement gérées
  - _Requirements: 1.4, 2.4, 4.3_
