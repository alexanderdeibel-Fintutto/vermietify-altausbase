import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Push-Benachrichtigungen werden nicht unterstützt');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await subscribeToPush();
        return true;
      } else {
        toast.error('Push-Benachrichtigungen abgelehnt');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Fehler beim Aktivieren der Push-Benachrichtigungen');
      return false;
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from your backend (you'll need to generate this)
      const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with actual key
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      setSubscription(subscription);

      // Save subscription to user preferences
      const user = await base44.auth.me();
      const preferences = await base44.entities.NotificationPreference.filter(
        { user_email: user.email },
        null,
        1
      );

      if (preferences[0]) {
        await base44.entities.NotificationPreference.update(preferences[0].id, {
          push_enabled: true,
          push_subscription: subscription.toJSON()
        });
      } else {
        await base44.entities.NotificationPreference.create({
          user_email: user.email,
          push_enabled: true,
          push_subscription: subscription.toJSON()
        });
      }

      toast.success('Push-Benachrichtigungen aktiviert');
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Fehler beim Abonnieren');
    }
  };

  const unsubscribeFromPush = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      const user = await base44.auth.me();
      const preferences = await base44.entities.NotificationPreference.filter(
        { user_email: user.email },
        null,
        1
      );

      if (preferences[0]) {
        await base44.entities.NotificationPreference.update(preferences[0].id, {
          push_enabled: false,
          push_subscription: null
        });
      }

      toast.success('Push-Benachrichtigungen deaktiviert');
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Fehler beim Deaktivieren');
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    unsubscribeFromPush
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}