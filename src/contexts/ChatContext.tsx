import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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
      companyName?: string;
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

  // Funkcia na aktualizáciu informácií o používateľoch v konverzácii
  const updateConversationUsersInfo = useCallback(async (conversationId: string, conversation: Conversation): Promise<void> => {
    if (!userData?.uid) return;
    
    try {
      // Aktualizujeme len informácie o aktuálnom používateľovi
      const updatedParticipantsInfo = {
        ...conversation.participantsInfo,
        [userData.uid]: {
          ...conversation.participantsInfo[userData.uid],
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          email: userData.email || '',
          photoURL: userData.photoURL || '',
          companyName: userData.companyName || ''
        }
      };
      
      // Aktualizujeme databázu
      await updateDoc(doc(db, 'conversations', conversationId), {
        participantsInfo: updatedParticipantsInfo
      });
      
      // Aktualizujeme lokálny stav
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversationId 
            ? { ...conv, participantsInfo: updatedParticipantsInfo } 
            : conv
        )
      );
      
      // Aktualizujeme aj aktuálnu konverzáciu, ak je to tá istá
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => 
          prev 
            ? { ...prev, participantsInfo: updatedParticipantsInfo } 
            : null
        );
      }
    } catch (error) {
      console.error('Chyba pri aktualizovaní informácií používateľov v konverzácii:', error);
    }
  }, [userData, currentConversation]);

  // Označenie konverzácie ako prečítanej
  const markConversationAsRead = useCallback(async (conversationId: string): Promise<void> => {
    if (!userData?.uid) return;
    
    try {
      // Okamžite aktualizujeme lokálne pre rýchlu spätnú väzbu používateľovi
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
      
      if (currentConversation && currentConversation.id === conversationId) {
        setCurrentConversation(prev => prev ? { ...prev, unreadCount: 0 } : null);
      }
      
      // Aktualizujeme Firestore
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
  }, [userData?.uid, currentConversation]);

  // Výber konverzácie
  const selectConversation = useCallback((conversationId: string): void => {
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
      
      // Aktualizujeme údaje o používateľoch v konverzácii (najmä názov firmy)
      updateConversationUsersInfo(conversationId, conversation).catch(error => 
        console.error('Chyba pri aktualizovaní informácií používateľov v konverzácii:', error)
      );
    }
  }, [conversations, userData?.uid, markConversationAsRead, updateConversationUsersInfo]);

  // Kontrola povolení pre notifikácie v prehliadači
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Optimalizovaná funkcia na načítanie aktuálnych údajov o firmách používateľov
  const loadUserCompanyInfo = useCallback(async (conversationsData: Conversation[]) => {
    if (!userData?.uid || conversationsData.length === 0) return;
    
    try {
      // Pre každú konverzáciu skontrolujeme všetkých účastníkov
      for (const conversation of conversationsData) {
        const updates: Record<string, any> = {};
        let needsUpdate = false;
        
        // Získame informácie o aktuálnom používateľovi (ak ešte nie sú aktuálne)
        const currentUserInfo = conversation.participantsInfo[userData.uid];
        if (
          currentUserInfo &&
          (currentUserInfo.companyName === 'Nezadaná firma' || !currentUserInfo.companyName) &&
          userData.companyName
        ) {
          updates[`participantsInfo.${userData.uid}.companyName`] = userData.companyName;
          needsUpdate = true;
        }
        
        // Skontrolujeme ostatných účastníkov - ale len ak konverzácia nemá aktuálne údaje
        // Ak majú aspoň jednu firmu, nebudeme znova načítavať pri každom renderovaní
        if (Object.values(conversation.participantsInfo).some(info => !info.companyName || info.companyName === 'Nezadaná firma')) {
          for (const participantId of conversation.participants) {
            if (participantId === userData.uid) continue; // Preskočíme seba
            
            const participantInfo = conversation.participantsInfo[participantId];
            if (
              participantInfo && 
              (participantInfo.companyName === 'Nezadaná firma' || !participantInfo.companyName)
            ) {
              // Získame aktuálne informácie o užívateľovi z Firestore
              try {
                const userDoc = await getDoc(doc(db, 'users', participantId));
                if (userDoc.exists()) {
                  const userDataFromDb = userDoc.data();
                  // Skúsime získať názov firmy z kolekcie companies
                  if (userDataFromDb.companyID) {
                    try {
                      const companyDoc = await getDoc(doc(db, 'companies', userDataFromDb.companyID));
                      if (companyDoc.exists()) {
                        const companyData = companyDoc.data();
                        if (companyData.companyName) {
                          updates[`participantsInfo.${participantId}.companyName`] = companyData.companyName;
                          needsUpdate = true;
                          continue; // Pokračujeme ďalším používateľom
                        }
                      }
                    } catch (companyError) {
                      console.error(`Chyba pri získavaní údajov o firme pre užívateľa ${participantId}:`, companyError);
                    }
                  }
                  
                  // Ak sme nenašli firmu cez companyID, skúsime použiť companyId (malé 'd')
                  if (userDataFromDb.companyId && userDataFromDb.companyId !== userDataFromDb.companyID) {
                    try {
                      const companyDoc = await getDoc(doc(db, 'companies', userDataFromDb.companyId));
                      if (companyDoc.exists()) {
                        const companyData = companyDoc.data();
                        if (companyData.companyName) {
                          updates[`participantsInfo.${participantId}.companyName`] = companyData.companyName;
                          needsUpdate = true;
                          continue; // Pokračujeme ďalším používateľom
                        }
                      }
                    } catch (companyError) {
                      console.error(`Chyba pri získavaní údajov o firme pre užívateľa ${participantId}:`, companyError);
                    }
                  }
                  
                  // Ak máme názov firmy priamo v údajoch používateľa
                  if (userDataFromDb.companyName) {
                    updates[`participantsInfo.${participantId}.companyName`] = userDataFromDb.companyName;
                    needsUpdate = true;
                  }
                }
              } catch (error) {
                console.error(`Chyba pri získavaní údajov o užívateľovi ${participantId}:`, error);
              }
            }
          }
        }
        
        // Ak sú potrebné aktualizácie, aktualizujeme dokument v Firestore
        if (needsUpdate) {
          try {
            await updateDoc(doc(db, 'conversations', conversation.id), updates);
            console.log(`Aktualizované informácie o firmách pre konverzáciu ${conversation.id}`);
          } catch (error) {
            console.error(`Chyba pri aktualizácii konverzácie ${conversation.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Chyba pri načítaní údajov o firmách:', error);
    }
  }, [userData?.uid, userData?.companyName]);

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
                  icon: '/favicon.png',
                  badge: '/favicon.png',
                  tag: 'chat-message',
                  requireInteraction: true,
                  vibrate: [200, 100, 200]
                };
                
                // Zobrazíme notifikáciu, len ak správa prišla v posledných 30 sekundách
                if (Date.now() - messageDate.getTime() < 30000) {
                  const notification = new Notification(notificationTitle, notificationOptions);
                  
                  // Pridáme event listener pre kliknutie na notifikáciu
                  notification.onclick = () => {
                    window.focus();
                    selectConversation(conversation.id);
                  };
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
      
      // Načítajme údaje o firmách, ale mimo cyklu snímania zmien, aby to neblokujeme zobrazenie konverzácií
      setTimeout(() => {
        loadUserCompanyInfo(conversationsData);
      }, 1000);
    });

    return () => unsubscribe();
  }, [userData?.uid, loadUserCompanyInfo, selectConversation]);

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

    // Získame názov spoločnosti pre aktuálneho používateľa
    let currentUserCompanyName = userData.companyName || '';
    if (userData.companyID) {
      try {
        const companyDoc = await getDoc(doc(db, 'companies', userData.companyID));
        if (companyDoc.exists()) {
          const companyData = companyDoc.data();
          if (companyData.companyName) {
            currentUserCompanyName = companyData.companyName;
          }
        }
      } catch (error) {
        console.error('Chyba pri získavaní názvu spoločnosti aktuálneho používateľa:', error);
      }
    }

    // Získame názov spoločnosti pre druhého používateľa
    let otherUserCompanyName = otherUserData.companyName || '';
    if (otherUserData.companyID) {
      try {
        const companyDoc = await getDoc(doc(db, 'companies', otherUserData.companyID));
        if (companyDoc.exists()) {
          const companyData = companyDoc.data();
          if (companyData.companyName) {
            otherUserCompanyName = companyData.companyName;
          }
        }
      } catch (error) {
        console.error('Chyba pri získavaní názvu spoločnosti druhého používateľa:', error);
      }
    }
    // Ak sme nenašli spoločnosť pomocou companyID, skúsime companyId (malé 'd')
    if (otherUserCompanyName === '' && otherUserData.companyId && otherUserData.companyId !== otherUserData.companyID) {
      try {
        const companyDoc = await getDoc(doc(db, 'companies', otherUserData.companyId));
        if (companyDoc.exists()) {
          const companyData = companyDoc.data();
          if (companyData.companyName) {
            otherUserCompanyName = companyData.companyName;
          }
        }
      } catch (error) {
        console.error('Chyba pri získavaní názvu spoločnosti druhého používateľa cez companyId:', error);
      }
    }
    
    // Vytvoríme novú konverzáciu
    const timestamp = serverTimestamp();
    const participantsInfo = {
      [userData.uid]: {
        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        email: userData.email || '',
        photoURL: userData.photoURL || '',
        companyName: currentUserCompanyName
      },
      [userId]: {
        name: `${otherUserData.firstName || ''} ${otherUserData.lastName || ''}`.trim(),
        email: otherUserData.email || '',
        photoURL: otherUserData.photoURL || '',
        companyName: otherUserCompanyName
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

  // Zatvorenie aktuálnej konverzácie
  const closeConversation = (): void => {
    setCurrentConversation(null);
    setMessages([]);
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