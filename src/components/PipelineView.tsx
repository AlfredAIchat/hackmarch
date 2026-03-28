'use client';

import React, { useMemo } from 'react';
import {
    ReactFlow,
    Background,
    type Node,
    type Edge,
    Handle,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSessionStore, PipelineNode } from '@/store/sessionStore';

// ── Status styles ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, React.CSSProperties> = {
    idle: {
        background: 'rgba(15,15,30,0.9)',
        border: '1.5px solid #2a2a3e',
        color: '#6b7280',
        boxShadow: 'none',
    },
    active: {
        background: 'rgba(6,182,212,0.08)',
        border: '2px solid #06b6d4',
        color: '#22d3ee',
        boxShadow: '0 0 24px rgba(6,182,212,0.5), 0 0 48px rgba(6,182,212,0.2)',
    },
    complete: {
        background: 'rgba(34,197,94,0.08)',
        border: '2px solid #22c55e',
        color: '#4ade80',
        boxShadow: '0 0 16px rgba(34,197,94,0.35)',
    },
    error: {
        background: 'rgba(239,68,68,0.08)',
        border: '2px solid #ef4444',
        color: '#f87171',
        boxShadow: '0 0 16px rgba(239,68,68,0.35)',
    },
};

function CustomNode({ data }: { data: { label: string; status: string } }) {
    const style = STATUS_STYLES[data.status] || STATUS_STYLES.idle;
    const isActive = data.status === 'active';

    return (
        <div
            style={{
                ...style,
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono, monospace)',
                textAlign: 'center',
                minWidth: '140px',
                position: 'relative',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className={isActive ? 'animate-pulse' : ''}
        >
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <div className="flex items-center justify-center gap-2">
                {data.status === 'active' && (
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                    </span>
                )}
                {data.status === 'complete' && (
                    <span className="text-green-400 text-xs">✓</span>
                )}
                {data.status === 'error' && (
                    <span className="text-red-400 text-xs">✗</span>
                )}
                <span>{data.label}</span>
            </div>
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
        </div>
    );
}

const nodeTypes = { custom: CustomNode };

// ── Two-column layout with clear flow ──────────────────────────────────────
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
    intent_guard: { x: 50, y: 20 },
    answer_agent: { x: 50, y: 110 },
    hallucination_checker: { x: 50, y: 200 },
    concept_extractor: { x: 50, y: 290 },
    concept_validator: { x: 50, y: 380 },
    user_gate: { x: 50, y: 470 },
    depth_guard: { x: 300, y: 200 },
    context_builder: { x: 300, y: 110 },
    quiz_agent: { x: 300, y: 340 },
    answer_evaluator: { x: 300, y: 430 },
    report_agent: { x: 175, y: 560 },
};

const EDGE_DEFS: [string, string][] = [
    ['intent_guard', 'answer_agent'],
    ['answer_agent', 'hallucination_checker'],
    ['hallucination_checker', 'concept_extractor'],
    ['concept_extractor', 'concept_validator'],
    ['concept_validator', 'user_gate'],
    ['user_gate', 'depth_guard'],
    ['depth_guard', 'context_builder'],
    ['context_builder', 'answer_agent'],
    ['depth_guard', 'report_agent'],
    ['user_gate', 'quiz_agent'],
    ['quiz_agent', 'answer_evaluator'],
];

// ── Edge color based on source/target node status ──────────────────────────
function getEdgeStyle(
    sourceStatus: string,
    targetStatus: string
): { stroke: string; strokeWidth: number } {
    if (targetStatus === 'active' || sourceStatus === 'active') {
        return { stroke: '#06b6d4', strokeWidth: 2.5 };
    }
    if (sourceStatus === 'complete' && targetStatus === 'complete') {
        return { stroke: '#22c55e', strokeWidth: 2 };
    }
    if (sourceStatus === 'complete') {
        return { stroke: '#4ade80', strokeWidth: 1.8 };
    }
    return { stroke: '#1e1e2e', strokeWidth: 1.5 };
}

export default function PipelineView() {
    const pipelineNodes = useSessionStore((s) => s.pipelineNodes);

    // Build a status lookup map
    const statusMap = useMemo(() => {
        const m: Record<string, string> = {};
        pipelineNodes.forEach((n) => { m[n.id] = n.status; });
        return m;
    }, [pipelineNodes]);

    const nodes: Node[] = useMemo(
        () =>
            pipelineNodes.map((pn) => ({
                id: pn.id,
                type: 'custom',
                position: NODE_POSITIONS[pn.id] || { x: 0, y: 0 },
                data: { label: pn.label, status: pn.status },
                draggable: false,
            })),
        [pipelineNodes]
    );

    const edges: Edge[] = useMemo(
        () =>
            EDGE_DEFS.map(([source, target], i) => {
                const srcStatus = statusMap[source] || 'idle';
                const tgtStatus = statusMap[target] || 'idle';
                const edgeStyle = getEdgeStyle(srcStatus, tgtStatus);
                const isActive = tgtStatus === 'active' || srcStatus === 'active';

                return {
                    id: `e-${i}`,
                    source,
                    target,
                    animated: isActive,
                    style: edgeStyle,
                };
            }),
        [statusMap]
    );

    return (
        <div className="h-full w-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Live Pipeline
                </h2>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-500">Real-time</span>
                </div>
            </div>
            <div style={{ height: 'calc(100% - 48px)' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.3 }}
                    proOptions={{ hideAttribution: true }}
                    panOnDrag={false}
                    zoomOnScroll={false}
                    preventScrolling={false}
                >
                    <Background color="#0a0a1e" gap={20} />
                </ReactFlow>
            </div>
        </div>
    );
}
