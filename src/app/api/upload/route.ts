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
        const formData = await req.formData();
        const backendBase = resolveBackendBase(req);

        const resp = await fetch(`${backendBase}/session/upload`, {
            method: 'POST',
            headers: {
                ...forwardAuthHeaders(req),
            },
            body: formData,
        });

        const data = await resp.json();
        return NextResponse.json(data, { status: resp.status });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}
