import React, { useCallback, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, ShieldCheck, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProspectProfile } from '../types';

type PreQualificationUploadProps = {
  onDataLoaded: (profiles: ProspectProfile[]) => void;
};

const ACCEPTED_EXTENSIONS = ['xlsx', 'xls'];

const parseExcel = (file: File): Promise<ProspectProfile[]> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, {
          header: ['prenom', 'nom'],
          raw: false,
          defval: '',
        }) as Array<{ prenom?: string; nom?: string }>;

        const profiles = json
          .slice(1) // skip header row
          .map((row, index) => ({
            id: `${Date.now()}-${index}`,
            prenom: (row?.prenom || '').toString().trim(),
            nom: (row?.nom || '').toString().trim(),
          }))
          .filter((profile) => profile.prenom && profile.nom);

        resolve(profiles);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsBinaryString(file);
  });

export const PreQualificationUpload: React.FC<PreQualificationUploadProps> = ({ onDataLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !ACCEPTED_EXTENSIONS.includes(extension)) {
        setError('Veuillez sélectionner un fichier Excel (.xlsx ou .xls).');
        return;
      }

      try {
        const parsed = await parseExcel(file);
        if (parsed.length === 0) {
          setError("Aucun profil valide trouvé. Vérifiez que les colonnes A et B contiennent prénom et nom.");
          return;
        }
        onDataLoaded(parsed);
      } catch (err) {
        console.error('[Pré-qualification] Lecture Excel impossible', err);
        setError("Impossible de lire ce fichier. Vérifiez qu'il est bien un Excel valide.");
      }
    },
    [onDataLoaded]
  );

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      void handleFile(droppedFile);
    }
  };

  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      void handleFile(selectedFile);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center max-w-2xl mx-auto w-full px-2 sm:px-4 animate-in fade-in zoom-in duration-300">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
          <UploadCloud className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Importez vos prospects</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Glissez votre fichier Excel ici. Assurez-vous d'avoir les colonnes "Prénom" et "Nom".
        </p>
      </div>

      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full gap-4 rounded-xl border-2 border-dashed p-8 sm:p-12 transition-all duration-200 cursor-pointer hover:bg-muted/50',
          isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-muted-foreground/25',
          error ? 'border-destructive/50 bg-destructive/5' : ''
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={onSelectFile}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium">
            {isDragging ? "Déposez le fichier maintenant" : "Cliquez ou glissez le fichier ici"}
          </p>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs font-normal">.xlsx</Badge>
            <Badge variant="secondary" className="text-xs font-normal">.xls</Badge>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-6 animate-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-8 w-full">
        <Alert className="bg-muted/50 border-none">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-medium">Conseil Pro</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Connectez-vous à LinkedIn dans un autre onglet pour une expérience fluide.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default PreQualificationUpload;
