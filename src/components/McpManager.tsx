import React, { useState } from 'react';
import { McpConnection, McpTool } from '../types';
import { Network, Database, Layers, CheckCircle2, XCircle, Plus, Terminal, RefreshCw, Radio } from 'lucide-react';

interface McpManagerProps {
  connections: McpConnection[];
  onToggle: (id: string) => void;
  onAddConnection: (newConn: Partial<McpConnection>) => void;
}

export default function McpManager({ connections, onToggle, onAddConnection }: McpManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [mcpType, setMcpType] = useState<'docs' | 'google' | 'third-party' | 'custom'>('custom');
  const [toolsInput, setToolsInput] = useState('tool_name: Fetches some details');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Parse simple tools
    const tools: McpTool[] = toolsInput.split('\n')
      .filter(l => l.includes(':'))
      .map(l => {
        const [tName, tDesc] = l.split(':');
        return {
          name: tName.trim().toLowerCase().replace(/\s+/g, '_'),
          description: tDesc.trim(),
          schema: JSON.stringify({ query: 'string' })
        };
      });

    onAddConnection({
      name,
      url: url || 'http://localhost:8000',
      description: desc || 'Custom connected developer assistant.',
      type: mcpType,
      tools: tools.length ? tools : [{ name: 'custom_inspect', description: 'Standard environment inspection', schema: '{}' }]
    });

    setName('');
    setUrl('');
    setDesc('');
    setToolsInput('tool_name: Fetches some details');
    setShowAddForm(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'docs': return Database;
      case 'google': return Network;
      case 'third-party': return Layers;
      default: return Radio;
    }
  };

  return (
    <div id="mcp-manager-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <Radio className="h-4 w-4 text-purple-400 animate-pulse" />
            MCP Connection Hub
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Model Context Protocol registry for documentation and third-party context routing.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 hover:shadow-lg text-white font-medium rounded-lg transition-all flex items-center gap-1 cursor-pointer"
        >
          <Plus className="h-3 w-3" />
          {showAddForm ? 'Cancel' : 'Register MCP'}
        </button>
      </div>

      {showAddForm ? (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4 text-xs">
          <h4 className="text-slate-200 font-semibold uppercase tracking-wider text-[10px]">Add Custom Tool Protocol</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="mcp-name" className="text-slate-400 block font-mono">Server Name</label>
              <input
                id="mcp-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Elasticsearch-MCP"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-purple-500 font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="mcp-url" className="text-slate-400 block font-mono">Endpoint Protocol Endpoint</label>
              <input
                id="mcp-url"
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="http://localhost:8500"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="mcp-type" className="text-slate-400 block font-mono">Channel Classification</label>
              <select
                id="mcp-type"
                value={mcpType}
                onChange={e => setMcpType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-purple-500 font-mono text-xs"
              >
                <option value="custom">custom (General Helper)</option>
                <option value="docs">docs (Developer Code & PDF manuals)</option>
                <option value="google">google (Workspace ecosystem)</option>
                <option value="third-party">third-party (Stripe / Slack / Intercom)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="mcp-desc" className="text-slate-400 block font-mono">Short Description</label>
              <input
                id="mcp-desc"
                type="text"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Custom indices querying engine"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="mcp-tools" className="text-slate-400 block font-mono">Tools Export list (Format - name: description, one per line)</label>
            <textarea
              id="mcp-tools"
              rows={2}
              value={toolsInput}
              onChange={e => setToolsInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-purple-500 font-mono text-[10px]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded transition-all cursor-pointer"
          >
            Connect Interface
          </button>
        </form>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {connections.map((conn) => {
          const Icon = getTypeIcon(conn.type);
          const isConnected = conn.status === 'connected';

          return (
            <div
              id={`mcp-card-${conn.id}`}
              key={conn.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isConnected
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-slate-950/20 border-slate-900/60 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {/* Category Pill */}
                  <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800/60 flex items-center gap-1">
                    <Icon className="h-2.5 w-2.5 text-purple-400" />
                    {conn.type}
                  </span>

                  {/* Status Indicator bubble */}
                  <span className={`flex items-center gap-1 font-mono text-[9px] uppercase font-bold ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Live
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Muted
                      </>
                    )}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-200">{conn.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{conn.description}</p>
                </div>

                {/* Exported Tools List */}
                <div className="space-y-1 border-t border-slate-900 pt-2.5">
                  <span className="text-[9px] text-slate-500 font-mono block uppercase font-semibold">Exposed Tools ({conn.tools.length}):</span>
                  <div className="flex flex-wrap gap-1">
                    {conn.tools.slice(0, 3).map((tool, idx) => (
                      <span key={idx} className="text-[8.5px] bg-slate-900 border border-slate-800/80 rounded py-0.5 px-1.5 text-purple-300 font-mono">
                        {tool.name}
                      </span>
                    ))}
                    {conn.tools.length > 3 && (
                      <span className="text-[8.5px] text-slate-500 font-mono self-center">+{conn.tools.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-900/60 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500 truncate max-w-[120px]">{conn.url}</span>
                <button
                  id={`mcp-toggle-btn-${conn.id}`}
                  onClick={() => onToggle(conn.id)}
                  className={`px-2.5 py-1 rounded text-slate-300 cursor-pointer border transition-colors ${
                    isConnected
                      ? 'bg-amber-950/20 border-amber-800/30 text-amber-300 hover:bg-amber-900/20'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
