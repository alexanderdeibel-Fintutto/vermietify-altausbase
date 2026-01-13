import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressIndicatorBar({ 
  progress = 0,
  steps = [],
  currentStep = 0,
  showLabel = true
}) {
  const percentage = Math.max(0, Math.min(100, progress));

  return (
    <div className="space-y-2">
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
        />
      </div>
      
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-600">
            {steps[currentStep]?.label || 'Fortschritt'}
          </span>
          <span className="text-xs font-medium text-slate-700">
            {percentage}%
          </span>
        </div>
      )}

      {steps.length > 0 && (
        <div className="flex gap-2 mt-3">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1 rounded-full transition-colors ${
                idx <= currentStep ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}