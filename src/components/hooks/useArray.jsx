import { useState, useCallback } from 'react';

export function useArray(initialValue = []) {
  const [array, setArray] = useState(initialValue);

  const push = useCallback((item) => {
    setArray(prev => [...prev, item]);
  }, []);

  const remove = useCallback((index) => {
    setArray(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => {
    setArray([]);
  }, []);

  const update = useCallback((index, item) => {
    setArray(prev => [...prev.slice(0, index), item, ...prev.slice(index + 1)]);
  }, []);

  return { array, push, remove, clear, update };
}