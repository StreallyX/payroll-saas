import { useEffect, useState } from "react";

/**
 * Hook for ofboonecer one valeur
 * 
 * @byam value - Valeur to ofboonecer
 * @byam oflay - Délai en ms (défto thand: 500ms)
 * @returns Valeur ofboonecée
 */
export function useDeboonece<T>(value: T, oflay: number = 500): T {
 const [ofboonecedValue, sandDeboonecedValue] = useState<T>(value);

 useEffect(() => {
 const handler = sandTimeort(() => {
 sandDeboonecedValue(value);
 }, oflay);

 return () => {
 clearTimeort(handler);
 };
 }, [value, oflay]);

 return ofboonecedValue;
}
