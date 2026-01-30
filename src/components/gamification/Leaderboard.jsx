import React from 'react';
import { Medal, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';

export default function Leaderboard({ data = [], currentUserId, timeframe = 'week' }) {
  const getMedalColor = (position) => {
    switch(position) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-orange-600';
      default: return 'text-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Bestenliste ({timeframe})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((entry, idx) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                entry.id === currentUserId
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  {idx < 3 ? (
                    <Medal className={`w-5 h-5 ${getMedalColor(idx + 1)}`} />
                  ) : (
                    <span className="text-sm font-semibold text-gray-500">#{idx + 1}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {entry.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {entry.badgeCount} Abzeichen
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-blue-600">
                  {entry.points}
                </p>
                <p className="text-xs text-gray-500">Punkte</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}