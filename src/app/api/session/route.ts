import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

function forwardAuthHeaders(req: NextRequest): HeadersInit {
    const headers: Record<string, string> = {};
    const cookie = req.headers.get('cookie');
    const authorization = req.headers.get('authorization');
    const bypass = req.headers.get('x-vercel-protection-bypass');

    if (cookie) headers.cookie = cookie;
    if (authorization) headers.authorization = authorization;
    if (bypass) headers['x-vercel-protection-bypass'] = bypass;

    return headers;
}

function resolveBackendBase(req: NextRequest): string {
    if (BACKEND_URL.startsWith('http://') || BACKEND_URL.startsWith('https://')) {
        return BACKEND_URL;
    }

    const prefix = BACKEND_URL.startsWith('/') ? BACKEND_URL : `/${BACKEND_URL}`;
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '');

    if (!host) {
        return `${req.nextUrl.origin}${prefix}`;
    }

    return `${proto}://${host}${prefix}`;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const backendBase = resolveBackendBase(req);
        const resp = await fetch(`${backendBase}/session/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...forwardAuthHeaders(req),
            },
            body: JSON.stringify(body),
        });

        if (!resp.ok) {
            const errText = await resp.text().catch(() => 'Backend error');
            return NextResponse.json(
                { error: errText || 'Backend error' },
                { status: resp.status }
            );
        }

        // Stream the SSE response through to the client
        const stream = resp.body;
        if (!stream) {
            return NextResponse.json({ error: 'No stream' }, { status: 500 });
        }

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
