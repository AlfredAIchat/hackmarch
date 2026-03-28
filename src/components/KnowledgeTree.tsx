'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Tree from 'react-d3-tree';
import { useSessionStore } from '@/store/sessionStore';

function useCenteredTree(containerRef: React.RefObject<HTMLDivElement | null>) {
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            setTranslate({ x: width / 2, y: 50 });
            setDimensions({ width, height });
        }
    }, [containerRef]);

    return { translate, dimensions };
}

const DEPTH_COLORS = [
    '#06b6d4', // cyan
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f97316', // orange
    '#22c55e', // green
    '#eab308', // yellow
    '#ef4444', // red
    '#14b8a6', // teal
];

const renderCustomNode = ({ nodeDatum }: { nodeDatum: any }) => {
    const depth = parseInt(nodeDatum.attributes?.depth || '0', 10);
    const color = DEPTH_COLORS[depth % DEPTH_COLORS.length];
    const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;
    const nodeRadius = hasChildren ? 22 : 16;

    return (
        <g>
            {/* Outer glow ring for nodes with children */}
            {hasChildren && (
                <circle
                    r={nodeRadius + 6}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    opacity={0.2}
                    className="animate-pulse"
                />
            )}

            {/* Main node circle */}
            <circle
                r={nodeRadius}
                fill="#0d0d1a"
                stroke={color}
                strokeWidth={hasChildren ? 2.5 : 2}
                style={{
                    filter: `drop-shadow(0 0 8px ${color}60)`,
                    transition: 'all 0.3s ease',
                }}
            />

            {/* Inner dot */}
            <circle r={4} fill={color} opacity={0.6} />

            {/* Label */}
            <text
                fill="#e2e8f0"
                strokeWidth={0}
                x={nodeRadius + 10}
                dy=".33em"
                fontSize={11}
                fontFamily="'Inter', sans-serif"
                fontWeight={600}
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
            >
                {nodeDatum.name}
            </text>

            {/* Depth badge */}
            <text
                fill={color}
                strokeWidth={0}
                x={nodeRadius + 10}
                dy="1.8em"
                fontSize={9}
                fontFamily="monospace"
                opacity={0.5}
            >
                depth {depth}
            </text>
        </g>
    );
};

// Custom path function for curved, organic-looking links
const customPathFunc = (linkData: any) => {
    const { source, target } = linkData;
    const midY = (source.y + target.y) / 2;
    return `M${source.x},${source.y} C${source.x},${midY} ${target.x},${midY} ${target.x},${target.y}`;
};

export default function KnowledgeTree() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { translate } = useCenteredTree(containerRef);
    const treeData = useSessionStore((s) => s.treeData);
    const rawTree = useSessionStore((s) => s.rawTree);

    const nodeCount = Object.keys(rawTree).length;

    const defaultTree = {
        name: 'Ask a question',
        attributes: { depth: '0' },
        children: [],
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Knowledge Tree
                </h2>
                <div className="flex items-center gap-2">
                    {nodeCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono
              bg-purple-500/20 border border-purple-500/30 text-purple-400">
                            {nodeCount} nodes
                        </span>
                    )}
                </div>
            </div>
            <div ref={containerRef} className="flex-1 relative">
                {containerRef.current && (
                    <Tree
                        data={treeData || defaultTree}
                        translate={translate}
                        orientation="vertical"
                        pathFunc={customPathFunc}
                        separation={{ siblings: 2, nonSiblings: 2.5 }}
                        renderCustomNodeElement={renderCustomNode}
                        collapsible={false}
                        pathClassFunc={() => 'tree-link-dynamic'}
                        zoom={0.75}
                        nodeSize={{ x: 180, y: 100 }}
                        depthFactor={100}
                    />
                )}
            </div>
        </div>
    );
}
