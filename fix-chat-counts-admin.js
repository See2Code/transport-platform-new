const admin = require('firebase-admin');

// Inicializácia admin SDK
const serviceAccount = require('./functions/service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'core-app-423c7'
});

const db = admin.firestore();

async function fixUnreadCounts() {
  try {
    console.log('Začínam opravu unreadMessages...');
    
    const conversationsSnapshot = await db.collection('conversations').get();
    const batch = db.batch();
    let fixedCount = 0;

    for (const conversationDoc of conversationsSnapshot.docs) {
      const conversationData = conversationDoc.data();
      const participants = conversationData.participants || [];
      
      if (participants.length === 0) continue;

      // Získame všetky neprečítané správy v konverzácii
      const messagesSnapshot = await db
        .collection('conversations')
        .doc(conversationDoc.id)
        .collection('messages')
        .where('read', '==', false)
        .get();

      // Spočítame neprečítané správy pre každého používateľa
      const correctUnreadMessages = {};
      
      participants.forEach((participantId) => {
        const unreadMessagesForUser = messagesSnapshot.docs.filter(
          doc => doc.data().senderId !== participantId
        );
        correctUnreadMessages[participantId] = unreadMessagesForUser.length;
      });

      // Porovnáme s aktuálnymi hodnotami
      const currentUnreadMessages = conversationData.unreadMessages || {};
      let needsUpdate = false;

      for (const participantId of participants) {
        if (currentUnreadMessages[participantId] !== correctUnreadMessages[participantId]) {
          needsUpdate = true;
          break;
        }
      }

      if (needsUpdate) {
        batch.update(conversationDoc.ref, {
          unreadMessages: correctUnreadMessages
        });
        fixedCount++;
        console.log(`Opravujeme konverzáciu ${conversationDoc.id}:`, {
          old: currentUnreadMessages,
          new: correctUnreadMessages
        });
      }
    }

    await batch.commit();
    console.log(`Oprava dokončená. Opravených ${fixedCount} konverzácií`);
    
  } catch (error) {
    console.error('Chyba pri oprave:', error);
  } finally {
    process.exit(0);
  }
}

fixUnreadCounts(); 