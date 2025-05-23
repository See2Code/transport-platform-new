const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFunctions, httpsCallable } = require('firebase/functions');

const firebaseConfig = {
  apiKey: 'AIzaSyBGc-kNZRE02P2gdnNurO7lncjiM-5Hg0k',
  authDomain: 'core-app-423c7.firebaseapp.com',
  projectId: 'core-app-423c7',
  storageBucket: 'core-app-423c7.appspot.com',
  messagingSenderId: '835019350891',
  appId: '1:835019350891:web:906b5ab11b77816ee14f81'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, 'europe-west1');

async function fixCounts() {
  try {
    console.log('Prihlasujem používateľa...');
    await signInWithEmailAndPassword(auth, 'robert.miklos@aesa.sk', 'Robert1997');
    console.log('Prihlásený, volám fixUnreadCounts...');
    
    const fixUnreadCounts = httpsCallable(functions, 'fixUnreadCounts');
    const result = await fixUnreadCounts({});
    console.log('Výsledok:', result.data);
  } catch (error) {
    console.error('Chyba:', error);
  } finally {
    process.exit(0);
  }
}

fixCounts(); 