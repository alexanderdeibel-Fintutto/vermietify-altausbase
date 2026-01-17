import React, { createContext, useContext, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

export function VfToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now();
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="vf-toast-container">
        {toasts.map(toast => (
          <VfToast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within VfToastProvider');
  return context;
}

function VfToast({ variant = 'info', title, description, action, onClose }) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const Icon = icons[variant];

  return (
    <div className={cn("vf-toast", `vf-toast-${variant}`)}>
      {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="font-semibold">{title}</div>
        {description && (
          <div className="text-sm opacity-90 mt-1">{description}</div>
        )}
        {action && (
          <button 
            onClick={action.onClick}
            className="text-sm font-medium underline mt-2"
          >
            {action.label}
          </button>
        )}
      </div>
      <button onClick={onClose} className="flex-shrink-0 opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}