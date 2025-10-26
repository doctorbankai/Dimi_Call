# Nettoyage des Dossiers Dupliqués

## Problème

Les dossiers de contacts sont dupliqués :
- `Amélie Destailleur_+33681442204` (avec +)
- `Amélie Destailleur_33681442204` (sans +)

## Cause

Le système a créé des dossiers avec le `+` avant que je modifie le code pour l'enlever.

## Solution

### Étape 1 : Nettoyage Manuel (Recommandé)

**Option A : Supprimer manuellement les dossiers avec `+`**

1. Ouvrir `C:\DimiCall\` dans l'explorateur Windows
2. Trier par nom
3. Pour chaque paire de dossiers :
   - Vérifier si le dossier SANS `+` existe
   - Si oui, déplacer les fichiers du dossier AVEC `+` vers le dossier SANS `+`
   - Supprimer le dossier AVEC `+`

**Option B : Script PowerShell automatique**

Créer un fichier `cleanup-folders.ps1` :

```powershell
$baseDir = "C:\DimiCall"

# Get all folders with + in the name
$foldersWithPlus = Get-ChildItem -Path $baseDir -Directory | Where-Object { $_.Name -match '\+' }

foreach ($folder in $foldersWithPlus) {
    # Generate the name without +
    $newName = $folder.Name -replace '\+', ''
    $newPath = Join-Path $baseDir $newName
    
    Write-Host "Processing: $($folder.Name)"
    
    # Check if folder without + exists
    if (Test-Path $newPath) {
        Write-Host "  Target folder exists: $newName"
        
        # Move files from old folder to new folder
        $files = Get-ChildItem -Path $folder.FullName -File
        foreach ($file in $files) {
            $destPath = Join-Path $newPath $file.Name
            if (Test-Path $destPath) {
                Write-Host "    File already exists, skipping: $($file.Name)"
            } else {
                Move-Item -Path $file.FullName -Destination $destPath
                Write-Host "    Moved: $($file.Name)"
            }
        }
        
        # Remove old folder if empty
        if ((Get-ChildItem -Path $folder.FullName).Count -eq 0) {
            Remove-Item -Path $folder.FullName -Force
            Write-Host "  Removed empty folder: $($folder.Name)"
        }
    } else {
        # Rename folder (remove +)
        Rename-Item -Path $folder.FullName -NewName $newName
        Write-Host "  Renamed to: $newName"
    }
}

Write-Host "`nCleanup complete!"
```

Exécuter dans PowerShell (en tant qu'administrateur) :
```powershell
cd C:\DimiCall
.\cleanup-folders.ps1
```

### Étape 2 : Empêcher la Création de Nouveaux Doublons

Le code a déjà été modifié pour :
- Toujours enlever le `+` dans `generateContactFolderName`
- Vérifier d'abord sans `+`, puis avec `+` en fallback dans `ContactFiles`

### Étape 3 : Vérification

Après le nettoyage :
1. Ouvrir `C:\DimiCall\`
2. Vérifier qu'il n'y a plus de dossiers avec `+`
3. Relancer l'application
4. Vérifier que les fichiers apparaissent dans l'onglet "Fichiers" des contacts

## Résultat Attendu

- ✅ Un seul dossier par contact (sans `+`)
- ✅ Format standardisé : `Prenom_Nom_33XXXXXXXXX`
- ✅ Les fichiers sont visibles dans l'annuaire
- ✅ Pas de nouveaux doublons créés

## Alternative : Garder les Dossiers avec `+`

Si vous préférez garder les dossiers avec `+`, modifiez le code pour NE PAS enlever le `+` :

Dans `fileManagerService.ts`, ligne ~430 :
```typescript
// Avant
const normalizedPhone = telephone.replace(/[\s\-\.\(\)\+]/g, '');

// Après (garder le +)
const normalizedPhone = telephone.replace(/[\s\-\.\(\)]/g, '');
```

Puis supprimez les dossiers SANS `+`.

## Recommandation

Je recommande de **supprimer les dossiers avec `+`** car :
- Plus simple à taper
- Évite les problèmes d'encodage
- Standard dans les systèmes de fichiers
