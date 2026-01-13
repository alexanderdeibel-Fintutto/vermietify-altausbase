import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function ISTBookingCard({ transaction, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-solid border-2 border-emerald-500 bg-emerald-50">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 hover:bg-emerald-700">
              ✓ IST (Tatsächlich)
            </Badge>
            <span className="text-xs text-emerald-700">Aus Banktransaktionen</span>
          </div>
          {children}
        </div>
      </Card>
    </motion.div>
  );
}