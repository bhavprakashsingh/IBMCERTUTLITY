import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

const commands = [
  {
    title: "Get Remote Certificate Chain",
    description: "Download the full certificate chain from a remote server.",
    cmd: (domain: string) => `openssl s_client -showcerts -verify 5 -connect ${domain || 'example.com'}:443 < /dev/null`
  },
  {
    title: "Generate HPKP Pin (SHA-256)",
    description: "Extract the SPKI SHA-256 fingerprint from a certificate file.",
    cmd: () => `openssl x509 -in certificate.pem -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64`
  },
  {
    title: "Verify Certificate Chain",
    description: "Verify a certificate against an intermediate bundle.",
    cmd: () => `openssl verify -CAfile intermediate.pem cert.pem`
  },
  {
    title: "View Certificate Details",
    description: "Print text details of a PEM certificate.",
    cmd: () => `openssl x509 -in certificate.pem -text -noout`
  },
  {
    title: "Check Certificate Expiry",
    description: "Check the end date of a remote certificate.",
    cmd: (domain: string) => `echo | openssl s_client -servername ${domain || 'example.com'} -connect ${domain || 'example.com'}:443 2>/dev/null | openssl x509 -noout -dates`
  }
];

export const CommandGen: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <label className="block text-sm font-bold text-slate-400 mb-2">Target Domain (Optional)</label>
        <input 
          type="text" 
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="e.g., google.com"
          className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:border-cyan-500 focus:outline-none"
        />
      </div>

      <div className="grid gap-6">
        {commands.map((item, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden hover:border-slate-600 transition">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
               <div>
                  <h3 className="text-cyan-400 font-bold flex items-center gap-2">
                     <Terminal className="w-4 h-4" /> {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{item.description}</p>
               </div>
            </div>
            <div className="p-4 bg-black/50 relative group">
                <code className="font-mono text-sm text-green-400 break-all block pr-12">
                   {item.cmd(domain)}
                </code>
                <button 
                  onClick={() => copyToClipboard(item.cmd(domain), idx)}
                  className="absolute right-4 top-4 p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition"
                >
                   {copiedIndex === idx ? <Check className="w-4 h-4 text-green-400"/> : <Copy className="w-4 h-4" />}
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};