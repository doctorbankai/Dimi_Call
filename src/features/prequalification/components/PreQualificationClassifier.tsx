import React, { useEffect, useMemo } from 'react';
import { Linkedin, ArrowLeft, Clock3, Anchor } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CATEGORY_DETAILS, CATEGORY_ORDER } from '../constants';
import { useProspectProfiler } from '../hooks/useProspectProfiler';
import type { ClassificationMap, ProspectProfile } from '../types';

type PreQualificationClassifierProps = {
  initialProfiles: ProspectProfile[];
  onComplete: (classifications: ClassificationMap) => void;
  onProfileUpdate: (profile: ProspectProfile) => void;
};

export const PreQualificationClassifier: React.FC<PreQualificationClassifierProps> = ({
  initialProfiles,
  onComplete,
  onProfileUpdate,
}) => {
  const {
    currentProfile,
    nextProfile,
    classifications,
    classifyAndNext,
    goBack,
    canGoBack,
    isFinished,
    totalProfiles,
    currentIndex,
    completedCount,
    progress,
  } = useProspectProfiler(initialProfiles, onProfileUpdate);

  useEffect(() => {
    if (isFinished) {
      onComplete(classifications);
    }
  }, [classifications, isFinished, onComplete]);

  const linkedInSearchUrl = useMemo(() => {
    if (!currentProfile) return '';
    const query = encodeURIComponent(`${currentProfile.prenom} ${currentProfile.nom}`);
    return `https://www.linkedin.com/search/results/people/?keywords=${query}&origin=GLOBAL_SEARCH_HEADER`;
  }, [currentProfile]);

  const remainingQueue = useMemo(() => initialProfiles.slice(currentIndex + 1), [initialProfiles, currentIndex]);

  const openLinkedInWindow = (url: string) => {
    if (!url) return;
    window.open(url, 'linkedinWindow', 'width=1200,height=800,resizable,scrollbars');
  };

  useEffect(() => {
    if (currentProfile) {
      openLinkedInWindow(linkedInSearchUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfile]);

  if (!initialProfiles.length) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Aucun profil</CardTitle>
          <CardDescription>Importez un fichier pour démarrer la pré-qualification.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            Déposez un fichier Excel depuis l&apos;étape précédente.
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentFullName = currentProfile ? `${currentProfile.prenom} ${currentProfile.nom}` : 'Profils terminés';

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex flex-col">
            <CardTitle className="text-2xl leading-tight">{currentFullName}</CardTitle>
            <CardDescription>
              Recherches LinkedIn lancées automatiquement sur le profil en cours. Ajustez le statut en un clic.
            </CardDescription>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => openLinkedInWindow(linkedInSearchUrl)} disabled={!currentProfile}>
              <Linkedin className="mr-2 h-4 w-4" />
              Ouvrir LinkedIn
            </Button>
            <Button variant="outline" size="sm" onClick={goBack} disabled={!canGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Progression {Math.min(totalProfiles, currentIndex + 1)}/{totalProfiles} — {progress}%
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 min-h-0">
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {CATEGORY_ORDER.map((category) => {
              const details = CATEGORY_DETAILS[category];
              return (
                <Button
                  key={category}
                  type="button"
                  className={cn(
                    'h-auto items-center justify-start gap-3 rounded-xl px-4 py-3 text-left text-base font-semibold shadow-md transition-all duration-150',
                    details.buttonClass
                  )}
                  onClick={() => classifyAndNext(category)}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 shadow-inner">
                    {details.icon}
                  </span>
                  <span className="flex-1">
                    {details.label}
                    <span className="block text-xs font-normal opacity-80">{details.description}</span>
                  </span>
                </Button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={goBack} disabled={!canGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Revenir au précédent
            </Button>
            {nextProfile ? (
              <Badge variant="outline" className="text-xs">
                Profil suivant : {nextProfile.prenom} {nextProfile.nom}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Dernier profil en cours
              </Badge>
            )}
          </div>

          <div className="w-full">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-primary" />
                  <p className="font-semibold">File d&apos;attente</p>
                </div>
                <Badge variant="outline" className="ml-auto text-xs">
                  Restants : {remainingQueue.length}
                </Badge>
              </div>
              <ScrollArea className="mt-3 h-72 sm:h-96 w-full">
                <div className="space-y-2 pr-1">
                  {remainingQueue.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun autre profil à venir.</p>
                  ) : (
                    remainingQueue.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-background/70 shadow-sm">
                            <Anchor className="h-4 w-4 text-muted-foreground" />
                          </span>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {profile.prenom} {profile.nom}
                            </span>
                            <span className="text-xs text-muted-foreground">Recherche LinkedIn prête</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[11px] uppercase tracking-wide">
                          À venir
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreQualificationClassifier;
