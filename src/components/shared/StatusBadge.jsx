import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Pause } from 'lucide-react';

export default function StatusBadge({ status = 'pending', label }) {
  const statusConfig = {
    success: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-800', text: 'Erfolg' },
    pending: { icon: Clock, color: 'bg-blue-100 text-blue-800', text: 'Ausstehend' },
    error: { icon: AlertCircle, color: 'bg-red-100 text-red-800', text: 'Fehler' },
    warning: { icon: AlertCircle, color: 'bg-amber-100 text-amber-800', text: 'Warnung' },
    paused: { icon: Pause, color: 'bg-slate-100 text-slate-800', text: 'Pausiert' },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label || config.text}</span>
    </div>
  );
}