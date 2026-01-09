// nodes/GitHubNode.tsx
import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNodeBase, GitHubCreateIssueData } from "../../types";

export default function GitHubNode({ data, id }: NodeProps<GitHubCreateIssueData>) {
  const node: WorkflowNodeBase<GitHubCreateIssueData> = {
    id,
    type: "action.github.createIssue",
    category: "action",
    position: { x: 0, y: 0 },
    data,
  };

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium truncate">
          Repo: {data.repo || "Not set"}
        </div>
        <div className="text-muted-foreground truncate">
          {data.title ? `${data.title.slice(0, 30)}...` : "No title"}
        </div>
      </div>
    </BaseNode>
  );
}
