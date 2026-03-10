/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import PracticeMode from './components/PracticeMode';
import SolverMode from './components/SolverMode';
import ProfileMode from './components/ProfileMode';
import LicenseGate from './components/LicenseGate';
import { BrainCircuit, Camera, User, Flame } from 'lucide-react';
import { GamificationService } from './services/GamificationService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'practice' | 'solver' | 'profile'>('practice');
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    GamificationService.recordActivity();
    setStreak(GamificationService.getStats().currentStreak);
  }, [activeTab]);

  return (
    <LicenseGate>
      <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center space-x-2">
              <span className="bg-indigo-600 text-white p-1.5 rounded-lg">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <span>MathMaster</span>
            </h1>
            <div className="flex items-center space-x-1 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-700">{streak}</span>
            </div>
          </div>
        </header>

        <main>
          {activeTab === 'practice' && <PracticeMode />}
          {activeTab === 'solver' && <SolverMode />}
          {activeTab === 'profile' && <ProfileMode />}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
          <div className="max-w-md mx-auto flex">
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex-1 py-4 flex flex-col items-center space-y-1 transition-colors ${
                activeTab === 'practice' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <BrainCircuit className="w-6 h-6" />
              <span className="text-xs font-medium">Practice</span>
            </button>
            <button
              onClick={() => setActiveTab('solver')}
              className={`flex-1 py-4 flex flex-col items-center space-y-1 transition-colors ${
                activeTab === 'solver' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Camera className="w-6 h-6" />
              <span className="text-xs font-medium">Solver</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-4 flex flex-col items-center space-y-1 transition-colors ${
                activeTab === 'profile' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </LicenseGate>
  );
}

