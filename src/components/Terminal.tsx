import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Send, TerminalSquare, AlertCircle, Sparkles } from 'lucide-react';
import { LogLine, AgentRunState } from '../types';

interface TerminalProps {
  logs: LogLine[];
  state: AgentRunState;
  onRunPrompt: (prompt: string) => void;
  onClearLogs: () => void;
}

interface CommandSuggestion {
  cmd: string;
  desc: string;
}

const COMMAND_SUGGESTIONS: CommandSuggestion[] = [
  { cmd: '/run', desc: 'Submit a swarming task to generate files and run build cycles' },
  { cmd: '/status', desc: 'Print active cloud sandbox connected MCP tunnels & status' },
  { cmd: '/clear', desc: 'Wipe current terminal log console history cleanly' },
  { cmd: '/memory', desc: 'Inspect active MemoryCore ADR standard decision records' },
  { cmd: '/help', desc: 'Browse full list of available CLI commands & shortcuts' },
  { cmd: '/agents', desc: 'List active autonomous robotic corporate nodes (CTO, Dev, QA)' },
  { cmd: '/changelog', desc: 'Show latest releases, upgrades, and platform commits log' },
  { cmd: '/mcp', desc: 'Detail workspace large model gateway rate limits & quotas' },
  { cmd: '/rebuild', desc: 'Force a full syntax checker linter run on current partition' }
];

export default function Terminal({ logs, state, onRunPrompt, onClearLogs }: TerminalProps) {
  const [inputVal, setInputVal] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const logScrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal to the bottom when new logs come in
  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Suggestion filtering
  const isSlash = inputVal.startsWith('/');
  const filteredSuggestions = COMMAND_SUGGESTIONS.filter(item =>
    item.cmd.toLowerCase().startsWith(inputVal.toLowerCase())
  );

  useEffect(() => {
    if (isSlash && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
      setSelectedIndex(prev => Math.min(prev, filteredSuggestions.length - 1));
    } else {
      setShowSuggestions(false);
      setSelectedIndex(0);
    }
  }, [inputVal, isSlash, filteredSuggestions.length]);

  const handleSelectSuggestion = (suggestion: CommandSuggestion) => {
    if (suggestion.cmd === '/run') {
      setInputVal('cdl run "');
    } else {
      setInputVal(suggestion.cmd + ' ');
    }
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredSuggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[selectedIndex]);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    const lowerCmd = cmd.toLowerCase();
    if (cmd.startsWith('/') || lowerCmd.startsWith('cuddleia') || lowerCmd.startsWith('cdl')) {
      // It's a special system command or run prompt
      const cleaned = cmd.replace(/^\/\s*|^cuddleia\s*|^cdl\s*/i, '').trim();
      const cleanedLower = cleaned.toLowerCase();

      if (!cleaned || cleanedLower === 'help') {
        onRunPrompt('help_cmd_triggered');
      } else if (cleanedLower === 'clear') {
        onClearLogs();
      } else if (cleanedLower.startsWith('run ')) {
        const promptText = cleaned.slice(4).trim();
        onRunPrompt(promptText || 'help_cmd_triggered');
      } else if (cleanedLower === 'status') {
        onRunPrompt('status_cmd_triggered');
      } else if (cleanedLower === 'memory') {
        onRunPrompt('memory_cmd_triggered');
      } else if (cleanedLower === 'agents') {
        onRunPrompt('agents_cmd_triggered');
      } else if (cleanedLower === 'changelog') {
        onRunPrompt('changelog_cmd_triggered');
      } else if (cleanedLower === 'mcp') {
        onRunPrompt('mcp_cmd_triggered');
      } else if (cleanedLower === 'rebuild') {
        onRunPrompt('rebuild_cmd_triggered');
      } else if (cleaned) {
        // Assume default runner
        onRunPrompt(cleaned);
      }
    } else {
      // Default to agent build execution prompt
      onRunPrompt(cmd);
    }
    setInputVal('');
    setShowSuggestions(false);
  };

  const selectShortcut = (prompt: string) => {
    setInputVal(`cdl run ${prompt}`);
  };

  return (
    <div id="cuddleia-terminal-container" className="bg-[#0b0f19] border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px] shadow-2xl relative">
      {/* Header bar */}
      <div className="bg-[#111827] border-b border-slate-800 px-4 py-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 block"></span>
          </div>
          <TerminalIcon className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-mono font-bold text-slate-300">cuddleia-cli@swarm-workspace:~</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-500">PORT 3000 (INGRESS)</span>
          <button
            onClick={onClearLogs}
            className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-800 hover:bg-slate-700 hover:text-slate-200 text-slate-400 rounded border border-slate-700/80 transition-colors"
          >
            Clear Console
          </button>
        </div>
      </div>

      {/* Terminal body */}
      <div 
        id="cuddleia-log-scroller"
        ref={logScrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-2 text-slate-300 bg-slate-950/70"
      >
        {/* Welcome Banner */}
        <div className="mb-4 font-bold select-none leading-tight border-b border-slate-800/60 pb-3">
          <div className="text-pink-500 text-[10px] sm:text-xs mb-2 select-none tracking-tight font-mono">
            🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺
          </div>
          <pre className="bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-450 bg-clip-text text-transparent leading-none mb-2 select-text font-mono font-bold text-[10px] sm:text-xs overflow-x-auto">
{`   _____          _     _ _      _                
  / ____|        | |   | | |    (_)               
 | |    _   _  __| | __| | | ___ _  __ _          
 | |   | | | |/ _\` |/ _\` | |/ _ \\ |/ _\` |         
 | |___| |_| | (_| | (_| | |  __/ | (_| |         
  \\_____\\__,_|\\__,_|\\__,_|_|\\___|_|\\__,_|`}
          </pre>
          <div className="text-rose-500 text-[10px] sm:text-xs mt-1 mb-2 select-none tracking-tight font-mono">
            🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺
          </div>
          <div className="flex items-center gap-1.5 text-xs text-pink-300 mt-2 font-mono">
            <span className="animate-bounce">🌸</span>
            <span className="font-bold bg-gradient-to-r from-pink-300 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent">Cuddleia Multi-Agent CLI Suite [v0.1.0-beta]</span>
            <span className="animate-pulse">💖</span>
          </div>
          <p className="text-[10px] text-slate-400 font-normal mt-1 leading-relaxed">
            Active Workspace Sandbox Engine: Node.js standard runtime.<br />
            Powered by model: <span className="text-pink-400 font-bold">gemini-3.5-flash (Server-Side Serverless Gateway)</span><br />
            Type <span className="text-rose-400 font-semibold">cuddleia help</span> (or <span className="text-pink-400 font-semibold">cdl</span>) to browse workspace control parameters.
          </p>
        </div>

        {/* Stream of active execution logs */}
        {logs.map((log) => {
          let lineClass = "text-slate-300";
          let label = "💬";

          switch (log.type) {
            case "system":
              lineClass = "text-slate-500 font-bold";
              label = "⚡ [SYS]";
              break;
            case "cto":
              lineClass = "text-amber-400 font-medium";
              label = "👨‍💻 [CTO]";
              break;
            case "dev":
              lineClass = "text-purple-300";
              label = "⚙️ [DEV]";
              break;
            case "qa":
              lineClass = "text-emerald-400";
              label = "🛡️ [QA ]";
              break;
            case "devops":
              lineClass = "text-cyan-400";
              label = "🚀 [DEVOPS]";
              break;
            case "error":
              lineClass = "text-rose-400 font-bold bg-rose-500/5 px-1 rounded";
              label = "❌ [ERROR]";
              break;
            case "success":
              lineClass = "text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded";
              label = "✅ [SUCCESS]";
              break;
          }

          return (
            <div key={log.id} className="flex gap-2.5 items-start py-0.5 hover:bg-slate-900/40 px-1.5 rounded transition-all">
              <span className="text-slate-600 select-none text-[9px] mt-0.5">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
              </span>
              <span className={`font-semibold shrink-0 select-none ${lineClass.split(' ')[0]}`}>{label}</span>
              <div className={`flex-1 whitespace-pre-wrap leading-relaxed ${lineClass}`}>{log.message}</div>
            </div>
          );
        })}

        {/* Loader during active wait cycles */}
        {state.status !== "idle" && state.status !== "completed" && state.status !== "failed" && (
          <div className="flex flex-col gap-2 mt-4 py-3 px-4 bg-pink-500/5 rounded-xl border border-pink-500/15 max-w-md select-none">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5 text-base">
                <span className="animate-[bounce_0.8s_infinite_100ms] inline-block">🌸</span>
                <span className="animate-[bounce_0.8s_infinite_200ms] inline-block">💖</span>
                <span className="animate-[bounce_0.8s_infinite_300ms] inline-block">🌺</span>
                <span className="animate-[bounce_0.8s_infinite_400ms] inline-block">💕</span>
              </div>
              <span className="text-xs font-bold tracking-widest bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-450 bg-clip-text text-transparent uppercase animate-pulse font-mono">
                Cuddleia Swarm Activating...
              </span>
            </div>
            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 rounded-full animate-[pulse_1.2s_infinite] w-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Fast Shortcuts Panel */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5 select-none text-[10px]">
        <span className="text-pink-400 font-semibold mr-1 font-mono uppercase text-[9px] flex items-center gap-1">
          <span className="animate-spin text-xs">🌸</span> Fast Shortcuts:
        </span>
        <button
          onClick={() => selectShortcut('"Build a beautiful task ledger SPA with glassmorphism styling and clean streaks tracker"')}
          className="px-2.5 py-1 bg-pink-950/10 hover:bg-pink-950/20 text-pink-200 hover:text-pink-100 font-mono rounded transition-all cursor-pointer border border-pink-500/20"
        >
          Task Ledger SPA
        </button>
        <button
          onClick={() => selectShortcut('"Create a cute cat mood calculator with responsive mood sounds, animated emojis, and advice log"')}
          className="px-2.5 py-1 bg-pink-950/10 hover:bg-pink-950/20 text-pink-200 hover:text-pink-100 font-mono rounded transition-all cursor-pointer border border-pink-500/20"
        >
          Emoji Mood App
        </button>
        <button
          onClick={() => selectShortcut('"Design a sleek matrix clock dashboard showing global standard times and system telemetry logs"')}
          className="px-2.5 py-1 bg-pink-950/10 hover:bg-pink-950/20 text-pink-200 hover:text-pink-100 font-mono rounded transition-all cursor-pointer border border-pink-500/20"
        >
          Telemetry Dashboard
        </button>
      </div>

      {/* Autocomplete floating suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute bottom-[54px] left-4 right-4 bg-[#0a0d16]/96 backdrop-blur-md rounded-xl border border-pink-500/25 shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-2 z-40 font-mono text-[11px] overflow-hidden">
          <div className="max-h-[150px] overflow-y-auto">
            {filteredSuggestions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.cmd}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-4 py-2 transition-all duration-100 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-500/15 to-transparent border-l-2 border-pink-550 text-slate-100 font-bold'
                      : 'text-slate-400 hover:bg-slate-900/60 border-l-2 border-transparent'
                  }`}
                >
                  <span className={`text-pink-400 font-bold ${isSelected ? 'scale-[1.01] text-pink-300' : ''}`}>
                    {item.cmd}
                  </span>
                  <span className="text-slate-500 text-[10px] truncate max-w-[70%] select-none">
                    {item.desc}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Menu Legend bar at the bottom */}
          <div className="px-4 py-1.5 border-t border-slate-800/60 bg-slate-950/80 text-[9px] text-slate-500 flex items-center justify-between select-none">
            <span className="flex items-center gap-1.5">
              <span className="text-pink-500/80">🕹️ Legend:</span>
              <span className="text-slate-400 font-medium">↑/↓ Navigate</span>
              <span className="text-slate-700">•</span>
              <span className="text-slate-400 font-medium">enter Select</span>
              <span className="text-slate-700">•</span>
              <span className="text-slate-400 font-medium">tab Complete</span>
              <span className="text-slate-700">•</span>
              <span className="text-slate-400 font-medium">esc Cancel</span>
            </span>
            <span className="text-[9px] font-bold text-pink-400/85 animate-pulse">cdl workspace v0.1.0</span>
          </div>
        </div>
      )}

      {/* Terminal Input Box with agy custom style */}
      <div className="border-t border-slate-800 bg-[#0d111d] p-3 flex flex-col gap-2 relative z-10 selection:bg-pink-500/30">
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5 bg-[#070a13] border border-pink-500/25 focus-within:border-pink-500/50 rounded-lg px-3 py-2 transition-all shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]">
          <label htmlFor="terminal-cli-input" className="text-pink-400 font-bold text-xs select-none font-mono flex items-center gap-1 shrink-0">
            <span className="text-pink-300 font-bold select-none">&gt;</span>
          </label>
          <input
            id="terminal-cli-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your prompt here or /help ..."
            disabled={state.status !== 'idle' && state.status !== 'completed' && state.status !== 'failed'}
            className="flex-1 bg-transparent font-mono text-[11px] text-slate-100 outline-none border-none placeholder-slate-600 disabled:text-slate-500 disabled:cursor-not-allowed"
            autoFocus
            autoComplete="off"
          />
          <button
            id="terminal-cli-submit-btn"
            type="submit"
            disabled={!inputVal.trim() || (state.status !== 'idle' && state.status !== 'completed' && state.status !== 'failed')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 hover:text-pink-300 text-slate-300 disabled:bg-slate-900 disabled:text-slate-700 text-[10px] font-mono transition-all shrink-0 cursor-pointer border border-slate-700/50"
          >
            Enter
          </button>
        </form>
        
        {/* agy status footer bar */}
        <div className="flex items-center justify-between text-[10px] font-mono select-none px-1 text-slate-500">
          <button 
            type="button"
            onClick={() => onRunPrompt('help_cmd_triggered')}
            className="hover:text-pink-400 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none text-left font-mono"
          >
            <span className="text-pink-500/80 text-[11px]">?</span> for shortcuts
          </button>
          
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400 font-medium">Gemini 3.5 Flash (Medium Cache)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
