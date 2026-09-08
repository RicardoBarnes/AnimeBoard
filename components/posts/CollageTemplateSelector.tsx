'use client';

import { X } from 'lucide-react';

type TemplateType = '2-grid' | '3-grid' | '2x2' | 'vertical-stack';

interface TemplateConfig {
    type: TemplateType;
    label: string;
    imageCount: number;
    description: string;
}

const templates: TemplateConfig[] = [
    { type: '2-grid', label: '2-Grid', imageCount: 2, description: 'Two images side-by-side' },
    { type: '3-grid', label: '3-Grid', imageCount: 3, description: 'Three images in a row' },
    { type: '2x2', label: '2×2 Grid', imageCount: 4, description: 'Four images in a grid' },
    { type: 'vertical-stack', label: 'Vertical Stack', imageCount: 3, description: 'Three images stacked' },
];

interface CollageTemplateSelectorProps {
    onSelect: (template: TemplateType, imageCount: number) => void;
    onCancel: () => void;
}

export default function CollageTemplateSelector({ onSelect, onCancel }: CollageTemplateSelectorProps) {
    return (
        <div className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full p-6 border border-gold/20">
                <div className="flex items-center justify-between mb-1">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">Exhibit Layout</p>
                    <button
                        onClick={onCancel}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-6">
                    Choose how the exhibit is arranged
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {templates.map((template) => (
                        <button
                            key={template.type}
                            onClick={() => onSelect(template.type, template.imageCount)}
                            className="group p-6 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-gold transition-all text-left"
                        >
                            {/* Template preview */}
                            <div className="mb-4 h-32 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                                {template.type === '2-grid' && (
                                    <div className="grid grid-cols-2 gap-1 w-24 h-20">
                                        <div className="bg-gold/25 dark:bg-gold/15 rounded" />
                                        <div className="bg-gold/25 dark:bg-gold/15 rounded" />
                                    </div>
                                )}
                                {template.type === '3-grid' && (
                                    <div className="grid grid-cols-3 gap-1 w-32 h-16">
                                        <div className="bg-gold/25 dark:bg-gold/15 rounded" />
                                        <div className="bg-gold/25 dark:bg-gold/15 rounded" />
                                        <div className="bg-gold/25 dark:bg-gold/15 rounded" />
                                    </div>
                                )}
                                {template.type === '2x2' && (
                                    <div className="grid grid-cols-2 gap-1 w-24 h-24">
                                        <div className="bg-gold/25 dark:bg-gold/15 rounded" />
                                        <div className="bg-gold/25 dark:bg-gold/15 rounded" />
                                        <div className="bg-gold/25 dark:bg-gold/15 rounded" />
                                        <div className="bg-gold/25 dark:bg-gold/15 rounded" />
                                    </div>
                                )}
                                {template.type === 'vertical-stack' && (
                                    <div className="grid grid-rows-3 gap-1 w-20 h-24">
                                        <div className="bg-gold/25 dark:bg-gold/15 rounded" />
                                        <div className="bg-gold/25 dark:bg-gold/15 rounded" />
                                        <div className="bg-gold/25 dark:bg-gold/15 rounded" />
                                    </div>
                                )}
                            </div>

                            <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white mb-1">
                                {template.label}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                {template.description}
                            </p>
                            <p className="text-xs font-mono uppercase tracking-wider text-gold">
                                Requires {template.imageCount} images
                            </p>
                        </button>
                    ))}
                </div>

                <button
                    onClick={onCancel}
                    className="w-full px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
