// hooks/usePushNotifications.ts
// Hook per gestire push notifications nel ciclo di vita dell'app
// Best Practice: Registra token al login, gestisce listener

import {
  registerForPushNotifications,
  savePushTokenToFirebase,
} from "@/services/notification.service";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";

interface UsePushNotificationsResult {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
}

/**
 * Hook per gestire push notifications
 * - Registra il dispositivo quando userId è disponibile
 * - Gestisce listener per notifiche in foreground
 */
export function usePushNotifications(
  userId: string | null
): UsePushNotificationsResult {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!userId) {
      // Cleanup se l'utente si disconnette
      setExpoPushToken(null);
      setIsRegistered(false);
      return;
    }

    // Registra per push notifications
    const register = async () => {
      const token = await registerForPushNotifications();

      if (token) {
        setExpoPushToken(token);
        await savePushTokenToFirebase(userId, token);
        setIsRegistered(true);
      }
    };

    register();

    // Listener per notifiche ricevute in foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received in foreground:", notification);
        setNotification(notification);
      });

    // Listener per interazione con notifica (tap)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification tapped:", response);
        const data = response.notification.request.content.data;

        // Gestisci navigazione in base al tipo di notifica
        if (data?.type === "bid_surpassed" && data?.auctionId) {
          // TODO: Navigare all'asta
          console.log("Navigate to auction:", data.auctionId);
        }
      });

    // Cleanup
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [userId]);

  return {
    expoPushToken,
    notification,
    isRegistered,
  };
}
