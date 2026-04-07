import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // For Vercel deployment, use relative path; for dev use full URL
        const backendEndpoint = BACKEND_URL.startsWith('http') 
            ? `${BACKEND_URL}/session/start`
            : `${req.nextUrl.origin}${BACKEND_URL}/session/start`;
        
        const resp = await fetch(backendEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!resp.ok) {
            return NextResponse.json(
                { error: 'Backend error' },
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
            { error: error.message || 'Session failed' },
            { status: 500 }
        );
    }
}
                Connection: 'keep-alive',
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Server error' },
            { status: 500 }
        );
    }
}
