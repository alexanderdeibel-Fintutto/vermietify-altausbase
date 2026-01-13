import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastNotificationCenter() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random();
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Export via window for global access
  React.useEffect(() => {
    window.showToast = addToast;
  }, [addToast]);

  const config = {
    success: { icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    error: { icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm space-y-2">
      <AnimatePresence>
        {toasts.map(toast => {
          const { icon: Icon, bg, border, text } = config[toast.type] || config.info;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`flex items-start gap-3 p-3 rounded-lg border ${bg} ${border} shadow-lg`}
            >
              <Icon className={`w-5 h-5 ${text} flex-shrink-0 mt-0.5`} />
              <p className={`flex-1 text-sm ${text} font-medium`}>{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}