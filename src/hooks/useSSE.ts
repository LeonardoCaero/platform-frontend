import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const SSE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'}/sse`;

/**
 * Establishes a Server-Sent Events connection so the UI updates
 * in real time without polling.
 *
 * Events handled:
 *  - `invitation:new`       → invalidates pending-invitations + shows a toast
 *  - `time-entry:change`    → invalidates all time-entries queries; toasts are
 *                             debounced and grouped so rapid bursts produce a
 *                             single notification instead of many.
 *  - `calendar-note:change` → invalidates calendar-notes queries for the company
 *
 * @param enabled  Should be `true` only when the user is authenticated.
 */
export function useSSE(enabled: boolean) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Keep toast in a ref so the effect closure is never stale
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  });

  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  // Buffer + timer for grouping rapid time-entry toasts
  type TimeEntryPayload = {
    action: 'created' | 'updated' | 'deleted';
    companyName?: string;
    userName?: string;
    hours?: number;
    projectName?: string | null;
  };
  const timeEntryBuffer = useRef<TimeEntryPayload[]>([]);
  const timeEntryFlushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let es: EventSource | null = null;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function flushTimeEntryToast() {
      const items = timeEntryBuffer.current.splice(0).filter(p => p.action !== 'deleted');
      if (items.length === 0) return;

      const s = tRef.current.sse;
      if (items.length === 1) {
        const p = items[0];
        const project = p.projectName ? ` · ${p.projectName}` : '';
        const hours = p.hours !== undefined ? `${p.hours}h` : '';
        const template = p.action === 'created' ? s.timeEntryCreated : s.timeEntryUpdated;
        const title = template
          .replace('{{name}}', p.userName ?? '')
          .replace('{{hours}}', hours)
          .replace('{{project}}', project);
        toastRef.current({ title, description: p.companyName, href: '/time-tracker' });
      } else {
        const lines = items.map(p => {
          const project = p.projectName ? ` · ${p.projectName}` : '';
          const hours = p.hours !== undefined ? `${p.hours}h` : '';
          const template = p.action === 'created' ? s.timeEntryCreated : s.timeEntryUpdated;
          return template
            .replace('{{name}}', p.userName ?? '')
            .replace('{{hours}}', hours)
            .replace('{{project}}', project);
        });
        toastRef.current({
          title: s.timeEntryBulkTitle.replace('{{count}}', String(items.length)),
          description: lines.join('\n'),
          href: '/time-tracker',
        });
      }
    }

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
          const s = tRef.current.sse;
          toastRef.current({
            title: s.invitationTitle.replace('{{company}}', inv.company?.name ?? ''),
            description: s.invitationDesc,
            href: '/companies',
          });
        } catch {
          // ignore malformed payloads
        }
      });

      // Real-time time entry changes — debounced + grouped
      es.addEventListener('time-entry:change', (e: MessageEvent) => {
        queryClient.invalidateQueries({ queryKey: ['time-entries'] });
        try {
          const payload = JSON.parse(e.data) as TimeEntryPayload;
          timeEntryBuffer.current.push(payload);
          if (timeEntryFlushTimer.current) clearTimeout(timeEntryFlushTimer.current);
          timeEntryFlushTimer.current = setTimeout(flushTimeEntryToast, 600);
        } catch {
          // ignore malformed payloads
        }
      });

      // Real-time calendar note changes
      es.addEventListener('calendar-note:change', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data) as { companyId?: string };
          queryClient.invalidateQueries({ queryKey: ['calendar-notes', payload.companyId] });
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
      if (timeEntryFlushTimer.current) clearTimeout(timeEntryFlushTimer.current);
      es?.close();
    };
  }, [enabled, queryClient]);
}
