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
    const isExplored = nodeDatum.attributes?.explored !== 'false';
    const isVirtual = nodeDatum.attributes?.virtual === 'true';
    const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;
    const nodeRadius = hasChildren ? 22 : 16;

    // Virtual root gets special color
    const color = isVirtual
        ? '#06b6d4'
        : isExplored
            ? DEPTH_COLORS[depth % DEPTH_COLORS.length]
            : '#6b7280'; // gray for unexplored

    return (
        <g>
            {/* Outer glow ring for nodes with children */}
            {hasChildren && isExplored && (
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
                fill={isExplored ? "#0d0d1a" : "transparent"}
                stroke={color}
                strokeWidth={hasChildren ? 2.5 : 2}
                strokeDasharray={isExplored ? "0" : "4,4"}
                style={{
                    filter: isExplored ? `drop-shadow(0 0 8px ${color}60)` : 'none',
                    transition: 'all 0.3s ease',
                }}
            />

            {/* Inner dot */}
            {isExplored && <circle r={4} fill={color} opacity={0.6} />}

            {/* Label */}
            <text
                fill={isExplored ? "#e2e8f0" : "#9ca3af"}
                strokeWidth={0}
                x={nodeRadius + 10}
                dy=".33em"
                fontSize={11}
                fontFamily="'Inter', sans-serif"
                fontWeight={isExplored ? 600 : 400}
                style={{ textShadow: isExplored ? '0 1px 3px rgba(0,0,0,0.8)' : 'none' }}
            >
                {nodeDatum.name}
            </text>

            {/* Depth badge or unexplored indicator */}
            {isExplored ? (
                <text
                    fill={color}
                    strokeWidth={0}
                    x={nodeRadius + 10}
                    dy="1.8em"
                    fontSize={9}
                    fontFamily="monospace"
                    opacity={0.5}
                >
                    {isVirtual ? 'root' : `depth ${depth}`}
                </text>
            ) : (
                <text
                    fill="#9ca3af"
                    strokeWidth={0}
                    x={nodeRadius + 10}
                    dy="1.8em"
                    fontSize={9}
                    fontFamily="'Inter', sans-serif"
                    opacity={0.6}
                    fontStyle="italic"
                >
                    click to explore
                </text>
            )}
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
                <div className="flex items-center gap-3">
                    {/* Legend */}
                    <div className="flex items-center gap-3 text-[10px]">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 border border-cyan-400"></div>
                            <span className="text-gray-500">Explored</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full border border-gray-500 border-dashed"></div>
                            <span className="text-gray-500">Unexplored</span>
                        </div>
                    </div>
                    {nodeCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono
              bg-purple-500/20 border border-purple-500/30 text-purple-400">
                            {nodeCount} nodes
                        </span>
                    )}
                </div>
            </div>
            <div ref={containerRef} className="flex-1 relative">
                {nodeCount === 0 ? (
                    <div className="h-full flex items-center justify-center text-center px-4">
                        <div>
                            <div className="text-4xl mb-2">🌳</div>
                            <p className="text-gray-500 text-sm">No questions asked yet</p>
                            <p className="text-gray-600 text-xs mt-1">Your knowledge tree will grow as you explore</p>
                        </div>
                    </div>
                ) : containerRef.current ? (
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
                ) : null}
            </div>
        </div>
    );
}
