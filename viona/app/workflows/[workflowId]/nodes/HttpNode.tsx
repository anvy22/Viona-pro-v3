import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNodeBase, HttpActionData } from "../../types";
import { Badge } from "@/components/ui/badge";

export default function HttpNode({ data, id }: NodeProps<HttpActionData>) {
  const node: WorkflowNodeBase<HttpActionData> = {
    id,
    type: "action.http",
    category: "action",
    position: { x: 0, y: 0 },
    data,
  };

  return (
    <BaseNode node={node}>
      <div className="space-y-1">
        <Badge variant="outline" className="text-[10px]">{data.method}</Badge>
        <div className="text-muted-foreground truncate">
          {data.url || "No URL set"}
        </div>
      </div>
    </BaseNode>
  );
}