'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
    Background,
    type Node,
    type Edge,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSessionStore } from '@/store/sessionStore';

/* ─────── Pipeline Node Data ─────── */
const PIPELINE_NODES = [
    { id: 'intent_guard', label: 'Intent Guard', icon: '🛡️' },
    { id: 'depth_guard', label: 'Depth Guard', icon: '🧭' },
    { id: 'context_builder', label: 'Context Builder', icon: '🧩' },
    { id: 'file_reader', label: 'File Reader', icon: '📄' },
    { id: 'concept_extractor', label: 'Concept Extractor', icon: '💎' },
    { id: 'concept_validator', label: 'Concept Validator', icon: '✅' },
    { id: 'answer_agent', label: 'Answer Agent', icon: '🤖' },
    { id: 'hallucination_checker', label: 'Hallucination Check', icon: '🔍' },
    { id: 'report_agent', label: 'Report Agent', icon: '📝' },
    { id: 'quiz_agent', label: 'Quiz Agent', icon: '🧪' },
    { id: 'user_gate', label: 'Tree Builder', icon: '🌳' },
];

/* ─────── Custom Node Component ─────── */
function PipelineNode({ data }: { data: any }) {
    const status = data.status;
    const isActive = status === 'active';
    const isComplete = status === 'complete';

    const colors = isActive
        ? { bg: '#eef2ff', border: '#6366f1', text: '#312e81', badge: '#4338ca', shadow: '0 0 18px rgba(99,102,241,0.25)' }
        : isComplete
            ? { bg: '#ecfdf3', border: '#22c55e', text: '#065f46', badge: '#16a34a', shadow: '0 0 14px rgba(34,197,94,0.25)' }
            : { bg: '#f8fafc', border: '#e2e8f0', text: '#0f172a', badge: '#94a3b8', shadow: '0 2px 8px rgba(15,23,42,0.06)' };

    return (
        <div className="relative">
            {isActive && <div className="pipeline-radar" />}
            <div
                className="px-4 py-3 rounded-xl text-center transition-all duration-300"
                style={{
                    background: colors.bg,
                    border: `2px solid ${colors.border}`,
                    boxShadow: colors.shadow,
                    minWidth: 150,
                }}
            >
                <div className="text-lg mb-0.5">{data.icon}</div>
                <div className="text-xs font-bold" style={{ color: colors.text }}>
                    {data.label}
                </div>
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: '#fff', color: colors.badge, border: `1px solid ${colors.border}33` }}>
                    {isComplete ? 'Done' : isActive ? 'Active' : 'Idle'}
                </div>
            </div>
        </div>
    );
}

const nodeTypes = { pipeline: PipelineNode };

export default function PipelineView() {
    const { pipelineNodes } = useSessionStore();

    const nodeStatuses = useMemo(() => {
        const map: Record<string, string> = {};
        pipelineNodes.forEach((p: any) => { map[p.id] = p.status; });
        return map;
    }, [pipelineNodes]);

    const { nodes, edges } = useMemo(() => {
        const radius = 230;
        const centerX = 320;
        const centerY = 260;
        const angleStep = (2 * Math.PI) / PIPELINE_NODES.length;

        const flowNodes: Node[] = PIPELINE_NODES.map((n, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const status = nodeStatuses[n.id] || 'idle';

            return {
                id: n.id,
                type: 'pipeline',
                position: { x, y },
                data: { ...n, status },
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
            };
        });

        const flowEdges: Edge[] = PIPELINE_NODES.map((n, i) => {
            const next = PIPELINE_NODES[(i + 1) % PIPELINE_NODES.length];
            const status = nodeStatuses[n.id] || 'idle';
            const className = status === 'active'
                ? 'pipeline-edge-active'
                : status === 'complete'
                    ? 'pipeline-edge-complete'
                    : 'pipeline-edge-idle';

            return {
                id: `e-${n.id}-${next.id}`,
                source: n.id,
                target: next.id,
                animated: status === 'active',
                className,
                style: { strokeWidth: 2 },
            };
        });

        return { nodes: flowNodes, edges: flowEdges };
    }, [pipelineNodes]);

    return (
        <div className="tree-container h-full" style={{ minHeight: 320 }}>
            {/* Header */}
            <div className="absolute top-3 left-4 z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #E2E8F0' }}>
                    <span className="text-sm">⚡</span>
                    <span className="text-xs font-bold" style={{ color: '#0F172A' }}>
                        Agent Pipeline
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: '#ECFDF5', color: '#059669' }}>
                        {PIPELINE_NODES.length} agents
                    </span>
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#E2E8F0" gap={24} size={1} />

                {/* Edge gradient definition for active animation */}
                <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                    <defs>
                        <linearGradient id="edgeGradActive" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#5b6ef7" />
                            <stop offset="100%" stopColor="#2fc4ff" />
                        </linearGradient>
                    </defs>
                </svg>
            </ReactFlow>
        </div>
    );
}
