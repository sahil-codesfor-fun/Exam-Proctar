import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

// Global in-memory cache and in-flight request tracker
const globalCache = new Map();
const inFlightRequests = new Map();

/**
 * Custom Stale-While-Revalidate hook
 * @param {string|null} key - API endpoint or cache key
 * @param {object} options - Configuration options (staleTime, enabled)
 */
export function useSWR(key, options = {}) {
  const { staleTime = 60000, enabled = true } = options;

  const cachedEntry = key ? globalCache.get(key) : null;
  const isStale = cachedEntry ? (Date.now() - cachedEntry.timestamp > staleTime) : true;

  const [data, setData] = useState(cachedEntry ? cachedEntry.data : null);
  const [loading, setLoading] = useState(cachedEntry ? false : (enabled && Boolean(key)));
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);

  const keyRef = useRef(key);
  keyRef.current = key;

  const fetchData = useCallback(async (force = false) => {
    if (!key || !enabled) return;

    const currentCached = globalCache.get(key);
    const stale = currentCached ? (Date.now() - currentCached.timestamp > staleTime) : true;

    // If fresh and not forced, keep existing data without refetch
    if (!stale && !force && currentCached) {
      setData(currentCached.data);
      setLoading(false);
      return;
    }

    if (currentCached) {
      setIsValidating(true);
    } else {
      setLoading(true);
    }

    // Deduplicate in-flight requests for the same key
    if (!inFlightRequests.has(key)) {
      const requestPromise = api.get(key)
        .then(res => {
          const payload = res.data;
          globalCache.set(key, { data: payload, timestamp: Date.now() });
          return payload;
        })
        .finally(() => {
          inFlightRequests.delete(key);
        });
      inFlightRequests.set(key, requestPromise);
    }

    try {
      const result = await inFlightRequests.get(key);
      if (keyRef.current === key) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (keyRef.current === key) {
        setError(err);
      }
    } finally {
      if (keyRef.current === key) {
        setLoading(false);
        setIsValidating(false);
      }
    }
  }, [key, enabled, staleTime]);

  useEffect(() => {
    if (key && enabled) {
      const entry = globalCache.get(key);
      if (entry) {
        setData(entry.data);
        setLoading(false);
      }
      fetchData(false);
    }
  }, [key, enabled, fetchData]);

  const mutate = useCallback(async (newData, shouldRevalidate = true) => {
    if (!key) return;
    if (newData !== undefined) {
      globalCache.set(key, { data: newData, timestamp: Date.now() });
      setData(newData);
    }
    if (shouldRevalidate) {
      return fetchData(true);
    }
  }, [key, fetchData]);

  return {
    data,
    loading,
    isValidating,
    error,
    mutate,
    revalidate: () => fetchData(true)
  };
}

export const clearSWRCache = (keyPattern) => {
  if (!keyPattern) {
    globalCache.clear();
    return;
  }
  for (const k of globalCache.keys()) {
    if (k.includes(keyPattern)) {
      globalCache.delete(k);
    }
  }
};

export default useSWR;
