import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudOff, RefreshCw, Check } from 'lucide-react';

export default function RealtimeSyncIndicator({ status = 'synced', lastSync = null }) {
  const statusConfig = {
    syncing: { icon: RefreshCw, color: 'text-blue-600', label: 'Synchronisiert...', animate: true },
    synced: { icon: Check, color: 'text-green-600', label: 'Gespeichert', animate: false },
    error: { icon: CloudOff, color: 'text-red-600', label: 'Fehler', animate: false },
    offline: { icon: CloudOff, color: 'text-gray-400', label: 'Offline', animate: false }
  };

  const config = statusConfig[status] || statusConfig.synced;
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
      <motion.div
        animate={config.animate ? { rotate: 360 } : {}}
        transition={config.animate ? { repeat: Infinity, duration: 2, ease: 'linear' } : {}}
      >
        <Icon className={`w-3 h-3 ${config.color}`} />
      </motion.div>
      <span className={config.color}>{config.label}</span>
      {lastSync && status === 'synced' && (
        <span className="text-gray-400">
          · {new Date(lastSync).toLocaleTimeString('de-DE')}
        </span>
      )}
    </div>
  );
}