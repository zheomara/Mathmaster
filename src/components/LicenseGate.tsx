import React, { useState, useEffect } from 'react';
import { Key, ShieldAlert, Copy, CheckCircle2, ArrowLeft, Lock } from 'lucide-react';

// --- Crypto Utilities ---
// SHA-256 hash of "Matipa@1987"
const MASTER_HASH = "582b0164483bc24446dd4be66708ee42be57d88b2a19964f7ad5b09046657870";
const SALT = "LicenseGate_Secure_Salt_2026";

async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getHMACKey(secretHex: string) {
  // Convert hex string to Uint8Array
  const secretBuffer = new Uint8Array(secretHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    secretBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const saltBuffer = new TextEncoder().encode(SALT);
  
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(str: string) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

async function generateLicense(deviceId: string, daysValid: number, adminPasswordHex: string) {
  const exp = Date.now() + daysValid * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ deviceId, exp });
  const payloadB64 = toBase64Url(payload);
  
  const key = await getHMACKey(adminPasswordHex);
  const dataBuffer = new TextEncoder().encode(payloadB64);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, dataBuffer);
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
  return `${payloadB64}.${signatureB64}`;
}

async function verifyLicense(licenseKey: string, currentDeviceId: string) {
  try {
    const parts = licenseKey.split('.');
    if (parts.length !== 2) return false;
    
    const [payloadB64, signatureB64] = parts;
    const payloadStr = fromBase64Url(payloadB64);
    const payload = JSON.parse(payloadStr);
    
    if (payload.deviceId !== currentDeviceId) return false;
    if (Date.now() > payload.exp) return false;
    
    const key = await getHMACKey(MASTER_HASH);
    const dataBuffer = new TextEncoder().encode(payloadB64);
    
    let base64Sig = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Sig.length % 4) {
      base64Sig += '=';
    }
    const signatureBuffer = new Uint8Array(atob(base64Sig).split('').map(c => c.charCodeAt(0)));
    
    const isValid = await crypto.subtle.verify("HMAC", key, signatureBuffer, dataBuffer);
    return isValid;
  } catch (e) {
    return false;
  }
}

// --- Component ---

export default function LicenseGate({ children }: { children: React.ReactNode }) {
  const [deviceId, setDeviceId] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // Client State
  const [licenseInput, setLicenseInput] = useState('');
  const [clientError, setClientError] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  
  // Admin State
  const [targetDeviceId, setTargetDeviceId] = useState('');
  const [daysValid, setDaysValid] = useState('30');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    let id = '';
    try {
      id = localStorage.getItem('device_id') || '';
      if (!id) {
        try {
          id = crypto.randomUUID().toUpperCase().split('-')[0] + '-' + crypto.randomUUID().toUpperCase().split('-')[1];
        } catch (e) {
          const randomHex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1).toUpperCase();
          id = randomHex() + randomHex() + '-' + randomHex() + randomHex();
        }
        localStorage.setItem('device_id', id);
      }
    } catch (e) {
      // Fallback if localStorage is disabled
      const randomHex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1).toUpperCase();
      id = randomHex() + randomHex() + '-' + randomHex() + randomHex();
    }
    setDeviceId(id);
    
    const checkExistingLicense = async () => {
      try {
        const savedLicense = localStorage.getItem('app_license_key');
        if (savedLicense) {
          const isValid = await verifyLicense(savedLicense, id);
          if (isValid) {
            setIsUnlocked(true);
            return;
          } else {
            localStorage.removeItem('app_license_key');
          }
        }

        // Trial Period Check: Allow 2 problems before locking
        const statsStr = localStorage.getItem('mathmaster_stats');
        if (statsStr) {
          const stats = JSON.parse(statsStr);
          if (stats.problemsSolved < 2) {
            setIsUnlocked(true);
            return;
          }
        } else {
          // No stats yet means 0 problems solved
          setIsUnlocked(true);
          return;
        }

      } catch (e) {
        console.error('localStorage error:', e);
      }
      setIsUnlocked(false);
    };
    
    checkExistingLicense();

    // Listen for storage changes to update lock status (e.g. when a problem is solved)
    const handleStorageChange = () => {
      checkExistingLicense();
    };
    window.addEventListener('storage', handleStorageChange);
    // Custom event for same-window updates
    window.addEventListener('license_check', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('license_check', handleStorageChange);
    };
  }, []);

  const handleUnlock = async () => {
    setClientError('');
    if (!licenseInput.trim()) return;
    
    const inputHash = await sha256(licenseInput.trim());
    
    if (inputHash === MASTER_HASH) {
      // Secret Trigger Activated
      setLicenseInput('');
      setIsAdminMode(true);
      return;
    }
    
    // Verify as normal license
    const isValid = await verifyLicense(licenseInput.trim(), deviceId);
    if (isValid) {
      try {
        localStorage.setItem('app_license_key', licenseInput.trim());
      } catch (e) {
        console.error('Failed to save license key:', e);
      }
      setIsUnlocked(true);
    } else {
      setClientError('Invalid or expired license key.');
    }
  };

  const handleGenerate = async () => {
    if (!targetDeviceId.trim() || !daysValid) return;
    try {
      // We use the MASTER_HASH as the secret hex to derive the HMAC key
      const code = await generateLicense(targetDeviceId.trim(), parseInt(daysValid, 10), MASTER_HASH);
      setGeneratedCode(code);
      setCopiedCode(false);
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string, setCopied: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUnlocked === null) return null;
  
  // If unlocked and not in admin mode, show the actual app
  if (isUnlocked && !isAdminMode) return <>{children}</>;

  if (isAdminMode) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-red-50 p-6 border-b border-red-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                Admin Generator Panel
              </h2>
              <p className="text-red-400 text-xs mt-1">Authorized Personnel Only</p>
            </div>
            <button 
              onClick={() => setIsAdminMode(false)}
              className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-700 shadow-sm border border-gray-200"
              title="Back to App"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Device ID</label>
              <input 
                type="text"
                value={targetDeviceId}
                onChange={(e) => setTargetDeviceId(e.target.value)}
                placeholder="e.g. A1B2-C3D4"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all font-mono text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days Valid</label>
              <input 
                type="number"
                value={daysValid}
                onChange={(e) => setDaysValid(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            
            <button
              onClick={handleGenerate}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-200"
            >
              Generate Code
            </button>
            
            {generatedCode && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Generated License Key</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    readOnly
                    value={generatedCode}
                    className="flex-1 bg-transparent text-sm font-mono text-gray-800 outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(generatedCode, setCopiedCode)}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {copiedCode ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">App Locked</h1>
          <p className="text-gray-500 mt-2">Please enter a valid license key to continue.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <p className="text-sm font-medium text-gray-500 mb-2 text-center">Send this ID to the Admin</p>
            <div 
              onClick={() => copyToClipboard(deviceId, setCopiedId)}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <span className="font-mono text-xl font-bold text-gray-800 tracking-wider">{deviceId}</span>
              {copiedId ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              )}
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter License Key</label>
              <input 
                type="text"
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value)}
                placeholder="Paste your key here..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-sm"
              />
              {clientError && <p className="text-red-500 text-xs mt-2 font-medium">{clientError}</p>}
            </div>
            
            <button
              onClick={handleUnlock}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <Key className="w-5 h-5" />
              Unlock App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
