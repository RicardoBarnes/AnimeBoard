'use client';

import Image from 'next/image';
import type { CollageRecipe } from '@/lib/types/database.types';

interface CollageRendererProps {
    recipe: CollageRecipe;
    slideItems: { frame_index: number; images: { public_url: string; character_name?: string } }[];
    className?: string;
}

export default function CollageRenderer({ recipe, slideItems, className = '' }: CollageRendererProps) {
    const getGridClass = () => {
        switch (recipe.template_type) {
            case '2-grid':
                return 'grid-cols-2 grid-rows-1';
            case '3-grid':
                return 'grid-cols-3 grid-rows-1';
            case '2x2':
                return 'grid-cols-2 grid-rows-2';
            case 'vertical-stack':
                return 'grid-cols-1';
            default:
                return 'grid-cols-2';
        }
    };

    return (
        <div className={`relative w-full h-full ${className}`}>
            <div className={`grid ${getGridClass()} gap-1 w-full h-full`}>
                {slideItems?.map((item, idx) => {
                    const frameData = recipe.frames[item.frame_index];
                    const zoom = frameData?.zoom || 1;
                    const cropX = (frameData?.crop_x || 0) * 100;
                    const cropY = (frameData?.crop_y || 0) * 100;

                    return (
                        <div key={idx} className="relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <Image
                                src={item.images.public_url}
                                alt={item.images.character_name || 'Anime image'}
                                fill
                                className="object-cover"
                                style={{
                                    transform: `scale(${zoom})`,
                                    objectPosition: `${50 - cropX}% ${50 - cropY}%`,
                                }}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                    );
                })}
            </div>

            {/* Text overlays */}
            {recipe.text_overlays?.map((overlay, idx) => {
                const positionClasses = {
                    'top-center': 'top-4 left-1/2 -translate-x-1/2',
                    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
                    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                };

                return (
                    <div
                        key={idx}
                        className={`absolute ${positionClasses[overlay.position]} bg-black/70 text-white px-4 py-2 rounded-lg`}
                    >
                        <p className={overlay.style === 'bold' ? 'font-bold text-lg' : 'text-base'}>
                            {overlay.text}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
