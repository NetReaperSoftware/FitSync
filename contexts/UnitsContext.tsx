import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UnitsContextType {
  useMetricUnits: boolean;
  setUseMetricUnits: (useMetric: boolean) => void;
  getWeightUnit: () => string;
  getWeightLabel: () => string;
  getVolumeLabel: () => string;
  convertWeight: (weight: number, toMetric?: boolean) => number;
  formatWeight: (weight: number) => string;
}

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

export const useUnits = () => {
  const context = useContext(UnitsContext);
  if (context === undefined) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
};

interface UnitsProviderProps {
  children: ReactNode;
}

export const UnitsProvider: React.FC<UnitsProviderProps> = ({ children }) => {
  const [useMetricUnits, setUseMetricUnits] = useState(false); // Default to Imperial

  const getWeightUnit = () => {
    return useMetricUnits ? 'kg' : 'lbs';
  };

  const getWeightLabel = () => {
    return useMetricUnits ? 'Weight (kg)' : 'Weight (lbs)';
  };

  const getVolumeLabel = () => {
    return useMetricUnits ? 'Volume (kg)' : 'Volume (lbs)';
  };

  // Convert weight between units
  // Default storage is in lbs, convert to kg when needed
  const convertWeight = (weight: number, toMetric?: boolean): number => {
    const shouldConvertToMetric = toMetric !== undefined ? toMetric : useMetricUnits;
    
    if (shouldConvertToMetric) {
      // Convert lbs to kg
      return Math.round(weight * 0.453592 * 10) / 10; // Round to 1 decimal place
    } else {
      // Convert kg to lbs (if input was in kg)
      return Math.round(weight * 2.20462 * 10) / 10; // Round to 1 decimal place
    }
  };

  // Format weight for display with appropriate unit
  const formatWeight = (weight: number): string => {
    if (weight === 0) return 'BW'; // Bodyweight
    
    const displayWeight = useMetricUnits ? convertWeight(weight, true) : weight;
    const unit = getWeightUnit();
    
    return `${displayWeight} ${unit}`;
  };

  const value: UnitsContextType = {
    useMetricUnits,
    setUseMetricUnits,
    getWeightUnit,
    getWeightLabel,
    getVolumeLabel,
    convertWeight,
    formatWeight,
  };

  return (
    <UnitsContext.Provider value={value}>
      {children}
    </UnitsContext.Provider>
  );
};