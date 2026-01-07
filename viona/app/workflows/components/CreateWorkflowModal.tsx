"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createWorkflow } from "../action";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  userId: string;
  onCreated: () => void;
}

export function CreateWorkflowModal({
  open,
  onOpenChange,
  orgId,
  userId,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;

    setIsSaving(true);
    await createWorkflow({
      name,
      orgId,
      createdBy: userId,
    });
    setIsSaving(false);

    setName("");
    onCreated();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workflow</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Workflow name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isSaving}>
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
