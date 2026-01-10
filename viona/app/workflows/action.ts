"use client";

import { Workflow, WorkflowDefinition, WorkflowNodeCategory, WorkflowNodeType, NodePort, NodeDataByType } from "./types";

/* ------------------ Helpers ------------------ */

const STORAGE_KEY = "viona_workflows";

import { IconType } from "react-icons";

import {
  SiSlack,
  SiGooglesheets,
  SiGoogledocs,
  SiDiscord,
  SiAirtable,
  SiNotion,
  SiTrello,
  SiGithub,
  SiOpenai,
  
} from "react-icons/si";

import {
  FaBolt,
  FaBell,
  FaGlobe,
  FaBrain,
  FaCodeBranch,
  FaCalendarAlt,
  FaDatabase,
  FaClock
} from "react-icons/fa";
import { MdEvent } from "react-icons/md";

export type NodeField =
  | {
    kind: "text";
    name: string;
    label: string;
    placeholder?: string;
  }
  | {
    kind: "textarea";
    name: string;
    label: string;
    rows?: number;
  }
  | {
    kind: "select";
    name: string;
    label: string;
    options: { label: string; value: string }[];
  };

export type NodeDefinition = {
  type: WorkflowNodeType;
  category: WorkflowNodeCategory;
  label: string;
  description: string;
  icon: IconType;
  color: string;
  defaultData: NodeDataByType[WorkflowNodeType];
  ports: NodePort[];
  settings?: NodeField[];
};

export const NODE_REGISTRY: NodeDefinition[] = [
  /* ================= TRIGGERS ================= */

  {
    type: "trigger.manual",
    category: "trigger",
    label: "Manual Trigger",
    description: "Manually start the workflow",
    icon: FaBolt,
    color: "yellow",
    defaultData: { label: "Manual Trigger" },
    ports: [{ id: "out", kind: "source" }],
  },

  {
    type: "trigger.event",
    category: "trigger",
    label: "Event Trigger",
    description: "Trigger on system events",
    icon: MdEvent,
    color: "purple",
    defaultData: { event: "order.created" },
    ports: [{ id: "out", kind: "source" }],
  },

  {
    type: "trigger.schedule",
    category: "trigger",
    label: "Schedule Trigger",
    description: "Run on a cron schedule",
    icon: FaCalendarAlt,
    color: "blue",
    defaultData: { cron: "0 9 * * *" },
    ports: [{ id: "out", kind: "source" }],
    settings: [
      {
        kind: "text",
        name: "cron",
        label: "Cron Expression",
        placeholder: "0 9 * * *",
      },
    ],
  },

  /* ================= ACTIONS ================= */

  {
    type: "action.notify",
    category: "action",
    label: "Send Notification",
    description: "Send email / SMS / in-app notification",
    icon: FaBell,
    color: "blue",
    defaultData: {
      channel: "email",
      recipients: "admin",
      message: "",
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "out", kind: "source" },
    ],
    settings: [
      {
        kind: "select",
        name: "channel",
        label: "Channel",
        options: [
          { label: "Email", value: "email" },
          { label: "SMS", value: "sms" },
          { label: "In App", value: "in_app" },
        ],
      },
      {
        kind: "select",
        name: "recipients",
        label: "Recipients",
        options: [
          { label: "Admin", value: "admin" },
          { label: "Manager", value: "manager" },
          { label: "Employee", value: "employee" },
        ],
      },
      {
        kind: "textarea",
        name: "message",
        label: "Message",
        rows: 4,
      },
    ],
  },

  {
    type: "action.http",
    category: "action",
    label: "HTTP Request",
    description: "Call external API",
    icon: FaGlobe,
    color: "green",
    defaultData: {
      url: "",
      method: "POST",
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "out", kind: "source" },
    ],
    settings: [
      {
        kind: "text",
        name: "url",
        label: "Request URL",
        placeholder: "https://api.example.com",
      },
      {
        kind: "select",
        name: "method",
        label: "HTTP Method",
        options: [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "DELETE", value: "DELETE" },
        ],
      },
    ],
  },

  {
    type: "action.slack.sendMessage",
    category: "action",
    label: "Slack",
    description: "Send message to Slack channel",
    icon: SiSlack,
    color: "slack",
    defaultData: {
      channel: "#general",
      message: "",
      username: "Viona Bot",
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "out", kind: "source" },
    ],
    settings: [
      {
        kind: "text",
        name: "channel",
        label: "Channel",
        placeholder: "#general",
      },
      {
        kind: "textarea",
        name: "message",
        label: "Message",
        rows: 4,
      },
    ],
  },

  {
    type: "action.googleSheets.appendRow",
    category: "action",
    label: "Google Sheets",
    description: "Append row to spreadsheet",
    icon: SiGooglesheets,
    color: "sheets",
    defaultData: {
      spreadsheetId: "",
      sheetName: "Sheet1",
      values: [],
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "out", kind: "source" },
    ],
    settings: [
      {
        kind: "text",
        name: "spreadsheetId",
        label: "Spreadsheet ID",
      },
      {
        kind: "text",
        name: "sheetName",
        label: "Sheet Name",
      },
    ],
  },

  {
    type: "action.discord.sendMessage",
    category: "action",
    label: "Discord",
    description: "Send message to Discord channel",
    icon: SiDiscord,
    color: "discord",
    defaultData: {
      webhookUrl: "",
      message: "",
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "out", kind: "source" },
    ],
    settings: [
      {
        kind: "text",
        name: "webhookUrl",
        label: "Webhook URL",
      },
      {
        kind: "textarea",
        name: "message",
        label: "Message",
      },
    ],
  },

  {
    type: "action.notion.createPage",
    category: "action",
    label: "Notion",
    description: "Create a new Notion page",
    icon: SiNotion,
    color: "notion",
    defaultData: {
      databaseId: "",
      properties: {},
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "out", kind: "source" },
    ],
    settings: [
      {
        kind: "text",
        name: "databaseId",
        label: "Database ID",
      },
    ],
  },

  {
    type: "action.airtable.createRecord",
    category: "action",
    label: "Airtable",
    description: "Create record in Airtable base",
    icon: SiAirtable,
    color: "airtable",
    defaultData: {
      baseId: "",
      tableId: "",
      fields: {},
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "out", kind: "source" },
    ],
    settings: [
      {
        kind: "text",
        name: "baseId",
        label: "Base ID",
      },
      {
        kind: "text",
        name: "tableId",
        label: "Table ID",
      },
    ],
  },

  {
    type: "action.github.createIssue",
    category: "action",
    label: "GitHub",
    description: "Create issue in GitHub repo",
    icon: SiGithub,
    color: "github",
    defaultData: {
      repo: "",
      title: "",
      body: "",
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "out", kind: "source" },
    ],
    settings: [
      { kind: "text", name: "repo", label: "Repository (owner/repo)" },
      { kind: "text", name: "title", label: "Issue Title" },
      { kind: "textarea", name: "body", label: "Issue Body" },
    ],
  },
  {
    type: "action.delay",
    category: "action",
    label: "Delay",
    description: "Pause workflow execution for a duration",
    icon: FaClock, // or any icon you prefer
    color: "gray",
    defaultData: {
      durationMs: 1000,
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "out", kind: "source" },
    ],
    settings: [
      {
        kind: "text",
        name: "durationMs",
        label: "Delay (ms)",
        placeholder: "1000",
      },
    ],
  },

  /* ================= CONDITION ================= */
  {
    type: "condition.if",
    category: "condition",
    label: "If Condition",
    description: "Branch workflow based on condition",
    icon: FaCodeBranch,
    color: "orange",
    defaultData: {
      expression: "",
      trueLabel: "True",
      falseLabel: "False",
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "true", kind: "source", label: "True" },
      { id: "false", kind: "source", label: "False" },
    ],
    settings: [
      {
        kind: "text",
        name: "expression",
        label: "Condition Expression",
        placeholder: "order.total > 1000",
      },
      {
        kind: "text",
        name: "trueLabel",
        label: "True Path Label",
      },
      {
        kind: "text",
        name: "falseLabel",
        label: "False Path Label",
      },
    ],
  },


  /* ================= AI ================= */

  {
    type: "ai.agent",
    category: "ai",
    label: "AI Agent",
    description: "Autonomous AI agent with memory & tools",
    icon: FaBrain,
    color: "green",
    defaultData: {
      chatModel: "openai",
      openaiModel: "gpt-4",
      memoryType: "buffer",
      contextWindowLength: 10,
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "out", kind: "source" },
    ],
    settings: [
      {
        kind: "select",
        name: "chatModel",
        label: "Chat Provider",
        options: [
          { label: "OpenAI", value: "openai" },
          { label: "Claude", value: "claude" },
          { label: "Gemini", value: "gemini" },
          { label: "Ollama", value: "ollama" },
        ],
      },
      {
        kind: "text",
        name: "openaiModel",
        label: "Model Name",
      },
      {
        kind: "select",
        name: "memoryType",
        label: "Memory Type",
        options: [
          { label: "None", value: "none" },
          { label: "Buffer", value: "buffer" },
          { label: "Redis", value: "redis" },
        ],
      },
      {
        kind: "text",
        name: "contextWindowLength",
        label: "Context Window",
      },
    ],
  },

  {
    type: "ai.prompt",
    category: "ai",
    label: "AI Prompt",
    description: "Run an AI prompt (LLM)",
    icon: SiOpenai,
    color: "openai",
    defaultData: {
      prompt: "",
      model: "gpt-4",
      temperature: 0.7,
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "out", kind: "source" },
    ],
    settings: [
      { kind: "textarea", name: "prompt", label: "Prompt", rows: 6 },
      {
        kind: "select",
        name: "model",
        label: "Model",
        options: [
          { label: "GPT-4", value: "gpt-4" },
          { label: "Gemini", value: "gemini" },
          { label: "Grok", value: "grok" },
        ],
      },
      { kind: "text", name: "temperature", label: "Temperature" },
    ],
  },

  {
    type: "ai.memory",
    category: "ai",
    label: "Memory",
    description: "Attach memory to AI agents",
    icon: FaBrain,
    color: "purple",
    defaultData: {
      memoryType: "buffer",
      sessionKey: "default",
      contextWindowLength: 10,
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "out", kind: "source" },
    ],
    settings: [
      {
        kind: "select",
        name: "memoryType",
        label: "Memory Type",
        options: [
          { label: "Buffer", value: "buffer" },
          { label: "Buffer Window", value: "buffer-window" },
          { label: "Redis", value: "redis" },
          { label: "Postgres", value: "postgres" },
        ],
      },
      {
        kind: "text",
        name: "sessionKey",
        label: "Session Key",
      },
      {
        kind: "text",
        name: "contextWindowLength",
        label: "Context Window Size",
      },
    ],
  },

  {
    type: "action.update_inventory",
    category: "action",
    label: "Update Inventory",
    description: "Update product stock levels",
    icon: FaDatabase,
    color: "gray",
    defaultData: {
      sku: "",
      delta: 0,
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "out", kind: "source" },
    ],
    settings: [
      { kind: "text", name: "sku", label: "SKU" },
      { kind: "text", name: "delta", label: "Quantity Change" },
    ],
  },
];


function readWorkflows(): Workflow[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeWorkflows(workflows: Workflow[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}

function emptyDefinition(): WorkflowDefinition {
  return {
    version: 1,
    nodes: [],
    edges: [],
  };
}

/* ------------------ Actions ------------------ */

export async function getWorkflows(orgId: string): Promise<Workflow[]> {
  return readWorkflows().filter(w => w.orgId === orgId);
}

export async function getWorkflowById(id: string): Promise<Workflow | null> {
  return readWorkflows().find(w => w.id === id) ?? null;
}

export async function createWorkflow(input: {
  name: string;
  orgId: string;
  createdBy: string;
}) {
  const workflows = readWorkflows();
  const now = new Date().toISOString();

  const workflow: Workflow = {
    id: crypto.randomUUID(),
    name: input.name,
    status: "draft",
    orgId: input.orgId,
    definition: emptyDefinition(),
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  workflows.push(workflow);
  writeWorkflows(workflows);

  return workflow;
}

export async function updateWorkflow(
  id: string,
  updater: (wf: Workflow) => Workflow
) {
  const workflows = readWorkflows();

  const updated = workflows.map(w =>
    w.id === id ? updater(w) : w
  );

  writeWorkflows(updated);
}


export function getNodeDefinition(type: WorkflowNodeType): NodeDefinition | undefined {
  return NODE_REGISTRY.find(n => n.type === type);
}
