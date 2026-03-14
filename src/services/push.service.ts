import api from '@/lib/axios';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export const pushApiService = {
  async getVapidPublicKey(): Promise<string> {
    const res = await api.get<{ success: boolean; data: { publicKey: string } }>(
      '/push/vapid-public-key',
    );
    return res.data.data.publicKey;
  },

  async subscribe(subscription: PushSubscriptionJSON): Promise<void> {
    await api.post('/push/subscribe', {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth,
      },
      lang: navigator.language.split('-')[0],
    });
  },

  async unsubscribe(endpoint: string): Promise<void> {
    await api.post('/push/unsubscribe', { endpoint });
  },

  urlBase64ToUint8Array,
};
