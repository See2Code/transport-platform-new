import { Timestamp } from 'firebase/firestore';

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
    companyID?: string;
    createdAt?: Timestamp;
} 