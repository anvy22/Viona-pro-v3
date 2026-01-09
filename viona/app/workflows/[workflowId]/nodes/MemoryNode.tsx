// nodes/MemoryNode.tsx
import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNodeBase, MemoryNodeData } from "../../types";

export default function MemoryNode({ data, id }: NodeProps<MemoryNodeData>) {
  const node: WorkflowNodeBase<MemoryNodeData> = {
    id,
    type: "ai.memory",
    category: "ai",
    position: { x: 0, y: 0 },
    data,
  };

  const getMemoryIcon = () => {
    switch (data.memoryType) {
      case "buffer": return "💭";
      case "buffer-window": return "🪟";
      case "redis": return "🔴";
      case "postgres": return "🐘";
      default: return "📝";
    }
  };

  return (
    <BaseNode node={node}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{getMemoryIcon()}</span>
          <span className="font-medium text-xs capitalize">
            {data.memoryType.replace("-", " ")}
          </span>
        </div>
        
        <div className="text-[10px] text-muted-foreground">
          Session: {data.sessionKey || "default"}
        </div>

        {data.contextWindowLength && (
          <div className="text-[10px] text-muted-foreground">
            Window: {data.contextWindowLength} messages
          </div>
        )}
      </div>
    </BaseNode>
  );
}
