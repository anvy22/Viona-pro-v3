"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import DesktopSidebar from "@/components/DesktopSidebar";
import { BreadcrumbHeader } from "@/components/BreadcrumbHeader";
import { ModeToggle } from "@/components/ThemeModeToggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { toast } from "sonner";

import { useOrgStore, useCurrentOrgRole } from "@/hooks/useOrgStore";
import { getWorkflowById, updateWorkflow } from "../action";

import type {
    Workflow,
    WorkflowDefinition,
    WorkflowNode,
} from "../types";

import Toolbar from "./toolbar";
import Canvas from "./canvas";
import Sidebar from "./sidebar";

export default function WorkflowEditorPage() {
    const params = useParams();
    const router = useRouter();
    const workflowId = params.workflowId as string;

    const { selectedOrgId } = useOrgStore();
    const role = useCurrentOrgRole();
    const isAdmin = role === "admin";

    // 🔹 Loaded data
    const [workflow, setWorkflow] = useState<Workflow | null>(null);

    // 🔹 Editor-owned state (initialized AFTER load)
    const [definition, setDefinition] =
        useState<WorkflowDefinition | null>(null);

    const [selectedNode, setSelectedNode] =
        useState<WorkflowNode | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);


    /* ------------------ Load workflow ------------------ */
    useEffect(() => {
        async function load() {
            const wf = await getWorkflowById(workflowId);

            if (!wf) {
                router.replace("/workflows");
                return;
            }

            setWorkflow(wf);
            setDefinition(wf.definition);
            setIsLoading(false);
        }

        load();
    }, [workflowId, router]);

    /* ------------------ Guards ------------------ */

    if (!selectedOrgId || isLoading) {
        return null;
    }

    if (!workflow || !definition) {
        return null;
    }

    const readOnly = !isAdmin;

    /* ------------------ Actions ------------------ */

    const addManualTrigger = () => {
        if (!isAdmin) return;

        const alreadyHasTrigger = definition.nodes.some(
            n => n.category === "trigger"
        );
        if (alreadyHasTrigger) return;

        const node: WorkflowNode = {
            id: crypto.randomUUID(),
            type: "trigger.manual",
            category: "trigger",
            position: { x: 250, y: 150 },
            data: { label: "Manual Trigger" },
        };

        setDefinition(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                nodes: [...prev.nodes, node],
            };
        });

        setSelectedNode(node);
    };

    const saveWorkflow = async () => {
        if (!workflow || readOnly) return;

        try {
            setIsSaving(true);

            await updateWorkflow(workflow.id, prev => ({
                ...prev,
                definition,
                updatedAt: new Date().toISOString(),
            }));

            toast.success("Workflow saved");
        } catch {
            toast.error("Failed to save workflow");
        } finally {
            setIsSaving(false);
        }
    };

    const updateNode = (updated: WorkflowNode) => {
        setDefinition(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                nodes: prev.nodes.map(n =>
                    n.id === updated.id ? updated : n
                ),
            };
        });

        setSelectedNode(updated);
    };


    /* ------------------ Layout ------------------ */

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <DesktopSidebar />

            <div className="flex flex-col flex-1 min-h-0">
                {/* Header */}
                <header className="flex items-center justify-between px-4 h-[50px] border-b">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/workflows")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>


                        <div className="flex items-center gap-2">
                            <h1 className="font-semibold">{workflow.name}</h1>
                            <Badge variant="secondary">{workflow.status}</Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <ModeToggle />
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>
                </header>

                <Toolbar
                    status={workflow.status}
                    disabled={readOnly}
                    onAddTrigger={addManualTrigger}
                    onSave={saveWorkflow}
                    isSaving={isSaving}
                />

                <Separator />

                <div className="flex flex-1 min-h-0">
                    <div className="flex-1 relative bg-muted/40">
                        <Canvas
                            definition={definition}
                            readOnly={readOnly}
                            onSelectNode={setSelectedNode}
                        />
                    </div>

                    <Sidebar
                        selectedNode={selectedNode}
                        readOnly={readOnly}
                        onUpdateNode={updateNode}
                    />
                </div>
            </div>
        </div>
    );
}
