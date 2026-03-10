import React, { memo } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface SolutionStepCardProps {
  step: string;
  index: number;
}

// Memoize the component to prevent re-rendering expensive LaTeX parsing
// during the streaming process. It will only re-render if the step text changes.
const SolutionStepCard = memo(({ step, index }: SolutionStepCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{ willChange: 'transform, opacity' }}
      className="flex items-start space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-100"
    >
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5">
        {index + 1}
      </div>
      <div className="text-gray-700 leading-relaxed overflow-x-auto w-full">
        <ReactMarkdown 
          remarkPlugins={[remarkMath]} 
          rehypePlugins={[rehypeKatex]}
        >
          {step}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the actual markdown/LaTeX content changes
  return prevProps.step === nextProps.step && prevProps.index === nextProps.index;
});

export default SolutionStepCard;
