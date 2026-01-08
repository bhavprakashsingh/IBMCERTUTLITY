import React, { useState, useCallback } from 'react';
import { CertInfo } from '../types';
import { parseCertificateChain, verifyChainLocally } from '../utils/crypto';
import { useToast } from './Toast';
import {
  ShieldCheck,
  ShieldAlert,
  Download,
  Key,
  FileText,
  Trash2,
  Link,
  ChevronRight,
  Fingerprint,
  Globe,
  Lock,
  CheckCircle2,
  Copy,
  AlertTriangle
} from 'lucide-react';

export const CertLab: React.FC = () => {
  const [inputPem, setInputPem] = useState('');
  const [certs, setCerts] = useState<CertInfo[]>([]);
  const [verificationLogs, setVerificationLogs] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const { showToast, ToastContainer } = useToast();
  const [isAutoFetching, setIsAutoFetching] = useState(false);

  const testBackendConnection = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      if (response.ok) {
        showToast(`✅ Backend connected: ${data.message}`, 'success');
      } else {
        showToast('❌ Backend responded but with error', 'error');
      }
    } catch (err) {
      showToast('❌ Cannot connect to backend. Run: npm run server', 'error');
      console.error('Backend connection test failed:', err);
    }
  }, [showToast]);

  const handleAutoFetchChain = useCallback(async () => {
    if (!inputPem.trim()) {
      showToast('Please paste a certificate first', 'error');
      return;
    }

    setIsAutoFetching(true);
    
    try {
      console.log('Sending request to backend...');
      const response = await fetch('http://localhost:3001/api/fetch-issuer-chain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leafCertPem: inputPem.trim(),
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Error response:', data);
        throw new Error(data.message || data.error || 'Failed to fetch issuer chain');
      }

      const data = await response.json();
      console.log('Success response:', data);

      // Update input with complete chain
      setInputPem(data.fullChainPem);
      showToast(`Auto-fetched complete chain with ${data.certificateCount} certificate(s)`, 'success');
      
      // Auto-process the complete chain
      setTimeout(() => {
        try {
          const parsed = parseCertificateChain(data.fullChainPem);
          setCerts(parsed);
          
          if (parsed.length > 0) {
            setIsVerifying(true);
            setTimeout(() => {
              const result = verifyChainLocally(parsed);
              setVerificationLogs(result.logs);
              setIsVerifying(false);
              
              const hasErrors = result.logs.some(log =>
                log.includes('EXPIRED') || log.includes('Broken')
              );
              if (hasErrors) {
                showToast('Chain verification found issues', 'error');
              } else {
                showToast('Complete chain verified successfully!', 'success');
              }
            }, 500);
          }
        } catch (error) {
          showToast('Error processing fetched chain', 'error');
          console.error(error);
        }
      }, 100);
    } catch (err: any) {
      console.error('Error auto-fetching chain:', err);
      
      // Check if it's a network error (server not running)
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        showToast('❌ Cannot connect to backend server. Make sure the server is running: npm run server', 'error');
      }
      // Check if it's an AIA extension error
      else if (err.message.includes('AIA extension') || err.message.includes('CA Issuers URL') || err.message.includes('Certificate Transparency') || err.message.includes('Cannot fetch issuer chain')) {
        showToast('⚠️ Cannot auto-fetch: Certificate lacks AIA extension. Please paste the complete certificate chain manually.', 'error');
      }
      // Other errors
      else {
        showToast(`❌ ${err.message || 'Failed to auto-fetch certificate chain'}`, 'error');
      }
    } finally {
      setIsAutoFetching(false);
    }
  }, [inputPem, showToast]);

  const handleProcess = useCallback(() => {
    try {
      const parsed = parseCertificateChain(inputPem);
      setCerts(parsed);
      
      if (parsed.length > 0) {
          setIsVerifying(true);
          showToast(`Successfully parsed ${parsed.length} certificate(s)`, 'success');
          setTimeout(() => {
              const result = verifyChainLocally(parsed);
              setVerificationLogs(result.logs);
              setIsVerifying(false);
              
              const hasErrors = result.logs.some(log =>
                log.includes('EXPIRED') || log.includes('Broken')
              );
              if (hasErrors) {
                showToast('Chain verification found issues', 'error');
              } else {
                showToast('Chain verification completed successfully', 'success');
              }
          }, 500); // Simulate processing time for UX
      } else {
          setVerificationLogs([]);
          showToast('No valid certificates found in input', 'error');
      }
    } catch (error) {
      showToast('Error processing certificates', 'error');
      console.error(error);
    }
  }, [inputPem, showToast]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    showToast(`Loading ${file.name}...`, 'info');
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputPem(text);
      showToast('File loaded successfully', 'success');
    };
    reader.onerror = () => {
      showToast('Error reading file', 'error');
    };
    reader.readAsText(file);
  };

  const downloadCert = (cert: CertInfo) => {
    try {
      const blob = new Blob([cert.rawPem], { type: 'application/x-pem-file' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const name = cert.subject.CN || 'certificate';
      a.download = `${name.replace(/\s+/g, '_')}_${cert.type}.pem`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Downloaded ${cert.type} certificate`, 'success');
    } catch (error) {
      showToast('Error downloading certificate', 'error');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied to clipboard`, 'success');
    }).catch(() => {
      showToast('Failed to copy to clipboard', 'error');
    });
  };

  const downloadAllCerts = () => {
    try {
      // Combine all certificates into a single PEM file
      const combinedPem = certs.map(cert => cert.rawPem).join('\n');
      
      const blob = new Blob([combinedPem], { type: 'application/x-pem-file' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Use the leaf certificate's CN for the filename
      const leafCert = certs.find(c => c.type === 'Leaf') || certs[0];
      const name = leafCert?.subject.CN || 'certificate';
      a.download = `${name.replace(/\s+/g, '_')}_fullchain.pem`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast(`Exported ${certs.length} certificate(s) as combined chain`, 'success');
    } catch (error) {
      showToast('Error exporting certificates', 'error');
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="flex flex-col gap-6 h-full overflow-y-auto">
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
               <FileText className="w-5 h-5" /> Source PEM
             </h2>
             <div className="flex gap-2">
                <label className="cursor-pointer px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sm rounded border border-slate-600 transition">
                    Upload
                    <input type="file" className="hidden" accept=".pem,.crt,.cer,.txt" onChange={handleFileUpload} />
                </label>
                {certs.length > 0 && (
                  <button
                    onClick={downloadAllCerts}
                    className="px-3 py-1 bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-400 text-sm rounded border border-cyan-900/50 transition flex items-center gap-1"
                  >
                      <Download className="w-3 h-3" /> Export All
                  </button>
                )}
                <button
                  onClick={() => { setInputPem(''); setCerts([]); setVerificationLogs([]); }}
                  className="px-3 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm rounded border border-red-900/50 transition flex items-center gap-1"
                >
                    <Trash2 className="w-3 h-3" /> Clear
                </button>
             </div>
          </div>
          
          <textarea
            value={inputPem}
            onChange={(e) => setInputPem(e.target.value)}
            placeholder="-----BEGIN CERTIFICATE----- ... Paste your Full Chain here"
            className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500 resize-none shadow-inner"
            spellCheck={false}
          />
          
         <div className="space-y-3">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <button
               onClick={handleAutoFetchChain}
               disabled={isAutoFetching || !inputPem.trim()}
               className="py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-bold rounded-lg shadow-lg shadow-green-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
             >
               {isAutoFetching ? (
                 <>
                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   Auto-Fetching...
                 </>
               ) : (
                 <>
                   <Download className="w-5 h-5" />
                   AUTO-FETCH CHAIN
                 </>
               )}
             </button>
             <button
               onClick={handleProcess}
               className="py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-900/20 transition-all active:scale-95"
             >
               PROCESS CHAIN & ANALYZE
             </button>
           </div>
           <button
             onClick={testBackendConnection}
             className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-all"
           >
             🔌 Test Backend Connection
           </button>
         </div>
        </div>

          {/* Results Section */}
          <div className="flex flex-col gap-4 overflow-hidden">
             <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
               <ShieldCheck className="w-5 h-5" /> Analysis Results
             </h2>
             
             <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {certs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-lg p-8">
                        <Fingerprint className="w-16 h-16 mb-4 opacity-20" />
                        <p>No certificates processed yet.</p>
                        <p className="text-sm">Paste a PEM chain to extract Leaf, Intermediate, and Root.</p>
                    </div>
                )}

                {/* Chain Visualization */}
                {certs.map((cert, idx) => (
                    <div key={cert.id} className="relative pl-6">
                        {/* Connecting Line */}
                        {idx < certs.length - 1 && (
                            <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-slate-700 z-0"></div>
                        )}
                        
                        <div className="relative z-10 bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors group">
                            {/* Type Badge */}
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider
                                    ${cert.type === 'Leaf' ? 'bg-cyan-900 text-cyan-300' : 
                                      cert.type === 'Root' ? 'bg-purple-900 text-purple-300' : 
                                      'bg-slate-700 text-slate-300'}`}>
                                    {cert.type}
                                </span>
                                {cert.isSelfSigned && (
                                    <span className="text-[10px] bg-yellow-900/30 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-900/50">
                                        SELF-SIGNED
                                    </span>
                                )}
                            </div>

                            {/* Main Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-slate-400 mb-1">Subject</div>
                                    <div className="font-mono text-sm text-white truncate" title={cert.subject.CN}>
                                        {cert.subject.CN || 'Unknown CN'}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate">{cert.subject.O}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-slate-400 mb-1">Issuer</div>
                                    <div className="font-mono text-sm text-slate-200 truncate" title={cert.issuer.CN}>
                                        {cert.issuer.CN || 'Unknown Issuer'}
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/50 p-3 rounded border border-slate-800">
                                <div className="text-slate-500">Not Before:</div>
                                <div className="text-slate-300">{cert.validFrom.toLocaleDateString()}</div>
                                <div className="text-slate-500">Not After:</div>
                                <div className={cert.validTo < new Date() ? "text-red-400" : "text-green-400"}>
                                    {cert.validTo.toLocaleDateString()}
                                </div>
                                <div className="text-slate-500">Serial:</div>
                                <div className="text-slate-400 truncate" title={cert.serialNumber}>{cert.serialNumber}</div>
                            </div>

                            {/* Subject Alternative Names (SAN) */}
                            {cert.subjectAltNames.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Globe className="w-3 h-3 text-green-400" />
                                        <span className="text-xs font-semibold text-green-400">Subject Alternative Names ({cert.subjectAltNames.length})</span>
                                    </div>
                                    <div className="bg-black/30 p-2 rounded max-h-32 overflow-y-auto">
                                        <div className="space-y-1">
                                            {cert.subjectAltNames.map((san, idx) => (
                                                <div key={idx} className="text-[10px] font-mono text-slate-300 flex items-center gap-2">
                                                    <CheckCircle2 className="w-2.5 h-2.5 text-green-500 flex-shrink-0" />
                                                    <span className="break-all">{san}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Key Usage */}
                            {cert.keyUsage.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Lock className="w-3 h-3 text-purple-400" />
                                        <span className="text-xs font-semibold text-purple-400">Key Usage</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {cert.keyUsage.map((usage, idx) => (
                                            <span key={idx} className="text-[10px] bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded border border-purple-900/50">
                                                {usage}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Extended Key Usage */}
                            {cert.extendedKeyUsage.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldCheck className="w-3 h-3 text-blue-400" />
                                        <span className="text-xs font-semibold text-blue-400">Extended Key Usage</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {cert.extendedKeyUsage.map((usage, idx) => (
                                            <span key={idx} className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded border border-blue-900/50">
                                                {usage}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Basic Constraints */}
                            {cert.basicConstraints && (
                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                    <div className="text-xs text-slate-400 mb-1">Basic Constraints</div>
                                    <div className="flex gap-2 text-[10px]">
                                        <span className={`px-2 py-0.5 rounded ${cert.basicConstraints.cA ? 'bg-orange-900/30 text-orange-300 border border-orange-900/50' : 'bg-slate-700 text-slate-300'}`}>
                                            CA: {cert.basicConstraints.cA ? 'TRUE' : 'FALSE'}
                                        </span>
                                        {cert.basicConstraints.pathLenConstraint !== undefined && (
                                            <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                                                Path Length: {cert.basicConstraints.pathLenConstraint}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Key Pinning */}
                            <div className="mt-3 pt-3 border-t border-slate-700/50">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <Key className="w-3 h-3 text-cyan-400" />
                                        <span className="text-xs font-semibold text-cyan-400">HPKP Pin (SHA-256)</span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(`pin-sha256="${cert.spkiFingerprint}"`, 'HPKP Pin')}
                                        className="p-1 hover:bg-slate-700 rounded transition"
                                        title="Copy to clipboard"
                                    >
                                        <Copy className="w-3 h-3 text-slate-400" />
                                    </button>
                                </div>
                                <div className="bg-black/30 p-2 rounded text-[10px] font-mono text-slate-400 break-all select-all hover:bg-black/50 transition-colors cursor-text">
                                    pin-sha256="{cert.spkiFingerprint}"
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => downloadCert(cert)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-cyan-700 text-white text-xs rounded transition"
                                >
                                    <Download className="w-3 h-3" /> Export PEM
                                </button>
                                <button
                                    onClick={() => copyToClipboard(cert.fingerprint256, 'SHA-256 Fingerprint')}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition"
                                >
                                    <Copy className="w-3 h-3" /> Copy SHA-256
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Verification Logs */}
                {verificationLogs.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 mt-4">
                        <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                           <ShieldAlert className="w-4 h-4" /> Chain Verification Log
                        </h3>
                        <ul className="space-y-1">
                            {verificationLogs.map((log, i) => (
                                <li key={i} className={`text-xs font-mono flex items-start gap-2 ${
                                    log.includes('EXPIRED') || log.includes('Broken') ? 'text-red-400' : 
                                    log.includes('Warning') ? 'text-yellow-400' : 'text-green-400'
                                }`}>
                                    <span className="mt-0.5"><ChevronRight className="w-3 h-3"/></span>
                                    {log}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
             </div>
         </div>
       </div>
     </div>
   </>
  );
};