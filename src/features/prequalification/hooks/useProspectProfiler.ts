import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ClassificationMap, ProspectProfile } from '../types';
import { ProspectCategory } from '../types';

const buildId = (index: number) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${index}`;
};

const withIds = (profiles: ProspectProfile[]) =>
  profiles.map((profile, index) => ({
    ...profile,
    id: profile.id || buildId(index),
  }));

const extractInitialClassifications = (profiles: ProspectProfile[]): ClassificationMap =>
  profiles.reduce<ClassificationMap>((acc, profile) => {
    if (profile.status) {
      acc[profile.id] = profile.status;
    }
    return acc;
  }, {});

const computeSignature = (profiles: ProspectProfile[]) =>
  profiles
    .map((profile) => `${profile.id}-${profile.prenom}-${profile.nom}`)
    .join('|');

export const useProspectProfiler = (
  initialProfiles: ProspectProfile[] = [],
  onProfileUpdate?: (updatedProfile: ProspectProfile) => void
) => {
  const [profiles, setProfiles] = useState<ProspectProfile[]>(() => withIds(initialProfiles));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [classifications, setClassifications] = useState<ClassificationMap>(
    extractInitialClassifications(withIds(initialProfiles))
  );
  const [history, setHistory] = useState<number[]>([]);
  const datasetSignatureRef = useRef<string>(computeSignature(withIds(initialProfiles)));

  useEffect(() => {
    const nextProfiles = withIds(initialProfiles);
    const signature = computeSignature(nextProfiles);

    if (signature === datasetSignatureRef.current) {
      // Dataset structure unchanged; keep progress and state.
      return;
    }

    datasetSignatureRef.current = signature;
    const derivedClassifications = extractInitialClassifications(nextProfiles);
    const firstUnclassifiedIndex = nextProfiles.findIndex((p) => !derivedClassifications[p.id]);

    setProfiles(nextProfiles);
    setClassifications(derivedClassifications);
    setHistory([]);
    setCurrentIndex(firstUnclassifiedIndex === -1 ? nextProfiles.length : firstUnclassifiedIndex);
  }, [initialProfiles]);

  const currentProfile = useMemo(() => profiles[currentIndex], [profiles, currentIndex]);
  const nextProfile = useMemo(() => profiles[currentIndex + 1], [profiles, currentIndex]);
  const isFinished = useMemo(
    () => profiles.length > 0 && currentIndex >= profiles.length,
    [profiles.length, currentIndex]
  );
  const canGoBack = useMemo(() => history.length > 0, [history]);

  const classifyAndNext = useCallback(
    (category: ProspectCategory) => {
      if (!currentProfile) return;

      const updatedProfile: ProspectProfile = { ...currentProfile, status: category };
      setProfiles((prev) => prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p)));
      setClassifications((prev) => ({ ...prev, [currentProfile.id]: category }));
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }
      setHistory((prev) => [...prev, currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    },
    [currentProfile, currentIndex, onProfileUpdate]
  );

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    const lastIndex = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex(lastIndex);
  }, [canGoBack, history]);

  const completedCount = useMemo(() => Object.keys(classifications).length, [classifications]);
  const progress = useMemo(
    () => (profiles.length === 0 ? 0 : Math.min(100, Math.round((currentIndex / profiles.length) * 100))),
    [currentIndex, profiles.length]
  );

  return {
    currentProfile,
    nextProfile,
    classifications,
    classifyAndNext,
    goBack,
    canGoBack,
    isFinished,
    totalProfiles: profiles.length,
    completedCount,
    currentIndex,
    progress,
  };
};
