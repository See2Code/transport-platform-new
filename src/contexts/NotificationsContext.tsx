import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, Timestamp, orderBy, limit, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

export type NotificationType = 'message' | 'reminder' | 'system' | 'business';

interface NotificationsContextType {
  unreadCount: number;
  notifications: NotificationData[];
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  getNotificationIcon: (type: NotificationType) => string;
  getNotificationColor: (type: NotificationType) => string;
  formatNotificationDate: (timestamp: Timestamp) => string;
}

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  metadata?: {
    orderId?: string;
    businessCaseId?: string;
    transportId?: string;
    userId?: string;
    [key: string]: any;
  };
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications musí byť použitý v NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  // Načítanie notifikácií
  useEffect(() => {
    if (!userData?.companyID) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('companyID', '==', userData.companyID),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationData[];

      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
      setLoading(false);
    }, (error) => {
      console.error('Chyba pri načítavaní notifikácií:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.companyID]);

  // Označenie notifikácie ako prečítanej
  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Chyba pri označovaní notifikácie ako prečítanej:', error);
    }
  };

  // Označenie všetkých notifikácií ako prečítané
  const markAllAsRead = async () => {
    if (!userData?.companyID) return;

    try {
      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter(n => !n.read);

      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      });

      await batch.commit();
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Chyba pri označovaní všetkých notifikácií:', error);
    }
  };

  // Manuálne obnovenie notifikácií
  const refreshNotifications = async () => {
    if (!userData?.companyID) return;

    try {
      setLoading(true);
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('companyID', '==', userData.companyID),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationData[];

      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
    } catch (error) {
      console.error('Chyba pri obnovovaní notifikácií:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case 'message':
        return 'message';
      case 'reminder':
        return 'alarm';
      case 'system':
        return 'info';
      case 'business':
        return 'business';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
      case 'message':
        return '#2196f3';
      case 'reminder':
        return '#ff9800';
      case 'system':
        return '#4caf50';
      case 'business':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  const formatNotificationDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleString('sk-SK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Bratislava'
    });
  };

  const value = {
    unreadCount,
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    getNotificationIcon,
    getNotificationColor,
    formatNotificationDate
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext; 