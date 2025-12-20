// lib/firebase.ts
// Firebase configuration and initialization

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
// @ts-ignore - Exists at runtime in RN environment
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
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

// Initialize Auth with AsyncStorage persistence
// Check if auth is already initialized to prevent "auth/already-initialized" on HMR
let authInstance;
try {
  authInstance = getReactNativePersistence ?
    initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }) :
    getAuth(app); // Fallback or if already initialized handled internally by some SDK versions
} catch (e: any) {
  if (e.code === 'auth/already-initialized') {
    authInstance = getAuth(app);
  } else {
    throw e;
  }
}

export const auth = authInstance;
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);

export default app;
