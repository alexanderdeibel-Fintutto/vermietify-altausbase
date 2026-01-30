import React from 'react';
import { Info, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const TYPES = {
  info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200' },
  warning: { icon: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-800 dark:text-amber-200' },
  success: { icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-200' },
  error: { icon: XCircle, bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-200' }
};

export default function InfoBox({ type = 'info', title, message }) {
  const config = TYPES[type];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4 flex gap-3`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.text}`} />
      <div className={config.text}>
        {title && <h4 className="font-semibold text-sm">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}