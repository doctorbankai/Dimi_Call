import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CATEGORY_DETAILS, CATEGORY_ORDER } from './constants';
import { PreQualificationUpload } from './components/PreQualificationUpload';
import { PreQualificationClassifier } from './components/PreQualificationClassifier';
import { PreQualificationSummary } from './components/PreQualificationSummary';
import type { ClassificationMap, PreQualificationStep, ProspectProfile } from './types';
import { ProspectCategory } from './types';

const buildId = (index: number) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${index}`;
};

export const PreQualificationPage: React.FC = () => {
  const [step, setStep] = useState<PreQualificationStep>('upload');
  const [profiles, setProfiles] = useState<ProspectProfile[]>([]);
  const [classifications, setClassifications] = useState<ClassificationMap>({});

  const stats = useMemo(() => {
    const counts: Record<ProspectCategory, number> = {
      [ProspectCategory.Baleine]: 0,
      [ProspectCategory.Poisson]: 0,
      [ProspectCategory.Premature]: 0,
      [ProspectCategory.Inexploitable]: 0,
    };
    profiles.forEach((profile) => {
      const status = profile.status || classifications[profile.id];
      if (status) counts[status] = (counts[status] || 0) + 1;
    });
    const total = profiles.length;
    const classified = Object.values(counts).reduce((acc, value) => acc + value, 0);
    return { counts, total, classified };
  }, [classifications, profiles]);

  const handleDataLoaded = (loadedProfiles: ProspectProfile[]) => {
    const prepared = loadedProfiles.map((profile, index) => ({
      ...profile,
      id: profile.id || buildId(index),
      status: profile.status,
    }));
    setProfiles(prepared);
    setClassifications({});
    setStep('classify');
  };

  const handleProfileUpdate = (updatedProfile: ProspectProfile) => {
    setProfiles((prev) => prev.map((profile) => (profile.id === updatedProfile.id ? updatedProfile : profile)));
    if (updatedProfile.status) {
      setClassifications((prev) => ({ ...prev, [updatedProfile.id]: updatedProfile.status as ProspectCategory }));
    }
  };

  const handleClassificationComplete = (finalMap: ClassificationMap) => {
    setClassifications(finalMap);
    setStep('summary');
  };

  const handleRestart = () => {
    setProfiles([]);
    setClassifications({});
    setStep('upload');
  };

  const exportToExcel = () => {
    if (profiles.length === 0) return;

    const dataToExport = profiles.map((profile) => ({
      Prénom: profile.prenom,
      Nom: profile.nom,
      Statut: classifications[profile.id] || profile.status || 'Non classé',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pré-qualification');
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `prequalification_${date}.xlsx`);
  };

  // Importer un nouveau fichier à tout moment
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const handleReplaceFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: ['prenom', 'nom'], raw: false, defval: '' }) as Array<{
          prenom?: string;
          nom?: string;
        }>;
        const parsed = json
          .slice(1)
          .map((row, index) => ({
            id: `${Date.now()}-${index}`,
            prenom: (row.prenom || '').toString().trim(),
            nom: (row.nom || '').toString().trim(),
          }))
          .filter((p) => p.prenom && p.nom);

        if (parsed.length > 0) {
          handleDataLoaded(parsed);
          setStep('classify');
        }
      } catch (error) {
        console.error('[Pré-qualification] Impossible de charger le nouveau fichier', error);
      }
    };
    reader.readAsBinaryString(file);
  };
  const triggerReplaceFile = () => replaceFileInputRef.current?.click();

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Prospects</p>
          <h1 className="text-2xl font-semibold leading-tight">Pré-qualification</h1>
          <p className="text-sm text-muted-foreground">
            Importez un fichier Excel, ouvrez LinkedIn automatiquement, classez vos prospects en un clin d&apos;œil.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            ref={replaceFileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleReplaceFile(file);
            }}
          />
          <Button variant="outline" size="sm" onClick={triggerReplaceFile}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Importer un autre fichier
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel} disabled={profiles.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <Card className="border bg-card/80 shadow-sm">
        <CardContent className="p-4">
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
            {CATEGORY_ORDER.map((category) => {
              const details = CATEGORY_DETAILS[category];
              const count = stats.counts[category] || 0;
              const accent =
                category === ProspectCategory.Baleine
                  ? 'from-sky-500/10 to-sky-100/40 border-sky-200'
                  : category === ProspectCategory.Poisson
                  ? 'from-emerald-500/10 to-emerald-100/40 border-emerald-200'
                  : category === ProspectCategory.Premature
                  ? 'from-amber-500/10 to-amber-100/40 border-amber-200'
                  : 'from-rose-500/10 to-rose-100/40 border-rose-200';
              return (
                <div
                  key={category}
                  className={`flex items-center justify-between gap-3 rounded-xl border bg-gradient-to-br px-4 py-3 shadow-sm ${accent}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-inner ring-1 ring-black/5">
                      {details.icon}
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-semibold">{details.label}</span>
                      <span className="text-xs text-muted-foreground">Total: {count}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    {count}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-1 flex-col gap-3 min-h-0">
        {step === 'upload' ? (
          <PreQualificationUpload onDataLoaded={handleDataLoaded} />
        ) : step === 'classify' ? (
          <PreQualificationClassifier
            initialProfiles={profiles}
            onComplete={handleClassificationComplete}
            onProfileUpdate={handleProfileUpdate}
          />
        ) : (
          <PreQualificationSummary
            classifications={classifications}
            profiles={profiles}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
};

export default PreQualificationPage;
