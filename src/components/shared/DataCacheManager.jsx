import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const DB_NAME = 'FinXCache';
const DB_VERSION = 1;
const STORE_NAME = 'queryCache';

class CacheDB {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }

  async set(key, value) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ 
        key, 
        value, 
        timestamp: Date.now() 
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(key) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if cache is still valid (24h)
          const age = Date.now() - result.timestamp;
          if (age < 24 * 60 * 60 * 1000) {
            resolve(result.value);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clear() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const cacheDB = new CacheDB();

export function useCachedQuery(queryKey, queryFn, options = {}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        // Try to load from IndexedDB cache first
        const cacheKey = JSON.stringify(queryKey);
        const cachedData = await cacheDB.get(cacheKey);
        
        if (cachedData && mounted) {
          setData(cachedData);
          setIsLoading(false);
        }

        // Fetch fresh data
        const freshData = await queryFn();
        
        if (mounted) {
          setData(freshData);
          setIsLoading(false);
          
          // Update cache
          await cacheDB.set(cacheKey, freshData);
        }
      } catch (error) {
        console.error('Cache error:', error);
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [JSON.stringify(queryKey)]);

  return { data, isLoading };
}

export function DataCacheManager() {
  const queryClient = useQueryClient();

  const clearCache = async () => {
    await cacheDB.clear();
    queryClient.clear();
    console.log('Cache cleared');
  };

  return {
    clearCache,
    cacheDB
  };
}

export default DataCacheManager;