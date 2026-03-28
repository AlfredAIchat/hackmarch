'use client';

import React, { useRef, useState, useEffect } from 'react';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    disabled?: boolean;
}

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [useWebSpeech, setUseWebSpeech] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const recognitionRef = useRef<any>(null);

    // Check if Web Speech API is available
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setUseWebSpeech(true);
        }
    }, []);

    // ── Web Speech API approach (works in Chrome/Edge/Safari) ──
    const startWebSpeech = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                onTranscript(transcript);
            }
            setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            // If Web Speech fails, try Sarvam API fallback
            if (event.error !== 'no-speech') {
                startMediaRecording();
            }
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
    };

    const stopWebSpeech = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    // ── MediaRecorder + Sarvam API approach (fallback) ──
    const startMediaRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : 'audio/webm',
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
                    } else if (data.error) {
                        console.error('Voice API error:', data.error);
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

    const stopMediaRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // ── Unified toggle handler ──
    const toggleRecording = () => {
        if (isRecording) {
            if (useWebSpeech) {
                stopWebSpeech();
            } else {
                stopMediaRecording();
            }
        } else {
            if (useWebSpeech) {
                startWebSpeech();
            } else {
                startMediaRecording();
            }
        }
    };

    return (
        <button
            onClick={toggleRecording}
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
            ) : isRecording ? (
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
