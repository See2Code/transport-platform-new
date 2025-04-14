import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, 
  updateDoc, doc, getDoc, getDocs, Timestamp, limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

// Definícia typov
export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  timestamp: Timestamp;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantsInfo: {
    [userId: string]: {
      name: string;
      email: string;
      photoURL?: string;
    }
  };
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
    senderId: string;
  };
  unreadCount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatUser {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string;
  companyName?: string;
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  searchedUsers: ChatUser[];
  loadingConversations: boolean;
  loadingMessages: boolean;
  searchUsersByName: (query: string) => Promise<void>;
  searchUsersByEmail: (query: string) => Promise<void>;
  createConversation: (userId: string) => Promise<string>;
  sendMessage: (text: string) => Promise<void>;
  selectConversation: (conversationId: string) => void;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  unreadConversationsCount: number;
  closeConversation: () => void;
  hasNewMessages: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat musí byť použitý vnútri ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchedUsers, setSearchedUsers] = useState<ChatUser[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadConversationsCount, setUnreadConversationsCount] = useState(0);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Načítanie konverzácií pre prihláseného používateľa
  useEffect(() => {
    if (!userData?.uid) return;

    setLoadingConversations(true);
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userData.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const conversationsData: Conversation[] = [];
      let unreadCount = 0;
      let hasUnread = false;
      
      querySnapshot.forEach((doc) => {
        const conversationData = doc.data() as Omit<Conversation, 'id'>;
        const conversation: Conversation = {
          id: doc.id,
          ...conversationData,
          createdAt: conversationData.createdAt as Timestamp,
          updatedAt: conversationData.updatedAt as Timestamp,
          lastMessage: conversationData.lastMessage ? {
            ...conversationData.lastMessage,
            timestamp: conversationData.lastMessage.timestamp as Timestamp
          } : undefined
        };
        
        // Počítame neprečítané konverzácie (kde posledná správa nie je od nás a nebola prečítaná)
        if (
          conversation.lastMessage && 
          conversation.lastMessage.senderId !== userData.uid && 
          conversation.unreadCount && 
          conversation.unreadCount > 0
        ) {
          unreadCount++;
          hasUnread = true;
          
          // Kontrola, či potrebujeme zobraziť notifikáciu pre novú správu
          const lastMessageTime = conversation.lastMessage.timestamp;
          if (lastMessageTime) {
            const messageDate = lastMessageTime instanceof Date ? 
              lastMessageTime : 
              lastMessageTime.toDate();
            
            // Notifikácia na systémovej úrovni pre nové správy
            try {
              // Pokiaľ je podporovaná notifikácia v prehliadači a používateľ má povolenia
              if ("Notification" in window && Notification.permission === "granted") {
                const senderName = conversation.participantsInfo[conversation.lastMessage.senderId]?.name || 'Používateľ';
                const notificationTitle = `Nová správa od ${senderName}`;
                const notificationOptions = {
                  body: conversation.lastMessage.text,
                  icon: '/favicon.png', // Použijeme ikonu vašej aplikácie
                };
                
                // Zobrazíme notifikáciu, len ak správa prišla v posledných 10 sekundách
                if (Date.now() - messageDate.getTime() < 10000) {
                  new Notification(notificationTitle, notificationOptions);
                }
              }
            } catch (error) {
              console.error('Chyba pri zobrazovaní notifikácie', error);
            }
          }
        }
        
        conversationsData.push(conversation);
      });
      
      setUnreadConversationsCount(unreadCount);
      setHasNewMessages(hasUnread);
      setConversations(conversationsData);
      setLoadingConversations(false);
    });

    return () => unsubscribe();
  }, [userData?.uid]);

  // Načítanie správ pre aktuálnu konverzáciu
  useEffect(() => {
    if (!currentConversation) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const q = query(
      collection(db, 'conversations', currentConversation.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData: Message[] = [];
      querySnapshot.forEach((doc) => {
        const message = {
          id: doc.id,
          ...doc.data()
        } as Message;
        messagesData.push(message);
      });
      setMessages(messagesData);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [currentConversation]);

  // Vyhľadávanie používateľov podľa mena
  const searchUsersByName = async (searchQuery: string): Promise<void> => {
    if (!searchQuery || searchQuery.length < 2 || !userData?.uid) {
      setSearchedUsers([]);
      return;
    }

    try {
      // Odstránime diakritiku a prevedieme na malé písmená
      const normalizedQuery = searchQuery.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim();

      console.log('Vyhľadávam používateľov podľa: ', normalizedQuery);

      // Získame všetkých používateľov (s limitom)
      const usersQuery = query(
        collection(db, 'users'),
        limit(100)
      );

      const usersSnapshot = await getDocs(usersQuery);
      
      // Filtrovanie používateľov v kóde namiesto v databáze
      const results: ChatUser[] = [];
      
      usersSnapshot.forEach(doc => {
        if (doc.id === userData?.uid) return; // Preskočíme seba samého
        
        const userInfo = doc.data();
        
        // Normalizované verzie pre vyhľadávanie
        const firstName = (userInfo.firstName || '')
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        const lastName = (userInfo.lastName || '')
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        const email = (userInfo.email || '')
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        
        // Hľadáme zhodu v rôznych poliach
        if (firstName.includes(normalizedQuery) || 
            lastName.includes(normalizedQuery) ||
            email.includes(normalizedQuery) ||
            `${firstName} ${lastName}`.includes(normalizedQuery)) {
          
          results.push({
            uid: doc.id,
            firstName: userInfo.firstName || '',
            lastName: userInfo.lastName || '',
            email: userInfo.email || '',
            photoURL: userInfo.photoURL,
            companyName: userInfo.companyName
          });
        }
      });
      
      console.log('Výsledky vyhľadávania:', results);
      setSearchedUsers(results);
    } catch (error) {
      console.error('Chyba pri vyhľadávaní používateľov:', error);
      setSearchedUsers([]);
    }
  };

  // Vyhľadávanie používateľov podľa emailu (budeme používať rovnakú metódu)
  const searchUsersByEmail = searchUsersByName;

  // Vytvorenie novej konverzácie
  const createConversation = async (userId: string): Promise<string> => {
    if (!userData?.uid) throw new Error('Používateľ nie je prihlásený');
    if (userData.uid === userId) throw new Error('Nemôžete začať konverzáciu sami so sebou');

    // Najprv skontrolujeme, či už konverzácia existuje
    const existingConversationQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userData.uid)
    );

    const querySnapshot = await getDocs(existingConversationQuery);
    
    // Kontrolujeme, či existuje konverzácia s týmto používateľom
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      if (data.participants && Array.isArray(data.participants) && data.participants.includes(userId)) {
        // Konverzácia už existuje
        const conversationId = doc.id;
        selectConversation(conversationId);
        return conversationId;
      }
    }

    // Ak sme tu, konverzácia neexistuje a musíme ju vytvoriť
    // Získame informácie o druhom používateľovi
    const otherUserDoc = await getDoc(doc(db, 'users', userId));
    if (!otherUserDoc.exists()) {
      throw new Error('Používateľ neexistuje');
    }
    
    const otherUserData = otherUserDoc.data();
    
    // Vytvoríme novú konverzáciu
    const timestamp = serverTimestamp();
    const participantsInfo = {
      [userData.uid]: {
        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        email: userData.email || '',
        photoURL: userData.photoURL || ''
      },
      [userId]: {
        name: `${otherUserData.firstName || ''} ${otherUserData.lastName || ''}`.trim(),
        email: otherUserData.email || '',
        photoURL: otherUserData.photoURL || ''
      }
    };
    
    const newConversationRef = await addDoc(collection(db, 'conversations'), {
      participants: [userData.uid, userId],
      participantsInfo,
      createdAt: timestamp,
      updatedAt: timestamp,
      unreadCount: 0
    });
    
    selectConversation(newConversationRef.id);
    return newConversationRef.id;
  };

  // Odoslanie novej správy
  const sendMessage = async (text: string): Promise<void> => {
    if (!text.trim() || !currentConversation || !userData?.uid) return;

    try {
      const timestamp = serverTimestamp();
      const senderName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      
      // Pridáme správu do podkolekcie messages v aktuálnej konverzácii
      await addDoc(collection(db, 'conversations', currentConversation.id, 'messages'), {
        text,
        senderId: userData.uid,
        senderName,
        timestamp,
        read: false
      });
      
      // Aktualizujeme informácie o poslednej správe v konverzácii
      const otherParticipantId = currentConversation.participants.find(id => id !== userData.uid);
      
      if (!otherParticipantId) {
        throw new Error('Druhý účastník konverzácie nenájdený');
      }
      
      await updateDoc(doc(db, 'conversations', currentConversation.id), {
        lastMessage: {
          text,
          timestamp,
          senderId: userData.uid
        },
        updatedAt: timestamp,
        // Zvýšime počet neprečítaných správ pre druhého účastníka
        unreadCount: 1,
      });
      
    } catch (error) {
      console.error('Chyba pri odosielaní správy:', error);
      throw new Error('Nepodarilo sa odoslať správu');
    }
  };

  // Výber konverzácie
  const selectConversation = (conversationId: string): void => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      
      // Ak je posledná správa od druhého používateľa, označíme konverzáciu ako prečítanú
      if (
        conversation.lastMessage && 
        conversation.lastMessage.senderId !== userData?.uid &&
        conversation.unreadCount && 
        conversation.unreadCount > 0
      ) {
        markConversationAsRead(conversationId).catch(console.error);
      }
    }
  };

  // Označenie konverzácie ako prečítanej
  const markConversationAsRead = async (conversationId: string): Promise<void> => {
    if (!userData?.uid) return;
    
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        unreadCount: 0
      });
      
      // Označíme aj všetky správy v konverzácii ako prečítané
      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        where('senderId', '!=', userData.uid),
        where('read', '==', false)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const updatePromises = messagesSnapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Chyba pri označovaní konverzácie ako prečítanej:', error);
    }
  };

  // Zatvorenie aktuálnej konverzácie
  const closeConversation = (): void => {
    setCurrentConversation(null);
    setMessages([]);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      // Odstránim zobrazenie času v zozname
      return '';
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const value = {
    conversations,
    currentConversation,
    messages,
    searchedUsers,
    loadingConversations,
    loadingMessages,
    searchUsersByName,
    searchUsersByEmail,
    createConversation,
    sendMessage,
    selectConversation,
    markConversationAsRead,
    unreadConversationsCount,
    closeConversation,
    hasNewMessages
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext; 