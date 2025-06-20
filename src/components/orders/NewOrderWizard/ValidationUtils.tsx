import { OrderFormData } from '../../../types/orders';

export const validateStep = (step: number, formData: Partial<OrderFormData>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  switch (step) {
    case 0:
      if (!formData.zakaznikData) {
        errors.push('Vyberte zákazníka');
      }
      if (!formData.suma || parseFloat(formData.suma) <= 0) {
        errors.push('Zadajte platnú cenu pre zákazníka');
      }
      break;
    
    case 1:
      if (!formData.loadingPlaces?.length) {
        errors.push('Pridajte aspoň jedno miesto nakládky');
      } else {
        formData.loadingPlaces.forEach((place, index) => {
          if (!place.city) errors.push(`Nakládka #${index + 1}: Zadajte mesto`);
          if (!place.street) errors.push(`Nakládka #${index + 1}: Zadajte ulicu`);
          // Kontaktná osoba je teraz nepovinná
          if (!place.dateTime) errors.push(`Nakládka #${index + 1}: Zadajte dátum a čas`);
          if (!place.goods?.length || !place.goods.some(g => g.name)) {
            errors.push(`Nakládka #${index + 1}: Zadajte aspoň jeden tovar`);
          }
        });
      }

      if (!formData.unloadingPlaces?.length) {
        errors.push('Pridajte aspoň jedno miesto vykládky');
      } else {
        formData.unloadingPlaces.forEach((place, index) => {
          if (!place.city) errors.push(`Vykládka #${index + 1}: Zadajte mesto`);
          if (!place.street) errors.push(`Vykládka #${index + 1}: Zadajte ulicu`);
          // Kontaktná osoba je teraz nepovinná
          if (!place.dateTime) errors.push(`Vykládka #${index + 1}: Zadajte dátum a čas`);
          if (!place.goods?.length || !place.goods.some(g => g.name)) {
            errors.push(`Vykládka #${index + 1}: Zadajte aspoň jeden tovar`);
          }
        });
      }
      break;
    
    case 2:
      if (!formData.carrierCompany) {
        errors.push('Vyberte dopravcu');
      }
      break;
    
    default:
      break;
  }

  return { isValid: errors.length === 0, errors };
}; 