// lib/firebase.ts
// Firebase configuration and initialization

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4Sw7SwyW2ZPn9P3-uOeFsUAXRsPzhiIg",
  authDomain: "fantavega.firebaseapp.com",
  databaseURL: "https://fantavega-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fantavega",
  storageBucket: "fantavega.firebasestorage.app",
  messagingSenderId: "201333299716",
  appId: "1:201333299716:web:ab1182838b45b133977351",
  measurementId: "G-BCJJ4TJTQZ"
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);

export default app;
