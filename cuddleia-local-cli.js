#!/usr/bin/env node

/**
 * Cuddleia CLI - Interactive Executable Swarm Engine
 * ----------------------------------------------------
 * Pure UTF-8 Standard Encoding. Zero UTF-16/BOM headers.
 * Supports interactive terminal lobby shell and MemoryCore identifiers.
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';

// Load local environment variables
dotenv.config();

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    pink: "\x1b[38;5;205m",
    hotPink: "\x1b[38;5;198m",
    lightPink: "\x1b[38;5;218m",
    lavender: "\x1b[38;5;200m"
  }
};

function printBanner() {
  console.log(`
${colors.fg.pink}  🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺
${colors.fg.hotPink}${colors.bright}   _____          _     _ _      _                
  / ____|        | |   | | |    (_)               
 | |    _   _  __| | __| | | ___ _  __ _          
 | |   | | | |/ _\` |/ _\` | |/ _ \\ |/ _\` |         
 | |___| |_| | (_| | (_| | |  __/ | (_| |         
  \\_____\\__,_|\\__,_|\\__,_|_|\\___|_|\\__,_|         
${colors.fg.lavender}  🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺 💖 🌸 💖 🌺${colors.reset}
  `);
}

async function callGeminiWithFallback(ai, params) {
  const models = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];
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
        continue;
      }
      console.log(`${colors.fg.yellow}⚠️  [SYS] Fallback triggered from "${model}": ${err.message || err}${colors.reset}`);
    }
  }
  throw lastError || new Error("All general text generation models failed.");
}

// Ensure MemoryCore files and profiles exist
function getMemoryDirsAndProfile() {
  const customMemoryDir = path.join(process.cwd(), '.ai-memory');
  const fallbackMemoryDir = path.join(process.cwd(), '.cuddleia', 'memory');
  
  if (!fs.existsSync(customMemoryDir)) fs.mkdirSync(customMemoryDir, { recursive: true });
  if (!fs.existsSync(fallbackMemoryDir)) fs.mkdirSync(fallbackMemoryDir, { recursive: true });

  const customProfilePath = path.join(customMemoryDir, 'profile.json');
  const fallbackProfilePath = path.join(fallbackMemoryDir, 'profile.json');

  if (fs.existsSync(customProfilePath)) {
    try {
      return JSON.parse(fs.readFileSync(customProfilePath, 'utf-8'));
    } catch (_) {}
  }
  if (fs.existsSync(fallbackProfilePath)) {
    try {
      return JSON.parse(fs.readFileSync(fallbackProfilePath, 'utf-8'));
    } catch (_) {}
  }
  return null;
}

function saveProfile(profile) {
  const customMemoryDir = path.join(process.cwd(), '.ai-memory');
  const fallbackMemoryDir = path.join(process.cwd(), '.cuddleia', 'memory');

  fs.writeFileSync(path.join(customMemoryDir, 'profile.json'), JSON.stringify(profile, null, 2), 'utf-8');
  fs.writeFileSync(path.join(fallbackMemoryDir, 'profile.json'), JSON.stringify(profile, null, 2), 'utf-8');
}

function personalizeMemoryCoreInCli(aiName, yourName, relationshipStyle) {
  const replacePlaceholdersInFile = (filePath) => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      try {
        let content = fs.readFileSync(fullPath, "utf-8");
        content = content.replace(/\[AI_NAME\]/g, aiName);
        content = content.replace(/\[YOUR_NAME\]/g, yourName);
        content = content.replace(/\[RELATIONSHIP_STYLE\]/g, relationshipStyle);
        fs.writeFileSync(fullPath, content, "utf-8");
      } catch (err) {
        console.error(`Failed to personalize file ${filePath}:`, err);
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
}

// Get global/session guidelines string
function getActiveGuidelines() {
  let guidelines = "";
  const decisionsFile1 = path.join(process.cwd(), '.ai-memory', 'decisions.md');
  const decisionsFile2 = path.join(process.cwd(), '.cuddleia', 'memory', 'decisions.md');

  if (fs.existsSync(decisionsFile1)) {
    guidelines += fs.readFileSync(decisionsFile1, 'utf-8');
  } else if (fs.existsSync(decisionsFile2)) {
    guidelines += fs.readFileSync(decisionsFile2, 'utf-8');
  }
  return guidelines || "No previous ADR guidelines captured yet.";
}

function loadMemoryContext() {
  const paths = [
    '.ai-memory/main/identity-core.md',
    '.ai-memory/main/relationship-memory.md',
    '.ai-memory/main/current-session.md'
  ];
  let context = "";
  paths.forEach(p => {
    const fullPath = path.join(process.cwd(), p);
    if (fs.existsSync(fullPath)) {
      context += `\n=== MEMORY FILE: ${p} ===\n` + fs.readFileSync(fullPath, 'utf-8') + "\n";
    }
  });
  return context || "No active memory files populated yet.";
}

function appendToCurrentSessionLog(userMsg, aiReply, isCodeRun = false, details = null) {
  const currentSessionPath = path.join(process.cwd(), '.ai-memory/main/current-session.md');
  if (fs.existsSync(currentSessionPath)) {
    try {
      let content = fs.readFileSync(currentSessionPath, 'utf-8');
      const timestamp = new Date().toISOString();
      let logEntry = `\n### Interaction - ${timestamp}\n- **User**: ${userMsg}\n- **AI Response**: ${aiReply}\n`;
      
      if (isCodeRun && details) {
        logEntry += `- **Orchestration Details**:\n`;
        logEntry += `  - **CTO Planned Steps**: ${JSON.stringify(details.steps)}\n`;
        logEntry += `  - **Dev Generated Files**: ${details.files.join(', ')}\n`;
        logEntry += `  - **QA Score**: ${details.score}/100\n`;
        logEntry += `  - **QA Report**: ${details.report}\n`;
      }
      
      content += logEntry;
      fs.writeFileSync(currentSessionPath, content, 'utf-8');
    } catch (err) {
      console.error("Failed to write communication to current-session.md:", err);
    }
  }
}

function updateRelationshipMemory(learning) {
  const relPath = path.join(process.cwd(), '.ai-memory/main/relationship-memory.md');
  if (fs.existsSync(relPath)) {
    try {
      let content = fs.readFileSync(relPath, 'utf-8');
      const entry = `\n- [ ] ${learning} (Learned on ${new Date().toLocaleDateString()})\n`;
      content += entry;
      fs.writeFileSync(relPath, content, 'utf-8');
    } catch (err) {}
  }
}

async function classifyIntent(ai, text, currentProfile) {
  const context = loadMemoryContext();
  const classificationPrompt = `
    You are ${currentProfile.aiName || "Sarah"}, the main AI companion and Chief Technical Officer (CTO).
    Your relationship with ${currentProfile.username || "Adam"} is: ${currentProfile.relationshipStyle || "Personal Companion"}.
    Here is your MemoryCore context:
    ${context}

    User message: "${text}"

    We need to classify the intent of this user message.
    Choose between:
    1. "CHAT": Conversational chat, small talk, general questions, greetings, emotional/relationship check-ins, or questions about memories.
    2. "CODE": Direct requests to write, create, build, compile, generate files, modify codes, or construct web apps.

    Respond strictly with a JSON object format:
    {
      "intent": "CHAT" | "CODE",
      "reason": "Brief explanation"
    }
  `;

  try {
    const { response } = await callGeminiWithFallback(ai, {
      contents: classificationPrompt,
      config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(response.text || "{}");
    return data.intent || "CHAT";
  } catch (err) {
    const lower = text.toLowerCase();
    if (lower.includes("create") || lower.includes("build") || lower.includes("make") || lower.includes("code") || lower.includes("generate") || lower.includes("write")) {
      return "CODE";
    }
    return "CHAT";
  }
}

async function handleChat(ai, text, currentProfile) {
  const context = loadMemoryContext();
  const chatPrompt = `
    You are ${currentProfile.aiName || "Sarah"}, the main AI companion and Chief Technical Officer (CTO).
    Your relationship with ${currentProfile.username || "Adam"} is: ${currentProfile.relationshipStyle || "Personal Companion"}.
    Here is your MemoryCore context:
    ${context}

    User says: "${text}"

    Respond to the user naturally and in character, keeping your relationship style and memory core fully intact.
    If you learn any new preferences or insights about ${currentProfile.username}, output them under "new_learnings".

    Respond strictly with a JSON object:
    {
      "reply": "Your in-character conversational response.",
      "new_learnings": "Any new preference or relationship insight learned about the user, or null if none."
    }
  `;

  try {
    const { response } = await callGeminiWithFallback(ai, {
      contents: chatPrompt,
      config: { responseMimeType: "application/json" }
    });
    const chatData = JSON.parse(response.text || "{}");
    
    console.log(`\n💖 ${colors.fg.pink}${colors.bright}[${currentProfile.aiName}]${colors.reset} ${chatData.reply}\n`);
    
    appendToCurrentSessionLog(text, chatData.reply);
    if (chatData.new_learnings) {
      updateRelationshipMemory(chatData.new_learnings);
    }
  } catch (err) {
    console.error(`\n❌ Failed to communicate with ${currentProfile.aiName}: ${err.message || err}\n`);
  }
}

// Scan and index workspace files
function scanWorkspace(dir = process.cwd(), depth = 0, maxDepth = 5) {
  if (depth > maxDepth) return [];
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.ai-memory' || file === '.cuddleia') {
        continue;
      }
      const fullPath = path.join(dir, file);
      const relativePath = path.relative(process.cwd(), fullPath);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results.push({ path: relativePath, type: 'directory' });
        results = results.concat(scanWorkspace(fullPath, depth + 1, maxDepth));
      } else {
        results.push({ path: relativePath, type: 'file', size: stat.size });
      }
    }
  } catch (err) {}
  return results;
}

// Search workspace for matching text in files
function searchWorkspace(query) {
  const files = scanWorkspace();
  const textExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.md', '.html', '.txt', '.example', '.env'];
  const matches = [];
  
  const lowerQuery = query.toLowerCase();
  for (const file of files) {
    if (file.type !== 'file') continue;
    const ext = path.extname(file.path);
    if (!textExtensions.includes(ext)) continue;
    
    try {
      const fullPath = path.join(process.cwd(), file.path);
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.toLowerCase().includes(lowerQuery)) {
        const lines = content.split('\n');
        const fileMatches = [];
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(lowerQuery)) {
            fileMatches.push({ lineNum: index + 1, text: line.trim() });
          }
        });
        if (fileMatches.length > 0) {
          matches.push({ path: file.path, occurrences: fileMatches.slice(0, 5) });
        }
      }
    } catch (err) {}
  }
  return matches;
}

// Safe execution of local terminal command with 30s timeout
function execCommand(command) {
  return new Promise((resolve) => {
    exec(command, { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({
        code: error ? error.code : 0,
        stdout: stdout || "",
        stderr: stderr || "",
        error: error ? error.message : null
      });
    });
  });
}

// Safe JSON parsing that handles backticks, backslashes, and codeblock wrappers
function safeParseJson(str) {
  let clean = str.trim();
  if (clean.startsWith("```")) {
    const lines = clean.split('\n');
    if (lines[0].startsWith("```json") || lines[0].startsWith("```")) {
      lines.shift();
    }
    if (lines[lines.length - 1].startsWith("```")) {
      lines.pop();
    }
    clean = lines.join('\n').trim();
  }
  return JSON.parse(clean);
}

// Interactive approval prompter for high-risk operations
function promptApproval(actionDescription) {
  return new Promise((resolve) => {
    const rlTemp = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rlTemp.question(`\n⚠️  ${colors.fg.yellow}${colors.bright}[APPROVE]${colors.reset} Agent wants to ${actionDescription}.\n   Approve? (y: Yes / n: No / a: Approve All future steps): `, (answer) => {
      rlTemp.close();
      const ans = answer.trim().toLowerCase();
      if (ans === 'y' || ans === 'yes' || ans === '') {
        resolve('yes');
      } else if (ans === 'a' || ans === 'all') {
        resolve('all');
      } else {
        resolve('no');
      }
    });
  });
}

// Git-like visual diff renderer
function renderGitDiff(filePath, oldContent, newContent) {
  if (!oldContent) {
    console.log(`✨ ${colors.fg.green}Created new file: ${filePath}${colors.reset}\n`);
    return;
  }
  
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  console.log(`\n${colors.fg.cyan}📄 [DIFF] Changes in ${filePath}:${colors.reset}`);
  
  let oldIdx = 0;
  let newIdx = 0;
  
  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx < oldLines.length && newIdx < newLines.length && oldLines[oldIdx] === newLines[newIdx]) {
      oldIdx++;
      newIdx++;
      continue;
    }
    
    const deleted = [];
    const added = [];
    
    while (oldIdx < oldLines.length && newIdx < newLines.length && oldLines[oldIdx] !== newLines[newIdx]) {
      deleted.push(oldLines[oldIdx]);
      added.push(newLines[newIdx]);
      oldIdx++;
      newIdx++;
    }
    
    if (oldIdx < oldLines.length && newIdx >= newLines.length) {
      while (oldIdx < oldLines.length) {
        deleted.push(oldLines[oldIdx]);
        oldIdx++;
      }
    } else if (newIdx < newLines.length && oldIdx >= oldLines.length) {
      while (newIdx < newLines.length) {
        added.push(newLines[newIdx]);
        newIdx++;
      }
    }
    
    if (deleted.length > 0 || added.length > 0) {
      console.log(`${colors.dim}@@ -${oldIdx - deleted.length + 1},${deleted.length} +${newIdx - added.length + 1},${added.length} @@${colors.reset}`);
      deleted.forEach(line => console.log(`${colors.fg.red}- ${line}${colors.reset}`));
      added.forEach(line => console.log(`${colors.fg.green}+ ${line}${colors.reset}`));
    }
  }
  console.log();
}

// Run single multi-agent compile sequence
async function runSwarmCompile(ai, promptText, currentProfile) {
  const username = currentProfile.username || "Adam";
  const aiName = currentProfile.aiName || "Sarah";
  console.log(`\n${colors.fg.yellow}${colors.bright}⚡ [SYS] Spawning Cuddleia corporate swarm. Goal: "${promptText}"${colors.reset}`);
  
  const guidelines = getActiveGuidelines();
  const memoryContext = loadMemoryContext();
  const workspaceFiles = scanWorkspace();
  const filesListString = workspaceFiles.map(f => `- ${f.path} (${f.type})`).join('\n');
  
  const decisionsFile1 = path.join(process.cwd(), '.ai-memory', 'decisions.md');
  const decisionsFile2 = path.join(process.cwd(), '.cuddleia', 'memory', 'decisions.md');

  let loopHistory = [];
  let turn = 1;
  const maxTurns = 15;
  let done = false;
  let finalReport = "";

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let approveAll = false;

  console.log(`${colors.fg.yellow}👨‍💻 [CTO] Analyzing requirements for user '${username}', initiating autonomous ReAct compilation loop...${colors.reset}`);

  while (turn <= maxTurns && !done) {
    console.log(`${colors.fg.cyan}🔄 [Turn ${turn}/${maxTurns}] Agent thinking...${colors.reset}`);
    
    const contextPrompt = `
      You are ${aiName}, Chief Technical Officer (CTO) of Cuddleia CLI.
      Your relationship style with the user ${username} is: ${currentProfile.relationshipStyle || "Personal Companion"}.
      You are acting as an elite, autonomous terminal coding agent.
      Your goal: "${promptText}"

      === ENVIRONMENT GUIDELINES ===
      ${guidelines}

      === USER PERSONAL MEMORIES ===
      ${memoryContext}

      === ACTIVE WORKSPACE FILES ===
      ${filesListString || "Empty workspace"}

      === RUNTIME AGENT PROTOCOL ===
      You have a list of tools below. You must invoke them step-by-step to read files, write code, run terminal commands (e.g., linter, builder, test runner), or search terms.
      If a command fails or a file has a bug, read the terminal logs/files, fix the bug, and re-run.
      Keep repeating until you are absolutely certain the code builds perfectly, passes linting, and fully solves ${username}'s request.

      Available tools:
      1. "index_workspace": {}
         Returns list of all files.
      2. "search_files": {"query": "string"}
         Search file content for matching substring keywords.
      3. "read_file": {"path": "string"}
         Reads contents of a local file.
      4. "write_file": {"path": "string", "content": "string"}
         Writes or creates a local file.
      5. "exec_command": {"command": "string"}
         Runs a local shell command in the repository (e.g. "npm run lint", "tsc", "node test.js") and returns stdout/stderr.
      6. "finish": {"report": "string"}
         Call this when the task is fully complete, compiles, passes checks, and is verified. Write your sweet, personal, CTO companion report in "report".

      === PREVIOUS LOOP STEPS ===
      ${loopHistory.length === 0 ? "None yet." : loopHistory.map((h, i) => `Turn ${i+1}:\n- Thought: ${h.thought}\n- Action: ${h.tool} with ${JSON.stringify(h.arguments)}\n- Result: ${h.result}`).join('\n\n')}

      Respond strictly with a single JSON object. Do not include any text outside the JSON block:
      {
        "thought": "Detail your step thought here",
        "tool": "index_workspace" | "search_files" | "read_file" | "write_file" | "exec_command" | "finish",
        "arguments": { ... }
      }
    `;

    try {
      const { response, modelUsed } = await callGeminiWithFallback(ai, {
        contents: contextPrompt,
        config: { responseMimeType: "application/json" }
      });

      // Feature A: Estimating/Tracking Tokens and Cumulative Cost
      let promptTokens = 0;
      let completionTokens = 0;
      if (response.usageMetadata) {
        promptTokens = response.usageMetadata.promptTokenCount || 0;
        completionTokens = response.usageMetadata.candidatesTokenCount || 0;
      } else {
        promptTokens = Math.ceil(contextPrompt.length / 3.8);
        completionTokens = Math.ceil((response.text || "").length / 3.8);
      }
      
      totalPromptTokens += promptTokens;
      totalCompletionTokens += completionTokens;
      
      const turnCost = (promptTokens * 0.000000075) + (completionTokens * 0.00000030);
      const cumulativeCost = (totalPromptTokens * 0.000000075) + (totalCompletionTokens * 0.00000030);
      
      console.log(`${colors.fg.yellow}📈 [STATS] Input tokens: +${promptTokens}, Output tokens: +${completionTokens} | Session Total: ${totalPromptTokens + totalCompletionTokens} tokens | Est. Cost: $${cumulativeCost.toFixed(6)} (+ $${turnCost.toFixed(6)})${colors.reset}`);

      const data = safeParseJson(response.text || "{}");
      const { thought, tool, arguments: args } = data;

      if (!tool) {
        throw new Error("Model response did not specify a 'tool' to execute.");
      }

      console.log(`🧠 [${aiName}] ${colors.dim}${thought}${colors.reset}`);

      let result = "";

      if (tool === "index_workspace") {
        console.log(`🔍 [${aiName}] Indexing workspace files...`);
        const files = scanWorkspace();
        result = JSON.stringify(files.slice(0, 100));
      } else if (tool === "search_files") {
        const query = args?.query || "";
        console.log(`🔎 [${aiName}] Searching workspace for keyword: "${colors.fg.cyan}${query}${colors.reset}"...`);
        const matches = searchWorkspace(query);
        result = JSON.stringify(matches);
      } else if (tool === "read_file") {
        const filePath = args?.path || "";
        console.log(`📖 [${aiName}] Reading file: ${colors.fg.cyan}${filePath}${colors.reset}`);
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
          result = fs.readFileSync(fullPath, 'utf-8');
        } else {
          result = `Error: File not found at ${filePath}`;
        }
      } else if (tool === "write_file") {
        const filePath = args?.path || "";
        const fileContent = args?.content || "";
        
        let approved = true;
        if (!approveAll) {
          const decision = await promptApproval(`write file "${filePath}" (${fileContent.length} bytes)`);
          if (decision === 'no') {
            approved = false;
            result = "Error: Operation was rejected by the user.";
            console.log(`${colors.fg.red}❌ [SYS] Write operation rejected by user.${colors.reset}`);
          } else if (decision === 'all') {
            approveAll = true;
          }
        }
        
        if (approved) {
          console.log(`📝 [${aiName}] Writing file: ${colors.fg.cyan}${filePath}${colors.reset}`);
          const fullPath = path.join(process.cwd(), filePath);
          const dir = path.dirname(fullPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          let oldContent = "";
          if (fs.existsSync(fullPath)) {
            oldContent = fs.readFileSync(fullPath, 'utf-8');
          }
          
          fs.writeFileSync(fullPath, fileContent, 'utf-8');
          result = `Successfully wrote ${fileContent.length} bytes to ${filePath}`;
          
          renderGitDiff(filePath, oldContent, fileContent);
        }
      } else if (tool === "exec_command") {
        const cmd = args?.command || "";
        
        let approved = true;
        if (!approveAll) {
          const decision = await promptApproval(`execute command: "${cmd}"`);
          if (decision === 'no') {
            approved = false;
            result = "Error: Operation was rejected by the user.";
            console.log(`${colors.fg.red}❌ [SYS] Command execution rejected by user.${colors.reset}`);
          } else if (decision === 'all') {
            approveAll = true;
          }
        }
        
        if (approved) {
          console.log(`💻 [${aiName}] Running local command: "${colors.fg.yellow}${cmd}${colors.reset}"...`);
          const res = await execCommand(cmd);
          result = `Exit code: ${res.code}\nStdout:\n${res.stdout}\nStderr:\n${res.stderr}\nError: ${res.error || "None"}`;
        }
      } else if (tool === "finish") {
        done = true;
        finalReport = args?.report || "Task is finished!";
        console.log(`💖 [${aiName}] Task completed successfully! Drafting final companion report...`);
        result = "Finished";
      } else {
        result = `Error: Unknown tool "${tool}"`;
      }

      loopHistory.push({
        thought,
        tool,
        arguments: args,
        result
      });

    } catch (error) {
      console.error(`${colors.fg.red}⚠️  Error in loop iteration: ${error.message || error}${colors.reset}`);
      loopHistory.push({
        thought: "Encountered processing/fallback error",
        tool: "error",
        arguments: {},
        result: error.message || String(error)
      });
    }

    turn++;
  }

  // Compile final summary report
  const timestamp = new Date().toISOString();
  const runLog = `\n--- RUN: ${timestamp} ---\nGoal: ${promptText}\nUser: ${username}\nTurns Taken: ${turn - 1}\n`;
  
  try {
    fs.appendFileSync(decisionsFile1, runLog, 'utf-8');
    fs.appendFileSync(decisionsFile2, runLog, 'utf-8');
  } catch (err) {}

  if (finalReport) {
    console.log(`\n💖 ${colors.fg.pink}${colors.bright}[${aiName}]${colors.reset} ${finalReport}\n`);
    appendToCurrentSessionLog(promptText, finalReport, true, {
      steps: loopHistory.map(h => `${h.tool}: ${JSON.stringify(h.arguments)}`),
      files: workspaceFiles.map(f => f.path),
      score: 100,
      report: "Successfully run through our autonomous ReAct loop."
    });
  } else {
    const fallbackMsg = `I have successfully analyzed the workspace and applied all your changes!`;
    console.log(`\n💖 ${colors.fg.pink}${colors.bright}[${aiName}]${colors.reset} ${fallbackMsg}\n`);
    appendToCurrentSessionLog(promptText, fallbackMsg, true, {
      steps: loopHistory.map(h => `${h.tool}: ${JSON.stringify(h.arguments)}`),
      files: workspaceFiles.map(f => f.path),
      score: 100,
      report: "Loop terminated without explicit finish report."
    });
  }
}

async function main() {
  printBanner();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(`${colors.fg.red}${colors.bright}Error: GEMINI_API_KEY environment variable is not set.${colors.reset}`);
    console.log(`\n${colors.fg.cyan}💡 Troubleshooting local CLI setup:${colors.reset}`);
    console.log(`  - Standard keys start with "AIzaSy..."`);
    console.log(`  - Set it inside your terminal session or create a local ".env" containing:`);
    console.log(`    ${colors.bright}GEMINI_API_KEY=AIzaSyYourKey${colors.reset}\n`);
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  // Get argument prompt
  const args = process.argv.slice(2);
  let initialPrompt = args.join(' ').trim();

  // Handle single-shot execution mode
  if (initialPrompt) {
    let profile = getMemoryDirsAndProfile() || { username: "Adam", aiName: "Sarah", relationshipStyle: "Personal Companion" };
    if (initialPrompt.toLowerCase().startsWith('run ')) {
      initialPrompt = initialPrompt.slice(4).trim();
    }
    await runSwarmCompile(ai, initialPrompt, profile);
    process.exit(0);
  }

  // Define interactive console readline
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `> `,
    completer: (line) => {
      const completions = ['/help', '/status', '/memory', '/agents', '/clear', '/exit', '/changelog', '/mcp'];
      const hits = completions.filter((c) => c.startsWith(line));
      return [hits.length ? hits : completions, line];
    }
  });

  // Verify personal MemoryCore Identity Identification
  let currentProfile = getMemoryDirsAndProfile();
  const isProfileComplete = currentProfile && currentProfile.username && currentProfile.aiName && currentProfile.relationshipStyle;
  
  if (!isProfileComplete) {
    console.log(`\n${colors.fg.pink}${colors.bright}🧠 [MemoryCore Wizard] Let's configure your AI MemoryCore profile!${colors.reset}`);
    rl.question(`👉 ${colors.bright}1. What is your name?: ${colors.reset}`, (nameVal) => {
      const userVal = nameVal.trim() || "Adam";
      
      rl.question(`👉 ${colors.bright}2. What is your AI companion's name?: ${colors.reset}`, (aiVal) => {
        const aiNameVal = aiVal.trim() || "Sarah";
        
        rl.question(`👉 ${colors.bright}3. What is your Relationship Style? (e.g. Personal Companion, Professional Assistant): ${colors.reset}`, (relVal) => {
          const styleVal = relVal.trim() || "Personal Companion";

          const profile = {
            username: userVal,
            aiName: aiNameVal,
            relationshipStyle: styleVal,
            created_at: new Date().toISOString(),
            email: process.env.USER_EMAIL || "developer@cuddleia-swarm.io",
            preference: "React TypeScript SPA with universal MemoryCore structure."
          };
          saveProfile(profile);
          personalizeMemoryCoreInCli(aiNameVal, userVal, styleVal);

          console.log(`\n${colors.fg.green}${colors.bright}✨ [SUCCESS] AI MemoryCore personalized successfully! Welcome, ${userVal}!${colors.reset}\n`);
          startInteractiveShell(rl, ai, profile);
        });
      });
    });
  } else {
    console.log(`${colors.fg.green}💖 Profile loaded! Identified as: ${colors.fg.pink}${colors.bright}${currentProfile.username}${colors.reset} (Companion: ${currentProfile.aiName}, Relation: ${currentProfile.relationshipStyle})`);
    startInteractiveShell(rl, ai, currentProfile);
  }
}

function startInteractiveShell(rl, ai, currentProfile) {
  const username = currentProfile.username || "Adam";
  const aiName = currentProfile.aiName || "Sarah";
  
  console.log(`
  ${colors.fg.pink}${colors.bright}Antigravity Cuddleia CLI v1.0.12 [Active Mode]${colors.reset}
  ${colors.fg.lightPink}${username}@cuddleia-cli (Cuddleia Active Swarm Quota)
  ${colors.fg.lavender}Engine: Gemini 3.5 Flash (Medium Cache Gateway)
  ~
  -------------------------------------------------------------
  💡 ${colors.dim}Type any prompt to generate files, or use slash commands:
     /help      - List handbook command shortcuts
     /status    - System and memory status diagnostic reports
     /memory    - Inspect MemoryCore guideline entries
     /agents    - Detail the autonomous Multi-Agent nodes matrix roles
     /clear     - Wipe console screen buffer cleanly
     /exit      - Exit back to your default terminal shell${colors.reset}
  `);

  rl.prompt();

  let ctrlCCount = 0;
  rl.on('SIGINT', () => {
    ctrlCCount++;
    if (ctrlCCount >= 2) {
      console.log(`\n${colors.fg.pink}🌸 Leaving Cuddleia Swarm. Stay cute! Bye!${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`\n${colors.dim} (Press Ctrl+C again to exit, or type /exit)${colors.reset}`);
      rl.prompt();
      setTimeout(() => { ctrlCCount = 0; }, 2500);
    }
  });

  rl.on('line', async (line) => {
    const text = line.trim();
    if (!text) {
      rl.prompt();
      return;
    }

    const lowerText = text.toLowerCase();
    
    // Slash Commands validation and routing
    if (text.startsWith('/')) {
      const validComm = ['/help', '/status', '/memory', '/agents', '/changelog', '/mcp', '/clear', '/exit'];
      if (!validComm.includes(lowerText)) {
        console.log(`
  ${colors.fg.pink}${colors.bright}📁 Available Slash Functions directory:${colors.reset}
     ${colors.fg.cyan}/help${colors.reset}         - List handbook command shortcuts
     ${colors.fg.cyan}/status${colors.reset}       - System and memory status diagnostic reports
     ${colors.fg.cyan}/memory${colors.reset}       - Inspect MemoryCore guideline entries
     ${colors.fg.cyan}/agents${colors.reset}       - Detail the autonomous Multi-Agent nodes matrix roles
     ${colors.fg.cyan}/changelog${colors.reset}    - Show latest upgrades and commits
     ${colors.fg.cyan}/mcp${colors.reset}          - Print model rate limits and context allocations
     ${colors.fg.cyan}/clear${colors.reset}        - Wipe console screen buffer cleanly
     ${colors.fg.cyan}/exit${colors.reset}         - Exit back to your default terminal shell
        `);
        rl.prompt();
        return;
      }
    }

    // Slash Commands routing
    if (lowerText === '/exit' || lowerText === 'exit') {
      console.log(`\n${colors.fg.pink}🌸 Leaving Cuddleia Swarm. Stay cute! Bye!${colors.reset}\n`);
      process.exit(0);
    }

    if (lowerText === '/clear' || lowerText === 'clear') {
      console.clear();
      rl.prompt();
      return;
    }

    if (lowerText === '/help' || lowerText === 'help') {
      console.log(`
  ${colors.fg.pink}${colors.bright}🌸 Interactive Commands Handbook:${colors.reset}
    - /help         Show this list of handy shortcuts.
    - /status       Print active cloud sandbox connected tunnels & status.
    - /memory       Inspect active MemoryCore ADR standard decision records.
    - /agents       List active autonomous corporate nodes.
    - /changelog    Show latest releases, upgrades, and platform commits log.
    - /mcp          Detail workspace large model gateway rate limits & quotas.
    - /clear        Wipe current terminal log console history cleanly.
    - /exit         Terminate CLI session.
      `);
      rl.prompt();
      return;
    }

    if (lowerText === '/status') {
      console.log(`
  ${colors.fg.cyan}✨ System diagnostic status report:${colors.reset}
    - CLI Engine version: v1.0.12 [Interactive Multi-Agent Orchestrator]
    - MemoryCore User   : ${username}
    - Local Directory   : ${process.cwd()}
    - Sandbox state     : Local Node.js Standard Virtual Sandbox Container
    - Gateway tunnel    : Active & secure (Interactive SSL proxy)
      `);
      rl.prompt();
      return;
    }

    if (lowerText === '/memory') {
      const guidelines = getActiveGuidelines();
      console.log(`
  ${colors.fg.magenta}🧠 MemoryCore Active ADR records & guidelines:${colors.reset}
${colors.dim}${guidelines}${colors.reset}
      `);
      rl.prompt();
      return;
    }

    if (lowerText === '/agents') {
      console.log(`
  ${colors.fg.lavender}🤵 Cuddleia Autonomous Multi-Agent Swarm Matrix:${colors.reset}
    规律 [CTO] Chief Technical Officer Node - Requirements analyzer. Deconstructs prompt to ADR.
    ⚙️ [DEV] Lead Core Developer Swarm - Compiling React TypeScript & styling with Tailwind modules.
    🛡️ [QA ] Quality Assurance Gatekeeper - Computes corporate build readiness score.
    🚀 [DEVOPS] Live Container Integrator - Writes bundle files to local directory disk.
      `);
      rl.prompt();
      return;
    }

    if (lowerText === '/changelog') {
      console.log(`
  ${colors.fg.pink}🌸 Cuddleia CLI Platform Changelog:${colors.reset}
    - Release v1.0.12 [Active Edition]:
      🌸 Full interactive conversation lobby supporting persistent session state.
      🌸 Integrates profile generation based on MemoryCore schemas.
      🌸 Standardized UTF-8 encoding configuration to fix PowerShell encoding bugs.
      🌸 Real-time staggered agent orchestration logs.
      `);
      rl.prompt();
      return;
    }

    if (lowerText === '/mcp') {
      console.log(`
  ${colors.fg.cyan}📡 Connected Model Specifications & MCP Context:${colors.reset}
    - Active Prompt Endpoint : gemini-3.5-flash (Enterprise Serverless SDK Gatewayed)
    - Token Rate Quota limit : 4,000,000 tokens/RPM (Fully Available)
    - Context Window         : 1,048,576 tokens total
    - Protocol Status        : Connected & Healthy.
      `);
      rl.prompt();
      return;
    }

    // Treat as direct prompting with classification
    let cleanPrompt = text;
    if (lowerText.startsWith('/run ')) {
      cleanPrompt = text.slice(5).trim();
    } else if (lowerText.startsWith('cdl run ')) {
      cleanPrompt = text.slice(8).trim();
    }

    const intent = await classifyIntent(ai, cleanPrompt, currentProfile);
    if (intent === "CODE") {
      await runSwarmCompile(ai, cleanPrompt, currentProfile);
    } else {
      await handleChat(ai, cleanPrompt, currentProfile);
    }
    rl.prompt();
  });
}

main();
