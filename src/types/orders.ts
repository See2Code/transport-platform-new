import { Timestamp } from 'firebase/firestore';
import { Customer } from './customers';

export interface GoodsItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  weight?: number; // Váha v tonách
  palletExchange: string;
  dimensions?: string;
  description?: string;
  adrClass?: string;
  referenceNumber?: string;
}

export interface LoadingPlace {
  id: string;
  companyName?: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  dateTime: Date | null;
  contactPerson?: string;
  contactPersonName: string;
  contactPersonPhone: string;
  goods: GoodsItem[];
}

export interface UnloadingPlace {
  id: string;
  companyName?: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  dateTime: Date | null;
  contactPerson?: string;
  contactPersonName: string;
  contactPersonPhone: string;
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
  contactPerson?: string;
  contactPersonName: string;
  contactPersonPhone: string;
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
  customerPaymentTermDays?: number;
  customerId?: string; // Identifikačné číslo zákazníka (napr. Z19233)
  goodsDescription?: string;
  weightKg?: string;
  dimensionsL?: string;
  dimensionsW?: string;
  dimensionsH?: string;
  quantity?: string;
  rating?: OrderRating; // Hodnotenie objednávky/prepravy
}

export interface Order extends Omit<OrderFormData, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface OrderRating {
  // Hodnotenie dopravcu pre túto konkretnú prepravu
  carrierReliability: number; // 0-5
  carrierCommunication: number; // 0-5
  carrierServiceQuality: number; // 0-5
  carrierTimeManagement: number; // 0-5
  
  // Hodnotenie zákazníka pre túto konkretnú prepravu  
  customerPaymentReliability: number; // 0-5
  customerCommunication: number; // 0-5
  customerOverallSatisfaction: number; // 0-5
  
  // Celkové hodnotenie prepravy
  overallTransportRating: number; // 0-5
  
  // Dodatočné informácie
  notes: string;
  ratedBy: string; // ID používateľa ktorý hodnotil
  lastUpdated: Timestamp;
  
  // Pomocné polia pre výpočty
  carrierAverageRating?: number; // automaticky vypočítané
  customerAverageRating?: number; // automaticky vypočítané
}

// Prázdny export aby TypeScript rozpoznal tento súbor ako modul
export {} 