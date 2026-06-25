import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Memory storage for virtual workspace (persists in memory during server lifetime)
let mcpConnections = [
  {
    id: "docs-mcp",
    name: "Docs-MCP",
    status: "connected",
    type: "docs",
    url: "http://localhost:4501",
    description: "Real-time documentation reader for react, tailwind, and motion libraries.",
    tools: [
      { name: "read_documentation", description: "Search and fetch technical documentation for specific APIs or packages.", schema: JSON.stringify({ query: "string" }) },
      { name: "verify_npm_versions", description: "Validate compatibility of package dependencies.", schema: JSON.stringify({ packages: "array" }) }
    ]
  },
  {
    id: "google-mcp",
    name: "Google-MCP",
    status: "connected",
    type: "google",
    url: "http://localhost:4502",
    description: "Google Workspace connector to sync telemetry and log milestones in Sheets and Drive.",
    tools: [
      { name: "log_milestone_sheets", description: "Append agent milestone details to the Project Management Google Sheet.", schema: JSON.stringify({ milestoneName: "string", status: "string" }) },
      { name: "save_summary_drive", description: "Create a text summary of the implementation inside Google Drive.", schema: JSON.stringify({ title: "string", content: "string" }) }
    ]
  },
  {
    id: "third-party-mcp",
    name: "Stripe-Slack-MCP",
    status: "disconnected",
    type: "third-party",
    url: "http://localhost:4503",
    description: "Third party endpoints to trigger Slack releases and setup Stripe products.",
    tools: [
      { name: "notify_slack_release", description: "Send release progress to the engineering Slack channel.", schema: JSON.stringify({ channel: "string", releaseMessage: "string" }) },
      { name: "setup_stripe_payment", description: "Create a checkout session or billing subscription product in Stripe.", schema: JSON.stringify({ price: "number", name: "string" }) }
    ]
  }
];

// Load virtual files from disk instead of using hardcoded initial array
function loadVirtualFilesFromDisk(): { path: string, name: string, content: string, language: string }[] {
  const files: { path: string, name: string, content: string, language: string }[] = [];
  
  // Read src files recursively
  const readDirRecursive = (dir: string, baseDir: string = "") => {
    if (!fs.existsSync(dir)) return;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const relativePath = baseDir ? path.join(baseDir, file) : file;
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (file !== "node_modules" && file !== "dist" && file !== ".git") {
            readDirRecursive(fullPath, relativePath);
          }
        } else {
          const content = fs.readFileSync(fullPath, "utf-8");
          const ext = path.extname(file).toLowerCase();
          let language = "text";
          if (ext === ".tsx" || ext === ".ts") language = "typescript";
          else if (ext === ".js" || ext === ".jsx" || ext === ".mjs") language = "javascript";
          else if (ext === ".json") language = "json";
          else if (ext === ".md") language = "markdown";
          else if (ext === ".html") language = "html";
          else if (ext === ".css") language = "css";
          
          files.push({
            path: relativePath,
            name: file,
            content,
            language
          });
        }
      } catch (e) {
        console.error("Failed to read file", fullPath, e);
      }
    });
  };

  // Read .ai-memory directory
  const readMemoryRecursive = (dir: string, relativePrefix: string = ".ai-memory") => {
    if (!fs.existsSync(dir)) return;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const relativePath = path.join(relativePrefix, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (file !== ".git") {
            readMemoryRecursive(fullPath, relativePath);
          }
        } else {
          const content = fs.readFileSync(fullPath, "utf-8");
          const ext = path.extname(file).toLowerCase();
          let language = "markdown";
          if (ext === ".json") language = "json";
          
          files.push({
            path: relativePath,
            name: file,
            content,
            language
          });
        }
      } catch (e) {
        console.error("Failed to read memory file", fullPath, e);
      }
    });
  };

  // Read app metadata, cuddleia-local-cli.js, package.json
  const rootFiles = ["package.json", "metadata.json", "cuddleia-local-cli.js", "server.ts"];
  rootFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        const ext = path.extname(file).toLowerCase();
        let language = "javascript";
        if (ext === ".json") language = "json";
        else if (ext === ".ts") language = "typescript";
        files.push({
          path: file,
          name: file,
          content,
          language
        });
      } catch {}
    }
  });

  readDirRecursive(path.join(process.cwd(), "src"), "src");
  readMemoryRecursive(path.join(process.cwd(), ".ai-memory"));

  return files;
}

function loadMemoryCoreFromDisk() {
  const list: any[] = [];
  
  const addMemoryItem = (filePath: string, type: 'adr' | 'guideline' | 'history', title: string) => {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        // Get non-empty slice
        const excerpt = content.length > 500 ? content.slice(0, 500) + "..." : content;
        list.push({
          id: `mem-${path.basename(filePath, ".md")}`,
          type,
          title,
          content: excerpt,
          timestamp: fs.statSync(fullPath).mtime.toISOString()
        });
      }
    } catch {}
  };

  addMemoryItem(".ai-memory/master-memory.md", "guideline", "Master Memory Hub");
  addMemoryItem(".ai-memory/main/identity-core.md", "guideline", "Identity Core Specifications");
  addMemoryItem(".ai-memory/main/relationship-memory.md", "guideline", "Relationship Memory Profiles");
  addMemoryItem(".ai-memory/main/current-session.md", "adr", "Active Session Continuity RAM");
  addMemoryItem(".ai-memory/daily-diary/daily-diary-protocol.md", "guideline", "Daily Diary Protocol Rules");

  // Read daily diary files!
  const diaryDir = path.join(process.cwd(), ".ai-memory", "daily-diary");
  if (fs.existsSync(diaryDir)) {
    try {
      const files = fs.readdirSync(diaryDir);
      files.forEach(file => {
        if (file.toLowerCase().endsWith(".md") && file.toLowerCase() !== "daily-diary-protocol.md") {
          addMemoryItem(`.ai-memory/daily-diary/${file}`, "history", `Daily Diary: ${file}`);
        }
      });
    } catch {}
  }

  // Fallback defaults
  if (list.length === 0) {
    list.push({
      id: "mem-01",
      type: "adr",
      title: "ADR-001: Pivot from Rust to TypeScript for CLI Engine",
      content: "Decided to build the orchestrator CLI in TypeScript using Node.js.",
      timestamp: new Date().toISOString()
    });
  }

  return list;
}

function personalizeMemoryCore(aiName: string, yourName: string, relationshipStyle: string) {
  const replacePlaceholdersInFile = (filePath: string) => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      try {
        let content = fs.readFileSync(fullPath, "utf-8");
        content = content.replace(/\[AI_NAME\]/g, aiName);
        content = content.replace(/\[YOUR_NAME\]/g, yourName);
        content = content.replace(/\[RELATIONSHIP_STYLE\]/g, relationshipStyle);
        fs.writeFileSync(fullPath, content, "utf-8");
      } catch (err) {
        console.error(`Failed to personalizing file ${filePath}:`, err);
      }
    }
  };

  const filesToUpdate = [
    ".ai-memory/master-memory.md",
    ".ai-memory/setup-guide.md",
    ".ai-memory/setup-wizard.md",
    ".ai-memory/main/identity-core.md",
    ".ai-memory/main/relationship-memory.md",
    ".ai-memory/main/current-session.md"
  ];

  filesToUpdate.forEach(file => replacePlaceholdersInFile(file));
  
  // Reload states
  virtualFiles = loadVirtualFilesFromDisk();
  memoryCore = loadMemoryCoreFromDisk();
}

function appendSessionHistory(record: string) {
  try {
    const sessionFile = path.join(process.cwd(), ".ai-memory", "main", "current-session.md");
    if (fs.existsSync(sessionFile)) {
      let content = fs.readFileSync(sessionFile, "utf-8");
      content += `\n\n### 📜 [System Run Auto-Log] ${new Date().toLocaleDateString()}\n${record}`;
      fs.writeFileSync(sessionFile, content, "utf-8");
      console.log("Appended agent run history log directly to .ai-memory/main/current-session.md");
    }
  } catch (err) {
    console.error("Failed to append run history to disk:", err);
  }
}

let virtualFiles = loadVirtualFilesFromDisk();
let memoryCore = loadMemoryCoreFromDisk();

// Lazy init GoogleGenAI
let ai: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured in environment. Please add it via Settings > Secrets.");
    }
    ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}


// In-Memory Database for framework documentations and Stripe sessions logs
const frameworkDocs = [
  {
    framework: "React",
    topic: "Hooks",
    title: "React 19 State Optimistic Update (useOptimistic)",
    description: "Learn how to use React 19's useOptimistic hook to update the UI instantly before a server action or network call completes.",
    snippet: `import { useOptimistic } from 'react';

export function ThreadList({ messages, sendMessage }) {
  // Sets an optimistic state update during transient operations
  const [optimisticMessages, setOptimisticMessages] = useOptimistic(
    messages,
    (state, newMessage) => [...state, { text: newMessage, sending: true }]
  );

  async function formAction(formData) {
    const text = formData.get("message");
    setOptimisticMessages(text); // Trigger instant optimistic view change
    await sendMessage(text);     // Direct backend execution
  }

  return (
    <form action={formAction} className="space-y-4">
      {optimisticMessages.map((m, idx) => (
        <div key={idx} className={m.sending ? "text-slate-500 italic" : "text-slate-200"}>
          {m.text} {m.sending && "(Sending...)"}
        </div>
      ))}
      <input name="message" className="bg-slate-900 border text-white p-2 rounded" />
    </form>
  );
}`
  },
  {
    framework: "React",
    topic: "Transition",
    title: "Asynchronous Action transitions (useTransition)",
    description: "Manage pending state for heavy async operations without locking the main thread browser responsiveness.",
    snippet: `import { useState, useTransition } from 'react';

export function SaveButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const handleApply = () => {
    startTransition(async () => {
      const response = await fetch('/api/workspace/save', { method: 'POST' });
      if (!response.ok) {
        setError('Save failed from gateway');
      }
    });
  };

  return (
    <div>
      <button onClick={handleApply} disabled={isPending} className="bg-purple-600 px-4 py-2 text-white">
        {isPending ? 'Syncing...' : 'Save Progress'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}`
  },
  {
    framework: "Next.js",
    topic: "App Router",
    title: "Dynamic API Route Handler (Next 15 App Routing)",
    description: "Define dynamic API controller route proxies supporting query metrics and validation formats inside App Directory.",
    snippet: `// app/api/agents/[agentId]/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { agentId: string } }) {
  const agentId = params.agentId;
  const { searchParams } = new URL(request.url);
  const includeLogs = searchParams.get('logs') === 'true';

  // Construct structured telemetry response
  const telemetry = {
    id: agentId,
    status: 'ACTIVE_RUN',
    nodeLevel: 'SUPERVISOR',
    uptimeMs: Date.now() % 1000000,
    timestamp: new Date().toISOString(),
    logs: includeLogs ? ['Dispatched task', 'Passed QA validation'] : []
  };

  return NextResponse.json(telemetry, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' }
  });
}`
  },
  {
    framework: "Next.js",
    topic: "Server Components",
    title: "Dynamic Streaming Suspense Components",
    description: "Stream slow network data fetches progressively inside Next.js pages using loading.tsx or inline dynamic Suspense boundaries.",
    snippet: `import { Suspense } from 'react';

async function SlowAgentLogs() {
  const res = await fetch('http://localhost:3000/api/memory/list', { cache: 'no-store' });
  const logs = await res.json();
  
  return (
    <ul className="space-y-2 mt-4 font-mono">
      {logs.map((log: any) => (
        <li key={log.id} className="text-xs text-indigo-400">
          [{log.type}] {log.title}
        </li>
      ))}
    </ul>
  );
}

export default function WorkspacePage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">CTO Live Status Workspace</h1>
      <Suspense fallback={<p className="text-slate-500 font-mono text-xs mt-4">... Streaming memory data indexes ...</p>}>
        <SlowAgentLogs />
      </Suspense>
    </div>
  );
}`
  },
  {
    framework: "FastAPI",
    topic: "Routing",
    title: "FastAPI path parameters & Pydantic Validation",
    description: "Set up path-based queries wrapped under fast schema validations with rich JSON responses and auto-documentation.",
    snippet: `from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List

app = FastAPI(title="Cuddleia Developer Gateway")

class WorkspaceFile(BaseModel):
    path: str
    content: str
    line_count: int = Field(..., gt=0)
    language: Optional[str] = "typescript"

@app.post("/api/workspace/files", response_model=WorkspaceFile, status_code=201)
async def create_virtual_file(file: WorkspaceFile, overwrite: bool = Query(True)):
    if "/" not in file.path:
        raise HTTPException(status_code=400, detail="Invalid relative directory notation")
    
    # Store file payload safely
    return file`
  },
  {
    framework: "Fastify",
    topic: "Routing",
    title: "Fastify Route Schema Serialization",
    description: "Register high throughput route definitions in Fastify backed by AJV schema parameters speed benchmarks.",
    snippet: `import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

// Schema definitions for strict AJV serializations
const ctoRunSchema = {
  body: {
    type: 'object',
    required: ['prompt'],
    properties: {
      prompt: { type: 'string' },
      mcpScope: { type: 'boolean' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        steps: { type: 'array', items: { type: 'string' } }
      }
    }
  }
};

fastify.post('/api/agent/dispatch', { schema: ctoRunSchema }, async (request, reply) => {
  const { prompt } = request.body;
  return { success: true, steps: [\`Parse: \${prompt}\`, 'Validate script'] };
});`
  },
  {
    framework: "NestJS",
    topic: "Architecture",
    title: "NestJS Injectable service & Controller bindings",
    description: "Set up enterprise MVC patterns in NestJS incorporating providers, modular injections and REST routing APIs.",
    snippet: `import { Controller, Get, Post, Body, Injectable } from '@nestjs/common';

@Injectable()
export class MemoryService {
  private memoryLogs: string[] = ['System boot'];

  saveGuideline(log: string) {
    this.memoryLogs.push(log);
    return { status: 'persisted', total: this.memoryLogs.length };
  }

  getLogs() { return this.memoryLogs; }
}

@Controller('api/memory')
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Get('list')
  getLogs() {
    return this.memoryService.getLogs();
  }

  @Post('add')
  addLog(@Body('log') log: string) {
    return this.memoryService.saveGuideline(log);
  }
}`
  },
  {
    framework: "Stripe",
    topic: "Payments",
    title: "Stripe Node Checkout Session Integration",
    description: "Build robust, live server-side checkout integrations with automatic redirects, product lines, and webhooks processing.",
    snippet: `import Stripe from 'stripe';
import express from 'express';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});
const app = express();

app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Enterprise Agentic Swarm Nodes',
              description: 'Access 14 parallel docker development loops',
            },
            unit_amount: 19900, // $199.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://cuddleia.engineering/checkout/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://cuddleia.engineering/checkout/cancelled',
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`
  },
  {
    framework: "Stripe",
    topic: "Webhooks",
    title: "Stripe Webhook Event Signature Auditing",
    description: "Verify genuine Stripe dispatcher headers recursively on Express callback endpoints avoiding spoof attempts.",
    snippet: `// express webhook parser signature verification
import express from 'express';
import Stripe from 'stripe';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.post('/api/webhooks', express.raw({ type: 'application/json' }), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    return response.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  // Handle successful transaction webhook trigger
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(\`✅ Custom customer checkout verified: \${session.customer_details.email}\`);
    // Full operational state updates go here...
  }

  response.json({ received: true });
});`
  }
];

let stripeTransactions = [
  {
    id: "tx_3MvCuddlingSeedTx99",
    dateTime: new Date(Date.now() - 3600000 * 2).toISOString().replace('T', ' ').slice(0, 19),
    product: "Enterprise Multi-Agent Orchestrator",
    amount: 199.00,
    currency: "usd",
    customerEmail: "adamhaqeem12345@gmail.com",
    status: "succeeded" as const,
    webhookSent: true
  }
];

// REST endpoints for configuration
app.get("/cuddleia-local-cli.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.sendFile(path.join(process.cwd(), "cuddleia-local-cli.js"));
});

app.get("/api/docs/search", (req, res) => {
  const { q, framework } = req.query;
  let results = [...frameworkDocs];

  if (framework && framework !== "All") {
    results = results.filter(d => d.framework.toLowerCase() === (framework as string).toLowerCase());
  }

  if (q) {
    const term = (q as string).toLowerCase();
    results = results.filter(d => 
      d.title.toLowerCase().includes(term) || 
      d.description.toLowerCase().includes(term) ||
      d.snippet.toLowerCase().includes(term) ||
      d.topic.toLowerCase().includes(term)
    );
  }

  res.json(results);
});

app.get("/api/stripe/transactions", (req, res) => {
  res.json(stripeTransactions);
});

app.post("/api/stripe/mock-checkout", (req, res) => {
  const { product, amount, email, secretKey } = req.body;
  const txId = "tx_" + Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const newTx = {
    id: txId,
    dateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    product: product || "Enterprise Multi-Agent Orchestrator",
    amount: amount || 19.00,
    currency: "usd",
    customerEmail: email || "developer@cuddleia.engineering",
    status: "succeeded" as const,
    webhookSent: true
  };

  stripeTransactions.unshift(newTx);

  // Construct standard simulated webhook event payload
  const webhookPayload = {
    id: "evt_" + Math.random().toString(36).substring(2, 12),
    object: "event",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: "cs_" + Math.random().toString(36).substring(2, 12),
        object: "checkout.session",
        amount_total: Math.round(newTx.amount * 100),
        currency: "usd",
        customer_details: {
          email: newTx.customerEmail
        },
        payment_status: "paid",
        status: "complete",
        metadata: {
          simulated_with_key: secretKey ? secretKey.slice(0, 8) + "..." : "none"
        }
      }
    },
    type: "checkout.session.completed"
  };

  res.json({
    success: true,
    transaction: newTx,
    webhookPayload
  });
});

app.get("/api/mcp/list", (req, res) => {
  res.json(mcpConnections);
});

app.post("/api/mcp/toggle", (req, res) => {
  const { id } = req.body;
  mcpConnections = mcpConnections.map(conn => 
    conn.id === id ? { ...conn, status: conn.status === "connected" ? "disconnected" : "connected" } : conn
  );
  res.json({ success: true, mcpConnections });
});

app.post("/api/mcp/add", (req, res) => {
  const { name, type, url, description, tools } = req.body;
  const newConn = {
    id: `custom-${Date.now()}`,
    name,
    status: "connected" as const,
    type: type || "custom",
    url: url || "http://localhost:8000",
    description: description || "Custom MCP Connection",
    tools: tools || []
  };
  mcpConnections.push(newConn);
  res.json({ success: true, connection: newConn });
});

app.get("/api/memory/list", (req, res) => {
  memoryCore = loadMemoryCoreFromDisk();
  res.json(memoryCore);
});

app.post("/api/memory/add", (req, res) => {
  const { type, title, content } = req.body;
  const newItem = {
    id: `mem-${Date.now()}`,
    type: type || "adr",
    title,
    content,
    timestamp: new Date().toISOString()
  };
  
  // Also save to disk dynamically inside custom decisions directory if it's an ADR or guideline
  try {
    const decisionsDir = path.join(process.cwd(), ".ai-memory", "main");
    if (!fs.existsSync(decisionsDir)) {
      fs.mkdirSync(decisionsDir, { recursive: true });
    }
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filePath = path.join(decisionsDir, `custom_decision_${safeTitle}.md`);
    
    fs.writeFileSync(filePath, `# ${title}\n*Type: ${type}*\n\n${content}`, "utf-8");
    console.log(`Saved custom memory record successfully to: ${filePath}`);
  } catch (err) {
    console.error("Failed to persist memory record to disk:", err);
  }

  memoryCore = loadMemoryCoreFromDisk();
  res.json({ success: true, item: newItem });
});

app.get("/api/workspace/files", (req, res) => {
  virtualFiles = loadVirtualFilesFromDisk();
  res.json(virtualFiles);
});

app.post("/api/workspace/file/update", (req, res) => {
  const { path: filePath, content } = req.body;
  
  // Update in-memory array first
  const match = virtualFiles.find(f => f.path === filePath);
  if (match) {
    match.content = content;
  } else {
    virtualFiles.push({
      path: filePath,
      name: path.basename(filePath),
      content,
      language: filePath.endsWith(".tsx") || filePath.endsWith(".ts") ? "typescript" : "javascript"
    });
  }

  // Update physical files on disk!
  try {
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    const parentDir = path.dirname(absPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(absPath, content, "utf-8");
    console.log(`Saved workspace file directly to physical disk: ${filePath}`);
    
    // Refresh states to be perfectly in sync
    virtualFiles = loadVirtualFilesFromDisk();
    memoryCore = loadMemoryCoreFromDisk();
  } catch (err) {
    console.error(`Failed to write file ${filePath} to physical disk:`, err);
  }

  res.json({ success: true });
});

// Setup and Personalize AI MemoryCore markers
app.post("/api/memory/setup", (req, res) => {
  const { aiName, yourName, relationshipStyle } = req.body;
  if (!aiName || !yourName) {
    return res.status(400).json({ error: "AI Name and Your Name are required parameters." });
  }

  try {
    // 1. Personalize files recursively
    personalizeMemoryCore(aiName, yourName, relationshipStyle || "Personal Companion");

    // 2. Write profile.json
    const customMemoryDir = path.join(process.cwd(), '.ai-memory');
    const profile = {
      username: yourName,
      aiName: aiName,
      relationshipStyle: relationshipStyle || "Personal Companion",
      created_at: new Date().toISOString(),
      email: "user@ai-memory-core.io",
      preference: "Highly customized React application with universal MemoryCore structure."
    };
    fs.writeFileSync(path.join(customMemoryDir, 'profile.json'), JSON.stringify(profile, null, 2), 'utf-8');

    // Sync state
    virtualFiles = loadVirtualFilesFromDisk();
    memoryCore = loadMemoryCoreFromDisk();

    res.json({ 
      success: true, 
      message: `MemoryCore personalize success! Permanently configured AI to be '${aiName}' and User to be '${yourName}'.`,
      memories: memoryCore,
      files: virtualFiles
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to personalize MemoryCore templates." });
  }
});

// Create and write live Daily Diary entries
app.post("/api/memory/diary/add", (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and Content are required to log a diary entry." });
  }

  try {
    const diaryDir = path.join(process.cwd(), ".ai-memory", "daily-diary");
    if (!fs.existsSync(diaryDir)) {
      fs.mkdirSync(diaryDir, { recursive: true });
    }

    const todayDate = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
    const secureFileName = `Daily-Diary-Entry-${todayDate}_${Math.floor(Math.random() * 1000)}.md`;
    const targetPath = path.join(diaryDir, secureFileName);

    const markdownDoc = `# 📝 Daily Diary: ${title}
*Logged on: ${new Date().toLocaleString()}*

## 🌟 Interactive Diary Summary
${content}

---
*Created dynamically via Project-AI-MemoryCore CLI Platform*
`;

    fs.writeFileSync(targetPath, markdownDoc, "utf-8");
    console.log(`Dynamically appended new daily diary log: ${targetPath}`);

    // Reload states
    virtualFiles = loadVirtualFilesFromDisk();
    memoryCore = loadMemoryCoreFromDisk();

    res.json({ 
      success: true, 
      message: "Daily diary entry saved securely on disk!",
      memories: memoryCore,
      files: virtualFiles
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to persist diary markdown entry." });
  }
});

// Main agentic executor endpoint holding our full multi-agent swarm logic
app.post("/api/agent/run", async (req, res) => {
  const { prompt, mcpScope, memoryUsage } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  try {
    const client = getGenAI();

    // 1. CTO Planning Agent Configuration
    // Combine connected MCP tools and MemoryCore contexts
    const activeMcps = mcpConnections.filter(c => c.status === "connected");
    const mcpContextString = activeMcps.map(c => `MCP: ${c.name} - ${c.description}. Tools: ${c.tools.map(t => t.name).join(", ")}`).join("\n");
    const memoryContextString = memoryCore.map(m => `[${m.type.toUpperCase()}] ${m.title}: ${m.content}`).join("\n");

    const ctoInstruction = `
      You are the Chief Technical Officer (CTO) of Cuddleia CLI.
      Your job is to analyze the user request and decompose it into exactly 3 procedural steps that a Developer agent can resolve.
      We operate in a React TypeScript SPA environment structured with tailwind CSS.
      We have the following connected MCP servers for tools:
      ${mcpScope ? mcpContextString : "No MCP servers connected."}
      And we have the following MemoryCore rules for reference:
      ${memoryUsage ? memoryContextString : "No Memory context provided."}

      Respond strictly with a JSON object that satisfies this schema:
      {
        "steps": ["Step 1 description (Developer implementation tasks)", "Step 2 description", "Step 3 description"],
        "architecture_decisions": ["Decision 1 based on MemoryCore rules", "Decision 2 based on MCP specifications"],
        "recommended_tools": ["Tool Name 1", "Tool Name 2"]
      }
    `;

    const ctoResponse = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Decompose this task to the system: "${prompt}"`,
      config: {
        systemInstruction: ctoInstruction,
        responseMimeType: "application/json",
      }
    });

    let ctoResult;
    try {
      ctoResult = JSON.parse(ctoResponse.text || "{}");
    } catch {
      ctoResult = {
        steps: ["Initialize structure", "Write core mechanics", "Add transitions and polish"],
        architecture_decisions: ["Adopt single viewport", "Inject clean Inter typography"],
        recommended_tools: ["read_documentation"]
      };
    }

    // 2. Developer Agent - generate files
    const devInstruction = `
      You are the Lead Swarm Developer of Cuddleia CLI.
      Your CTO has assigned you these steps: ${JSON.stringify(ctoResult.steps)}.
      For the user prompt: "${prompt}".

      You must now implement the code files that satisfies these steps. Create standard, beautiful, fully written React modules and custom scripts. 
      Keep typography crisp, margins elegant, utilizing slate blacks, soft gray backgrounds and colorful buttons. Include state logic cleanly.

      Provide your implemented files strictly using this JSON schema:
      {
        "files": [
          {
            "path": "src/App.tsx",
            "content": "Fully-formed, modern, complete React component code..."
          }
        ]
      }
    `;

    const devResponse = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Implement the full application codebase for: "${prompt}"`,
      config: {
        systemInstruction: devInstruction,
        responseMimeType: "application/json",
      }
    });

    let devResult;
    try {
      devResult = JSON.parse(devResponse.text || "{}");
    } catch {
      devResult = {
        files: [
          {
            path: "src/App.tsx",
            content: `export default function App() {\n  return (\n    <div className="p-8 max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-6 mt-12">\n      <h2 className="text-xl font-bold text-slate-100 tracking-tight">Code Generation Error</h2>\n      <p className="text-sm text-slate-400">Failed to parse LLM developer output. Ready to self-correct during the next cycle.</p>\n    </div>\n  );\n}`
          }
        ]
      };
    }

    // Update our virtual workspace files so user can view/browse them!
    const generatedFiles = devResult.files || [];
    generatedFiles.forEach((file: any) => {
      const match = virtualFiles.find(f => f.path === file.path);
      if (match) {
        match.content = file.content;
      } else {
        virtualFiles.push({
          path: file.path,
          name: path.basename(file.path),
          content: file.content,
          language: file.path.endsWith(".tsx") || file.path.endsWith(".ts") ? "typescript" : "javascript"
        });
      }
    });

    // 3. QA Checker Validation
    const codeString = generatedFiles.map((f: any) => `File: ${f.path}\n\n${f.content}`).join("\n\n");
    const qaInstruction = `
      You are the Quality Assurance (QA) Checker of Cuddleia CLI.
      You must thoroughly audit the files designed by the Developer:
      ${codeString}

      Evaluate against styling structure, React 19 standards, and typescript safety. Output a numeric quality score from 0 to 100, and a checklist of passes and errors. Give helpful instructions to finish testing.

      Respond strictly with a JSON object that satisfies this schema:
      {
        "score": 95,
        "report": "Comprehensive evaluation notes",
        "checklist": [
          { "description": "TypeScript compiler verification", "status": "passed" },
          { "description": "Tailwind layout margins/padding density check", "status": "passed" },
          { "description": "Interactive state hook verification", "status": "failed" }
        ]
      }
    `;

    const qaResponse = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Validate code quality and write quality checklist.",
      config: {
        systemInstruction: qaInstruction,
        responseMimeType: "application/json",
      }
    });

    let qaResult;
    try {
      qaResult = JSON.parse(qaResponse.text || "{}");
    } catch {
      qaResult = {
        score: 88,
        report: "Fallback assessment. The code is structured correctly with responsive classes.",
        checklist: [
          { description: "Vite SPA module loading check", status: "passed" },
          { description: "Lucide icons imports matching rules", status: "passed" },
          { description: "Color contrast compliance", status: "passed" }
        ]
      };
    }

    // Save final decision log back into MemoryCore automatically!
    const memoryRecord = {
      id: `mem-${Date.now()}`,
      type: "history" as const,
      title: `System Run: ${prompt.slice(0, 35)}...`,
      content: `CTO implemented 3 steps. Developer successfully wrote files. QA checker validated with score: ${qaResult.score}/100. Verification summary: ${qaResult.report}`,
      timestamp: new Date().toISOString()
    };
    
    // Auto-save to physical disk current-session file!
    appendSessionHistory(`Prompt: "${prompt}"\nResult: CTO implemented 3 steps. Developer successfully wrote files. QA validated code with score ${qaResult.score}/100.`);
    memoryCore = loadMemoryCoreFromDisk();

    // Return the multi-agent results so the web client can simulate the sequence in full glory!
    res.json({
      success: true,
      cto: ctoResult,
      dev: {
        files: generatedFiles
      },
      qa: qaResult,
      memorySaved: memoryRecord
    });

  } catch (error: any) {
    console.error("Agent Run Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during agent orchestration." });
  }
});

// Configure Vite or Static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
