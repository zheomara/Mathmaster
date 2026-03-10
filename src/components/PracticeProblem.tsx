import React, { useState } from 'react';
import { Loader2, PlayCircle } from 'lucide-react';
import { GeminiMathSolver, PracticeEvaluation } from '../services/GeminiMathSolver';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { GamificationService } from '../services/GamificationService';
import type { SolutionStep } from './MathSolutionPlayer';
import { mathToSpeech } from '../utils/mathToSpeech';

const MathSolutionPlayer = React.lazy(() => import('./MathSolutionPlayer'));

export default function PracticeProblem({ problem }: { problem: string }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<PracticeEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [showPlayer, setShowPlayer] = useState(false);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;
    setIsEvaluating(true);
    const result = await GeminiMathSolver.evaluatePracticeProblem(problem, userAnswer);
    setEvaluation(result);
    if (result.isCorrect) {
      const { newBadges: earnedBadges } = GamificationService.recordProblemSolved();
      setNewBadges(earnedBadges);
    }
    setIsEvaluating(false);
  };

  const parseStepsForPlayer = (steps: string[]): SolutionStep[] => {
    return steps.map((step, index) => {
      const cleanExplanation = mathToSpeech(step);

      return {
        id: `step-${index}`,
        rawText: step,
        spokenText: cleanExplanation || 'Next step.',
      };
    });
  };

  return (
    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-gray-700">
      {showPlayer && evaluation && (
        <React.Suspense fallback={<div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>}>
          <MathSolutionPlayer 
            steps={parseStepsForPlayer(evaluation.steps)} 
            onClose={() => setShowPlayer(false)} 
          />
        </React.Suspense>
      )}

      <div className="overflow-x-auto mb-3">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {problem}
        </ReactMarkdown>
      </div>
      
      {!evaluation && (
        <div className="flex space-x-2 mt-2">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Your answer..."
            className="flex-1 border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button 
            onClick={handleSubmit}
            disabled={!userAnswer.trim() || isEvaluating}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium flex items-center"
          >
            {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check'}
          </button>
        </div>
      )}

      {evaluation && (
        <div className="mt-4 space-y-4">
          <div className={`p-3 rounded-lg border ${evaluation.isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <p className="font-medium">{evaluation.feedback}</p>
          </div>
          
          {newBadges.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-indigo-800 flex items-center space-x-2">
               <span className="text-xl">🎉</span>
              <div>
                <p className="font-bold text-sm">New Badge{newBadges.length > 1 ? 's' : ''} Earned!</p>
                <p className="text-xs">Check your Profile to see what you unlocked.</p>
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Step-by-Step Solution</h4>
              <button 
                onClick={() => setShowPlayer(true)}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Watch Video</span>
              </button>
            </div>
            <div className="space-y-3">
              {evaluation.steps.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="text-gray-700 leading-relaxed overflow-x-auto w-full text-sm">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {step}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => {
              setEvaluation(null);
              setUserAnswer('');
              setNewBadges([]);
            }}
            className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
