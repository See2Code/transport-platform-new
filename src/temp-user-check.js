// Tento skript môžete spustiť v konzole prehliadača

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Funkcia na vyhľadanie používateľa podľa e-mailu
async function findUserByEmail(email) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`Používateľ s e-mailom ${email} nebol nájdený.`);
      return null;
    }
    
    // Mal by existovať len jeden používateľ s týmto e-mailom
    const userData = querySnapshot.docs[0].data();
    const userId = querySnapshot.docs[0].id;
    
    console.log('Údaje používateľa:', {
      id: userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      companyName: userData.companyName || 'Nezadaná firma',
      role: userData.role,
      companyID: userData.companyID
    });
    
    // Ak má používateľ companyID, hľadáme ďalšie informácie o firme
    if (userData.companyID) {
      const companyRef = doc(db, 'companies', userData.companyID);
      const companyDoc = await getDoc(companyRef);
      if (companyDoc.exists()) {
        console.log('Údaje o firme:', companyDoc.data());
      } else {
        console.log('Firma s ID', userData.companyID, 'neexistuje.');
      }
    }
    
    return userData;
  } catch (error) {
    console.error('Chyba pri hľadaní používateľa:', error);
    return null;
  }
}

// Spustite túto funkciu v konzole prehliadača
findUserByEmail('call@aesa.sk')
  .then(userData => {
    if (userData) {
      console.log('Používateľ nájdený a údaje zobrazené vyššie.');
    }
  })
  .catch(error => {
    console.error('Chyba:', error);
  });

// Poznámka: 
// Ak vidíte "Nezadaná firma", znamená to, že používateľ buď:
// 1. Nemá nastavenú žiadnu hodnotu pre companyName
// 2. Hodnota companyName je explicitne nastavená na "Nezadaná firma"
