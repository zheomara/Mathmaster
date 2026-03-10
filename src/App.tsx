/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Calculator, Camera, User, Flame, Loader2 } from 'lucide-react';
import { GamificationService } from './services/GamificationService';
import LicenseGate from './components/LicenseGate';

const PracticeMode = lazy(() => import('./components/PracticeMode'));
const SolverMode = lazy(() => import('./components/SolverMode'));
const ProfileMode = lazy(() => import('./components/ProfileMode'));

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
                <Calculator className="w-5 h-5" />
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
          <Suspense fallback={
            <div className="flex items-center justify-center h-64 text-indigo-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          }>
            {activeTab === 'practice' && <PracticeMode />}
            {activeTab === 'solver' && <SolverMode />}
            {activeTab === 'profile' && <ProfileMode />}
          </Suspense>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
          <div className="max-w-md mx-auto flex">
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex-1 py-4 flex flex-col items-center space-y-1 transition-colors ${
                activeTab === 'practice' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Calculator className="w-6 h-6" />
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

