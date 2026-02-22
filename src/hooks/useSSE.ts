import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const SSE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'}/sse`;

/**
 * Establishes a Server-Sent Events connection so the UI updates
 * in real time without polling.
 *
 * Events handled:
 *  - `invitation:new`    → invalidates pending-invitations + shows a toast
 *  - `time-entry:change` → invalidates all time-entries queries
 *
 * @param enabled  Should be `true` only when the user is authenticated.
 */
export function useSSE(enabled: boolean) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Keep toast and t in refs so event handler closures are never stale
  const toastRef = useRef(toast);
  const tRef = useRef(t);
  useEffect(() => {
    toastRef.current = toast;
    tRef.current = t;
  });

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let es: EventSource | null = null;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (disposed) return;

      const token = localStorage.getItem('accessToken');
      if (!token) return;

      es = new EventSource(`${SSE_URL}?token=${encodeURIComponent(token)}`);

      // Successful connection — reset retry counter
      es.addEventListener('connected', () => {
        retryCount = 0;
      });

      // Real-time invitation notification
      es.addEventListener('invitation:new', (e: MessageEvent) => {
        queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
        try {
          const inv = JSON.parse(e.data) as { company?: { name?: string } };
          const n = tRef.current.notifications;
          toastRef.current({
            title: n.invitationTitle(inv.company?.name ?? ''),
            description: n.invitationDesc,
          });
        } catch {
          // ignore malformed payloads
        }
      });

      // Real-time time entry changes (create / update / delete)
      es.addEventListener('time-entry:change', (e: MessageEvent) => {
        // Always refresh the data regardless of action
        queryClient.invalidateQueries({ queryKey: ['time-entries'] });

        try {
          const payload = JSON.parse(e.data) as {
            action: 'created' | 'updated' | 'deleted';
            companyName?: string;
            userName?: string;
            hours?: number;
            projectName?: string | null;
            date?: string;
          };

          if (payload.action === 'created') {
            const n = tRef.current.notifications;
            toastRef.current({
              title: n.timeEntryCreated(
                payload.userName ?? '',
                payload.hours ?? 0,
                payload.projectName ?? null,
              ),
              description: payload.companyName,
            });
          } else if (payload.action === 'updated') {
            const n = tRef.current.notifications;
            toastRef.current({
              title: n.timeEntryUpdated(
                payload.userName ?? '',
                payload.hours ?? 0,
                payload.projectName ?? null,
              ),
              description: payload.companyName,
            });
          }
        } catch {
          // ignore malformed payloads
        }
      });

      es.onerror = () => {
        es?.close();
        es = null;
        if (!disposed) {
          const delay = Math.min(2_000 * 2 ** retryCount, 30_000);
          retryCount += 1;
          retryTimer = setTimeout(connect, delay);
        }
      };
    }

    connect();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      es?.close();
    };
  }, [enabled, queryClient]);
}
