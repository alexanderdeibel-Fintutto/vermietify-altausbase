import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ProgressTracker({ totalFeatures = 12, usedFeatures = 3 }) {
  const percentage = (usedFeatures / totalFeatures) * 100;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 border border-blue-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Ihr Fortschritt
        </h3>
        <span className="text-sm font-medium text-blue-600">
          {usedFeatures} / {totalFeatures} Features
        </span>
      </div>

      <Progress value={percentage} className="mb-4" />

      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <span>Noch {totalFeatures - usedFeatures} Features freischalten</span>
      </div>

      {percentage < 50 && (
        <p className="text-xs text-gray-500 mt-3 italic">
          💡 Tipp: Nutzen Sie mehr Features um das volle Potenzial zu entdecken
        </p>
      )}
    </div>
  );
}