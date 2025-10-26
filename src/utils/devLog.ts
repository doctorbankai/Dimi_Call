/**
 * Utilitaire pour les logs de développement
 * Permet de désactiver facilement tous les logs en production
 */

const DEV_LOGS_ENABLED = false; // Mettre à true pour activer les logs de dev

export const devLog = (...args: any[]) => {
  if (DEV_LOGS_ENABLED && import.meta.env.DEV) {
    console.log(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (DEV_LOGS_ENABLED && import.meta.env.DEV) {
    console.warn(...args);
  }
};

export const devError = (...args: any[]) => {
  // Les erreurs sont toujours affichées
  console.error(...args);
};
