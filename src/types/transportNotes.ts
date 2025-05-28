import { Timestamp } from 'firebase/firestore';

export interface TransportNotes {
  id?: string;
  companyID: string;
  language: 'sk' | 'en' | 'de' | 'cs'; // Podporované jazyky
  title: string; // Nadpis sekcie (napr. "Všeobecné obchodné podmienky")
  content: string; // Obsah poznámok
  isActive: boolean; // Či sa majú poznámky pridávať do PDF
  lastUpdated: Timestamp;
  updatedBy: string; // UID používateľa ktorý naposledy upravil
  createdAt: Timestamp;
  createdBy: string;
}

export interface TransportNotesFormData {
  language: 'sk' | 'en' | 'de' | 'cs';
  title: string;
  content: string;
  isActive: boolean;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  { code: 'en', name: 'Angličtina', flag: '🇬🇧' },
  { code: 'de', name: 'Nemčina', flag: '🇩🇪' },
  { code: 'cs', name: 'Čeština', flag: '��🇿' }
] as const; 