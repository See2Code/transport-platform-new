import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  syncNotifications: () => Promise<void>;
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
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  
  // Referencia pre sledovanie prebiehajúcich operácií
  const isLoadingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const fetchDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Minimálny čas medzi načítavaniami (ms)
  const MIN_FETCH_INTERVAL = 1000;

  // Funkcia na načítanie notifikácií a počítanie neprečítaných - s debouncingom
  const fetchNotifications = useCallback(async () => {
    if (!userData?.companyID) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    
    // Ak už načítavanie prebieha, preskočíme
    if (isLoadingRef.current) {
      console.log("Načítavanie už prebieha, preskakujem duplicitné volanie");
      return;
    }
    
    // Kontrola času od posledného načítania
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    if (timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      console.log(`Príliš skoré volanie (${timeSinceLastFetch}ms od posledného), odkladám načítavanie`);
      
      // Zrušíme predchádzajúci timeout, ak existuje
      if (fetchDebounceTimeoutRef.current) {
        clearTimeout(fetchDebounceTimeoutRef.current);
      }
      
      // Nastavíme nový timeout pre oneskorené načítavanie
      fetchDebounceTimeoutRef.current = setTimeout(() => {
        console.log("Spúšťam oneskorené načítavanie notifikácií");
        fetchNotifications();
      }, MIN_FETCH_INTERVAL - timeSinceLastFetch);
      
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      
      const remindersRef = collection(db, 'reminders');
      const q = query(
        remindersRef,
        where('companyID', '==', userData.companyID)
      );

      const snapshot = await getDocs(q);
      const count = snapshot.docs.filter(doc => !doc.data().sent).length;

      setUnreadCount(count);
      lastFetchTimeRef.current = Date.now();
    } catch (error) {
      console.error("Chyba pri načítavaní počtu notifikácií:", error);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [userData?.companyID]);

  // Získanie niekoľkých najnovších notifikácií
  const getLatestNotifications = async (count: number = 5): Promise<NotificationData[]> => {
    if (!userData?.companyID) {
      return [];
    }
    
    // Ak už prebieha načítavanie, počkáme kým sa dokončí
    if (isLoadingRef.current) {
      console.log("Čakám na dokončenie prebiehajúceho načítavania...");
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (isLoadingRef.current) {
        console.log("Stále prebieha načítavanie, vraciam prázdny zoznam");
        return [];
      }
    }

    try {
      isLoadingRef.current = true;
      
      const remindersRef = collection(db, 'reminders');
      
      // Použijeme len where filter bez orderBy, aby sme sa vyhli potrebe indexu
      const basicQuery = query(
        remindersRef,
        where('companyID', '==', userData.companyID)
      );
      
      const allSnapshot = await getDocs(basicQuery);
      // Znížime úroveň logovania pre lepší výkon
      if (allSnapshot.empty) {
        return [];
      }
      
      // Namiesto použitia orderBy v query, načítame všetky a zoradíme ich v pamäti
      const allNotifications: NotificationData[] = allSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Zabezpečíme, že všetky základné polia existujú
          type: data.type || 'business',
          reminderTime: data.reminderTime || null,
          reminderDateTime: data.reminderDateTime || null,
          sent: data.sent || false,
          shown: data.shown || false,
          createdAt: data.createdAt || new Date(),
          orderNumber: data.orderNumber || 'Neznáme číslo',
          companyName: data.companyName || 'Neznáma spoločnosť',
          address: data.address || 'Neuvedená adresa',
          reminderNote: data.reminderNote || ''
        };
      });
      
      // Zoradíme notifikácie podľa času pripomienky (novšie najprv)
      // Odstránime nadbytočné logovania pre lepší výkon
      const sortedNotifications = [...allNotifications].sort((a, b) => {
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
          
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          console.error("Chyba pri konverzii dátumov:", error);
          return 0;
        }
      });
      
      lastFetchTimeRef.current = Date.now();
      // Vrátime prvých 'count' notifikácií
      return sortedNotifications.slice(0, count);
    } catch (error) {
      console.error("Chyba pri načítavaní najnovších notifikácií:", error);
      return [];
    } finally {
      isLoadingRef.current = false;
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

  // Synchronizácia stavu notifikácií medzi popupom a stránkou
  const syncNotifications = async () => {
    // Ignorujeme príliš časté volania synchronizácie
    const now = Date.now();
    if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      console.log("Preskakujem syncNotifications - príliš krátky interval od posledného volania");
      return;
    }
    
    await fetchNotifications();
    setLastRefreshTime(new Date());
  };

  const value = {
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    loading,
    getLatestNotifications,
    syncNotifications
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext; 