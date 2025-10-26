/**
 * Throttle les logs pour éviter le spam
 * Les logs identiques sont limités à 1 toutes les X secondes
 */

// Cache pour le throttling
const logCache = new Map<string, number>();
const THROTTLE_MS = 5000; // 5 secondes entre logs identiques

// Sauvegarder les méthodes originales
const originalLog = console.log;
const originalWarn = console.warn;
const originalInfo = console.info;

// Fonction de throttling
const throttleLog = (originalFn: Function, ...args: any[]) => {
  const key = JSON.stringify(args);
  const now = Date.now();
  const lastTime = logCache.get(key) || 0;

  if (now - lastTime > THROTTLE_MS) {
    logCache.set(key, now);
    originalFn(...args);
  }
};

// Appliquer le throttling
export const enableThrottledLogs = () => {
  console.log = (...args: any[]) => throttleLog(originalLog, ...args);
  console.warn = (...args: any[]) => throttleLog(originalWarn, ...args);
  console.info = (...args: any[]) => throttleLog(originalInfo, ...args);
};

// Réactiver les logs normaux (sans throttling)
export const enableAllLogs = () => {
  console.log = originalLog;
  console.warn = originalWarn;
  console.info = originalInfo;
};

// Désactiver complètement les logs
export const disableAllLogs = () => {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
};

// Activer le throttling automatiquement au chargement
if (import.meta.env.DEV) {
  enableThrottledLogs();
  
  // Exposer les fonctions globales
  (window as any).enableLogs = enableAllLogs;
  (window as any).disableLogs = disableAllLogs;
  (window as any).enableThrottledLogs = enableThrottledLogs;
  
  console.error('✅ Logs throttlés (1 log identique toutes les 5s). Pour désactiver: window.disableLogs()');
}
