import * as functions from 'firebase-functions/v1';
import { CallableContext } from 'firebase-functions/v1/https';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

// Inicializácia Firebase Admin
admin.initializeApp();

// Import API proxy funkcií
import * as apiProxy from './api-proxy';
import * as chatFunctions from './chat';

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
export const clearDatabase = functions
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
    } catch (error) {
      console.error('Chyba pri čistení databázy:', error);
      throw new functions.https.HttpsError('internal', 'Chyba pri čistení databázy');
    }
  });

// Funkcia na odoslanie emailu
async function sendEmail(to: string, subject: string, html: string) {
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
      host: (transporter as any).options?.host,
      port: (transporter as any).options?.port,
      secure: (transporter as any).options?.secure,
      auth: {
        user: (transporter as any).options?.auth?.user
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
  } catch (error: any) {
    console.error('Chyba pri odosielaní emailu:', {
      error: error,
      stack: error?.stack,
      to: to,
      subject: subject,
      smtpError: error?.message
    });
    throw error;
  }
}

interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  invitationId: string;
  companyId: string;
  role: string;
}

// Funkcia na odoslanie pozvánky
export const sendInvitationEmail = functions
  .region(REGION)
  .https.onCall(async (data: InvitationData, context: CallableContext) => {
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
      } else {
        // Aktualizácia existujúcej pozvánky
        await invitationRef.update({
          lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending'
        });
      }

      const invitationLink = `https://core.aesa.sk/accept-invitation/${data.invitationId}`;
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
            <td align="center" bgcolor="#333" style="padding: 40px 30px; border-radius: 8px 8px 0 0;">
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
        <p style="color: #34495e; margin-bottom: 20px; font-size: 16px;">Boli ste pozvaní do AESA Transport Platform spoločnosťou <strong>${companyData?.companyName}</strong>.</p>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fa; margin: 25px 0; border-radius: 8px; border-left: 4px solid #ff9f43;">
          <tr>
            <td style="padding: 25px;">
              <h3 style="color: #2c3e50; margin-top: 0; font-size: 18px; font-weight: 600;">Informácie o spoločnosti:</h3>
              <p style="margin: 10px 0; color: #34495e;"><strong>Názov:</strong> ${companyData?.companyName}</p>
              <p style="margin: 10px 0; color: #34495e;"><strong>IČO:</strong> ${companyData?.ico || 'Neuvedené'}</p>
              <p style="margin: 10px 0; color: #34495e;"><strong>Adresa:</strong> ${companyData?.street}, ${companyData?.zipCode} ${companyData?.city}</p>
            </td>
          </tr>
        </table>

        <p style="color: #34495e; margin-bottom: 20px; font-size: 16px;">Pre dokončenie registrácie a prístup do platformy kliknite na nasledujúce tlačidlo:</p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding: 25px 0;">
              <a href="${invitationLink}" style="display: inline-block; padding: 14px 32px; background-color: #333; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Prijať pozvánku</a>
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
    } catch (error) {
      console.error('Chyba pri odosielaní pozvánky:', error);
      throw new functions.https.HttpsError('internal', 'Chyba pri odosielaní pozvánky');
    }
  });

// Funkcia na kontrolu pripomienok obchodných prípadov
export const checkBusinessCaseReminders = functions
  .region(REGION)
  .pubsub.schedule('every 1 minutes')
  .timeZone('Europe/Bratislava')
  .onRun(async (context: any) => {
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

          const formatDate = (date: any): string => {
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
              } else {
                 console.warn(`formatDate (BC): Nepodarilo sa parsovať dátum pre pripomienku ${reminderId}:`, date);
                 return 'Neplatný formát';
              }
            } catch (e) {
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
            <td align="center" bgcolor="#333" style="padding: 40px 30px; border-radius: 8px 8px 0 0;">
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
            <h2 style="color: #2c3e50; margin-top: 0; font-size: 24px; font-weight: 600;">Dobrý deň${reminder.createdBy?.firstName ? ` ${reminder.createdBy.firstName}` : ''},</h2>
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
                  <a href="https://core.aesa.sk/business-cases/${reminder.businessCaseId}" style="display: inline-block; padding: 14px 32px; background-color: #333; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Zobraziť obchodný prípad</a>
                </td>
              </tr>
            </table>`;

          const businessCaseEmailHtml = emailTemplate.replace('{{content}}', businessCaseReminderContent);

          console.log('Pokus o odoslanie emailu na:', reminder.userEmail);
          await sendEmail(
            reminder.userEmail,
            'Pripomienka pre obchodný prípad',
            businessCaseEmailHtml
          );

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
        } catch (error: any) {
          console.error(`Chyba pri spracovaní pripomienky (BC) ID: ${reminderId}:`, {
            error: error,
            message: error?.message,
            stack: error?.stack,
            reminderID: reminderId,
            userEmail: reminder?.userEmail,
            companyName: reminder?.companyName,
            businessCaseId: reminder?.businessCaseId,
            reminderData: reminder
          });
        }
      }

      console.log('Kontrola pripomienok (BC) dokončená');
      return null;
    } catch (error: any) {
      console.error('Celková chyba pri kontrole pripomienok (BC):', {
        error: error,
        message: error?.message,
        stack: error?.stack
      });
      return null;
    }
  });

// Funkcia na kontrolu notifikácií pre sledované prepravy
export const checkTransportNotifications = functions
  .region(REGION)
  .pubsub.schedule('every 1 minutes')
  .timeZone('Europe/Bratislava')
  .onRun(async (context: any) => {
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
            const formatDate = (date: any): string => {
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
              } catch (e) {
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
        (reminder.transportDetails?.loadingAddress || 'Neuvedená') : 
        (reminder.transportDetails?.unloadingAddress || 'Neuvedená')}</p>
      <p style="margin: 5px 0;"><strong>Dátum a čas:</strong> ${reminder.type === 'loading' ? 
        formatDate(reminder.transportDetails?.loadingDateTime) : 
        formatDate(reminder.transportDetails?.unloadingDateTime)}</p>
      <p style="margin: 5px 0;"><strong>Čas pripomienky:</strong> ${formatDate(reminder.reminderDateTime)}</p>
    </div>
    <p style="color: #666;">Pre zobrazenie detailov prepravy kliknite na nasledujúci odkaz:</p>
    <a href="https://core.aesa.sk/tracked-transports" style="display: inline-block; padding: 10px 20px; background-color: #ff9f43; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Zobraziť prepravu</a>
  </div>
</body>
</html>`;

            console.log('Pokus o odoslanie pripomienky na:', reminder.userEmail);
            await sendEmail(
              reminder.userEmail,
              `Pripomienka prepravy - ${reminder.type === 'loading' ? 'Nakládka' : 'Vykládka'}`,
              emailTemplate
            );

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

          } catch (error: any) {
            console.error(`Chyba pri spracovaní pripomienky ID: ${reminderId}:`, {
              error: error,
              message: error?.message,
              stack: error?.stack,
              reminderID: reminderId,
              userEmail: reminder?.userEmail,
              orderNumber: reminder?.orderNumber,
              reminderData: reminder
            });
          }
        } else {
          console.warn('Pripomienka nemá nastavený email alebo transportId:', {
            id: reminderId,
            hasEmail: !!reminder?.userEmail,
            hasTransportId: !!reminder?.transportId,
            reminderData: reminder
          });
        }
      }
    } catch (error: any) {
      console.error('Celková chyba pri kontrole pripomienok (mimo cyklu spracovania):', {
         error: error,
         message: error?.message,
         stack: error?.stack
      });
    }
    return null;
  });

// Funkcia na logovanie metrík
export const logFunctionMetrics = functions
  .region(REGION)
  .pubsub.schedule('every 1 hours')
  .timeZone('Europe/Bratislava')
  .onRun(async (context: any) => {
    const db = admin.firestore();
    const now = new Date();

    try {
      const metricsRef = db.collection('functionMetrics').doc(now.toISOString().split('T')[0]);
      await metricsRef.set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        businessCaseReminders: 0,
        transportNotifications: 0
      }, { merge: true });
    } catch (error: any) {
      console.error('Chyba pri logovaní metrík:', error);
    }
  });

// Funkcia na inicializáciu lastLogin pre existujúcich používateľov
export const initializeLastLogin = functions
  .region(REGION)
  .https.onCall(async (data: any, context: CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Užívateľ nie je prihlásený');
    }

    const db = admin.firestore();
    const batch = db.batch();

    try {
      // Najprv overíme, či je používateľ admin
      const userDoc = await db.collection('users').doc(context.auth.uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Len admin môže inicializovať lastLogin');
      }

      const companyID = userDoc.data()?.companyID;
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
    } catch (error: any) {
      console.error('Chyba pri inicializácii lastLogin:', error);
      throw new functions.https.HttpsError('internal', 'Chyba pri inicializácii lastLogin');
    }
  });

// Funkcia na aktualizáciu lastLogin pri prihlásení používateľa
export const updateLastLogin = functions
  .region(REGION)
  .https.onCall(async (data: any, context: CallableContext) => {
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
    } catch (error: any) {
      console.error('Chyba pri aktualizácii lastLogin:', error);
      throw new functions.https.HttpsError('internal', 'Chyba pri aktualizácii lastLogin');
    }
  });

// Funkcia na odoslanie testovacieho pripomenutia
export const sendTestReminder = functions
  .region(REGION)
  .https.onCall(async (data: { email: string }, context: CallableContext) => {
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
    } catch (error) {
      console.error('Chyba pri odosielaní testovacej pripomienky:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Nastala chyba pri odosielaní testovacej pripomienky'
      );
    }
  });

// Export API proxy funkcií
export const googleMapsProxy = apiProxy.googleMapsProxy;

// Export chat funkcií
export const createConversation = chatFunctions.createConversation;
export const sendMessage = chatFunctions.sendMessage;
export const markMessagesAsRead = chatFunctions.markMessagesAsRead;
export const searchUsers = chatFunctions.searchUsers;
export const updateUserProfileInConversations = chatFunctions.updateUserProfileInConversations;
export const getUserConversations = chatFunctions.getUserConversations;
export const getConversationMessages = chatFunctions.getConversationMessages;
export const deleteConversation = chatFunctions.deleteConversation;
export const fixUnreadCounts = chatFunctions.fixUnreadCounts;

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
const convertToDate = (date: any): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') 
    return date.toDate();
  if (date.seconds) 
    return new Date(date.seconds * 1000); // Pre Timestamp
  if (typeof date === 'string' || typeof date === 'number')
    return new Date(date);
  return null; // Pre prípad, že typ nesedí s očakávanými
};

// Formátovanie dátumu pre zobrazenie v PDF
const formatDate = (date: any, format: string = 'dd.MM.yyyy'): string => {
  const d = convertToDate(date);
  if (!d) return 'Neurčený';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  if (format === 'dd.MM.yyyy') {
    return `${day}.${month}.${year}`;
  } else if (format === 'dd.MM.yyyy HH:mm') {
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } else if (format === 'HH:mm') {
    return `${hours}:${minutes}`;
  }
  
  return `${day}.${month}.${year}`;
};

// Funkcia pre bezpečný text
const safeText = (text: any): string => {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Pomocná funkcia na formátovanie adresy
const formatAddress = (street?: string, city?: string, zip?: string, country?: string): string => {
  return [
    street,
    zip && city ? `${zip} ${city}` : (zip || city),
    country
  ].filter(Boolean).join(', ');
};

// Funkcia na generovanie PDF
export const generateOrderPdf = functions
  .region(REGION)
  .runWith({
    memory: '2GB',
    timeoutSeconds: 300,
  })
  .https.onCall(async (data, context) => {
    try {
      // Kontrola autentifikácie
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Vyžaduje sa prihlásenie pre generovanie PDF'
        );
      }

      // Získanie ID objednávky alebo priamych údajov
      let orderData;
      if (data.orderId) {
        const orderDoc = await admin.firestore().collection('orders').doc(data.orderId).get();
        if (!orderDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Objednávka nebola nájdená');
        }
        orderData = { id: data.orderId, ...orderDoc.data() };
      } else if (data.orderData) {
        orderData = data.orderData;
      } else {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Chýba ID objednávky alebo údaje objednávky'
        );
      }

      // Kontrola, či používateľ patrí k spoločnosti, ktorá vlastní objednávku
      const userRef = await admin.firestore().collection('users').doc(context.auth.uid).get();
      const userData = userRef.data();
      
      if (userData?.companyID !== orderData.companyID) {
        console.log(`Používateľ ${context.auth.uid} nemá oprávnenie na prístup k objednávke spoločnosti ${orderData.companyID}`);
        throw new functions.https.HttpsError(
          'permission-denied',
          'Nemáte oprávnenie na prístup k tejto objednávke'
        );
      }

      // Načítanie údajov o dopravcu z kolekcie carriers
      let carrierData: any = null;
      if (orderData.carrierCompany) {
        try {
          console.log(`Hľadám dopravcu s názvom: ${orderData.carrierCompany}`);
          const carriersQuery = await admin.firestore()
            .collection('carriers')
            .where('companyID', '==', orderData.companyID)
            .where('companyName', '==', orderData.carrierCompany)
            .limit(1)
            .get();
          
          if (!carriersQuery.empty) {
            carrierData = { id: carriersQuery.docs[0].id, ...carriersQuery.docs[0].data() };
            console.log(`Dopravca nájdený: ${carrierData.companyName}`);
          } else {
            console.log(`Dopravca s názvom "${orderData.carrierCompany}" nebol nájdený`);
          }
        } catch (error) {
          console.error('Chyba pri načítaní údajov o dopravcu:', error);
        }
      }

      // Získanie nastavení spoločnosti (logo, farby, atď.)
      let companySettings: {
        logoUrl?: string;
        logoBase64?: string;
        logoName?: string;
        companyName?: string;
        street?: string;
        city?: string;
        zip?: string;
        businessID?: string;
        vatID?: string;
        companyID?: string;
        legalForm?: string;
        [key: string]: any;
      } = {};
      try {
        console.log("Hľadám nastavenia spoločnosti pre companyID:", orderData.companyID);
        
        // Najprv skúsime získať logo priamo zo storage zo správnej cesty
        try {
          // Z obrázku vidíme, že logo je v ceste companies/AESA-9614-0263/logo.png
          // Použijeme companyID z orderData
          console.log("Skúšam načítať logo priamo z cesty: companies/" + orderData.companyID + "/logo.png");
          
          const storagePath = `companies/${orderData.companyID}/logo.png`;
          const storageFile = admin.storage().bucket().file(storagePath);
          
          // Kontrola, či súbor existuje
          const [exists] = await storageFile.exists();
          if (exists) {
            console.log("Logo nájdené v Storage na ceste:", storagePath);
            
            // Načítame priamo binárny obsah súboru namiesto použitia URL
            try {
              const [fileContent] = await storageFile.download();
              // Konvertujeme na base64
              const logoBase64 = fileContent.toString('base64');
              const mimeType = 'image/png';  // Pevne nastavujeme PNG, keďže vieme, že je to PNG
              companySettings.logoBase64 = `data:${mimeType};base64,${logoBase64}`;
              console.log("Logo úspešne načítané priamo zo Storage a konvertované do base64, dĺžka:", logoBase64.length);
            } catch (downloadError) {
              console.error("Chyba pri sťahovaní súboru zo Storage:", downloadError);
            }
          } else {
            console.log("Logo nebolo nájdené na ceste:", storagePath);
          }
        } catch (storageError) {
          console.error("Chyba pri načítaní loga zo Storage:", storageError);
        }
        
        // Ak sme nenašli logo v Storage, skúsime nastavenia spoločnosti a iné metódy
        if (!companySettings.logoBase64) {
          // Skúsime získať nastavenia z companySettings kolekcie
          const settingsQuery = await admin.firestore()
            .collection('companySettings')
            .where('companyID', '==', orderData.companyID)
            .limit(1)
            .get();
          
          if (!settingsQuery.empty) {
            const settingsData = settingsQuery.docs[0].data();
            // Zlúčime existujúce nastavenia s novými
            companySettings = { ...companySettings, ...settingsData };
            console.log("Nastavenia spoločnosti nájdené v kolekcii companySettings");
            
            // Ak máme logoUrl z nastavení, pokúsime sa ho stiahnuť
            if (companySettings.logoUrl && typeof companySettings.logoUrl === 'string' && !companySettings.logoBase64) {
              try {
                console.log("Sťahujem logo z URL z nastavení:", companySettings.logoUrl);
                // Pokúsime sa stiahnuť logo pomocou axios
                const axios = require('axios');
                const response = await axios.get(companySettings.logoUrl, { 
                  responseType: 'arraybuffer',
                  headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                  } 
                });
                const logoBase64 = Buffer.from(response.data).toString('base64');
                const mimeType = response.headers['content-type'] || 'image/png';
                companySettings.logoBase64 = `data:${mimeType};base64,${logoBase64}`;
                console.log("Logo úspešne stiahnuté a konvertované na base64, dĺžka base64:", logoBase64.length);
              } catch (logoError) {
                console.error('Chyba pri sťahovaní loga z URL:', logoError);
              }
            }
          }
        }
        
        if (!companySettings.logoBase64) {
          console.log("Logo sa nepodarilo načítať žiadnym spôsobom");
        }
      } catch (error) {
        console.error('Chyba pri načítaní nastavení spoločnosti:', error);
      }

      // Generovanie HTML pre PDF s údajmi o dopravcu
      const htmlContent = generateOrderHtml(orderData, companySettings, carrierData);

      console.log('Spustenie prehliadača pomocou chrome-aws-lambda');
      
      // Generovanie PDF pomocou chrome-aws-lambda a puppeteer
      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
      });

      console.log('Chrome spustený úspešne');
      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'a4',
        printBackground: true,
        margin: {
          top: '40mm',
          right: '40mm',
          bottom: '40mm',
          left: '40mm'
        }
      });
      await browser.close();

      // Vrátiť PDF priamo ako base64 string namiesto ukladania na Storage
      // @ts-ignore - Ignorujeme linter error pre toString
      const base64Data = pdfBuffer.toString('base64');
      
      return { 
        success: true, 
        pdfBase64: base64Data,
        fileName: `objednavka_${orderData.orderNumberFormatted || orderData.id?.substring(0, 8) || 'temp'}.pdf`
      };
    } catch (error: any) {
      console.error('Chyba pri generovaní PDF:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Nastala chyba pri generovaní PDF: ${error.message}`
      );
    }
  });

// Funkcia pre generovanie HTML šablóny objednávky
function generateOrderHtml(orderData: any, settings: any, carrierData: any): string {
  const orderNumber = orderData.orderNumberFormatted || (orderData.id?.substring(0, 8) || 'N/A');
  const createdAtDate = formatDate(orderData.createdAt);
  
  // Debug informácie o nastaveniach spoločnosti a logu
  console.log("Company settings:", settings ? Object.keys(settings) : 'No settings');
  const hasLogo = settings?.logoBase64 && typeof settings.logoBase64 === 'string';
  console.log("Has logo:", hasLogo);
  
  // Informácie o dopravcu ako príjemcovi
  let recipientCompany = 'N/A';
  let recipientAddress = 'N/A';
  let recipientVatID = 'N/A';
  let recipientContact = 'N/A';
  let paymentTermDays = 60; // Default 60 dní
  
  if (carrierData) {
    recipientCompany = carrierData.companyName || 'N/A';
    recipientAddress = formatAddress(
      carrierData.street,
      carrierData.city,
      carrierData.zip,
      carrierData.country
    );
    recipientVatID = carrierData.icDph || carrierData.vatId || 'N/A';
    recipientContact = `${carrierData.contactName || ''} ${carrierData.contactSurname || ''}`.trim() || 'N/A';
    paymentTermDays = carrierData.paymentTermDays || 60;
  }
  
  // Informácie o zadávateľovi (z nastavení spoločnosti)
  const companyName = settings?.companyName || 'AESA Group, SE';
  const companyFullName = companyName;
  
  const companyAddress = formatAddress(
    settings?.street || 'Pekárska 11',
    settings?.city || 'Trnava',
    settings?.zip || 'SK91701',
    'Slovensko'
  );
  const companyID = settings?.businessID || '55361731';
  const companyVatID = settings?.vatID || 'SK2121966220';
  
  // Kontakt špeditéra ktorý vytvoril objednávku
  const dispatcherContact = orderData.createdByName || 'N/A';
  
  // ŠPZ vozidla
  const vehicleRegistration = orderData.carrierVehicleReg || 'N/A';
  
  // Generovanie sekcií pre miesta nakládky - kompaktnejšie
  let loadingPlacesHtml = '';
  if (orderData.loadingPlaces && orderData.loadingPlaces.length > 0) {
    orderData.loadingPlaces.forEach((place: any, index: number) => {
      const dateTimeStr = place.dateTime ? formatDate(place.dateTime, 'dd.MM.yyyy') : 'neurčený';
      const timeStr = place.dateTime ? formatDate(place.dateTime, 'HH:mm') : '';
      const refNumber = place.referenceNumber || 'N/A';
      const hasGoods = place.goods && place.goods.length > 0;

      let goodsHtml = '';
      if (hasGoods) {
        const goodsItems = place.goods.map((item: any) => 
          `${safeText(item.quantity)} ${safeText(item.unit)} ${safeText(item.name)}`
        ).join(', ');
        goodsHtml = `<p><strong>Tovar:</strong> ${goodsItems}</p>`;
      }

      loadingPlacesHtml += `
        <div class="place-box-compact">
          <div class="place-header">
            <strong>Nakládka ${index + 1}</strong>
            <span class="place-date">${dateTimeStr} (${timeStr})</span>
          </div>
          <p class="place-address">${safeText(formatAddress(place.street, place.city, place.zip, place.country))}</p>
          <div class="place-details">
            <span><strong>Referenčné číslo:</strong> ${safeText(refNumber)}</span>
            <span><strong>Kontakt:</strong> ${safeText(place.contactPersonName || place.contactPerson || 'N/A')}</span>
            <span><strong>Telefón:</strong> ${safeText(place.contactPersonPhone || 'N/A')}</span>
          </div>
          ${goodsHtml}
        </div>
      `;
    });
  } else {
    loadingPlacesHtml = '<p>Žiadne miesta nakládky</p>';
  }

  // Generovanie sekcií pre miesta vykládky - kompaktnejšie
  let unloadingPlacesHtml = '';
  if (orderData.unloadingPlaces && orderData.unloadingPlaces.length > 0) {
    orderData.unloadingPlaces.forEach((place: any, index: number) => {
      const dateTimeStr = place.dateTime ? formatDate(place.dateTime, 'dd.MM.yyyy') : 'neurčený';
      const timeStr = place.dateTime ? formatDate(place.dateTime, 'HH:mm') : '';
      const refNumber = place.referenceNumber || 'N/A';
      const hasGoods = place.goods && place.goods.length > 0;

      let goodsHtml = '';
      if (hasGoods) {
        const goodsItems = place.goods.map((item: any) => 
          `${safeText(item.quantity)} ${safeText(item.unit)} ${safeText(item.name)}`
        ).join(', ');
        goodsHtml = `<p><strong>Tovar:</strong> ${goodsItems}</p>`;
      }

      unloadingPlacesHtml += `
        <div class="place-box-compact">
          <div class="place-header">
            <strong>Vykládka ${index + 1}</strong>
            <span class="place-date">${dateTimeStr} (${timeStr})</span>
          </div>
          <p class="place-address">${safeText(formatAddress(place.street, place.city, place.zip, place.country))}</p>
          <div class="place-details">
            <span><strong>Referenčné číslo:</strong> ${safeText(refNumber)}</span>
            <span><strong>Kontakt:</strong> ${safeText(place.contactPersonName || place.contactPerson || 'N/A')}</span>
            <span><strong>Telefón:</strong> ${safeText(place.contactPersonPhone || 'N/A')}</span>
          </div>
          ${goodsHtml}
        </div>
      `;
    });
  } else {
    unloadingPlacesHtml = '<p>Žiadne miesta vykládky</p>';
  }

  // Výpočet dátumu splatnosti
  const currentDate = new Date();
  const dueDate = new Date(currentDate);
  dueDate.setDate(currentDate.getDate() + paymentTermDays);
  const dueDateFormatted = formatDate(dueDate, 'dd.MM.yyyy');

  // Generovanie kompletného HTML pre PDF - verzia pre dopravcu
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Dopravná objednávka č. ${orderNumber}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.4;
          color: #333;
          margin: 0;
          padding: 0;
          font-size: 11px;
        }
        .container {
          max-width: 100%;
          margin: 0 auto;
          padding: 20px;
          box-sizing: border-box;
        }
        .header {
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .company-section {
          flex: 1;
        }
        .company-name {
          font-size: 22px;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }
        .company-logo {
          max-height: 50px;
          max-width: 180px;
          margin-bottom: 8px;
        }
        .company-info {
          font-size: 10px;
          color: #666;
          line-height: 1.3;
        }
        .date-section {
          text-align: right;
          font-size: 11px;
        }
        .order-title {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin: 25px 0 20px 0;
          color: #333;
          border: 2px solid #333;
          padding: 8px;
          background-color: #f8f8f8;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 20px;
        }
        .info-box {
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 12px;
          width: 48%;
          font-size: 10px;
        }
        .info-box h3 {
          margin-top: 0;
          margin-bottom: 8px;
          color: #333;
          font-size: 12px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 4px;
        }
        .info-box p {
          margin: 3px 0;
          line-height: 1.3;
        }
        .transport-section {
          margin: 15px 0;
        }
        .section-title {
          background-color: #333;
          color: white;
          padding: 6px 12px;
          margin: 15px 0 10px 0;
          font-size: 12px;
          font-weight: bold;
        }
        .place-box-compact {
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          margin-bottom: 8px;
          font-size: 10px;
        }
        .place-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
          font-weight: bold;
          color: #333;
        }
        .place-date {
          color: #666;
          font-size: 9px;
        }
        .place-address {
          margin: 3px 0;
          font-weight: bold;
          color: #000;
        }
        .place-details {
          display: flex;
          gap: 15px;
          margin: 3px 0;
          font-size: 9px;
          color: #666;
        }
        .vehicle-section {
          margin: 20px 0;
          background-color: #f0f0f0;
          padding: 10px;
          border-radius: 5px;
          border-left: 4px solid #333;
        }
        .vehicle-section p {
          margin: 5px 0;
          font-size: 11px;
          font-weight: bold;
        }
        .payment-section {
          margin: 20px 0;
          display: flex;
          justify-content: space-between;
          background-color: #f5f5f5;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid #ddd;
        }
        .payment-item {
          font-size: 11px;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 8px;
          color: #777;
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
        @page {
          margin: 15mm;
        }
        @media print {
          .container {
            padding: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="company-section">
            ${hasLogo 
              ? `<img src="${settings.logoBase64}" alt="${safeText(companyName)}" class="company-logo" />`
              : `<div class="company-name">${safeText(companyName)}</div>`
            }
            <div class="company-info">
              <strong>${safeText(companyFullName)}</strong><br>
              ${safeText(companyAddress)}<br>
              IČO: ${safeText(companyID)} | DIČ: ${safeText(companyVatID)}
            </div>
          </div>
          <div class="date-section">
            <strong>${safeText(settings?.city || 'Trnava')}, ${createdAtDate}</strong>
          </div>
        </div>

        <!-- Order Title -->
        <div class="order-title">Dopravné objednávky číslo: ${safeText(orderNumber)}</div>

        <!-- Company Info Section -->
        <div class="info-section">
          <div class="info-box">
            <h3>Príjemca</h3>
            <p><strong>${safeText(recipientCompany)}</strong></p>
            <p>${safeText(recipientAddress)}</p>
            <p>IČO: ${safeText(carrierData?.ico || 'N/A')}</p>
            <p>DIČ/DPH: ${safeText(recipientVatID)}</p>
            <p><strong>Kontakt:</strong> ${safeText(recipientContact)}</p>
            ${carrierData?.contactPhone ? `<p><strong>Telefón:</strong> ${safeText(carrierData.contactPhone)}</p>` : ''}
            ${carrierData?.contactEmail ? `<p><strong>E-mail:</strong> ${safeText(carrierData.contactEmail)}</p>` : ''}
          </div>
          <div class="info-box">
            <h3>Predajca</h3>
            <p><strong>${safeText(companyFullName)}</strong></p>
            <p>${safeText(companyAddress)}</p>
            <p>IČO: ${safeText(companyID)}</p>
            <p>DIČ: ${safeText(companyVatID)}</p>
            <p><strong>Kontakt:</strong> ${safeText(dispatcherContact)}</p>
          </div>
        </div>

        <!-- Loading Places -->
        <div class="section-title">Miesta nakládky</div>
        ${loadingPlacesHtml}

        <!-- Unloading Places -->
        <div class="section-title">Miesta vykládky</div>
        ${unloadingPlacesHtml}

        <!-- Vehicle Information -->
        <div class="vehicle-section">
          <p><strong>Ťahač:</strong> ${safeText(vehicleRegistration)}</p>
        </div>

        <!-- Payment Information -->
        <div class="payment-section">
          <div class="payment-item">
            <strong>Dátum splatnosti:</strong><br>
            ${paymentTermDays} dní od prijatia faktúry a dokumentov<br>
            (do ${dueDateFormatted})
          </div>
          <div class="payment-item">
            <strong>Preprava (bez DPH):</strong><br>
            Podľa zmluvy s dopravcom
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Dokument bol automaticky vygenerovaný v AESA Transport Platform | ${new Date().toLocaleDateString('sk-SK')}</p>
          <p>${safeText(companyFullName)} | ${safeText(companyAddress)} | IČO: ${safeText(companyID)} | DIČ: ${safeText(companyVatID)}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}