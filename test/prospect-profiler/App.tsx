
import React, { useState, useCallback } from 'react';
import type { Profile, ClassificationMap } from './types';
import FileUpload from './components/FileUpload';
import ProfileView from './components/ProfileView';
import SummaryView from './components/SummaryView';
import Header from './components/Header';

// This declaration is needed because we load XLSX from a CDN
declare var XLSX: any;

const App: React.FC = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const [finalClassifications, setFinalClassifications] = useState<ClassificationMap>({});
    const [view, setView] = useState<'upload' | 'classify' | 'summary'>('upload');

    const handleDataLoaded = useCallback((loadedProfiles: Profile[]) => {
        if (loadedProfiles.length === 0) {
            alert("Le fichier est vide ou n'a pas pu être lu.");
            return;
        }
        // Profiles are initialized without a default status here. Status will be added during classification.
        const profilesWithId = loadedProfiles.map((p, i) => ({ 
            ...p, 
            id: `${Date.now()}-${i}`,
        }));
        setProfiles(profilesWithId);
        console.log("App: Profiles loaded and set to state:", profilesWithId);
        setView('classify');
    }, []);

    const handleClassificationComplete = useCallback((classifications: ClassificationMap) => {
        // At this point, profiles state in App.tsx should already be updated by handleProfileUpdate
        console.log("App: Classification complete. Final classifications:", classifications);
        setFinalClassifications(classifications);
        setIsFinished(true); // Indicate that classification is finished
        setView('summary');
    }, []);
    
    const handleRestart = useCallback(() => {
        setProfiles([]);
        setFinalClassifications({});
        setIsFinished(false); // Reset finished state
        setView('upload');
        console.log("App: Restarting application.");
    }, []);

    const handleProfileUpdate = useCallback((updatedProfile: Profile) => {
        console.log("App: handleProfileUpdate received updated profile:", updatedProfile);
        setProfiles(prevProfiles => {
            const newProfiles = prevProfiles.map(profile =>
                profile.id === updatedProfile.id ? updatedProfile : profile
            );
            console.log("App: Profiles state after update:", newProfiles);
            return newProfiles;
        });
    }, []);

    const exportToExcel = useCallback(() => {
        if (profiles.length === 0) {
            alert("Aucun profil à exporter. Veuillez d'abord importer un fichier.");
            return;
        }
        console.log("App: Exporting profiles. Current profiles state:", profiles);
        const dataToExport = profiles.map(p => ({
            Prénom: p.prenom,
            Nom: p.nom,
            Statut: p.status || 'Non classé', // Use the status property, default to 'Non classé' for export
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Profils Classifiés");
        XLSX.writeFile(wb, "profils_classifies.xlsx");
        console.log("App: Export complete.");
    }, [profiles]);

    const renderContent = () => {
        switch(view) {
            case 'upload':
                return <FileUpload onDataLoaded={handleDataLoaded} />;
            case 'classify':
                return <ProfileView 
                    initialProfiles={profiles} 
                    onComplete={handleClassificationComplete} 
                    onProfileUpdate={handleProfileUpdate} // Pass the update callback
                />;
            case 'summary':
                return <SummaryView 
                    classifications={finalClassifications} 
                    profiles={profiles}
                    onRestart={handleRestart}
                />;
            default:
                return <FileUpload onDataLoaded={handleDataLoaded} />;
        }
    }

    return (
        <div className="bg-slate-900 text-white min-h-screen font-sans antialiased">
            <Header />
            <main className="container mx-auto p-4 md:p-6 lg:p-8">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={exportToExcel}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-transform duration-200 transform hover:scale-105"
                    >
                        Exporter en Excel
                    </button>
                </div>
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
