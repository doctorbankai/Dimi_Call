import React, { useEffect, useMemo, useCallback } from 'react';
import { Linkedin, ArrowLeft, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CATEGORY_DETAILS, CATEGORY_ORDER } from '../constants';
import { useProspectProfiler } from '../hooks/useProspectProfiler';
import type { ClassificationMap, ProspectProfile } from '../types';
import { ProspectCategory } from '../types';

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
    classifications,
    classifyAndNext,
    goBack,
    canGoBack,
    isFinished,
    totalProfiles,
    currentIndex,
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

  const openLinkedInWindow = useCallback((url: string) => {
    if (!url) return;
    window.open(url, 'linkedinWindow', 'width=1200,height=800,resizable,scrollbars');
  }, []);

  useEffect(() => {
    if (currentProfile) {
      openLinkedInWindow(linkedInSearchUrl);
    }
  }, [currentProfile, linkedInSearchUrl, openLinkedInWindow]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!currentProfile) return;

      switch (event.key) {
        case '1':
          classifyAndNext(ProspectCategory.Baleine);
          break;
        case '2':
          classifyAndNext(ProspectCategory.Poisson);
          break;
        case '3':
          classifyAndNext(ProspectCategory.Premature);
          break;
        case '4':
          classifyAndNext(ProspectCategory.Inexploitable);
          break;
        case 'Backspace':
          if (canGoBack) goBack();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProfile, classifyAndNext, goBack, canGoBack]);

  if (!initialProfiles.length) return null;

  return (
    <div className="flex h-full w-full max-w-7xl mx-auto flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
      {/* Main Classification Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full gap-4 py-2 px-1 sm:px-2">

          {/* Header / Progress */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
            <Button variant="ghost" size="icon" onClick={goBack} disabled={!canGoBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Progress value={progress} className="h-2 min-w-[120px] flex-1" />
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap px-1">
              {currentIndex + 1} / {totalProfiles}
            </span>
          </div>

          {/* Profile Card - Compact */}
          <Card className="border shadow-sm shrink-0">
            <CardContent className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate px-2">
                  {currentProfile ? `${currentProfile.prenom} ${currentProfile.nom}` : 'Terminé'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-2 flex-wrap">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                  </span>
                  Recherche LinkedIn active
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 h-8 w-full sm:w-auto"
                onClick={() => openLinkedInWindow(linkedInSearchUrl)}
              >
                <Linkedin className="h-3.5 w-3.5 text-[#0077b5]" />
                Rouvrir LinkedIn
              </Button>
            </CardContent>
          </Card>

          {/* Actions Grid - Compact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0 overflow-y-auto pb-2">
            {CATEGORY_ORDER.map((category, index) => {
              const details = CATEGORY_DETAILS[category];
              return (
                <Button
                  key={category}
                  variant="outline"
                  className={cn(
                    "h-full min-h-[80px] sm:min-h-[100px] flex flex-col items-start p-3 sm:p-4 gap-2 hover:bg-accent/50 transition-all border-2 relative overflow-hidden group whitespace-normal text-left",
                    "hover:border-primary/50",
                    details.buttonClass
                  )}
                  onClick={() => classifyAndNext(category)}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <div className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform shrink-0 [&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-5 sm:[&_svg]:w-5">
                      {details.icon}
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px] h-5 w-5 flex items-center justify-center p-0 opacity-50 group-hover:opacity-100 transition-opacity shrink-0">
                      {index + 1}
                    </Badge>
                  </div>
                  <div className="space-y-0.5 mt-auto w-full">
                    <div className="font-semibold text-sm truncate">{details.label}</div>
                    <div className="text-xs text-muted-foreground font-normal leading-snug line-clamp-2 hidden sm:block">
                      {details.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>

          <div className="text-center text-[10px] text-muted-foreground shrink-0 hidden sm:block">
            Raccourcis clavier : <kbd className="px-1 bg-muted rounded border">1</kbd> - <kbd className="px-1 bg-muted rounded border">4</kbd>
          </div>
        </div>
      </div>

      {/* Side Panel - Queue (Hidden on small screens) */}
      <div className="w-full max-w-xs hidden lg:flex flex-col border-t lg:border-t-0 lg:border-l lg:pl-4 lg:py-2 pt-4 lg:pt-0 shrink-0">
        <div className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          À venir
          <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">{remainingQueue.length}</Badge>
        </div>

        <ScrollArea className="flex-1 -mr-4 pr-4">
          <div className="space-y-2">
            {remainingQueue.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                Aucun profil en attente
              </div>
            ) : (
              remainingQueue.map((profile, idx) => (
                <div key={profile.id} className="flex items-center gap-3 p-2.5 rounded-md border bg-card/50 text-sm hover:bg-accent/50 transition-colors">
                  <span className="text-xs font-mono text-muted-foreground w-5 text-center shrink-0">
                    {currentIndex + idx + 2}
                  </span>
                  <span className="font-medium truncate text-xs">
                    {profile.prenom} {profile.nom}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default PreQualificationClassifier;
