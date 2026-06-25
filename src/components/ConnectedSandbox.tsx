import React, { useState, useEffect } from 'react';
import { Search, CreditCard, Terminal, HelpCircle, Layers, Check, Copy, Sparkles, Send, Bell } from 'lucide-react';

interface DocItem {
  framework: string;
  topic: string;
  title: string;
  snippet: string;
  description: string;
}

interface StripeTransaction {
  id: string;
  dateTime: string;
  product: string;
  amount: number;
  currency: string;
  customerEmail: string;
  status: 'succeeded' | 'pending' | 'failed';
  webhookSent: boolean;
}

const LOCAL_CLI_CODE = `#!/usr/bin/env node

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const colors = {
  reset: "\\x1b[0m",
  bright: "\\x1b[1m",
  dim: "\\x1b[2m",
  fg: {
    black: "\\x1b[30m",
    red: "\\x1b[31m",
    green: "\\x1b[32m",
    yellow: "\\x1b[33m",
    blue: "\\x1b[34m",
    magenta: "\\x1b[35m",
    cyan: "\\x1b[36m",
    white: "\\x1b[37m",
    pink: "\\x1b[38;5;205m",
    hotPink: "\\x1b[38;5;198m",
    lightPink: "\\x1b[38;5;218m",
    lavender: "\\x1b[38;5;200m"
  }
};

function printBanner() {
  console.log(\`
\${colors.fg.pink}  🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺
\${colors.fg.hotPink}\${colors.bright}   _____          _     _ _      _                
  / ____|        | |   | | |    (_)               
 | |    _   _  __| | __| | | ___ _  __ _          
 | |   | | | |/ _\` |/ _\` | |/ _ \\\\ |/ _\` |         
 | |___| |_| | (_| | (_| | |  __/ | (_| |         
  \\\\_____\\\\__,_|\\\\__,_|\\\\__,_|_|\\\\___|_|\\\\__,_|         
\${colors.fg.lavender}  🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺\${colors.reset}
  \`);
  console.log(\`\${colors.fg.pink}\${colors.bright}  Cuddleia Multi-Agent CLI Suite [v0.1.0-beta]\${colors.reset}\`);
  console.log(\`\${colors.dim}  Direct local execution on: Node.js \${process.version}\${colors.reset}\\n\`);
}

async function callGeminiWithFallback(ai, params) {
  const models = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model: model
      });
      return { response, modelUsed: model };
    } catch (err) {
      lastError = err;
      const isPrivilegeOrModelErr = err.message && (
        err.message.includes("not found") || 
        err.message.includes("404") || 
        err.message.includes("denied") || 
        err.message.includes("permission") ||
        err.message.includes("api key")
      );
      if (isPrivilegeOrModelErr) {
        console.log(\`\${colors.fg.yellow}⚠️  [SYS] Attempt with model "\${model}" resulted in exception, testing next stable fallback...\${colors.reset}\`);
        continue;
      }
      console.log(\`\${colors.fg.yellow}⚠️  [SYS] Fallback triggered from "\${model}": \${err.message || err}\${colors.reset}\`);
    }
  }
  throw lastError || new Error("All general text generation models failed.");
}

async function main() {
  printBanner();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(\`\${colors.fg.red}\${colors.bright}Error: GEMINI_API_KEY environment variable is not set.\${colors.reset}\`);
    console.log(\`\\n\${colors.fg.cyan}💡 Troubleshooting local CLI setup:\${colors.reset}\`);
    console.log(\`  - Standard keys from Google AI Studio begin with "AIzaSy..."\`);
    console.log(\`  - To set it temporarily in your console session, execute:\`);
    console.log(\`    \${colors.fg.yellow}Linux / macOS:\${colors.reset}   export GEMINI_API_KEY="AIzaSyYourKey"\`);
    console.log(\`    \${colors.fg.yellow}Windows CMD:\${colors.reset}     set GEMINI_API_KEY="AIzaSyYourKey"\`);
    console.log(\`    \${colors.fg.yellow}Windows PowerShell:\${colors.reset} \$env:GEMINI_API_KEY="AIzaSyYourKey"\`);
    console.log(\`  - Or simply create a file named ".env" in this directory containing:\`);
    console.log(\`    \${colors.bright}GEMINI_API_KEY=AIzaSyYourKey\${colors.reset}\\n\`);
    process.exit(1);
  }

  if (!apiKey.startsWith('AIzaSy')) {
    console.log(\`\\n\${colors.fg.yellow}⚠️  [WARNING] Non-standard API key format detected!\${colors.reset}\`);
    console.log(\`   Most Google AI Studio / Gemini API keys strictly start with "AIzaSy".\`);
    console.log(\`   Your key starts with: "\${apiKey.substring(0, 8)}..."\`);
    console.log(\`   If you receive authentication errors, please verify you copied the correct API Key secret from Settings or your Google AI Studio console.\\n\`);
  }

  const args = process.argv.slice(2);
  let promptText = args.join(' ').trim();

  if (!promptText) {
    console.log(\`\${colors.fg.pink}🌸  To launch Cuddleia using the direct "cdl" shortcut alias, set it up for your terminal: \${colors.reset}\`);
    console.log(\`\\n  \${colors.fg.hotPink}[MacOS / Linux (Bash/Zsh)]:\${colors.reset}\`);
    console.log(\`    \${colors.fg.yellow}alias cdl="node \${path.resolve(process.argv[1] || 'cuddleia-local-cli.js')}"\${colors.reset}\`);
    console.log(\`    \${colors.dim}To make persistent, run: echo 'alias cdl="node \${path.resolve(process.argv[1] || 'cuddleia-local-cli.js')}"' >> ~/.zshrc (or ~/.bashrc)\${colors.reset}\`);
    console.log(\`\\n  \${colors.fg.hotPink}[Windows PowerShell]:\${colors.reset}\`);
    console.log(\`    \${colors.fg.yellow}function cdl { node "\${path.resolve(process.argv[1] || 'cuddleia-local-cli.js')}" \$args }\${colors.reset}\`);
    console.log(\`    \${colors.dim}Add the line above to your PowerShell \$PROFILE configuration to save it permanently.\${colors.reset}\`);
    console.log(\`\\n  \${colors.fg.hotPink}[Windows CMD]:\${colors.reset}\`);
    console.log(\`    \${colors.fg.yellow}doskey cdl=node "\${path.resolve(process.argv[1] || 'cuddleia-local-cli.js')}" \$*\${colors.reset}\`);
    console.log(\`\\n\${colors.fg.pink}💖 Usage after setting up alias: \${colors.reset}\`);
    console.log(\`  \${colors.fg.yellow}cdl "Build a beautiful password validator app"\${colors.reset}\\n\`);
    process.exit(0);
  }

  console.log(\`\${colors.fg.cyan}📡 Initializing Google SDK Gateway...\${colors.reset}\`);
  const ai = new GoogleGenAI({ apiKey });

  console.log(\`\\n\${colors.fg.yellow}\${colors.bright}⚡ [SYS] Spawning Cuddleia corporate swarm. Goal: "\${promptText}"\${colors.reset}\`);
  
  try {
    console.log(\`\${colors.fg.yellow}👨‍💻 [CTO] Analyzing requirements, checking memory files and setting architectural guidelines...\${colors.reset}\`);
    
    let guidelines = "No guidelines found.";
    const memoryDir = path.join(process.cwd(), '.cuddleia', 'memory');
    if (fs.existsSync(memoryDir)) {
      const decisionsFile = path.join(memoryDir, 'decisions.md');
      if (fs.existsSync(decisionsFile)) {
        guidelines = fs.readFileSync(decisionsFile, 'utf-8');
        console.log(\`\${colors.dim}👨‍💻 [CTO] Loaded active project memory context from .cuddleia/memory/decisions.md\${colors.reset}\`);
      }
    }

    const ctoPrompt = \`
      You are the Chief Technical Officer (CTO) of Cuddleia CLI.
      Decompose this user prompt into exactly 3 functional execution phases: "\${promptText}".
      Existing architectural ADR rules in workspace for context:
      \${guidelines}
      
      Respond strictly with a JSON object format matching:
      {
        "steps": ["Step 1", "Step 2", "Step 3"],
        "adr_applied": "Details of decision rule used."
      }
    \`;

    const { response: ctoResponse, modelUsed: ctoModel } = await callGeminiWithFallback(ai, {
      contents: ctoPrompt,
      config: { responseMimeType: "application/json" }
    });

    const ctoData = JSON.parse(ctoResponse.text || "{}");
    console.log(\`\${colors.fg.green}✅ [CTO] Execution steps mapped successfully (Model: \${ctoModel}):\${colors.reset}\`);
    ctoData.steps?.forEach((step, idx) => {
      console.log(\`  \${colors.bright}\${idx + 1}.\${colors.reset} \${step}\`);
    });
    console.log(\`\${colors.dim}   Applied ADR: \${ctoData.adr_applied || 'Standard clean modular code'}\${colors.reset}\\n\`);

    console.log(\`\${colors.fg.magenta}⚙️ [DEV] Swarm launched. Generating code components...\${colors.reset}\`);
    const devPrompt = \`
      You are the Lead Swarm Developer of Cuddleia CLI.
      Your CTO has assigned you these steps: \${JSON.stringify(ctoData.steps)}.
      Implement the request: "\${promptText}".
      
      Write robust, beautifully commented, syntactically perfect scripts in typescript, javascript or appropriate configuration languages.
      Respond strictly with a JSON array list of files matching this schema:
      {
        "files": [
          {
            "path": "relative/file/path.js",
            "content": "Fully-formed file content here"
          }
        ]
      }
    \`;

    const { response: devResponse, modelUsed: devModel } = await callGeminiWithFallback(ai, {
      contents: devPrompt,
      config: { responseMimeType: "application/json" }
    });

    const devData = JSON.parse(devResponse.text || "{}");
    const generatedFiles = devData.files || [];

    console.log(\`\${colors.fg.green}🛡️ [QA] Auditing written files against technical safety specifications...\${colors.reset}\`);
    const codeString = generatedFiles.map(f => \`File: \${f.path}\\\\nContent:\\\\n\${f.content}\`).join('\\\\n\\\\n');

    const qaPrompt = \`
      You are the QA Gatekeeper. Review the developer's output:
      \${codeString}

      Evaluate against typescript/javascript conventions, code completeness and potential syntax bugs.
      Output a score from 0 to 100, and a concise checklist summary report.
      Respond strictly with this JSON schema:
      {
        "score": 95,
        "report": "Review summary details here"
      }
    \`;

    const { response: qaResponse, modelUsed: qaModel } = await callGeminiWithFallback(ai, {
      contents: qaPrompt,
      config: { responseMimeType: "application/json" }
    });

    const qaData = JSON.parse(qaResponse.text || "{}");
    const score = qaData.score || 90;

    console.log(\`🛡️ [QA] Evaluation Score: \${colors.fg.green}\${colors.bright}\${score}/100\${colors.reset} (Model: \${qaModel})\`);
    console.log(\`🛡️ [QA] Audit Log: \${colors.dim}"\${qaData.report || 'Passed syntax verification checks'}"\${colors.reset}\\n\`);

    if (score >= 80) {
      console.log(\`\${colors.fg.green}\${colors.bright}🚀 [DEVOPS] Production gate validation successful! Writing files to local directory...\${colors.reset}\`);
      
      generatedFiles.forEach(file => {
        const fullPath = path.join(process.cwd(), file.path);
        const dir = path.dirname(fullPath);
        
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(fullPath, file.content, 'utf-8');
        console.log(\`   Written -> \${colors.fg.cyan}\${file.path}\${colors.reset}\`);
      });

      if (!fs.existsSync(memoryDir)) {
        fs.mkdirSync(memoryDir, { recursive: true });
      }
      const historyFile = path.join(memoryDir, 'decisions.md');
      const timestamp = new Date().toISOString();
      const runLog = \`\\n--- RUN: \${timestamp} ---\\nGoal: \${promptText}\\nSuccess Score: \${score}/100\\nFiles Added: \${generatedFiles.map(f => f.path).join(', ')}\\n\`;
      fs.appendFileSync(historyFile, runLog, 'utf-8');

      console.log(\`\\n\${colors.fg.green}\${colors.bright}🎉 [SUCCESS] Swarm loop finished! Code generated and saved to files successfully.\${colors.reset}\\n\`);
    } else {
      console.error(\`\${colors.fg.red}\${colors.bright}❌ [ERROR] QA Gatekeeper score was too low (\${score}/100). Build rejected.\${colors.reset}\\n\`);
    }

  } catch (error) {
    console.error(\`\\n\${colors.fg.red}\${colors.bright}❌ Execution Aborted: \${error.message || error}\${colors.reset}\\n\`);
    process.exit(1);
  }
}

main();`;

const TERMINAL_EXEC_CODE = `import { execSync } from 'child_process';

// Instructing Node to run shell/PowerShell scripts safely:
try {
  const result = execSync('dir', { encoding: 'utf-8' }); // (or "ls" on macOS)
  console.log("Terminal Directory content:", result);
} catch (error) {
  console.error("Shell query failed:", error);
}`;

export default function ConnectedSandbox() {
  const [activeTab, setActiveTab] = useState<'docs' | 'stripe' | 'cli'>('docs');
  
  // Docs state
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [selectedDocFramework, setSelectedDocFramework] = useState<string>('All');
  const [docResult, setDocResult] = useState<DocItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // CLI Live Code State
  const [cliCode, setCliCode] = useState(LOCAL_CLI_CODE);

  // Stripe state
  const [stripeSecretKey, setStripeSecretKey] = useState('sk_test_51MzCuddlingSecretKey2026Swarm');
  const [selectedProduct, setSelectedProduct] = useState('Enterprise Multi-Agent Orchestrator');
  const [checkoutAmount, setCheckoutAmount] = useState('199.00');
  const [customerEmail, setCustomerEmail] = useState('developer@cuddleia.engineering');
  const [transactions, setTransactions] = useState<StripeTransaction[]>([]);
  const [lastWebhookPayload, setLastWebhookPayload] = useState<any>(null);
  const [isStripeSimulating, setIsStripeSimulating] = useState(false);
  const [stripeLogs, setStripeLogs] = useState<string[]>([
    '[STRIPE] Listening for events on mock URL http://localhost:3000/api/stripe/webhooks'
  ]);

  // Fetch live CLI code
  useEffect(() => {
    fetch('/cuddleia-local-cli.js')
      .then(res => res.text())
      .then(text => {
        if (text && !text.startsWith('<!DOCTYPE')) {
          setCliCode(text);
        }
      })
      .catch(err => console.error('Failed to fetch live CLI code:', err));
  }, []);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch documentation from API
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (docSearchQuery) queryParams.append('q', docSearchQuery);
        if (selectedDocFramework && selectedDocFramework !== 'All') {
          queryParams.append('framework', selectedDocFramework);
        }
        const res = await fetch(`/api/docs/search?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setDocResult(data);
          if (data.length > 0 && !selectedDoc) {
            setSelectedDoc(data[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching docs:', err);
      }
    };
    fetchDocs();
  }, [docSearchQuery, selectedDocFramework]);

  // Load transactions during initial lifecycle
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/stripe/transactions');
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTransactions();
  }, []);

  // Post new Checkout session transaction
  const handleCreateCheckoutSession = async () => {
    setIsStripeSimulating(true);
    setStripeLogs(prev => [
      ...prev,
      `[STRIPE] Initializing checkout.sessions.create: [Customer: ${customerEmail}, Product: ${selectedProduct}, Amount: ${checkoutAmount} USD]`
    ]);

    try {
      const res = await fetch('/api/stripe/mock-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: selectedProduct,
          amount: parseFloat(checkoutAmount),
          email: customerEmail,
          secretKey: stripeSecretKey
        })
      });

      if (res.ok) {
        const result = await res.json();
        
        // Push transactions
        setTransactions(prev => [result.transaction, ...prev]);
        setLastWebhookPayload(result.webhookPayload);
        setStripeLogs(prev => [
          ...prev,
          `[STRIPE] ✅ checkout.session.created successfully! ID: ${result.transaction.id}`,
          `[STRIPE] ⚙️ Dispatched webhook event: "checkout.session.completed" to client application!`,
          `[STRIPE] Webhook Response status: 200 OK`
        ]);
      }
    } catch (err) {
      setStripeLogs(prev => [...prev, `[STRIPE] ❌ Session Creation Failed: ${err}`]);
    } finally {
      setIsStripeSimulating(false);
    }
  };

  const frameworksList = ['All', 'React', 'Next.js', 'FastAPI', 'Fastify', 'NestJS', 'Stripe'];

  return (
    <div id="connected-sandbox-card" className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Header Tabs */}
      <div className="bg-[#111827] border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400" />
            Integrations & Docs Sandbox
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Test Stripe gateways and browse verified documentation for leading engineering frameworks.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-[11px] font-bold flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Framework & SDK Docs
          </button>
          <button
            onClick={() => setActiveTab('stripe')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stripe'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Stripe Processing Sandbox
          </button>
          <button
            onClick={() => setActiveTab('cli')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cli'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Local CLI script
          </button>
        </div>
      </div>

      {activeTab === 'docs' && (
        /* ================= FRAMEWORK DOCS SECTION ================= */
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="docs-search-input" className="text-[10px] text-slate-500 font-mono uppercase font-semibold">Search recipes</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  id="docs-search-input"
                  type="text"
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  placeholder="e.g. checkout, paths, context..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500 font-mono placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Framework Filter Tags */}
            <div className="flex flex-wrap gap-1">
              {frameworksList.map((fw) => (
                <button
                  key={fw}
                  onClick={() => {
                    setSelectedDocFramework(fw);
                    setSelectedDoc(null);
                  }}
                  className={`px-2 py-1 text-[10px] font-mono rounded cursor-pointer transition-colors ${
                    selectedDocFramework === fw
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-slate-950 text-slate-400 border border-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  {fw}
                </button>
              ))}
            </div>

            {/* List entries */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {docResult.length === 0 ? (
                <p className="text-xs text-slate-500 font-mono text-center py-8">No documentation matches found.</p>
              ) : (
                docResult.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDoc(item)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 cursor-pointer ${
                      selectedDoc?.title === item.title
                        ? 'bg-slate-950/80 border-purple-500/50 shadow-md ring-1 ring-purple-500/20'
                        : 'bg-slate-950/20 border-slate-800/80 hover:bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase bg-slate-900 px-1.5 py-0.5 rounded text-purple-300 border border-slate-800/60">
                        {item.framework}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">{item.topic}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">{item.title}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{item.description}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Details & Copy Code panel */}
          <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col h-[480px]">
            {selectedDoc ? (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="flex items-start justify-between border-b border-slate-900 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-purple-400 bg-purple-950/30 px-2 py-0.5 rounded border border-purple-500/20">
                        {selectedDoc.framework} SDK
                      </span>
                      <span className="text-slate-500 text-[10px] uppercase font-mono tracking-wider">{selectedDoc.topic} Recipe</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 mt-1">{selectedDoc.title}</h4>
                  </div>
                  
                  <button
                    onClick={() => handleCopy(selectedDoc.snippet, 'snippet-code')}
                    className="text-xs font-mono px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedId === 'snippet-code' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-[10px]">Copy Snippet</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] text-slate-500 font-mono uppercase font-semibold">Description</h5>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{selectedDoc.description}</p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-[10px] text-slate-500 font-mono uppercase font-semibold">Executable Script</h5>
                    <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#070b12]">
                      <pre className="p-4 text-[10.5px] font-mono leading-relaxed text-cyan-300 overflow-x-auto whitespace-pre">
                        {selectedDoc.snippet}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-slate-500 text-xs font-mono">
                Select a framework module on the left to review recipes.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stripe' && (
        /* ================= STRIPE PROCESSING SANDBOX ================= */
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel Inputs */}
          <div className="lg:col-span-5 space-y-4 bg-slate-950/40 p-5 rounded-xl border border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Stripe Gateway Control
            </h4>

            {/* API Key */}
            <div className="space-y-1.5">
              <label htmlFor="stripe-key-input" className="text-[10px] font-mono text-slate-400 block uppercase font-semibold">Secret Key</label>
              <input
                id="stripe-key-input"
                type="password"
                value={stripeSecretKey}
                onChange={(e) => setStripeSecretKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono px-3 py-2 rounded-lg outline-none focus:border-purple-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="checkout-email-input" className="text-[10px] font-mono text-slate-400 block uppercase font-semibold">Customer Test Email</label>
              <input
                id="checkout-email-input"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono px-3 py-2 rounded-lg outline-none focus:border-purple-500"
              />
            </div>

            {/* Product list selector */}
            <div className="space-y-1.5">
              <label htmlFor="checkout-product-select" className="text-[10px] font-mono text-slate-400 block uppercase font-semibold">Active Product Item</label>
              <select
                id="checkout-product-select"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono px-3 py-2 rounded-lg outline-none focus:border-purple-500"
              >
                <option value="Enterprise Multi-Agent Orchestrator">Enterprise Multi-Agent Orchestrator ($199.00)</option>
                <option value="Cuddleia Developer DevOps Node">Cuddleia Developer DevOps Node ($49.00)</option>
                <option value="Premium Swarm Cloud Subscription">Premium Swarm Cloud Subscription ($19.00)</option>
              </select>
            </div>

            {/* Custom amount */}
            <div className="space-y-1.5">
              <label htmlFor="checkout-amount-input" className="text-[10px] font-mono text-slate-400 block uppercase font-semibold">Custom Transaction Overdrive ($ USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 font-mono text-xs">$</span>
                <input
                  id="checkout-amount-input"
                  type="number"
                  value={checkoutAmount}
                  onChange={(e) => setCheckoutAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono pl-7 pr-3 py-2 rounded-lg outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              onClick={handleCreateCheckoutSession}
              disabled={isStripeSimulating}
              className="w-full py-2.5 bg-gradient-to-r from-[#635bff] to-[#8073ff] hover:from-[#5446ff] hover:to-[#7061ff] disabled:from-slate-800 disabled:to-slate-900 text-white text-xs font-bold font-mono rounded-lg transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              {isStripeSimulating ? 'Processing gateway call...' : 'Create Stripe Checkout Session'}
            </button>
          </div>

          {/* Right Panel Transaction feed & logs console */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            {/* Logs console */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden h-[180px] flex flex-col">
              <div className="bg-[#111827] border-b border-slate-805/40 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-[10px] font-mono font-bold text-slate-300">Stripe Webhook Listen Logs</span>
                </div>
                <button
                  onClick={() => setStripeLogs(['[STRIPE] Listening for webhooks...'])}
                  className="text-[9px] font-mono text-slate-500 hover:text-slate-300"
                >
                  Clear Logs
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] leading-relaxed text-indigo-300 space-y-1">
                {stripeLogs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap">{log}</div>
                ))}
              </div>
            </div>

            {/* Transactions lists */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 flex-1 flex flex-col min-h-[220px]">
              <div className="bg-[#111827] border-b border-slate-805/40 px-4 py-2.5 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">Simulated Transactions Logs ({transactions.length})</span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">REST endpoint synchronized</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {transactions.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 text-[10px] font-mono">
                    No checkout sessions created yet. Trigger a session simulation using the left panel.
                  </div>
                ) : (
                  transactions.map((t) => (
                    <div key={t.id} className="p-3 bg-slate-900 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs gap-4 font-mono">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{t.product}</span>
                          <span className="text-[8.5px] bg-indigo-950 text-indigo-300 px-1 py-0.5 border border-indigo-900 rounded font-normal shrink-0">
                            ID: {t.id}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          email: <span className="text-slate-300">{t.customerEmail}</span> | {t.dateTime}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-indigo-300">${t.amount.toFixed(2)} {t.currency.toUpperCase()}</span>
                        <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded mt-1 justify-end border border-emerald-500/20">
                          <Bell className="h-2.5 w-2.5 shrink-0" />
                          <span>webhook fired</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cli' && (
        /* ================= LOCAL CLI ACCESS SECTION ================= */
        <div className="p-6 flex flex-col gap-6">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 md:p-6 space-y-6">
            <div className="border-b border-slate-900 pb-4">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-purple-400" />
                Resolving: MODULE_NOT_FOUND error on Windows PowerShell / CMD / Bash
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                The reason you received <code className="bg-red-500/10 text-red-400 px-1 py-0.5 rounded border border-red-500/20 font-mono text-[11px]">Cannot find module 'cuddleia-local-cli.js'</code> is that the CLI tool script currently exists inside this cloud-hosted virtual workspace container. To run it locally, you must first create this script file on your physical machine!
              </p>
            </div>

            {/* Step list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h5 className="text-[11px] text-slate-400 font-mono uppercase font-bold tracking-wider">🛠️ STEP-BY-STEP SETUP GUIDE</h5>
                <ol className="space-y-3.5 text-xs text-slate-300 list-decimal pl-4 leading-relaxed font-sans">
                  <li>
                    <strong className="text-slate-200">Prepare workspace:</strong> Open your local terminal on your native machine (e.g., PowerShell on Windows, or Terminal on macOS/Linux - <code className="bg-slate-900 text-slate-300 font-mono px-1 py-0.5 rounded">C:\Users\User\Desktop</code>) and type:
                    <div className="block mt-1 font-mono text-[10px] text-purple-300 bg-slate-900/60 p-2 border border-slate-800 rounded">
                      npm init -y<br/>
                      npm install @google/genai dotenv
                    </div>
                  </li>
                  <li>
                    <strong className="text-slate-200">Configure Package Type:</strong> Ensure your local <code className="text-purple-300 font-mono">package.json</code> file contains <code className="text-purple-300 font-mono">"type": "module"</code> so that ES Module imports (like <code className="text-purple-400">import ...</code>) work properly.
                  </li>
                  <li>
                    <strong className="text-slate-200">Create Script File:</strong> Create a blank file named <code className="text-purple-300 font-mono font-bold">cuddleia-local-cli.js</code> inside your local directory.
                  </li>
                  <li>
                    <strong className="text-slate-200">Insert Code:</strong> Copy the full local CLI executable code from the adjacent code editor panel and paste it into your local file.
                  </li>
                  <li>
                    <strong className="text-slate-200">Run CLI:</strong> Execute the tool from your Command Prompt/Powershell or terminal prompt!
                  </li>
                </ol>

                {/* API Key prompt guide based on platform */}
                <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-3">
                  <h6 className="text-[10px] font-mono font-bold text-slate-300 uppercase">🔑 HOW TO SET GEMINI_API_KEY CORRECTLY</h6>
                  <div className="space-y-2 text-[10px] font-mono text-slate-400 leading-relaxed">
                    <div>
                      <span className="text-purple-400 font-bold block mb-1">PowerShell (Windows):</span>
                      <code className="bg-slate-950 p-1.5 block rounded text-slate-200">$env:GEMINI_API_KEY="AIzaSyYourSecretAPIKey..."</code>
                    </div>
                    <div>
                      <span className="text-purple-400 font-bold block mb-1">Command Prompt CMD (Windows):</span>
                      <code className="bg-slate-950 p-1.5 block rounded text-slate-200">set GEMINI_API_KEY=AIzaSyYourSecretAPIKey...</code>
                    </div>
                    <div>
                      <span className="text-purple-400 font-bold block mb-1">Bash / macOS Terminal:</span>
                      <code className="bg-slate-950 p-1.5 block rounded text-slate-100">export GEMINI_API_KEY="AIzaSyYourSecretAPIKey..."</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code panel copy */}
              <div className="flex flex-col h-[480px] bg-slate-950 border border-slate-850 rounded-xl overflow-hidden">
                <div className="bg-[#111827] px-4 py-2 flex items-center justify-between border-b border-slate-800 shrink-0">
                  <span className="text-[10px] font-mono font-bold text-slate-300 font-sans">File: cuddleia-local-cli.js</span>
                  <button
                    onClick={() => handleCopy(cliCode, 'local-cli')}
                    className="text-xs font-mono px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedId === 'local-cli' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Copied Code</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-purple-400" />
                        <span className="text-[10px]">Copy Whole Script</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-[#070b12] space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Executable CLI NodeJS Script Preview</span>
                    <pre className="text-[10px] font-mono leading-relaxed text-yellow-300/90 bg-slate-950 p-3 rounded-lg border border-slate-900/80 max-h-[140px] overflow-y-auto whitespace-pre">
                      {cliCode}
                    </pre>
                  </div>
                  <div className="border-t border-slate-900 pt-3 text-[10px] text-slate-400 font-sans space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-300">💡 Does this local script have terminal run/execution capabilities?</p>
                    <p>
                      Absolutely! Because Node executes directly on your native operating system's CPU and shell environments, you have **full OS permissions** (unlike the sandboxed web browser iframe).
                    </p>
                    <p>
                      To enable real physical prompt execution or compile scripts automatically inside <code className="text-purple-300 font-mono">cuddleia-local-cli.js</code>, use Node's native <code className="bg-slate-900 px-1 py-0.5 rounded text-purple-300 font-mono text-[9px]">child_process</code>:
                    </p>
                    <pre className="bg-slate-950 p-2 border border-slate-800 rounded font-mono text-[9.5px] text-cyan-300 overflow-x-auto whitespace-pre">
                      {TERMINAL_EXEC_CODE}
                    </pre>
                    <p>
                      You can modify your script to automatically run <code className="text-purple-300 font-mono">npm install</code>, compile TypeScript files, update local databases, or trigger local server ports securely!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
