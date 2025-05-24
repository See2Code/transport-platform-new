const admin = require('firebase-admin');

// Inicializácia Firebase Admin SDK
const serviceAccount = require('./core-app-423c7-firebase-adminsdk-ycnzh-4aa48e4bb3.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateContactData() {
  console.log('🚀 Spúšťam migráciu kontaktných údajov...');
  
  try {
    // Získame všetky objednávky
    const ordersSnapshot = await db.collection('orders').get();
    console.log(`📦 Našiel som ${ordersSnapshot.docs.length} objednávok na migráciu`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    // Spracujeme každú objednávku
    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data();
      let needsUpdate = false;
      let updatedData = { ...orderData };
      
      // Skontrolujeme a migrujeme miesta nakládky
      if (orderData.loadingPlaces && Array.isArray(orderData.loadingPlaces)) {
        updatedData.loadingPlaces = orderData.loadingPlaces.map(place => {
          const updatedPlace = { ...place };
          
          // Ak nie je contactPersonName ale je contactPerson, migrujeme
          if (!updatedPlace.contactPersonName && updatedPlace.contactPerson) {
            updatedPlace.contactPersonName = updatedPlace.contactPerson;
            needsUpdate = true;
          }
          
          // Ak nie je contactPersonPhone, nastavíme prázdny string
          if (!updatedPlace.contactPersonPhone) {
            updatedPlace.contactPersonPhone = '';
            needsUpdate = true;
          }
          
          return updatedPlace;
        });
      }
      
      // Skontrolujeme a migrujeme miesta vykládky
      if (orderData.unloadingPlaces && Array.isArray(orderData.unloadingPlaces)) {
        updatedData.unloadingPlaces = orderData.unloadingPlaces.map(place => {
          const updatedPlace = { ...place };
          
          // Ak nie je contactPersonName ale je contactPerson, migrujeme
          if (!updatedPlace.contactPersonName && updatedPlace.contactPerson) {
            updatedPlace.contactPersonName = updatedPlace.contactPerson;
            needsUpdate = true;
          }
          
          // Ak nie je contactPersonPhone, nastavíme prázdny string
          if (!updatedPlace.contactPersonPhone) {
            updatedPlace.contactPersonPhone = '';
            needsUpdate = true;
          }
          
          return updatedPlace;
        });
      }
      
      // Ak sú potrebné zmeny, aktualizujeme dokument
      if (needsUpdate) {
        await db.collection('orders').doc(orderDoc.id).update(updatedData);
        migratedCount++;
        console.log(`✅ Migrovaná objednávka: ${orderDoc.id}`);
      } else {
        skippedCount++;
        console.log(`⏭️  Preskočená objednávka (už má nový formát): ${orderDoc.id}`);
      }
    }
    
    console.log(`🎉 Migrácia dokončená!`);
    console.log(`📊 Štatistiky:`);
    console.log(`   - Celkovo objednávok: ${ordersSnapshot.docs.length}`);
    console.log(`   - Migrovaných: ${migratedCount}`);
    console.log(`   - Preskočených: ${skippedCount}`);
    
  } catch (error) {
    console.error('❌ Chyba pri migrácii:', error);
  }
}

// Spustíme migráciu
migrateContactData()
  .then(() => {
    console.log('✅ Migračný skript dokončený');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Chyba pri spustení migračného skriptu:', error);
    process.exit(1);
  }); 