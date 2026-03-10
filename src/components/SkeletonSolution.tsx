import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Calculator, PenTool } from 'lucide-react';

export default function SkeletonSolution() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Assumed Knowledge Skeleton */}
      <div className="border-b border-gray-100">
        <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-amber-600 opacity-50" />
          <div className="h-5 bg-amber-200/50 rounded w-40 animate-pulse"></div>
        </div>
        <div className="p-6 space-y-3 bg-white">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
        </div>
      </div>

      {/* Step-by-Step Solution Skeleton */}
      <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-indigo-600 opacity-50" />
          <div className="h-5 bg-indigo-200/50 rounded w-48 animate-pulse"></div>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-start space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5 animate-pulse"></div>
            <div className="space-y-2 w-full">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              {step === 2 && <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>}
            </div>
          </div>
        ))}
      </div>

      {/* Practice Problems Skeleton */}
      <div className="border-t border-gray-100">
        <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center space-x-2">
          <PenTool className="w-5 h-5 text-emerald-600 opacity-50" />
          <div className="h-5 bg-emerald-200/50 rounded w-40 animate-pulse"></div>
        </div>
        <div className="p-6 space-y-4 bg-white">
          {[1, 2].map((prob) => (
            <div key={prob} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
