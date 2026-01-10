import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNode } from "../../types";

export default function AIAgentNode(
  props: NodeProps<{ node: WorkflowNode<"ai.agent"> }>
) {
  const node = props.data.node;
  const data = node.data;

  const getModelDisplay = () => {
    switch (data.chatModel) {
      case "openai":
        return `OpenAI: ${data.openaiModel || "gpt-4"}`;
      case "claude":
        return `Claude: ${data.claudeModel?.split("-")[1] || "sonnet"}`;
      case "gemini":
        return `Gemini: ${data.geminiModel?.split("-")[1] || "pro"}`;
      case "ollama":
        return `Ollama: ${data.ollamaModel || "llama2"}`;
      default:
        return "No model selected";
    }
  };

  return (
    <BaseNode node={node}>
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Model</span>
          <span className="font-medium">{getModelDisplay()}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Memory</span>
          <span className="font-medium capitalize">
            {data.memoryType || "none"}
          </span>
        </div>

        {data.contextWindowLength && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Context</span>
            <span className="font-medium">
              {data.contextWindowLength} msgs
            </span>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
