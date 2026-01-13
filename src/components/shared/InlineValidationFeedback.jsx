import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InlineValidationFeedback({ 
  status = 'idle',
  message = '',
  autoHide = true,
  duration = 3000
}) {
  const [visible, setVisible] = React.useState(!!message);

  React.useEffect(() => {
    if (message && autoHide) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [message, autoHide, duration]);

  if (!visible || !message) return null;

  const config = {
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-600 bg-red-50 border-red-200',
    },
    info: {
      icon: Info,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
  };

  const cfg = config[status] || config.info;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${cfg.color}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </motion.div>
  );
}