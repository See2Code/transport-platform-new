import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
// Zmeníme import node-fetch za dynamický import alebo použijeme undici
// import fetch from 'node-fetch';

// Bezpečné uloženie API kľúčov v environment premenných Cloud Functions
// alebo v Firebase Secret Manager
const API_KEYS = {
  google_maps: functions.config().google?.maps_api_key,
  weather_api: functions.config().weather?.api_key,
  // ďalšie API kľúče
};

// Inicializácia Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Middleware pre autentifikáciu - momentálne sa nepoužíva, ale zachované pre budúce použitie
// pri implementácii REST API endpointov
/* 
const authenticateRequest = async (req: functions.https.Request): Promise<string | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Chyba pri verifikácii tokenu:', error);
    return null;
  }
};
*/

// API Proxy pre Google Maps
export const googleMapsProxy = functions
  .region('europe-west1')
  .https.onCall(async (data: {
    endpoint: string;
    params: Record<string, string>;
  }, context: functions.https.CallableContext) => {
    // Kontrola autentifikácie
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Vyžaduje sa prihlásenie.'
      );
    }

    const { endpoint, params } = data;
    if (!endpoint) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Chýba parameter endpoint.'
      );
    }

    // Povolené endpointy
    const allowedEndpoints = ['geocode', 'directions', 'places', 'distancematrix'];
    if (!allowedEndpoints.includes(endpoint)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Neplatný endpoint.'
      );
    }

    try {
      // Pridajte API kľúč k parametrom
      const apiParams = new URLSearchParams(params || {});
      apiParams.append('key', API_KEYS.google_maps!);

      // Zostavte URL
      const url = `https://maps.googleapis.com/maps/api/${endpoint}/json?${apiParams.toString()}`;

      // Použijeme natívny https modul namiesto node-fetch
      const https = require('https');
      
      return new Promise((resolve, reject) => {
        const req = https.get(url, (res: any) => {
          let data = '';
          res.on('data', (chunk: string) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              resolve({ result });
            } catch (e) {
              reject(new functions.https.HttpsError('internal', 'Nastala chyba pri spracovaní odpovede.'));
            }
          });
        });
        
        req.on('error', (e: any) => {
          console.error('Chyba pri volaní Google Maps API:', e);
          reject(new functions.https.HttpsError('internal', 'Nastala chyba pri spracovaní požiadavky.'));
        });
        
        req.end();
      });
    } catch (error) {
      console.error('Chyba pri volaní Google Maps API:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Nastala chyba pri spracovaní požiadavky.'
      );
    }
  });

// API Proxy pre iné služby môžete implementovať podobne
// export const otherApiProxy = functions.region('europe-west1').https.onCall(async (data, context) => { ... }); 