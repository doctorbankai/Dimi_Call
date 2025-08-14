import * as dotenv from 'dotenv'
import * as path from 'path'
import { app, shell, BrowserWindow, ipcMain, globalShortcut, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import electronUpdater from 'electron-updater'
import log from 'electron-log'

// Extraction de autoUpdater depuis le module CommonJS
const { autoUpdater } = electronUpdater

// Configuration du logger pour electron-updater
log.transports.file.level = 'info'
autoUpdater.logger = log

// Load environment variables from .env file at the very start
dotenv.config({ path: path.resolve(app.getAppPath(), '..', '.env') })

const execAsync = promisify(exec)

// État de mise à jour
let updateInfo: any = null
let updateDownloaded = false
let mainWindow: BrowserWindow | null = null

// État des DevTools
let devToolsEnabled = false

// Fonction pour lire les préférences DevTools depuis le renderer
const getDevToolsPreferences = async (): Promise<boolean> => {
  try {
    if (mainWindow && mainWindow.webContents) {
      // Exécuter du code dans le renderer pour lire localStorage
      const result = await mainWindow.webContents.executeJavaScript(`
        try {
          const stored = localStorage.getItem('dimicall-devtools-enabled');
          console.log('[DEVTOOLS-MAIN] localStorage value:', stored);
          const enabled = stored === 'true';
          console.log('[DEVTOOLS-MAIN] Parsed enabled:', enabled);
          enabled;
        } catch (error) {
          console.error('[DEVTOOLS-MAIN] Erreur lecture localStorage:', error);
          false;
        }
      `)
      console.log(`🔧 [DEVTOOLS] Préférences lues depuis localStorage: ${result}`)
      return result || false
    }
    console.log('🔧 [DEVTOOLS] ⚠️ Fenêtre principale non disponible')
    return false
  } catch (error) {
    console.error('🔧 [DEVTOOLS] ❌ Erreur lors de la lecture des préférences:', error)
    return false
  }
}

// ☢️ FONCTION NUCLÉAIRE : Contrôle total des DevTools
const enableDevToolsBasedOnPreferences = async (): Promise<void> => {
  try {
    if (!mainWindow) {
      console.log('🔧 [NUCLEAR] ⚠️ Fenêtre principale non disponible')
      return
    }
    
    const devToolsEnabled = await getDevToolsPreferences()
    console.log(`🔧 [NUCLEAR] Configuration DevTools: ${devToolsEnabled ? 'ACTIVÉS' : 'DÉSACTIVÉS'}`)
    
    if (devToolsEnabled) {
      console.log('🔧 [NUCLEAR] ✅ DevTools autorisés - Ctrl+Shift+I disponible')
    } else {
      // Fermer les DevTools s'ils sont ouverts
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools()
        console.log('🔧 [NUCLEAR] 🔒 DevTools fermés automatiquement')
      }
      console.log('🔧 [NUCLEAR] ❌ DevTools bloqués - Ctrl+Shift+I désactivé')
    }
  } catch (error) {
    console.error('🔧 [NUCLEAR] ❌ Erreur configuration DevTools:', error)
  }
}

// Configuration de l'auto-updater
// Désactiver l'installation automatique ; l'utilisateur doit confirmer l'installation
autoUpdater.autoInstallOnAppQuit = false
// Laisser le téléchargement automatique en arrière-plan
autoUpdater.autoDownload = true

// Fonction pour lire les préférences bêta depuis un fichier persistant
const getBetaPreferences = () => {
  try {
    const userDataPath = app.getPath('userData')
    const prefsPath = path.join(userDataPath, 'beta-preferences.json')
    
    log.info(`🔧 [PREFS] Lecture des préférences depuis: ${prefsPath}`)
    
    if (fs.existsSync(prefsPath)) {
      const data = fs.readFileSync(prefsPath, 'utf8')
      const prefs = JSON.parse(data)
      log.info(`🔧 [PREFS] Préférences trouvées: ${JSON.stringify(prefs)}`)
      
      // Validation des données
      if (typeof prefs.enabled === 'boolean') {
        return prefs
      } else {
        log.warn(`🔧 [PREFS] Préférences invalides, utilisation des valeurs par défaut`)
        return { enabled: false, lastModified: Date.now(), hasBeenWarned: false }
      }
    } else {
      log.info(`🔧 [PREFS] Aucun fichier de préférences trouvé, utilisation des valeurs par défaut`)
      return { enabled: false, lastModified: Date.now(), hasBeenWarned: false }
    }
  } catch (error) {
    log.error(`🔧 [PREFS] Erreur lors de la lecture des préférences: ${error.message}`)
    return { enabled: false, lastModified: Date.now(), hasBeenWarned: false }
  }
}

// Fonction pour sauvegarder les préférences bêta dans un fichier persistant
const saveBetaPreferences = (preferences) => {
  try {
    const userDataPath = app.getPath('userData')
    const prefsPath = path.join(userDataPath, 'beta-preferences.json')
    
    const toSave = {
      ...preferences,
      lastModified: Date.now()
    }
    
    fs.writeFileSync(prefsPath, JSON.stringify(toSave, null, 2), 'utf8')
    log.info(`🔧 [PREFS] Préférences sauvegardées: ${JSON.stringify(toSave)}`)
    
    return true
  } catch (error) {
    log.error(`🔧 [PREFS] Erreur lors de la sauvegarde: ${error.message}`)
    return false
  }
}

// Fonction pour synchroniser les préférences entre localStorage et fichier
const syncBetaPreferences = async () => {
  if (!mainWindow || !mainWindow.webContents) {
    log.warn(`🔧 [PREFS] Impossible de synchroniser: fenêtre non disponible`)
    return null
  }
  
  try {
    // Lire depuis localStorage du renderer
    const localStoragePrefs = await mainWindow.webContents.executeJavaScript(`
      try {
        const stored = localStorage.getItem('dimicall-beta-preferences');
        stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.error('Erreur lecture localStorage:', error);
        null;
      }
    `)
    
    // Lire depuis le fichier
    const filePrefs = getBetaPreferences()
    
    log.info(`🔧 [PREFS] localStorage: ${JSON.stringify(localStoragePrefs)}`)
    log.info(`🔧 [PREFS] fichier: ${JSON.stringify(filePrefs)}`)
    
    // Déterminer quelle source est la plus récente
    let finalPrefs = filePrefs
    
    if (localStoragePrefs && localStoragePrefs.lastModified) {
      if (!filePrefs.lastModified || localStoragePrefs.lastModified > filePrefs.lastModified) {
        finalPrefs = localStoragePrefs
        saveBetaPreferences(finalPrefs) // Sauvegarder dans le fichier
        log.info(`🔧 [PREFS] localStorage plus récent, synchronisation vers fichier`)
      } else {
        // Synchroniser vers localStorage
        await mainWindow.webContents.executeJavaScript(`
          try {
            localStorage.setItem('dimicall-beta-preferences', '${JSON.stringify(finalPrefs)}');
            console.log('Préférences synchronisées vers localStorage');
          } catch (error) {
            console.error('Erreur sync localStorage:', error);
          }
        `)
        log.info(`🔧 [PREFS] Fichier plus récent, synchronisation vers localStorage`)
      }
    }
    
    return finalPrefs
  } catch (error) {
    log.error(`🔧 [PREFS] Erreur lors de la synchronisation: ${error.message}`)
    return getBetaPreferences() // Fallback sur le fichier
  }
}

if (!is.dev) {
  // Configuration initiale des préférences
  const initialPrefs = getBetaPreferences()
  autoUpdater.allowPrerelease = initialPrefs.enabled
  
  log.info(`🚀 [STARTUP] Configuration initiale autoUpdater.allowPrerelease: ${autoUpdater.allowPrerelease}`)
  
  // Attendre que la fenêtre soit prête avant la première vérification
  setTimeout(async () => {
    // Synchroniser les préférences une fois la fenêtre prête
    const syncedPrefs = await syncBetaPreferences()
    if (syncedPrefs && syncedPrefs.enabled !== autoUpdater.allowPrerelease) {
      autoUpdater.allowPrerelease = syncedPrefs.enabled
      log.info(`🔄 [STARTUP] allowPrerelease mis à jour après sync: ${autoUpdater.allowPrerelease}`)
    }
    
    // Première vérification des mises à jour
    log.info(`🔍 [STARTUP] Première vérification des mises à jour avec allowPrerelease: ${autoUpdater.allowPrerelease}`)
    autoUpdater.checkForUpdates()
  }, 3000) // Attendre 3 secondes que la fenêtre soit complètement chargée
  
  // Vérifier les mises à jour toutes les 10 minutes
  setInterval(async () => {
    // Re-synchroniser les préférences avant chaque vérification automatique
    const syncedPrefs = await syncBetaPreferences()
    if (syncedPrefs && syncedPrefs.enabled !== autoUpdater.allowPrerelease) {
      autoUpdater.allowPrerelease = syncedPrefs.enabled
      log.info(`🔄 [AUTO] allowPrerelease mis à jour: ${autoUpdater.allowPrerelease}`)
    }
    
    log.info(`🔍 [AUTO] Vérification automatique avec allowPrerelease: ${autoUpdater.allowPrerelease}`)
    autoUpdater.checkForUpdates()
  }, 10 * 60 * 1000)
}

// Initialisation ICU forcée avant toute autre chose
console.log('🔧 Démarrage de l\'application DimiCall...')
console.log('🌍 Initialisation ICU...')

// Forcer l'initialisation d'ICU avec des chemins multiples
const possibleIcuPaths = [
  join(__dirname, 'icudtl.dat'),
  join(process.resourcesPath, 'icudtl.dat'),
  join(process.resourcesPath, 'app.asar.unpacked', 'icudtl.dat'),
  join(process.cwd(), 'icudtl.dat'),
  join(process.execPath, '..', 'icudtl.dat')
]

for (const icuPath of possibleIcuPaths) {
  if (fs.existsSync(icuPath)) {
    console.log('✅ Fichier ICU trouvé:', icuPath)
    // Définir la variable d'environnement pour Electron
    process.env.ELECTRON_ICU_DATA_FILE = icuPath
    break
  } else {
    console.log('❌ ICU non trouvé:', icuPath)
  }
}

// Log ICU pour diagnostics
console.log('🌍 ICU_DATA_FILE:', process.env.ELECTRON_ICU_DATA_FILE)
console.log('🌍 Locale système:', Intl.DateTimeFormat().resolvedOptions().locale)

// Capturer toutes les erreurs non gérées
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non gérée dans le processus principal:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejetée non gérée:', reason, 'at:', promise)
})

// Import des services de validation des permissions
import { AdbPermissionChecker } from './services/adb-permission-checker'
import { PlatformToolsValidator } from './utils/platform-tools-validator'
import { AdbErrorHandler } from './utils/adb-error-handler'

// Cache pour éviter de re-vérifier les permissions à chaque appel
let adbPathCache: string | null = null
let lastPermissionCheck: number = 0
const PERMISSION_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

// Fonction pour obtenir le chemin de l'exécutable ADB
function getAdbPath(): string {
  const platform = process.platform
  // Déterminer le nom approprié du binaire adb selon l'OS
  const adbFile = platform === 'win32' ? 'adb.exe' : 'adb'

  if (is.dev) {
    // En mode développement, utiliser les dossiers platform-tools présents dans le repo
    if (platform === 'win32') {
      return join(app.getAppPath(), 'platform-tools-latest-windows (4)', 'platform-tools', adbFile)
    } else if (platform === 'darwin') {
      return join(app.getAppPath(), 'platform-tools-latest-darwin (2)', 'platform-tools', adbFile)
    }
    // Fallback générique pour Linux ou autres plateformes
    return join(app.getAppPath(), 'platform-tools', adbFile)
  }

  // En production (application packagée), les platform-tools sont copiés dans resourcesPath
  return join(process.resourcesPath, 'platform-tools', adbFile)
}

// Fonction améliorée pour obtenir le chemin ADB avec validation des permissions
async function getValidatedAdbPath(): Promise<string> {
  const adbPath = getAdbPath()
  const now = Date.now()
  
  // Utiliser le cache si disponible et récent (sauf sur macOS où on vérifie plus souvent)
  if (adbPathCache === adbPath && 
      (now - lastPermissionCheck) < PERMISSION_CHECK_INTERVAL &&
      process.platform !== 'darwin') {
    return adbPath
  }

  console.log(`🔍 Validation du chemin ADB: ${adbPath}`)

  try {
    // Sur macOS, vérifier et corriger les permissions si nécessaire
    if (process.platform === 'darwin') {
      const permissionResult = await AdbPermissionChecker.checkAndFixPermissions(adbPath)
      
      if (!permissionResult.success) {
        console.error(`❌ Impossible de valider/corriger les permissions ADB: ${permissionResult.error}`)
        
        // Générer des instructions pour l'utilisateur
        const instructions = PlatformToolsValidator.generateManualFixInstructions(
          path.dirname(adbPath),
          [adbPath]
        )
        
        console.log('📋 Instructions de correction manuelle:')
        instructions.forEach(instruction => console.log(`   ${instruction}`))
        
        // Retourner le chemin même si les permissions sont incorrectes
        // L'erreur sera gérée lors de l'exécution
        return adbPath
      }

      if (permissionResult.wasFixed) {
        console.log(`✅ Permissions ADB corrigées automatiquement: ${adbPath}`)
      }
    }

    // Mettre à jour le cache
    adbPathCache = adbPath
    lastPermissionCheck = now

    return adbPath

  } catch (error) {
    console.error(`❌ Erreur lors de la validation du chemin ADB: ${adbPath}`, error)
    return adbPath // Retourner le chemin même en cas d'erreur
  }
}

// Fonction pour valider tout le dossier platform-tools au démarrage
async function validatePlatformToolsOnStartup(): Promise<void> {
  if (process.platform !== 'darwin') {
    console.log('ℹ️ Validation des platform-tools ignorée (pas sur macOS)')
    return
  }

  try {
    const adbPath = getAdbPath()
    const platformToolsPath = path.dirname(adbPath)
    
    console.log(`🚀 Validation complète des platform-tools au démarrage: ${platformToolsPath}`)
    
    const result = await PlatformToolsValidator.validateAndFixPlatformTools(platformToolsPath)
    
    if (result.readyForUse) {
      console.log('✅ Platform-tools validé et prêt à l\'utilisation')
    } else {
      console.log('⚠️ Platform-tools nécessite une attention')
      
      if (result.fixSummary && !result.fixSummary.allFixesSuccessful) {
        const failedBinaries = result.fixSummary.fixResults
          .filter(r => !r.success)
          .map(r => r.filePath)
        
        const instructions = PlatformToolsValidator.generateManualFixInstructions(
          platformToolsPath,
          failedBinaries
        )
        
        console.log('📋 Instructions de correction manuelle nécessaires:')
        instructions.forEach(instruction => console.log(`   ${instruction}`))
        
        // Optionnel: Envoyer une notification à l'interface utilisateur
        if (mainWindow) {
          mainWindow.webContents.send('adb-permission-warning', {
            message: 'Les permissions ADB nécessitent une correction manuelle',
            instructions: instructions
          })
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation des platform-tools au démarrage:', error)
  }
}

function createWindow(): BrowserWindow {
  console.log('🚀 Création de la fenêtre principale...')
  
  // Configuration spécifique selon la plateforme
  const isMacOS = process.platform === 'darwin'
  const HEADER_HEIGHT = 32 // Hauteur de la barre de titre personnalisée
  
  // Créer la fenêtre de navigateur principale
  const mainWindow = new BrowserWindow({
    width: 1800,
    height: 1200,
    minWidth: 1400,
    minHeight: 900,
    show: false,
    autoHideMenuBar: !is.dev, // Masquer le menu en production, l'afficher en développement
    titleBarStyle: isMacOS ? 'hiddenInset' : 'hidden', // Configuration adaptée pour macOS
    titleBarOverlay: isMacOS ? { height: HEADER_HEIGHT } : false,
    frame: isMacOS ? true : false, // Garder le frame sur macOS pour les boutons natifs
    trafficLightPosition: isMacOS ? { x: 16, y: 16 } : undefined, // Position des boutons macOS
    backgroundColor: '#ffffff', // Couleur de fond blanche pour éviter l'écran noir
    icon: join(__dirname, '../../public/logo-d.png'), // Correction du chemin de l'icône
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true // ☢️ NUCLEAR: DevTools disponibles mais contrôlés par gestionnaire d'événements
    }
  })

  console.log('✅ Fenêtre créée, configuration des événements...')

  // Logs détaillés pour le chargement
  mainWindow.webContents.on('dom-ready', () => {
    console.log('📄 DOM prêt')
  })

  mainWindow.webContents.on('did-start-loading', () => {
    console.log('⏳ Début du chargement de la page...')
  })

  mainWindow.webContents.on('did-stop-loading', () => {
    console.log('✅ Fin du chargement de la page')
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('🎯 Page entièrement chargée')
  })

  // Attendre que la page soit complètement chargée avant d'afficher la fenêtre
  mainWindow.once('ready-to-show', () => {
    console.log('🎪 ready-to-show événement déclenché')
    mainWindow.show()
    
    // Les DevTools ne s'ouvrent plus automatiquement, même en développement
    // L'utilisateur doit explicitement les activer via les paramètres
    console.log('🔧 DevTools disponibles via Ctrl+Shift+I (si activés dans les paramètres)')
    
    // Optionnel : fade in pour une transition plus douce
    if (mainWindow.isVisible()) {
      mainWindow.focus()
      console.log('🔍 Fenêtre affichée et focus donné')
    }
  })

  // ☢️ NUCLEAR: Restaurer l'état des DevTools après que la page soit chargée
  mainWindow.webContents.once('did-finish-load', async () => {
    try {
      // Attendre que localStorage soit disponible
      setTimeout(async () => {
        console.log('🔧 [NUCLEAR] Démarrage de la configuration DevTools...')
        await enableDevToolsBasedOnPreferences()
        console.log('🔧 [NUCLEAR] Configuration DevTools terminée')
      }, 1000) // Plus de temps pour être sûr
    } catch (error) {
      console.error('🔧 [NUCLEAR] ❌ Erreur lors de la restauration DevTools:', error)
    }
  })

  // Gérer les erreurs de chargement
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Échec du chargement de la page:', {
      errorCode,
      errorDescription,
      url: validatedURL
    })
  })

  // Logger les erreurs de la console du renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`🖥️ Console [${level}]:`, message, `(${sourceId}:${line})`)
  })

  // Logger les erreurs non gérées du renderer
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('💥 Le processus renderer a disparu!', details)
  })

  // S'assurer que la fenêtre s'affiche même en cas de problème
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('⚠️ Forçage de l\'affichage de la fenêtre après délai')
      mainWindow.show()
      // En cas de problème, suggérer d'activer les DevTools via les paramètres
      console.log('⚠️ Si vous rencontrez des problèmes, activez les DevTools via les paramètres')
    }
  }, 5000) // 5 secondes de délai maximum

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR pour renderer basé sur electron-vite cli.
  // Charger l'URL distante pour le développement ou le fichier html local pour la production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    console.log('🌐 Mode développement - chargement de l\'URL:', process.env['ELECTRON_RENDERER_URL'])
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    // En mode production, les fichiers renderer sont extraits de l'asar dans app.asar.unpacked
    const htmlPath = is.dev 
      ? join(__dirname, '../renderer/index.html')
      : join(__dirname, '../renderer/index.html')
    
    console.log('📁 Mode production - chargement du fichier:', htmlPath)
    console.log('📂 __dirname:', __dirname)
    console.log('📂 process.resourcesPath:', process.resourcesPath)
    
    // Essayer différents chemins possibles
    const possiblePaths = [
      htmlPath,
      join(__dirname, '../renderer/src/index.html'), // Le chemin correct avec Vite
      join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'renderer', 'src', 'index.html'),
      join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'renderer', 'index.html'),
      join(process.resourcesPath, 'app', 'dist', 'renderer', 'src', 'index.html'),
      join(process.resourcesPath, 'app', 'dist', 'renderer', 'index.html'),
      join(__dirname, '../../renderer/index.html')
    ]
    
    let validPath: string | null = null
    for (const path of possiblePaths) {
      console.log('🔍 Test du chemin:', path)
      if (require('fs').existsSync(path)) {
        validPath = path
        console.log('✅ Chemin valide trouvé!')
        break
      } else {
        console.log('❌ Chemin invalide')
      }
    }
    
    if (validPath) {
      mainWindow.loadFile(validPath)
    } else {
      console.error('💥 Aucun chemin valide trouvé pour index.html')
      // Fallback: essayer de charger une page d'erreur simple
      mainWindow.loadURL('data:text/html,<h1>Erreur: Impossible de charger l\'application</h1><p>Fichier HTML non trouvé</p>')
    }
  }
  
  console.log('✨ Configuration de la fenêtre terminée')
  return mainWindow
}

// Cette méthode sera appelée quand Electron aura fini
// de s'initialiser et est prête à créer des fenêtres de navigateur.
// Certaines APIs peuvent seulement être utilisées après que cet événement se produit.
app.whenReady().then(async () => {
  console.log('🚀 Electron est prêt, initialisation de l\'application...')
  
  // Définir l'id de l'app pour les notifications Windows 10+
  electronApp.setAppUserModelId('com.dimultra.dimicall')
  console.log('🏷️ App ID défini: com.dimultra.dimicall')

  // Valider les permissions ADB sur macOS avant de créer la fenêtre
  if (process.platform === 'darwin') {
    console.log('🔍 Validation des permissions ADB au démarrage (macOS)...')
    await validatePlatformToolsOnStartup()
  }

  mainWindow = createWindow()

  // IPC handlers basiques pour l'interface utilisateur
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  // Vérification manuelle des mises à jour avec retour d'état
  ipcMain.handle('check-for-updates', async (event, betaEnabled = false, forceRefresh = false) => {
    try {
      if (is.dev) {
        log.warn('Mise à jour ignorée car l\'application est en mode développement.')
        return {
          status: 'dev_mode',
          message: 'La vérification des mises à jour est désactivée en mode développement.'
        }
      }
      
      // Configurer les pre-releases selon les préférences utilisateur
      const previousAllowPrerelease = autoUpdater.allowPrerelease
      autoUpdater.allowPrerelease = betaEnabled
      
      log.info(`🔄 [UPDATE] Vérification manuelle initiée par l'utilisateur`)
      log.info(`🔄 [UPDATE] betaEnabled paramètre: ${betaEnabled}`)
      log.info(`🔄 [UPDATE] forceRefresh paramètre: ${forceRefresh}`)
      log.info(`🔄 [UPDATE] allowPrerelease avant: ${previousAllowPrerelease}`)
      log.info(`🔄 [UPDATE] allowPrerelease après: ${autoUpdater.allowPrerelease}`)
      log.info(`🔄 [UPDATE] Version actuelle: ${app.getVersion()}`)
      
      // Cache-busting: forcer une nouvelle configuration si nécessaire
      if (forceRefresh || previousAllowPrerelease !== betaEnabled) {
        log.info(`🔄 [UPDATE] Cache-busting: reconfiguration d'electron-updater`)
        
        // Réinitialiser la configuration feed
        autoUpdater.setFeedURL({
          provider: 'github',
          owner: 'doctorbankai',
          repo: 'Dimi_Call',
          private: false,
          // Ajouter un timestamp pour forcer le refresh
          requestHeaders: {
            'Cache-Control': 'no-cache',
            'X-Timestamp': Date.now().toString()
          }
        })
        
        log.info(`🔄 [UPDATE] Feed URL reconfigurée avec cache-busting`)
      }
      
      const result = await autoUpdater.checkForUpdatesAndNotify()
      log.info(`🔄 [UPDATE] Résultat checkForUpdatesAndNotify: ${JSON.stringify(result)}`)
      
      return { status: 'checking', message: 'Vérification des mises à jour lancée.' }
    } catch (error) {
      log.error("Erreur lors de l'initiation de la vérification manuelle des mises à jour:", error)
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.'
      }
    }
  })

  // Obtenir l'état actuel de mise à jour
  ipcMain.handle('get-update-status', () => {
    return {
      updateAvailable: !!updateInfo,
      updateDownloaded,
      updateInfo
    }
  })

  // Installer et redémarrer avec la mise à jour
  ipcMain.handle('install-update', () => {
    if (updateDownloaded) {
      console.log('🔄 Installation de la mise à jour et redémarrage...')
      autoUpdater.quitAndInstall()
      return { success: true }
    } else {
      console.log('⚠️ Aucune mise à jour téléchargée disponible')
      return { success: false, message: 'Aucune mise à jour disponible' }
    }
  })

  // Synchroniser les préférences beta
  ipcMain.handle('sync-beta-preferences', async (event, preferences) => {
    try {
      log.info(`🔄 [IPC] Synchronisation des préférences reçue: ${JSON.stringify(preferences)}`)
      
      // Sauvegarder dans le fichier
      const saved = saveBetaPreferences(preferences)
      
      if (saved) {
        // Mettre à jour autoUpdater immédiatement
        const previousAllowPrerelease = autoUpdater.allowPrerelease
        autoUpdater.allowPrerelease = preferences.enabled
        
        log.info(`🔄 [IPC] allowPrerelease mis à jour: ${previousAllowPrerelease} -> ${autoUpdater.allowPrerelease}`)
        
        return { success: true, message: 'Préférences synchronisées' }
      } else {
        return { success: false, message: 'Erreur lors de la sauvegarde' }
      }
    } catch (error) {
      log.error(`🔄 [IPC] Erreur sync préférences: ${error.message}`)
      return { success: false, message: error.message }
    }
  })

  // Revenir à la version stable
  ipcMain.handle('revert-to-stable', async () => {
    try {
      if (is.dev) {
        log.warn('Retour à la version stable ignoré car l\'application est en mode développement.')
        return {
          success: false,
          message: 'Le retour à la version stable est désactivé en mode développement.'
        }
      }
      
      // Désactiver les pre-releases
      const previousAllowPrerelease = autoUpdater.allowPrerelease
      autoUpdater.allowPrerelease = false
      
      log.info(`🔄 [UPDATE] Retour à la version stable initié par l'utilisateur`)
      log.info(`🔄 [UPDATE] allowPrerelease avant: ${previousAllowPrerelease}`)
      log.info(`🔄 [UPDATE] allowPrerelease après: ${autoUpdater.allowPrerelease}`)
      log.info(`🔄 [UPDATE] Version actuelle: ${app.getVersion()}`)
      
      // Vérifier s'il y a une version stable disponible
      const result = await autoUpdater.checkForUpdatesAndNotify()
      log.info(`🔄 [UPDATE] Résultat checkForUpdatesAndNotify: ${JSON.stringify(result)}`)
      
      return { success: true, message: 'Recherche de version stable lancée.' }
    } catch (error) {
      log.error("Erreur lors du retour à la version stable:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.'
      }
    }
  })

  // Événements de l'auto-updater
  autoUpdater.on('checking-for-update', () => {
    const allowPrerelease = autoUpdater.allowPrerelease
    console.log('🔍 Vérification des mises à jour...')
    log.info(`🔍 [UPDATE] Vérification des mises à jour démarrée`)
    log.info(`🔍 [UPDATE] allowPrerelease: ${allowPrerelease}`)
    log.info(`🔍 [UPDATE] Version actuelle: ${app.getVersion()}`)
    log.info(`🔍 [UPDATE] Repository: doctorbankai/Dimi_Call`)
    
    if (mainWindow) {
      mainWindow.webContents.send('update-checking')
    }
  })

  autoUpdater.on('update-available', (info) => {
    console.log('📦 Mise à jour disponible:', info.version)
    log.info(`📦 [UPDATE] Mise à jour disponible: ${info.version}`)
    log.info(`📦 [UPDATE] Release date: ${info.releaseDate || 'non définie'}`)
    log.info(`📦 [UPDATE] Pre-release: ${info.prerelease || 'non défini'}`)
    log.info(`📦 [UPDATE] Release notes: ${info.releaseNotes ? 'présentes' : 'absentes'}`)
    log.info(`📦 [UPDATE] Files: ${info.files ? info.files.length : 0} fichiers`)
    log.info(`📦 [UPDATE] allowPrerelease était: ${autoUpdater.allowPrerelease}`)
    
    updateInfo = info
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info)
    }
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('✅ Application à jour:', info.version)
    log.info(`✅ [UPDATE] Aucune mise à jour disponible`)
    log.info(`✅ [UPDATE] Version actuelle: ${app.getVersion()}`)
    log.info(`✅ [UPDATE] Dernière version vérifiée: ${info.version}`)
    log.info(`✅ [UPDATE] allowPrerelease était: ${autoUpdater.allowPrerelease}`)
    log.info(`✅ [UPDATE] Si pre-release activé, vérifiez que GitHub a bien des pre-releases plus récentes`)
    
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available', info)
    }
  })

  autoUpdater.on('error', (err) => {
    console.error('❌ Erreur lors de la mise à jour:', err)
    log.error(`❌ [UPDATE] Erreur lors de la mise à jour: ${err.message}`)
    log.error(`❌ [UPDATE] Stack trace: ${err.stack}`)
    log.error(`❌ [UPDATE] allowPrerelease était: ${autoUpdater.allowPrerelease}`)
    log.error(`❌ [UPDATE] Version actuelle: ${app.getVersion()}`)
    
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err.message)
    }
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent)
    console.log(`⬇️ Téléchargement en cours: ${percent}%`)
    if (mainWindow) {
      mainWindow.webContents.send('update-download-progress', progressObj)
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('🎉 Mise à jour téléchargée:', info.version)
    console.log('🔄 Mise à jour prête à être installée - en attente du clic utilisateur')
    
    updateDownloaded = true
    updateInfo = info
    
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info)
    }
  })

  console.log('🚀 electron-updater configuré pour les mises à jour automatiques')

  // Le raccourci de développement par défaut de 'CommandOrControl + R' est
  // enregistré lors du développement pour aider
  // au débogage avec DevTools.
  app.on('browser-window-created', (_, window) => {
    // ☢️ NUCLEAR ULTIME: NE PAS utiliser optimizer.watchWindowShortcuts
    // car il active les raccourcis par défaut d'Electron qui interfèrent
    console.log('🔧 [NUCLEAR] ⚠️ optimizer.watchWindowShortcuts DÉSACTIVÉ pour contrôler les DevTools')
    
    // Gestionnaire d'événements PRIORITAIRE
    window.webContents.on('before-input-event', async (event, input) => {
      // Intercepter Ctrl+Shift+I et F12
      if ((input.control && input.shift && input.key.toLowerCase() === 'i') || input.key === 'F12') {
        console.log('🔧 [NUCLEAR] 🚨 Raccourci DevTools intercepté')
        
        const devToolsEnabled = await getDevToolsPreferences()
        console.log(`🔧 [NUCLEAR] État des préférences: ${devToolsEnabled}`)
        
        if (!devToolsEnabled) {
          console.log('🔧 [NUCLEAR] ❌ BLOCAGE TOTAL du raccourci - DevTools désactivés')
          event.preventDefault() // Bloquer l'événement
          return false // Empêcher la propagation
        } else {
          console.log('🔧 [NUCLEAR] ✅ Raccourci autorisé - DevTools activés')
          // Laisser l'événement continuer normalement
        }
      }
    })
    
    // Surveillance continue pour fermer les DevTools si ouverts sans autorisation
    setInterval(async () => {
      if (window.webContents.isDevToolsOpened()) {
        const devToolsEnabled = await getDevToolsPreferences()
        if (!devToolsEnabled) {
          console.log('🔧 [NUCLEAR] 🔒 DevTools détectés ouverts sans autorisation - fermeture forcée')
          window.webContents.closeDevTools()
        }
      }
    }, 1000) // Vérifier toutes les secondes
  })

  // Gestionnaires IPC
  ipcMain.handle('app:close', () => {
    app.quit()
  })

  ipcMain.handle('app:minimize', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      window.minimize()
    }
  })

  ipcMain.handle('app:maximize', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
    }
  })

  ipcMain.handle('app:is-maximized', () => {
    const window = BrowserWindow.getFocusedWindow()
    return window ? window.isMaximized() : false
  })

  // ☢️ NUCLEAR: Gestionnaires IPC pour DevTools
  ipcMain.handle('devtools:enable', async () => {
    try {
      if (mainWindow) {
        console.log('🔧 [NUCLEAR] Activation des DevTools par l\'utilisateur')
        // Réappliquer la configuration après changement des préférences
        setTimeout(async () => {
          await enableDevToolsBasedOnPreferences()
        }, 100)
        return { success: true }
      }
      return { success: false, error: 'Fenêtre principale non disponible' }
    } catch (error) {
      console.error('🔧 [NUCLEAR] ❌ Erreur lors de l\'activation des DevTools:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
    }
  })

  ipcMain.handle('devtools:disable', async () => {
    try {
      if (mainWindow) {
        console.log('🔧 [NUCLEAR] Désactivation des DevTools par l\'utilisateur')
        // Réappliquer la configuration après changement des préférences
        setTimeout(async () => {
          await enableDevToolsBasedOnPreferences()
        }, 100)
        return { success: true }
      }
      return { success: false, error: 'Fenêtre principale non disponible' }
    } catch (error) {
      console.error('🔧 [NUCLEAR] ❌ Erreur lors de la désactivation des DevTools:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
    }
  })

  ipcMain.handle('devtools:is-enabled', () => {
    try {
      if (mainWindow) {
        // En production et développement, on se base sur les préférences utilisateur
        return { enabled: true } // L'état réel sera géré par le DevToolsService
      }
      return { enabled: false }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'état des DevTools:', error)
      return { enabled: false }
    }
  })

  // Gestionnaires IPC pour ADB
  ipcMain.handle('adb:devices', async () => {
    try {
      const adbPath = await getValidatedAdbPath()
      const adbCommand = `"${adbPath}" devices`
      const { stdout, stderr } = await execAsync(adbCommand)
      if (stderr && !stderr.includes('daemon not running')) {
        throw new Error(stderr)
      }
      
      // Parser la sortie d'adb devices
      const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('List of devices'))
      const devices = lines.map(line => {
        const parts = line.trim().split('\t')
        if (parts.length >= 2) {
          return {
            serial: parts[0],
            status: parts[1],
            name: parts[0] // On utilisera le serial comme nom pour l'instant
          }
        }
        return null
      }).filter(Boolean)
      
      return { success: true, devices }
    } catch (error) {
      const adbError = AdbErrorHandler.handleError(error, mainWindow, await getValidatedAdbPath(), 'adb:devices')
      return { 
        success: false, 
        error: adbError.message,
        errorCode: adbError.code,
        suggestions: adbError.suggestions
      }
    }
  })

  ipcMain.handle('adb:shell', async (event, command) => {
    try {
      const adbPath = await getValidatedAdbPath()
      const adbCommand = `"${adbPath}" shell "${command}"`
      const { stdout, stderr } = await execAsync(adbCommand)
      if (stderr) {
        throw new Error(stderr)
      }
      return { success: true, output: stdout.trim() }
    } catch (error) {
      const adbError = AdbErrorHandler.handleError(error, mainWindow, await getValidatedAdbPath(), 'adb:shell')
      return { 
        success: false, 
        error: adbError.message,
        errorCode: adbError.code,
        suggestions: adbError.suggestions
      }
    }
  })

  ipcMain.handle('adb:call', async (event, phoneNumber) => {
    try {
      const adbPath = await getValidatedAdbPath()
      const adbCommand = `"${adbPath}" shell am start -a android.intent.action.CALL -d tel:${phoneNumber}`
      const { stdout, stderr } = await execAsync(adbCommand)
      if (stderr) {
        throw new Error(stderr)
      }
      return { success: true, message: `Appel initié vers ${phoneNumber}` }
    } catch (error) {
      const adbError = AdbErrorHandler.handleError(error, mainWindow, await getValidatedAdbPath(), 'adb:call')
      return { 
        success: false, 
        error: adbError.message,
        errorCode: adbError.code,
        suggestions: adbError.suggestions
      }
    }
  })

  ipcMain.handle('adb:sms', async (event, phoneNumber, message) => {
    try {
      const adbPath = await getValidatedAdbPath()
      // Échapper les guillemets dans le message
      const escapedMessage = message.replace(/"/g, '\\"')
      const adbCommand = `"${adbPath}" shell am start -a android.intent.action.SENDTO -d sms:${phoneNumber} --es sms_body "${escapedMessage}"`
      const { stdout, stderr } = await execAsync(adbCommand)
      if (stderr) {
        throw new Error(stderr)
      }
      return { success: true, message: `SMS préparé pour ${phoneNumber}` }
    } catch (error) {
      const adbError = AdbErrorHandler.handleError(error, mainWindow, await getValidatedAdbPath(), 'adb:sms')
      return { 
        success: false, 
        error: adbError.message,
        errorCode: adbError.code,
        suggestions: adbError.suggestions
      }
    }
  })

  ipcMain.handle('adb:battery', async () => {
    try {
      const adbPath = await getValidatedAdbPath()
      const adbCommand = `"${adbPath}" shell dumpsys battery`
      const { stdout, stderr } = await execAsync(adbCommand)
      if (stderr) {
        throw new Error(stderr)
      }
      
      // Parser les informations de batterie
      const lines = stdout.split('\n')
      let level = 0
      let isCharging = false
      
      for (const line of lines) {
        if (line.includes('level:')) {
          level = parseInt(line.split(':')[1].trim())
        }
        if (line.includes('AC powered:') && line.includes('true')) {
          isCharging = true
        }
        if (line.includes('USB powered:') && line.includes('true')) {
          isCharging = true
        }
      }
      
      return { success: true, level, isCharging }
    } catch (error) {
      const adbError = AdbErrorHandler.handleError(error, mainWindow, await getValidatedAdbPath(), 'adb:battery')
      return { 
        success: false, 
        error: adbError.message,
        errorCode: adbError.code,
        suggestions: adbError.suggestions
      }
    }
  })

  ipcMain.handle('adb:restart-server', async () => {
    try {
      const adbPath = await getValidatedAdbPath()
      await execAsync(`"${adbPath}" kill-server`)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Attendre 1 seconde
      await execAsync(`"${adbPath}" start-server`)
      return { success: true, message: 'Serveur ADB redémarré' }
    } catch (error) {
      const adbError = AdbErrorHandler.handleError(error, mainWindow, await getValidatedAdbPath(), 'adb:restart-server')
      return { 
        success: false, 
        error: adbError.message,
        errorCode: adbError.code,
        suggestions: adbError.suggestions
      }
    }
  })

  // Handler pour arrêter le serveur ADB
  ipcMain.handle('adb:kill-server', async () => {
    try {
      console.log('🔄 Arrêt du serveur ADB...')
      const adbPath = await getValidatedAdbPath()
      await execAsync(`"${adbPath}" kill-server`)
      return { success: true, message: 'Serveur ADB arrêté' }
    } catch (error) {
      const adbError = AdbErrorHandler.handleError(error, mainWindow, await getValidatedAdbPath(), 'adb:kill-server')
      return { 
        success: false, 
        error: adbError.message,
        errorCode: adbError.code,
        suggestions: adbError.suggestions
      }
    }
  })

  // Handler pour démarrer le serveur ADB
  ipcMain.handle('adb:start-server', async () => {
    try {
      console.log('🚀 Démarrage du serveur ADB...')
      const adbPath = await getValidatedAdbPath()
      await execAsync(`"${adbPath}" start-server`)
      return { success: true, message: 'Serveur ADB démarré' }
    } catch (error) {
      const adbError = AdbErrorHandler.handleError(error, mainWindow, await getValidatedAdbPath(), 'adb:start-server')
      return { 
        success: false, 
        error: adbError.message,
        errorCode: adbError.code,
        suggestions: adbError.suggestions
      }
    }
  })

  // Handler pour nettoyer les clés d'autorisation ADB
  ipcMain.handle('adb:clean-auth-keys', async () => {
    try {
      console.log('🧹 Nettoyage des clés d\'autorisation ADB...')
      
      // Chemin vers le dossier .android de l'utilisateur
      const os = require('os')
      const path = require('path')
      const fs = require('fs')
      
      const androidFolder = path.join(os.homedir(), '.android')
      const adbKeyPath = path.join(androidFolder, 'adbkey')
      const adbKeyPubPath = path.join(androidFolder, 'adbkey.pub')
      
      console.log('🔍 Vérification des clés ADB...')
      console.log('  - Dossier .android:', androidFolder)
      console.log('  - Clé privée:', adbKeyPath)
      console.log('  - Clé publique:', adbKeyPubPath)
      
      let deletedFiles = []
      
      // Supprimer adbkey si il existe
      if (fs.existsSync(adbKeyPath)) {
        fs.unlinkSync(adbKeyPath)
        deletedFiles.push('adbkey')
        console.log('✅ Clé privée ADB supprimée')
      } else {
        console.log('ℹ️ Clé privée ADB n\'existe pas')
      }
      
      // Supprimer adbkey.pub si il existe
      if (fs.existsSync(adbKeyPubPath)) {
        fs.unlinkSync(adbKeyPubPath)
        deletedFiles.push('adbkey.pub')
        console.log('✅ Clé publique ADB supprimée')
      } else {
        console.log('ℹ️ Clé publique ADB n\'existe pas')
      }
      
      if (deletedFiles.length > 0) {
        return { 
          success: true, 
          message: `Clés supprimées: ${deletedFiles.join(', ')}`,
          deletedFiles 
        }
      } else {
        return { 
          success: true, 
          message: 'Aucune clé à supprimer (déjà propre)',
          deletedFiles: [] 
        }
      }
      
    } catch (error) {
      const adbError = AdbErrorHandler.handleError(error, mainWindow, undefined, 'adb:clean-auth-keys')
      return { 
        success: false, 
        error: adbError.message,
        errorCode: adbError.code,
        suggestions: adbError.suggestions
      }
    }
  })

  // Handler pour vérifier l'état des permissions ADB
  ipcMain.handle('adb:check-permissions', async () => {
    try {
      const adbPath = getAdbPath()
      const platformToolsPath = path.dirname(adbPath)
      
      console.log('🔍 Vérification des permissions ADB demandée par l\'interface utilisateur')
      
      const result = await PlatformToolsValidator.validateAndFixPlatformTools(platformToolsPath)
      
      return {
        success: true,
        isValid: result.isValid,
        readyForUse: result.readyForUse,
        validationSummary: result.validationSummary,
        fixSummary: result.fixSummary,
        adbPath: adbPath,
        platformToolsPath: platformToolsPath
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des permissions ADB:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        adbPath: getAdbPath()
      }
    }
  })

  // Handler pour forcer la correction des permissions ADB
  ipcMain.handle('adb:fix-permissions', async () => {
    try {
      const adbPath = getAdbPath()
      const platformToolsPath = path.dirname(adbPath)
      
      console.log('🔧 Correction forcée des permissions ADB demandée par l\'interface utilisateur')
      
      const result = await PlatformToolsValidator.validateAndFixPlatformTools(platformToolsPath)
      
      if (result.readyForUse) {
        return {
          success: true,
          message: 'Permissions ADB corrigées avec succès',
          fixSummary: result.fixSummary
        }
      } else {
        const failedBinaries = result.fixSummary?.fixResults
          .filter(r => !r.success)
          .map(r => r.filePath) || []
        
        const instructions = PlatformToolsValidator.generateManualFixInstructions(
          platformToolsPath,
          failedBinaries
        )
        
        return {
          success: false,
          message: 'Correction automatique échouée, intervention manuelle requise',
          instructions: instructions,
          failedBinaries: failedBinaries
        }
      }
    } catch (error) {
      const adbError = AdbErrorHandler.handleError(error, mainWindow, getAdbPath(), 'adb:fix-permissions')
      return {
        success: false,
        error: adbError.message,
        errorCode: adbError.code,
        suggestions: adbError.suggestions
      }
    }
  })

  // Handler pour obtenir un rapport de diagnostic ADB complet
  ipcMain.handle('adb:get-diagnostic-report', async () => {
    try {
      const adbPath = getAdbPath()
      const platformToolsPath = path.dirname(adbPath)
      
      console.log('📋 Génération du rapport de diagnostic ADB...')
      
      // Générer le rapport de base
      let report = AdbErrorHandler.generateDiagnosticReport(adbPath, platformToolsPath)
      
      // Ajouter les informations de validation
      const validationResult = await PlatformToolsValidator.validateAndFixPlatformTools(platformToolsPath)
      
      report += '\n\n--- Validation des binaires ---\n'
      report += `Dossier valide: ${validationResult.isValid}\n`
      report += `Prêt à l'utilisation: ${validationResult.readyForUse}\n`
      report += `Total binaires: ${validationResult.validationSummary.totalBinaries}\n`
      report += `Binaires exécutables: ${validationResult.validationSummary.executableBinaries}\n`
      report += `Binaires critiques manquants: ${validationResult.validationSummary.criticalBinariesMissing.join(', ') || 'Aucun'}\n`
      
      if (validationResult.validationSummary.validationDetails.length > 0) {
        report += '\n--- Détails des binaires ---\n'
        validationResult.validationSummary.validationDetails.forEach(binary => {
          report += `${binary.binaryName}: ${binary.exists ? 'Existe' : 'Manquant'}, `
          report += `${binary.isExecutable ? 'Exécutable' : 'Non-exécutable'}, `
          report += `Permissions: ${binary.permissions}\n`
        })
      }
      
      if (validationResult.fixSummary) {
        report += '\n--- Résultats des corrections ---\n'
        report += `Corrections tentées: ${validationResult.fixSummary.totalAttempted}\n`
        report += `Corrections réussies: ${validationResult.fixSummary.successfulFixes}\n`
        report += `Corrections échouées: ${validationResult.fixSummary.failedFixes}\n`
        
        if (validationResult.fixSummary.fixResults.length > 0) {
          report += '\n--- Détails des corrections ---\n'
          validationResult.fixSummary.fixResults.forEach(fix => {
            report += `${fix.filePath}: ${fix.success ? 'Succès' : 'Échec'}`
            if (fix.error) {
              report += ` (${fix.error})`
            }
            report += '\n'
          })
        }
      }
      
      // Test de connectivité ADB
      report += '\n--- Test de connectivité ADB ---\n'
      try {
        const testResult = await execAsync(`"${adbPath}" version`)
        report += `Version ADB: ${testResult.stdout.split('\n')[0]}\n`
        report += 'Test de connectivité: Succès\n'
      } catch (error) {
        report += `Test de connectivité: Échec (${error instanceof Error ? error.message : String(error)})\n`
      }
      
      return {
        success: true,
        report: report,
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      const adbError = AdbErrorHandler.handleError(error, mainWindow, getAdbPath(), 'adb:get-diagnostic-report')
      return {
        success: false,
        error: adbError.message,
        errorCode: adbError.code,
        suggestions: adbError.suggestions
      }
    }
  })

  ipcMain.handle('adb:send-sms', async (event, phoneNumber, messageBody) => {
    try {
      const adbPath = await getValidatedAdbPath()
      // Normaliser le numéro de téléphone pour plus de compatibilité
      let internationalNumber = phoneNumber
      if (phoneNumber.startsWith('0') && phoneNumber.length === 10) {
        internationalNumber = "+33" + phoneNumber.substring(1)
      }
      
      // Encoder le message pour l'URL
      const encodedMessage = encodeURIComponent(messageBody)
      
      // Essayer plusieurs approches dans l'ordre
      const approaches = [
        // 1. Intent direct vers Messages de Google
        `"${getAdbPath()}" shell am start -a android.intent.action.SENDTO -d "sms:${internationalNumber}?body=${encodedMessage}"`,
        // 2. Intent générique SENDTO
        `"${getAdbPath()}" shell am start -a android.intent.action.SENDTO -d "sms:${phoneNumber}" --es sms_body "${messageBody}"`,
        // 3. Intent SEND générique
        `"${getAdbPath()}" shell am start -a android.intent.action.SEND -t text/plain --es android.intent.extra.TEXT "${messageBody}" --es address "${internationalNumber}"`
      ]
      
      let lastError = ""
      
      for (const [index, command] of approaches.entries()) {
        try {
          console.log(`[ADB] Tentative ${index + 1}: ${command}`)
          const { stdout, stderr } = await execAsync(command)
          
          if (!stderr || stderr.includes('Warning') || stderr.includes('Starting:')) {
            return { 
              success: true, 
              message: `SMS préparé avec succès (méthode ${index + 1})` 
            }
          }
          
          lastError = stderr
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error)
          console.log(`[ADB] Méthode ${index + 1} échouée: ${lastError}`)
        }
      }
      
      // Si toutes les approches ont échoué
      throw new Error(`Toutes les méthodes ont échoué. Dernière erreur: ${lastError}`)
      
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  /**
   * FONCTION RÉOUVERTURE APPLICATION TÉLÉPHONE
   * Rouvre l'app Téléphone Android après raccrochage pour éviter les appels en arrière-plan
   */
  const reopenPhoneApp = async (): Promise<void> => {
    try {
      console.log(`📱 [REOPEN_PHONE] Réouverture de l'application Téléphone...`)
      
      // Pause de 200ms pour laisser le temps au raccrochage de s'effectuer
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Méthode 1: Ouvrir via l'intent dialer (le plus rapide)
      try {
        await execAsync(`"${getAdbPath()}" shell am start -a android.intent.action.CALL_BUTTON`)
        console.log(`✅ [REOPEN_PHONE] App Téléphone rouverte via CALL_BUTTON`)
        return
      } catch (error1) {
        console.log(`⚠️ [REOPEN_PHONE] CALL_BUTTON échoué: ${error1}`)
      }
      
      // Méthode 2: Ouvrir via le package dialer standard
      try {
        await execAsync(`"${getAdbPath()}" shell am start -n com.android.dialer/.DialtactsActivity`)
        console.log(`✅ [REOPEN_PHONE] App Téléphone rouverte via package dialer`)
        return
      } catch (error2) {
        console.log(`⚠️ [REOPEN_PHONE] Package dialer échoué: ${error2}`)
      }
      
      // Méthode 3: Intent téléphone générique
      try {
        await execAsync(`"${getAdbPath()}" shell am start -a android.intent.action.DIAL`)
        console.log(`✅ [REOPEN_PHONE] App Téléphone rouverte via DIAL intent`)
        return
      } catch (error3) {
        console.log(`⚠️ [REOPEN_PHONE] DIAL intent échoué: ${error3}`)
      }
      
      console.log(`❌ [REOPEN_PHONE] Impossible de rouvrir l'app Téléphone`)
      
    } catch (error) {
      console.error(`❌ [REOPEN_PHONE] Erreur critique:`, error)
    }
  }

  /**
   * HANDLER RACCROCHAGE ADB ULTRA-ROBUSTE
   * Implémente les 4 meilleures méthodes de raccrochage basées sur:
   * - https://developer.android.com/studio/command-line/adb
   * - https://techblogs.42gears.com/using-adb-command-to-make-a-call-reject-a-call-and-sending-receiving-a-message/
   */
  ipcMain.handle('adb:end-call', async () => {
    try {
      console.log(`📞 [ADB_ENDCALL] Début raccrochage ultra-robuste...`)
      
      // Méthode 1: KEYCODE_ENDCALL (recommandée officiellement)
      console.log(`🔧 [ADB_ENDCALL] Tentative 1: KEYCODE_ENDCALL`)
      try {
        const { stdout: stdout1, stderr: stderr1 } = await execAsync(`"${getAdbPath()}" shell input keyevent KEYCODE_ENDCALL`)
        if (!stderr1 || stderr1.includes('Warning')) {
          console.log(`✅ [ADB_ENDCALL] KEYCODE_ENDCALL réussi`)
          
          // Rouvrir immédiatement l'application Téléphone
          await reopenPhoneApp()
          
          return { success: true, message: 'Appel raccroché via KEYCODE_ENDCALL' }
        }
        console.log(`⚠️ [ADB_ENDCALL] KEYCODE_ENDCALL stderr: ${stderr1}`)
      } catch (error1) {
        console.log(`❌ [ADB_ENDCALL] KEYCODE_ENDCALL échoué: ${error1}`)
      }
      
      // Méthode 2: Code numérique 6 (KEYCODE_ENDCALL)
      console.log(`🔧 [ADB_ENDCALL] Tentative 2: Code numérique 6`)
      try {
        const { stdout: stdout2, stderr: stderr2 } = await execAsync(`"${getAdbPath()}" shell input keyevent 6`)
        if (!stderr2 || stderr2.includes('Warning')) {
          console.log(`✅ [ADB_ENDCALL] Code numérique 6 réussi`)
          
          // Rouvrir immédiatement l'application Téléphone
          await reopenPhoneApp()
          
          return { success: true, message: 'Appel raccroché via code numérique 6' }
        }
        console.log(`⚠️ [ADB_ENDCALL] Code numérique 6 stderr: ${stderr2}`)
      } catch (error2) {
        console.log(`❌ [ADB_ENDCALL] Code numérique 6 échoué: ${error2}`)
      }
      
      // Méthode 3: Service telephony (méthode système)
      console.log(`🔧 [ADB_ENDCALL] Tentative 3: Service telephony`)
      try {
        const { stdout: stdout3, stderr: stderr3 } = await execAsync(`"${getAdbPath()}" shell service call phone 5`)
        if (!stderr3 || stderr3.includes('Warning')) {
          console.log(`✅ [ADB_ENDCALL] Service telephony réussi`)
          
          // Rouvrir immédiatement l'application Téléphone
          await reopenPhoneApp()
          
          return { success: true, message: 'Appel raccroché via service telephony' }
        }
        console.log(`⚠️ [ADB_ENDCALL] Service telephony stderr: ${stderr3}`)
      } catch (error3) {
        console.log(`❌ [ADB_ENDCALL] Service telephony échoué: ${error3}`)
      }
      
      // Méthode 4: Simulation appui double bouton Power (dernier recours)
      console.log(`🔧 [ADB_ENDCALL] Tentative 4: Double Power Button`)
      try {
        await execAsync(`"${getAdbPath()}" shell input keyevent KEYCODE_POWER`)
        await new Promise(resolve => setTimeout(resolve, 500)) // Pause 0.5 sec
        await execAsync(`"${getAdbPath()}" shell input keyevent KEYCODE_POWER`)
        
        console.log(`✅ [ADB_ENDCALL] Double Power Button exécuté`)
        
        // Rouvrir immédiatement l'application Téléphone
        await reopenPhoneApp()
        
        return { success: true, message: 'Tentative raccrochage via double Power button' }
      } catch (error4) {
        console.log(`❌ [ADB_ENDCALL] Double Power Button échoué: ${error4}`)
      }
      
      // Si toutes les méthodes échouent
      console.log(`❌ [ADB_ENDCALL] Toutes les méthodes de raccrochage ont échoué`)
      return { 
        success: false, 
        error: 'Impossible de raccrocher: toutes les méthodes ADB ont échoué' 
      }
      
    } catch (error) {
      console.error(`❌ [ADB_ENDCALL] Erreur critique:`, error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }
    }
  })

  // Enregistrer les raccourcis globaux pour les touches de fonction F1-F10
  // Ultra-robuste avec debugging détaillé
  const registerFnKeys = () => {
    try {
      console.log('🔧 [ELECTRON_FN] Début enregistrement des raccourcis globaux...')
      
      // Nettoyer les raccourcis existants au cas où
      globalShortcut.unregisterAll()
      
      const registeredKeys: string[] = []
      const failedKeys: string[] = []
      
      for (let i = 1; i <= 10; i++) {
        const keyName = `F${i}`
        try {
          const success = globalShortcut.register(keyName, () => {
            console.log(`🔧 [ELECTRON_FN] ${keyName} pressé, envoi à la fenêtre renderer...`)
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('global-fn-key', keyName)
            }
          })
          if (success) {
            registeredKeys.push(keyName)
          } else {
            failedKeys.push(keyName)
          }
        } catch (error) {
          failedKeys.push(keyName)
        }
      }
      
      if (registeredKeys.length > 0) {
        console.log(`🎉 Raccourcis enregistrés: ${registeredKeys.join(', ')}`)
      }
      if (failedKeys.length > 0) {
        console.warn(`❌ Raccourcis non enregistrés: ${failedKeys.join(', ')}`)
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement des raccourcis:', error)
    }
  }

  registerFnKeys()
})
