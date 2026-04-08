'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';

/* ─────── Types ─────── */
export interface TreeNode {
    id: string;
    label: string;
    children: TreeNode[];
    status?: 'explored' | 'must-learn' | 'suggested' | 'active';
    relevance?: number;
    depth?: number;
}

interface Props {
    data: TreeNode | null;
    onNodeClick?: (nodeId: string, label: string) => void;
    className?: string;
}

/* ─────── Layout constants ─────── */
const NODE_W = 160;
const NODE_H = 44;
const H_GAP = 40;
const V_GAP = 60;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;

/* ─────── Colour helpers ─────── */
function nodeColors(status?: string, relevance?: number) {
    const mustLearn = status === 'must-learn' || (relevance && relevance >= 0.8);
    if (status === 'active') return {
        bg: '#EEF2FF', border: '#6366F1', text: '#4338CA',
        glow: '0 0 0 4px rgba(99,102,241,0.15), 0 4px 16px rgba(99,102,241,0.2)',
        icon: '⚡', badgeBg: '#6366F1', badgeText: '#fff'
    };
    if (mustLearn) return {
        bg: '#FEF2F2', border: '#EF4444', text: '#991B1B',
        glow: '0 0 0 3px rgba(239,68,68,0.12), 0 4px 12px rgba(239,68,68,0.15)',
        icon: '🔥', badgeBg: '#EF4444', badgeText: '#fff'
    };
    if (status === 'explored') return {
        bg: '#ECFDF5', border: '#10B981', text: '#065F46',
        glow: '0 2px 8px rgba(16,185,129,0.1)',
        icon: '✓', badgeBg: '#10B981', badgeText: '#fff'
    };
    if (status === 'suggested') return {
        bg: '#FFFBEB', border: '#F59E0B', text: '#92400E',
        glow: '0 2px 8px rgba(245,158,11,0.1)',
        icon: '◇', badgeBg: '#F59E0B', badgeText: '#fff'
    };
    return {
        bg: '#F8FAFC', border: '#CBD5E1', text: '#475569',
        glow: '0 1px 4px rgba(0,0,0,0.04)',
        icon: '○', badgeBg: '#94A3B8', badgeText: '#fff'
    };
}

/* ─────── Tree layout (Reingold-Tilford inspired) ─────── */
interface LayoutNode {
    id: string;
    label: string;
    x: number;
    y: number;
    status?: string;
    relevance?: number;
    depth: number;
    children: LayoutNode[];
}

function layoutTree(node: TreeNode, depth = 0): LayoutNode {
    const kids = (node.children || []).map(c => layoutTree(c, depth + 1));
    const ln: LayoutNode = {
        id: node.id, label: node.label, x: 0, y: depth * (NODE_H + V_GAP),
        status: node.status, relevance: node.relevance, depth, children: kids,
    };
    if (kids.length === 0) {
        ln.x = 0;
    } else if (kids.length === 1) {
        ln.x = kids[0].x;
    } else {
        ln.x = (kids[0].x + kids[kids.length - 1].x) / 2;
    }
    return ln;
}

function assignX(node: LayoutNode, nextX: { v: number }): void {
    for (const c of node.children) assignX(c, nextX);
    if (node.children.length === 0) {
        node.x = nextX.v;
        nextX.v += NODE_W + H_GAP;
    } else if (node.children.length === 1) {
        node.x = node.children[0].x;
    } else {
        node.x = (node.children[0].x + node.children[node.children.length - 1].x) / 2;
    }
}

function flattenNodes(node: LayoutNode, arr: LayoutNode[] = []) {
    arr.push(node);
    node.children.forEach(c => flattenNodes(c, arr));
    return arr;
}

interface Edge { from: LayoutNode; to: LayoutNode }
function flattenEdges(node: LayoutNode, arr: Edge[] = []) {
    node.children.forEach(c => { arr.push({ from: node, to: c }); flattenEdges(c, arr); });
    return arr;
}

/* ─────── Component ─────── */
export default function KnowledgeTree({ data, onNodeClick, className }: Props) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [drag, setDrag] = useState<{ sx: number; sy: number; px: number; py: number } | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    /* Build layout */
    const { nodes, edges, bounds } = useMemo(() => {
        if (!data) return { nodes: [] as LayoutNode[], edges: [] as Edge[], bounds: { minX: 0, maxX: 400, minY: 0, maxY: 300 } };
        const root = layoutTree(data);
        assignX(root, { v: 0 });
        const nodes = flattenNodes(root);
        const edges = flattenEdges(root);
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const n of nodes) {
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x + NODE_W);
            minY = Math.min(minY, n.y);
            maxY = Math.max(maxY, n.y + NODE_H);
        }
        return { nodes, edges, bounds: { minX: minX - 40, maxX: maxX + 40, minY: minY - 40, maxY: maxY + 80 } };
    }, [data]);

    /* Auto-fit */
    useEffect(() => {
        if (!data || nodes.length === 0 || !containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        const treeW = bounds.maxX - bounds.minX;
        const treeH = bounds.maxY - bounds.minY;
        if (treeW === 0 || treeH === 0) return;
        const fitZoom = Math.min(width / treeW, height / treeH, 1.2) * 0.85;
        const cx = bounds.minX + treeW / 2;
        const cy = bounds.minY + treeH / 2;
        setZoom(fitZoom);
        setPan({ x: width / 2 - cx * fitZoom, y: height / 2 - cy * fitZoom });
        if (!initialized) setTimeout(() => setInitialized(true), 100);
    }, [data, nodes.length, bounds, initialized]);

    /* Mouse drag */
    const onPointerDown = useCallback((e: React.PointerEvent) => {
        if ((e.target as Element).closest('.tree-node-g')) return;
        setDrag({ sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y });
    }, [pan]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!drag) return;
        setPan({ x: drag.px + (e.clientX - drag.sx), y: drag.py + (e.clientY - drag.sy) });
    }, [drag]);

    const onPointerUp = useCallback(() => setDrag(null), []);

    const onWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const factor = e.deltaY > 0 ? 0.92 : 1.08;
        const newZ = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));
        setPan(p => ({
            x: mx - (mx - p.x) * (newZ / zoom),
            y: my - (my - p.y) * (newZ / zoom),
        }));
        setZoom(newZ);
    }, [zoom]);

    /* Zoom controls */
    const zoomIn = () => {
        setZoom(z => Math.min(MAX_ZOOM, z * 1.2));
    };
    const zoomOut = () => {
        setZoom(z => Math.max(MIN_ZOOM, z / 1.2));
    };
    const resetView = () => {
        if (!containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        const treeW = bounds.maxX - bounds.minX;
        const treeH = bounds.maxY - bounds.minY;
        const fitZoom = Math.min(width / treeW, height / treeH, 1.2) * 0.85;
        const cx = bounds.minX + treeW / 2;
        const cy = bounds.minY + treeH / 2;
        setZoom(fitZoom);
        setPan({ x: width / 2 - cx * fitZoom, y: height / 2 - cy * fitZoom });
    };

    /* ─── Empty state ─── */
    if (!data || nodes.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center h-full gap-5 ${className}`}>
                <div className="relative flex items-center justify-center">
                    <div className="absolute w-[180px] h-[180px] bg-blue-50/50 rounded-full blur-3xl" />
                    <svg width="140" height="140" viewBox="0 0 120 120" fill="none" className="relative z-10 drop-shadow-xl animate-float">
                        <circle cx="60" cy="60" r="50" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="4 6" className="animate-spin-slow" style={{ transformOrigin: 'center' }} />
                        <circle cx="60" cy="35" r="8" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" className="animate-pulse" />
                        <circle cx="38" cy="70" r="6" fill="#F0FDF4" stroke="#10B981" strokeWidth="2" />
                        <circle cx="82" cy="70" r="6" fill="#FEF2F2" stroke="#EF4444" strokeWidth="2" />
                        <line x1="60" y1="43" x2="40" y2="64" stroke="#CBD5E1" strokeWidth="1.5" />
                        <line x1="60" y1="43" x2="80" y2="64" stroke="#CBD5E1" strokeWidth="1.5" />
                        <circle cx="60" cy="90" r="4" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="2" />
                        <line x1="38" y1="76" x2="56" y2="86" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
                    </svg>
                </div>
                <div className="text-center animate-slide-up mt-2">
                    <p className="text-base font-bold text-slate-800">Knowledge Tree</p>
                    <p className="text-sm font-medium mt-1.5 text-slate-400">Ask a question to grow your tree</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`tree-container ${className || ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
            style={{ touchAction: 'none' }}
        >
            {/* Zoom controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                <button onClick={zoomIn}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-105"
                    style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#475569', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    +
                </button>
                <button onClick={zoomOut}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-105"
                    style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#475569', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    −
                </button>
                <button onClick={resetView}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#475569', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    title="Reset view">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" />
                    </svg>
                </button>
            </div>

            {/* Stats badge */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                    style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #E2E8F0', color: '#64748B', backdropFilter: 'blur(8px)' }}>
                    <span style={{ color: '#6366F1' }}>{nodes.length}</span> nodes
                    <span className="mx-1" style={{ color: '#E2E8F0' }}>•</span>
                    <span style={{ color: '#10B981' }}>{nodes.filter(n => n.status === 'explored').length}</span> explored
                </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 right-3 flex items-center gap-3 z-10">
                {[
                    { color: '#6366F1', label: 'Active' },
                    { color: '#10B981', label: 'Explored' },
                    { color: '#EF4444', label: 'Must Learn' },
                    { color: '#F59E0B', label: 'Suggested' },
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-1 text-[10px] font-medium" style={{ color: '#94A3B8' }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        {item.label}
                    </div>
                ))}
            </div>

            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                style={{ overflow: 'visible' }}
            >
                <defs>
                    <filter id="node-shadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.08" />
                    </filter>
                    <filter id="glow-brand">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feFlood floodColor="#6366F1" floodOpacity="0.2" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="glow-danger">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feFlood floodColor="#EF4444" floodOpacity="0.2" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <linearGradient id="edge-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.15" />
                    </linearGradient>
                    <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                        <path d="M 0 0 L 8 3 L 0 6 Z" fill="#CBD5E1" opacity="0.5" />
                    </marker>
                </defs>

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
                    style={{ opacity: initialized ? 1 : 0, transition: 'opacity 0.5s' }}>

                    {/* Edges */}
                    {edges.map((e, i) => {
                        const x1 = e.from.x + NODE_W / 2;
                        const y1 = e.from.y + NODE_H;
                        const x2 = e.to.x + NODE_W / 2;
                        const y2 = e.to.y;
                        const midY = (y1 + y2) / 2;
                        const isHovered = hoveredNode === e.from.id || hoveredNode === e.to.id;
                        return (
                            <path key={`edge-${i}`}
                                d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                                fill="none"
                                stroke={isHovered ? '#6366F1' : 'url(#edge-gradient)'}
                                strokeWidth={isHovered ? 2.5 : 1.8}
                                strokeLinecap="round"
                                markerEnd="url(#arrow)"
                                style={{
                                    transition: 'stroke 0.2s, stroke-width 0.2s',
                                    opacity: isHovered ? 1 : 0.7,
                                }}
                            />
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((n, idx) => {
                        const c = nodeColors(n.status, n.relevance);
                        const isHovering = hoveredNode === n.id;
                        const isActive = n.status === 'active';
                        const isMustLearn = n.status === 'must-learn' || (n.relevance && n.relevance >= 0.8);
                        const filterAttr = isActive ? 'url(#glow-brand)' : isMustLearn ? 'url(#glow-danger)' : 'url(#node-shadow)';

                        return (
                            <g key={n.id}
                                className="tree-node-g"
                                style={{
                                    cursor: 'pointer',
                                    animationDelay: `${idx * 50}ms`,
                                }}
                                onClick={() => onNodeClick?.(n.id, n.label)}
                                onMouseEnter={() => setHoveredNode(n.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                            >
                                <rect
                                    x={n.x}
                                    y={n.y}
                                    width={NODE_W}
                                    height={NODE_H}
                                    rx={12}
                                    ry={12}
                                    fill={c.bg}
                                    stroke={c.border}
                                    strokeWidth={isHovering || isActive ? 2 : 1.5}
                                    filter={filterAttr}
                                    style={{
                                        transition: 'stroke-width 0.2s, transform 0.2s',
                                        transformOrigin: `${n.x + NODE_W / 2}px ${n.y + NODE_H / 2}px`,
                                        transform: isHovering ? 'scale(1.04)' : 'scale(1)',
                                    }}
                                />

                                {/* Status badge */}
                                <circle
                                    cx={n.x + 16}
                                    cy={n.y + NODE_H / 2}
                                    r={8}
                                    fill={c.badgeBg}
                                    opacity={0.15}
                                />
                                <text
                                    x={n.x + 16}
                                    y={n.y + NODE_H / 2}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize="9"
                                    fill={c.badgeBg}
                                    fontWeight="700"
                                >
                                    {c.icon}
                                </text>

                                {/* Label */}
                                <text
                                    x={n.x + 30}
                                    y={n.y + NODE_H / 2}
                                    dominantBaseline="central"
                                    fill={c.text}
                                    fontSize="11"
                                    fontWeight="600"
                                    fontFamily="Inter, sans-serif"
                                    style={{
                                        pointerEvents: 'none',
                                    }}
                                >
                                    {n.label.length > 14 ? n.label.slice(0, 14) + '…' : n.label}
                                </text>

                                {/* Depth badge */}
                                {n.depth > 0 && (
                                    <>
                                        <rect
                                            x={n.x + NODE_W - 26}
                                            y={n.y + NODE_H / 2 - 8}
                                            width={18}
                                            height={16}
                                            rx={4}
                                            fill={c.badgeBg}
                                            opacity={0.12}
                                        />
                                        <text
                                            x={n.x + NODE_W - 17}
                                            y={n.y + NODE_H / 2}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fontSize="8"
                                            fill={c.badgeBg}
                                            fontWeight="700"
                                            fontFamily="JetBrains Mono, monospace"
                                        >
                                            D{n.depth}
                                        </text>
                                    </>
                                )}

                                {/* Active pulse ring */}
                                {isActive && (
                                    <rect
                                        x={n.x - 3}
                                        y={n.y - 3}
                                        width={NODE_W + 6}
                                        height={NODE_H + 6}
                                        rx={14}
                                        ry={14}
                                        fill="none"
                                        stroke="#6366F1"
                                        strokeWidth="1.5"
                                        opacity="0.4"
                                        style={{ animation: 'node-glow 1.5s ease-in-out infinite' }}
                                    />
                                )}

                                {/* Must-learn fire indicator */}
                                {isMustLearn && (
                                    <text
                                        x={n.x + NODE_W - 4}
                                        y={n.y - 2}
                                        fontSize="14"
                                        textAnchor="middle"
                                        style={{ animation: 'float 2s ease-in-out infinite' }}
                                    >
                                        🔥
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
}
