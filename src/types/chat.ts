import { Timestamp } from 'firebase/firestore';

export interface ChatMessage {
    id: string;
    content: string;
    senderId: string;
    timestamp: Timestamp;
    read: boolean;
    chatId: string;
    companyID: string;
}

export interface Chat {
    id: string;
    participants: string[];
    lastMessage?: string;
    lastMessageTimestamp?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    companyID: string;
} 