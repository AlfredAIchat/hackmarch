'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy pipeline page — pipeline visualization is now integrated
 * as a tab in the main page. Redirect to home.
 */
export default function PipelinePage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/');
    }, [router]);
    return null;
}
