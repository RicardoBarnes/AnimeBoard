import type { Metadata } from 'next';
import { Space_Grotesk, Fraunces, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' });
const fraunces = Fraunces({
    subsets: ['latin'],
    variable: '--font-display',
    axes: ['opsz', 'SOFT', 'WONK'],
    style: ['normal', 'italic'],
});
const plexMono = IBM_Plex_Mono({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    variable: '--font-mono',
});

export const metadata: Metadata = {
    title: 'AnimeBoard — The Court Is In Session',
    description: 'File your take on anime’s biggest moments. The council votes. The internet decides.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`dark ${spaceGrotesk.variable} ${fraunces.variable} ${plexMono.variable}`}>
            <body>{children}</body>
        </html>
    );
}
