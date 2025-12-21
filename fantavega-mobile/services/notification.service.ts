// services/notification.service.ts
// Servizio per gestione push notifications
// Best Practice: expo-notifications + Firebase per storage token

import { realtimeDb } from "@/lib/firebase";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { get, ref, set } from "firebase/database";
import { Platform } from "react-native";

// ============================================
// TYPES
// ============================================

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// ============================================
// CONFIGURATION
// ============================================

// Handler per notifiche in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ============================================
// REGISTRATION
// ============================================

/**
 * Registra il dispositivo per push notifications
 * Ritorna l'Expo Push Token se successo, null altrimenti
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Solo dispositivi fisici supportano push
  if (!Device.isDevice) {
    console.log("Push notifications only work on physical devices");
    return null;
  }

  // Android richiede canale notifiche
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4f46e5",
    });
  }

  // Verifica permessi
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permissions not granted");
    return null;
  }

  // Ottieni Expo Push Token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error("EAS projectId not found in app.json");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log("Push token obtained:", tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

// ============================================
// FIREBASE TOKEN STORAGE
// ============================================

/**
 * Salva il push token in Firebase per l'utente
 */
export async function savePushTokenToFirebase(
  userId: string,
  token: string
): Promise<void> {
  const tokenRef = ref(realtimeDb, `users/${userId}/pushToken`);
  await set(tokenRef, {
    token,
    platform: Platform.OS,
    updatedAt: Date.now(),
  });
  console.log("Push token saved to Firebase for user:", userId);
}

/**
 * Recupera il push token di un utente da Firebase
 */
export async function getPushTokenFromFirebase(
  userId: string
): Promise<string | null> {
  const tokenRef = ref(realtimeDb, `users/${userId}/pushToken`);
  const snapshot = await get(tokenRef);

  if (snapshot.exists()) {
    const data = snapshot.val();
    return data.token ?? null;
  }
  return null;
}

// ============================================
// SEND NOTIFICATIONS (via Expo Push API)
// ============================================

/**
 * Invia una push notification a un utente specifico
 * Usa Expo Push Notification Service
 */
export async function sendPushToUser(
  targetUserId: string,
  notification: PushNotificationPayload
): Promise<boolean> {
  const token = await getPushTokenFromFirebase(targetUserId);

  if (!token) {
    console.log("No push token found for user:", targetUserId);
    return false;
  }

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        title: notification.title,
        body: notification.body,
        data: notification.data ?? {},
        sound: "default",
        priority: "high",
      }),
    });

    const result = await response.json();
    console.log("Push notification sent:", result);
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}

// ============================================
// LOCAL NOTIFICATIONS
// ============================================

/**
 * Schedula una notifica locale per asta in scadenza
 * @param auctionId - ID dell'asta
 * @param playerName - Nome del giocatore
 * @param secondsUntilEnd - Secondi rimanenti prima della scadenza
 */
export async function scheduleAuctionEndingNotification(
  auctionId: string,
  playerName: string,
  secondsUntilEnd: number
): Promise<string | null> {
  // Non schedulare se mancano meno di 10 secondi
  if (secondsUntilEnd < 10) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Asta in scadenza!",
        body: `L'asta per ${playerName} sta per terminare`,
        data: { auctionId, type: "auction_ending" },
        sound: "default",
      },
      trigger: null, // Notifica immediata
    });

    console.log("Local notification scheduled:", id);
    return id;
  } catch (error) {
    console.error("Error scheduling local notification:", error);
    return null;
  }
}

/**
 * Cancella una notifica schedulata
 */
export async function cancelScheduledNotification(
  notificationId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
