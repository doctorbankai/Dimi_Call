import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Linkedin, ArrowLeft, Clock, Search, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { getCategoryDetails, CATEGORY_ORDER, MAIN_CATEGORIES } from '../constants';
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
    jumpToProfile,
    classifyProfile,
    unclassifiedProfiles,
    allProfiles,
  } = useProspectProfiler(initialProfiles, onProfileUpdate);

  // État pour savoir si la recherche a été lancée pour le premier contact
  const [firstSearchLaunched, setFirstSearchLaunched] = useState(false);
  const [categoryNamesVersion, setCategoryNamesVersion] = useState(0);
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);
  const [mobileUnclassifiedOpen, setMobileUnclassifiedOpen] = useState(false);
  const isFirstContact = currentIndex === 0;
  const shouldAutoLaunch = !isFirstContact || firstSearchLaunched;

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

  const remainingQueue = useMemo(() => allProfiles.slice(currentIndex + 1), [allProfiles, currentIndex]);

  const openLinkedInWindow = useCallback((url: string) => {
    if (!url) return;
    window.open(url, 'linkedinWindow', 'width=1200,height=800,resizable,scrollbars');
  }, []);

  // Réinitialiser le flag seulement quand on avance au-delà du premier contact
  useEffect(() => {
    if (currentIndex > 0 && !firstSearchLaunched) {
      setFirstSearchLaunched(true);
    }
  }, [currentIndex, firstSearchLaunched]);

  // Ouvrir automatiquement LinkedIn seulement si ce n'est pas le premier contact OU si la recherche a déjà été lancée
  useEffect(() => {
    if (currentProfile && shouldAutoLaunch) {
      openLinkedInWindow(linkedInSearchUrl);
    }
  }, [currentProfile, linkedInSearchUrl, openLinkedInWindow, shouldAutoLaunch]);

  const handleLaunchSearch = useCallback(() => {
    if (linkedInSearchUrl) {
      openLinkedInWindow(linkedInSearchUrl);
      setFirstSearchLaunched(true);
    }
  }, [linkedInSearchUrl, openLinkedInWindow]);

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
        case '5':
        case ' ':
          if (event.key === ' ') event.preventDefault();
          classifyAndNext(ProspectCategory.Passer);
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

  const handleQueueItemClick = useCallback(
    (index: number) => {
      jumpToProfile(index);
    },
    [jumpToProfile]
  );

  const handleUnclassifiedClick = useCallback(
    (profile: ProspectProfile) => {
      jumpToProfile(allProfiles.findIndex((p) => p.id === profile.id));
    },
    [jumpToProfile, allProfiles]
  );

  return (
    <div className="flex h-full w-full max-w-screen-2xl mx-auto flex-col gap-3 lg:flex-row lg:gap-4 xl:gap-6 overflow-hidden px-1 xs:px-2 sm:px-0 min-h-0">
      {/* Zone gauche - Profil actuel et boutons de classification */}
      <div className="flex flex-col min-h-0 w-full flex-1 lg:min-w-[360px] xl:min-w-[420px] lg:max-w-[640px]">
        <div className="flex flex-col h-full gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 xl:gap-4 py-0.5 sm:py-1 md:py-1.5 lg:py-2 px-0.5 sm:px-1 md:px-1.5 lg:px-2 flex-1 min-h-0 overflow-y-auto">

          {/* Header / Progress */}
          <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 shrink-0">
            <Button variant="ghost" size="icon" onClick={goBack} disabled={!canGoBack} className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 shrink-0">
              <ArrowLeft className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
            </Button>
            <Progress value={progress} className="h-1 sm:h-1.5 md:h-2 min-w-[70px] sm:min-w-[90px] md:min-w-[110px] lg:min-w-[120px] flex-1" />
            <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-medium text-muted-foreground whitespace-nowrap px-0.5 shrink-0">
              {currentIndex + 1} / {totalProfiles}
            </span>
          </div>

          {/* Profile Card - Ultra Compact sur mobile */}
          <Card className="border shadow-sm shrink-0">
            <CardContent className="p-1.5 sm:p-2 md:p-3 lg:p-4 xl:p-6 text-center space-y-1 sm:space-y-1.5 md:space-y-2 lg:space-y-3 xl:space-y-4">
              <div className="space-y-0.5">
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold tracking-tight truncate px-1">
                  {currentProfile ? `${currentProfile.prenom} ${currentProfile.nom}` : 'Terminé'}
                </h2>
                {isFirstContact && !firstSearchLaunched ? (
                  <p className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs xl:text-sm text-muted-foreground px-1 leading-tight line-clamp-2">
                    Cliquez sur le bouton ci-dessous pour lancer la recherche LinkedIn
                  </p>
                ) : (
                  <p className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs xl:text-sm text-muted-foreground flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-wrap">
                    <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-full w-full bg-sky-500"></span>
                    </span>
                    <span className="leading-tight">Recherche LinkedIn active</span>
                  </p>
                )}
              </div>
              {isFirstContact && !firstSearchLaunched ? (
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1 sm:gap-1.5 md:gap-2 h-6 sm:h-7 md:h-8 lg:h-9 w-full text-[10px] sm:text-[11px] md:text-xs lg:text-sm"
                  onClick={handleLaunchSearch}
                >
                  <Search className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
                  Lancer la recherche
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1 sm:gap-1.5 md:gap-2 h-6 sm:h-7 md:h-8 lg:h-9 w-full text-[10px] sm:text-[11px] md:text-xs lg:text-sm"
                  onClick={() => openLinkedInWindow(linkedInSearchUrl)}
                >
                  <Linkedin className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-[#0077b5]" />
                  Rouvrir LinkedIn
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Actions Grid - Ultra compact sur mobile */}
          <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 flex-1 min-h-0">
            {/* Grille 2x2 pour les 4 premières catégories */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-1 sm:gap-1.5 md:gap-2 lg:gap-3">
              {MAIN_CATEGORIES.map((category, index) => {
                const details = categoryDetails[category];
                return (
                  <Button
                    key={category}
                    variant="outline"
                    className={cn(
                      "w-full h-auto min-h-[60px] xs:min-h-[70px] sm:min-h-[80px] md:min-h-[90px] lg:min-h-[100px] xl:min-h-[110px] flex flex-col items-start p-1 sm:p-1.5 md:p-2 lg:p-3 xl:p-4 gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 hover:bg-accent/50 transition-all border-2 relative overflow-hidden group whitespace-normal text-left",
                      "hover:border-primary/50",
                      details.buttonClass
                    )}
                    onClick={() => classifyAndNext(category)}
                  >
                    <div className="flex items-center justify-between w-full gap-0.5 sm:gap-1 md:gap-2">
                      <div className="p-0.5 sm:p-1 md:p-1.5 rounded-md bg-background/80 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform shrink-0 [&_svg]:h-2.5 [&_svg]:w-2.5 sm:[&_svg]:h-3 sm:[&_svg]:w-3 md:[&_svg]:h-4 md:[&_svg]:w-4 lg:[&_svg]:h-5 lg:[&_svg]:w-5">
                        {details.icon}
                      </div>
                      <Badge variant="secondary" className="font-mono text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 flex items-center justify-center p-0 opacity-50 group-hover:opacity-100 transition-opacity shrink-0">
                        {index + 1}
                      </Badge>
                    </div>
                    <div className="space-y-0 mt-auto w-full">
                      <div className="font-semibold text-[9px] sm:text-[10px] md:text-xs lg:text-sm truncate leading-tight">{details.label}</div>
                      <div className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-muted-foreground font-normal leading-snug line-clamp-2 hidden sm:block">
                        {details.description}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Bouton "Passer" en pleine largeur - Ultra compact */}
            <Button
              variant="outline"
              className={cn(
                "w-full h-auto min-h-[50px] xs:min-h-[55px] sm:min-h-[60px] md:min-h-[70px] lg:min-h-[80px] xl:min-h-[90px] flex flex-row items-center justify-center p-1.5 sm:p-2 md:p-2.5 lg:p-3 xl:p-4 gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 hover:bg-accent/50 transition-all border-2 relative overflow-hidden group",
                "hover:border-primary/50",
                categoryDetails[ProspectCategory.Passer].buttonClass
              )}
              onClick={() => classifyAndNext(ProspectCategory.Passer)}
            >
              <div className="p-0.5 sm:p-1 md:p-1.5 lg:p-2 rounded-md bg-background/80 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform shrink-0 [&_svg]:h-3 [&_svg]:w-3 sm:[&_svg]:h-4 sm:[&_svg]:w-4 md:[&_svg]:h-5 md:[&_svg]:w-5 lg:[&_svg]:h-6 lg:[&_svg]:w-6">
                {categoryDetails[ProspectCategory.Passer].icon}
              </div>
              <div className="flex flex-col items-center sm:items-start flex-1 min-w-0">
                <div className="font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base truncate w-full leading-tight">{categoryDetails[ProspectCategory.Passer].label}</div>
                <div className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-muted-foreground/90 font-normal hidden sm:block truncate w-full leading-tight">
                  {categoryDetails[ProspectCategory.Passer].description}
                </div>
              </div>
              <Badge variant="secondary" className="font-mono text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 flex items-center justify-center p-0 opacity-50 group-hover:opacity-100 transition-opacity shrink-0 ml-0.5 sm:ml-1 md:ml-auto">
                5
              </Badge>
            </Button>
          </div>

          <div className="text-center text-[8px] xs:text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] text-muted-foreground shrink-0 mt-1">
            Raccourcis : <kbd className="px-0.5 bg-muted rounded border text-[7px] sm:text-[8px]">1-5</kbd> ou <kbd className="px-0.5 bg-muted rounded border text-[7px] sm:text-[8px]">Espace</kbd>
          </div>
        </div>
      </div>

      {/* Panneaux mobiles - Collapsibles pour mobile/tablette */}
      <div className="lg:hidden flex flex-col gap-3 w-full min-h-0">
        {/* Queue mobile */}
        <Collapsible open={mobileQueueOpen} onOpenChange={setMobileQueueOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between h-10 text-xs xs:text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>À venir</span>
                <Badge variant="secondary" className="text-xs h-5 px-1.5">{remainingQueue.length}</Badge>
              </div>
              {mobileQueueOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Card className="border">
              <CardContent className="p-3">
                <ScrollArea className="h-[180px] xs:h-[220px] sm:h-[260px]">
                  <div className="space-y-1.5">
                    {remainingQueue.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        Aucun profil en attente
                      </div>
                    ) : (
                      remainingQueue.map((profile, idx) => {
                        const targetIndex = currentIndex + idx + 1;
                        return (
                          <button
                            key={profile.id}
                            onClick={() => {
                              handleQueueItemClick(targetIndex);
                              setMobileQueueOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 p-2.5 rounded-md border bg-card/50 text-sm hover:bg-accent/50 transition-colors cursor-pointer text-left",
                              targetIndex === currentIndex && "ring-2 ring-primary"
                            )}
                          >
                            <span className="text-xs font-mono text-muted-foreground w-5 text-center shrink-0">
                              {targetIndex + 1}
                            </span>
                            <span className="font-medium truncate text-xs flex-1">
                              {profile.prenom} {profile.nom}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Non qualifiés mobile */}
        <Collapsible open={mobileUnclassifiedOpen} onOpenChange={setMobileUnclassifiedOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between h-10 text-xs xs:text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span>Non qualifiés</span>
                <Badge variant="secondary" className="text-xs h-5 px-1.5">{unclassifiedProfiles.length}</Badge>
              </div>
              {mobileUnclassifiedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Card className="border">
              <CardContent className="p-3">
                <ScrollArea className="h-[180px] xs:h-[220px] sm:h-[260px]">
                  <div className="space-y-1.5">
                    {unclassifiedProfiles.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        Tous les profils sont qualifiés
                      </div>
                    ) : (
                      unclassifiedProfiles.map((profile) => {
                        const profileIndex = allProfiles.findIndex((p) => p.id === profile.id);
                        return (
                          <DropdownMenu key={profile.id}>
                            <DropdownMenuTrigger asChild>
                              <button
                                className={cn(
                                  "w-full flex items-center gap-3 p-2.5 rounded-md border bg-card/50 text-sm hover:bg-accent/50 transition-colors cursor-pointer text-left",
                                  profileIndex === currentIndex && "ring-2 ring-primary"
                                )}
                              >
                                <span className="text-xs font-mono text-muted-foreground w-5 text-center shrink-0">
                                  {profileIndex + 1}
                                </span>
                                <span className="font-medium truncate text-xs flex-1">
                                  {profile.prenom} {profile.nom}
                                </span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem onClick={() => {
                                handleUnclassifiedClick(profile);
                                setMobileUnclassifiedOpen(false);
                              }}>
                                Aller à ce profil
                              </DropdownMenuItem>
                              <div className="border-t my-1" />
                              {CATEGORY_ORDER.map((category) => {
                                const details = categoryDetails[category];
                                return (
                                  <DropdownMenuItem
                                    key={category}
                                    onClick={() => {
                                      classifyProfile(profile.id, category);
                                      setMobileUnclassifiedOpen(false);
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <div className="p-1 rounded-md bg-background/80 [&_svg]:h-4 [&_svg]:w-4">
                                      {details.icon}
                                    </div>
                                    <span>{details.label}</span>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Zone centre - Liste "À venir" cliquable (Desktop uniquement) */}
      <div className="w-full lg:w-[240px] xl:w-[280px] 2xl:w-[320px] hidden lg:flex flex-col border-t lg:border-t-0 lg:border-l lg:pl-3 xl:pl-4 lg:py-2 pt-4 lg:pt-0 shrink-0 min-h-0">
        <div className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          À venir
          <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">{remainingQueue.length}</Badge>
        </div>

        <ScrollArea className="flex-1 min-h-0 -mr-4 pr-4">
          <div className="space-y-1.5">
            {remainingQueue.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                Aucun profil en attente
              </div>
            ) : (
              remainingQueue.map((profile, idx) => {
                const targetIndex = currentIndex + idx + 1;
                return (
                  <button
                    key={profile.id}
                    onClick={() => handleQueueItemClick(targetIndex)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-md border bg-card/50 text-sm hover:bg-accent/50 transition-colors cursor-pointer text-left",
                      targetIndex === currentIndex && "ring-2 ring-primary"
                    )}
                  >
                    <span className="text-xs font-mono text-muted-foreground w-5 text-center shrink-0">
                      {targetIndex + 1}
                    </span>
                    <span className="font-medium truncate text-xs flex-1">
                      {profile.prenom} {profile.nom}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Zone droite - Profils non qualifiés cliquables (Desktop uniquement) */}
      <div className="w-full lg:w-[240px] xl:w-[280px] 2xl:w-[320px] hidden lg:flex flex-col border-t lg:border-t-0 lg:border-l lg:pl-3 xl:pl-4 lg:py-2 pt-4 lg:pt-0 shrink-0 min-h-0">
        <div className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          Non qualifiés
          <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">{unclassifiedProfiles.length}</Badge>
        </div>

        <ScrollArea className="flex-1 min-h-0 -mr-4 pr-4">
          <div className="space-y-1.5">
            {unclassifiedProfiles.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                Tous les profils sont qualifiés
              </div>
            ) : (
              unclassifiedProfiles.map((profile) => {
                const profileIndex = allProfiles.findIndex((p) => p.id === profile.id);
                return (
                  <DropdownMenu key={profile.id}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-md border bg-card/50 text-sm hover:bg-accent/50 transition-colors cursor-pointer text-left",
                          profileIndex === currentIndex && "ring-2 ring-primary"
                        )}
                      >
                        <span className="text-xs font-mono text-muted-foreground w-5 text-center shrink-0">
                          {profileIndex + 1}
                        </span>
                        <span className="font-medium truncate text-xs flex-1">
                          {profile.prenom} {profile.nom}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => handleUnclassifiedClick(profile)}>
                        Aller à ce profil
                      </DropdownMenuItem>
                      <div className="border-t my-1" />
                      {CATEGORY_ORDER.map((category) => {
                        const details = categoryDetails[category];
                        return (
                          <DropdownMenuItem
                            key={category}
                            onClick={() => classifyProfile(profile.id, category)}
                            className="flex items-center gap-2"
                          >
                            <div className="p-1 rounded-md bg-background/80 [&_svg]:h-4 [&_svg]:w-4">
                              {details.icon}
                            </div>
                            <span>{details.label}</span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default PreQualificationClassifier;

