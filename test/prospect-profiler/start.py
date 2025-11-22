#!/usr/bin/env python3
"""
Script pour lancer automatiquement le site Prospect Profiler avec pnpm
"""

import os
import sys
import subprocess
import platform
import time
from pathlib import Path

def check_npm_installed():
    """Vérifie si npm est installé sur le système"""
    try:
        result = subprocess.run(['npm', '--version'], 
                              capture_output=True, text=True, check=True)
        print(f"✅ npm version {result.stdout.strip()} détecté")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ npm n'est pas installé")
        print("📦 Installez Node.js depuis: https://nodejs.org/")
        return False

def install_pnpm():
    """Installe pnpm globalement via npm"""
    print("📦 Installation de pnpm via npm...")
    try:
        subprocess.run(['npm', 'install', '-g', 'pnpm'], check=True)
        print("✅ pnpm installé avec succès")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors de l'installation de pnpm: {e}")
        print("🔍 Essayez d'installer pnpm manuellement: npm install -g pnpm")
        return False

def find_pnpm_path():
    """Trouve le chemin vers pnpm sur Windows"""
    system = platform.system().lower()
    
    if system == "windows":
        # Chemins typiques où pnpm peut être installé sur Windows
        possible_paths = [
            # npm global install
            os.path.join(os.path.expanduser("~"), "AppData", "Roaming", "npm", "pnpm.cmd"),
            os.path.join(os.path.expanduser("~"), "AppData", "Roaming", "npm", "pnpm.ps1"),
            # pnpm standalone
            os.path.join(os.path.expanduser("~"), "AppData", "Local", "pnpm", "pnpm.exe"),
            # Program Files
            "C:\\Program Files\\nodejs\\pnpm.cmd",
            "C:\\Program Files\\nodejs\\pnpm.ps1",
            # npm global install (alternative)
            os.path.join(os.path.expanduser("~"), "AppData", "Roaming", "npm", "node_modules", "pnpm", "bin", "pnpm.cmd"),
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                print(f"🔍 pnpm trouvé à: {path}")
                return path
    
    return "pnpm"  # Retourne "pnpm" pour les autres systèmes ou si pas trouvé

def check_pnpm_installed():
    """Vérifie si pnpm est installé sur le système et l'installe si nécessaire"""
    pnpm_path = find_pnpm_path()
    
    try:
        result = subprocess.run([pnpm_path, '--version'], 
                              capture_output=True, text=True, check=True)
        print(f"✅ pnpm version {result.stdout.strip()} détecté")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ pnpm n'est pas installé")
        
        # Vérifie si npm est disponible pour installer pnpm
        if check_npm_installed():
            print("🔄 Tentative d'installation automatique de pnpm...")
            if install_pnpm():
                # Vérifie à nouveau après installation
                time.sleep(2)  # Petit délai pour que l'installation se termine
                try:
                    pnpm_path = find_pnpm_path()
                    result = subprocess.run([pnpm_path, '--version'], 
                                          capture_output=True, text=True, check=True)
                    print(f"✅ pnpm version {result.stdout.strip()} installé avec succès")
                    return True
                except (subprocess.CalledProcessError, FileNotFoundError):
                    print("❌ pnpm n'a pas pu être installé automatiquement")
                    print("📦 Installez pnpm manuellement avec: npm install -g pnpm")
                    print("🔍 Ou téléchargez-le depuis: https://pnpm.io/installation")
                    return False
            else:
                return False
        else:
            print("📦 Installez pnpm avec: npm install -g pnpm")
            print("🔍 Ou téléchargez-le depuis: https://pnpm.io/installation")
            return False

def check_node_modules():
    """Vérifie si les dépendances sont installées"""
    pnpm_path = find_pnpm_path()
    
    if not Path("node_modules").exists():
        print("📦 Installation des dépendances avec pnpm...")
        try:
            subprocess.run([pnpm_path, 'install'], check=True)
            print("✅ Dépendances installées avec succès")
        except subprocess.CalledProcessError as e:
            print(f"❌ Erreur lors de l'installation: {e}")
            return False
    else:
        print("✅ Dépendances déjà installées")
    return True

def start_dev_server():
    """Lance le serveur de développement"""
    pnpm_path = find_pnpm_path()
    
    print("🚀 Lancement du serveur de développement...")
    print("🌐 Le site sera accessible sur: http://localhost:5173")
    print("⏹️  Appuyez sur Ctrl+C pour arrêter le serveur")
    print("-" * 50)
    
    try:
        # Lance le serveur de développement avec pnpm
        subprocess.run([pnpm_path, 'dev'], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Serveur arrêté par l'utilisateur")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors du lancement du serveur: {e}")
        return False
    return True

def open_browser():
    """Ouvre le navigateur automatiquement"""
    url = "http://localhost:5173"
    
    # Attendre un peu que le serveur démarre
    print("⏳ Attente du démarrage du serveur...")
    time.sleep(3)
    
    system = platform.system().lower()
    
    try:
        if system == "darwin":  # macOS
            subprocess.run(['open', url])
        elif system == "windows":
            subprocess.run(['start', url], shell=True)
        else:  # Linux
            subprocess.run(['xdg-open', url])
        print(f"🌐 Navigateur ouvert sur {url}")
    except Exception as e:
        print(f"⚠️  Impossible d'ouvrir automatiquement le navigateur: {e}")
        print(f"🌐 Ouvrez manuellement: {url}")

def main():
    """Fonction principale"""
    print("🎯 Prospect Profiler - Lanceur automatique")
    print("=" * 50)
    
    # Vérifications préalables
    if not check_pnpm_installed():
        sys.exit(1)
    
    if not check_node_modules():
        sys.exit(1)
    
    # Lance le serveur et ouvre automatiquement le navigateur
    if start_dev_server():
        open_browser()
    else:
        sys.exit(1)

if __name__ == "__main__":
    main() 