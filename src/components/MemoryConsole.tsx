import React, { useState } from 'react';
import { MemoryItem } from '../types';
import { Database, Plus, Search, Calendar, UserCheck, Heart, Sparkles, BookOpen, Layers, Check, AlertCircle } from 'lucide-react';

interface MemoryConsoleProps {
  memories: MemoryItem[];
  onAddMemory: (newItem: Partial<MemoryItem>) => void;
  onRefreshState?: () => void;
}

export default function MemoryConsole({ memories, onAddMemory, onRefreshState }: MemoryConsoleProps) {
  const [activeTab, setActiveTab] = useState<'logs' | 'personalize' | 'diary'>('logs');
  
  // Custom ADR Form states
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'adr' | 'guideline' | 'history'>('adr');

  // Personalization Setup Wizard states
  const [aiName, setAiName] = useState('Sarah');
  const [yourName, setYourName] = useState('John');
  const [relationshipStyle, setRelationshipStyle] = useState('Personal Companion');
  const [personalizeResult, setPersonalizeResult] = useState<string | null>(null);
  const [personalizeLoading, setPersonalizeLoading] = useState(false);

  // Daily Journal chronicler states
  const [diaryTitle, setDiaryTitle] = useState('Workspace Initial Diagnostics');
  const [diaryContent, setDiaryContent] = useState('System fully online. Initializing .ai-memory configurations dynamically.');
  const [diaryResult, setDiaryResult] = useState<string | null>(null);
  const [diaryLoading, setDiaryLoading] = useState(false);

  const handleSubmitADR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onAddMemory({ title, content, type });
    setTitle('');
    setContent('');
    setShowForm(false);
  };

  const handlePersonalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiName.trim() || !yourName.trim()) return;

    setPersonalizeLoading(true);
    setPersonalizeResult(null);
    try {
      const res = await fetch('/api/memory/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiName, yourName, relationshipStyle })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPersonalizeResult(data.message);
        if (onRefreshState) onRefreshState();
      } else {
        setPersonalizeResult(`Error: ${data.error || 'Setup failed'}`);
      }
    } catch (err: any) {
      setPersonalizeResult(`Network failure: ${err.message || err}`);
    } finally {
      setPersonalizeLoading(false);
    }
  };

  const handleSaveDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diaryTitle.trim() || !diaryContent.trim()) return;

    setDiaryLoading(true);
    setDiaryResult(null);
    try {
      const res = await fetch('/api/memory/diary/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: diaryTitle, content: diaryContent })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDiaryResult(data.message);
        setDiaryTitle('');
        setDiaryContent('');
        if (onRefreshState) onRefreshState();
      } else {
        setDiaryResult(`Error: ${data.error || 'Diary save failed'}`);
      }
    } catch (err: any) {
      setDiaryResult(`Network error: ${err.message || err}`);
    } finally {
      setDiaryLoading(false);
    }
  };

  const filteredMemories = memories.filter(item =>
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.content?.toLowerCase().includes(search.toLowerCase()) ||
    item.type?.includes(search.toLowerCase())
  );

  return (
    <div id="memory-console-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Header section with branding */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-400 animate-pulse" />
            Project-AI-MemoryCore
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Universal AI Memory Architecture synced recursively with physical markdown files.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 text-slate-400">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'logs' ? 'bg-purple-600 text-white shadow-md font-bold' : 'hover:text-slate-200'
            }`}
          >
            Memory Logs
          </button>
          <button
            onClick={() => setActiveTab('personalize')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'personalize' ? 'bg-purple-600 text-white shadow-md font-bold' : 'hover:text-slate-200'
            }`}
          >
            🧙‍♂️ Quick Setup
          </button>
          <button
            onClick={() => setActiveTab('diary')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'diary' ? 'bg-purple-600 text-white shadow-md font-bold' : 'hover:text-slate-200'
            }`}
          >
            📝 Daily Diary
          </button>
        </div>
      </div>

      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
            <span className="text-[11px] font-mono text-slate-400">
              Total index nodes: <span className="text-purple-400 font-bold">{memories.length} files loaded</span>
            </span>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              {showForm ? 'Cancel' : 'Record ADR'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmitADR} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4 text-xs font-mono">
              <h4 className="text-slate-200 font-semibold uppercase tracking-wider text-[10px]">Log Permanent Architecture Guideline</h4>
              
              <div className="space-y-1">
                <label htmlFor="mem-title" className="text-slate-400 block font-mono text-[10px]">Decision / Strategy Title</label>
                <input
                  id="mem-title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="ADR-004: Standardize on Lucide icons"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="mem-type" className="text-slate-400 block font-mono text-[10px]">Metric Classification</label>
                  <select
                    id="mem-type"
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-purple-500 text-xs"
                  >
                    <option value="adr">ADR (Architecture Decision Record)</option>
                    <option value="guideline">UX/UI Guideline rule</option>
                    <option value="history">Historical run audit</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="mem-content" className="text-slate-400 block font-mono text-[10px]">Detailed Log Specification</label>
                <textarea
                  id="mem-content"
                  rows={3}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write detailed layout, design rationale, or coding framework patterns here..."
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded transition-all cursor-pointer"
              >
                Commit to MemoryCore
              </button>
            </form>
          )}

          {/* Query Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              id="memory-search-input"
              type="text"
              placeholder="Semantic lookup over MemoryCore logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 outline-none focus:border-purple-500/70 font-mono"
            />
          </div>

          {/* Memory Items Stack */}
          <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {filteredMemories.length === 0 ? (
              <div className="text-center py-6 text-slate-500 font-mono text-xs">
                No cached Memory records found matching "{search}"
              </div>
            ) : (
              filteredMemories.map((item) => (
                <div
                  id={`memory-item-${item.id}`}
                  key={item.id}
                  className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700/80 transition-all text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8.5px] font-bold font-mono px-1.5 py-0.5 rounded uppercase ${
                        item.type === 'adr' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' 
                          : item.type === 'guideline' 
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                      }`}>
                        {item.type}
                      </span>
                      <h4 className="font-semibold text-slate-200">{item.title}</h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 leading-none">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <pre className="text-slate-400 text-[10.5px] leading-relaxed font-mono whitespace-pre-wrap select-text">{item.content}</pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'personalize' && (
        <form onSubmit={handlePersonalize} className="space-y-4 p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-2.5">
            <Sparkles className="h-4 w-4 text-pink-400 animate-pulse" />
            <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">🧙‍♂️ Project-AI-MemoryCore Personalize Wizard</h4>
          </div>
          <p className="text-slate-400 leading-relaxed font-sans select-none">
            Enter target names below. The wizard recursively scans and personalizes <b>master-memory.md</b>, <b>identity-core.md</b>, and <b>relationship-memory.md</b> by replacing placeholder tokens directly in physical space!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="ai-name-input" className="text-slate-400 block font-mono text-[10px]">Step 1: AI Companion Name</label>
              <input
                id="ai-name-input"
                type="text"
                value={aiName}
                onChange={e => setAiName(e.target.value)}
                placeholder="Sarah"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-200 outline-none focus:border-purple-500 font-mono"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="your-name-input" className="text-slate-400 block font-mono text-[10px]">Step 2: Your Name</label>
              <input
                id="your-name-input"
                type="text"
                value={yourName}
                onChange={e => setYourName(e.target.value)}
                placeholder="John"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-200 outline-none focus:border-purple-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="relationship-style-input" className="text-slate-400 block font-mono text-[10px]">Step 3: Relationship Style</label>
            <input
              id="relationship-style-input"
              type="text"
              value={relationshipStyle}
              onChange={e => setRelationshipStyle(e.target.value)}
              placeholder="E.g. Professional Assistant"
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-200 outline-none focus:border-purple-500 font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={personalizeLoading}
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase font-mono tracking-wide"
          >
            {personalizeLoading ? 'Personalizing files...' : 'Execute Template Personalize'}
          </button>

          {personalizeResult && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${
              personalizeResult.startsWith('Error') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              <span className="leading-relaxed font-sans">{personalizeResult}</span>
            </div>
          )}
        </form>
      )}

      {activeTab === 'diary' && (
        <form onSubmit={handleSaveDiary} className="space-y-4 p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-2.5">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">📝 Daily Diary Chronicler</h4>
          </div>
          <p className="text-slate-400 leading-relaxed font-sans select-none">
            Log your daily thoughts and session diagnostic summaries directly as formatted markdown files inside the <b>.ai-memory/daily-diary/</b> workspace folder. This compiles real-time historical journals.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="diary-title-input" className="text-slate-400 block font-mono text-[10px]">Diary Entry Heading</label>
            <input
              id="diary-title-input"
              type="text"
              value={diaryTitle}
              onChange={e => setDiaryTitle(e.target.value)}
              placeholder="E.g. Complete Workspace Setup"
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-200 outline-none focus:border-emerald-500 font-mono"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="diary-content-input" className="text-slate-400 block font-mono text-[10px]">Contextual Details & Summary thoughts</label>
            <textarea
              id="diary-content-input"
              rows={4}
              value={diaryContent}
              onChange={e => setDiaryContent(e.target.value)}
              placeholder="What have you built? What issues were overcome today? Log milestones accurately..."
              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-2 text-slate-200 outline-none focus:border-emerald-500 font-mono leading-relaxed"
              required
            />
          </div>

          <button
            type="submit"
            disabled={diaryLoading}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase font-mono tracking-wide"
          >
            {diaryLoading ? 'Saving log file...' : 'Commit Markdown Entry to Disk'}
          </button>

          {diaryResult && (
            <div className={`p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-2`}>
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-sans">{diaryResult}</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
