import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import React from "react";

type Port = {
  id: string;
  type: "source" | "target";
  label?: string;
};

export type NodeShellData = {
  title: string;
  subtitle?: string;
  accent?: "yellow" | "blue" | "purple" | "green" | "red";
  ports?: {
    in?: Port[];
    out?: Port[];
  };
  content: React.ReactNode;
};

export function NodeShell({
  data,
  selected,
}: NodeProps<NodeShellData>) {
  const accent = data.accent ?? "blue";

  return (
    <div
      className={cn(
        "relative min-w-[220px] rounded-xl border bg-background shadow-sm",
        "transition-colors",
        selected && "ring-2 ring-primary/40"
      )}
    >
      {/* left accent */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1 rounded-l-xl",
          accent === "yellow" && "bg-yellow-500",
          accent === "blue" && "bg-blue-500",
          accent === "purple" && "bg-purple-500",
          accent === "green" && "bg-green-500",
          accent === "red" && "bg-red-500"
        )}
      />

      {/* header */}
      <div className="flex items-start gap-3 p-3 border-b">
        <div
          className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
            accent === "yellow" && "bg-yellow-500/15 text-yellow-600",
            accent === "blue" && "bg-blue-500/15 text-blue-600",
            accent === "purple" && "bg-purple-500/15 text-purple-600",
            accent === "green" && "bg-green-500/15 text-green-600",
            accent === "red" && "bg-red-500/15 text-red-600"
          )}
        >
          <span className="text-sm font-semibold">⦿</span>
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight truncate">
            {data.title}
          </div>
          {data.subtitle && (
            <div className="text-xs text-muted-foreground truncate">
              {data.subtitle}
            </div>
          )}
        </div>
      </div>

      {/* body */}
      <div className="p-3 text-xs text-muted-foreground">
        {data.content}
      </div>

      {/* target handles */}
      {(data.ports?.in ?? []).map((p, idx) => (
        <Handle
          key={p.id}
          id={p.id}
          type="target"
          position={Position.Left}
          style={{ top: 60 + idx * 18 }}
          className="h-3 w-3 border-2 border-background bg-muted-foreground"
        />
      ))}

      {/* source handles */}
      {(data.ports?.out ?? []).map((p, idx) => (
        <Handle
          key={p.id}
          id={p.id}
          type="source"
          position={Position.Right}
          style={{ top: 60 + idx * 18 }}
          className="h-3 w-3 border-2 border-background bg-primary"
        />
      ))}
    </div>
  );
}
