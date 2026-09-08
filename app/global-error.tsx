'use client';

import { useEffect } from 'react';
import { logClientError } from '@/app/actions/errors';

// Catches crashes in the root layout itself (fonts, providers, etc.) that
// app/error.tsx can't see. Must render its own <html>/<body> since it
// replaces the root layout when triggered.
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logClientError(error.message || 'Unknown root-layout error', error.digest, 'root-layout');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error]);

    return (
        <html lang="en">
            <body style={{ background: '#12141C', color: '#F2ECDD', fontFamily: 'sans-serif' }}>
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ maxWidth: 420, textAlign: 'center' }}>
                        <p style={{ color: '#A63A34', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.15em', marginBottom: 12 }}>
                            Mistrial
                        </p>
                        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>The court could not convene</h1>
                        <p style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 24 }}>
                            {error.message || 'An unexpected error occurred.'}
                        </p>
                        <button
                            onClick={reset}
                            style={{ background: '#C6A15B', color: '#12141C', padding: '12px 24px', borderRadius: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
