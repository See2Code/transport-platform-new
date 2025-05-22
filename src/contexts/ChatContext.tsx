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
      
      // Aktualizujeme aj current conversation, ak je to tá istá
      setCurrentConversation(prev => 
        prev && prev.id === conversationId 
          ? { ...prev, unreadCount: 0 } 
          : prev
      );
      
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
  }, [userData?.uid]); // Odstránené currentConversation zo závislostí

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
      setCurrentConversation(prev => 
        prev && prev.id === conversationId
          ? { ...prev, participantsInfo: updatedParticipantsInfo } 
          : prev
      );
    } catch (error) {
      console.error('Chyba pri aktualizovaní informácií používateľov v konverzácii:', error);
    }
  }, [userData]); // Zjednodušené dependencies - len userData

  // Výber konverzácie
  const selectConversation = useCallback((conversationId: string): void => {
    // Používame setter function, aby sme mali prístup k aktuálnemu stavu
    setConversations(currentConversations => {
      const conversation = currentConversations.find(c => c.id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
        
        // Ak je posledná správa od druhého používateľa, označíme konverzáciu ako prečítanú
        if (
          conversation.lastMessage && 
          conversation.lastMessage.senderId !== userData?.uid &&
          conversation.unreadCount && 
          conversation.unreadCount > 0
        ) {
          // Volanie markConversationAsRead asynchrónne, aby sme neblokovali UI
          setTimeout(() => {
            markConversationAsRead(conversationId).catch(console.error);
          }, 0);
        }
        
        // Aktualizujeme údaje o používateľoch v konverzácii (najmä názov firmy)
        // Robíme to asynchrónne, aby sme neblokovali UI
        setTimeout(() => {
          updateConversationUsersInfo(conversationId, conversation).catch(error => 
            console.error('Chyba pri aktualizovaní informácií používateľov v konverzácii:', error)
          );
        }, 0);
      }
      return currentConversations; // Vrátime nezmenený stav konverzácií
    });
  }, [userData?.uid, markConversationAsRead, updateConversationUsersInfo]);

  // Kontrola povolení pre notifikácie v prehliadači
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Optimalizovaná funkcia na načítanie aktuálnych údajov o firmách používateľov
  const loadUserCompanyInfo = useCallback(async (conversationsData: Conversation[]): Promise<Conversation[]> => {
    if (!userData?.uid || conversationsData.length === 0) return conversationsData;

    const updatedConversations = [...conversationsData];

    try {
      // Pre každú konverzáciu skontrolujeme všetkých účastníkov
      for (let i = 0; i < updatedConversations.length; i++) {
        const conversation = updatedConversations[i];
        let needsLocalUpdate = false;

        // Získame informácie o aktuálnom používateľovi (ak ešte nie sú aktuálne)
        const currentUserInfo = conversation.participantsInfo?.[userData.uid];
        if (
          currentUserInfo &&
          (currentUserInfo.companyName === 'Nezadaná firma' || !currentUserInfo.companyName) &&
          userData.companyName
        ) {
          // Aktualizujeme len lokálnu kópiu, nebudeme robiť updateDoc hneď
          if (!conversation.participantsInfo) conversation.participantsInfo = {};
          if (!conversation.participantsInfo[userData.uid]) conversation.participantsInfo[userData.uid] = {} as any;
          conversation.participantsInfo[userData.uid].companyName = userData.companyName;
          needsLocalUpdate = true;
        }

        // Skontrolujeme ostatných účastníkov - ale len ak konverzácia nemá aktuálne údaje
        // Optimalizujeme: načítame informácie len raz pre účastníkov, ktorí ich nemajú
        const participantsNeedingInfo = conversation.participants.filter(id => {
          if (id === userData.uid) return false; // Preskočíme seba
          const info = conversation.participantsInfo?.[id];
          return !info || !info.companyName || info.companyName === 'Nezadaná firma';
        });

        if (participantsNeedingInfo.length > 0) {
          for (const participantId of participantsNeedingInfo) {
            try {
              const userDoc = await getDoc(doc(db, 'users', participantId));
              if (userDoc.exists()) {
                const userDataFromDb = userDoc.data();
                let companyName = '';
                
                // Skúsime získať názov firmy z kolekcie companies
                if (userDataFromDb.companyID) {
                  try {
                    const companyDoc = await getDoc(doc(db, 'companies', userDataFromDb.companyID));
                    if (companyDoc.exists()) {
                      const companyData = companyDoc.data();
                      if (companyData.companyName) {
                        companyName = companyData.companyName;
                      }
                    }
                  } catch (error) {
                    console.error(`Chyba pri načítaní firmy pre používateľa ${participantId}:`, error);
                  }
                }

                // Aktualizujeme len lokálnu kópiu
                if (companyName) {
                  if (!conversation.participantsInfo) conversation.participantsInfo = {};
                  if (!conversation.participantsInfo[participantId]) {
                    conversation.participantsInfo[participantId] = {
                      name: `${userDataFromDb.firstName || ''} ${userDataFromDb.lastName || ''}`.trim(),
                      email: userDataFromDb.email || '',
                      photoURL: userDataFromDb.photoURL || '',
                      companyName: companyName
                    };
                  } else {
                    conversation.participantsInfo[participantId].companyName = companyName;
                  }
                  needsLocalUpdate = true;
                }
              }
            } catch (error) {
              console.error(`Chyba pri načítaní používateľa ${participantId}:`, error);
            }
          }
        }

        // Firebase update robíme asynchrónne, aby sme neblokovali UI a nespôsobili nové snapshots hneď
        if (needsLocalUpdate && conversation.id) {
          // Používame setTimeout, aby sa Firebase update vykonal mimo snapshot callback
          setTimeout(async () => {
            try {
              await updateDoc(doc(db, 'conversations', conversation.id), {
                participantsInfo: conversation.participantsInfo
              });
            } catch (error) {
              console.error('Chyba pri aktualizovaní informácií v konverzácii:', error);
            }
          }, 100); // Krátke oneskorenie, aby sa UI aktualizoval najprv
        }
      }

      return updatedConversations;
    } catch (error) {
      console.error('Chyba v loadUserCompanyInfo:', error);
      return conversationsData;
    }
  }, [userData?.uid, userData?.companyName]); // Pridaná závislosť na userData.companyName

  // Načítanie konverzácií pre prihláseného používateľa
  useEffect(() => {
    if (!userData?.uid) return;

    setLoadingConversations(true);
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userData.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      // Mapovanie dát zo snapshotu na pole konverzácií
      const initialConversationsData: Conversation[] = querySnapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data() as Omit<Conversation, 'id'>
      } as Conversation));

      // Načítame údaje o firmách pre tieto konverzácie a počkáme na dokončenie
      const conversationsWithInfo = await loadUserCompanyInfo(initialConversationsData);

      let unreadCount = 0;
      let hasUnread = false;

      // Teraz spracujeme dáta s informáciami o firmách
      conversationsWithInfo.forEach((conversation) => {
        // Počítame neprečítané konverzácie (kde posledná správa nie je od nás a nebola prečítaná)
        if (
          conversation.lastMessage &&
          conversation.lastMessage.senderId !== userData?.uid &&
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
                // Použijeme informácie o odosielateľovi priamo z conversation.participantsInfo, ak sú dostupné
                const senderName = conversation.participantsInfo?.[conversation.lastMessage.senderId]?.name || 'Používateľ';
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
                    // Volanie selectConversation priamo, nie cez závislosť
                    const conv = conversationsWithInfo.find(c => c.id === conversation.id);
                    if (conv) {
                      setCurrentConversation(conv);
                    }
                  };
                }
              }
            } catch (error) {
              console.error('Chyba pri zobrazovaní notifikácie', error);
            }
          }
        }
      });

      setUnreadConversationsCount(unreadCount);
      setHasNewMessages(hasUnread);
      setConversations(conversationsWithInfo);
      setLoadingConversations(false);
    });

    return () => unsubscribe();
  }, [userData?.uid, loadUserCompanyInfo]);

  // Načítanie správ pre aktuálnu konverzáciu
  useEffect(() => {
    if (!currentConversation) {
      setMessages([]);
      setLoadingMessages(false);
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