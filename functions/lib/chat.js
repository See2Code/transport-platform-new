"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversation = exports.getConversationMessages = exports.getUserConversations = exports.updateUnreadCounts = exports.updateUserProfileInConversations = exports.searchUsers = exports.markMessagesAsRead = exports.sendMessage = exports.createConversation = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const REGION = 'europe-west1';
// Funkcia na vytvorenie novej konverzácie
exports.createConversation = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Používateľ nie je prihlásený');
    }
    try {
        const { userId } = data;
        const currentUserId = context.auth.uid;
        if (userId === currentUserId) {
            throw new functions.https.HttpsError('invalid-argument', 'Nemôžete začať konverzáciu sami so sebou');
        }
        // Najprv skontrolujeme, či už konverzácia existuje
        const existingConversationsSnapshot = await db
            .collection('conversations')
            .where('participants', 'array-contains', currentUserId)
            .get();
        let existingConversationId = null;
        existingConversationsSnapshot.forEach((doc) => {
            const conversationData = doc.data();
            if (conversationData.participants.includes(userId)) {
                existingConversationId = doc.id;
            }
        });
        if (existingConversationId) {
            return { conversationId: existingConversationId, isNew: false };
        }
        // Získame informácie o aktuálnom používateľovi
        const currentUserDoc = await db.collection('users').doc(currentUserId).get();
        const otherUserDoc = await db.collection('users').doc(userId).get();
        if (!currentUserDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Aktuálny používateľ neexistuje');
        }
        if (!otherUserDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Vyhľadávaný používateľ neexistuje');
        }
        const currentUserData = currentUserDoc.data();
        const otherUserData = otherUserDoc.data();
        // Vytvoríme novú konverzáciu
        const timestamp = admin.firestore.FieldValue.serverTimestamp();
        const participantsInfo = {
            [currentUserId]: {
                name: `${(currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.firstName) || ''} ${(currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.lastName) || ''}`.trim(),
                email: (currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.email) || '',
                photoURL: (currentUserData === null || currentUserData === void 0 ? void 0 : currentUserData.photoURL) || '',
            },
            [userId]: {
                name: `${(otherUserData === null || otherUserData === void 0 ? void 0 : otherUserData.firstName) || ''} ${(otherUserData === null || otherUserData === void 0 ? void 0 : otherUserData.lastName) || ''}`.trim(),
                email: (otherUserData === null || otherUserData === void 0 ? void 0 : otherUserData.email) || '',
                photoURL: (otherUserData === null || otherUserData === void 0 ? void 0 : otherUserData.photoURL) || '',
            },
        };
        const conversationRef = await db.collection('conversations').add({
            participants: [currentUserId, userId],
            participantsInfo,
            createdAt: timestamp,
            updatedAt: timestamp,
            unreadCount: 0,
        });
        return { conversationId: conversationRef.id, isNew: true };
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
        // Aktualizujeme konverzáciu s poslednou správou
        await db.collection('conversations').doc(conversationId).update({
            lastMessage: {
                text: text.trim(),
                timestamp,
                senderId,
            },
            updatedAt: timestamp,
            unreadCount: admin.firestore.FieldValue.increment(1),
        });
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
        // Resetujeme počítadlo neprečítaných správ
        await db.collection('conversations').doc(conversationId).update({
            unreadCount: 0,
        });
        // Označíme všetky neprečítané správy od druhého používateľa ako prečítané
        const unreadMessagesQuery = await db
            .collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .where('senderId', '!=', currentUserId)
            .where('read', '==', false)
            .get();
        const batch = db.batch();
        unreadMessagesQuery.forEach((doc) => {
            batch.update(doc.ref, { read: true });
        });
        await batch.commit();
        return { success: true, markedCount: unreadMessagesQuery.size };
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
        const queryLower = query.toLowerCase();
        const usersRef = db.collection('users');
        // Vyhľadávame podľa mena, priezviska a emailu
        const [firstNameResults, lastNameResults, emailResults] = await Promise.all([
            usersRef
                .where('firstNameLower', '>=', queryLower)
                .where('firstNameLower', '<=', queryLower + '\uf8ff')
                .limit(limit)
                .get(),
            usersRef
                .where('lastNameLower', '>=', queryLower)
                .where('lastNameLower', '<=', queryLower + '\uf8ff')
                .limit(limit)
                .get(),
            usersRef
                .where('emailLower', '>=', queryLower)
                .where('emailLower', '<=', queryLower + '\uf8ff')
                .limit(limit)
                .get(),
        ]);
        // Zlúčime výsledky a odstránime duplikáty
        const usersMap = new Map();
        // Funkcia na pridanie používateľa do mapy
        const addToMap = (doc) => {
            if (doc.id !== currentUserId && !usersMap.has(doc.id)) {
                const userData = doc.data();
                usersMap.set(doc.id, {
                    uid: doc.id,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    photoURL: userData.photoURL || '',
                    companyName: userData.companyName || '',
                });
            }
        };
        // Pridáme výsledky do mapy
        firstNameResults.forEach(addToMap);
        lastNameResults.forEach(addToMap);
        emailResults.forEach(addToMap);
        // Vrátime zoznam používateľov
        return { users: Array.from(usersMap.values()) };
    }
    catch (error) {
        console.error('Chyba pri vyhľadávaní používateľov:', error);
        throw new functions.https.HttpsError('internal', 'Nastala chyba pri vyhľadávaní používateľov');
    }
});
// Trigger pre aktualizáciu používateľských údajov v konverzáciách
exports.updateUserProfileInConversations = functions
    .region(REGION)
    .firestore.document('users/{userId}')
    .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const newData = change.after.data();
    const previousData = change.before.data();
    // Kontrola, či sa zmenili relevantné údaje
    const nameChanged = newData.firstName !== previousData.firstName ||
        newData.lastName !== previousData.lastName;
    const photoChanged = newData.photoURL !== previousData.photoURL;
    if (!nameChanged && !photoChanged) {
        return null; // Ak sa nič relevantné nezmenilo, nič nerobíme
    }
    try {
        // Nájdeme všetky konverzácie, kde je používateľ účastníkom
        const conversationsSnapshot = await db
            .collection('conversations')
            .where('participants', 'array-contains', userId)
            .get();
        const batch = db.batch();
        let updateCount = 0;
        conversationsSnapshot.forEach((doc) => {
            const conversationData = doc.data();
            const participantsInfo = Object.assign({}, conversationData.participantsInfo);
            // Aktualizujeme údaje používateľa v konverzácii
            if (participantsInfo[userId]) {
                const updates = {};
                if (nameChanged) {
                    updates[`participantsInfo.${userId}.name`] = `${newData.firstName || ''} ${newData.lastName || ''}`.trim();
                }
                if (photoChanged) {
                    updates[`participantsInfo.${userId}.photoURL`] = newData.photoURL || '';
                }
                if (Object.keys(updates).length > 0) {
                    batch.update(doc.ref, updates);
                    updateCount++;
                }
            }
        });
        if (updateCount > 0) {
            await batch.commit();
            console.log(`Aktualizované údaje používateľa v ${updateCount} konverzáciách`);
        }
        return { success: true, updatedCount: updateCount };
    }
    catch (error) {
        console.error('Chyba pri aktualizácii profilu v konverzáciách:', error);
        return { success: false, error: 'Nastala chyba pri aktualizácii' };
    }
});
// Trigger pre aktualizáciu počítadiel neprečítaných správ
exports.updateUnreadCounts = functions
    .region(REGION)
    .firestore.document('conversations/{conversationId}/messages/{messageId}')
    .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    const conversationId = context.params.conversationId;
    if (!messageData) {
        return null;
    }
    try {
        // Získame konverzáciu
        const conversationRef = db.collection('conversations').doc(conversationId);
        const conversationSnapshot = await conversationRef.get();
        if (!conversationSnapshot.exists) {
            return null;
        }
        const conversationData = conversationSnapshot.data();
        if (!conversationData) {
            return null;
        }
        // Získame príjemcu (používateľa, ktorý nie je odosielateľom)
        const recipientId = conversationData.participants.find((id) => id !== messageData.senderId);
        if (!recipientId) {
            return null;
        }
        // Aktualizujeme počítadlo neprečítaných správ
        await conversationRef.update({
            unreadCount: admin.firestore.FieldValue.increment(1),
        });
        return { success: true };
    }
    catch (error) {
        console.error('Chyba pri aktualizácii počítadla neprečítaných správ:', error);
        return { success: false, error: 'Nastala chyba pri aktualizácii' };
    }
});
// Funkcia pre získanie posledných konverzácií používateľa
exports.getUserConversations = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Používateľ nie je prihlásený');
    }
    try {
        const { limit = 20 } = data;
        const userId = context.auth.uid;
        const conversationsSnapshot = await db
            .collection('conversations')
            .where('participants', 'array-contains', userId)
            .orderBy('updatedAt', 'desc')
            .limit(limit)
            .get();
        const conversations = [];
        conversationsSnapshot.forEach((doc) => {
            const conversationData = doc.data();
            conversations.push(Object.assign({ id: doc.id }, conversationData));
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
//# sourceMappingURL=chat.js.map