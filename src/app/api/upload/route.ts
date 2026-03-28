import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const resp = await fetch(`${BACKEND_URL}/session/upload`, {
            method: 'POST',
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
