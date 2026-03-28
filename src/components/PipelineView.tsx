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
    { id: 'intent', label: 'Intent Guard', icon: '🛡️', desc: 'Validates query' },
    { id: 'context', label: 'Context Builder', icon: '🧩', desc: 'Builds context chain' },
    { id: 'answer', label: 'Answer Agent', icon: '🤖', desc: 'Generates response' },
    { id: 'hallucination', label: 'Hallucination Check', icon: '🔍', desc: 'Fact verification' },
    { id: 'extractor', label: 'Concept Extractor', icon: '💎', desc: 'Extracts key terms' },
    { id: 'validator', label: 'Concept Validator', icon: '✅', desc: 'Scores & filters' },
    { id: 'user_gate', label: 'User Gate', icon: '🌳', desc: 'Updates tree' },
    { id: 'depth', label: 'Depth Guard', icon: '📏', desc: 'Tracks depth' },
];

/* ─────── Custom Node Component ─────── */
function PipelineNode({ data }: { data: any }) {
    const isActive = data.isActive;
    const isComplete = data.isComplete;

    const bgColor = isActive
        ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
        : isComplete
            ? 'linear-gradient(135deg, #10B981, #059669)'
            : '#FFFFFF';
    const textColor = isActive || isComplete ? '#FFFFFF' : '#0F172A';
    const borderColor = isActive ? '#6366F1' : isComplete ? '#10B981' : '#E2E8F0';

    return (
        <div
            className={`px-4 py-3 rounded-xl text-center transition-all duration-300 ${isActive ? 'node-glow' : ''}`}
            style={{
                background: bgColor,
                border: `2px solid ${borderColor}`,
                boxShadow: isActive
                    ? '0 0 20px rgba(99, 102, 241, 0.3)'
                    : isComplete
                        ? '0 0 12px rgba(16, 185, 129, 0.2)'
                        : '0 2px 8px rgba(0, 0, 0, 0.04)',
                minWidth: 150,
            }}
        >
            <div className="text-lg mb-0.5">{data.icon}</div>
            <div className="text-xs font-bold" style={{ color: textColor }}>
                {data.label}
            </div>
            <div className="text-[9px] mt-0.5 font-medium" style={{ color: isActive || isComplete ? '#ffffffaa' : '#94A3B8' }}>
                {data.desc}
            </div>
        </div>
    );
}

const nodeTypes = { pipeline: PipelineNode };

export default function PipelineView() {
    const { pipelineNodes } = useSessionStore();

    const { nodes, edges } = useMemo(() => {
        const cols = 4;
        const xGap = 200;
        const yGap = 120;
        const startX = 40;
        const startY = 30;

        const flowNodes: Node[] = PIPELINE_NODES.map((n, i) => {
            const pNode = pipelineNodes.find(
                (p: any) => p.id === n.id || p.label?.toLowerCase().includes(n.id)
            );
            return {
                id: n.id,
                type: 'pipeline',
                position: {
                    x: startX + (i % cols) * xGap,
                    y: startY + Math.floor(i / cols) * yGap,
                },
                data: {
                    ...n,
                    isActive: pNode?.status === 'active',
                    isComplete: pNode?.status === 'complete',
                },
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
            };
        });

        const flowEdges: Edge[] = PIPELINE_NODES.slice(0, -1).map((n, i) => ({
            id: `e-${n.id}-${PIPELINE_NODES[i + 1].id}`,
            source: n.id,
            target: PIPELINE_NODES[i + 1].id,
            animated: true,
            style: { stroke: '#CBD5E1', strokeWidth: 2 },
        }));

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
            </ReactFlow>
        </div>
    );
}
