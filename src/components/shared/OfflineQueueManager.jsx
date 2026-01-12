import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const QUEUE_KEY = 'offline_queue';

/**
 * Offline Queue Manager for critical actions
 * Stores failed operations locally and retries when online
 */
class OfflineQueue {
  constructor() {
    this.queue = this.loadQueue();
    this.processing = false;
  }

  loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }

  add(action) {
    this.queue.push({
      id: Date.now() + Math.random(),
      action,
      timestamp: new Date().toISOString(),
      retries: 0
    });
    this.saveQueue();
    console.log('[OfflineQueue] Added action:', action.type);
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    console.log(`[OfflineQueue] Processing ${this.queue.length} queued actions...`);

    const itemsToProcess = [...this.queue];
    
    for (const item of itemsToProcess) {
      try {
        await this.executeAction(item.action);
        
        // Remove from queue on success
        this.queue = this.queue.filter(q => q.id !== item.id);
        this.saveQueue();
        
        console.log('[OfflineQueue] Success:', item.action.type);
        toast.success(`Offline-Aktion ausgeführt: ${item.action.type}`);
        
      } catch (error) {
        console.error('[OfflineQueue] Failed:', item.action.type, error);
        
        // Increment retry counter
        const queueItem = this.queue.find(q => q.id === item.id);
        if (queueItem) {
          queueItem.retries++;
          
          // Remove after 3 failed retries
          if (queueItem.retries >= 3) {
            this.queue = this.queue.filter(q => q.id !== item.id);
            toast.error(`Offline-Aktion fehlgeschlagen: ${item.action.type}`);
          }
          
          this.saveQueue();
        }
      }
    }

    this.processing = false;
  }

  async executeAction(action) {
    // Dynamically import base44 to avoid circular dependencies
    const { base44 } = await import('@/api/base44Client');
    
    switch (action.type) {
      case 'create_planned_booking':
        return base44.entities.PlannedBooking.create(action.data);
        
      case 'update_planned_booking':
        return base44.entities.PlannedBooking.update(action.id, action.data);
        
      case 'create_actual_payment':
        return base44.entities.ActualPayment.create(action.data);
        
      case 'create_invoice':
        return base44.entities.Invoice.create(action.data);
        
      case 'update_contract':
        return base44.entities.LeaseContract.update(action.id, action.data);
        
      default:
        throw new Error('Unknown action type: ' + action.type);
    }
  }

  getQueueSize() {
    return this.queue.length;
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
}

const queueInstance = new OfflineQueue();

/**
 * React Hook for offline queue
 */
export function useOfflineQueue() {
  const [queueSize, setQueueSize] = useState(queueInstance.getQueueSize());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[OfflineQueue] Back online, processing queue...');
      queueInstance.processQueue().then(() => {
        setQueueSize(queueInstance.getQueueSize());
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Offline-Modus: Aktionen werden in Warteschlange gespeichert');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Try processing queue on mount if online
    if (navigator.onLine && queueInstance.getQueueSize() > 0) {
      queueInstance.processQueue().then(() => {
        setQueueSize(queueInstance.getQueueSize());
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToQueue = (action) => {
    queueInstance.add(action);
    setQueueSize(queueInstance.getQueueSize());
  };

  const processQueue = async () => {
    await queueInstance.processQueue();
    setQueueSize(queueInstance.getQueueSize());
  };

  return {
    isOnline,
    queueSize,
    addToQueue,
    processQueue
  };
}

/**
 * HOC for wrapping mutations with offline queue support
 */
export function withOfflineQueue(mutationFn, actionType) {
  return async (data) => {
    try {
      return await mutationFn(data);
    } catch (error) {
      if (!navigator.onLine) {
        queueInstance.add({
          type: actionType,
          data,
          id: data.id
        });
        toast.info('Offline: Aktion in Warteschlange gespeichert');
        return null;
      }
      throw error;
    }
  };
}