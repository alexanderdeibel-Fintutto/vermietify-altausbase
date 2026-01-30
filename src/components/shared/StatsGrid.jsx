import React from 'react';
import { motion } from 'framer-motion';
import TrendIndicator from '../charts/TrendIndicator';

export default function StatsGrid({ stats = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover-lift"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.iconBg || 'bg-blue-50 dark:bg-blue-900/30'}`}>
                <Icon className={`w-6 h-6 ${stat.iconColor || 'text-blue-600'}`} />
              </div>
              {stat.previousValue !== undefined && (
                <TrendIndicator
                  value={stat.value}
                  previousValue={stat.previousValue}
                  compact
                />
              )}
            </div>

            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {stat.format === 'currency' ? `€${stat.value.toLocaleString()}` : stat.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
            </div>

            {stat.subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                {stat.subtitle}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}