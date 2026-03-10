import React, { useState, useEffect } from 'react';
import PracticeProblem from './PracticeProblem';
import { Calculator } from 'lucide-react';

export default function PracticeMode() {
  const [problems, setProblems] = useState<string[]>([]);

  useEffect(() => {
    try {
      const pool = JSON.parse(localStorage.getItem('practice_pool') || '[]');
      // Take the most recent 10 problems
      setProblems(pool.slice(0, 10));
    } catch (e) {
      console.error('Failed to load practice pool:', e);
      setProblems([]);
    }
  }, []);

  return (
    <div className="flex flex-col items-center p-6 w-full max-w-md mx-auto">
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 text-center">
        <h2 className="text-xl font-bold text-gray-800">Personalized Practice</h2>
        <p className="text-sm text-gray-500 mt-1">
          These problems are based on questions you previously asked the solver.
        </p>
      </div>

      {problems.length === 0 ? (
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-center w-full">
          <Calculator className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-indigo-900 mb-2">No Practice Problems Yet</h3>
          <p className="text-indigo-700 text-sm">
            Head over to the Solver tab and ask a math question. The app will automatically generate personalized practice problems for you here!
          </p>
        </div>
      ) : (
        <div className="w-full space-y-6">
          {problems.map((problem, idx) => (
            <PracticeProblem key={idx} problem={problem} />
          ))}
        </div>
      )}
    </div>
  );
}

