import { useState, useEffect } from 'react';
import { ProspectCategory } from '../types';
import { CategoryNamesService, type CategoryNamesMap } from '../services/categoryNamesService';

export const useCategoryNames = () => {
  const [customNames, setCustomNames] = useState<CategoryNamesMap>(() => CategoryNamesService.getCustomNames());

  useEffect(() => {
    // Écouter les changements dans le localStorage (pour synchroniser entre onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dimicall-prequalification-category-names') {
        setCustomNames(CategoryNamesService.getCustomNames());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateCategoryName = (category: ProspectCategory, name: string) => {
    const newNames = { ...customNames, [category]: name.trim() };
    CategoryNamesService.saveCustomNames(newNames);
    setCustomNames(newNames);
  };

  const resetToDefaults = () => {
    CategoryNamesService.resetToDefaults();
    setCustomNames({});
  };

  const getCategoryName = (category: ProspectCategory): string => {
    return customNames[category] || CategoryNamesService.getCategoryName(category);
  };

  return {
    customNames,
    updateCategoryName,
    resetToDefaults,
    getCategoryName,
    getAllNames: () => CategoryNamesService.getAllNames(),
  };
};

