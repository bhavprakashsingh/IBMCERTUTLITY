import React, { useState } from 'react';
import { Download, Globe, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import API_ENDPOINTS from '../config';

interface ChainFetcherProps {
  onChainFetched: (pemChain: string) => void;
}

interface FetchResult {
  success: boolean;
  hostname: string;
  port: number;
  certificateCount: number;
  certificates: Array<{
    pem: string;
    subject: any;
    issuer: any;
    valid_from: string;
    valid_to: string;
    fingerprint: string;
    serialNumber: string;
  }>;
  fullChainPem: string;
}

export default function ChainFetcher({ onChainFetched }: ChainFetcherProps) {
  const [hostname, setHostname] = useState('');
  const [port, setPort] = useState('443');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FetchResult | null>(null);

  const fetchChain = async () => {
    if (!hostname.trim()) {
      setError('Please enter a hostname');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(API_ENDPOINTS.FETCH_CHAIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostname: hostname.trim(),
          port: parseInt(port) || 443,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch certificate chain');
      }

      setResult(data);
      onChainFetched(data.fullChainPem);
    } catch (err: any) {
      console.error('Error fetching chain:', err);
      if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to backend server. Make sure the server is running on port 3001.');
      } else {
        setError(err.message || 'Failed to fetch certificate chain');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      fetchChain();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3 mb-4">
          <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Fetch Certificate Chain from Server
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter a hostname to automatically fetch the complete certificate chain (leaf, intermediate, and root certificates)
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hostname
              </label>
              <input
                type="text"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="example.com or www.google.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Port
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="443"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                disabled={loading}
              />
            </div>
          </div>

          <button
            onClick={fetchChain}
            disabled={loading || !hostname.trim()}
            className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Fetching Certificate Chain...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Fetch Certificate Chain
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              {error.includes('backend server') && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Run: <code className="bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded">npm run server</code> or <code className="bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded">npm start</code>
                </p>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Successfully fetched certificate chain
                </p>
                <div className="mt-2 space-y-1 text-sm text-green-700 dark:text-green-300">
                  <p>• Hostname: <span className="font-mono">{result.hostname}:{result.port}</span></p>
                  <p>• Certificates found: <span className="font-semibold">{result.certificateCount}</span></p>
                  <div className="mt-2 space-y-1">
                    {result.certificates.map((cert, idx) => (
                      <div key={idx} className="pl-4 border-l-2 border-green-300 dark:border-green-700">
                        <p className="font-medium">
                          {idx === 0 ? '🔐 Leaf Certificate' : 
                           idx === result.certificates.length - 1 ? '🏛️ Root Certificate' : 
                           '🔗 Intermediate Certificate'}
                        </p>
                        <p className="text-xs font-mono">
                          CN: {cert.subject?.CN || 'N/A'}
                        </p>
                        <p className="text-xs">
                          Valid: {new Date(cert.valid_from).toLocaleDateString()} - {new Date(cert.valid_to).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                  ✓ Certificate chain has been loaded into the analyzer below
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">Backend Server Required</p>
            <p>This feature requires the Node.js backend server to be running. Start it with:</p>
            <code className="block mt-2 bg-yellow-100 dark:bg-yellow-900/40 px-3 py-2 rounded text-xs">
              npm run server
            </code>
            <p className="mt-2">Or run both frontend and backend together:</p>
            <code className="block mt-2 bg-yellow-100 dark:bg-yellow-900/40 px-3 py-2 rounded text-xs">
              npm start
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
