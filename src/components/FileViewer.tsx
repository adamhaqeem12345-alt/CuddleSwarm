import { useState } from 'react';
import { WorkspaceFile, AgentRunState } from '../types';
import { FileCode, Play, Terminal, CheckCircle2, ChevronRight, Copy, ExternalLink, RefreshCw } from 'lucide-react';

interface FileViewerProps {
  files: WorkspaceFile[];
  state: AgentRunState;
  onCodeChange?: (path: string, content: string) => void;
}

export default function FileViewer({ files, state, onCodeChange }: FileViewerProps) {
  const [activeFilePath, setActiveFilePath] = useState<string>(files[0]?.path || "src/App.tsx");
  const [copied, setCopied] = useState(false);

  const activeFile = files.find(f => f.path === activeFilePath) || files[0];

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="file-viewer-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[650px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 select-none">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <FileCode className="h-4 w-4 text-purple-400" />
            Active Workspace Sandbox
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time file generation state. Inspect code written by specialized Developer nodes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {copied ? (
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Copied!
            </span>
          ) : (
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-all flex items-center gap-1 cursor-pointer border border-slate-700/80"
              title="Copy code"
            >
              <Copy className="h-3 w-3" />
              Copy Code
            </button>
          )}

          <a 
            href="https://ai.studio/build" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs text-white rounded transition-all flex items-center gap-1 cursor-pointer font-medium"
          >
            Deploy
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        {/* Sidebar file tree */}
        <div id="virtual-file-tree" className="w-[180px] shrink-0 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 flex flex-col">
          <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider mb-2.5 block px-1">Virtual Tree</span>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {files.map(f => {
              const isActive = f.path === activeFilePath;
              return (
                <button
                  id={`file-tree-item-${f.path.replace(/\//g, '-')}`}
                  key={f.path}
                  onClick={() => setActiveFilePath(f.path)}
                  className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-mono transition-all flex items-center gap-2 cursor-pointer ${
                    isActive 
                      ? 'bg-purple-950/20 border-l-2 border-purple-500 text-purple-300 font-semibold' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-300'
                  }`}
                >
                  <FileCode className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-600'}`} />
                  <span className="truncate">{f.name}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-900 text-[10px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Framework:</span>
              <span className="text-slate-400 font-bold">React 19</span>
            </div>
            <div className="flex justify-between">
              <span>Tailwind:</span>
              <span className="text-slate-400 font-bold">v4.0</span>
            </div>
          </div>
        </div>

        {/* Code Content View */}
        <div className="flex-1 flex flex-col bg-[#05070f] rounded-xl border border-slate-800 overflow-hidden min-h-0">
          {activeFile ? (
            <>
              <div className="bg-[#0b0f19] px-4 py-2 border-b border-slate-800/80 flex items-center justify-between select-none shrink-0">
                <span className="text-[10px] font-mono text-slate-400">{activeFile.path}</span>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 uppercase tracking-wide">
                  {activeFile.language}
                </span>
              </div>
              <pre className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-950/60 scrollbar-thin select-text">
                <code>{activeFile.content}</code>
              </pre>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center font-mono text-xs">
              <RefreshCw className="h-8 w-8 text-slate-600 animate-spin mb-3" />
              Empty workspace state. Submit a CLI command to begin scripting.
            </div>
          )}
        </div>
      </div>

      {/* QA Verification Report Panel */}
      {state.qaReport && (
        <div id="qa-verification-panel" className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="h-4 w-4" />
              QA Gatekeeper Verification Pass Checklist
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl">{state.qaReport}</p>
          </div>
          <div className="text-right shrink-0 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] text-slate-400 block uppercase font-sans">Final Quality Score</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">{state.qaScore ?? '98'}/100</span>
          </div>
        </div>
      )}
    </div>
  );
}
