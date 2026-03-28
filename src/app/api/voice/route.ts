import { NextRequest, NextResponse } from 'next/server';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioBlob = formData.get('audio');
        if (!audioBlob) {
            return NextResponse.json({ error: 'No audio file' }, { status: 400 });
        }

        const sarvamForm = new FormData();
        sarvamForm.append('file', audioBlob);
        sarvamForm.append('model', 'saarika:v2');
        sarvamForm.append('language_code', 'en-IN');

        const resp = await fetch('https://api.sarvam.ai/speech-to-text', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${SARVAM_API_KEY}`,
            },
            body: sarvamForm,
        });

        if (!resp.ok) {
            const err = await resp.text();
            return NextResponse.json(
                { error: `Sarvam API error: ${err}` },
                { status: resp.status }
            );
        }

        const data = await resp.json();
        return NextResponse.json({ transcript: data.transcript || '' });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Voice processing error' },
            { status: 500 }
        );
    }
}
