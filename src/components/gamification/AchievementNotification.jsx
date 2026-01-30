import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Trophy, Zap, Star } from 'lucide-react';

const ICON_MAP = {
  milestone: Trophy,
  badge: Award,
  streak: Zap,
  rating: Star
};

export default function AchievementNotification({ achievements = [] }) {
  return (
    <div className="fixed bottom-24 md:bottom-8 right-8 z-40 space-y-3 pointer-events-none">
      <AnimatePresence>
        {achievements.map((achievement, idx) => {
          const Icon = ICON_MAP[achievement.type] || Award;
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 100, x: 50 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 100, x: 50 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg shadow-xl p-4 max-w-xs"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-sm">🎉 {achievement.title}</p>
                  <p className="text-xs opacity-90">{achievement.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function useAchievement() {
  const [achievements, setAchievements] = React.useState([]);

  const notify = (achievement) => {
    const id = Math.random();
    setAchievements(prev => [...prev, { ...achievement, id }]);
    setTimeout(() => {
      setAchievements(prev => prev.filter(a => a.id !== id));
    }, 4000);
  };

  return { achievements, notify };
}