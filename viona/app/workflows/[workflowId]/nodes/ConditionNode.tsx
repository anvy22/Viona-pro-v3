import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNode } from "../../types";

export default function ConditionNode(
  props: NodeProps<{ node: WorkflowNode }>
) {
  const node = props.data.node;
  const data = node.data as any;

  return (
    <BaseNode node={node}>
      <div className="space-y-1.5">
        <div className="font-mono text-[10px] bg-muted/50 px-2 py-1 rounded truncate">
          {data.expression || "No condition"}
        </div>

        <div className="flex justify-between items-center pt-1 border-t">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
              {data.trueLabel || "True"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
              {data.falseLabel || "False"}
            </span>
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
