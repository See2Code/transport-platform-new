import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

export const migrateNotifications = async (companyID: string) => {
  try {
    // Načítame všetky staré notifikácie
    const oldNotificationsRef = collection(db, 'reminders');
    const snapshot = await getDocs(oldNotificationsRef);
    
    // Vytvoríme batch pre hromadné operácie
    const batch = writeBatch(db);
    
    // Nová kolekcia pre notifikácie
    const newNotificationsRef = collection(db, 'notifications');
    
    snapshot.docs.forEach(oldDoc => {
      const oldData = oldDoc.data();
      
      // Vytvoríme novú notifikáciu s novým formátom
      const newNotification = {
        type: oldData.type || 'business',
        title: oldData.title || 'Notifikácia',
        message: oldData.reminderNote || oldData.message || 'Bez obsahu',
        read: oldData.sent || false,
        createdAt: oldData.createdAt || oldData.reminderDateTime || oldData.reminderTime || new Date(),
        companyID: oldData.companyID,
        metadata: {
          orderId: oldData.orderNumber,
          businessCaseId: oldData.businessCaseId,
          transportId: oldData.transportId,
          userId: oldData.userId
        }
      };
      
      // Pridáme do batch operácie
      const newDocRef = doc(newNotificationsRef);
      batch.set(newDocRef, newNotification);
    });
    
    // Vykonáme všetky operácie naraz
    await batch.commit();
    
    console.log('Migrácia notifikácií dokončená');
  } catch (error) {
    console.error('Chyba pri migrácii notifikácií:', error);
    throw error;
  }
}; 