import React, { useEffect, useMemo, useState } from 'react';
import type { Profile, ClassificationMap } from '../types';
import { useProfileManager } from '../hooks/useProfileManager';
import { Category } from '../types';
import { CATEGORY_DETAILS } from '../constants';

interface ProfileViewProps {
    initialProfiles: Profile[];
    onComplete: (classifications: ClassificationMap) => void;
    onProfileUpdate: (updatedProfile: Profile) => void; // Added this line
}

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
);

// Function to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : 'jfKfPfyJRdk'; // Default to lofi if invalid
};

const ProfileView: React.FC<ProfileViewProps> = ({ initialProfiles, onComplete, onProfileUpdate }) => {
    const [youtubeUrl, setYoutubeUrl] = useState<string>('https://www.youtube.com/watch?v=jfKfPfyJRdk');
    const [videoId, setVideoId] = useState<string>('jfKfPfyJRdk');

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
    } = useProfileManager(initialProfiles, onProfileUpdate); // Pass onProfileUpdate here

    useEffect(() => {
        if (isFinished) {
            onComplete(classifications);
        }
    }, [isFinished, onComplete, classifications]);

    const linkedInSearchUrl = useMemo(() => {
        if (!currentProfile) return '';
        const query = encodeURIComponent(`${currentProfile.prenom} ${currentProfile.nom}`);
        return `https://www.linkedin.com/search/results/people/?keywords=${query}&origin=GLOBAL_SEARCH_HEADER`;
    }, [currentProfile]);

    // nextLinkedInSearchUrl is no longer preloaded via iframe, but can still be used for subsequent window opens
    const nextLinkedInSearchUrl = useMemo(() => {
        if (!nextProfile) return '';
        const query = encodeURIComponent(`${nextProfile.prenom} ${nextProfile.nom}`);
        return `https://www.linkedin.com/search/results/people/?keywords=${query}&origin=GLOBAL_SEARCH_HEADER`;
    }, [nextProfile]);

    const openLinkedInWindow = (url: string) => {
        window.open(url, 'linkedinWindow', 'width=1200,height=800,resizable,scrollbars');
    };

    // Handle YouTube URL change
    const handleYoutubeUrlChange = (newUrl: string) => {
        setYoutubeUrl(newUrl);
        const newVideoId = getYouTubeVideoId(newUrl);
        setVideoId(newVideoId);
    };

    // Ouvre la page LinkedIn automatiquement à chaque changement de profil
    useEffect(() => {
        if (currentProfile) {
            openLinkedInWindow(linkedInSearchUrl);
        }
    }, [currentProfile, linkedInSearchUrl]);
    
    if (!currentProfile && !isFinished) {
        return (
            <div className="text-center p-10 text-slate-400">
                Chargement des profils...
            </div>
        );
    }
    
    const progressPercentage = totalProfiles > 0 ? ((currentIndex) / totalProfiles) * 100 : 0;

    return (
        <div className="flex flex-col h-[calc(100vh-150px)] max-h-[1000px]">
            <div className="flex-shrink-0 mb-4 px-1">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-white truncate">
                        {currentProfile.prenom} {currentProfile.nom}
                    </h2>
                    <span className="text-sm font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
                        {currentIndex + 1} / {totalProfiles}
                    </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>

            {/* YouTube URL input */}
            <div className="flex-shrink-0 mb-4 px-1">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={youtubeUrl}
                        onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                        placeholder="Collez une URL YouTube ici..."
                        className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-cyan-400 focus:outline-none text-sm"
                    />
                    <button
                        onClick={() => handleYoutubeUrlChange(youtubeUrl)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Changer
                    </button>
                </div>
            </div>

            {/* Le bloc du bouton LinkedIn est supprimé car l'ouverture est automatique */}
            <div className="flex-grow bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 relative">
                <iframe
                    key={videoId} // Force re-render when video changes
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
                    title="YouTube video player"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
            
            {/* Le preloading n'est plus pertinent avec window.open() */}
            {/* {nextProfile && (
                <a
                    href={nextLinkedInSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden"
                    aria-hidden="true"
                />
            )} */}

            <div className="flex-shrink-0 mt-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
                <button
                    onClick={goBack}
                    disabled={!canGoBack}
                    className="lg:col-span-1 col-span-2 text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-105 active:scale-100"
                >
                    <BackIcon />
                    <span>Retour</span>
                </button>
                {Object.values(Category).map((cat) => {
                    const details = CATEGORY_DETAILS[cat];
                    return (
                        <button
                            key={cat}
                            onClick={() => classifyAndNext(cat)}
                            className={`${details.style} font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-105 active:scale-100 shadow-md hover:shadow-lg`}
                        >
                            {details.icon}
                            <span className="hidden sm:inline">{details.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ProfileView;