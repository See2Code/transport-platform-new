export interface Customer {
  company: string;
  vatId: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  contactName: string;
  contactSurname: string;
  email: string;
  phone: string;
  id?: string;
}

export interface GoodsItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  palletExchange?: string;
  dimensions?: string;
  description?: string;
  adrClass?: string;
  referenceNumber?: string;
}

export interface LoadingPlace {
  id?: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  dateTime: string | Date | null;
  contactPerson: string;
  goods?: GoodsItem[];
}

export interface UnloadingPlace {
  id?: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  dateTime: string | Date | null;
  contactPerson: string;
  goods?: GoodsItem[];
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
  // Údaje zákazníka
  customerCompany: string;
  customerVatId: string;
  customerStreet: string;
  customerCity: string;
  customerZip: string;
  customerCountry: string;
  customerContactName: string;
  customerContactSurname: string;
  customerEmail: string;
  customerPhone: string;
  customerPrice: string;

  // Miesta nakládky a vykládky
  loadingPlaces: LoadingPlace[];
  unloadingPlaces: UnloadingPlace[];

  // Údaje o tovare
  goodsDescription: string;
  weightKg: string;
  dimensionsL: string;
  dimensionsW: string;
  dimensionsH: string;
  quantity: string;

  // Údaje o dopravcovi
  carrierCompany: string;
  carrierContact: string;
  carrierVehicleReg: string;
  carrierPrice: string;
}

export interface Order extends OrderFormData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  userId: string;
  companyId: string;
}

// Prázdny export aby TypeScript rozpoznal tento súbor ako modul
export {} 