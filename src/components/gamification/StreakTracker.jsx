import React from 'react';
import { Flame, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function StreakTracker({ currentStreak = 0, longestStreak = 0, lastAction }) {
  const daysAgo = lastAction
    ? Math.floor((new Date() - new Date(lastAction)) / (1000 * 60 * 60 * 24))
    : null;

  const streakActive = daysAgo !== null && daysAgo <= 1;

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className={`w-5 h-5 ${streakActive ? 'text-orange-600 animate-pulse' : 'text-gray-400'}`} />
          Streak Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="