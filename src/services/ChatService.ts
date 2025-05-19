import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Chat, ChatMessage } from '../types/chat';

export const createChat = async (participants: string[]): Promise<string> => {
  try {
    const chatData = {
      participants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const chatRef = await addDoc(collection(db, 'chats'), chatData);
    return chatRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

export const getChatsByUserId = (userId: string, callback: (chats: Chat[]) => void) => {
  const chatsQuery = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(chatsQuery, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Chat[];
    
    callback(chats);
  });
};

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (chatDoc.exists()) {
      return {
        id: chatDoc.id,
        ...chatDoc.data()
      } as Chat;
    }
    return null;
  } catch (error) {
    console.error('Error getting chat:', error);
    throw error;
  }
};

export const sendMessage = async (chatId: string, senderId: string, content: string): Promise<string> => {
  try {
    // Create the message
    const messageData = {
      chatId,
      senderId,
      content,
      timestamp: serverTimestamp(),
      read: false
    };
    
    const messageRef = await addDoc(collection(db, 'messages'), messageData);
    
    // Update the chat with last message
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: content,
      lastMessageTimestamp: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getMessagesByChatId = (chatId: string, callback: (messages: ChatMessage[]) => void) => {
  const messagesQuery = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];
    
    callback(messages);
  });
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  try {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      where('senderId', '!=', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(messagesQuery);
    
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

export const chatService = {
  getCurrentUserId: () => {
    return auth.currentUser?.uid || '';
  },
  
  startListeningToMessages: (chatId: string, callback: (messages: ChatMessage[]) => void) => {
    return getMessagesByChatId(chatId, callback);
  },
  
  sendMessage: async (chatId: string, content: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User is not authenticated');
    }
    return sendMessage(chatId, userId, content);
  },
  
  getChatsByUserId: (userId: string, callback: (chats: Chat[]) => void) => {
    return getChatsByUserId(userId, callback);
  },
  
  markMessagesAsRead: async (chatId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User is not authenticated');
    }
    return markMessagesAsRead(chatId, userId);
  },
  
  createChat: async (participantIds: string[]) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User is not authenticated');
    }
    if (!participantIds.includes(userId)) {
      participantIds.push(userId);
    }
    return createChat(participantIds);
  }
}; 