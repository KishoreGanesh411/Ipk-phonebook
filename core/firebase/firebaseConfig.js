// firebaseConfig.js
import { initializeApp } from 'firebase/app';
// (Optionally import other Firebase services you plan to use, e.g. auth)
import { getAuth } from 'firebase/auth';
// Your web app's Firebase configuration:
const firebaseConfig = {
  apiKey: "AIzaSyDSh9ccZviLr1VIfhVD261jyK9_0si0f4g",
  authDomain: "ipkwealth-crm.firebaseapp.com",
  projectId: "ipkwealth-crm",
  storageBucket: "ipkwealth-crm.firebasestorage.app",
  messagingSenderId: "865119744232",
  appId: "1:865119744232:web:866da3f3b582b4f49a595d",
  measurementId: "G-NES6XWW4YC"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);