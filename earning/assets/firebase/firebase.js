import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBTXIDZY-XhO9X5l0q1qqFK1FiEVI-uXXA",
  authDomain: "takabd44.firebaseapp.com",
  databaseURL: "https://takabd44-default-rtdb.firebaseio.com",
  projectId: "takabd44",
  storageBucket: "takabd44.firebasestorage.app",
  messagingSenderId: "653424131458",
  appId: "1:653424131458:web:42ed0d47902e88eac9e39b",
  measurementId: "G-3LMX66GK5C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});
