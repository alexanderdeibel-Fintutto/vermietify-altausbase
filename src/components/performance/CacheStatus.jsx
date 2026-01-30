import React from 'react';
import { Database, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function CacheStatus({ isCached = false, age = null }) {
  if (!isCached) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1"
    >
      <Badge variant="secondary" className="gap-1">
        <Zap className="w-3 h-3 text-green-600" />
        <span className="text-xs">Gecacht</span>
      </Badge>
      {age && (
        <span className="text-xs text-gray-500">
          (vor {age})
        </span>
      )}
    </motion.div>
  );
}