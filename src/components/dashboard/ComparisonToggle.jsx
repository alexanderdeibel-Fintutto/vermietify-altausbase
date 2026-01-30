import React from 'react';
import { Switch } from '@/components/ui/switch';
import { GitCompare } from 'lucide-react';

export default function ComparisonToggle({ enabled, onChange }) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
      <GitCompare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Vergleich zum Vorjahr
      </span>
      <Switch checked={enabled} onCheckedChange={onChange} />
    </div>
  );
}