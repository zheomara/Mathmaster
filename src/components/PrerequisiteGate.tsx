import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, HelpCircle, BookOpen, ArrowRight } from 'lucide-react';
import { KnowledgeService } from '../services/KnowledgeService';

interface PrerequisiteGateProps {
  prerequisites: string[];
  onComplete: (needsTeaching: string[]) => void;
}

export default function PrerequisiteGate({ prerequisites, onComplete }: PrerequisiteGateProps) {
  const [selections, setSelections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const known = KnowledgeService.getKnownConcepts();
    const initialSelections: Record<string, boolean> = {};
    prerequisites.forEach(p => {
      if (known.includes(p)) {
        initialSelections[p] = true;
      }
    });
    setSelections(initialSelections);
  }, [prerequisites]);

  const handleSelect = (concept: string, knowsIt: boolean) => {
    setSelections(prev => ({ ...prev, [concept]: knowsIt }));
    if (knowsIt) {
      KnowledgeService.markAsKnown(concept);
    } else {
      KnowledgeService.markAsUnknown(concept);
    }
  };

  const uniquePrerequisites = Array.from(new Set(prerequisites));
  const allSelected = uniquePrerequisites.every(p => selections[p] !== undefined);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden mb-6"
    >
      <div className="bg-indigo-600 p-4 text-white flex items-center space-x-2">
        <BookOpen className="w-5 h-5" />
        <h3 className="font-bold">Knowledge Check</h3>
      </div>
      <div className="p-6">
        <p className="text-gray-600 mb-6 font-medium">Do you have the prerequisites to understand this solution?</p>
        
        <div className="space-y-4 mb-6">
          {uniquePrerequisites.map((concept) => (
            <div key={concept} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4">
              <span className="font-medium text-gray-800">{concept}</span>
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-row sm:gap-2">
                <button
                  type="button"
                  onClick={() => handleSelect(concept, true)}
                  className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selections[concept] === true 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">I know this</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect(concept, false)}
                  className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selections[concept] === false 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Teach me</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          disabled={!allSelected}
          onClick={() => onComplete(uniquePrerequisites.filter(p => selections[p] === false))}
          className={`w-full flex items-center justify-center space-x-2 p-3 rounded-xl font-medium transition-colors ${
            allSelected 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>
            {!allSelected 
              ? 'Please answer all to proceed' 
              : uniquePrerequisites.some(p => selections[p] === false) 
                ? 'Start Learning' 
                : 'Proceed to Solution'}
          </span>
          {allSelected && <ArrowRight className="w-5 h-5" />}
        </button>
      </div>
    </motion.div>
  );
}
