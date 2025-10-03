# Implementation Plan

- [x] 1. Ajouter les imports nécessaires pour le PieChart


  - Importer `Pie`, `Label`, `Cell` depuis 'recharts' dans ChartDashboard.tsx
  - Vérifier que `ChartLegendContent` est bien importé depuis '@/components/ui/chart'
  - _Requirements: 2.1_





- [ ] 2. Implémenter la logique d'agrégation des données d'entonnoir
  - [ ] 2.1 Créer le hook useMemo `funnelData` qui agrège les statuts
    - Définir le mapping des statuts vers les catégories d'entonnoir (Contacté, Décroché, Argumenté, Pris)


    - Parcourir `localEvents` et incrémenter les compteurs pour chaque catégorie applicable




    - Transformer les compteurs en tableau d'objets avec category, value, et fill
    - Ajouter la dépendance `[localEvents]` au useMemo

    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [ ] 2.2 Créer la configuration `funnelConfig` pour le ChartContainer
    - Définir les labels et couleurs pour chaque catégorie (Contacté: --chart-1, Décroché: --chart-2, etc.)
    - _Requirements: 2.4_


- [ ] 3. Implémenter le composant JSX du graphique d'entonnoir
  - [ ] 3.1 Créer la structure Card avec header
    - Ajouter Card avec className "w-full mt-4"

    - Ajouter CardHeader avec titre "Entonnoir de conversion" et description "Progression des contacts par étape"
    - _Requirements: 4.1, 4.3, 4.4_
  - [x] 3.2 Implémenter le PieChart avec ChartContainer



    - Ajouter ChartContainer avec config={funnelConfig} et className appropriée
    - Ajouter PieChart avec Pie component utilisant funnelData
    - Configurer dataKey="value", nameKey="category", innerRadius={60}

    - _Requirements: 2.1, 2.2, 2.6_
  - [ ] 3.3 Ajouter le label central affichant le total
    - Implémenter le composant Label avec calcul du total

    - Afficher le nombre total d'événements au centre du donut
    - Styliser avec les classes appropriées (text-3xl, font-bold, etc.)
    - _Requirements: 4.5_
  - [ ] 3.4 Ajouter le tooltip et la légende
    - Configurer ChartTooltip avec ChartTooltipContent


    - Ajouter ChartLegendContent en dessous du graphique
    - _Requirements: 2.3, 2.5_

- [ ] 4. Gérer les cas limites et l'affichage conditionnel
  - [ ] 4.1 Implémenter l'affichage pour le cas "aucune donnée"
    - Vérifier si localEvents.length === 0
    - Afficher un message "Aucune donnée disponible" dans ce cas
    - _Requirements: 5.1_
  - [ ] 4.2 Assurer la robustesse de l'agrégation
    - Gérer les valeurs null/undefined dans new_status/newStatus avec String() et fallback
    - Ignorer silencieusement les statuts inconnus
    - _Requirements: 5.4_

- [ ] 5. Positionner le graphique dans le layout de ChartDashboard
  - Insérer le nouveau graphique après le graphique "Répartition des statuts" existant
  - Vérifier que le graphique est avant la grille des 4 KPIs
  - S'assurer que le graphique occupe toute la largeur (w-full)
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 6. Vérifier l'intégration avec les filtres de dates
  - Confirmer que le graphique se met à jour automatiquement quand localEvents change
  - Tester avec différents filtres de dates pour vérifier la réactivité
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Tests manuels et validation visuelle
  - [ ] 7.1 Tester l'affichage du graphique avec des données réelles
    - Vérifier que les 4 catégories s'affichent correctement
    - Vérifier que les proportions sont cohérentes avec les données
    - _Requirements: 2.2, 2.4_
  - [ ] 7.2 Tester les interactions utilisateur
    - Vérifier que les tooltips s'affichent au survol
    - Vérifier que la légende est lisible et correcte
    - _Requirements: 2.3, 2.5_
  - [ ] 7.3 Tester le responsive design
    - Vérifier l'affichage sur mobile, tablette et desktop
    - Vérifier que le graphique s'adapte correctement
    - _Requirements: 2.6_
  - [ ] 7.4 Tester les thèmes clair et sombre
    - Vérifier que les couleurs sont correctes en mode clair
    - Vérifier que les couleurs sont correctes en mode sombre
    - _Requirements: 2.4_
  - [ ] 7.5 Tester les cas limites
    - Tester avec aucune donnée (localEvents vide)
    - Tester avec des statuts inconnus
    - Tester avec des catégories à valeur 0
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
