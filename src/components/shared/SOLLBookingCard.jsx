import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function SOLLBookingCard({ booking, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-dashed border-2 border-slate-300 bg-slate-50">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white">
              📋 SOLL (Geplant)
            </Badge>
            <span className="text-xs text-slate-600">Automatisch generiert</span>
          </div>
          {children}
        </div>
      </Card>
    </motion.div>
  );
}