import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, UploadCloud, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getCategoryDetails, CATEGORY_ORDER } from './constants';
import { PreQualificationUpload } from './components/PreQualificationUpload';
import { PreQualificationClassifier } from './components/PreQualificationClassifier';
import { PreQualificationSummary } from './components/PreQualificationSummary';
import { CategoryNamesDialog } from './components/CategoryNamesDialog';
import { CategoryNamesService } from './services/categoryNamesService';
import type { ClassificationMap, PreQualificationStep, ProspectProfile } from './types';
import { ProspectCategory } from './types';
import { cn } from '@/lib/utils';

const buildId = (index: number) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${index}`;
};

const STORAGE_KEY = 'dimicall-prequalification-state';

interface SavedState {
  step: PreQualificationStep;
  profiles: ProspectProfile[];
  classifications: ClassificationMap;
}

const loadSavedState = (): SavedState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as SavedState;
    // Validation des données
    if (parsed && Array.isArray(parsed.profiles) && typeof parsed.classifications === 'object' && ['upload', 'classify', 'summary'].includes(parsed.step)) {
      return parsed;
    }
  } catch (error) {
    console.error('[Pré-qualification] Erreur lors du chargement de l\'état sauvegardé', error);
  }
  return null;
};

const saveState = (step: PreQualificationStep, profiles: ProspectProfile[], classifications: ClassificationMap) => {
  try {
    const state: SavedState = { step, profiles, classifications };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[Pré-qualification] Erreur lors de la sauvegarde de l\'état', error);
  }
};

const clearSavedState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[Pré-qualification] Erreur lors de la suppression de l\'état sauvegardé', error);
  }
};

export const PreQualificationPage: React.FC = () => {
  const savedState = loadSavedState();
  
  // Restaurer les profils avec leurs statuts depuis les classifications sauvegardées
  const restoredProfiles = savedState?.profiles.map(profile => ({
    ...profile,
    status: savedState.classifications[profile.id] || profile.status,
  })) || [];

  const [step, setStep] = useState<PreQualificationStep>(savedState?.step || 'upload');
  const [profiles, setProfiles] = useState<ProspectProfile[]>(restoredProfiles);
  const [classifications, setClassifications] = useState<ClassificationMap>(savedState?.classifications || {});
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [categoryNamesDialogOpen, setCategoryNamesDialogOpen] = useState(false);
  const [categoryNamesVersion, setCategoryNamesVersion] = useState(0);

  // Écouter les changements de noms de catégories
  useEffect(() => {
    const handleCategoryNamesChange = () => {
      setCategoryNamesVersion((prev) => prev + 1);
    };
    window.addEventListener('categoryNamesChanged', handleCategoryNamesChange);
    return () => window.removeEventListener('categoryNamesChanged', handleCategoryNamesChange);
  }, []);

  // Obtenir les détails de catégories à jour
  const categoryDetails = useMemo(() => getCategoryDetails(), [categoryNamesVersion]);

  // Sauvegarde automatique dans localStorage à chaque changement (sauf au montage initial)
  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }
    if (profiles.length > 0 || Object.keys(classifications).length > 0) {
      saveState(step, profiles, classifications);
    }
  }, [step, profiles, classifications, isInitialMount]);

  const stats = useMemo(() => {
    const counts: Record<ProspectCategory, number> = {
      [ProspectCategory.Baleine]: 0,
      [ProspectCategory.Poisson]: 0,
      [ProspectCategory.Premature]: 0,
      [ProspectCategory.Inexploitable]: 0,
      [ProspectCategory.Passer]: 0,
    };
    profiles.forEach((profile) => {
      const status = profile.status || classifications[profile.id];
      if (status) counts[status] = (counts[status] || 0) + 1;
    });
    const total = profiles.length;
    const classified = Object.values(counts).reduce((acc, value) => acc + value, 0);
    return { counts, total, classified };
  }, [classifications, profiles, categoryNamesVersion]);

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
    clearSavedState();
  };

  const exportToExcel = () => {
    if (profiles.length === 0) return;

    const allNames = CategoryNamesService.getAllNames();
    const dataToExport = profiles.map((profile) => {
      const category = classifications[profile.id] || profile.status;
      const statusLabel = category ? allNames[category] : 'Non classé';
      return {
        Prénom: profile.prenom,
        Nom: profile.nom,
        Statut: statusLabel,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pré-qualification');
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
    XLSX.writeFile(workbook, `Pre-qualification${timestamp}.xlsx`);
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
          // Nettoyer l'ancien état avant de charger le nouveau fichier
          clearSavedState();
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
    <div className="flex h-full flex-col space-y-3 xs:space-y-4 md:space-y-6 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-10 pb-4 sm:pb-6">
      <div className="w-full max-w-screen-2xl mx-auto space-y-4 sm:space-y-5 md:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between lg:items-center">
          <div className="space-y-1 sm:space-y-1.5 text-center md:text-left">
            <h1 className="text-xl xs:text-2xl md:text-3xl font-bold tracking-tight">Pré-qualification</h1>
            <p className="text-sm xs:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0">
              Qualifiez rapidement vos prospects via LinkedIn. Importez un fichier Excel et classez vos contacts.
            </p>
          </div>
          <div className="flex flex-col gap-2 xs:gap-3 xs:flex-row xs:flex-wrap xs:items-center xs:justify-end w-full md:w-auto">
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
            <div className="flex flex-col gap-2 xs:gap-3 xs:flex-row xs:flex-wrap w-full md:w-auto">
              {profiles.length > 0 && (
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 w-full">
                  <Button variant="outline" size="sm" onClick={triggerReplaceFile} className="w-full justify-center text-xs xs:text-sm">
                    <UploadCloud className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="truncate">Nouvel import</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToExcel} className="w-full justify-center text-xs xs:text-sm">
                    <Download className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Exporter
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCategoryNamesDialogOpen(true)}
                className="w-full xs:w-auto justify-center text-xs xs:text-sm"
              >
                <Settings2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Personnaliser
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Minimalist Stats Section */}
        {profiles.length > 0 && (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 rounded-lg border bg-card/50 p-2.5 sm:p-3 md:p-4 shadow-sm">
            {CATEGORY_ORDER.map((category) => {
              const details = categoryDetails[category];
              const count = stats.counts[category] || 0;

              return (
                <div key={category} className="flex items-center gap-2 sm:gap-3 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-md hover:bg-muted/40 transition-colors min-h-[68px] xs:min-h-[82px]">
                  <div
                    className={cn(
                      "p-1.5 sm:p-2 rounded-md bg-background shadow-sm text-muted-foreground shrink-0 [&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-5 sm:[&_svg]:w-5",
                      category === ProspectCategory.Baleine && "text-sky-500",
                      category === ProspectCategory.Poisson && "text-emerald-500",
                      category === ProspectCategory.Premature && "text-amber-500",
                      category === ProspectCategory.Inexploitable && "text-rose-500",
                      category === ProspectCategory.Passer && "text-gray-500"
                    )}
                  >
                    {details.icon}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                      {details.label}
                    </span>
                    <span className="text-base sm:text-lg md:text-xl font-bold leading-none">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-screen-2xl mx-auto min-h-0 rounded-lg sm:rounded-xl border bg-background shadow-sm overflow-hidden">
        <div className={cn(
          "h-full w-full overflow-y-auto",
          step === 'classify' ? "p-1 sm:p-2 md:p-3 lg:p-4 xl:p-6" : "p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 max-w-7xl mx-auto"
        )}>
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

      {/* Category Names Dialog */}
      <CategoryNamesDialog open={categoryNamesDialogOpen} onOpenChange={setCategoryNamesDialogOpen} />
    </div>
  );
};

export default PreQualificationPage;
