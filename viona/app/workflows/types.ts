

export type WorkflowId = string;
export type WorkflowRunId = string;
export type NodeId = string;
export type EdgeId = string;



export type WorkflowStatus =
  | "draft"
  | "published"
  | "paused";


export type WorkflowNodeCategory =
  | "trigger"
  | "action"
  | "condition"
  | "ai";

export interface DiscordSendMessageData {
  webhookUrl: string;
  message: string;
}

export interface NotionCreatePageData {
  databaseId: string;
  properties: Record<string, any>;
}

export interface AirtableCreateRecordData {
  baseId: string;
  tableId: string;
  fields: Record<string, any>;
}

export interface GitHubCreateIssueData {
  repo: string; // "owner/repo"
  title: string;
  body: string;
}



export type WorkflowNodeType =
  | "trigger.manual"
  | "trigger.event"
  | "trigger.schedule"
  | "action.notify"
  | "action.http"
  | "action.delay"
  | "action.update_inventory"
  | "action.slack.sendMessage"
  | "action.googleSheets.appendRow"
  | "action.discord.sendMessage"
  | "action.notion.createPage"
  | "action.airtable.createRecord"
  | "action.github.createIssue"
  | "condition.if"
  | "ai.prompt"
  | "ai.prompt"
  | "ai.memory"
  | "ai.agent";


/* ---------- Base Node Interface ---------- */

export interface NodePort {
  id: string;
  kind: "source" | "target";
  label?: string;
}

export interface WorkflowNodeBase<T = any> {
  id: NodeId;
  type: WorkflowNodeType;
  category: WorkflowNodeCategory;
  data: T;

  position: {
    x: number;
    y: number;
  };
}

/* ---------- Trigger Node Data ---------- */

export interface ManualTriggerData {
  label?: string;
}

export interface EventTriggerData {
  event:
  | "order.created"
  | "order.updated"
  | "inventory.low"
  | "inventory.out_of_stock";
}

export interface ScheduleTriggerData {
  cron: string;
}

/* ---------- Action Node Data ---------- */

export interface NotifyActionData {
  channel: "email" | "sms" | "in_app";
  recipients: "admin" | "manager" | "employee";
  message: string;
}

export interface HttpActionData {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
}

export interface DelayActionData {
  durationMs: number;
}

export interface UpdateInventoryActionData {
  sku: string;
  delta: number;
}



/* ---------- Condition Node Data ---------- */

export interface IfConditionData {
  expression: string;
  trueLabel?: string;
  falseLabel?: string;
}

/* ---------- AI Node Data ---------- */

export type MemoryType =
  | "buffer"
  | "buffer-window"
  | "redis"
  | "postgres";

export interface MemoryNodeData {
  memoryType: MemoryType;
  sessionKey: string;
  contextWindowLength?: number;
}

export interface AIPromptNodeData {
  prompt: string;
  model?: "gpt-4" | "gemini" | "grok";
  temperature?: number;
}

export type AIProvider =
  | "openai"
  | "claude"
  | "gemini"
  | "ollama";

export interface AIAgentNodeData {
  chatModel: AIProvider;

  // Provider-specific models
  openaiModel?: string;
  claudeModel?: string;
  geminiModel?: string;
  ollamaModel?: string;

  // Memory integration
  memoryType?: MemoryType;
  contextWindowLength?: number;
}

/* ---------- Strongly Typed Node Union ---------- */

export type WorkflowNode<T extends WorkflowNodeType = WorkflowNodeType> = {
  id: NodeId;
  type: T;
  category: WorkflowNodeCategory;
  position?: {
    x: number;
    y: number;
  };
  data: NodeDataByType[T];
};


export type NodeDataByType = {
  "trigger.manual": ManualTriggerData;
  "trigger.event": EventTriggerData;
  "trigger.schedule": ScheduleTriggerData;
  "action.notify": NotifyActionData;
  "action.http": HttpActionData;
  "action.delay": DelayActionData;
  "action.update_inventory": UpdateInventoryActionData;
  "action.slack.sendMessage": SlackSendMessageData;
  "action.googleSheets.appendRow": GoogleSheetsAppendRowData;
  "action.discord.sendMessage": DiscordSendMessageData;
  "action.notion.createPage": NotionCreatePageData;
  "action.airtable.createRecord": AirtableCreateRecordData;
  "action.github.createIssue": GitHubCreateIssueData;
  "condition.if": IfConditionData;
  "ai.prompt": AIPromptNodeData;
  "ai.memory": MemoryNodeData;
  "ai.agent": AIAgentNodeData;

};

/* ---------- Edge Definition ---------- */

export interface WorkflowEdge {
  id: EdgeId;
  source: NodeId;
  target: NodeId;


  condition?: string;
}


export interface WorkflowDefinition {
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/* ---------- Persisted Workflow ---------- */

export interface Workflow {
  id: WorkflowId;
  name: string;
  description?: string;
  status: WorkflowStatus;
  orgId: string;

  definition: WorkflowDefinition;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Workflow Run & Logs ---------- */

export type WorkflowRunStatus =
  | "pending"
  | "running"
  | "success"
  | "failed";

export interface WorkflowRunLog {
  nodeId: NodeId;
  status: WorkflowRunStatus;
  output?: any;
  error?: string;
  timestamp: string;
}

export interface WorkflowRun {
  id: WorkflowRunId;
  workflowId: WorkflowId;
  status: WorkflowRunStatus;
  logs: WorkflowRunLog[];
  startedAt: string;
  finishedAt?: string;
}

// Slack
export interface SlackSendMessageData {
  channel: string;
  message: string;
  username?: string;
}

// Google Sheets
export interface GoogleSheetsAppendRowData {
  spreadsheetId: string;
  sheetName: string;
  values: string[]; // Array of cell values
}