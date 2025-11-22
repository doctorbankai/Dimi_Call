
import { useState, useCallback, useMemo } from 'react';
import type { Profile, ClassificationMap } from '../types';
import { Category } from '../types';

export const useProfileManager = (initialProfiles: Profile[] = [], onProfileUpdate?: (updatedProfile: Profile) => void) => {
    const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [classifications, setClassifications] = useState<ClassificationMap>({});
    const [history, setHistory] = useState<number[]>([]);

    const isFinished = useMemo(() => currentIndex >= profiles.length && profiles.length > 0, [currentIndex, profiles.length]);
    const currentProfile = useMemo(() => profiles[currentIndex], [profiles, currentIndex]);
    const nextProfile = useMemo(() => profiles[currentIndex + 1], [profiles, currentIndex]);
    const canGoBack = useMemo(() => history.length > 0, [history]);

    const classifyAndNext = useCallback((category: Category) => {
        if (!currentProfile) {
            console.log("classifyAndNext: No current profile.");
            return;
        }

        console.log(`classifyAndNext: Classifying profile ${currentProfile.id} with category ${category}`);

        const updatedProfile = { ...currentProfile, status: category };
        console.log("classifyAndNext: Updated profile to be:", updatedProfile);

        // Update the status of the current profile in the profiles array
        setProfiles(prevProfiles =>
            prevProfiles.map(profile =>
                profile.id === updatedProfile.id ? updatedProfile : profile
            )
        );

        // Notify parent component about the updated profile
        if (onProfileUpdate) {
            console.log("classifyAndNext: Calling onProfileUpdate with:", updatedProfile);
            onProfileUpdate(updatedProfile);
        }

        setHistory(prev => [...prev, currentIndex]);
        setClassifications(prev => ({
            ...prev,
            [currentProfile.id]: category,
        }));
        setCurrentIndex(prev => prev + 1);
    }, [currentProfile, currentIndex, onProfileUpdate]);

    const goBack = useCallback(() => {
        if (!canGoBack) return;

        const lastIndex = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setCurrentIndex(lastIndex);
    }, [canGoBack, history]);

    const loadProfiles = useCallback((newProfiles: Profile[]) => {
        const profilesWithId = newProfiles.map((p, i) => ({ 
            ...p, 
            id: p.id || `${Date.now()}-${i}`,
            status: p.status || undefined, // Ensure status is preserved if it exists
        }));
        setProfiles(profilesWithId);
        setCurrentIndex(0);
        setClassifications({});
        setHistory([]);
    }, []);

    const completedCount = useMemo(() => {
        return Object.values(classifications).filter(c => c !== undefined).length;
    }, [classifications]);

    return {
        currentProfile,
        nextProfile,
        classifications,
        classifyAndNext,
        goBack,
        canGoBack,
        isFinished,
        loadProfiles,
        totalProfiles: profiles.length,
        completedCount,
        currentIndex,
    };
};
