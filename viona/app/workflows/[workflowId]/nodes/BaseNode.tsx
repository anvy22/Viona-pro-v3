import { Handle, Position } from "reactflow";
import { cn } from "@/lib/utils";
import { WorkflowNode } from "../../types";
import { getNodeDefinition } from "../../action";
import { useReactFlow } from "reactflow";

interface BaseNodeProps {
    node: WorkflowNode;
    children?: React.ReactNode;
}

const colorMap: Record<string, { 
    border: string; 
    bg: string; 
    text: string;
    selectedRing: string;
    handle: string;
}> = {
    yellow: {
        border: "border-yellow-500/70",
        bg: "bg-yellow-50/90 dark:bg-yellow-950/30",
        text: "text-yellow-700 dark:text-yellow-300",
        selectedRing: "ring-yellow-500/50",
        handle: "bg-yellow-500"
    },
    blue: {
        border: "border-blue-500/70",
        bg: "bg-blue-50/90 dark:bg-blue-950/30",
        text: "text-blue-700 dark:text-blue-300",
        selectedRing: "ring-blue-500/50",
        handle: "bg-blue-500"
    },
    green: {
        border: "border-green-500/70",
        bg: "bg-green-50/90 dark:bg-green-950/30",
        text: "text-green-700 dark:text-green-300",
        selectedRing: "ring-green-500/50",
        handle: "bg-green-500"
    },
    purple: {
        border: "border-purple-500/70",
        bg: "bg-purple-50/90 dark:bg-purple-950/30",
        text: "text-purple-700 dark:text-purple-300",
        selectedRing: "ring-purple-500/50",
        handle: "bg-purple-500"
    },
    orange: {
        border: "border-orange-500/70",
        bg: "bg-orange-50/90 dark:bg-orange-950/30",
        text: "text-orange-700 dark:text-orange-300",
        selectedRing: "ring-orange-500/50",
        handle: "bg-orange-500"
    },
    pink: {
        border: "border-pink-500/70",
        bg: "bg-pink-50/90 dark:bg-pink-950/30",
        text: "text-pink-700 dark:text-pink-300",
        selectedRing: "ring-pink-500/50",
        handle: "bg-pink-500"
    },
    // Brand-specific colors
    slack: {
        border: "border-[#4A154B]/70",
        bg: "bg-[#4A154B]/15 dark:bg-[#4A154B]/25",
        text: "text-[#4A154B] dark:text-[#E01E5A]",
        selectedRing: "ring-[#4A154B]/50",
        handle: "bg-[#4A154B]"
    },
    sheets: {
        border: "border-[#0F9D58]/70",
        bg: "bg-[#0F9D58]/15 dark:bg-[#0F9D58]/25",
        text: "text-[#0F9D58] dark:text-[#34A853]",
        selectedRing: "ring-[#0F9D58]/50",
        handle: "bg-[#0F9D58]"
    },
    discord: {
        border: "border-[#5865F2]/70",
        bg: "bg-[#5865F2]/15 dark:bg-[#5865F2]/25",
        text: "text-[#5865F2] dark:text-[#7289DA]",
        selectedRing: "ring-[#5865F2]/50",
        handle: "bg-[#5865F2]"
    },
    notion: {
        border: "border-black/70 dark:border-white/70",
        bg: "bg-black/10 dark:bg-white/10",
        text: "text-black dark:text-white",
        selectedRing: "ring-black/50 dark:ring-white/50",
        handle: "bg-black dark:bg-white"
    },
    airtable: {
        border: "border-[#FCB400]/70",
        bg: "bg-[#FCB400]/15 dark:bg-[#FCB400]/25",
        text: "text-[#FCB400] dark:text-[#FDCB6E]",
        selectedRing: "ring-[#FCB400]/50",
        handle: "bg-[#FCB400]"
    },
    github: {
        border: "border-[#181717]/70 dark:border-white/70",
        bg: "bg-[#181717]/10 dark:bg-white/10",
        text: "text-[#181717] dark:text-white",
        selectedRing: "ring-[#181717]/50 dark:ring-white/50",
        handle: "bg-[#181717] dark:bg-white"
    },
    openai: {
        border: "border-[#10A37F]/70",
        bg: "bg-[#10A37F]/15 dark:bg-[#10A37F]/25",
        text: "text-[#10A37F] dark:text-[#10A37F]",
        selectedRing: "ring-[#10A37F]/50",
        handle: "bg-[#10A37F]"
    },
    gray: {
        border: "border-gray-500/70",
        bg: "bg-gray-50/90 dark:bg-gray-900/30",
        text: "text-gray-700 dark:text-gray-300",
        selectedRing: "ring-gray-500/50",
        handle: "bg-gray-500"
    },
};

export default function BaseNode({ node, children }: BaseNodeProps) {
    const definition = getNodeDefinition(node.type);
    const { getNode } = useReactFlow();
    const reactFlowNode = getNode(node.id);
    const isSelected = reactFlowNode?.selected ?? false;

    if (!definition) {
        return (
            <div className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950 p-3 min-w-[200px]">
                <div className="text-sm font-medium text-red-600">Unknown Node</div>
                <div className="text-xs text-red-500">{node.type}</div>
            </div>
        );
    }

    const Icon = definition.icon;
    const colors = colorMap[definition.color] || colorMap.gray;

    return (
        <div className="group relative">
            {/* Target handles */}
            {definition.ports
                .filter(p => p.kind === "target")
                .map((port, idx) => {
                    const targetPorts = definition.ports.filter(p => p.kind === "target");
                    return (
                        <Handle
                            key={port.id}
                            type="target"
                            position={Position.Left}
                            id={port.id}
                            style={{
                                top: `${((idx + 1) * 100) / (targetPorts.length + 1)}%`,
                            }}
                            className={cn(
                                "w-3 h-3 border-2 border-background transition-all duration-200",
                                "hover:w-4 hover:h-4 hover:scale-110",
                                colors.handle,
                                isSelected && "ring-2 ring-background"
                            )}
                        />
                    );
                })}

            {/* Node card */}
            <div
                className={cn(
                    "rounded-lg border-2 shadow-md transition-all duration-200 min-w-[220px] max-w-[280px]",
                    "backdrop-blur-sm",
                    colors.border,
                    colors.bg,
                    // Hover effects
                    "hover:shadow-xl",
                    // Selection effects
                    isSelected && [
                        "ring-4 ring-offset-1 ring-offset-background shadow-2xl scale-[1.03]",
                        colors.selectedRing,
                        "border-opacity-100"
                    ]
                )}
            >
                {/* Header */}
                <div className={cn(
                    "flex items-center gap-2 px-3 py-2.5 border-b transition-colors",
                    colors.text,
                    isSelected && "font-semibold"
                )}>
                    <Icon className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-200",
                        isSelected && "scale-110"
                    )} />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate leading-tight">
                            {definition.label}
                        </div>
                        <div className={cn(
                            "text-[10px] uppercase tracking-wide truncate mt-0.5",
                            "text-muted-foreground/70"
                        )}>
                            {definition.category}
                        </div>
                    </div>
                </div>

                {/* Body */}
                {children && (
                    <div className="px-3 py-2.5 text-xs space-y-1.5 bg-background/40">
                        {children}
                    </div>
                )}
            </div>

            {/* Source handles */}
            {definition.ports
                .filter(p => p.kind === "source")
                .map((port, idx) => {
                    const sourcePorts = definition.ports.filter(p => p.kind === "source");
                    return (
                        <Handle
                            key={port.id}
                            type="source"
                            position={Position.Right}
                            id={port.id}
                            style={{
                                top: `${((idx + 1) * 100) / (sourcePorts.length + 1)}%`,
                            }}
                            className={cn(
                                "w-3 h-3 border-2 border-background transition-all duration-200",
                                "hover:w-4 hover:h-4 hover:scale-110",
                                colors.handle,
                                isSelected && "ring-2 ring-background"
                            )}
                        />
                    );
                })}
        </div>
    );
}
