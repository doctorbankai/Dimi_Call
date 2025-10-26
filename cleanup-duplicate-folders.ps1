# Script de nettoyage des dossiers dupliqués dans DimiCall
# Ce script supprime les dossiers avec + et garde ceux sans +

$baseDir = "C:\DimiCall"

Write-Host "=== Nettoyage des dossiers dupliqués DimiCall ===" -ForegroundColor Cyan
Write-Host "Répertoire: $baseDir`n" -ForegroundColor Yellow

# Vérifier que le répertoire existe
if (-not (Test-Path $baseDir)) {
    Write-Host "ERREUR: Le répertoire $baseDir n'existe pas!" -ForegroundColor Red
    exit 1
}

# Get all folders with + in the name
$foldersWithPlus = Get-ChildItem -Path $baseDir -Directory | Where-Object { $_.Name -match '\+' }

if ($foldersWithPlus.Count -eq 0) {
    Write-Host "Aucun dossier avec + trouvé. Nettoyage non nécessaire." -ForegroundColor Green
    exit 0
}

Write-Host "Trouvé $($foldersWithPlus.Count) dossier(s) avec + à traiter`n" -ForegroundColor Yellow

$moved = 0
$renamed = 0
$errors = 0

foreach ($folder in $foldersWithPlus) {
    # Generate the name without +
    $newName = $folder.Name -replace '\+', ''
    $newPath = Join-Path $baseDir $newName
    
    Write-Host "Traitement: $($folder.Name)" -ForegroundColor White
    
    try {
        # Check if folder without + exists
        if (Test-Path $newPath) {
            Write-Host "  → Dossier cible existe: $newName" -ForegroundColor Gray
            
            # Move files from old folder to new folder
            $files = Get-ChildItem -Path $folder.FullName -File -ErrorAction Stop
            
            if ($files.Count -eq 0) {
                Write-Host "  → Aucun fichier à déplacer" -ForegroundColor Gray
            } else {
                foreach ($file in $files) {
                    $destPath = Join-Path $newPath $file.Name
                    if (Test-Path $destPath) {
                        Write-Host "    ⚠ Fichier existe déjà, ignoré: $($file.Name)" -ForegroundColor Yellow
                    } else {
                        Move-Item -Path $file.FullName -Destination $destPath -ErrorAction Stop
                        Write-Host "    ✓ Déplacé: $($file.Name)" -ForegroundColor Green
                        $moved++
                    }
                }
            }
            
            # Remove old folder if empty or only contains subfolders
            $remainingItems = Get-ChildItem -Path $folder.FullName -ErrorAction Stop
            if ($remainingItems.Count -eq 0) {
                Remove-Item -Path $folder.FullName -Force -ErrorAction Stop
                Write-Host "  ✓ Dossier vide supprimé: $($folder.Name)" -ForegroundColor Green
            } else {
                Write-Host "  ⚠ Dossier non vide, conservation: $($folder.Name)" -ForegroundColor Yellow
            }
        } else {
            # Rename folder (remove +)
            Rename-Item -Path $folder.FullName -NewName $newName -ErrorAction Stop
            Write-Host "  ✓ Renommé en: $newName" -ForegroundColor Green
            $renamed++
        }
    } catch {
        Write-Host "  ✗ ERREUR: $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
    
    Write-Host ""
}

Write-Host "=== Résumé ===" -ForegroundColor Cyan
Write-Host "Fichiers déplacés: $moved" -ForegroundColor $(if ($moved -gt 0) { "Green" } else { "Gray" })
Write-Host "Dossiers renommés: $renamed" -ForegroundColor $(if ($renamed -gt 0) { "Green" } else { "Gray" })
Write-Host "Erreurs: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host "`nNettoyage terminé!" -ForegroundColor Cyan

if ($errors -eq 0) {
    Write-Host "✓ Tous les dossiers ont été traités avec succès" -ForegroundColor Green
} else {
    Write-Host "⚠ Certains dossiers n'ont pas pu être traités" -ForegroundColor Yellow
}
