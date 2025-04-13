import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

interface NotificationsContextType {
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loading: boolean;
  getLatestNotifications: (count: number) => Promise<any[]>;
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
  const getLatestNotifications = async (count: number = 5) => {
    if (!userData?.companyID) {
      return [];
    }

    try {
      const remindersRef = collection(db, 'reminders');
      const q = query(
        remindersRef,
        where('companyID', '==', userData.companyID),
        orderBy('createdAt', 'desc'),
        limit(count)
      );

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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