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
exports.getDriverLocation = exports.updateDriverLocation = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
exports.updateDriverLocation = (0, https_1.onCall)({ region: 'europe-west1' }, async (request) => {
    // Kontrola autentifikácie
    if (!request.auth) {
        throw new Error('Používateľ nie je prihlásený');
    }
    const data = request.data;
    const userId = request.auth.uid;
    // Kontrola vstupných dát
    if (!data.latitude || !data.longitude) {
        throw new Error('Chýbajúce súradnice');
    }
    try {
        // Získanie údajov o používateľovi
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData) {
            throw new Error('Používateľ nebol nájdený');
        }
        // Aktualizácia polohy vozidla
        await admin.firestore().collection('vehicleLocations').doc(userId).set({
            latitude: data.latitude,
            longitude: data.longitude,
            driverName: `${userData.firstName} ${userData.lastName}`,
            companyID: userData.companyID,
            lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        }, { merge: true });
        return { success: true };
    }
    catch (error) {
        console.error('Error updating driver location:', error);
        throw new Error('Chyba pri aktualizácii polohy');
    }
});
exports.getDriverLocation = (0, https_1.onCall)({ region: 'europe-west1' }, async (request) => {
    // Kontrola autentifikácie
    if (!request.auth) {
        throw new Error('Používateľ nie je prihlásený');
    }
    const data = request.data;
    try {
        const locationDoc = await admin.firestore().collection('vehicleLocations').doc(data.userId).get();
        const locationData = locationDoc.data();
        if (!locationData) {
            throw new Error('Poloha nebola nájdená');
        }
        return locationData;
    }
    catch (error) {
        console.error('Error getting driver location:', error);
        throw new Error('Chyba pri získavaní polohy');
    }
});
//# sourceMappingURL=location.js.map