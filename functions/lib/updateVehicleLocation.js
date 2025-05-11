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
exports.updateVehicleLocation = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
exports.updateVehicleLocation = (0, https_1.onRequest)(async (request, response) => {
    try {
        // Kontrola metódy
        if (request.method !== 'POST') {
            response.status(405).send('Method Not Allowed');
            return;
        }
        // Kontrola dát
        const { vehicleId, latitude, longitude, timestamp } = request.body;
        if (!vehicleId || !latitude || !longitude || !timestamp) {
            response.status(400).send('Missing required fields');
            return;
        }
        // Aktualizácia polohy v Realtime Database
        const db = admin.database();
        await db.ref(`drivers/${vehicleId}`).set({
            latitude,
            longitude,
            timestamp,
            lastUpdate: admin.database.ServerValue.TIMESTAMP
        });
        response.status(200).send('Location updated successfully');
    }
    catch (error) {
        console.error('Error updating vehicle location:', error);
        response.status(500).send('Internal Server Error');
    }
});
//# sourceMappingURL=updateVehicleLocation.js.map