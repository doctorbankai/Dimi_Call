import React, { useMemo } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    <div className="flex h-full flex-col gap-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-primary" />
              Pré-qualification terminée
            </CardTitle>
            <CardDescription>Résumé en direct de cette session.</CardDescription>
          </div>
          <Badge variant="outline" className="mt-1 text-xs">
            Étape 3/3
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {profiles.length} profils traités
          </Badge>
          <Badge variant="outline" className="text-xs">
            {Object.keys(classifications).length} décisions prises
          </Badge>
          <Button variant="secondary" size="sm" className="ml-auto" onClick={onRestart}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Recommencer
          </Button>
        </CardContent>
      </Card>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {CATEGORY_ORDER.map((category) => {
          const entries = grouped[category] ?? [];
          const details = CATEGORY_DETAILS[category];
          return (
            <Card key={category} className="flex flex-col border shadow-sm">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">{details.icon}</span>
                  <div className="flex flex-col">
                    <CardTitle className="text-lg">{details.label}</CardTitle>
                    <CardDescription>{details.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-sm">
                    {entries.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ScrollArea className="h-52">
                  <div className="space-y-2 pr-2">
                    {entries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun profil ici.</p>
                    ) : (
                      entries.map((profile) => (
                        <div
                          key={profile.id}
                          className="rounded-lg border bg-muted/30 px-3 py-2 text-sm shadow-sm"
                        >
                          {profile.prenom} {profile.nom}
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
