import React, { useState, useRef } from 'react';
import { Camera, Loader2, Calculator, Send, BookOpen, PenTool, PlayCircle } from 'lucide-react';
import { MathSolution, GeminiMathSolver } from '../services/GeminiMathSolver';
import { useMathStream } from '../hooks/useMathStream';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import PracticeProblem from './PracticeProblem';
import MathSolutionPlayer, { SolutionStep } from './MathSolutionPlayer';
import SkeletonSolution from './SkeletonSolution';
import SolutionStepCard from './SolutionStepCard';
import PrerequisiteGate from './PrerequisiteGate';

export default function SolverMode() {
  const [image, setImage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isStreaming, partialSolution: solution, error, startStream } = useMathStream();

  // Prerequisite Gate State
  const [gateStatus, setGateStatus] = useState<'idle' | 'analyzing' | 'gate' | 'teaching' | 'solving'>('idle');
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [microLessons, setMicroLessons] = useState<{concept: string, lesson: string, youtubeVideoId?: string}[]>([]);
  const [currentProblem, setCurrentProblem] = useState<{text: string, base64?: string, mimeType?: string} | null>(null);

  const savePracticeProblems = (problems: string[]) => {
    if (!problems || problems.length === 0) return;
    const existing = JSON.parse(localStorage.getItem('practice_pool') || '[]');
    const updated = Array.from(new Set([...problems, ...existing]));
    localStorage.setItem('practice_pool', JSON.stringify(updated));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setImage(imageUrl);
    setTextInput(''); 
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const mimeType = file.type;
      const base64Data = base64String.split(',')[1];
      
      await processImage(base64Data, mimeType);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64Data: string, mimeType: string) => {
    const text = "Solve the math problem shown in the image.";
    setCurrentProblem({ text, base64: base64Data, mimeType });
    setGateStatus('analyzing');
    setMicroLessons([]);
    
    const prereqs = await GeminiMathSolver.analyzePrerequisites(text, base64Data, mimeType);
    if (prereqs.length > 0) {
      setPrerequisites(prereqs);
      setGateStatus('gate');
    } else {
      startSolving(text, base64Data, mimeType);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setImage(null);
    setCurrentProblem({ text: textInput });
    setGateStatus('analyzing');
    setMicroLessons([]);
    
    const prereqs = await GeminiMathSolver.analyzePrerequisites(textInput);
    if (prereqs.length > 0) {
      setPrerequisites(prereqs);
      setGateStatus('gate');
    } else {
      startSolving(textInput);
    }
  };

  const handleGateComplete = async (needsTeaching: string[]) => {
    if (needsTeaching.length > 0) {
      setGateStatus('teaching');
      const lessons = await Promise.all(
        needsTeaching.map(async (concept) => {
          const { lesson, youtubeVideoId } = await GeminiMathSolver.generateMicroLesson(concept, currentProblem!.text);
          return { concept, lesson, youtubeVideoId };
        })
      );
      setMicroLessons(lessons);
    } else {
      setMicroLessons([]);
    }
    startSolving(currentProblem!.text, currentProblem!.base64, currentProblem!.mimeType);
  };

  const startSolving = async (text: string, base64?: string, mimeType?: string) => {
    setGateStatus('solving');
    const result = await startStream(text, base64, mimeType);
    if (result && result.practiceProblems) {
      savePracticeProblems(result.practiceProblems);
    }
    setGateStatus('idle');
  };

  const parseStepsForPlayer = (steps: string[]): SolutionStep[] => {
    return steps.map((step, index) => {
      // For TTS, we strip markdown formatting but keep the text exactly as it is
      const cleanExplanation = step
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '')
        .replace(/\$\$/g, '') // Remove block math delimiters for speech
        .replace(/\$/g, '');  // Remove inline math delimiters for speech

      return {
        id: `step-${index}`,
        rawText: step,
        spokenText: cleanExplanation || 'Next step.',
      };
    });
  };

  return (
    <div className="flex flex-col items-center p-6 w-full max-w-md mx-auto">
      {showPlayer && solution && solution.steps && (
        <MathSolutionPlayer 
          steps={parseStepsForPlayer(solution.steps)} 
          onClose={() => setShowPlayer(false)} 
        />
      )}

      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Universal Math Solver</h2>
          <p className="text-sm text-gray-500 mt-1">Take a photo or type any math problem</p>
        </div>

        <div 
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors mb-4"
          onClick={() => fileInputRef.current?.click()}
        >
          {image ? (
            <img src={image} alt="Equation" className="max-h-32 object-contain rounded-lg" />
          ) : (
            <>
              <div className="bg-indigo-50 p-3 rounded-full mb-3">
                <Camera className="w-6 h-6 text-indigo-500" />
              </div>
              <span className="font-medium text-gray-700 text-sm">Tap to Scan Equation</span>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            capture="environment"
            className="hidden" 
          />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type a problem (e.g. integral of x^2)"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
          />
          <button 
            onClick={handleTextSubmit}
            disabled={!textInput.trim() || isStreaming}
            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="w-full bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-6 text-sm text-center">
          {error}
        </div>
      )}

      {gateStatus === 'analyzing' && (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-gray-600 font-medium">Analyzing prerequisites...</p>
        </div>
      )}

      {gateStatus === 'gate' && (
        <PrerequisiteGate prerequisites={prerequisites} onComplete={handleGateComplete} />
      )}

      {gateStatus === 'teaching' && (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-gray-600 font-medium">Preparing micro-lessons...</p>
        </div>
      )}

      {isStreaming && !solution && gateStatus === 'solving' && (
        <SkeletonSolution />
      )}

      {/* Render Micro Lessons above the main solution if they exist */}
      {microLessons.length > 0 && (solution || isStreaming) && (
        <div className="w-full space-y-4 mb-6">
          {microLessons.map((ml, idx) => (
            <motion.div key={idx} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2"/> 
                Micro-Lesson: {ml.concept}
              </h3>
              <div className="text-blue-800 text-sm leading-relaxed space-y-4">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {ml.lesson}
                </ReactMarkdown>
                
                {ml.youtubeVideoId && (
                  <div className="mt-4 rounded-xl overflow-hidden shadow-sm border border-blue-200 aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${ml.youtubeVideoId}`}
                      title={`YouTube video for ${ml.concept}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {solution && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {solution.assumedKnowledge && solution.assumedKnowledge.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-amber-900">Assumed Knowledge</h3>
              </div>
              <div className="p-6 space-y-3 bg-white">
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {solution.assumedKnowledge.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {item}
                      </ReactMarkdown>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {(solution.steps && solution.steps.length > 0) && (
            <>
              <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-indigo-900">Step-by-Step Solution</h3>
                </div>
                {!isStreaming && (
                  <button 
                    onClick={() => setShowPlayer(true)}
                    className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Watch Video</span>
                  </button>
                )}
              </div>
              
              <div className="p-6 space-y-4">
                {solution.steps.map((step, idx) => (
                  <SolutionStepCard key={idx} step={step} index={idx} />
                ))}
                
                {/* Thinking animation while streaming */}
                {isStreaming && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-100"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                    </div>
                    <div className="text-gray-500 leading-relaxed italic flex items-center space-x-2">
                      <span>Thinking</span>
                      <span className="flex space-x-1">
                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}>.</motion.span>
                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}>.</motion.span>
                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}>.</motion.span>
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </>
          )}

          {solution.practiceProblems && solution.practiceProblems.length > 0 && (
            <div className="border-t border-gray-100">
              <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center space-x-2">
                <PenTool className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-emerald-900">Practice Problems</h3>
              </div>
              <div className="p-6 space-y-3 bg-white">
                <p className="text-sm text-gray-500 mb-4">Try solving these similar problems to test your understanding:</p>
                <div className="space-y-4">
                  {solution.practiceProblems.map((problem, idx) => (
                    <PracticeProblem key={idx} problem={problem} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
