import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNode } from "../../types";

export default function MemoryNode(
  props: NodeProps<{ node: WorkflowNode }>
) {
  const node = props.data.node;
  const data = node.data as any;

  const getMemoryIcon = () => {
    switch (data.memoryType) {
      case "buffer":
        return "💭";
      case "buffer-window":
        return "🪟";
      case "redis":
        return "🔴";
      case "postgres":
        return "🐘";
      default:
        return "📝";
    }
  };

  return (
    <BaseNode node={node}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{getMemoryIcon()}</span>
          <span className="font-medium text-xs capitalize">
            {(data.memoryType || "memory").replace("-", " ")}
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
