import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProgressIndicator({ 
  steps = [], 
  currentStep = 0 
}) {
  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-start gap-4"
          >
            <div className="flex-shrink-0 mt-1">
              {isCompleted ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : isCurrent ? (
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity }}>
                  <Circle className="w-6 h-6 text-blue-600" />
                </motion.div>
              ) : (
                <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-medium ${
                isCurrent 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : isCompleted 
                  ? 'text-green-600' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {step.label}
              </h4>
              {step.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}