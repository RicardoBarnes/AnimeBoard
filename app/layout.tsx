import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
    title: 'AnimeBoard - The Ultimate Debate',
    description: 'A platform for anime fans to share, debate, and discover favorite characters and moments',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`dark ${spaceGrotesk.variable}`}>
            <body>{children}</body>
        </html>
    );
}
