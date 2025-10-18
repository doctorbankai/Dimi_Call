# Test SMS avec URLs

## Problème
- D0 Visio fonctionne (pas d'URL)
- Les 3 autres ne fonctionnent pas (contiennent des URLs)

## Hypothèse
`encodeURIComponent()` encode les URLs, ce qui empêche Android de les décoder correctement dans `?body=`

## Solution testée
1. Inverser l'ordre des méthodes : essayer `--es sms_body` en PREMIER
2. `--es sms_body` passe le texte brut sans encodage URI
3. Échapper seulement les backslashes et guillemets doubles

## Commandes testées (dans l'ordre)
1. `adb shell am start -a android.intent.action.SENDTO -d "smsto:+33..." --es sms_body "message"`
2. `adb shell am start -a android.intent.action.VIEW -d "smsto:+33..." --es sms_body "message"`
3. `adb shell am start -a android.intent.action.SENDTO -d "sms:+33..." --es sms_body "message"`
4. `adb shell am start -a android.intent.action.VIEW -d "sms:+33..." --es sms_body "message"`

## Test manuel
Pour tester manuellement, exécuter dans un terminal :

```bash
adb shell am start -a android.intent.action.SENDTO -d "smsto:+33695905812" --es sms_body "Test avec URL: https://arcanis-conseil.fr et caractères spéciaux (parenthèses)"
```

Si ça fonctionne, le message devrait apparaître pré-rempli avec l'URL intacte.

## Résultat attendu
Les 4 modèles SMS devraient maintenant fonctionner, y compris ceux avec URLs.
