"use client";

import { Plus, Save, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkflowStatus } from "../types";

interface Props {
  status: WorkflowStatus;
  disabled: boolean;
  onAddTrigger: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function Toolbar({
  status,
  disabled,
  onAddTrigger,
  onSave,
  isSaving,
}: Props) {
  return (
    <div className="flex items-center justify-between px-4 h-[48px] border-b bg-background">
      <div className="flex gap-2">
        <Button size="sm" disabled={disabled} onClick={onAddTrigger}>
          <Plus className="h-4 w-4 mr-2" />
          Add Trigger
        </Button>

        <Button size="sm" variant="outline" disabled>
          <Play className="h-4 w-4 mr-2" />
          Execute
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary">{status}</Badge>
        <Button size="sm" variant="outline" disabled={disabled || isSaving} onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
