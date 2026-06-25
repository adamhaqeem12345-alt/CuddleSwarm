import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Code, User, FileSpreadsheet, Bot, ArrowRight, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AgentRunState } from '../types';

interface AgentGraphProps {
  state: AgentRunState;
  onReset: () => void;
}

export default function AgentGraph({ state, onReset }: AgentGraphProps) {
  const nodes = [
    {
      id: 'user',
      label: 'User Request',
      icon: User,
      role: 'Prompt Input',
      color: 'from-blue-500 to-indigo-600',
      active: state.status !== 'idle' && !state.activeAgent,
    },
    {
      id: 'cto',
      label: 'CTO (Architect)',
      icon: Bot,
      role: 'Task Decomposer',
      color: 'from-amber-500 to-orange-600',
      active: state.activeAgent === 'cto' || state.status === 'planning',
    },
    {
      id: 'dev',
      label: 'Developer (Coder)',
      icon: Code,
      role: 'Implementation',
      color: 'from-purple-500 to-pink-600',
      active: state.activeAgent === 'dev' || state.status === 'developing',
    },
    {
      id: 'qa',
      label: 'QA (Gatekeeper)',
      icon: ShieldCheck,
      role: 'Verification',
      color: 'from-emerald-500 to-teal-600',
      active: state.activeAgent === 'qa' || state.status === 'verifying',
    },
    {
      id: 'devops',
      label: 'Google-MCP Deployer',
      icon: FileSpreadsheet,
      role: 'Telemetry & Git',
      color: 'from-cyan-500 to-blue-600',
      active: state.activeAgent === 'devops' || state.status === 'deploying',
    },
  ];

  const getStatusText = () => {
    switch (state.status) {
      case 'idle': return 'System Idle. Input a prompt to launch the swarm!';
      case 'planning': return 'CTO Agent is formulating architecture, checking memory ADRs and building the 3-step schedule...';
      case 'developing': return 'Developer Swarm is actively scripting React modules and matching components...';
      case 'verifying': return 'QA Specialist is vetting code compliance, auditing typescript compilation and verifying layouts...';
      case 'deploying': return 'DevOps Agent is logging telemetry data in Google Sheets and queuing code commits...';
      case 'completed': return 'Run Completed! All quality parameters validated. Repo is green and deployed.';
      case 'failed': return 'Run Aborted. Quality metrics did not meet the corporate standard.';
      case 'hitl': return 'Human-in-the-Loop pending. Waiting for technical supervisor confirmation...';
      default: return 'Cuddleia swarming...';
    }
  };

  return (
    <div id="cuddleia-agent-graph" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Absolute faint background matrix element */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_60%)] pointer-events-none" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 tracking-tight uppercase flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${state.status !== 'idle' && state.status !== 'completed' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${state.status !== 'idle' && state.status !== 'completed' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            LangGraph Swarm Routing
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Orchestrator Mode: {state.status === 'idle' ? 'STANDBY' : 'AUTONOMOUS RECURSIVE GRAPHS'}
          </p>
        </div>

        {state.status !== 'idle' && (
          <button
            id="reset-swarm-btn"
            onClick={onReset}
            className="text-xs font-mono px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className="h-3 w-3" />
            Reset State
          </button>
        )}
      </div>

      {/* Nodes visual timeline row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
        {nodes.map((node, index) => {
          const Icon = node.icon;
          return (
            <React.Fragment key={node.id}>
              <div
                id={`node-${node.id}`}
                className={`relative flex flex-col items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                  node.active
                    ? 'bg-slate-800/90 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] translate-y-[-2px]'
                    : 'bg-slate-950/40 border-slate-800 opacity-60'
                }`}
              >
                {/* Ping active ring */}
                {node.active && (
                  <div className="absolute inset-x-0 -top-px h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                )}

                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${node.color} text-white mb-3 shadow-md`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="text-center">
                  <h4 className="text-xs font-semibold text-slate-200">{node.label}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{node.role}</p>
                </div>

                {/* Micro indicators under nodes */}
                <div className="mt-3 flex items-center gap-1">
                  {node.id === 'cto' && state.status === 'planning' && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono animate-pulse">PLANNING</span>
                  )}
                  {node.id === 'dev' && state.status === 'developing' && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 font-mono animate-pulse">CODING</span>
                  )}
                  {node.id === 'qa' && state.status === 'verifying' && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono animate-pulse">VERIFYING ({state.qaScore ?? '?'})</span>
                  )}
                  {node.id === 'devops' && state.status === 'deploying' && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-mono animate-pulse">DEPLOYING</span>
                  )}
                  {!node.active && state.status === 'completed' && node.id !== 'user' && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Connecting arrows between nodes, except for last */}
              {index < 4 && (
                <div className="hidden md:flex items-center justify-center text-slate-700 select-none">
                  <ArrowRight className={`h-4 w-4 ${node.active ? 'text-amber-500 animate-pulse' : ''}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Dynamic Swarm Status Line */}
      <div className="mt-5 p-3.5 bg-slate-950/60 border border-slate-800/85 rounded-xl flex items-center gap-3 font-mono text-[11px] leading-relaxed relative z-10">
        {state.status === 'planning' || state.status === 'developing' || state.status === 'verifying' ? (
          <RefreshCw className="h-4 w-4 text-amber-500 animate-spin flex-shrink-0" />
        ) : state.status === 'completed' ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
        ) : state.status === 'failed' ? (
          <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
        ) : (
          <Bot className="h-4 w-4 text-slate-500 flex-shrink-0" />
        )}
        <div className="flex-1 text-slate-300">
          <span className="text-slate-500 mr-1 select-none font-bold">CUDDLEIA_SYS:</span>
          {getStatusText()}
        </div>
        {state.qaScore !== undefined && (
          <div className="text-[10px] bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-emerald-400">
            QA SCORE: <span className="font-bold">{state.qaScore}/100</span>
          </div>
        )}
      </div>
    </div>
  );
}
