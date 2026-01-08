"use client";

import { Workflow, WorkflowDefinition, WorkflowNodeCategory, WorkflowNodeType, NodePort } from "./types";

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
  SiOpenai
} from "react-icons/si";

import { 
  FaBolt, 
  FaBell, 
  FaGlobe, 
  FaBrain,
  FaCodeBranch,
  FaCalendarAlt,
  FaDatabase
} from "react-icons/fa";
import { MdEvent } from "react-icons/md";

export type NodeDefinition = {
  type: WorkflowNodeType;
  category: WorkflowNodeCategory;
  label: string;
  description: string;
  icon: IconType;           
  color: string;          
  defaultData: any;
  ports: NodePort[];     
};

export const NODE_REGISTRY: NodeDefinition[] = [
  // ========== TRIGGERS ==========
  {
    type: "trigger.manual",
    category: "trigger",
    label: "Manual Trigger",
    description: "Manually start the workflow",
    icon: FaBolt,                    
    color: "yellow",
    defaultData: { label: "Manual Trigger" },
    ports: [
      { id: "out", kind: "source" }
    ],
  },

  {
    type: "trigger.event",
    category: "trigger",
    label: "Event Trigger",
    description: "Trigger on system events",
    icon: MdEvent,
    color: "purple",
    defaultData: { event: "order.created" },
    ports: [
      { id: "out", kind: "source" }
    ],
  },

  {
    type: "trigger.schedule",
    category: "trigger",
    label: "Schedule Trigger",
    description: "Run on a cron schedule",
    icon: FaCalendarAlt,
    color: "blue",
    defaultData: { cron: "0 9 * * *" },
    ports: [
      { id: "out", kind: "source" }
    ],
  },

  // ========== ACTIONS ==========
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
      { id: "out", kind: "source" }
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
      { id: "out", kind: "source" }
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
      { id: "out", kind: "source" }
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
      { id: "out", kind: "source" }
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
      { id: "out", kind: "source" }
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
      { id: "out", kind: "source" }
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
      { id: "out", kind: "source" }
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
      { id: "out", kind: "source" }
    ],
  },

  // ========== CONDITIONS ==========
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
      { id: "false", kind: "source", label: "False" }
    ],
  },

  // ========== AI ==========
  {
    type: "ai.prompt",
    category: "ai",
    label: "OpenAI",
    description: "Run AI prompt with GPT",
    icon: SiOpenai,                  
    color: "openai",
    defaultData: {
      prompt: "",
      model: "gpt-4",
      temperature: 0.7,
    },
    ports: [
      { id: "in", kind: "target" },
      { id: "out", kind: "source" }
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
      { id: "out", kind: "source" }
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
