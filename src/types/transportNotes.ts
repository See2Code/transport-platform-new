import { Timestamp } from 'firebase/firestore';

export interface TransportNotes {
  id?: string;
  companyID: string;
  language: 'sk' | 'en' | 'de' | 'cs' | 'pl'; // Podporované jazyky
  title: string; // Nadpis sekcie (napr. "Všeobecné obchodné podmienky")
  content: string; // Obsah poznámok
  isActive: boolean; // Či sa majú poznámky pridávať do PDF
  lastUpdated: Timestamp;
  updatedBy: string; // UID používateľa ktorý naposledy upravil
  createdAt: Timestamp;
  createdBy: string;
}

export interface TransportNotesFormData {
  language: 'sk' | 'en' | 'de' | 'cs' | 'pl';
  title: string;
  content: string;
  isActive: boolean;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'sk', name: 'Slovenčina', flag: 'https://flagcdn.com/sk.svg' },
  { code: 'en', name: 'Angličtina', flag: 'https://flagcdn.com/gb.svg' },
  { code: 'de', name: 'Nemčina', flag: 'https://flagcdn.com/de.svg' },
  { code: 'cs', name: 'Čeština', flag: 'https://flagcdn.com/cz.svg' },
  { code: 'pl', name: 'Polština', flag: 'https://flagcdn.com/pl.svg' }
] as const; 