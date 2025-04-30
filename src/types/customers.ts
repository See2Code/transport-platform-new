import { Timestamp } from 'firebase/firestore';

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
    vatId?: string;
    companyID?: string;
    createdAt?: Timestamp;
} 