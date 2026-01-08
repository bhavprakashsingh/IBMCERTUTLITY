import React, { useState } from 'react';
import { Tab } from './types';
import { CertLab } from './components/CertLab';
import { KeyMatcher } from './components/KeyMatcher';
import { CommandGen } from './components/CommandGen';
import { DomainIntel } from './components/DomainIntel';
import { Shield, Terminal, Layers, KeyRound, Globe } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.LAB);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-cyan-900 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-900/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
               <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">IBMSRE-CertMaster</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">SSL/TLS Toolkit</p>
            </div>
          </div>
          
          <nav className="flex gap-1">
             <button
               onClick={() => setActiveTab(Tab.LAB)}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === Tab.LAB ? 'bg-cyan-900/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
             >
               <Layers className="w-4 h-4" /> Cert Lab
             </button>
             <button
               onClick={() => setActiveTab(Tab.MATCHER)}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === Tab.MATCHER ? 'bg-cyan-900/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
             >
               <KeyRound className="w-4 h-4" /> Key Matcher
             </button>
             <button
               onClick={() => setActiveTab(Tab.DOMAIN_INTEL)}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === Tab.DOMAIN_INTEL ? 'bg-cyan-900/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
             >
               <Globe className="w-4 h-4" /> Domain Intel
             </button>
             <button
               onClick={() => setActiveTab(Tab.COMMANDS)}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === Tab.COMMANDS ? 'bg-cyan-900/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
             >
               <Terminal className="w-4 h-4" /> Commands
             </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-8 h-[calc(100vh-64px)] overflow-hidden">
        {activeTab === Tab.LAB && <CertLab />}
        {activeTab === Tab.MATCHER && <div className="h-full overflow-y-auto"><KeyMatcher /></div>}
        {activeTab === Tab.DOMAIN_INTEL && <div className="h-full overflow-y-auto"><DomainIntel /></div>}
        {activeTab === Tab.COMMANDS && <div className="h-full overflow-y-auto"><CommandGen /></div>}
      </main>
    </div>
  );
}