'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    disabled?: boolean;
}

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const recognitionRef = useRef<any>(null);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { }
            recognitionRef.current = null;
        }
        setIsRecording(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => { stopRecording(); };
    }, [stopRecording]);

    const startRecording = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onresult = (event: any) => {
            const transcript = event.results[0]?.[0]?.transcript;
            if (transcript) {
                onTranscript(transcript);
            }
        };

        recognition.onerror = (event: any) => {
            // 'no-speech' is normal — user just didn't speak. Silently handle it.
            if (event.error === 'no-speech' || event.error === 'aborted') {
                // Not a real error — just no speech detected
                setIsRecording(false);
                return;
            }
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recognition:', err);
            setIsRecording(false);
        }
    }, [onTranscript]);

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <button
            onClick={toggleRecording}
            disabled={disabled || isProcessing}
            type="button"
            className={`
        flex items-center justify-center w-10 h-10 rounded-full
        transition-all duration-200
        ${isRecording
                    ? 'bg-red-500/20 border-2 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-cyan-500 hover:text-cyan-400 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                }
      `}
            title={isRecording ? 'Stop recording (click or just speak)' : 'Voice input (click and speak)'}
        >
            {isRecording ? (
                <div className="relative">
                    <div className="w-4 h-4 bg-red-500 rounded-sm animate-pulse" />
                    <div className="absolute -inset-1 bg-red-500/20 rounded-full animate-ping" />
                </div>
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
