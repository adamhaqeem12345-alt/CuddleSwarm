# 🧸 CuddleIA CLI (`cdl`)

> **An interactive, multi-agent CLI workspace & developer sandbox powered by Google's Gemini models.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Gemini API](https://img.shields.io/badge/Powered%20by-Gemini%202.0-8E75B2.svg)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)](https://tailwindcss.com/)

**CuddleIA** is a next-generation local developer sandbox and CLI assistant designed to bridge local terminal execution with autonomous AI agent workflows. By typing a simple `cdl` command in your terminal, developers gain an intelligent co-pilot capable of code generation, automated architecture routing, Model Context Protocol (MCP) tool integration, and persistent workspace memory.

---

## ✨ Key Capabilities

### 🏢 Corporate Hierarchy Routing
CuddleIA doesn't just treat AI as a chatbot; it simulates an entire engineering department. Tasks are automatically triaged and routed to specialized personas:
* **CTO Agent:** High-level architectural decisions, system blueprints, and tech-stack governance.
* **Dev Agent:** Surgical code generation, debugging, file editing, and refactoring.
* **QA Agent:** Test verification, edge-case auditing, and linting compliance.

### 🔌 Model Context Protocol (MCP) Connectors
Extend the assistant's reach beyond standard text generation. CuddleIA interfaces with local and remote MCP servers to interact with external tools, file systems, and APIs seamlessly.

### 🧠 Permanent `MemoryCore`
Unlike standard LLM sessions that reset on page reload, CuddleIA maintains durable local state and persistent key-value memory across logins and restarts.

### ⚡ Global `cdl` CLI Workflow
Designed for rapid terminal invocation. Once linked, typing `cdl` instantly launches the interactive session—no repetitive configuration or manual API key re-entry required.

---

## 🏗️ Architecture & Tech Stack

CuddleIA is built on a modern **Full-Stack (Client + Server-side Proxy)** architecture to guarantee maximum security for API secrets while delivering a snappy user interface:

* **Frontend:** React 19, TypeScript, Lucide Icons, and Tailwind CSS v4.
* **Backend Proxy:** Express.js running on Node.js (proxies all `@google/genai` requests server-side to keep secrets safe).
* **AI Engine:** Google GenAI SDK (`@google/genai` v2.4+) utilizing **Gemini 2.5 / 2.0 Flash**.
* **Build System:** Vite + Esbuild (compiles standalone self-contained server bundles).
* **Animations:** Motion (Framer Motion v12).

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **npm** or **pnpm**
* A Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/cuddleia-cli.git
   cd cuddleia-cli
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and insert your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Link the CLI globally (One-Time Setup):**
   ```bash
   npm link
   ```
   *Now you can launch the assistant from any terminal window simply by typing `cdl`!*

5. **Start the Development Sandbox:**
   ```bash
   npm run dev
   ```

---

## 📜 Available Scripts

* `npm run dev` — Boots the full-stack development server with live Vite HMR middleware.
* `npm run build` — Bundles the client production app and builds the compiled `dist/server.cjs` Node entry point.
* `npm run start` — Launches the production server bundle.
* `npm run lint` — Executes TypeScript type-checking across the project.

---

## 📄 License

Distributed under the MIT License. Crafted with ❤️ for AI Studio Build.
