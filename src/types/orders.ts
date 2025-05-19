import { Timestamp } from 'firebase/firestore';
import { Customer } from './customers';

export interface GoodsItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  palletExchange: string;
  dimensions?: string;
  description?: string;
  adrClass?: string;
  referenceNumber?: string;
}

export interface LoadingPlace {
  id: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  dateTime: Date | null;
  contactPerson: string;
  goods: GoodsItem[];
}

export interface UnloadingPlace {
  id: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  dateTime: Date | null;
  contactPerson: string;
  goods: GoodsItem[];
}

export interface SavedPlace {
  id: string;
  name: string;
  type: 'loading' | 'unloading';
  street: string;
  city: string;
  zip: string;
  country: string;
  contactPerson: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  companyId: string;
}

export interface OrderFormData {
  id?: string;
  createdAt?: Timestamp | Date;
  datumPrijatia?: Date | null;
  zakaznik?: string;
  zakaznikData?: Customer | null;
  kontaktnaOsoba?: string;
  suma?: string;
  mena?: string;
  vyuctovaniePodlaMnozstva?: boolean;
  cisloNakladuZakaznika?: string;
  internaPoznamka?: string;
  vyzadujeSaTypNavesu?: string;
  poziadavky?: string;
  loadingPlaces: LoadingPlace[];
  unloadingPlaces: UnloadingPlace[];
  carrierCompany: string;
  carrierContact: string;
  carrierVehicleReg: string;
  carrierPrice: string;
  companyID?: string;
  createdBy?: string;
  createdByName?: string;
  updatedAt?: Timestamp;
  updatedBy?: string;
  orderNumberFormatted?: string;
  orderNumber?: string;
  orderMonth?: string;
  orderYear?: string;
  customerCompany?: string;
  customerVatId?: string;
  customerStreet?: string;
  customerCity?: string;
  customerZip?: string;
  customerCountry?: string;
  customerContactName?: string;
  customerContactSurname?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerPrice?: string;
  goodsDescription?: string;
  weightKg?: string;
  dimensionsL?: string;
  dimensionsW?: string;
  dimensionsH?: string;
  quantity?: string;
}

export interface Order extends Omit<OrderFormData, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Prázdny export aby TypeScript rozpoznal tento súbor ako modul
export {} 