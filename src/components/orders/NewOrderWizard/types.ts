import { OrderFormData, LoadingPlace, UnloadingPlace, GoodsItem } from '../../../types/orders';

// Initial states
export const emptyGoodsItem: GoodsItem = {
  id: crypto.randomUUID(),
  name: '',
  quantity: 1,
  unit: 'ks',
  weight: undefined,
  palletExchange: 'Bez výmeny',
  dimensions: '',
  description: '',
};

export const emptyLoadingPlace: LoadingPlace = {
  id: crypto.randomUUID(),
  companyName: '',
  street: '',
  city: '',
  zip: '',
  country: 'Slovensko',
  dateTime: null,
  contactPerson: '', // zachováme pre spätnosť
  contactPersonName: '',
  contactPersonPhone: '',
  goods: [{ ...emptyGoodsItem }]
};

export const emptyUnloadingPlace: UnloadingPlace = {
  id: crypto.randomUUID(),
  companyName: '',
  street: '',
  city: '',
  zip: '',
  country: 'Slovensko',
  dateTime: null,
  contactPerson: '', // zachováme pre spätnosť
  contactPersonName: '',
  contactPersonPhone: '',
  goods: [{ ...emptyGoodsItem }]
};

export interface NewOrderWizardProps {
  open: boolean;
  onClose: () => void;
  isEdit?: boolean;
  orderData?: Partial<OrderFormData>;
  onOrderSaved?: () => void; // Callback pre obnovenie dát po uložení
} 