'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, Plus, Grid3X3, Layout, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { createPost, type SlideData } from '@/app/actions/posts';
import type { CollageRecipe } from '@/lib/types/database.types';
import ImagePicker, { SelectedImage } from '@/components/images/ImagePicker';
import CollageTemplateSelector from './CollageTemplateSelector';

interface ImageData {
    id: string;
    public_url: string;
    character_name?: string;
    series_name?: string;
}

interface PostBuilderProps {
    userImages: ImageData[];
}

type TemplateType = '2-grid' | '3-grid' | '2x2' | 'vertical-stack';
type EditorMode = 'none' | 'single' | 'collage-template' | 'collage-images';

export default function PostBuilder({ userImages }: PostBuilderProps) {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [slides, setSlides] = useState<SlideData[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Editor state
    const [editorMode, setEditorMode] = useState<EditorMode>('none');
    const [collageTemplate, setCollageTemplate] = useState<TemplateType | null>(null);
    const [collageImageCount, setCollageImageCount] = useState(0);

    // Add single slide
    function handleSingleImageSelect(images: SelectedImage[]) {
        if (images.length === 0) return;
        if (slides.length >= 10) {
            setError('Maximum 10 slides allowed');
            return;
        }

        setSlides([...slides, { slide_type: 'single', single_image_id: images[0].id }]);
        setEditorMode('none');
        setError(null);
    }

    // Handle template selection
    function handleTemplateSelect(template: TemplateType, imageCount: number) {
        setCollageTemplate(template);
        setCollageImageCount(imageCount);
        setEditorMode('collage-images');
    }

    // Add collage slide
    function handleCollageImageSelect(images: SelectedImage[]) {
        if (!collageTemplate) return;

        if (images.length !== collageImageCount) {
            setError(`Please select exactly ${collageImageCount} images for this template`);
            return;
        }

        if (slides.length >= 10) {
            setError('Maximum 10 slides allowed');
            return;
        }

        const recipe: CollageRecipe = {
            template_type: collageTemplate,
            frames: images.map(() => ({ image_id: '', zoom: 1, crop_x: 0, crop_y: 0 })),
        };

        const slide_items = images.map((img, idx) => ({
            image_id: img.id,
            frame_index: idx
        }));

        setSlides([...slides, {
            slide_type: 'collage',
            collage_recipe: recipe,
            slide_items
        }]);

        setEditorMode('none');
        setCollageTemplate(null);
        setCollageImageCount(0);
        setError(null);
    }

    // Remove slide
    function removeSlide(index: number) {
        setSlides(slides.filter((_, i) => i !== index));
    }

    // Validate and submit
    async function handleSubmit() {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }
        if (title.length > 200) {
            setError('Title must be 200 characters or less');
            return;
        }
        if (slides.length === 0) {
            setError('Add at least one slide');
            return;
        }

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            if (slide.slide_type === 'single' && !slide.single_image_id) {
                setError(`Slide ${i + 1} is missing an image`);
                return;
            }
            if (slide.slide_type === 'collage' && (!slide.slide_items || slide.slide_items.length === 0)) {
                setError(`Slide ${i + 1} is missing images`);
                return;
            }
        }

        setIsSubmitting(true);
        setError(null);

        const result = await createPost(title, body || null, slides);

        if (result?.error) {
            setError(result.error);
            setIsSubmitting(false);
        }
    }

    const progress = Math.min(
        ((title.trim() ? 33 : 0) + (slides.length > 0 ? 34 : 0) + (body.trim() ? 33 : 0)),
        100
    );

    return (
        <div className="max-w-[800px] mx-auto flex flex-col gap-8">
            {/* Progress Stepper */}
            <div className="flex flex-col gap-3">
                <div className="flex gap-6 justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-primary text-xs font-bold uppercase tracking-widest">Step 1 of 2</span>
                        <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-bold">Create your board</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{progress}% Complete</p>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm italic">Next up: Preview &amp; Publish</p>
            </div>

            {/* Form Content */}
            <div className="flex flex-col gap-10 bg-slate-50 dark:bg-slate-900/50 p-6 lg:p-10 rounded-xl border border-slate-200 dark:border-slate-800">
                {/* Title Section */}
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-2">
                        <span className="text-slate-900 dark:text-slate-100 text-lg font-bold">Board Title</span>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Is Luffy the GOAT?"
                            maxLength={200}
                            className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-primary focus:border-primary h-14 px-4 text-lg font-medium"
                        />
                    </label>
                    <div className="flex items-center justify-between">
                        <p className="text-slate-500 text-sm">Make it punchy to get more replies.</p>
                        <span className="text-xs text-slate-500">{title.length}/200</span>
                    </div>
                </div>

                {/* Media Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-900 dark:text-slate-100 text-lg font-bold">
                            Slide Deck ({slides.length}/10)
                        </span>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-accent-red/10 text-accent-red uppercase tracking-tighter">
                            Collage Mode
                        </span>
                    </div>

                    {slides.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {slides.map((slide, idx) => (
                                <div key={idx} className="relative aspect-[3/4] rounded-lg border-2 border-primary bg-primary/5 flex flex-col items-center justify-center group cursor-pointer overflow-hidden">
                                    <div className="relative z-10 flex flex-col items-center gap-1 text-primary">
                                        <ImageIcon className="w-5 h-5" />
                                        <span className="text-[10px] font-bold uppercase">
                                            {slide.slide_type === 'single' ? 'Single' : 'Collage'}
                                        </span>
                                        <span className="text-[10px] font-medium">Slide {idx + 1}</span>
                                    </div>
                                    <button
                                        onClick={() => removeSlide(idx)}
                                        className="absolute top-2 right-2 bg-accent-red text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent-red/80"
                                        title="Remove slide"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {slides.length < 10 && (
                                <button
                                    onClick={() => setEditorMode('single')}
                                    className="aspect-[3/4] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer text-slate-400 hover:text-primary"
                                >
                                    <Plus className="w-6 h-6" />
                                    <span className="text-[10px] font-bold mt-2 uppercase">Add</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setEditorMode('single')}
                                className="flex-1 aspect-[3/4] max-h-48 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer text-slate-400 hover:text-primary gap-2"
                            >
                                <Layout className="w-6 h-6" />
                                <span className="text-xs font-bold uppercase">Single Image</span>
                            </button>
                            <button
                                onClick={() => setEditorMode('collage-template')}
                                className="flex-1 aspect-[3/4] max-h-48 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer text-slate-400 hover:text-primary gap-2"
                            >
                                <Grid3X3 className="w-6 h-6" />
                                <span className="text-xs font-bold uppercase">Collage</span>
                            </button>
                        </div>
                    )}

                    <p className="text-slate-500 text-sm">Upload at least 1 image to create your board.</p>
                </div>

                {/* Opinion Text Area */}
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-2">
                        <span className="text-slate-900 dark:text-slate-100 text-lg font-bold">The Verdict / Opinion</span>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Explain your take here... Why is your choice the best?"
                            className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-primary focus:border-primary min-h-[160px] p-4 resize-none"
                        />
                    </label>
                </div>

                {/* Image Picker for Single Slides */}
                {editorMode === 'single' && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Select Image for Slide
                            </h3>
                            <button
                                onClick={() => setEditorMode('none')}
                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <ImagePicker
                            mode="single"
                            onSelect={handleSingleImageSelect}
                        />
                    </div>
                )}

                {/* Template Selector */}
                {editorMode === 'collage-template' && (
                    <CollageTemplateSelector
                        onSelect={handleTemplateSelect}
                        onCancel={() => setEditorMode('none')}
                    />
                )}

                {/* Image Picker for Collage */}
                {editorMode === 'collage-images' && collageTemplate && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Select {collageImageCount} Images for Collage
                            </h3>
                            <button
                                onClick={() => {
                                    setEditorMode('none');
                                    setCollageTemplate(null);
                                }}
                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <ImagePicker
                            mode="multi"
                            onSelect={handleCollageImageSelect}
                        />
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                            Select exactly {collageImageCount} images, then the slide will be added automatically.
                        </p>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="bg-accent-red/10 text-accent-red px-4 py-3 rounded-lg border border-accent-red/20 font-medium">
                        {error}
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => router.push('/home')}
                        className="px-6 h-12 rounded-lg font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || slides.length === 0 || !title.trim()}
                        className="px-10 h-12 rounded-lg bg-primary text-white font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Publishing...' : 'Publish Board'}
                        {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
