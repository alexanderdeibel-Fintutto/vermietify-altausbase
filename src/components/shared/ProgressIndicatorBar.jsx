import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

export default function ProgressIndicatorBar({ 
  steps = [], 
  currentStep = 0 
}) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Line Background */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200 -z-10" 
             style={{ margin: '0 2.5rem' }} 
        />
        
        {/* Active Progress Line */}
        <motion.div
          className="absolute top-5 left-0 h-1 bg-blue-600 -z-10"
          initial={{ width: 0 }}
          animate={{ 
            width: `${((currentStep) / (steps.length - 1)) * 100}%`,
            marginLeft: '2.5rem',
            marginRight: '2.5rem'
          }}
          transition={{ duration: 0.3 }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted || isCurrent ? '#2563eb' : '#e2e8f0'
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2 relative z-10 border-2 border-white shadow-sm"
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <span className={`text-sm font-semibold ${
                    isCurrent ? 'text-white' : 'text-slate-600'
                  }`}>
                    {index + 1}
                  </span>
                )}
              </motion.div>
              
              <p className={`text-xs font-medium text-center max-w-[120px] ${
                isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-700' : 'text-slate-500'
              }`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}