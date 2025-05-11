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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleMapsProxy = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
// Zmeníme import node-fetch za dynamický import alebo použijeme undici
// import fetch from 'node-fetch';
// Bezpečné uloženie API kľúčov v environment premenných Cloud Functions
// alebo v Firebase Secret Manager
const API_KEYS = {
    google_maps: (_a = functions.config().google) === null || _a === void 0 ? void 0 : _a.maps_api_key,
    weather_api: (_b = functions.config().weather) === null || _b === void 0 ? void 0 : _b.api_key,
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
exports.googleMapsProxy = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    // Kontrola autentifikácie
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Vyžaduje sa prihlásenie.');
    }
    const { endpoint, params } = data;
    if (!endpoint) {
        throw new functions.https.HttpsError('invalid-argument', 'Chýba parameter endpoint.');
    }
    // Povolené endpointy
    const allowedEndpoints = ['geocode', 'directions', 'places', 'distancematrix'];
    if (!allowedEndpoints.includes(endpoint)) {
        throw new functions.https.HttpsError('invalid-argument', 'Neplatný endpoint.');
    }
    try {
        // Pridajte API kľúč k parametrom
        const apiParams = new URLSearchParams(params || {});
        apiParams.append('key', API_KEYS.google_maps);
        // Zostavte URL
        const url = `https://maps.googleapis.com/maps/api/${endpoint}/json?${apiParams.toString()}`;
        // Použijeme natívny https modul namiesto node-fetch
        const https = require('https');
        return new Promise((resolve, reject) => {
            const req = https.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve({ result });
                    }
                    catch (e) {
                        reject(new functions.https.HttpsError('internal', 'Nastala chyba pri spracovaní odpovede.'));
                    }
                });
            });
            req.on('error', (e) => {
                console.error('Chyba pri volaní Google Maps API:', e);
                reject(new functions.https.HttpsError('internal', 'Nastala chyba pri spracovaní požiadavky.'));
            });
            req.end();
        });
    }
    catch (error) {
        console.error('Chyba pri volaní Google Maps API:', error);
        throw new functions.https.HttpsError('internal', 'Nastala chyba pri spracovaní požiadavky.');
    }
});
// API Proxy pre iné služby môžete implementovať podobne
// export const otherApiProxy = functions.region('europe-west1').https.onCall(async (data, context) => { ... }); 
//# sourceMappingURL=api-proxy.js.map