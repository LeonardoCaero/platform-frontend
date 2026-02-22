import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

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

  // Keep toast in a ref so the effect closure is never stale
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
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
          toastRef.current({
            title: `📬 New invitation from ${inv.company?.name ?? 'a company'}`,
            description: 'Open the notification bell to accept or decline.',
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
            const project = payload.projectName ? ` · ${payload.projectName}` : '';
            const hours = payload.hours !== undefined ? `${payload.hours}h` : '';
            toastRef.current({
              title: `⏱ ${payload.userName} ha imputado ${hours}${project}`,
              description: payload.companyName,
            });
          } else if (payload.action === 'updated') {
            const project = payload.projectName ? ` · ${payload.projectName}` : '';
            const hours = payload.hours !== undefined ? `${payload.hours}h` : '';
            toastRef.current({
              title: `✏️ ${payload.userName} ha editado un apunte ${hours}${project}`,
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
