import { Timestamp } from 'firebase/firestore';

export interface CustomerRating {
    paymentReliability: number; // 1-5 hviezdičiek - platí/neplatí včas
    communication: number; // 1-5 hviezdičiek - komunikácia
    overallSatisfaction: number; // 1-5 hviezdičiek - celková spokojnosť
    notes?: string; // Poznámky k hodnoteniu
    lastUpdated?: Timestamp; // Kedy bolo hodnotenie naposledy aktualizované
    ratedBy?: string; // Kto hodnotenie pridal
}

export interface Customer {
    id?: string;
    company: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    contactName: string;
    contactSurname: string;
    email: string;
    phone?: string;
    contactPhonePrefix?: string;
    contactPhone?: string;
    ico?: string;
    dic?: string;
    vatId?: string;
    customerId?: string; // Identifikačné číslo zákazníka (napr. Z19233)
    companyID?: string;
    createdAt?: Timestamp | Date;
    paymentTermDays?: number; // Splatnosť v dňoch (default 30)
    rating?: CustomerRating; // Hodnotenie zákazníka
} 