import React, { useState } from 'react';
import { useToast } from './Toast';
import { matchCertificateAndKey } from '../utils/crypto';
import { 
  Key, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Upload,
  Trash2,
  Shield
} from 'lucide-react';

export const KeyMatcher: React.FC = () => {
  const [certPem, setCertPem] = useState('');
  const [keyPem, setKeyPem] = useState('');
  const [matchResult, setMatchResult] = useState<{
    matches: boolean;
    message: string;
    details?: {
      certModulus: string;
      keyModulus: string;
    };
  } | null>(null);
  const { showToast, ToastContainer } = useToast();

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    showToast(`Loading ${file.name}...`, 'info');
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCertPem(text);
      showToast('Certificate loaded', 'success');
    };
    reader.onerror = () => {
      showToast('Error reading certificate file', 'error');
    };
    reader.readAsText(file);
  };

  const handleKeyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    showToast(`Loading ${file.name}...`, 'info');
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setKeyPem(text);
      showToast('Private key loaded', 'success');
    };
    reader.onerror = () => {
      showToast('Error reading key file', 'error');
    };
    reader.readAsText(file);
  };

  const handleMatch = () => {
    if (!certPem || !keyPem) {
      showToast('Please provide both certificate and private key', 'error');
      return;
    }

    try {
      const result = matchCertificateAndKey(certPem, keyPem);
      setMatchResult(result);
      
      if (result.matches) {
        showToast('Certificate and key match! ✓', 'success');
      } else {
        showToast('Certificate and key do NOT match', 'error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Error: ${errorMessage}`, 'error');
      setMatchResult({
        matches: false,
        message: errorMessage
      });
    }
  };

  const handleClear = () => {
    setCertPem('');
    setKeyPem('');
    setMatchResult(null);
    showToast('Cleared all inputs', 'info');
  };

  return (
    <>
      <ToastContainer />
      <div className="max-w-6xl mx-auto flex flex-col gap-6 h-full">
        {/* Header */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <Shield className="w-8 h-8 text-cyan-400" />
                Certificate & Key Matcher
              </h2>
              <p className="text-slate-400">
                Verify if a private key matches a certificate by comparing their public key modulus
              </p>
            </div>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg border border-red-900/50 transition flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          {/* Certificate Input */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Certificate (PEM)
              </h3>
              <label className="cursor-pointer px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sm rounded border border-slate-600 transition">
                Upload
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pem,.crt,.cer,.txt" 
                  onChange={handleCertUpload} 
                />
              </label>
            </div>
            
            <textarea
              value={certPem}
              onChange={(e) => setCertPem(e.target.value)}
              placeholder="-----BEGIN CERTIFICATE-----&#10;Paste your certificate here&#10;-----END CERTIFICATE-----"
              className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500 resize-none shadow-inner"
              spellCheck={false}
            />
          </div>

          {/* Private Key Input */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                <Key className="w-5 h-5" /> Private Key (PEM)
              </h3>
              <label className="cursor-pointer px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sm rounded border border-slate-600 transition">
                Upload
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pem,.key,.txt" 
                  onChange={handleKeyUpload} 
                />
              </label>
            </div>
            
            <textarea
              value={keyPem}
              onChange={(e) => setKeyPem(e.target.value)}
              placeholder="-----BEGIN PRIVATE KEY-----&#10;or&#10;-----BEGIN RSA PRIVATE KEY-----&#10;Paste your private key here&#10;-----END PRIVATE KEY-----"
              className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-xs text-slate-300 focus:outline-none focus:border-purple-500 resize-none shadow-inner"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Match Button */}
        <button
          onClick={handleMatch}
          disabled={!certPem || !keyPem}
          className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-cyan-900/20 transition-all active:scale-95"
        >
          VERIFY MATCH
        </button>

        {/* Result Section */}
        {matchResult && (
          <div className={`border rounded-xl p-6 ${
            matchResult.matches 
              ? 'bg-green-900/20 border-green-500/50' 
              : 'bg-red-900/20 border-red-500/50'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {matchResult.matches ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                  <div>
                    <h3 className="text-xl font-bold text-green-400">Match Confirmed!</h3>
                    <p className="text-green-300 text-sm">The certificate and private key are a matching pair</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-red-400" />
                  <div>
                    <h3 className="text-xl font-bold text-red-400">No Match</h3>
                    <p className="text-red-300 text-sm">The certificate and private key do NOT match</p>
                  </div>
                </>
              )}
            </div>

            <div className="bg-black/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-slate-300 mb-3">{matchResult.message}</p>
              
              {matchResult.details && (
                <div className="space-y-3 mt-4 pt-4 border-t border-slate-700">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Certificate Public Key Modulus (first 64 chars):</div>
                    <div className="font-mono text-xs text-cyan-300 bg-slate-950 p-2 rounded break-all">
                      {matchResult.details.certModulus.substring(0, 64)}...
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Private Key Modulus (first 64 chars):</div>
                    <div className="font-mono text-xs text-purple-300 bg-slate-950 p-2 rounded break-all">
                      {matchResult.details.keyModulus.substring(0, 64)}...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// Made with Bob
