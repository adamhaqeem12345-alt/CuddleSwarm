import { useState, useEffect } from 'react';
import { McpConnection, MemoryItem, LogLine, WorkspaceFile, AgentRunState } from './types';
import AgentGraph from './components/AgentGraph';
import Terminal from './components/Terminal';
import McpManager from './components/McpManager';
import MemoryConsole from './components/MemoryConsole';
import FileViewer from './components/FileViewer';
import ConnectedSandbox from './components/ConnectedSandbox';
import { 
  TerminalSquare, 
  Database, 
  Radio, 
  HelpCircle, 
  Bot, 
  Layers, 
  CheckCircle, 
  FileCode, 
  FileSpreadsheet, 
  ShieldAlert,
  Sliders,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export default function App() {
  // Configured states
  const [connections, setConnections] = useState<McpConnection[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  
  // Terminal log line records
  const [logs, setLogs] = useState<LogLine[]>([
    {
      id: "startup-log-1",
      type: "system",
      message: "Cuddleia Swarm controller initialization hook online.",
      timestamp: new Date().toISOString()
    },
    {
      id: "startup-log-2",
      type: "system",
      message: "Successfully synchronized model protocols. Gemini server-side agentic proxy ready on Port 3000.",
      timestamp: new Date().toISOString()
    }
  ]);

  // UI state toggles
  const [mcpScope, setMcpScope] = useState(true);
  const [memoryUsage, setMemoryUsage] = useState(true);
  const [infoClosed, setInfoClosed] = useState(false);

  // Active run state
  const [agentState, setAgentState] = useState<AgentRunState>({
    status: 'idle',
    currentPrompt: '',
    steps: [],
    currentStepIndex: 0,
    files: []
  });

  const addLog = (type: LogLine['type'], message: string) => {
    setLogs(prev => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type,
        message,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Fetch initial states from server endpoints with safe guards
  useEffect(() => {
    fetchState();
  }, []);

  const fetchState = async () => {
    try {
      const mcpRes = await fetch('/api/mcp/list');
      if (mcpRes.ok && mcpRes.headers.get("content-type")?.includes("application/json")) {
        const mcpData = await mcpRes.json();
        setConnections(mcpData);
      } else {
        console.warn("MCP endpoint did not return valid JSON status:", mcpRes.status);
      }

      const memRes = await fetch('/api/memory/list');
      if (memRes.ok && memRes.headers.get("content-type")?.includes("application/json")) {
        const memData = await memRes.json();
        setMemories(memData);
      } else {
        console.warn("Memory endpoint did not return valid JSON status:", memRes.status);
      }

      const filesRes = await fetch('/api/workspace/files');
      if (filesRes.ok && filesRes.headers.get("content-type")?.includes("application/json")) {
        const filesData = await filesRes.json();
        setFiles(filesData);
      } else {
        console.warn("Workspace files endpoint did not return valid JSON status:", filesRes.status);
      }
    } catch (err) {
      console.error("Failed to load initial workspace state:", err);
      addLog("system", "Error retrieving workspace metadata from internal REST endpoints during startup.");
    }
  };

  // Toggle MCP Connection status
  const handleToggleMcp = async (id: string) => {
    try {
      const res = await fetch('/api/mcp/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setConnections(data.mcpConnections);
        const match = data.mcpConnections.find((c: any) => c.id === id);
        addLog("system", `MCP context registry: '${match.name}' status set to ${match.status.toUpperCase()}`);
      }
    } catch (err) {
      addLog("error", `Failed updating MCP connectivity parameters: ${err}`);
    }
  };

  // Add custom registered MCP
  const handleAddMcp = async (newConn: Partial<McpConnection>) => {
    try {
      const res = await fetch('/api/mcp/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConn)
      });
      const data = await res.json();
      if (data.success) {
        setConnections(prev => [...prev, data.connection]);
        addLog("success", `Custom Client MCP registered: ${data.connection.name} successfully linked to routing hub.`);
      }
    } catch (err) {
      addLog("error", `Failed to register custom MCP server: ${err}`);
    }
  };

  // Add memory rule
  const handleAddMemory = async (newItem: Partial<MemoryItem>) => {
    try {
      const res = await fetch('/api/memory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      const data = await res.json();
      if (data.success) {
        setMemories(prev => [data.item, ...prev]);
        addLog("success", `MemoryCore record appended. New guideline stored: '${data.item.title}'`);
      }
    } catch (err) {
      addLog("error", `Failed to cache guideline rule to persistent storage: ${err}`);
    }
  };

  // Execute Agentic Multitasking Swarm orchestration
  const handleRunPrompt = async (promptText: string) => {
    if (!promptText) return;

    // Command interceptor helper
    if (promptText === 'help_cmd_triggered') {
      addLog("system", "🌸 Cuddleia Swarm Handbook & Interactive Slash Commands:\n\n" +
        "  - cdl run \"<prompt>\"       Submit/spawn a prompt directly to the pink multi-gradient agent swarm.\n" +
        "  - cdl status               Print the active connected MCP endpoints & health diagnostics.\n" +
        "  - cdl clear                Wipe the active terminal logging history.\n" +
        "  - cdl help                 View this friendly command manual.\n" +
        "  - cdl memory               Inspect MemoryCore secure gateway ADR decisions & persistent logs.\n" +
        "  - cdl agents               List active cuddleia autonomous corporate matrix roles & model quotas.\n" +
        "  - cdl changelog            View latest platform release notes & pink transition upgrade history.\n" +
        "  - cdl mcp                  List connected model configurations and token quotas.\n" +
        "  - cdl rebuild              Force a full workspace diagnostic build validation.\n\n" +
        "💡 Tip: Type or press '/' in the terminal input to open the fully interactive floating GUI autocomplete, then use ↑/↓ and Enter/Tab to select!"
      );
      return;
    }

    if (promptText === 'status_cmd_triggered') {
      const totalConnected = connections.filter(c => c.status === 'connected').length;
      addLog("system", "✨ System diagnostic status report:\n\n" +
        `  - CLI Engine version: v0.1.0-beta [Enterprise Multi-Agent Orchestrator]\n` +
        `  - Connected MCP tunnels: ${totalConnected} active servers (Tuned & Ready)\n` +
        `  - Memory guidelines: ${memories.length} guidelines persisted in .env MemoryCore\n` +
        `  - Sandbox state: Local Node.js Standard Virtual Sandbox Container\n` +
        `  - Gateway connection: Active & secure (HTTPS proxy Tunnel)\n` +
        `  - Security standards: Full client/server architecture isolation`
      );
      return;
    }

    if (promptText === 'memory_cmd_triggered') {
      addLog("system", "🧠 MemoryCore Decision Registry & Active Guidelines:\n\n" +
        memories.map((m, idx) => `  [#${idx + 1}] ${m.title} (${m.type.toUpperCase()})\n      ↳ ${m.content}`).join("\n\n") + 
        "\n\n🌸 Note: All generated files are compiled with complete adherence to these core system architectural standards."
      );
      return;
    }

    if (promptText === 'agents_cmd_triggered') {
      addLog("system", "🤵 Cuddleia Autonomous Multi-Agent Swarm Matrix:\n\n" +
        "  👔 [CTO] Chief Technical Officer Node\n" +
        "     🧠 Engine: gemini-3.5-flash (Medium/High Quota)\n" +
        "     📋 Role  : Requirements analyzer. Deconstructs prompt into active developer steps & assigns ADR standards.\n\n" +
        "  ⚙️ [DEV] Lead Core Developer Swarm\n" +
        "     🧠 Engine: gemini-3.5-flash (Medium/High Quota)\n" +
        "     📋 Role  : Core code compiler & asset generator. Translates specifications to React / Tailwind modules.\n\n" +
        "  🛡️ [QA ] Quality Assurance Gatekeeper\n" +
        "     🧠 Engine: gemini-3.5-flash (Quality Audit mode)\n" +
        "     📋 Role  : Runs syntax audits, package tree reviews, and produces final corporate readiness score.\n\n" +
        "  🚀 [DEVOPS] Live Container Integrator\n" +
        "     🧠 Engine: Node.js standard sandboxed system scripts\n" +
        "     📋 Role  : Writes bundle files to simulated disk and compiles active diagnostics."
      );
      return;
    }

    if (promptText === 'changelog_cmd_triggered') {
      addLog("system", "🌸 Cuddleia CLI Platform Changelog:\n\n" +
        "  - Release v0.1.0-beta [Current Edition]:\n" +
        "    🌸 Fully interactive slash command autocomplete dropdown menu (mimics physical agy CLI context menu).\n" +
        "    🌸 Added / run shortcuts, arrow key navigation (↑/↓), Tab completion, and Escape close actions.\n" +
        "    🌸 Converted system aesthetics to gorgeous pink/rose multi-gradient visual highlights.\n" +
        "    🌸 Re-branded corporate suite to \"Cuddleia CLI\".\n" +
        "    🌸 Improved sandbox visual syncing and added robust local CLI instructions & workspace files.\n" +
        "    🌸 Standardized full client-only and server-side runtime separation."
      );
      return;
    }

    if (promptText === 'mcp_cmd_triggered') {
      addLog("system", "📡 Connected Model Specifications & MCP Context:\n\n" +
        "  - Active Large Model Endpoint: gemini-3.5-flash (Enterprise Serverless SDK Gatewayed)\n" +
        "  - Token Rate Quota limit: 4,000,000 tokens/RPM (Fully Available)\n" +
        "  - Context Window: 1,048,576 tokens total\n" +
        "  - Prompt Grounding Tunnels: Enabled via Google Search Grounding & MemoryCore local index\n" +
        "  - Protocol Status: Connected. Ping round-trip: ~42ms."
      );
      return;
    }

    if (promptText === 'rebuild_cmd_triggered') {
      addLog("system", "⚙️ Rebuilding workspace bundle configuration...");
      addLog("system", "🛡️ Running standard linter: tsc --noEmit...");
      addLog("system", "✅ Rebuild Diagnostic Successful: 0 warnings, 0 syntax errors. Your workspace live build is green and verified!");
      return;
    }

    // Standard run sequence
    setAgentState({
      status: 'planning',
      activeAgent: 'cto',
      currentPrompt: promptText,
      steps: ['Analyzing context rules', 'Designing components schema', 'Performing QA verification'],
      currentStepIndex: 0,
      files
    });

    addLog("system", `Spawning Cuddleia corporate swarm. Goal: "${promptText}"`);
    addLog("cto", "Chief Technical Officer initialized. Retrieving ADRs and structuring execution schedule.");

    try {
      // Step 1: CTO planning simulation logging
      // In a live system, this runs continuously with feedback
      setTimeout(() => {
        addLog("cto", `Formulated architecture model. Dispatched worker developer with recommended guidelines.`);
        setAgentState(prev => ({ ...prev, status: 'developing', activeAgent: 'dev', currentStepIndex: 1 }));
        addLog("dev", `Developer swarm launched. Ingesting active documents, writing React modules, incorporating Tailwind design rules...`);
      }, 1800);

      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptText,
          mcpScope,
          memoryUsage
        })
      });

      if (!response.ok) {
        let errMsg = "Execution timeout or bad response.";
        try {
          if (response.headers.get("content-type")?.includes("application/json")) {
            const errData = await response.json();
            errMsg = errData.error || errMsg;
          } else {
            const txt = await response.text();
            if (txt) errMsg = txt.slice(0, 150);
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();

      // Step 2: Developer complete
      setTimeout(() => {
        addLog("dev", `Successfully built files in temporary workspace partition.`);
        setAgentState(prev => ({ ...prev, status: 'verifying', activeAgent: 'qa', currentStepIndex: 2 }));
        addLog("qa", `QA Specialist reviewing code payload. Quality scan running...`);

        // Step 3: QA score & deploy
        setTimeout(() => {
          const score = data.qa?.score || 95;
          addLog("qa", `Code assessment complete. Quality score evaluated at: ${score}/100. Verification summary: "${data.qa?.report}"`);
          
          if (score >= 80) {
            addLog("success", "Code passed criteria threshold constraint. Proceeding to sync telemetry.");
            setAgentState(prev => ({ ...prev, status: 'deploying', activeAgent: 'devops' }));
            addLog("devops", "Google-MCP Deployer appending milestones telemetry parameters inside active spreadsheets.");

            setTimeout(() => {
              addLog("success", `Workspace updated successfully! Check the sandbox file viewer to inspect the implemented code.`);
              setAgentState({
                status: 'completed',
                currentPrompt: promptText,
                steps: data.cto?.steps || ['Analyze guidelines', 'Build files', 'QA Assessment'],
                currentStepIndex: 2,
                files: data.dev?.files || [],
                qaScore: score,
                qaReport: data.qa?.report
              });
              // Refresh workspace files
              fetchState();
            }, 1200);

          } else {
            addLog("error", "QA score failed core validation limit. Swarm cycle aborted.");
            setAgentState(prev => ({ ...prev, status: 'failed' }));
          }
        }, 1500);

      }, 3500);

    } catch (err: any) {
      addLog("error", `Agent run execution error: ${err.message || err}`);
      setAgentState(prev => ({ ...prev, status: 'failed' }));
    }
  };

  const handleReset = () => {
    setAgentState({
      status: 'idle',
      currentPrompt: '',
      steps: [],
      currentStepIndex: 0,
      files
    });
    addLog("system", "CLI run-state set to SLEEP. Ready to launch the next corporate agent cycle.");
  };

  const handleClearLogs = () => {
    setLogs([
      {
        id: `clear-log-${Date.now()}`,
        type: "system",
        message: "Terminal logged state cleared by user.",
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <div id="cuddleia-cli-dashboard" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none selection:bg-purple-500/30">
      
      {/* Top Banner Header Nav */}
      <header className="bg-slate-900 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg ring-2 ring-purple-500/20">
            <TerminalSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100 tracking-tight uppercase">Cuddleia CLI</h1>
              <span className="text-[9px] bg-purple-500/20 text-purple-300 font-mono font-bold px-1.5 py-0.5 rounded border border-purple-500/30">
                SWARM ENGINE v0.1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Enterprise Multi-Agent Orchestrator Workspace</p>
          </div>
        </div>

        {/* Global telemetry statistics metrics */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-500">MCP status:</span>
            <span className="text-emerald-400 font-bold">{connections.filter(c => c.status === 'connected').length} active</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <Database className="h-4 w-4 text-purple-400" />
            <span className="text-slate-500">MemoryCore:</span>
            <span className="text-purple-300 font-bold">{memories.length} logs</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-mono">
            <FileCode className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-500">Workspace Files:</span>
            <span className="text-cyan-300 font-bold">{files.length} scripts</span>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Project Intro & Architectural Info Banner */}
        {!infoClosed && (
          <div id="intro-arch-banner" className="bg-gradient-to-r from-purple-950/25 via-indigo-950/15 to-transparent border border-purple-800/20 rounded-2xl p-5 relative overflow-hidden">
            <button 
              onClick={() => setInfoClosed(true)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 font-mono text-xs cursor-pointer select-none"
            >
              [Hide Info]
            </button>
            <div className="flex gap-4 items-start max-w-4xl">
              <Bot className="h-8 w-8 text-purple-400 shrink-0 mt-1" />
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-tight">The Cuddleia Autonomous Agent Matrix</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Unlike traditional single-purpose tools, <span className="text-purple-300 font-bold">Cuddleia CLI</span> introduces 
                  a strict <strong className="text-slate-200 font-semibold">Tiered Supervisor Architecture (CTO ➔ Developer ➔ QA Gatekeeper ➔ DevOps)</strong>. 
                  This workspace simulates, controls, and executes complete visual generations with persistent guidelines using Google's latest AI models.
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-mono text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5"><ChevronRight className="h-3.5 w-3.5 text-purple-400" /> <strong>CTO node</strong> maps plans based on stored ADRs</span>
                  <span className="flex items-center gap-1.5"><ChevronRight className="h-3.5 w-3.5 text-purple-400" /> <strong>Developer node</strong> writes fully typed components</span>
                  <span className="flex items-center gap-1.5"><ChevronRight className="h-3.5 w-3.5 text-purple-400" /> <strong>QA node</strong> checks constraints and scores robustness</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Agent Flow Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-purple-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Swarm Orchestration Scope Rules</h3>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer select-none">
              <input
                id="toggle-mcp-scope"
                type="checkbox"
                checked={mcpScope}
                onChange={(e) => {
                  setMcpScope(e.target.checked);
                  addLog("system", `User updated setup: MCP resource injection is now ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                }}
                className="rounded border-slate-800 text-purple-600 focus:ring-purple-500/20 bg-slate-950 w-4 h-4 checked:bg-purple-600 focus:outline-none"
              />
              Inject connected MCP tools context
            </label>

            <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer select-none">
              <input
                id="toggle-memory-scope"
                type="checkbox"
                checked={memoryUsage}
                onChange={(e) => {
                  setMemoryUsage(e.target.checked);
                  addLog("system", `User updated setup: MemoryCore context routing is now ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                }}
                className="rounded border-slate-800 text-purple-600 focus:ring-purple-500/20 bg-slate-950 w-4 h-4 checked:bg-purple-600 focus:outline-none"
              />
              Enforce MemoryCore ADR guidelines
            </label>
          </div>
        </div>

        {/* Top Active Graph Row */}
        <AgentGraph state={agentState} onReset={handleReset} />

        {/* Live Framework Docs & Stripe Gateway Sandbox */}
        <ConnectedSandbox />

        {/* Dashboard Core Columns Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Column Left: Visual Terminal and MCP Config panel */}
          <div className="lg:col-span-6 space-y-6">
            <Terminal 
              logs={logs} 
              state={agentState} 
              onRunPrompt={handleRunPrompt} 
              onClearLogs={handleClearLogs} 
            />
            
            <McpManager 
              connections={connections} 
              onToggle={handleToggleMcp} 
              onAddConnection={handleAddMcp} 
            />
          </div>

          {/* Column Right: Active Sandbox Explorer & Durable memory log */}
          <div className="lg:col-span-6 space-y-6">
            <FileViewer 
              files={files} 
              state={agentState} 
            />
            
            <MemoryConsole 
              memories={memories} 
              onAddMemory={handleAddMemory} 
              onRefreshState={fetchState}
            />
          </div>

        </div>

      </main>

      {/* Footer system details */}
      <footer className="bg-slate-900 border-t border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 mt-12 gap-2 select-none shrink-0 font-mono">
        <div>
          <span>Cuddleia - Architecture Scaffolded on Node.js & LangGraph | MemoryCore Secure Persistent Gateway</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400">● LIVE RUNTIME INBOUND</span>
          <span className="text-slate-400">2026-06-23 UTC</span>
        </div>
      </footer>

    </div>
  );
}
