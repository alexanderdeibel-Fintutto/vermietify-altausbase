import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendLabel,
  onClick 
}) {
  const isPositive = trend >= 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        {Icon && (
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
        
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(trend)}% {trendLabel || 'vs. last month'}
          </div>
        )}
      </div>
    </motion.div>
  );
}