"use client";

import { Workflow, WorkflowDefinition } from "./types";

/* ------------------ Helpers ------------------ */

const STORAGE_KEY = "viona_workflows";

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
