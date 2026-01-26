import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ValidationAlert({ type = 'info', message, details = [] }) {
  const config = {
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      iconColor: 'text-red-600'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      iconColor: 'text-yellow-600'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      iconColor: 'text-green-600'
    },
    info: {
      icon: AlertCircle,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600'
    }
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

  return (
    <div className={`flex items-start gap-3 p-4 ${bgColor} border ${borderColor} rounded-lg`}>
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        {details.length > 0 && (
          <ul className={`text-xs ${textColor} mt-2 space-y-1 ml-4 list-disc`}>
            {details.map((detail, idx) => (
              <li key={idx}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}