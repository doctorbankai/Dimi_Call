
import React, { useMemo } from 'react';
import { Profile, ClassificationMap, Category } from '../types';
import { CATEGORY_DETAILS } from '../constants';

// Removed: declare var XLSX: any; // Not needed here anymore

interface SummaryViewProps {
    classifications: ClassificationMap;
    profiles: Profile[];
    onRestart: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({ classifications, profiles, onRestart }) => {
    
    const groupedProfiles = useMemo(() => {
        const initialGroups: Record<Category, Profile[]> = {
            [Category.Baleine]: [],
            [Category.Poisson]: [],
            [Category.Premature]: [],
            [Category.Inexploitable]: [],
        };

        return profiles.reduce((acc, profile) => {
            const category = classifications[profile.id];
            if (category && acc[category]) {
                acc[category].push(profile);
            }
            return acc;
        }, initialGroups);

    }, [classifications, profiles]);

    // Removed: exportToExcel function as it's now in App.tsx

    return (
        <div className="max-w-6xl mx-auto text-center animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-2">Classification Terminée !</h2>
            <p className="text-slate-400 mb-8">Voici le résumé de votre session.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(groupedProfiles).map(([category, categorizedProfiles]) => {
                    const details = CATEGORY_DETAILS[category as Category];
                    return (
                        <div key={category} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col">
                            <div className="flex items-center mb-4">
                               <span className={`mr-3 p-2 rounded-full ${details.style}`}>{details.icon}</span>
                               <h3 className="text-xl font-semibold text-white">{details.label}</h3>
                               <span className="ml-auto text-lg font-bold bg-slate-700 text-cyan-400 rounded-full h-8 w-8 flex items-center justify-center">
                                 {categorizedProfiles.length}
                               </span>
                            </div>
                            <ul className="space-y-2 text-left flex-grow overflow-y-auto max-h-80 pr-2">
                                {categorizedProfiles.length > 0 ? (
                                    categorizedProfiles.map(p => (
                                        <li key={p.id} className="text-slate-300 bg-slate-800 p-2 rounded-md truncate">
                                            {p.prenom} {p.nom}
                                        </li>
                                    ))
                                ) : (
                                    <p className="text-slate-500 italic text-center pt-4">Aucun profil classé ici.</p>
                                )}
                            </ul>
                        </div>
                    );
                })}
            </div>
            
            <div className="flex justify-center space-x-4 mt-10">
                <button
                    onClick={onRestart}
                    className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-200 transform hover:scale-105"
                >
                    Recommencer avec une nouvelle liste
                </button>
            </div>
        </div>
    );
};

export default SummaryView;
