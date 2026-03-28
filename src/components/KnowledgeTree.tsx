'use client';

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import Tree from 'react-d3-tree';
import { useSessionStore } from '@/store/sessionStore';

/* ─────── Custom Node ─────── */
function renderCustomNode({ nodeDatum, toggleNode }: any) {
    const isRoot = !nodeDatum.parent;
    const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;
    const depth = nodeDatum.__rd3t?.depth ?? 0;

    // Color based on depth
    const depthColors = [
        { fill: '#6366F1', stroke: '#4F46E5', text: '#fff' },   // Indigo — root
        { fill: '#8B5CF6', stroke: '#7C3AED', text: '#fff' },   // Violet — L1
        { fill: '#0EA5E9', stroke: '#0284C7', text: '#fff' },   // Sky — L2
        { fill: '#10B981', stroke: '#059669', text: '#fff' },    // Emerald — L3
        { fill: '#F59E0B', stroke: '#D97706', text: '#fff' },    // Amber — L4+
    ];
    const colors = depthColors[Math.min(depth, depthColors.length - 1)];

    const nodeRadius = isRoot ? 28 : 20;
    const fontSize = isRoot ? 11 : 10;

    // Truncate long names
    const name = String(nodeDatum.name || '');
    const displayName = name.length > 22 ? name.slice(0, 20) + '…' : name;

    return (
        <g onClick={toggleNode} style={{ cursor: hasChildren ? 'pointer' : 'default' }}>
            {/* Glow effect for root */}
            {isRoot && (
                <circle
                    r={nodeRadius + 8}
                    fill="none"
                    stroke={colors.fill}
                    strokeWidth={2}
                    strokeOpacity={0.2}
                    className="tree-node-circle"
                />
            )}

            {/* Main circle */}
            <circle
                r={nodeRadius}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={2.5}
                className="tree-node-circle"
                style={{
                    filter: isRoot
                        ? `drop-shadow(0 4px 12px ${colors.fill}40)`
                        : `drop-shadow(0 2px 6px ${colors.fill}30)`,
                }}
            />

            {/* Icon inside circle */}
            <text
                textAnchor="middle"
                dy={5}
                fill={colors.text}
                fontSize={isRoot ? 16 : 13}
                fontWeight={800}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
                {isRoot ? '🧠' : depth === 1 ? '📖' : depth === 2 ? '🔬' : '💡'}
            </text>

            {/* Label below */}
            <foreignObject
                x={-80}
                y={nodeRadius + 8}
                width={160}
                height={50}
            >
                <div
                    style={{
                        textAlign: 'center',
                        fontSize: `${fontSize}px`,
                        fontWeight: isRoot ? 700 : 600,
                        color: '#0F172A',
                        lineHeight: 1.3,
                        wordBreak: 'break-word',
                        fontFamily: 'Inter, sans-serif',
                    }}
                >
                    {displayName}
                </div>
            </foreignObject>

            {/* Child count badge */}
            {hasChildren && (
                <g>
                    <circle
                        cx={nodeRadius * 0.7}
                        cy={-nodeRadius * 0.7}
                        r={9}
                        fill="#6366F1"
                        stroke="#fff"
                        strokeWidth={2}
                    />
                    <text
                        x={nodeRadius * 0.7}
                        y={-nodeRadius * 0.7}
                        textAnchor="middle"
                        dy={4}
                        fill="#fff"
                        fontSize={9}
                        fontWeight={800}
                    >
                        {nodeDatum.children.length}
                    </text>
                </g>
            )}
        </g>
    );
}

/* ─────── Main Component ─────── */
export default function KnowledgeTree() {
    const { treeData } = useSessionStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
    const [translate, setTranslate] = useState({ x: 400, y: 60 });

    // Measure container
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
                setTranslate({ x: width / 2, y: 60 });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const nodeCount = useMemo(() => {
        if (!treeData) return 0;
        let count = 0;
        const traverse = (node: any) => {
            count++;
            if (node.children) node.children.forEach(traverse);
        };
        traverse(treeData);
        return count;
    }, [treeData]);

    if (!treeData) {
        return (
            <div className="tree-container h-full flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="text-4xl mb-3">🌱</div>
                    <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                        Knowledge Tree
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
                        Ask a question to start growing your tree
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="tree-container h-full relative" style={{ minHeight: '400px' }}>
            {/* Header overlay */}
            <div className="absolute top-3 left-4 z-10 flex items-center gap-2.5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #E2E8F0' }}>
                    <span className="text-sm">🧠</span>
                    <span className="text-xs font-bold" style={{ color: '#0F172A' }}>
                        Knowledge Tree
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: '#EEF2FF', color: '#6366F1' }}>
                        {nodeCount} nodes
                    </span>
                </div>
            </div>

            {/* Zoom hint */}
            <div className="absolute bottom-3 right-4 z-10">
                <div className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium"
                    style={{ background: 'rgba(255,255,255,0.85)', color: '#94A3B8', border: '1px solid #E2E8F0' }}>
                    Scroll to zoom • Drag to pan
                </div>
            </div>

            <Tree
                data={treeData}
                translate={translate}
                orientation="vertical"
                pathFunc="step"
                zoom={0.9}
                scaleExtent={{ min: 0.3, max: 2 }}
                nodeSize={{ x: 200, y: 140 }}
                separation={{ siblings: 1.3, nonSiblings: 1.6 }}
                renderCustomNodeElement={(rd3tProps) => renderCustomNode(rd3tProps)}
                pathClassFunc={() => 'tree-path'}
                enableLegacyTransitions
                transitionDuration={400}
                rootNodeClassName="node-root"
                branchNodeClassName="node-branch"
                leafNodeClassName="node-leaf"
            />

            {/* Custom path styling */}
            <style>{`
                .tree-path {
                    stroke: #CBD5E1 !important;
                    stroke-width: 2.5px !important;
                    stroke-linecap: round;
                    fill: none !important;
                }
                .rd3t-link {
                    stroke: #CBD5E1 !important;
                    stroke-width: 2.5px !important;
                    fill: none !important;
                }
            `}</style>
        </div>
    );
}
