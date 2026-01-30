import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProgressSteps({ steps = [], currentStep = 0 }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                idx < currentStep
                  ? 'bg-green-600 text-white'
                  : idx === currentStep
                  ? 'bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-800'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {idx < currentStep ? <Check className="w-5 h-5" /> : idx + 1}
            </motion.div>
            <p className={`text-xs mt-2 font-medium ${
              idx === currentStep
                ? 'text-blue-600'
                : idx < currentStep
                ? 'text-green-600'
                : 'text-gray-500'
            }`}>
              {step.label}
            </p>
          </div>
          
          {idx < steps.length - 1 && (
            <div className="flex-1 h-1 mx-2 rounded-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: idx < currentStep ? '100%' : '0%' }}
                transition={{ duration: 0.3 }}
                className="h-full bg-green-600"
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}