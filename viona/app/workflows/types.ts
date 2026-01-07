

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


export type WorkflowNodeType =
  | "trigger.manual"
  | "trigger.event"
  | "trigger.schedule"
  | "action.notify"
  | "action.http"
  | "action.delay"
  | "action.update_inventory"
  | "condition.if"
  | "ai.prompt";

/* ---------- Base Node Interface ---------- */

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

export interface AIPromptNodeData {
  prompt: string;
  model?: "gpt-4" | "gemini" | "grok";
  temperature?: number;
}

/* ---------- Strongly Typed Node Union ---------- */

export type WorkflowNode =
  | WorkflowNodeBase<ManualTriggerData>
  | WorkflowNodeBase<EventTriggerData>
  | WorkflowNodeBase<ScheduleTriggerData>
  | WorkflowNodeBase<NotifyActionData>
  | WorkflowNodeBase<HttpActionData>
  | WorkflowNodeBase<DelayActionData>
  | WorkflowNodeBase<UpdateInventoryActionData>
  | WorkflowNodeBase<IfConditionData>
  | WorkflowNodeBase<AIPromptNodeData>;

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

