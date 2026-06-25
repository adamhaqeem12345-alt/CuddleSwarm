export interface McpTool {
  name: string;
  description: string;
  schema: string; // JSON schema string
}

export interface McpConnection {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  type: 'docs' | 'google' | 'third-party' | 'custom';
  url: string;
  description: string;
  tools: McpTool[];
}

export interface MemoryItem {
  id: string;
  type: 'adr' | 'guideline' | 'history';
  title: string;
  content: string;
  timestamp: string;
}

export interface LogLine {
  id: string;
  type: 'system' | 'cto' | 'dev' | 'qa' | 'devops' | 'error' | 'success';
  message: string;
  timestamp: string;
}

export interface WorkspaceFile {
  path: string;
  name: string;
  content: string;
  language: string;
}

export interface AgentRunState {
  status: 'idle' | 'planning' | 'developing' | 'verifying' | 'deploying' | 'completed' | 'failed' | 'hitl';
  activeAgent?: 'cto' | 'dev' | 'qa' | 'devops';
  currentPrompt: string;
  steps: string[];
  currentStepIndex: number;
  files: WorkspaceFile[];
  qaScore?: number;
  qaReport?: string;
  hitlPrompt?: string;
}
