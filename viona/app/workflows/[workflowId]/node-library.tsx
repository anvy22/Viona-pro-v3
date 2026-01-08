"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { NODE_REGISTRY } from "../action";
import { WorkflowNode } from "../types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  onAddNode: (node: WorkflowNode) => void;
  readOnly: boolean;
}

export default function NodeLibrary({ onAddNode, readOnly }: Props) {
  const [query, setQuery] = useState("");

  const filtered = NODE_REGISTRY.filter(n =>
    n.label.toLowerCase().includes(query.toLowerCase()) ||
    n.description.toLowerCase().includes(query.toLowerCase())
  );

  // Group by category
  const grouped = filtered.reduce((acc, node) => {
    if (!acc[node.category]) acc[node.category] = [];
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, typeof NODE_REGISTRY>);

  return (
    <aside className="w-[280px] border-r bg-background flex flex-col">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search nodes..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(grouped).map(([category, nodes]) => (
          <div key={category}>
            {/* Category Header */}
            <div className="px-3 py-2 bg-muted/50 border-b">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </span>
            </div>

            {/* Nodes in Category */}
            {nodes.map(def => {
              const Icon = def.icon;
              
              return (
                <button
                  key={def.type}
                  disabled={readOnly}
                  onClick={() =>
                    onAddNode({
                      id: crypto.randomUUID(),
                      type: def.type,
                      category: def.category,
                      position: { x: 300, y: 200 },
                      data: def.defaultData,
                    })
                  }
                  className={cn(
                    "w-full px-3 py-2.5 flex items-start gap-3 text-sm hover:bg-muted/50 transition-colors border-b border-border/50",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {/* Icon */}
                  <div className="mt-0.5">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-foreground">
                      {def.label}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {def.description}
                    </div>
                  </div>

                  {/* Add Icon */}
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}