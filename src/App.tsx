import React, { useState, useEffect } from 'react';
import { Shield, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

// Puter.js fallback service
const getPuterService = () => {
  // @ts-ignore
  if (typeof puter !== 'undefined') {
    return {
      // @ts-ignore
      instance: puter,
      isFallback: false,
      name: 'Puter.js (Cloud)'
    };
  }

  // Fallback implementation
  return {
    instance: {
      auth: {
        isSignedIn: () => false,
        signIn: () => console.log('Fallback: Sign in requested'),
        signOut: () => console.log('Fallback: Sign out requested'),
      },
      kv: {
        set: (key: string, value: any) => {
          localStorage.setItem(`fallback_kv_${key}`, JSON.stringify(value));
          return Promise.resolve(true);
        },
        get: (key: string) => {
          const val = localStorage.getItem(`fallback_kv_${key}`);
          return Promise.resolve(val ? JSON.parse(val) : null);
        }
      }
    },
    isFallback: true,
    name: 'Local Storage (Fallback)'
  };
};

const App: React.FC = () => {
  const [puterStatus, setPuterStatus] = useState<{ isFallback: boolean; name: string } | null>(null);
  const [kvValue, setKvValue] = useState<string>('');
  const [savedValue, setSavedValue] = useState<string>('');

  useEffect(() => {
    const service = getPuterService();
    setPuterStatus({ isFallback: service.isFallback, name: service.name });
    
    // Test KV storage
    service.instance.kv.get('test_key').then((val: any) => {
      if (val) setSavedValue(val);
    });
  }, []);

  const handleSave = async () => {
    const service = getPuterService();
    await service.instance.kv.set('test_key', kvValue);
    setSavedValue(kvValue);
    setKvValue('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="text-emerald-500" />
            Puter Fallback Test
          </h1>
          {puterStatus?.isFallback ? (
            <CloudOff className="text-amber-500" />
          ) : (
            <Cloud className="text-emerald-500" />
          )}
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-1">Status</p>
            <p className="text-lg font-medium text-zinc-200">
              {puterStatus ? puterStatus.name : 'Initializing...'}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">KV Storage Test</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={kvValue}
                onChange={(e) => setKvValue(e.target.value)}
                placeholder="Enter value to save..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
              <button 
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Save
              </button>
            </div>
            
            <div className="p-4 bg-zinc-800/30 rounded-xl border border-dashed border-zinc-700">
              <p className="text-xs text-zinc-500 mb-1">Saved Value:</p>
              <p className="text-zinc-200 font-mono">
                {savedValue || <span className="text-zinc-600 italic">No value saved yet</span>}
              </p>
            </div>
          </div>

          {puterStatus?.isFallback && (
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertCircle className="text-amber-500 shrink-0 w-5 h-5" />
              <p className="text-sm text-amber-200/80 leading-relaxed">
                Puter.js SDK was not detected. The application is currently running in <strong>local fallback mode</strong> using browser storage.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <div className="mt-8 text-zinc-600 text-xs flex flex-col items-center gap-2">
        <p>To test Puter.js, ensure you are in an environment where js.puter.com is accessible.</p>
        <p>To test Fallback, block the Puter.js script in your browser's network tab.</p>
      </div>
    </div>
  );
};

export default App;
