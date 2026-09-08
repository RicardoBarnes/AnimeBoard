'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, Plus, Grid3X3, Layout, ArrowRight } from 'lucide-react';
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

// Display-only preview alongside each SlideData entry, so the exhibit grid
// shows the actual selected image(s) rather than a generic placeholder icon.
interface SlidePreview {
    coverUrl: string;
    type: 'single' | 'collage';
    count: number;
}

export default function PostBuilder({ userImages }: PostBuilderProps) {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [slides, setSlides] = useState<SlideData[]>([]);
    const [previews, setPreviews] = useState<SlidePreview[]>([]);
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
            setError('Maximum 10 exhibits allowed');
            return;
        }

        setSlides([...slides, { slide_type: 'single', single_image_id: images[0].id }]);
        setPreviews([...previews, { coverUrl: images[0].url, type: 'single', count: 1 }]);
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
            setError(`Please select exactly ${collageImageCount} images for this exhibit`);
            return;
        }

        if (slides.length >= 10) {
            setError('Maximum 10 exhibits allowed');
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
        setPreviews([...previews, { coverUrl: images[0].url, type: 'collage', count: images.length }]);

        setEditorMode('none');
        setCollageTemplate(null);
        setCollageImageCount(0);
        setError(null);
    }

    // Remove slide
    function removeSlide(index: number) {
        setSlides(slides.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    }

    // Validate and submit
    async function handleSubmit() {
        if (!title.trim()) {
            setError('A case title is required');
            return;
        }
        if (title.length > 200) {
            setError('Title must be 200 characters or less');
            return;
        }
        if (slides.length === 0) {
            setError('Add at least one exhibit');
            return;
        }

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            if (slide.slide_type === 'single' && !slide.single_image_id) {
                setError(`Exhibit ${i + 1} is missing an image`);
                return;
            }
            if (slide.slide_type === 'collage' && (!slide.slide_items || slide.slide_items.length === 0)) {
                setError(`Exhibit ${i + 1} is missing images`);
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
                        <span className="font-mono text-gold text-xs uppercase tracking-[0.2em]">Filing · Step 1 of 2</span>
                        <h1 className="font-display text-slate-900 dark:text-slate-100 text-3xl font-semibold">File a new case</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-mono">{progress}% complete</p>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gold transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm italic">Next up: preview &amp; publish to the docket</p>
            </div>

            {/* Form Content */}
            <div className="flex flex-col gap-10 bg-slate-50 dark:bg-slate-900/50 p-6 lg:p-10 rounded-xl border border-slate-200 dark:border-slate-800">
                {/* Title Section */}
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-2">
                        <span className="text-slate-900 dark:text-slate-100 text-lg font-display font-semibold">Case Title</span>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Is Luffy the GOAT?"
                            maxLength={200}
                            className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-gold focus:border-gold h-14 px-4 text-lg font-medium"
                        />
                    </label>
                    <div className="flex items-center justify-between">
                        <p className="text-slate-500 text-sm">Make it punchy to get more testimony.</p>
                        <span className="text-xs font-mono text-slate-500">{title.length}/200</span>
                    </div>
                </div>

                {/* Media Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-900 dark:text-slate-100 text-lg font-display font-semibold">
                            Exhibits ({slides.length}/10)
                        </span>
                        {slides.length > 0 && (
                            <span className="text-[10px] font-mono px-2 py-1 rounded bg-gold/10 text-gold uppercase tracking-wider">
                                {slides.length} filed
                            </span>
                        )}
                    </div>

                    {slides.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {slides.map((slide, idx) => {
                                const preview = previews[idx];
                                return (
                                    <div key={idx} className="relative aspect-[3/4] rounded-lg border-2 border-gold overflow-hidden group">
                                        {preview?.coverUrl && (
                                            <Image
                                                src={preview.coverUrl}
                                                alt={`Exhibit ${idx + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="160px"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-2">
                                            <span className="font-mono text-[10px] text-white uppercase tracking-wider">
                                                Exhibit {idx + 1}{preview?.type === 'collage' ? ` · ${preview.count}` : ''}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removeSlide(idx)}
                                            className="absolute top-2 right-2 bg-disagree text-disagree-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-disagree/80"
                                            title="Remove exhibit"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            })}
                            {slides.length < 10 && (
                                <button
                                    onClick={() => setEditorMode('single')}
                                    className="aspect-[3/4] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center hover:border-gold/50 transition-colors cursor-pointer text-slate-400 hover:text-gold"
                                >
                                    <Plus className="w-6 h-6" />
                                    <span className="text-[10px] font-mono mt-2 uppercase tracking-wider">Add</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setEditorMode('single')}
                                className="flex-1 aspect-[3/4] max-h-48 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center hover:border-gold/50 transition-colors cursor-pointer text-slate-400 hover:text-gold gap-2"
                            >
                                <Layout className="w-6 h-6" />
                                <span className="text-xs font-mono uppercase tracking-wider">Single Exhibit</span>
                            </button>
                            <button
                                onClick={() => setEditorMode('collage-template')}
                                className="flex-1 aspect-[3/4] max-h-48 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center hover:border-gold/50 transition-colors cursor-pointer text-slate-400 hover:text-gold gap-2"
                            >
                                <Grid3X3 className="w-6 h-6" />
                                <span className="text-xs font-mono uppercase tracking-wider">Collage</span>
                            </button>
                        </div>
                    )}

                    <p className="text-slate-500 text-sm">Submit at least one image as evidence for your case.</p>
                </div>

                {/* Opinion Text Area */}
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-2">
                        <span className="text-slate-900 dark:text-slate-100 text-lg font-display font-semibold">Opening Statement</span>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Explain your take here... Why is your case the strongest?"
                            className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-gold focus:border-gold min-h-[160px] p-4 resize-none"
                        />
                    </label>
                </div>

                {/* Image Picker for Single Slides */}
                {editorMode === 'single' && (
                    <div className="bg-white dark:bg-slate-800 border border-gold/20 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                                Select an Exhibit
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
                    <div className="bg-white dark:bg-slate-800 border border-gold/20 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                                Select {collageImageCount} Images for This Exhibit
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
                            Select exactly {collageImageCount} images, then the exhibit will be added automatically.
                        </p>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="bg-disagree/10 text-disagree px-4 py-3 rounded-lg border border-disagree/20 font-medium">
                        {error}
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => router.push('/home')}
                        className="px-6 h-12 rounded-lg font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || slides.length === 0 || !title.trim()}
                        className="px-10 h-12 rounded-lg bg-gold text-ink font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Filing...' : 'File the Case'}
                        {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
