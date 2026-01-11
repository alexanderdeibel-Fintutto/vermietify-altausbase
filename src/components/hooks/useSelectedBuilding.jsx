import { useState, useEffect, useContext, createContext } from 'react';

const SelectedBuildingContext = createContext();

export const useSelectedBuilding = () => {
  const [selectedBuilding, setSelectedBuilding] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedBuildingId') || '';
    }
    return '';
  });

  useEffect(() => {
    localStorage.setItem('selectedBuildingId', selectedBuilding);
  }, [selectedBuilding]);

  return { selectedBuilding, setSelectedBuilding };
};

export function SelectedBuildingProvider({ children }) {
  const [selectedBuilding, setSelectedBuilding] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedBuildingId') || '';
    }
    return '';
  });

  useEffect(() => {
    localStorage.setItem('selectedBuildingId', selectedBuilding);
  }, [selectedBuilding]);

  return (
    <SelectedBuildingContext.Provider value={{ selectedBuilding, setSelectedBuilding }}>
      {children}
    </SelectedBuildingContext.Provider>
  );
}