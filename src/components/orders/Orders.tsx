import { OrderFormData } from '../../types/orders';

// Pomocný typ pre spracovanie dátumu
type DateLike = Date | { toDate: () => Date } | string | number;

// Pomocná funkcia na konverziu dátumu
const convertToDate = (date: DateLike | null | undefined): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') 
    return date.toDate();
  if (typeof date === 'string' || typeof date === 'number')
    return new Date(date);
  return null; // Pre prípad, že typ nesedí s očakávanými
};

// Exportujeme funkciu konverzie dátumu pre použitie v iných komponentoch
export { convertToDate }; 