import { GoodsItem, LoadingPlace, UnloadingPlace } from '../../../types/orders';

// --- Initial Empty States ---
export const emptyGoodsItem: GoodsItem = {
    id: crypto.randomUUID(),
    name: '',
    quantity: 1,
    unit: 'ks',
    palletExchange: 'Bez výmeny',
    dimensions: '',
    description: '',
    adrClass: '',
    referenceNumber: ''
};

export const emptyLoadingPlace: LoadingPlace = {
    id: crypto.randomUUID(),
    street: '',
    city: '',
    zip: '',
    country: 'Slovensko',
    dateTime: null,
    contactPerson: '',
    contactPersonName: '',
    contactPersonPhone: '',
    goods: [{ ...emptyGoodsItem }]
};

export const emptyUnloadingPlace: UnloadingPlace = {
    id: crypto.randomUUID(),
    street: '',
    city: '',
    zip: '',
    country: 'Slovensko',
    dateTime: null,
    contactPerson: '',
    contactPersonName: '',
    contactPersonPhone: '',
    goods: [{ ...emptyGoodsItem }]
};

export interface NewOrderFormProps {
    isModal?: boolean;
    onClose?: () => void;
    isEdit?: boolean;
    orderData?: Partial<any>;
} 