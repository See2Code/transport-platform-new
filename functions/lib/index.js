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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderPdf = exports.deleteConversation = exports.getConversationMessages = exports.getUserConversations = exports.updateUnreadCounts = exports.updateUserProfileInConversations = exports.searchUsers = exports.markMessagesAsRead = exports.sendMessage = exports.createConversation = exports.googleMapsProxy = exports.sendTestReminder = exports.updateLastLogin = exports.initializeLastLogin = exports.logFunctionMetrics = exports.checkTransportNotifications = exports.checkBusinessCaseReminders = exports.sendInvitationEmail = exports.clearDatabase = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
const chrome_aws_lambda_1 = __importDefault(require("chrome-aws-lambda"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
// Inicializácia Firebase Admin
admin.initializeApp();
// Import API proxy funkcií
const apiProxy = __importStar(require("./api-proxy"));
const chatFunctions = __importStar(require("./chat"));
const REGION = 'europe-west1';
// Konfigurácia emailového transportu
const transporter = nodemailer.createTransport({
    host: functions.config().smtp.host,
    port: parseInt(functions.config().smtp.port),
    secure: true,
    auth: {
        type: 'login',
        user: functions.config().smtp.user,
        pass: functions.config().smtp.pass.replace(/\\/g, '') // Odstránime escapované znaky
    },
    tls: {
        rejectUnauthorized: false // Povoľujeme self-signed certifikáty
    }
});
// Funkcia na vyčistenie databázy
exports.clearDatabase = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Užívateľ nie je prihlásený');
    }
    const db = admin.firestore();
    const batch = db.batch();
    try {
        const collections = ['users', 'contacts', 'businessCases', 'trackedTransports', 'invitations'];
        for (const collection of collections) {
            const snapshot = await db.collection(collection).get();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
        await batch.commit();
        return { success: true };
    }
    catch (error) {
        console.error('Chyba pri čistení databázy:', error);
        throw new functions.https.HttpsError('internal', 'Chyba pri čistení databázy');
    }
});
// Funkcia na odoslanie emailu
async function sendEmail(to, subject, html) {
    var _a, _b, _c, _d, _e;
    const mailOptions = {
        from: 'AESA Transport Platform <noreply@aesa.sk>',
        to,
        subject,
        html,
        headers: {
            'Content-Type': 'text/html; charset=UTF-8',
            'X-Priority': '1',
            'X-MSMail-Priority': 'High'
        }
    };
    try {
        console.log('Konfigurácia SMTP:', {
            host: (_a = transporter.options) === null || _a === void 0 ? void 0 : _a.host,
            port: (_b = transporter.options) === null || _b === void 0 ? void 0 : _b.port,
            secure: (_c = transporter.options) === null || _c === void 0 ? void 0 : _c.secure,
            auth: {
                user: (_e = (_d = transporter.options) === null || _d === void 0 ? void 0 : _d.auth) === null || _e === void 0 ? void 0 : _e.user
            }
        });
        console.log('Pokus o odoslanie emailu:', {
            to: to,
            subject: subject,
            options: mailOptions
        });
        const info = await transporter.sendMail(mailOptions);
        console.log('Email odoslaný úspešne:', {
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected,
            to: to,
            subject: subject
        });
        return info;
    }
    catch (error) {
        console.error('Chyba pri odosielaní emailu:', {
            error: error,
            stack: error === null || error === void 0 ? void 0 : error.stack,
            to: to,
            subject: subject,
            smtpError: error === null || error === void 0 ? void 0 : error.message
        });
        throw error;
    }
}
// Funkcia na odoslanie pozvánky
exports.sendInvitationEmail = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Užívateľ nie je prihlásený');
    }
    try {
        const invitationRef = admin.firestore().collection('invitations').doc(data.invitationId);
        const invitationDoc = await invitationRef.get();
        // Získanie údajov o firme
        const companyDoc = await admin.firestore().collection('companies').doc(data.companyId).get();
        if (!companyDoc.exists) {
            throw new Error('Firma nebola nájdená');
        }
        const companyData = companyDoc.data();
        if (!invitationDoc.exists) {
            // Vytvorenie novej pozvánky
            await invitationRef.set({
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                companyID: data.companyId,
                role: data.role,
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: context.auth.uid
            });
        }
        else {
            // Aktualizácia existujúcej pozvánky
            await invitationRef.update({
                lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'pending'
            });
        }
        const invitationLink = `https://core-app-423c7.web.app/accept-invitation/${data.invitationId}`;
        const emailTemplate = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AESA Transport Platform</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#ff9f43" style="padding: 40px 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif;">AESA Transport Platform</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              {{content}}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 30px; background-color: #ffffff; border-top: 1px solid #eeeeee; border-radius: 0 0 8px 8px;">
              <p style="margin: 5px 0; color: #7f8c8d; font-size: 13px;">Toto je automaticky generovaný email. Prosím neodpovedajte naň.</p>
              <p style="margin: 5px 0; color: #7f8c8d; font-size: 13px;">&copy; ${new Date().getFullYear()} AESA Transport Platform. Všetky práva vyhradené.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
        const invitationContent = `
        <h2 style="color: #2c3e50; margin-top: 0; font-size: 24px; font-weight: 600;">Dobrý deň ${data.firstName},</h2>
        <p style="color: #34495e; margin-bottom: 20px; font-size: 16px;">Boli ste pozvaní do AESA Transport Platform spoločnosťou <strong>${companyData === null || companyData === void 0 ? void 0 : companyData.companyName}</strong>.</p>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fa; margin: 25px 0; border-radius: 8px; border-left: 4px solid #ff9f43;">
          <tr>
            <td style="padding: 25px;">
              <h3 style="color: #2c3e50; margin-top: 0; font-size: 18px; font-weight: 600;">Informácie o spoločnosti:</h3>
              <p style="margin: 10px 0; color: #34495e;"><strong>Názov:</strong> ${companyData === null || companyData === void 0 ? void 0 : companyData.companyName}</p>
              <p style="margin: 10px 0; color: #34495e;"><strong>IČO:</strong> ${(companyData === null || companyData === void 0 ? void 0 : companyData.ico) || 'Neuvedené'}</p>
              <p style="margin: 10px 0; color: #34495e;"><strong>Adresa:</strong> ${companyData === null || companyData === void 0 ? void 0 : companyData.street}, ${companyData === null || companyData === void 0 ? void 0 : companyData.zipCode} ${companyData === null || companyData === void 0 ? void 0 : companyData.city}</p>
            </td>
          </tr>
        </table>

        <p style="color: #34495e; margin-bottom: 20px; font-size: 16px;">Pre dokončenie registrácie a prístup do platformy kliknite na nasledujúce tlačidlo:</p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding: 25px 0;">
              <a href="${invitationLink}" style="display: inline-block; padding: 14px 32px; background-color: #ff9f43; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Prijať pozvánku</a>
            </td>
          </tr>
        </table>
        <p style="color: #34495e; margin-bottom: 10px; font-size: 14px;">Ak tlačidlo nefunguje, skopírujte a vložte tento odkaz do prehliadača:</p>
        <p style="word-break: break-all; color: #666666; font-size: 14px;">${invitationLink}</p>
      `;
        const emailHtml = emailTemplate.replace('{{content}}', invitationContent);
        await sendEmail(data.email, 'Pozvánka do AESA Transport Platform', emailHtml);
        return {
            success: true,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        };
    }
    catch (error) {
        console.error('Chyba pri odosielaní pozvánky:', error);
        throw new functions.https.HttpsError('internal', 'Chyba pri odosielaní pozvánky');
    }
});
// Funkcia na kontrolu pripomienok obchodných prípadov
exports.checkBusinessCaseReminders = functions
    .region(REGION)
    .pubsub.schedule('every 1 minutes')
    .timeZone('Europe/Bratislava')
    .onRun(async (context) => {
    var _a;
    const now = new Date();
    const db = admin.firestore();
    console.log('Spustená kontrola pripomienok obchodných prípadov:', now.toISOString());
    try {
        console.log('Hľadám pripomienky na odoslanie...');
        const remindersSnapshot = await db.collection('reminders')
            .where('reminderDateTime', '<=', now)
            .where('sent', '==', false)
            .where('businessCaseId', '!=', '')
            .get();
        console.log('Počet nájdených pripomienok:', remindersSnapshot.size);
        for (const doc of remindersSnapshot.docs) {
            const reminder = doc.data();
            const reminderId = doc.id;
            console.log('Spracovávam pripomienku obchodného prípadu:', {
                id: reminderId,
                reminderDateTime: reminder.reminderDateTime instanceof admin.firestore.Timestamp ?
                    reminder.reminderDateTime.toDate().toISOString() :
                    (reminder.reminderDateTime ? new Date(reminder.reminderDateTime).toISOString() : 'Neuvedené'),
                userEmail: reminder.userEmail,
                companyName: reminder.companyName,
                businessCaseId: reminder.businessCaseId,
                reminderNote: reminder.reminderNote
            });
            try {
                if (!reminder.userEmail) {
                    console.error(`Pripomienka (BC) ${reminderId} nemá nastavený email.`);
                    continue;
                }
                const formatDate = (date) => {
                    if (date == null) {
                        console.warn(`formatDate (BC): Dátum je null alebo undefined pre pripomienku ${reminderId}`);
                        return 'Neuvedený';
                    }
                    if (date instanceof admin.firestore.Timestamp) {
                        return date.toDate().toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava' });
                    }
                    if (typeof date === 'object' && date !== null && typeof date.seconds === 'number') {
                        const seconds = date.seconds;
                        const nanoseconds = typeof date.nanoseconds === 'number' ? date.nanoseconds : 0;
                        return new Date(seconds * 1000 + nanoseconds / 1000000).toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava' });
                    }
                    try {
                        const parsedDate = new Date(date);
                        if (!isNaN(parsedDate.getTime())) {
                            return parsedDate.toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava' });
                        }
                        else {
                            console.warn(`formatDate (BC): Nepodarilo sa parsovať dátum pre pripomienku ${reminderId}:`, date);
                            return 'Neplatný formát';
                        }
                    }
                    catch (e) {
                        console.error(`formatDate (BC): Chyba pri parsovaní dátumu pre pripomienku ${reminderId}:`, date, e);
                        return 'Chyba formátu';
                    }
                };
                console.log('Generujem email pre pripomienku obchodného prípadu:', reminderId);
                const emailTemplate = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AESA Transport Platform</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#ff9f43" style="padding: 40px 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif;">AESA Transport Platform</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              {{content}}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 30px; background-color: #ffffff; border-top: 1px solid #eeeeee; border-radius: 0 0 8px 8px;">
              <p style="margin: 5px 0; color: #7f8c8d; font-size: 13px;">Toto je automaticky generovaný email. Prosím neodpovedajte naň.</p>
              <p style="margin: 5px 0; color: #7f8c8d; font-size: 13px;">&copy; ${new Date().getFullYear()} AESA Transport Platform. Všetky práva vyhradené.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
                const businessCaseReminderContent = `
            <h2 style="color: #2c3e50; margin-top: 0; font-size: 24px; font-weight: 600;">Dobrý deň${((_a = reminder.createdBy) === null || _a === void 0 ? void 0 : _a.firstName) ? ` ${reminder.createdBy.firstName}` : ''},</h2>
            <p style="color: #34495e; margin-bottom: 20px; font-size: 16px;">Pripomíname Vám naplánovanú aktivitu v obchodnom prípade:</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0; color: #34495e;"><strong>Obchodný prípad:</strong> "${reminder.companyName}"</p>
              <p style="margin: 10px 0; color: #34495e;"><strong>Dátum a čas pripomienky:</strong> ${formatDate(reminder.reminderDateTime)}</p>
              <p style="margin: 10px 0; color: #34495e;"><strong>Text pripomienky:</strong> ${reminder.reminderNote || 'Bez poznámky'}</p>
            </div>
            <p style="color: #34495e; margin-bottom: 20px; font-size: 16px;">Pre zobrazenie detailov kliknite na nasledujúce tlačidlo:</p>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center" style="padding: 25px 0;">
                  <a href="https://core-app-423c7.web.app/business-cases/${reminder.businessCaseId}" style="display: inline-block; padding: 14px 32px; background-color: #ff9f43; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Zobraziť obchodný prípad</a>
                </td>
              </tr>
            </table>`;
                const businessCaseEmailHtml = emailTemplate.replace('{{content}}', businessCaseReminderContent);
                console.log('Pokus o odoslanie emailu na:', reminder.userEmail);
                await sendEmail(reminder.userEmail, 'Pripomienka pre obchodný prípad', businessCaseEmailHtml);
                console.log('Email úspešne odoslaný (BC), označujem pripomienku ako odoslanú:', reminderId);
                await doc.ref.update({
                    sent: true,
                    sentAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log('Pripomienka (BC) úspešne označená ako odoslaná:', reminderId);
                const metricsRef = db.collection('functionMetrics').doc(now.toISOString().split('T')[0]);
                await metricsRef.set({
                    businessCaseReminders: admin.firestore.FieldValue.increment(1)
                }, { merge: true });
                console.log('Metriky aktualizované');
            }
            catch (error) {
                console.error(`Chyba pri spracovaní pripomienky (BC) ID: ${reminderId}:`, {
                    error: error,
                    message: error === null || error === void 0 ? void 0 : error.message,
                    stack: error === null || error === void 0 ? void 0 : error.stack,
                    reminderID: reminderId,
                    userEmail: reminder === null || reminder === void 0 ? void 0 : reminder.userEmail,
                    companyName: reminder === null || reminder === void 0 ? void 0 : reminder.companyName,
                    businessCaseId: reminder === null || reminder === void 0 ? void 0 : reminder.businessCaseId,
                    reminderData: reminder
                });
            }
        }
        console.log('Kontrola pripomienok (BC) dokončená');
        return null;
    }
    catch (error) {
        console.error('Celková chyba pri kontrole pripomienok (BC):', {
            error: error,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack
        });
        return null;
    }
});
// Funkcia na kontrolu notifikácií pre sledované prepravy
exports.checkTransportNotifications = functions
    .region(REGION)
    .pubsub.schedule('every 1 minutes')
    .timeZone('Europe/Bratislava')
    .onRun(async (context) => {
    var _a, _b, _c, _d;
    const now = new Date();
    const db = admin.firestore();
    console.log('Spustená kontrola pripomienok prepráv:', now.toISOString());
    try {
        console.log('Hľadám pripomienky na odoslanie...');
        const remindersSnapshot = await db.collection('reminders')
            .where('reminderDateTime', '<=', admin.firestore.Timestamp.fromDate(now))
            .where('sent', '==', false)
            .where('transportId', '!=', null)
            .get();
        console.log('Počet nájdených pripomienok:', remindersSnapshot.size);
        for (const doc of remindersSnapshot.docs) {
            const reminder = doc.data();
            const reminderId = doc.id;
            // Konvertujeme reminderDateTime na Timestamp ak nie je
            const reminderDateTime = reminder.reminderDateTime instanceof admin.firestore.Timestamp
                ? reminder.reminderDateTime
                : admin.firestore.Timestamp.fromDate(new Date(reminder.reminderDateTime));
            console.log('Spracovávam pripomienku:', {
                id: reminderId,
                reminderDateTime: reminderDateTime.toDate().toISOString(),
                userEmail: reminder.userEmail,
                type: reminder.type,
                orderNumber: reminder.orderNumber,
                transportId: reminder.transportId,
                sent: reminder.sent,
                transportDetails: reminder.transportDetails
            });
            if (reminder.userEmail && reminder.transportId) {
                try {
                    const formatDate = (date) => {
                        if (date == null) {
                            console.warn(`formatDate: Dátum je null alebo undefined pre pripomienku ${reminderId}`);
                            return 'Neuvedený';
                        }
                        try {
                            // Ak je to Timestamp
                            if (date instanceof admin.firestore.Timestamp) {
                                return date.toDate().toLocaleString('sk-SK');
                            }
                            // Ak je to objekt s seconds a nanoseconds
                            if (typeof date === 'object' && date !== null &&
                                typeof date.seconds === 'number' &&
                                typeof date.nanoseconds === 'number') {
                                const timestamp = new admin.firestore.Timestamp(date.seconds, date.nanoseconds);
                                return timestamp.toDate().toLocaleString('sk-SK');
                            }
                            // Ak je to string alebo číslo
                            if (typeof date === 'string' || typeof date === 'number') {
                                const parsedDate = new Date(date);
                                if (!isNaN(parsedDate.getTime())) {
                                    return parsedDate.toLocaleString('sk-SK');
                                }
                            }
                            console.warn(`formatDate: Nepodarilo sa parsovať dátum pre pripomienku ${reminderId}:`, date);
                            return 'Neplatný formát';
                        }
                        catch (e) {
                            console.error(`formatDate: Chyba pri parsovaní dátumu pre pripomienku ${reminderId}:`, date, e);
                            return 'Chyba formátu';
                        }
                    };
                    const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AESA Transport Platform</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">Pripomienka prepravy</h1>
    <p style="color: #666;">Dobrý deň,</p>
    <p style="color: #666;">pripomíname Vám blížiacu sa ${reminder.type === 'loading' ? 'nakládku' : 'vykládku'}:</p>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Číslo objednávky:</strong> ${reminder.orderNumber}</p>
      <p style="margin: 5px 0;"><strong>Typ:</strong> ${reminder.type === 'loading' ? 'Nakládka' : 'Vykládka'}</p>
      <p style="margin: 5px 0;"><strong>Adresa:</strong> ${reminder.type === 'loading' ?
                        (((_a = reminder.transportDetails) === null || _a === void 0 ? void 0 : _a.loadingAddress) || 'Neuvedená') :
                        (((_b = reminder.transportDetails) === null || _b === void 0 ? void 0 : _b.unloadingAddress) || 'Neuvedená')}</p>
      <p style="margin: 5px 0;"><strong>Dátum a čas:</strong> ${reminder.type === 'loading' ?
                        formatDate((_c = reminder.transportDetails) === null || _c === void 0 ? void 0 : _c.loadingDateTime) :
                        formatDate((_d = reminder.transportDetails) === null || _d === void 0 ? void 0 : _d.unloadingDateTime)}</p>
      <p style="margin: 5px 0;"><strong>Čas pripomienky:</strong> ${formatDate(reminder.reminderDateTime)}</p>
    </div>
    <p style="color: #666;">Pre zobrazenie detailov prepravy kliknite na nasledujúci odkaz:</p>
    <a href="https://core-app-423c7.web.app/tracked-transports" style="display: inline-block; padding: 10px 20px; background-color: #ff9f43; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Zobraziť prepravu</a>
  </div>
</body>
</html>`;
                    console.log('Pokus o odoslanie pripomienky na:', reminder.userEmail);
                    await sendEmail(reminder.userEmail, `Pripomienka prepravy - ${reminder.type === 'loading' ? 'Nakládka' : 'Vykládka'}`, emailTemplate);
                    console.log('Email úspešne odoslaný, označujem pripomienku ako odoslanú');
                    await doc.ref.update({
                        sent: true,
                        sentAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('Pripomienka úspešne označená ako odoslaná:', {
                        id: reminderId,
                        email: reminder.userEmail,
                        orderNumber: reminder.orderNumber
                    });
                    const metricsRef = db.collection('functionMetrics').doc(now.toISOString().split('T')[0]);
                    await metricsRef.set({
                        transportNotifications: admin.firestore.FieldValue.increment(1)
                    }, { merge: true });
                }
                catch (error) {
                    console.error(`Chyba pri spracovaní pripomienky ID: ${reminderId}:`, {
                        error: error,
                        message: error === null || error === void 0 ? void 0 : error.message,
                        stack: error === null || error === void 0 ? void 0 : error.stack,
                        reminderID: reminderId,
                        userEmail: reminder === null || reminder === void 0 ? void 0 : reminder.userEmail,
                        orderNumber: reminder === null || reminder === void 0 ? void 0 : reminder.orderNumber,
                        reminderData: reminder
                    });
                }
            }
            else {
                console.warn('Pripomienka nemá nastavený email alebo transportId:', {
                    id: reminderId,
                    hasEmail: !!(reminder === null || reminder === void 0 ? void 0 : reminder.userEmail),
                    hasTransportId: !!(reminder === null || reminder === void 0 ? void 0 : reminder.transportId),
                    reminderData: reminder
                });
            }
        }
    }
    catch (error) {
        console.error('Celková chyba pri kontrole pripomienok (mimo cyklu spracovania):', {
            error: error,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack
        });
    }
    return null;
});
// Funkcia na logovanie metrík
exports.logFunctionMetrics = functions
    .region(REGION)
    .pubsub.schedule('every 1 hours')
    .timeZone('Europe/Bratislava')
    .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    try {
        const metricsRef = db.collection('functionMetrics').doc(now.toISOString().split('T')[0]);
        await metricsRef.set({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            businessCaseReminders: 0,
            transportNotifications: 0
        }, { merge: true });
    }
    catch (error) {
        console.error('Chyba pri logovaní metrík:', error);
    }
});
// Funkcia na inicializáciu lastLogin pre existujúcich používateľov
exports.initializeLastLogin = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Užívateľ nie je prihlásený');
    }
    const db = admin.firestore();
    const batch = db.batch();
    try {
        // Najprv overíme, či je používateľ admin
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists || ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Len admin môže inicializovať lastLogin');
        }
        const companyID = (_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.companyID;
        if (!companyID) {
            throw new functions.https.HttpsError('failed-precondition', 'Admin nemá nastavené companyID');
        }
        // Získame všetkých používateľov v danej firme
        const usersSnapshot = await db.collection('users')
            .where('companyID', '==', companyID)
            .get();
        let updatedCount = 0;
        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            if (!userData.lastLogin) {
                batch.update(doc.ref, {
                    lastLogin: admin.firestore.Timestamp.now()
                });
                updatedCount++;
            }
        }
        if (updatedCount > 0) {
            await batch.commit();
        }
        return {
            success: true,
            message: `Aktualizovaných ${updatedCount} používateľov`
        };
    }
    catch (error) {
        console.error('Chyba pri inicializácii lastLogin:', error);
        throw new functions.https.HttpsError('internal', 'Chyba pri inicializácii lastLogin');
    }
});
// Funkcia na aktualizáciu lastLogin pri prihlásení používateľa
exports.updateLastLogin = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Užívateľ nie je prihlásený');
    }
    const db = admin.firestore();
    try {
        await db.collection('users').doc(context.auth.uid).update({
            lastLogin: admin.firestore.Timestamp.now()
        });
        return {
            success: true,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        };
    }
    catch (error) {
        console.error('Chyba pri aktualizácii lastLogin:', error);
        throw new functions.https.HttpsError('internal', 'Chyba pri aktualizácii lastLogin');
    }
});
// Funkcia na odoslanie testovacieho pripomenutia
exports.sendTestReminder = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Užívateľ nie je prihlásený');
    }
    try {
        const { email } = data;
        const subject = 'Test Reminder - AESA Transport Platform';
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #ff9f43;">Test Reminder</h2>
    <p>Toto je testovacia pripomienka z AESA Transport Platform.</p>
    <p>Čas odoslania: ${new Date().toLocaleString('sk-SK')}</p>
    <hr style="border: 1px solid #eee; margin: 20px 0;">
    <p style="font-size: 12px; color: #666;">
      Toto je automaticky generovaný email. Prosím neodpovedajte naň.
    </p>
  </div>
</body>
</html>`;
        await sendEmail(email, subject, html);
        return { success: true, message: 'Testovacia pripomienka bola úspešne odoslaná' };
    }
    catch (error) {
        console.error('Chyba pri odosielaní testovacej pripomienky:', error);
        throw new functions.https.HttpsError('internal', 'Nastala chyba pri odosielaní testovacej pripomienky');
    }
});
// Export API proxy funkcií
exports.googleMapsProxy = apiProxy.googleMapsProxy;
// Export chat funkcií
exports.createConversation = chatFunctions.createConversation;
exports.sendMessage = chatFunctions.sendMessage;
exports.markMessagesAsRead = chatFunctions.markMessagesAsRead;
exports.searchUsers = chatFunctions.searchUsers;
exports.updateUserProfileInConversations = chatFunctions.updateUserProfileInConversations;
exports.updateUnreadCounts = chatFunctions.updateUnreadCounts;
exports.getUserConversations = chatFunctions.getUserConversations;
exports.getConversationMessages = chatFunctions.getConversationMessages;
exports.deleteConversation = chatFunctions.deleteConversation;
// Prípadné ďalšie funkcie
// export const otherApiProxy = apiProxy.otherApiProxy;
// TODO: Implementovať generovanie PDF na serveri
// 
// Plán implementácie serverového generovania PDF:
// 1. Nainštalovať potrebné knižnice (napr. puppeteer alebo pdfkit) do Firebase Functions
// 2. Vytvoriť HTTP funkciu, ktorá prijme JSON údaje objednávky
// 3. Vygenerovať HTML šablónu s údajmi objednávky
// 4. Použiť knižnicu na konverziu HTML do PDF
// 5. Vrátiť vygenerované PDF ako odpoveď
// 6. Uložiť vygenerované PDF do Storage pre neskoršie stiahnutie
// Pomocná funkcia na konverziu dátumu
const convertToDate = (date) => {
    if (!date)
        return null;
    if (date instanceof Date)
        return date;
    if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function')
        return date.toDate();
    if (date.seconds)
        return new Date(date.seconds * 1000); // Pre Timestamp
    if (typeof date === 'string' || typeof date === 'number')
        return new Date(date);
    return null; // Pre prípad, že typ nesedí s očakávanými
};
// Formátovanie dátumu pre zobrazenie v PDF
const formatDate = (date, format = 'dd.MM.yyyy') => {
    const d = convertToDate(date);
    if (!d)
        return 'Neurčený';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    if (format === 'dd.MM.yyyy') {
        return `${day}.${month}.${year}`;
    }
    else if (format === 'dd.MM.yyyy HH:mm') {
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }
    return `${day}.${month}.${year}`;
};
// Funkcia pre bezpečný text
const safeText = (text) => {
    if (text === undefined || text === null)
        return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};
// Pomocná funkcia na formátovanie adresy
const formatAddress = (street, city, zip, country) => {
    return [
        street,
        zip && city ? `${zip} ${city}` : (zip || city),
        country
    ].filter(Boolean).join(', ');
};
exports.generateOrderPdf = functions
    .region(REGION)
    .runWith({
    memory: '2GB',
    timeoutSeconds: 300,
})
    .https.onCall(async (data, context) => {
    var _a;
    try {
        // Kontrola autentifikácie
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Vyžaduje sa prihlásenie pre generovanie PDF');
        }
        // Získanie ID objednávky alebo priamych údajov
        let orderData;
        if (data.orderId) {
            const orderDoc = await admin.firestore().collection('orders').doc(data.orderId).get();
            if (!orderDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Objednávka nebola nájdená');
            }
            orderData = Object.assign({ id: data.orderId }, orderDoc.data());
        }
        else if (data.orderData) {
            orderData = data.orderData;
        }
        else {
            throw new functions.https.HttpsError('invalid-argument', 'Chýba ID objednávky alebo údaje objednávky');
        }
        // Kontrola, či používateľ patrí k spoločnosti, ktorá vlastní objednávku
        const userRef = await admin.firestore().collection('users').doc(context.auth.uid).get();
        const userData = userRef.data();
        if ((userData === null || userData === void 0 ? void 0 : userData.companyID) !== orderData.companyID) {
            console.log(`Používateľ ${context.auth.uid} nemá oprávnenie na prístup k objednávke spoločnosti ${orderData.companyID}`);
            throw new functions.https.HttpsError('permission-denied', 'Nemáte oprávnenie na prístup k tejto objednávke');
        }
        // Získanie nastavení spoločnosti (logo, farby, atď.)
        let companySettings = null;
        try {
            const settingsQuery = await admin.firestore()
                .collection('companySettings')
                .where('companyID', '==', orderData.companyID)
                .limit(1)
                .get();
            if (!settingsQuery.empty) {
                companySettings = settingsQuery.docs[0].data();
            }
        }
        catch (error) {
            console.error('Chyba pri načítaní nastavení spoločnosti:', error);
        }
        // Generovanie HTML pre PDF
        const htmlContent = generateOrderHtml(orderData, companySettings);
        console.log('Spustenie prehliadača pomocou chrome-aws-lambda');
        // Generovanie PDF pomocou chrome-aws-lambda a puppeteer
        const browser = await puppeteer_core_1.default.launch({
            args: chrome_aws_lambda_1.default.args,
            defaultViewport: chrome_aws_lambda_1.default.defaultViewport,
            executablePath: await chrome_aws_lambda_1.default.executablePath,
            headless: chrome_aws_lambda_1.default.headless,
        });
        console.log('Chrome spustený úspešne');
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'a4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            }
        });
        await browser.close();
        // Vrátiť PDF priamo ako base64 string namiesto ukladania na Storage
        const base64Data = pdfBuffer.toString('base64');
        return {
            success: true,
            pdfBase64: base64Data,
            fileName: `objednavka_${orderData.orderNumberFormatted || ((_a = orderData.id) === null || _a === void 0 ? void 0 : _a.substring(0, 8)) || 'temp'}.pdf`
        };
    }
    catch (error) {
        console.error('Chyba pri generovaní PDF:', error);
        throw new functions.https.HttpsError('internal', `Nastala chyba pri generovaní PDF: ${error.message}`);
    }
});
// Funkcia pre generovanie HTML šablóny objednávky
function generateOrderHtml(orderData, settings) {
    var _a;
    const orderNumber = orderData.orderNumberFormatted || (((_a = orderData.id) === null || _a === void 0 ? void 0 : _a.substring(0, 8)) || 'N/A');
    const createdAtDate = formatDate(orderData.createdAt);
    // Informácie o zákazníkovi
    const customerCompany = orderData.zakaznik || orderData.customerCompany || 'N/A';
    const customerAddress = formatAddress(orderData.customerStreet, orderData.customerCity, orderData.customerZip, orderData.customerCountry);
    const customerVatID = orderData.customerVatId || 'N/A';
    // Informácie o dodávateľovi (z nastavení)
    const companyName = (settings === null || settings === void 0 ? void 0 : settings.companyName) || 'AESA GROUP';
    const companyAddress = formatAddress((settings === null || settings === void 0 ? void 0 : settings.street) || 'Pekárska 11', (settings === null || settings === void 0 ? void 0 : settings.city) || 'Trnava', (settings === null || settings === void 0 ? void 0 : settings.zip) || 'SK91701', 'Slovensko');
    const companyID = (settings === null || settings === void 0 ? void 0 : settings.businessID) || '55361731';
    const companyVatID = (settings === null || settings === void 0 ? void 0 : settings.vatID) || 'SK2121966220';
    // Generovanie sekcií pre miesta nakládky
    let loadingPlacesHtml = '';
    if (orderData.loadingPlaces && orderData.loadingPlaces.length > 0) {
        orderData.loadingPlaces.forEach((place, index) => {
            const dateTimeStr = place.dateTime ? formatDate(place.dateTime, 'dd.MM.yyyy HH:mm') : 'neurčený';
            const refNumber = place.referenceNumber || 'N/A';
            const hasGoods = place.goods && place.goods.length > 0;
            let goodsHtml = '';
            if (hasGoods) {
                goodsHtml = '<div class="goods-list">';
                place.goods.forEach((item) => {
                    goodsHtml += `
            <div class="goods-item">
              <p><strong>${safeText(item.name)}</strong> - ${safeText(item.quantity)} ${safeText(item.unit)}</p>
              ${item.description ? `<p class="description">${safeText(item.description)}</p>` : ''}
            </div>
          `;
                });
                goodsHtml += '</div>';
            }
            loadingPlacesHtml += `
        <div class="place-box">
          <h4>Nakládka ${index + 1} - ${dateTimeStr}</h4>
          <p><strong>Adresa:</strong> ${safeText(formatAddress(place.street, place.city, place.zip, place.country))}</p>
          <p><strong>Kontaktná osoba:</strong> ${safeText(place.contactPerson)}</p>
          <p><strong>Referenčné číslo:</strong> ${safeText(refNumber)}</p>
          ${goodsHtml}
        </div>
      `;
        });
    }
    else {
        loadingPlacesHtml = '<p>Žiadne miesta nakládky</p>';
    }
    // Generovanie sekcií pre miesta vykládky
    let unloadingPlacesHtml = '';
    if (orderData.unloadingPlaces && orderData.unloadingPlaces.length > 0) {
        orderData.unloadingPlaces.forEach((place, index) => {
            const dateTimeStr = place.dateTime ? formatDate(place.dateTime, 'dd.MM.yyyy HH:mm') : 'neurčený';
            const refNumber = place.referenceNumber || 'N/A';
            const hasGoods = place.goods && place.goods.length > 0;
            let goodsHtml = '';
            if (hasGoods) {
                goodsHtml = '<div class="goods-list">';
                place.goods.forEach((item) => {
                    goodsHtml += `
            <div class="goods-item">
              <p><strong>${safeText(item.name)}</strong> - ${safeText(item.quantity)} ${safeText(item.unit)}</p>
              ${item.description ? `<p class="description">${safeText(item.description)}</p>` : ''}
            </div>
          `;
                });
                goodsHtml += '</div>';
            }
            unloadingPlacesHtml += `
        <div class="place-box">
          <h4>Vykládka ${index + 1} - ${dateTimeStr}</h4>
          <p><strong>Adresa:</strong> ${safeText(formatAddress(place.street, place.city, place.zip, place.country))}</p>
          <p><strong>Kontaktná osoba:</strong> ${safeText(place.contactPerson)}</p>
          <p><strong>Referenčné číslo:</strong> ${safeText(refNumber)}</p>
          ${goodsHtml}
        </div>
      `;
        });
    }
    else {
        unloadingPlacesHtml = '<p>Žiadne miesta vykládky</p>';
    }
    // Generovanie sekcie dopravcu
    let carrierHtml = '';
    if (orderData.carrierCompany) {
        carrierHtml = `
      <div class="carrier-info">
        <h3>Dopravca</h3>
        <div class="info-box">
          <p><strong>Názov:</strong> ${safeText(orderData.carrierCompany)}</p>
          <p><strong>Kontakt:</strong> ${safeText(orderData.carrierContact || 'N/A')}</p>
          <p><strong>EČV:</strong> ${safeText(orderData.carrierVehicleReg || 'N/A')}</p>
          <p><strong>Cena prepravy:</strong> ${safeText(orderData.carrierPrice || '0')} EUR</p>
        </div>
      </div>
    `;
    }
    // Generovanie kompletného HTML pre PDF
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Objednávka prepravy ${orderNumber}</title>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          font-size: 12px;
        }
        .container {
          max-width: 100%;
          margin: 0;
          padding: 0;
        }
        .header {
          margin-bottom: 20px;
          border-bottom: 2px solid #ff9f43;
          padding-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #ff9f43;
        }
        .date {
          text-align: right;
        }
        .order-title {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin: 30px 0;
          color: #333;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 25px;
        }
        .info-box {
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          width: 48%;
        }
        h3 {
          color: #ff9f43;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
          margin-top: 25px;
          margin-bottom: 15px;
          font-size: 16px;
        }
        h4 {
          margin-top: 5px;
          margin-bottom: 10px;
          color: #555;
          font-size: 14px;
        }
        .place-box {
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 15px;
        }
        .goods-list {
          margin-top: 10px;
          padding-left: 15px;
        }
        .goods-item {
          margin-bottom: 8px;
        }
        .goods-item p {
          margin: 3px 0;
        }
        .description {
          font-style: italic;
          color: #777;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #777;
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
        .carrier-info {
          margin-top: 25px;
        }
        .price-info {
          margin-top: 25px;
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          border-left: 3px solid #ff9f43;
        }
        .page-break {
          page-break-after: always;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          text-align: left;
          padding: 8px;
          border: 1px solid #ddd;
        }
        th {
          background-color: #f2f2f2;
        }
        @page {
          margin: 0.5cm;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <div class="company-name">${safeText(companyName)}</div>
            <div>${safeText(companyAddress)}</div>
            <div>IČO: ${safeText(companyID)} | DIČ: ${safeText(companyVatID)}</div>
          </div>
          <div class="date">
            <div>${safeText((settings === null || settings === void 0 ? void 0 : settings.city) || 'Trnava')}, ${createdAtDate}</div>
          </div>
        </div>

        <div class="order-title">Dopravná objednávka č. ${safeText(orderNumber)}</div>

        <div class="info-section">
          <div class="info-box">
            <h3>Príjemca</h3>
            <p><strong>${safeText(customerCompany)}</strong></p>
            <p>${safeText(customerAddress)}</p>
            <p>IČ DPH: ${safeText(customerVatID)}</p>
          </div>
          <div class="info-box">
            <h3>Predajca</h3>
            <p><strong>${safeText(companyName)}</strong></p>
            <p>${safeText(companyAddress)}</p>
            <p>IČO: ${safeText(companyID)} | DIČ: ${safeText(companyVatID)}</p>
          </div>
        </div>

        <h3>Miesta nakládky</h3>
        ${loadingPlacesHtml}

        <h3>Miesta vykládky</h3>
        ${unloadingPlacesHtml}

        ${carrierHtml}

        <div class="price-info">
          <h3>Platobné informácie</h3>
          <p><strong>Cena pre zákazníka:</strong> ${safeText(orderData.suma || orderData.customerPrice || '0')} ${safeText(orderData.mena || 'EUR')}</p>
          <p><strong>Platobné podmienky:</strong> 14 dní</p>
        </div>

        <div class="footer">
          <p>Dokument bol automaticky vygenerovaný v AESA Transport Platform | ${new Date().toLocaleDateString('sk-SK')}</p>
          <p>${safeText(companyName)} | ${safeText(companyAddress)} | IČO: ${safeText(companyID)} | DIČ: ${safeText(companyVatID)}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
//# sourceMappingURL=index.js.map