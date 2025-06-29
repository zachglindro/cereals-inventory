import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBUL-NAAaEqtwwianL51V9X-B9A07k8c9c",
  authDomain: "cereals-inventory-43693.firebaseapp.com",
  projectId: "cereals-inventory-43693",
  storageBucket: "cereals-inventory-43693.firebasestorage.app",
  messagingSenderId: "103408681140",
  appId: "1:103408681140:web:228509bac2e978a34097e1",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
