import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ProgressGoal({ goal, completed = false }) {
  const percentage = (goal.progress / goal.target) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            completed 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-blue-100 dark:bg-blue-900/30'
          }`}>
            {completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <Target className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {goal.title}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {goal.description}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-blue-600">
            {Math.round(percentage)}%
          </p>
          {goal.reward && (
            <p className="text-xs text-amber-600 font-medium">
              +{goal.reward} Punkte
            </p>
          )}
        </div>
      </div>

      <Progress value={percentage} className="h-2 mb-2" />

      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {goal.progress} von {goal.target}
        </p>
        {completed && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-xs font-bold text-green-600"
          >
            ✓ Erledigt
          </motion.span>
        )}
      </div>
    </div>
  );
}