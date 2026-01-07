import { Handle, Position } from "reactflow";
import { Zap } from "lucide-react";

export default function TriggerNode({ data }: any) {
  return (
    <div className="rounded-md border bg-background shadow-sm px-4 py-2 min-w-[160px]">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Zap className="h-4 w-4 text-yellow-500" />
        {data.label || "Manual Trigger"}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-blue-500"
      />
    </div>
  );
}
