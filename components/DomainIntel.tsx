import React, { useState, useCallback } from 'react';
import { DomainInfo } from '../types';
import { useToast } from './Toast';
import {
  Globe,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Lock,
  Calendar,
  Server,
  AlertCircle,
  Download,
  Copy,
  ExternalLink
} from 'lucide-react';

export const DomainIntel: React.FC = () => {
  const [hostname, setHostname] = useState('');
  const [port, setPort] = useState('443');
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const handleCheck = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hostname.trim()) {
      showToast('Please enter a hostname', 'error');
      return;
    }

    setLoading(true);
    setDomainInfo(null);

    try {
      const response = await fetch('http://localhost:3001/api/domain-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostname: hostname.trim(),
          port: parseInt(port) || 443,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch domain information');
      }

      const data = await response.json();
      setDomainInfo(data);
      
      if (data.certificate?.isExpired) {
        showToast('⚠️ Certificate has expired!', 'error');
      } else if (data.certificate?.daysUntilExpiry <= 30) {
        showToast(`⚠️ Certificate expires in ${data.certificate.daysUntilExpiry} days`, 'error');
      } else {
        showToast('✅ Domain information retrieved successfully', 'success');
      }
    } catch (err: any) {
      console.error('Error fetching domain info:', err);
      
      if (err.message === 'Failed to fetch') {
        showToast('❌ Cannot connect to backend server. Run: npm run server', 'error');
      } else {
        showToast(`❌ ${err.message}`, 'error');
      }
      
      setDomainInfo({
        hostname: hostname.trim(),
        port: parseInt(port) || 443,
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  }, [hostname, port, showToast]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied to clipboard`, 'success');
    }).catch(() => {
      showToast('Failed to copy to clipboard', 'error');
    });
  };

  const downloadCertificate = async () => {
    if (!domainInfo?.certificate) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/fetch-chain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostname: domainInfo.hostname,
          port: domainInfo.port,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      const data = await response.json();
      const blob = new Blob([data.fullChainPem], { type: 'application/x-pem-file' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${domainInfo.hostname}_fullchain.pem`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Certificate chain downloaded', 'success');
    } catch (error) {
      showToast('Error downloading certificate', 'error');
    }
  };

  const getExpiryColor = (days: number) => {
    if (days < 0) return 'text-red-400';
    if (days <= 7) return 'text-red-400';
    if (days <= 30) return 'text-yellow-400';
    if (days <= 60) return 'text-orange-400';
    return 'text-green-400';
  };

  const getExpiryBgColor = (days: number) => {
    if (days < 0) return 'bg-red-900/20 border-red-900/50';
    if (days <= 7) return 'bg-red-900/20 border-red-900/50';
    if (days <= 30) return 'bg-yellow-900/20 border-yellow-900/50';
    if (days <= 60) return 'bg-orange-900/20 border-orange-900/50';
    return 'bg-green-900/20 border-green-900/50';
  };

  return (
    <>
      <ToastContainer />
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Header Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Globe className="w-8 h-8 text-cyan-400" />
            Domain Certificate Intelligence
          </h2>
          <p className="text-slate-400 mb-6">
            Check SSL/TLS certificate expiry, validity, and security details for any domain
          </p>

          {/* Input Form */}
          <form onSubmit={handleCheck} className="flex gap-4">
            <div className="flex-1 flex gap-4">
              <input
                type="text"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="example.com or www.google.com"
                className="flex-1 bg-slate-950 border border-slate-600 rounded-lg px-6 py-4 text-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="443"
                className="w-24 bg-slate-950 border border-slate-600 rounded-lg px-4 py-4 text-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              CHECK
            </button>
          </form>
        </div>

        {/* Results */}
        {domainInfo && !domainInfo.error && domainInfo.certificate && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Expiry Status Card */}
            <div className={`border rounded-xl p-6 ${getExpiryBgColor(domainInfo.certificate.daysUntilExpiry)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {domainInfo.certificate.isExpired ? (
                    <AlertCircle className="w-12 h-12 text-red-400 flex-shrink-0" />
                  ) : domainInfo.certificate.daysUntilExpiry <= 30 ? (
                    <AlertTriangle className="w-12 h-12 text-yellow-400 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-12 h-12 text-green-400 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {domainInfo.certificate.isExpired ? 'Certificate Expired' : 'Certificate Status'}
                    </h3>
                    <p className={`text-lg font-semibold ${getExpiryColor(domainInfo.certificate.daysUntilExpiry)}`}>
                      {domainInfo.certificate.isExpired 
                        ? `Expired ${Math.abs(domainInfo.certificate.daysUntilExpiry)} days ago`
                        : `Expires in ${domainInfo.certificate.daysUntilExpiry} days`
                      }
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Valid until: {new Date(domainInfo.certificate.validTo).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={downloadCertificate}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Chain
                </button>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Certificate Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subject */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Server className="w-4 h-4" />
                    Subject (Common Name)
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                    <p className="font-mono text-sm text-white break-all">{domainInfo.certificate.subject}</p>
                  </div>
                </div>

                {/* Issuer */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Lock className="w-4 h-4" />
                    Issuer (Certificate Authority)
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                    <p className="font-mono text-sm text-white break-all">{domainInfo.certificate.issuer}</p>
                  </div>
                </div>

                {/* Valid From */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    Valid From
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                    <p className="font-mono text-sm text-green-400">
                      {new Date(domainInfo.certificate.validFrom).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Valid To */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    Valid To
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                    <p className={`font-mono text-sm ${getExpiryColor(domainInfo.certificate.daysUntilExpiry)}`}>
                      {new Date(domainInfo.certificate.validTo).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Serial Number */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      Serial Number
                    </div>
                    <button
                      onClick={() => copyToClipboard(domainInfo.certificate!.serialNumber, 'Serial number')}
                      className="p-1 hover:bg-slate-700 rounded transition"
                    >
                      <Copy className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                    <p className="font-mono text-xs text-slate-300 break-all">{domainInfo.certificate.serialNumber}</p>
                  </div>
                </div>

                {/* Fingerprint */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      SHA-256 Fingerprint
                    </div>
                    <button
                      onClick={() => copyToClipboard(domainInfo.certificate!.fingerprint, 'Fingerprint')}
                      className="p-1 hover:bg-slate-700 rounded transition"
                    >
                      <Copy className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                    <p className="font-mono text-xs text-slate-300 break-all">{domainInfo.certificate.fingerprint}</p>
                  </div>
                </div>
              </div>

              {/* Subject Alternative Names */}
              {domainInfo.certificate.subjectAltNames.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">
                      Subject Alternative Names ({domainInfo.certificate.subjectAltNames.length})
                    </span>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded border border-slate-700 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {domainInfo.certificate.subjectAltNames.map((san, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-mono text-slate-300">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="break-all">{san}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TLS Info */}
              {(domainInfo.tlsVersion || domainInfo.cipherSuite) && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">TLS Connection Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {domainInfo.tlsVersion && (
                      <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                        <div className="text-xs text-slate-400 mb-1">TLS Version</div>
                        <div className="font-mono text-sm text-cyan-400">{domainInfo.tlsVersion}</div>
                      </div>
                    )}
                    {domainInfo.cipherSuite && (
                      <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                        <div className="text-xs text-slate-400 mb-1">Cipher Suite</div>
                        <div className="font-mono text-xs text-cyan-400 break-all">{domainInfo.cipherSuite}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h4 className="text-sm font-semibold text-slate-300 mb-3">External Tools</h4>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://crt.sh/?q=${domainInfo.hostname}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition flex items-center gap-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View on crt.sh
                  </a>
                  <a
                    href={`https://www.ssllabs.com/ssltest/analyze.html?d=${domainInfo.hostname}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition flex items-center gap-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    SSL Labs Test
                  </a>
                  <a
                    href={`https://transparencyreport.google.com/https/certificates?hl=en&cert_search_auth=&cert_search_cert=&cert_search=include_expired:false;include_subdomains:true;domain:${domainInfo.hostname}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition flex items-center gap-2"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Google Transparency
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {domainInfo && domainInfo.error && (
          <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-red-400 mb-2">Error</h3>
                <p className="text-slate-300">{domainInfo.error}</p>
                <p className="text-sm text-slate-400 mt-2">
                  Make sure the hostname is correct and the server is accessible on port {domainInfo.port}.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// Made with Bob
