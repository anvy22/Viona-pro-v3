import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNode } from "../../types";

export default function ChatModelNode(
  props: NodeProps<{ node: WorkflowNode }>
) {
  const node = props.data.node;
  const data = node.data as any;

  const getProviderColor = () => {
    switch (data.provider) {
      case "openai":
        return "text-green-600 dark:text-green-400";
      case "claude":
        return "text-orange-600 dark:text-orange-400";
      case "gemini":
        return "text-blue-600 dark:text-blue-400";
      case "ollama":
        return "text-purple-600 dark:text-purple-400";
      default:
        return "text-gray-600";
    }
  };

  return (
    <BaseNode node={node}>
      <div className="space-y-1">
        <div className={`font-semibold text-xs ${getProviderColor()}`}>
          {(data.provider || "model").toUpperCase()}
        </div>

        <div className="text-[10px] text-muted-foreground truncate">
          {data.model || "No model selected"}
        </div>

        <div className="flex gap-2 text-[9px] text-muted-foreground pt-1 border-t">
          <span>temp: {data.temperature ?? "-"}</span>
          {data.maxTokens && <span>max: {data.maxTokens}</span>}
        </div>
      </div>
    </BaseNode>
  );
}
