'use client';

import React, { useRef, useState } from 'react';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    disabled?: boolean;
}

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
            });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop());
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

                if (blob.size === 0) return;

                setIsProcessing(true);
                try {
                    const formData = new FormData();
                    formData.append('audio', blob, 'recording.webm');

                    const resp = await fetch('/api/voice', {
                        method: 'POST',
                        body: formData,
                    });

                    const data = await resp.json();
                    if (data.transcript) {
                        onTranscript(data.transcript);
                    }
                } catch (err) {
                    console.error('Voice processing error:', err);
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Microphone access error:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isProcessing}
            className={`
        flex items-center justify-center w-10 h-10 rounded-full
        transition-all duration-200
        ${isRecording
                    ? 'bg-red-500/20 border-2 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : isProcessing
                        ? 'bg-gray-800 border border-gray-700 text-gray-500 cursor-wait'
                        : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-cyan-500 hover:text-cyan-400 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                }
      `}
            title={
                isRecording ? 'Stop recording' : isProcessing ? 'Processing…' : 'Voice input'
            }
        >
            {isProcessing ? (
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            ) : (
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
            )}
        </button>
    );
}
