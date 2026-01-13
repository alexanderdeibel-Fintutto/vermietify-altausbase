import React from 'react';
import { motion } from 'framer-motion';

export default function QuickStatsGrid({ stats = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="p-4 rounded-lg border border-slate-200 bg-white"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
              )}
            </div>
            {stat.icon && (
              <div className="text-slate-400">
                {stat.icon}
              </div>
            )}
          </div>

          {stat.change && (
            <div className={`text-xs mt-2 ${
              stat.change > 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {stat.change > 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}