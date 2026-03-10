import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Key, CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react';
import { LicenseService } from '../services/LicenseService';

interface LicenseLockProps {
  onUnlocked: () => void;
}

export default function LicenseLock({ onUnlocked }: LicenseLockProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleActivate = () => {
    if (LicenseService.activateLicense(key)) {
      setSuccess(true);
      setError(false);
      setTimeout(() => {
        onUnlocked();
      }, 1500);
    } else {
      setError(true);
      setSuccess(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden"
    >
      <div className="bg-indigo-600 p-8 text-white text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Trial Limit Reached</h2>
        <p className="text-indigo-100">You've solved 2 problems! Please enter your license key to continue learning.</p>
      </div>

      <div className="p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">License Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-indigo-500'
                } outline-none transition-all font-mono`}
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Invalid license key. Please try again.
              </p>
            )}
            {success && (
              <p className="mt-2 text-sm text-emerald-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                License activated! Unlocking...
              </p>
            )}
          </div>

          <button
            onClick={handleActivate}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2"
          >
            <span>Activate Now</span>
          </button>

          <div className="pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500 mb-4">Don't have a key yet?</p>
            <button className="w-full bg-gray-50 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all border border-gray-200 flex items-center justify-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Purchase License</span>
            </button>
          </div>
          
          <p className="text-center text-xs text-gray-400">
            Hint: Use <code className="bg-gray-100 px-1 rounded">MATH-MASTER-2026</code> for testing
          </p>
        </div>
      </div>
    </motion.div>
  );
}
