import React, { useEffect, useState } from 'react';
import { Trophy, Flame, Target, Award } from 'lucide-react';
import { GamificationService, UserStats, BADGES } from '../services/GamificationService';

export default function ProfileMode() {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    setStats(GamificationService.getStats());
  }, []);

  if (!stats) return null;

  return (
    <div className="flex flex-col items-center p-6 w-full max-w-md mx-auto space-y-6">
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Your Progress</h2>
        <p className="text-sm text-gray-500 mt-1">Keep solving problems to earn more badges!</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex flex-col items-center justify-center">
          <Flame className="w-8 h-8 text-orange-500 mb-2" />
          <span className="text-2xl font-bold text-orange-700">{stats.currentStreak}</span>
          <span className="text-xs font-medium text-orange-600 uppercase tracking-wider">Day Streak</span>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col items-center justify-center">
          <Target className="w-8 h-8 text-emerald-500 mb-2" />
          <span className="text-2xl font-bold text-emerald-700">{stats.problemsSolved}</span>
          <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Problems Solved</span>
        </div>
      </div>

      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Award className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-800">Badges</h3>
        </div>
        
        <div className="space-y-4">
          {Object.values(BADGES).map((badge) => {
            const isEarned = stats.badges.includes(badge.id);
            return (
              <div 
                key={badge.id} 
                className={`flex items-center p-4 rounded-xl border ${
                  isEarned ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100 opacity-60'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mr-4 ${
                  isEarned ? 'bg-white shadow-sm' : 'bg-gray-200 grayscale'
                }`}>
                  {badge.icon}
                </div>
                <div>
                  <h4 className={`font-bold ${isEarned ? 'text-indigo-900' : 'text-gray-500'}`}>
                    {badge.name}
                  </h4>
                  <p className={`text-sm ${isEarned ? 'text-indigo-700' : 'text-gray-400'}`}>
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
