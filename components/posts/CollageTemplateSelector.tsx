'use client';

import { useState } from 'react';
import ImagePicker, { SelectedImage } from '@/components/images/ImagePicker';

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Choose Collage Template
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {templates.map((template) => (
                        <button
                            key={template.type}
                            onClick={() => onSelect(template.type, template.imageCount)}
                            className="group p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-all text-left"
                        >
                            {/* Template preview */}
                            <div className="mb-4 h-32 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                                {template.type === '2-grid' && (
                                    <div className="grid grid-cols-2 gap-1 w-24 h-20">
                                        <div className="bg-purple-200 dark:bg-purple-900/50 rounded" />
                                        <div className="bg-purple-200 dark:bg-purple-900/50 rounded" />
                                    </div>
                                )}
                                {template.type === '3-grid' && (
                                    <div className="grid grid-cols-3 gap-1 w-32 h-16">
                                        <div className="bg-purple-200 dark:bg-purple-900/50 rounded" />
                                        <div className="bg-purple-200 dark:bg-purple-900/50 rounded" />
                                        <div className="bg-purple-200 dark:bg-purple-900/50 rounded" />
                                    </div>
                                )}
                                {template.type === '2x2' && (
                                    <div className="grid grid-cols-2 gap-1 w-24 h-24">
                                        <div className="bg-purple-200 dark:bg-purple-900/50 rounded" />
                                        <div className="bg-purple-200 dark:bg-purple-900/50 rounded" />
                                        <div className="bg-purple-200 dark:bg-purple-900/50 rounded" />
                                        <div className="bg-purple-200 dark:bg-purple-900/50 rounded" />
                                    </div>
                                )}
                                {template.type === 'vertical-stack' && (
                                    <div className="grid grid-rows-3 gap-1 w-20 h-24">
                                        <div className="bg-purple-200 dark:bg-purple-900/50 rounded" />
                                        <div className="bg-purple-200 dark:bg-purple-900/50 rounded" />
                                        <div className="bg-purple-200 dark:bg-purple-900/50 rounded" />
                                    </div>
                                )}
                            </div>

                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                                {template.label}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {template.description}
                            </p>
                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                Requires {template.imageCount} images
                            </p>
                        </button>
                    ))}
                </div>

                <button
                    onClick={onCancel}
                    className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
