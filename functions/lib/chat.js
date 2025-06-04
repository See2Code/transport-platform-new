"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixUnreadCounts = exports.deleteConversation = exports.getConversationMessages = exports.getUserConversations = exports.updateUserProfileInConversations = exports.searchUsers = exports.markMessagesAsRead = exports.sendMessage = exports.createConversation = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const REGION = 'europe-west1';
// Pomocná funkcia na odoslanie notifikácie o novej správe
async function sendChatNotification(recipientId, senderId, senderName, messageText, conversationId) {
    try {
        // Vytvoríme novú notifikáciu v Firestore
        await db.collection('notifications').add({
            recipientId,
            senderId,
            type: 'new_message',
            message: `${senderName}: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`,
            read: false,
            conversationId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Notifikácia o novej správe bola vytvorená pre používateľa ${recipientId}`);
        return true;
    }
    catch (error) {
        console.error('Chyba pri odosielaní notifikácie o novej správe:', error);
        return false;
    }
}
// Pomocná funkcia na inicializáciu unreadMessages objektu
function initializeUnreadMessages(participants) {
    const unreadMessages = {};
    participants.forEach(participantId => {
        unreadMessages[participantId] = 0;
    });
    return unreadMessages;
}
// Funkcia na vytvorenie konverzácie
exports.createConversation = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Používateľ nie je prihlásený');
    }
    try {
        const { participants, participantsInfo } = data;
        const currentUserId = context.auth.uid;
        // Overíme, že aktuálny používateľ je v participants
        if (!participants.includes(currentUserId)) {
            throw new functions.https.HttpsError('permission-denied', 'Nemôžete vytvoriť konverzáciu bez seba');
        }
        // Skontrolujeme, či už konverzácia existuje
        const existingConversationsQuery = await db
            .collection('conversations')
            .where('participants', 'array-contains', currentUserId)
            .get();
        for (const doc of existingConversationsQuery.docs) {
            const data = doc.data();
            if (data.participants &&
                data.participants.length === participants.length &&
                participants.every((p) => data.participants.includes(p))) {
                // Konverzácia už existuje
                return { conversationId: doc.id, exists: true };
            }
        }
        // Vytvoríme novú konverzáciu s novou štruktúrou
        const timestamp = admin.firestore.FieldValue.serverTimestamp();
        const unreadMessages = initializeUnreadMessages(participants);
        const conversationRef = await db.collection('conversations').add({
            participants,
            participantsInfo,
            unreadMessages,
            createdAt: timestamp,
            updatedAt: timestamp
        });
        return { conversationId: conversationRef.id, exists: false };
    }
    catch (error) {
        console.error('Chyba pri vytváraní konverzácie:', error);
        throw new functions.https.HttpsError('internal', 'Nastala chyba pri vytváraní konverzácie');
    }
});
// Funkcia na odoslanie správy
exports.sendMessage = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Používateľ nie je prihlásený');
    }
    try {
        const { conversationId, text } = data;
        const senderId = context.auth.uid;
        if (!text || !text.trim()) {
            throw new functions.https.HttpsError('invalid-argument', 'Text správy nemôže byť prázdny');
        }
        // Získame konverzáciu
        const conversationDoc = await db.collection('conversations').doc(conversationId).get();
        if (!conversationDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Konverzácia neexistuje');
        }
        const conversationData = conversationDoc.data();
        if (!(conversationData === null || conversationData === void 0 ? void 0 : conversationData.participants.includes(senderId))) {
            throw new functions.https.HttpsError('permission-denied', 'Nemáte oprávnenie prispievať do tejto konverzácie');
        }
        // Získame informácie o odosielateľovi
        const senderDoc = await db.collection('users').doc(senderId).get();
        if (!senderDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Odosielateľ správy neexistuje');
        }
        const senderData = senderDoc.data();
        const senderName = `${(senderData === null || senderData === void 0 ? void 0 : senderData.firstName) || ''} ${(senderData === null || senderData === void 0 ? void 0 : senderData.lastName) || ''}`.trim();
        // Časová značka
        const timestamp = admin.firestore.FieldValue.serverTimestamp();
        // Vytvoríme správu
        const messageRef = await db
            .collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .add({
            text: text.trim(),
            senderId,
            senderName,
            timestamp,
            read: false,
        });
        // Pripravíme aktualizácie pre unreadMessages
        const currentUnreadMessages = conversationData.unreadMessages || {};
        const updatedUnreadMessages = Object.assign({}, currentUnreadMessages);
        // Pre každého účastníka okrem odosielateľa zvýšime počet neprečítaných správ
        conversationData.participants.forEach((participantId) => {
            if (participantId !== senderId) {
                // Pre ostatných zvýšime počet neprečítaných správ
                updatedUnreadMessages[participantId] = (updatedUnreadMessages[participantId] || 0) + 1;
            }
            // Pre odosielateľa netreba meniť count - necháme ako je
            // (bude sa upravovať cez markMessagesAsRead keď si otvorí chat)
        });
        // Aktualizujeme konverzáciu s poslednou správou a novými unreadMessages
        await db.collection('conversations').doc(conversationId).update({
            lastMessage: {
                text: text.trim(),
                timestamp,
                senderId,
            },
            updatedAt: timestamp,
            unreadMessages: updatedUnreadMessages
        });
        // Získame príjemcov (všetci okrem odosielateľa)
        const recipients = conversationData.participants.filter((id) => id !== senderId);
        // Odošleme notifikácie všetkým príjemcom
        const notificationPromises = recipients.map((recipientId) => sendChatNotification(recipientId, senderId, senderName, text.trim(), conversationId));
        await Promise.all(notificationPromises);
        return { messageId: messageRef.id };
    }
    catch (error) {
        console.error('Chyba pri odosielaní správy:', error);
        throw new functions.https.HttpsError('internal', 'Nastala chyba pri odosielaní správy');
    }
});
// Funkcia na označenie správ ako prečítaných
exports.markMessagesAsRead = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Používateľ nie je prihlásený');
    }
    try {
        const { conversationId } = data;
        const currentUserId = context.auth.uid;
        // Získame konverzáciu
        const conversationDoc = await db.collection('conversations').doc(conversationId).get();
        if (!conversationDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Konverzácia neexistuje');
        }
        const conversationData = conversationDoc.data();
        if (!(conversationData === null || conversationData === void 0 ? void 0 : conversationData.participants.includes(currentUserId))) {
            throw new functions.https.HttpsError('permission-denied', 'Nemáte oprávnenie k tejto konverzácii');
        }
        // Aktualizujeme unreadMessages pre aktuálneho používateľa na 0
        const currentUnreadMessages = conversationData.unreadMessages || {};
        const updatedUnreadMessages = Object.assign(Object.assign({}, currentUnreadMessages), { [currentUserId]: 0 });
        try {
            await db.collection('conversations').doc(conversationId).update({
                unreadMessages: updatedUnreadMessages,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        catch (updateError) {
            console.error('Chyba pri aktualizácii konverzácie:', updateError);
            throw new functions.https.HttpsError('internal', `Chyba pri aktualizácii konverzácie: ${updateError}`);
        }
        // Označíme všetky neprečítané správy od ostatných používateľov ako prečítané
        let markedCount = 0;
        try {
            const unreadMessagesQuery = await db
                .collection('conversations')
                .doc(conversationId)
                .collection('messages')
                .where('senderId', '!=', currentUserId)
                .where('read', '==', false)
                .get();
            if (!unreadMessagesQuery.empty) {
                const batch = db.batch();
                unreadMessagesQuery.forEach((doc) => {
                    batch.update(doc.ref, { read: true });
                });
                await batch.commit();
                markedCount = unreadMessagesQuery.size;
            }
        }
        catch (messagesError) {
            console.error('Chyba pri označovaní správ ako prečítané:', messagesError);
            // Nekončíme s chybou, len zalogujeme - konverzácia už bola aktualizovaná
        }
        return { success: true, markedCount: markedCount };
    }
    catch (error) {
        console.error('Chyba pri označovaní správ ako prečítané:', error);
        throw new functions.https.HttpsError('internal', 'Nastala chyba pri označovaní správ ako prečítané');
    }
});
// Funkcia na vyhľadávanie používateľov
exports.searchUsers = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Používateľ nie je prihlásený');
    }
    try {
        const { query, limit = 10 } = data;
        const currentUserId = context.auth.uid;
        if (!query || query.length < 2) {
            return { users: [] };
        }
        // Vyhľadávanie používateľov (simplified - v realite by ste mohli implementovať fulltext search)
        const usersSnapshot = await db
            .collection('users')
            .limit(100) // Získame viac používateľov pre filtrovanie
            .get();
        const normalizedQuery = query.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        const matchingUsers = [];
        usersSnapshot.forEach(doc => {
            if (doc.id === currentUserId)
                return; // Preskočíme seba
            const userData = doc.data();
            const firstName = (userData.firstName || '')
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();
            const lastName = (userData.lastName || '')
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();
            const email = (userData.email || '')
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();
            if (firstName.includes(normalizedQuery) ||
                lastName.includes(normalizedQuery) ||
                email.includes(normalizedQuery) ||
                `${firstName} ${lastName}`.includes(normalizedQuery)) {
                matchingUsers.push({
                    uid: doc.id,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    photoURL: userData.photoURL || '',
                    companyName: userData.companyName || ''
                });
            }
            if (matchingUsers.length >= limit)
                return;
        });
        return { users: matchingUsers.slice(0, limit) };
    }
    catch (error) {
        console.error('Chyba pri vyhľadávaní používateľov:', error);
        throw new functions.https.HttpsError('internal', 'Nastala chyba pri vyhľadávaní používateľov');
    }
});
// Aktualizovaná funkcia na aktualizáciu informácií o používateľovi v konverzáciách
exports.updateUserProfileInConversations = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Používateľ nie je prihlásený');
    }
    try {
        const { firstName, lastName, photoURL, companyName } = data;
        const userId = context.auth.uid;
        // Nájdeme všetky konverzácie používateľa
        const conversationsSnapshot = await db
            .collection('conversations')
            .where('participants', 'array-contains', userId)
            .get();
        const batch = db.batch();
        conversationsSnapshot.forEach(doc => {
            const updateData = {
                [`participantsInfo.${userId}.name`]: `${firstName} ${lastName}`.trim(),
                [`participantsInfo.${userId}.photoURL`]: photoURL || '',
                [`participantsInfo.${userId}.companyName`]: companyName || ''
            };
            batch.update(doc.ref, updateData);
        });
        await batch.commit();
        return {
            success: true,
            updatedConversations: conversationsSnapshot.size
        };
    }
    catch (error) {
        console.error('Chyba pri aktualizácii profilu v konverzáciách:', error);
        throw new functions.https.HttpsError('internal', 'Nastala chyba pri aktualizácii profilu');
    }
});
// Funkcia pre získanie konverzácií používateľa
exports.getUserConversations = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Používateľ nie je prihlásený');
    }
    try {
        const { limit = 20, lastConversationId } = data;
        const userId = context.auth.uid;
        let conversationsQuery = db
            .collection('conversations')
            .where('participants', 'array-contains', userId)
            .orderBy('updatedAt', 'desc')
            .limit(limit);
        if (lastConversationId) {
            const lastConversationDoc = await db
                .collection('conversations')
                .doc(lastConversationId)
                .get();
            if (lastConversationDoc.exists) {
                conversationsQuery = conversationsQuery.startAfter(lastConversationDoc);
            }
        }
        const conversationsSnapshot = await conversationsQuery.get();
        const conversations = [];
        conversationsSnapshot.forEach(doc => {
            const data = doc.data();
            conversations.push(Object.assign({ id: doc.id }, data));
        });
        return { conversations };
    }
    catch (error) {
        console.error('Chyba pri získavaní konverzácií:', error);
        throw new functions.https.HttpsError('internal', 'Nastala chyba pri získavaní konverzácií');
    }
});
// Funkcia pre získanie správ z konverzácie
exports.getConversationMessages = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Používateľ nie je prihlásený');
    }
    try {
        const { conversationId, limit = 30, lastMessageId } = data;
        const userId = context.auth.uid;
        // Najprv overíme, či má používateľ prístup ku konverzácii
        const conversationDoc = await db.collection('conversations').doc(conversationId).get();
        if (!conversationDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Konverzácia neexistuje');
        }
        const conversationData = conversationDoc.data();
        if (!(conversationData === null || conversationData === void 0 ? void 0 : conversationData.participants.includes(userId))) {
            throw new functions.https.HttpsError('permission-denied', 'Nemáte oprávnenie k tejto konverzácii');
        }
        // Vytvoríme dotaz na správy
        let messagesQuery = db
            .collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(limit);
        // Ak máme lastMessageId, vytvoríme pagináciu
        if (lastMessageId) {
            const lastMessageDoc = await db
                .collection('conversations')
                .doc(conversationId)
                .collection('messages')
                .doc(lastMessageId)
                .get();
            if (lastMessageDoc.exists) {
                messagesQuery = messagesQuery.startAfter(lastMessageDoc);
            }
        }
        const messagesSnapshot = await messagesQuery.get();
        const messages = [];
        messagesSnapshot.forEach((doc) => {
            const messageData = doc.data();
            messages.push(Object.assign({ id: doc.id }, messageData));
        });
        // Vrátime správy v opačnom poradí (od najstaršej po najnovšiu)
        return { messages: messages.reverse() };
    }
    catch (error) {
        console.error('Chyba pri získavaní správ:', error);
        throw new functions.https.HttpsError('internal', 'Nastala chyba pri získavaní správ');
    }
});
// Funkcia pre vymazanie konverzácie
exports.deleteConversation = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Používateľ nie je prihlásený');
    }
    try {
        const { conversationId } = data;
        const userId = context.auth.uid;
        // Najprv overíme, či má používateľ prístup ku konverzácii
        const conversationDoc = await db.collection('conversations').doc(conversationId).get();
        if (!conversationDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Konverzácia neexistuje');
        }
        const conversationData = conversationDoc.data();
        if (!(conversationData === null || conversationData === void 0 ? void 0 : conversationData.participants.includes(userId))) {
            throw new functions.https.HttpsError('permission-denied', 'Nemáte oprávnenie k tejto konverzácii');
        }
        // Získame všetky správy v konverzácii
        const messagesSnapshot = await db
            .collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .get();
        // Vytvoríme batch pre vymazanie správ
        const batch = db.batch();
        messagesSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        // Vymažeme konverzáciu
        batch.delete(conversationDoc.ref);
        // Vykonáme batch
        await batch.commit();
        return { success: true };
    }
    catch (error) {
        console.error('Chyba pri mazaní konverzácie:', error);
        throw new functions.https.HttpsError('internal', 'Nastala chyba pri mazaní konverzácie');
    }
});
// Aktualizovaná funkcia na opravu nesprávne počítaných unreadMessages
exports.fixUnreadCounts = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Používateľ nie je prihlásený');
    }
    try {
        const conversationsSnapshot = await db.collection('conversations').get();
        const batch = db.batch();
        let fixedCount = 0;
        for (const conversationDoc of conversationsSnapshot.docs) {
            const conversationData = conversationDoc.data();
            const participants = conversationData.participants || [];
            if (participants.length === 0)
                continue;
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
                const unreadMessagesForUser = messagesSnapshot.docs.filter(doc => doc.data().senderId !== participantId);
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
        return {
            success: true,
            message: `Opravených ${fixedCount} konverzácií`,
            fixedCount
        };
    }
    catch (error) {
        console.error('Chyba pri oprave unreadMessages:', error);
        throw new functions.https.HttpsError('internal', 'Nastala chyba pri oprave počítadiel');
    }
});
//# sourceMappingURL=chat.js.map