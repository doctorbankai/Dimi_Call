import React, { useState, useCallback } from 'react';
import type { Profile } from '../types';

declare var XLSX: any;

interface FileUploadProps {
    onDataLoaded: (profiles: Profile[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const processFile = useCallback((file: File) => {
        setError(null);
        if (!file || !file.type.match(/spreadsheetml.sheet|ms-excel/)) {
            setError("Veuillez sélectionner un fichier Excel valide (.xlsx, .xls).");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, {
                    header: ["prenom", "nom"] // Explicitly map columns
                });
                
                // Skip header row if it exists
                const profiles = (json as any[]).slice(1).filter(p => p.nom && p.prenom);

                if (profiles.length === 0) {
                     setError("Aucun profil avec 'nom' et 'prénom' trouvé. Assurez-vous que les colonnes A et B contiennent ces données.");
                     return;
                }

                onDataLoaded(profiles as Profile[]);
            } catch (err) {
                console.error(err);
                setError("Erreur lors de la lecture du fichier. Est-il corrompu?");
            }
        };
        reader.onerror = () => {
             setError("Impossible de lire le fichier.");
        }
        reader.readAsBinaryString(file);
    }, [onDataLoaded]);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div className="max-w-3xl mx-auto text-center mt-10 p-6 bg-slate-800 rounded-2xl shadow-2xl shadow-slate-950/50 border border-slate-700">
            <h2 className="text-2xl font-semibold text-white mb-2">Importer une liste de profils</h2>
            <p className="text-slate-400 mb-6">Importez un fichier Excel (.xlsx, .xls). La colonne A doit contenir les prénoms, la colonne B les noms.</p>
            
            <div className="bg-amber-900/30 border border-amber-700/50 text-amber-300 px-4 py-3 rounded-lg mb-6 text-sm text-left">
                <p><span className="font-bold">Important :</span> Pour que la recherche de profil fonctionne correctement, veuillez vous assurer d'être déjà connecté à votre compte LinkedIn dans un autre onglet de votre navigateur.</p>
            </div>

            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-10 transition-all duration-300 ${isDragging ? 'border-cyan-400 bg-slate-700/50' : 'border-slate-600 hover:border-slate-500'}`}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                />
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
                    <svg className="w-16 h-16 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="text-slate-400"><span className="font-semibold text-cyan-400">Cliquez pour choisir un fichier</span> ou glissez-déposez</p>
                    <p className="text-xs text-slate-500">Fichiers Excel (.xlsx, .xls)</p>
                </label>
            </div>
            {error && <p className="mt-4 text-red-400 bg-red-900/50 px-4 py-2 rounded-md">{error}</p>}
        </div>
    );
};

export default FileUpload;