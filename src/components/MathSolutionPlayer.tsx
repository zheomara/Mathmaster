import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, X, Volume2, VolumeX } from 'lucide-react';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export interface SolutionStep {
  id: string;
  rawText: string;
  spokenText: string;
}

interface MathSolutionPlayerProps {
  steps: SolutionStep[];
  onClose: () => void;
}

export default function MathSolutionPlayer({ steps, onClose }: MathSolutionPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync Web Speech API with Animation State
  useEffect(() => {
    if (!isPlaying) {
      window.speechSynthesis.cancel();
      return;
    }

    if (currentIndex >= steps.length) {
      setIsPlaying(false);
      return;
    }

    const step = steps[currentIndex];
    const utterance = new SpeechSynthesisUtterance(step.spokenText);
    utterance.rate = 0.9; // Slightly slower for math explanations
    if (isMuted) utterance.volume = 0;

    // Synchronize: When audio finishes, move to next step
    utterance.onend = () => {
      if (isPlaying) {
        setCurrentIndex(prev => prev + 1);
      }
    };

    utterance.onerror = (e) => {
      console.error("Speech error", e);
      setIsPlaying(false);
    };

    window.speechSynthesis.cancel(); // Clear queue before speaking
    window.speechSynthesis.speak(utterance);

    // Auto-scroll to current step
    const stepEl = document.getElementById(`step-${currentIndex}`);
    if (stepEl && scrollRef.current) {
      stepEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentIndex, isPlaying, steps, isMuted]);

  const progressPercentage = steps.length > 0 ? (currentIndex / steps.length) * 100 : 0;

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newIndex = Math.floor(percentage * steps.length);
    setCurrentIndex(Math.max(0, Math.min(newIndex, steps.length - 1)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        <h2 className="text-lg font-semibold">Solution Walkthrough</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 pb-40 scroll-smooth" ref={scrollRef}>
        <div className="max-w-2xl mx-auto space-y-12 mt-10">
          {steps.map((step, index) => {
            const isCurrent = index === currentIndex;
            const isPast = index < currentIndex;
            const isFuture = index > currentIndex;

            return (
              <motion.div
                key={step.id}
                id={`step-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: isFuture ? 0 : (isCurrent ? 1 : 0.4),
                  y: isFuture ? 20 : 0,
                  scale: isCurrent ? 1.02 : 1
                }}
                transition={{ duration: 0.5 }}
                className={`p-6 rounded-2xl border transition-colors duration-500 ${
                  isCurrent ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.15)]' : 'border-white/5 bg-white/5'
                }`}
              >
                <div className={`text-xl leading-relaxed overflow-x-auto transition-colors duration-500 ${isCurrent ? 'text-indigo-50' : 'text-gray-400'}`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {step.rawText}
                  </ReactMarkdown>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Player Controls (Bottom Overlay) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent p-6 pt-20">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div 
            className="h-2 bg-white/20 rounded-full mb-8 cursor-pointer relative overflow-hidden group"
            onClick={handleScrub}
          >
            <motion.div 
              className="absolute top-0 left-0 bottom-0 bg-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
            {/* Hover indicator for scrubbing */}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8">
            <button 
              onClick={() => {
                setCurrentIndex(0);
                setIsPlaying(true);
              }}
              className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <RotateCcw className="w-6 h-6" />
            </button>

            <button 
              onClick={() => {
                if (currentIndex >= steps.length) {
                  setCurrentIndex(0);
                  setIsPlaying(true);
                } else {
                  setIsPlaying(!isPlaying);
                }
              }}
              className="p-5 bg-white text-black hover:bg-gray-200 rounded-full transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>

            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
