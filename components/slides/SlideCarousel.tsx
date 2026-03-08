'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import CollageRenderer from './CollageRenderer';

interface Slide {
    id: string;
    slide_type: 'single' | 'collage';
    image?: { public_url: string; character_name?: string };
    collage_recipe?: any;
    slide_items?: any[];
}

interface SlideCarouselProps {
    slides: Slide[];
}

export default function SlideCarousel({ slides }: SlideCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    if (!slides || slides.length === 0) {
        return <div className="text-slate-500">No slides available</div>;
    }

    const currentSlide = slides[currentIndex];

    return (
        <div className="relative w-full group">
            {/* Slide content */}
            <div className="relative w-full aspect-[4/3] bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                {currentSlide.slide_type === 'single' && currentSlide.image ? (
                    <Image
                        src={currentSlide.image.public_url}
                        alt={currentSlide.image.character_name || 'Slide image'}
                        fill
                        className="object-contain"
                        sizes="(max-width: 1200px) 100vw, 1200px"
                        priority={currentIndex === 0}
                    />
                ) : currentSlide.slide_type === 'collage' && currentSlide.collage_recipe ? (
                    <CollageRenderer
                        recipe={currentSlide.collage_recipe}
                        slideItems={currentSlide.slide_items || []}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        Invalid slide
                    </div>
                )}
            </div>

            {/* Navigation buttons */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-background-dark/60 hover:bg-background-dark/80 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-slate-700/50"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-background-dark/60 hover:bg-background-dark/80 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-slate-700/50"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Slide indicators */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex
                                ? 'bg-white w-6'
                                : 'bg-white/50 hover:bg-white/75'
                                }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Slide counter */}
            <div className="absolute top-4 right-4 bg-background-dark/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                {currentIndex + 1} / {slides.length}
            </div>
        </div>
    );
}
