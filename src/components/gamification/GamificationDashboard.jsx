import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star, Target, Zap } from 'lucide-react';
import BadgeDisplay from './BadgeDisplay';
import ProgressGoal from './ProgressGoal';
import StreakTracker from './StreakTracker';
import Leaderboard from './Leaderboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function GamificationDashboard({ userId, userName = 'Sie' }) {
  const [userStats, setUserStats] = useState({
    points: 1250,
    level: 7,
    badges: [
      { id: 1, type: 'beginner', description: 'Erstes Gebäude erstellt' },
      { id: 2, type: 'speedster', description: '10 Abrechnungen in einem Tag' },
      { id: 3, type: 'accuracy', description: '100% fehlerfreie Dateneingabe' }
    ],
    currentStreak: 5,
    longestStreak: 12,
    lastAction: new Date().toISOString()
  });

  const goals = [
    {
      id: 1,
      title: 'Erste Abrechnung',
      description: 'Erstellen Sie Ihre erste Betriebskostenabrechnung',
      progress: 1,
      target: 1,
      reward: 100
    },
    {
      id: 2,
      title: 'Vollständiges Gebäude',
      description: 'Füllen Sie alle Gebäudedaten aus',
      progress: 7,
      target: 10,
      reward: 150
    },
    {
      id: 3,
      title: 'Dokumenten-Meister',
      description: 'Laden Sie 50 Dokumente hoch',
      progress: 23,
      target: 50,
      reward: 200
    }
  ];

  const leaderboardData = [
    { id: '1', name: 'Max Mustermann', points: 2340, badgeCount: 12 },
    { id: '2', name: 'Anna Schmidt', points: 1890, badgeCount: 10 },
    { id: userId, name: userName, points: userStats.points, badgeCount: userStats.badges.length },
    { id: '4', name: 'Peter Müller', points: 1120, badgeCount: 8 },
    { id: '5', name: 'Lisa Wagner', points: 980, badgeCount: 6 }
  ].sort((a, b) => b.points - a.points);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Overview Stats */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Ihre Erfolge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <Star className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{userStats.points}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Punkte</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
              <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">Level {userStats.level}</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Erreicht</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg">
              <Trophy className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{userStats.badges.length}</div>
              <div className="text-sm text-amber-700 dark:text-amber-300">Abzeichen</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
              <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{userStats.currentStreak}</div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Tage Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Ihre Abzeichen</CardTitle>
        </CardHeader>
        <CardContent>
          <BadgeDisplay badges={userStats.badges} interactive />
        </CardContent>
      </Card>

      {/* Streak */}
      <Card>
        <CardContent className="p-0">
          <StreakTracker
            currentStreak={userStats.currentStreak}
            longestStreak={userStats.longestStreak}
            lastAction={userStats.lastAction}
          />
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardContent className="p-0">
          <Leaderboard
            data={leaderboardData}
            currentUserId={userId}
            timeframe="Woche"
          />
        </CardContent>
      </Card>

      {/* Goals */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Ihre Ziele</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map(goal => (
              <ProgressGoal
                key={goal.id}
                goal={goal}
                completed={goal.progress >= goal.target}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}