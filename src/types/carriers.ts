import { Timestamp } from 'firebase/firestore';

export interface CarrierRating {
    reliability: number; // 1-5 hviezdičiek - spoľahlivosť
    communication: number; // 1-5 hviezdičiek - komunikácia
    serviceQuality: number; // 1-5 hviezdičiek - kvalita služieb
    timeManagement: number; // 1-5 hviezdičiek - dodržiavanie termínov
    notes?: string; // Poznámky k hodnoteniu
    lastUpdated?: Timestamp; // Kedy bolo hodnotenie naposledy aktualizované
    ratedBy?: string; // Kto hodnotenie pridal
}

export interface Carrier {
    id?: string;
    companyName: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    contactName: string;
    contactSurname: string;
    contactEmail: string;
    contactPhone?: string;
    ico?: string;
    dic?: string;
    icDph?: string;
    vehicleTypes?: string[];
    notes?: string;
    paymentTermDays?: number;
    companyID?: string;
    createdAt?: Timestamp | Date; // Aktualizované aby podporovalo aj Date
    rating?: CarrierRating; // Hodnotenie dopravcu
} 