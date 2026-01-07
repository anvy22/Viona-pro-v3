"use client";

import { Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WorkflowNode } from "../types";

interface SidebarProps {
  selectedNode: WorkflowNode | null;
  readOnly: boolean;
}

export default function Sidebar({ selectedNode, readOnly }: SidebarProps) {
  return (
    <aside className="w-[320px] border-l bg-background flex flex-col">
      <div className="h-[48px] px-4 flex items-center border-b">
        <h3 className="text-sm font-semibold">Node Settings</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!selectedNode ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
            <Info className="h-4 w-4 mb-2" />
            Select a node to configure it
          </div>
        ) : (
          <Card className="p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Type</span>
              <Badge>{selectedNode.type}</Badge>
            </div>

            <div className="flex justify-between">
              <span className="text-sm">Category</span>
              <Badge variant="outline">{selectedNode.category}</Badge>
            </div>

            {readOnly && (
              <p className="text-xs text-muted-foreground">
                Read-only access
              </p>
            )}
          </Card>
        )}
      </div>

      <Separator />
    </aside>
  );
}
