# Debug SMS - Écouter les logs du main process

Pour voir les logs détaillés de l'envoi SMS, ouvre la console du navigateur (F12) et colle ce code :

```javascript
// Écouter les logs du main process
window.electronAPI?.ipcRenderer?.on('adb-sms-log', (event, data) => {
  const emoji = data.level === 'error' ? '🔴' : data.level === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`${emoji} ${data.message}`);
});

console.log('✅ Listener SMS logs activé');
```

Ensuite, essaie d'envoyer un SMS et tu verras tous les logs détaillés dans la console.

## Alternative : Logs dans le terminal

Si tu as lancé l'app avec `npm run dev`, les logs du main process apparaissent aussi dans le terminal où tu as lancé la commande.
