"use client";

import Link from "next/link";
import { Workflow } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function WorkflowCard({ workflow }: { workflow: Workflow }) {
  return (
    <Link href={`/workflows/${workflow.id}`}>
      <Card className="p-4 hover:bg-muted transition cursor-pointer">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{workflow.name}</h3>
          <Badge variant="secondary">{workflow.status}</Badge>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Updated {new Date(workflow.updatedAt).toLocaleString()}
        </p>
      </Card>
    </Link>
  );
}
