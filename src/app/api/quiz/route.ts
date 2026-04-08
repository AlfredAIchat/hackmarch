import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

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
        const url = body.answers
            ? `${backendBase}/session/submit-quiz`
            : `${backendBase}/session/quiz`;

        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await resp.json();
        return NextResponse.json(data, { status: resp.status });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
