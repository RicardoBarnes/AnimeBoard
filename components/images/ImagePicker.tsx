'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Database } from '@/lib/types/database.types';

type ImageData = Database['public']['Tables']['images']['Row'];

export interface SelectedImage {
    id: string;
    url: string;
}

interface ImagePickerProps {
    mode?: 'single' | 'multi';
    onSelect: (images: SelectedImage[]) => void;
    initialSelected?: string[]; // Array of image IDs
    className?: string;
}

export default function ImagePicker({
    mode = 'single',
    onSelect,
    initialSelected = [],
    className = ''
}: ImagePickerProps) {
    const [images, setImages] = useState<ImageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelected));

    // Fetch images with search
    const fetchImages = useCallback(async (query: string) => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setImages([]);
                return;
            }

            let queryBuilder = supabase
                .from('images')
                .select('*')
                .eq('uploader_id', user.id)
                .is('removed_at', null)
                .order('created_at', { ascending: false });

            if (query.trim()) {
                queryBuilder = queryBuilder.or(
                    `character_name.ilike.%${query}%,series_name.ilike.%${query}%,tags.cs.{${query}}`
                );
            }

            const { data, error } = await queryBuilder;

            if (!error && data) {
                setImages(data);
            }
        } catch (err) {
            console.error('Error fetching images:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchImages(searchQuery);
    }, [searchQuery, fetchImages]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchImages(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, fetchImages]);

    // Handle image selection
    const handleImageClick = (image: ImageData) => {
        const newSelected = new Set(selectedIds);

        if (mode === 'single') {
            newSelected.clear();
            newSelected.add(image.id);
        } else {
            if (newSelected.has(image.id)) {
                newSelected.delete(image.id);
            } else {
                newSelected.add(image.id);
            }
        }

        setSelectedIds(newSelected);

        // Create selected images array
        const selectedImages: SelectedImage[] = Array.from(newSelected).map(id => {
            const img = images.find(i => i.id === id);
            return {
                id,
                url: img?.public_url || ''
            };
        });

        onSelect(selectedImages);
    };

    const isSelected = (imageId: string) => selectedIds.has(imageId);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search input */}
            <div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by character, series, or tags..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
            </div>

            {/* Image grid */}
            {loading && (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">Loading images...</p>
                </div>
            )}

            {!loading && images.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchQuery ? 'No images found matching your search.' : 'No images available. Upload some images first!'}
                    </p>
                </div>
            )}

            {!loading && images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image) => (
                        <button
                            key={image.id}
                            onClick={() => handleImageClick(image)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${isSelected(image.id)
                                    ? 'border-purple-500 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-900'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                                }`}
                        >
                            <Image
                                src={image.public_url}
                                alt={image.character_name || 'Image'}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />

                            {/* Selection indicator */}
                            {isSelected(image.id) && (
                                <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                            {/* Image info */}
                            {(image.character_name || image.series_name) && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {image.character_name && (
                                        <p className="text-white text-xs font-semibold truncate">
                                            {image.character_name}
                                        </p>
                                    )}
                                    {image.series_name && (
                                        <p className="text-white/80 text-xs truncate">
                                            {image.series_name}
                                        </p>
                                    )}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Selection info */}
            {selectedIds.size > 0 && (
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                        {selectedIds.size} {selectedIds.size === 1 ? 'image' : 'images'} selected
                    </p>
                    {mode === 'multi' && (
                        <button
                            onClick={() => {
                                setSelectedIds(new Set());
                                onSelect([]);
                            }}
                            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 font-medium"
                        >
                            Clear selection
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
