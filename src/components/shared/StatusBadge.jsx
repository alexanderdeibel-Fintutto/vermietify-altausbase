import React from 'react';
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  active: { icon: CheckCircle2, bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200' },
  pending: { icon: Clock, bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200' },
  warning: { icon: AlertCircle, bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200' },
  inactive: { icon: XCircle, bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-200' }
};

export default function StatusBadge({ status, label }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.text} text-sm font-medium`}>
      <Icon className="w-3 h-3" />
      {label || status}
    </div>
  );
}