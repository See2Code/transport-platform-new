import { Timestamp } from 'firebase/firestore';

export type DocumentType = 
  | 'customer_order'       // Objednávka zákazníka - modrá
  | 'carrier_invoice'      // Faktúra od dopravcu - oranžová  
  | 'our_invoice'          // Naša faktúra - fialová
  | 'cmr'                 // CMR - zelená
  | 'insurance'           // Poistenie - fialová
  | 'credit_note'         // Dobropis - červená
  | 'our_payment'         // Naša úhrada - červená tmavá
  | 'other';              // Ostatné - sivá

export interface OrderDocument {
  id: string;
  orderId: string;
  companyID: string;
  name: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface DocumentTypeConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const DOCUMENT_TYPE_CONFIG: Record<DocumentType, DocumentTypeConfig> = {
  customer_order: {
    label: 'Objednávka zákazníka',
    color: '#1976d2',
    bgColor: 'rgba(25, 118, 210, 0.1)',
    icon: '📋'
  },
  carrier_invoice: {
    label: 'Faktúra od dopravcu',
    color: '#ff9f43',
    bgColor: 'rgba(255, 159, 67, 0.1)',
    icon: '🧾'
  },
  our_invoice: {
    label: 'Naša faktúra',
    color: '#7b1fa2',
    bgColor: 'rgba(123, 31, 162, 0.1)',
    icon: '📄'
  },
  cmr: {
    label: 'CMR',
    color: '#4caf50',
    bgColor: 'rgba(76, 175, 80, 0.1)',
    icon: '🚛'
  },
  insurance: {
    label: 'Poistenie',
    color: '#9c27b0',
    bgColor: 'rgba(156, 39, 176, 0.1)',
    icon: '🛡️'
  },
  credit_note: {
    label: 'Dobropis',
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.1)',
    icon: '💸'
  },
  our_payment: {
    label: 'Naša úhrada',
    color: '#d32f2f',
    bgColor: 'rgba(211, 47, 47, 0.1)',
    icon: '💳'
  },
  other: {
    label: 'Ostatné',
    color: '#757575',
    bgColor: 'rgba(117, 117, 117, 0.1)',
    icon: '📄'
  }
};

export {} // Prázdny export aby TypeScript rozpoznal tento súbor ako modul 