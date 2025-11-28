import { useEffect, useState } from "react";

/**
 * Hook pour debouncer une valeur
 * 
 * @param value - Valeur à debouncer
 * @param delay - Délai en ms (défaut: 500ms)
 * @returns Valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
