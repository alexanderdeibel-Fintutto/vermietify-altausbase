import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook for cached calculations to avoid repeated expensive computations
 * @param {Function} calculationFn - Function that performs the calculation
 * @param {Array} dependencies - Array of dependencies that trigger recalculation
 * @param {Object} options - Configuration options
 * @returns {Object} - { result, isCalculating, recalculate }
 */
export function useCachedCalculation(calculationFn, dependencies = [], options = {}) {
  const {
    cacheKey = 'calculation',
    cacheTime = 10 * 60 * 1000, // 10 minutes default
    enabled = true
  } = options;

  const { data: result, isLoading, refetch } = useQuery({
    queryKey: [cacheKey, ...dependencies],
    queryFn: calculationFn,
    staleTime: cacheTime,
    cacheTime: cacheTime,
    enabled
  });

  return {
    result,
    isCalculating: isLoading,
    recalculate: refetch
  };
}

/**
 * Hook for memoized calculations (client-side only, no cache)
 * @param {Function} calculationFn - Function to calculate
 * @param {Array} dependencies - Dependencies
 * @returns {*} - Calculated result
 */
export function useMemoizedCalculation(calculationFn, dependencies = []) {
  return useMemo(calculationFn, dependencies);
}

/**
 * Example: Calculate total rent for a building
 */
export function useTotalRentCalculation(buildingId) {
  return useCachedCalculation(
    async () => {
      const contracts = await base44.entities.LeaseContract.filter({ 
        building_id: buildingId,
        vertragsstatus: 'Aktiv'
      });
      
      return contracts.reduce((sum, c) => sum + (c.warmmiete || 0), 0);
    },
    [buildingId],
    {
      cacheKey: 'totalRent',
      cacheTime: 5 * 60 * 1000 // 5 minutes
    }
  );
}

/**
 * Example: Calculate AfA for a year
 */
export function useAfaCalculation(buildingId, year) {
  return useCachedCalculation(
    async () => {
      const schedules = await base44.entities.AfaSchedule.filter({
        building_id: buildingId,
        status: 'Aktiv'
      });
      
      return schedules.reduce((sum, s) => sum + (s.afa_jahresbetrag || 0), 0);
    },
    [buildingId, year],
    {
      cacheKey: 'afaCalculation',
      cacheTime: 30 * 60 * 1000 // 30 minutes
    }
  );
}