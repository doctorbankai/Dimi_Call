
import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="bg-slate-900/70 backdrop-blur-lg sticky top-0 z-20 border-b border-slate-700">
            <div className="container mx-auto px-4 md:px-8 py-4">
                <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Profil Prospect
                </h1>
                <p className="text-slate-400 text-sm mt-1">Tinder for LinkedIn - Classifiez vos prospects rapidement.</p>
            </div>
        </header>
    );
};

export default Header;
