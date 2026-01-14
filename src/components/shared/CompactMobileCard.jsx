import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CompactMobileCard({ 
  title,
  subtitle,
  amount,
  status,
  icon: Icon,
  badges = [],
  onClick 
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-medium text-slate-900 truncate text-sm">
                  {title}
                </h3>
                {amount && (
                  <span className="font-semibold text-slate-900 text-sm whitespace-nowrap">
                    €{amount.toFixed(2)}
                  </span>
                )}
              </div>

              {subtitle && (
                <p className="text-xs text-slate-600 truncate mb-2">
                  {subtitle}
                </p>
              )}

              {badges.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {badges.map((badge, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="text-xs"
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}