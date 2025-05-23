import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  updateDoc, doc, getDoc, Timestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { useAuth } from './AuthContext';
import { useNotifications } from '../hooks/useNotifications';

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
  // Nová štruktúra: objekt s počtom neprečítaných správ pre každého používateľa
  unreadMessages?: { [userId: string]: number };
  // Backward compatibility - ak ešte existuje starý unreadCount
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
  const { showNotification, updatePageTitle } = useNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchedUsers, setSearchedUsers] = useState<ChatUser[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadConversationsCount, setUnreadConversationsCount] = useState(0);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Pomocná funkcia na získanie počtu neprečítaných správ pre aktuálneho používateľa
  const getUnreadCountForUser = useCallback((conversation: Conversation, userId: string): number => {
    // Ak je to naša vlastná posledná správa, nemáme žiadne neprečítané správy
    if (conversation.lastMessage?.senderId === userId) {
      return 0;
    }
    
    // Nová štruktúra: unreadMessages objektu
    if (conversation.unreadMessages && typeof conversation.unreadMessages === 'object') {
      const count = conversation.unreadMessages[userId] || 0;
      return count;
    }
    
    // Backward compatibility: starý unreadCount (ak je posledná správa nie od nás)
    if (conversation.unreadCount && 
        conversation.lastMessage && 
        conversation.lastMessage.senderId !== userId) {
      return conversation.unreadCount;
    }
    
    return 0;
  }, []);

  // Označenie konverzácie ako prečítanej
  const markConversationAsRead = useCallback(async (conversationId: string): Promise<void> => {
    if (!userData?.uid) return;
    
    try {
      console.log(`Označujem konverzáciu ${conversationId} ako prečítanú pre používateľa ${userData.uid}`);
      
      // Volanie nového Firebase Cloud Function
      const markMessagesAsReadFunction = httpsCallable(functions, 'markMessagesAsRead');
      await markMessagesAsReadFunction({ conversationId });
      
      // Okamžite aktualizujeme lokálny stav pre rýchlu spätnú väzbu
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { 
                ...conv, 
                unreadMessages: {
                  ...conv.unreadMessages,
                  [userData.uid]: 0
                },
                // Aj backward compatibility
                unreadCount: 0
              } 
            : conv
        )
      );
      
      // Aktualizujeme aj current conversation, ak je to tá istá
      setCurrentConversation(prev => 
        prev && prev.id === conversationId 
          ? { 
              ...prev, 
              unreadMessages: {
                ...prev.unreadMessages,
                [userData.uid]: 0
              },
              unreadCount: 0
            } 
          : prev
      );
      
    } catch (error) {
      console.error('Chyba pri označovaní konverzácie ako prečítanej:', error);
    }
  }, [userData?.uid]);

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
  }, [userData]);

  // Výber konverzácie
  const selectConversation = useCallback((conversationId: string): void => {
    setConversations(currentConversations => {
      const conversation = currentConversations.find(c => c.id === conversationId);
      if (conversation) {
        // Okamžite vyčistíme staré správy a nastavíme loading
        setMessages([]);
        setLoadingMessages(true);
        
        setCurrentConversation(conversation);
        
        // Ak má používateľ neprečítané správy, označíme konverzáciu ako prečítanú
        const unreadCount = getUnreadCountForUser(conversation, userData?.uid || '');
        if (unreadCount > 0) {
          setTimeout(() => {
            markConversationAsRead(conversationId).catch(console.error);
          }, 0);
        }
        
        // Aktualizujeme údaje o používateľoch v konverzácii
        setTimeout(() => {
          updateConversationUsersInfo(conversationId, conversation).catch(error => 
            console.error('Chyba pri aktualizovaní informácií používateľov v konverzácii:', error)
          );
        }, 0);
      }
      return currentConversations;
    });
  }, [userData?.uid, markConversationAsRead, updateConversationUsersInfo, getUnreadCountForUser]);

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
      for (let i = 0; i < updatedConversations.length; i++) {
        const conversation = updatedConversations[i];
        let needsLocalUpdate = false;

        const currentUserInfo = conversation.participantsInfo?.[userData.uid];
        if (
          currentUserInfo &&
          (currentUserInfo.companyName === 'Nezadaná firma' || !currentUserInfo.companyName) &&
          userData.companyName
        ) {
          if (!conversation.participantsInfo) conversation.participantsInfo = {};
          if (!conversation.participantsInfo[userData.uid]) conversation.participantsInfo[userData.uid] = {} as any;
          conversation.participantsInfo[userData.uid].companyName = userData.companyName;
          needsLocalUpdate = true;
        }

        const participantsNeedingInfo = conversation.participants.filter(id => {
          if (id === userData.uid) return false;
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

        if (needsLocalUpdate && conversation.id) {
          setTimeout(async () => {
            try {
              await updateDoc(doc(db, 'conversations', conversation.id), {
                participantsInfo: conversation.participantsInfo
              });
            } catch (error) {
              console.error('Chyba pri aktualizovaní informácií v konverzácii:', error);
            }
          }, 100);
        }
      }

      return updatedConversations;
    } catch (error) {
      console.error('Chyba v loadUserCompanyInfo:', error);
      return conversationsData;
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

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const initialConversationsData: Conversation[] = querySnapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data() as Omit<Conversation, 'id'>
      } as Conversation));

      const conversationsWithInfo = await loadUserCompanyInfo(initialConversationsData);

      let unreadCount = 0;
      let hasUnread = false;

      conversationsWithInfo.forEach((conversation) => {
        // Použijeme novú funkciu na získanie počtu neprečítaných správ
        const userUnreadCount = getUnreadCountForUser(conversation, userData.uid);
        
        if (userUnreadCount > 0) {
          unreadCount++;
          hasUnread = true;

          // Vylepšené notifikácie pre nové správy
          if (conversation.lastMessage) {
            const lastMessageTime = conversation.lastMessage.timestamp;
            if (lastMessageTime) {
              const messageDate = lastMessageTime instanceof Date ?
                lastMessageTime :
                lastMessageTime.toDate();

              // Zobrazíme notifikáciu len pre správy mladšie ako 30 sekúnd
              if (Date.now() - messageDate.getTime() < 30000) {
                const senderName = conversation.participantsInfo?.[conversation.lastMessage.senderId]?.name || 'Používateľ';
                const senderCompany = conversation.participantsInfo?.[conversation.lastMessage.senderId]?.companyName;
                
                let notificationTitle = `Nová správa od ${senderName}`;
                if (senderCompany && senderCompany !== 'Nezadaná firma') {
                  notificationTitle += ` (${senderCompany})`;
                }

                showNotification({
                  title: notificationTitle,
                  body: conversation.lastMessage.text,
                  icon: '/favicon.png',
                  tag: `chat-${conversation.id}`,
                  playSound: true,
                  data: { conversationId: conversation.id },
                  onClick: () => {
                    // Otvoríme správnu konverzáciu pri kliknutí na notifikáciu
                    const conv = conversationsWithInfo.find(c => c.id === conversation.id);
                    if (conv) {
                      setCurrentConversation(conv);
                      // Ak máme ChatDrawer komponent, môžeme ho otvoriť
                      // Tu môžeme pridať logiku na otvorenie chat drawer-a
                      window.dispatchEvent(new CustomEvent('openChatDrawer', { 
                        detail: { conversationId: conversation.id } 
                      }));
                    }
                  }
                });
              }
            }
          }
        }
      });

      // Aktualizujeme počet neprečítaných správ v title stránky
      updatePageTitle(unreadCount);

      setUnreadConversationsCount(unreadCount);
      setHasNewMessages(hasUnread);
      setConversations(conversationsWithInfo);
      setLoadingConversations(false);
    });

    return () => unsubscribe();
  }, [userData?.uid, loadUserCompanyInfo, getUnreadCountForUser, showNotification, updatePageTitle]);

  // Načítanie správ pre aktuálnu konverzáciu
  useEffect(() => {
    if (!currentConversation) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    // Loading stav sa už nastavuje v selectConversation
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
      
      // Nastavíme správy a vždy vypneme loading
      setMessages(messagesData);
      setLoadingMessages(false);
    }, (error) => {
      console.error('Chyba pri načítavaní správ:', error);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [currentConversation]);

  // Vyhľadávanie používateľov podľa mena - teraz používa Firebase Cloud Function
  const searchUsersByName = async (searchQuery: string): Promise<void> => {
    if (!searchQuery || searchQuery.length < 2 || !userData?.uid) {
      setSearchedUsers([]);
      return;
    }

    try {
      const searchUsersFunction = httpsCallable(functions, 'searchUsers');
      const result = await searchUsersFunction({ query: searchQuery, limit: 10 });
      
      // @ts-ignore
      const users = result.data.users || [];
      setSearchedUsers(users);
    } catch (error) {
      console.error('Chyba pri vyhľadávaní používateľov:', error);
      setSearchedUsers([]);
    }
  };

  // Vyhľadávanie používateľov podľa emailu
  const searchUsersByEmail = searchUsersByName;

  // Vytvorenie novej konverzácie - teraz používa Firebase Cloud Function
  const createConversation = async (userId: string): Promise<string> => {
    if (!userData?.uid) throw new Error('Používateľ nie je prihlásený');
    if (userData.uid === userId) throw new Error('Nemôžete začať konverzáciu sami so sebou');

    try {
      // Získame informácie o druhom používateľovi
      const otherUserDoc = await getDoc(doc(db, 'users', userId));
      if (!otherUserDoc.exists()) {
        throw new Error('Používateľ neexistuje');
      }
      
      const otherUserData = otherUserDoc.data();

      // Pripravíme údaje o účastníkoch
      const participants = [userData.uid, userId];
      const participantsInfo = {
        [userData.uid]: {
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          email: userData.email || '',
          photoURL: userData.photoURL || '',
          companyName: userData.companyName || ''
        },
        [userId]: {
          name: `${otherUserData.firstName || ''} ${otherUserData.lastName || ''}`.trim(),
          email: otherUserData.email || '',
          photoURL: otherUserData.photoURL || '',
          companyName: otherUserData.companyName || ''
        }
      };

      // Volanie Firebase Cloud Function
      const createConversationFunction = httpsCallable(functions, 'createConversation');
      const result = await createConversationFunction({ participants, participantsInfo });
      
      // @ts-ignore
      const conversationId = result.data.conversationId;
      
      selectConversation(conversationId);
      return conversationId;
    } catch (error) {
      console.error('Chyba pri vytváraní konverzácie:', error);
      throw new Error('Nepodarilo sa vytvoriť konverzáciu');
    }
  };

  // Odoslanie novej správy - teraz len lokálne pridanie, backend sa rieši cez Firebase Functions
  const sendMessage = async (text: string): Promise<void> => {
    if (!text.trim() || !currentConversation || !userData?.uid) return;

    try {
      console.log(`Odosielam správu do konverzácie ${currentConversation.id}: "${text}"`);
      
      // Volanie Firebase Cloud Function pre odoslanie správy
      const sendMessageFunction = httpsCallable(functions, 'sendMessage');
      await sendMessageFunction({ 
        conversationId: currentConversation.id, 
        text: text.trim() 
      });
      
      console.log('Správa úspešne odoslaná cez Firebase Function');
      
      // Lokálny stav sa aktualizuje automaticky cez onSnapshot listenery
    } catch (error) {
      console.error('Chyba pri odosielaní správy:', error);
      throw new Error('Nepodarilo sa odoslať správu');
    }
  };

  // Zatvorenie aktuálnej konverzácie
  const closeConversation = (): void => {
    setCurrentConversation(null);
    setMessages([]);
    setLoadingMessages(false); // Vynulujeme loading stav
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