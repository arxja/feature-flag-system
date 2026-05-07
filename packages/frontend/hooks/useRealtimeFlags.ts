'use client';

import { useEffect, useState, useCallback } from 'react';
import { flagsApi } from '@/lib/api/client';
import { SSEEvent } from '../types/type';

export function useRealtimeFlags(onFlagChange?: (event: SSEEvent) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/api/sse');

    eventSource.onopen = () => {
      console.log('🔌 SSE Connected');
      setIsConnected(true);
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE Error:', error);
      setIsConnected(false);

      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('🔄 Reconnecting SSE...');
        }
      }, 3000);
    };

    eventSource.addEventListener('flag_update', (event: MessageEvent) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        console.log(`📡 SSE: Flag ${data.action}`, data.flagKey);

        setLastEvent(data);

        if (onFlagChange) {
          onFlagChange(data);
        }

        // showToast(`${data.flagKey} was ${data.action.toLowerCase()}d`);
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
      }
    });

    eventSource.addEventListener('bulk_update', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`📡 SSE: Bulk update for ${data.flagKeys.length} flags`);

        if (onFlagChange) {
          onFlagChange({ type: 'bulk_update', ...data });
        }
      } catch (error) {
        console.error('Failed to parse bulk update:', error);
      }
    });

    return () => {
      console.log('🔌 Closing SSE connection');
      eventSource.close();
      setIsConnected(false);
    };
  }, [onFlagChange]);

  return { isConnected, lastEvent };
}
