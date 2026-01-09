// nodes/DelayNode.tsx
import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNodeBase, DelayActionData } from "../../types";

export default function DelayNode({ data, id }: NodeProps<DelayActionData>) {
  const node: WorkflowNodeBase<DelayActionData> = {
    id,
    type: "action.delay",
    category: "action",
    position: { x: 0, y: 0 },
    data,
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium">Delay Duration</div>
        <div className="text-muted-foreground">
          {formatDuration(data.durationMs || 0)}
        </div>
      </div>
    </BaseNode>
  );
}
