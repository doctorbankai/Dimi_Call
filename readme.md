# DimiCall

## Collecte Supabase des appels

- Les événements d'appels sont synchronisés dans la table `call_data_events` (UID contact, statut, commentaires, UID/Email Supabase de l'utilisateur, métadonnées de timing).
- Activez/désactivez la collecte dans **Paramètres → Partage des données** ; le toggle « Collecter les données d'appels » est activé par défaut et force une synchro temps réel depuis SQLite.
- Pour vérifier la connexion ou relancer une synchro manuelle, utilisez le bouton « Relancer la synchro » dans le panneau ou dans la boîte de dialogue « Partage Supabase ».
