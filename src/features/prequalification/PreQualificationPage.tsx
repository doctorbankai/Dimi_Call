import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CATEGORY_DETAILS, CATEGORY_ORDER } from './constants';
import { PreQualificationUpload } from './components/PreQualificationUpload';
import { PreQualificationClassifier } from './components/PreQualificationClassifier';
import { PreQualificationSummary } from './components/PreQualificationSummary';
import type { ClassificationMap, PreQualificationStep, ProspectProfile } from './types';
import { ProspectCategory } from './types';
import { cn } from '@/lib/utils';

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
    <div className="flex h-full flex-col space-y-4 sm:space-y-6 px-4 pb-6 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pré-qualification</h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Qualifiez rapidement vos prospects via LinkedIn. Importez un fichier Excel et classez vos contacts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
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
            {profiles.length > 0 && (
              <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
                <Button variant="outline" size="sm" onClick={triggerReplaceFile} className="w-full sm:w-auto justify-center">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  <span className="truncate">Nouvel import</span>
                </Button>
                <Button variant="outline" size="sm" onClick={exportToExcel} className="w-full sm:w-auto justify-center">
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Minimalist Stats Section */}
        {profiles.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 rounded-lg border bg-card/50 p-3 sm:p-4 shadow-sm">
            {CATEGORY_ORDER.map((category) => {
              const details = CATEGORY_DETAILS[category];
              const count = stats.counts[category] || 0;

              return (
                <div key={category} className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted/40 transition-colors">
                  <div
                    className={cn(
                      "p-2 rounded-md bg-background shadow-sm text-muted-foreground shrink-0 [&_svg]:h-5 [&_svg]:w-5",
                      category === ProspectCategory.Baleine && "text-sky-500",
                      category === ProspectCategory.Poisson && "text-emerald-500",
                      category === ProspectCategory.Premature && "text-amber-500",
                      category === ProspectCategory.Inexploitable && "text-rose-500"
                    )}
                  >
                    {details.icon}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                      {details.label}
                    </span>
                    <span className="text-lg sm:text-xl font-bold leading-none">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 rounded-xl border bg-background shadow-sm overflow-hidden">
        <div className="h-full w-full max-w-7xl mx-auto p-3 sm:p-6 lg:p-8">
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
    </div>
  );
};

export default PreQualificationPage;
