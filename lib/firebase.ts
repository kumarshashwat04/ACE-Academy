import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA2VT9SD0dOg38Rev4H256F9JMxcBx8xLs",
  authDomain: "ace-academy-f0bc5.firebaseapp.com",
  projectId: "ace-academy-f0bc5",
  storageBucket: "ace-academy-f0bc5.firebasestorage.app",
  messagingSenderId: "951209070714",
  appId: "1:951209070714:web:60deca91fe523414a82bc3",
  measurementId: "G-GB8X2Z35NR",
};

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

export const auth = getAuth(app);
