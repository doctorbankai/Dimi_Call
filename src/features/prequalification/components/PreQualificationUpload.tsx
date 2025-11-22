import React, { useCallback, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, ShieldCheck, Info } from 'lucide-react';
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
    <Card className="border-dashed border-2 border-muted-foreground/30 shadow-none">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary shadow-inner shadow-primary/20">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <CardTitle className="text-xl">Importer une liste de prospects</CardTitle>
            <CardDescription>Colonne A : prénom, colonne B : nom. Formats acceptés : .xlsx, .xls.</CardDescription>
          </div>
          <Badge variant="outline" className="ml-auto text-xs">
            Étape 1/3
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="default" className="border border-amber-300/50 bg-amber-100/40 text-amber-900 dark:border-amber-400/40 dark:bg-amber-900/20 dark:text-amber-50">
          <ShieldCheck className="h-4 w-4" />
          <div className="flex flex-col">
            <AlertTitle>Astuce LinkedIn</AlertTitle>
            <AlertDescription className="text-sm">
              Connectez-vous à LinkedIn dans un autre onglet avant d&apos;importer pour que l&apos;ouverture automatique des profils fonctionne sans interruption.
            </AlertDescription>
          </div>
        </Alert>

        <div
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors',
            isDragging ? 'border-primary/70 bg-primary/5' : 'border-muted'
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
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={onSelectFile}
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-medium">Glissez-déposez votre fichier Excel</p>
            <p className="text-sm text-muted-foreground">ou cliquez pour le sélectionner</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Excel .xlsx</Badge>
            <Badge variant="outline">Excel .xls</Badge>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm ring-1 ring-muted">
            <Info className="h-4 w-4" />
            <span>Les lignes vides sont ignorées automatiquement</span>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              Sélectionner un fichier
            </Button>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Import impossible</AlertTitle>
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default PreQualificationUpload;
