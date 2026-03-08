'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllSlideImages } from '@/app/actions/posts';

interface FeedCardCarouselProps {
    postId: string;
    firstImageUrl: string;
    slideCount: number;
}

export default function FeedCardCarousel({ postId, firstImageUrl, slideCount }: FeedCardCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [allImages, setAllImages] = useState<string[]>([firstImageUrl]);
    const [loading, setLoading] = useState(false);

    // Fetch all slide images when user interacts with carousel
    useEffect(() => {
        if (slideCount > 1 && allImages.length === 1 && !loading) {
            setLoading(true);
            getAllSlideImages(postId).then((images) => {
                if (images.length > 0) {
                    setAllImages(images);
                }
                setLoading(false);
            });
        }
    }, [slideCount, postId, allImages.length, loading]);

    const goToPrevious = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    };

    const goToNext = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="relative aspect-[16/9] bg-slate-200 dark:bg-slate-800 group">
            <Image
                src={allImages[currentIndex]}
                alt="Slide"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
            />

            {/* Navigation arrows */}
            {slideCount > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background-dark/60 hover:bg-background-dark/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background-dark/60 hover:bg-background-dark/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Slide count indicator */}
            {slideCount > 1 && (
                <div className="absolute bottom-3 right-3 bg-background-dark/75 text-white px-2.5 py-1 rounded-md text-sm font-medium backdrop-blur-sm">
                    {currentIndex + 1}/{slideCount}
                </div>
            )}

            {/* Dot indicators */}
            {slideCount > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentIndex(index);
                            }}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                ? 'bg-white w-4'
                                : 'bg-white/50 hover:bg-white/75'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
