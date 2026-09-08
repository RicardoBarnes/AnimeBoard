import Link from 'next/link';
import { Landmark } from 'lucide-react';

export interface LegalSection {
    title: string;
    body: string;
}

export interface LegalCrossLink {
    href: string;
    label: string;
}

interface LegalPageProps {
    eyebrow?: string;
    title: string;
    lastUpdated: string;
    intro?: string;
    sections: LegalSection[];
    crossLinks: LegalCrossLink[];
}

export default function LegalPage({
    eyebrow = 'Council Charter',
    title,
    lastUpdated,
    intro,
    sections,
    crossLinks,
}: LegalPageProps) {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark py-12">
            <div className="max-w-2xl mx-auto px-4">
                <Link href="/" className="inline-flex items-center gap-2 text-gold mb-8">
                    <Landmark className="w-5 h-5" strokeWidth={1.75} />
                    <span className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                        AnimeBoard
                    </span>
                </Link>

                <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-2">{eyebrow}</p>
                <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white mb-2">{title}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">Last updated: {lastUpdated}</p>

                {intro && (
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-10">{intro}</p>
                )}

                <div className="space-y-8">
                    {sections.map((section, idx) => (
                        <div key={section.title}>
                            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                <span className="font-mono text-gold mr-2">{String(idx + 1).padStart(2, '0')}</span>
                                {section.title}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                                {section.body}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-sm flex flex-wrap gap-x-3 gap-y-2">
                    {crossLinks.map((link, idx) => (
                        <span key={link.href} className="flex items-center gap-3">
                            {idx > 0 && <span className="text-slate-400">·</span>}
                            <Link href={link.href} className="text-gold hover:underline">
                                {link.label}
                            </Link>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
