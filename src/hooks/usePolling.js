import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for optimized polling with visibility API and exponential backoff
 * Replaces setInterval with smarter polling that:
 * - Pauses when tab is hidden
 * - Uses exponential backoff on errors
 * - Cleans up properly
 */
export function usePolling(callback, interval = 30000, options = {}) {
  const {
    enabled = true,
    immediate = false,
    onError = null
  } = options;

  const callbackRef = useRef(callback);
  const timeoutRef = useRef(null);
  const backoffRef = useRef(1);
  const isVisibleRef = useRef(!document.hidden);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const scheduleNext = useCallback(() => {
    if (!enabled || !isVisibleRef.current) return;

    const delay = interval * backoffRef.current;
    
    timeoutRef.current = setTimeout(async () => {
      if (!isVisibleRef.current || !enabled) return;

      try {
        await callbackRef.current();
        // Reset backoff on success
        backoffRef.current = 1;
        scheduleNext();
      } catch (error) {
        // Exponential backoff on error (max 5x interval)
        backoffRef.current = Math.min(backoffRef.current * 2, 5);
        
        if (onError) {
          onError(error);
        }
        
        scheduleNext();
      }
    }, delay);
  }, [enabled, interval]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      // If tab becomes visible and polling is enabled, resume immediately
      if (isVisibleRef.current && enabled) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        callbackRef.current();
        scheduleNext();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, scheduleNext]);

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Initial call
    if (immediate) {
      callbackRef.current().catch((error) => {
        if (onError) onError(error);
      });
    }

    scheduleNext();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, immediate, scheduleNext, onError]);
}

