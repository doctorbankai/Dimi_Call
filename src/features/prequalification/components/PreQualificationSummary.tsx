import React, { useMemo } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CATEGORY_DETAILS, CATEGORY_ORDER } from '../constants';
import type { ClassificationMap, ProspectProfile } from '../types';
import { ProspectCategory } from '../types';

type PreQualificationSummaryProps = {
  classifications: ClassificationMap;
  profiles: ProspectProfile[];
  onRestart: () => void;
};

export const PreQualificationSummary: React.FC<PreQualificationSummaryProps> = ({
  classifications,
  profiles,
  onRestart,
}) => {
  const grouped = useMemo(() => {
    const base: Record<ProspectCategory, ProspectProfile[]> = {
      [ProspectCategory.Baleine]: [],
      [ProspectCategory.Poisson]: [],
      [ProspectCategory.Premature]: [],
      [ProspectCategory.Inexploitable]: [],
    };

    profiles.forEach((profile) => {
      const category = classifications[profile.id];
      if (category) {
        base[category].push(profile);
      }
    });

    return base;
  }, [classifications, profiles]);

  return (
    <div className="flex h-full flex-col gap-5 sm:gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Pré-qualification terminée
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Voici le résumé de votre session. Vous pouvez exporter ces résultats.
          </p>
        </div>
        <Button variant="outline" onClick={onRestart} className="w-full sm:w-auto justify-center">
          <RefreshCw className="mr-2 h-4 w-4" />
          Nouvelle session
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {CATEGORY_ORDER.map((category) => {
          const entries = grouped[category] ?? [];
          const details = CATEGORY_DETAILS[category];
          return (
            <Card key={category} className="flex flex-col overflow-hidden border-2 hover:border-primary/20 transition-colors h-full">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-md bg-background shadow-sm">
                    {details.icon}
                  </div>
                  <Badge variant="secondary" className="text-sm font-mono">
                    {entries.length}
                  </Badge>
                </div>
                <CardTitle className="mt-4 text-lg">{details.label}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5em]">{details.description}</CardDescription>
              </CardHeader>

              <Separator />

              <CardContent className="flex-1 p-0 min-h-[200px]">
                <ScrollArea className="h-[240px] sm:h-[300px] w-full">
                  <div className="p-4 space-y-2">
                    {entries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground text-sm text-center">
                        <p>Aucun profil</p>
                      </div>
                    ) : (
                      entries.map((profile) => (
                        <div
                          key={profile.id}
                          className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                        >
                          <div className="h-2 w-2 shrink-0 rounded-full bg-primary/50" />
                          <span className="font-medium truncate">
                            {profile.prenom} {profile.nom}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PreQualificationSummary;
