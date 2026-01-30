import React from 'react';
import { motion } from 'framer-motion';

export default function TabNavigation({ 
  tabs = [], 
  activeTab, 
  onChange 
}) {
  return (
    <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
            </div>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}