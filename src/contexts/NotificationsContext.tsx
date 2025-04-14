import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

interface NotificationsContextType {
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loading: boolean;
  getLatestNotifications: (count: number) => Promise<NotificationData[]>;
}

// Rozhranie pre notifikačné dáta
interface NotificationData {
  id: string;
  type?: 'loading' | 'unloading' | 'business';
  sent?: boolean;
  shown?: boolean;
  companyID?: string;
  userId?: string;
  userEmail?: string;
  reminderDateTime?: Timestamp | Date;
  reminderTime?: Timestamp | Date;
  createdAt?: Timestamp | Date;
  orderNumber?: string;
  companyName?: string;
  address?: string;
  transportId?: string;
  businessCaseId?: string;
  reminderNote?: string;
  [key: string]: any; // Pre ďalšie vlastnosti, ktoré môžu existovať
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  // Funkcia na načítanie notifikácií a počítanie neprečítaných
  const fetchNotifications = useCallback(async () => {
    if (!userData?.companyID) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const remindersRef = collection(db, 'reminders');
      const q = query(
        remindersRef,
        where('companyID', '==', userData.companyID)
      );

      const snapshot = await getDocs(q);
      const count = snapshot.docs.filter(doc => !doc.data().sent).length;

      setUnreadCount(count);
    } catch (error) {
      console.error("Chyba pri načítavaní počtu notifikácií:", error);
    } finally {
      setLoading(false);
    }
  }, [userData?.companyID]);

  // Získanie niekoľkých najnovších notifikácií
  const getLatestNotifications = async (count: number = 5): Promise<NotificationData[]> => {
    if (!userData?.companyID) {
      return [];
    }

    try {
      const remindersRef = collection(db, 'reminders');
      
      // Použijeme len where filter bez orderBy, aby sme sa vyhli potrebe indexu
      const basicQuery = query(
        remindersRef,
        where('companyID', '==', userData.companyID)
      );
      
      const allSnapshot = await getDocs(basicQuery);
      console.log(`Celkový počet notifikácií v systéme: ${allSnapshot.size}`);
      
      if (allSnapshot.empty) {
        console.log("Nenašli sa žiadne notifikácie pre tento companyID");
        return [];
      }
      
      // Namiesto použitia orderBy v query, načítame všetky a zoradíme ich v pamäti
      const allNotifications: NotificationData[] = allSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
      
      console.log(`Spracovaných ${allNotifications.length} notifikácií`);
      
      // Zoradíme notifikácie podľa času pripomienky (novšie najprv)
      const sortedNotifications = [...allNotifications].sort((a, b) => {
        // Pre ladenie vypíšeme dáta
        console.log("Porovnávam:", { 
          a: { id: a.id, time: a.reminderDateTime || a.reminderTime || a.createdAt },
          b: { id: b.id, time: b.reminderDateTime || b.reminderTime || b.createdAt }
        });
      
        // Použijeme reminderDateTime alebo reminderTime alebo createdAt
        const timeA = a.reminderDateTime || a.reminderTime || a.createdAt;
        const timeB = b.reminderDateTime || b.reminderTime || b.createdAt;
        
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        
        let dateA: Date, dateB: Date;
        
        try {
          // Konvertujeme Timestamp na Date
          if (timeA instanceof Timestamp) {
            dateA = timeA.toDate();
          } else if (typeof timeA === 'object' && timeA !== null && 'toDate' in timeA && typeof timeA.toDate === 'function') {
            dateA = timeA.toDate();
          } else {
            dateA = new Date(timeA as any);
          }
          
          if (timeB instanceof Timestamp) {
            dateB = timeB.toDate();
          } else if (typeof timeB === 'object' && timeB !== null && 'toDate' in timeB && typeof timeB.toDate === 'function') {
            dateB = timeB.toDate();
          } else {
            dateB = new Date(timeB as any);
          }
          
          console.log("Konvertované dátumy:", { 
            a: dateA.toString(), 
            b: dateB.toString() 
          });
          
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          console.error("Chyba pri konverzii dátumov:", error);
          return 0;
        }
      });
      
      console.log("Zoradených notifikácií:", sortedNotifications.length);
      
      // Vrátime prvých 'count' notifikácií
      return sortedNotifications.slice(0, count);
    } catch (error) {
      console.error("Chyba pri načítavaní najnovších notifikácií:", error);
      return [];
    }
  };

  // Označiť notifikáciu ako prečítanú
  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'reminders', notificationId);
      await updateDoc(notificationRef, {
        sent: true,
        shown: true
      });
      await fetchNotifications();
    } catch (error) {
      console.error("Chyba pri označovaní notifikácie:", error);
    }
  };

  // Označiť všetky notifikácie ako prečítané
  const markAllAsRead = async () => {
    if (!userData?.companyID) return;

    try {
      const remindersRef = collection(db, 'reminders');
      const q = query(
        remindersRef,
        where('companyID', '==', userData.companyID),
        where('sent', '==', false)
      );

      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          sent: true,
          shown: true
        })
      );

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Chyba pri označovaní všetkých notifikácií:", error);
    }
  };

  // Nastavenie poslucháča zmien v notifikáciách
  useEffect(() => {
    if (!userData?.companyID) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const remindersRef = collection(db, 'reminders');
    const q = query(
      remindersRef,
      where('companyID', '==', userData.companyID)
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const count = snapshot.docs.filter(doc => !doc.data().sent).length;
      setUnreadCount(count);
      setLoading(false);
    }, (error) => {
      console.error("Chyba pri sledovaní notifikácií:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.companyID]);

  const value = {
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    loading,
    getLatestNotifications
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext; 