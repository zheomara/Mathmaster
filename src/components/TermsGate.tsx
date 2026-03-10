import React, { useState, useEffect } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export default function TermsGate({ children }: { children: React.ReactNode }) {
  const [hasAccepted, setHasAccepted] = useState<boolean | null>(null);
  const [showFullTerms, setShowFullTerms] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem('has_accepted_terms');
      if (accepted === 'true') {
        setHasAccepted(true);
      } else {
        setHasAccepted(false);
      }
    } catch (e) {
      console.error('localStorage error in TermsGate:', e);
      setHasAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('has_accepted_terms', 'true');
    } catch (e) {
      console.error('Failed to save terms acceptance:', e);
    }
    setHasAccepted(true);
  };

  // Show nothing while checking storage (prevents flash of modal)
  if (hasAccepted === null) {
    return null; 
  }

  // If accepted, render the main app (navigation guard passed)
  if (hasAccepted) {
    return <>{children}</>;
  }

  // Otherwise, render the Terms Modal
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 bg-blue-50 border-b border-blue-100 flex-shrink-0">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome to AI Math Solver</h1>
        <p className="text-gray-600 mt-2 text-sm">Before we start crunching numbers, please review our core rules.</p>
      </div>

      {/* Content (ScrollView equivalent) */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          {/* Bullet 1 */}
          <div className="flex gap-4">
            <div className="mt-1 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI is a Study Aid, Not a Teacher</h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                Our AI can sometimes make mistakes or "hallucinate" incorrect steps. Always double-check your work!
              </p>
            </div>
          </div>

          {/* Bullet 2 */}
          <div className="flex gap-4">
            <div className="mt-1 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl">📸</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">How We Process Your Photos</h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                The math problems you snap are sent securely to our third-party AI partner (Puter) to be solved. No humans review your photos.
              </p>
            </div>
          </div>

          {/* Bullet 3 */}
          <div className="flex gap-4">
            <div className="mt-1 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl">🎂</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Age Requirement</h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                You must be at least 5 years old to use this app. If you are under 18, please get a parent's permission.
              </p>
            </div>
          </div>
        </div>

        {/* Expandable Full Terms */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <button 
            onClick={() => setShowFullTerms(!showFullTerms)}
            className="flex items-center justify-between w-full py-2 text-left"
          >
            <span className="font-medium text-blue-600 text-sm">Read Full Terms & Privacy Policy</span>
            {showFullTerms ? (
              <ChevronUp className="w-5 h-5 text-blue-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-blue-600" />
            )}
          </button>
          
          {showFullTerms && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-4 leading-relaxed">
              <div>
                <strong className="text-gray-900 block mb-1">1. No Warranty on Accuracy</strong>
                Our application utilizes advanced Large Language Models (LLMs) to analyze and solve mathematical problems. While we strive for accuracy, AI is not perfect. The AI may occasionally "hallucinate," skip steps, or produce mathematically incorrect solutions. This app is designed to be a supplementary study aid, not a replacement for a qualified teacher. Use at your own risk.
              </div>
              <div>
                <strong className="text-gray-900 block mb-1">2. Age Requirements & COPPA Compliance</strong>
                You must be at least 6 years of age to use this application. If you are between 6 and 18, you must have the permission of a parent or legal guardian. We do not knowingly collect personal information from children under 6.
              </div>
              <div>
                <strong className="text-gray-900 block mb-1">3. Data Collection & OCR Processing</strong>
                When you upload an image of a math problem, we use Optical Character Recognition (OCR) and AI to read and solve it. Your images and text prompts are securely transmitted to our third-party AI infrastructure provider (Puter). No human beings manually review, read, or grade the photos you upload.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Action */}
      <div className="p-6 bg-white border-t border-gray-100 pb-safe flex-shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <p className="text-xs text-center text-gray-500 mb-4">
          By tapping "I Agree", you accept our Terms of Service and Privacy Policy.
        </p>
        <button
          onClick={handleAccept}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
        >
          <span>I Agree & Continue</span>
          <CheckCircle2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
