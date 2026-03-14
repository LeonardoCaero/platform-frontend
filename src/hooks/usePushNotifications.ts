import { useEffect, useRef } from 'react';
import { pushApiService } from '@/services/push.service';

/**
 * Requests push notification permission and registers the device subscription
 * with the backend. Should be called once the user is authenticated.
 *
 * The hook is idempotent: if the device is already subscribed it just syncs
 * the subscription with the backend (in case the user logged out and back in
 * on the same device).
 */
export function usePushNotifications(isAuthenticated: boolean) {
  const attempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || attempted.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    attempted.current = true;
    registerPush().catch(() => {
    });
  }, [isAuthenticated]);
}

async function registerPush() {
  const publicKey = await pushApiService.getVapidPublicKey().catch(() => null);
  if (!publicKey) return;

  const registration = await navigator.serviceWorker.ready;

  const existingSub = await registration.pushManager.getSubscription();

  if (existingSub) {
    await pushApiService.subscribe(existingSub.toJSON()).catch(() => {});
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: pushApiService.urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
  });

  await pushApiService.subscribe(subscription.toJSON());
}
