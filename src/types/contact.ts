import { Timestamp } from 'firebase/firestore';

export interface Country {
  code: string;
  name: string;
  prefix: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  phonePrefix: string;
  phoneNumber: string;
  countryCode: string;
  email: string;
  notes?: string;
  position?: string;
  companyID?: string; // ID firmy
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  displayName?: string;
  companyID?: string;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  phonePrefix: string;
  countryCode: string;
  email: string;
  position: string;
  note: string;
  creatorId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
} 