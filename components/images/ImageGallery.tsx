'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Database } from '@/lib/types/database.types';
import EditImageModal from './EditImageModal';

type ImageData = Database['public']['Tables']['images']['Row'];

interface ImageGalleryProps {
    images: ImageData[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEditClick = (image: ImageData) => {
        setSelectedImage(image);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Small delay before clearing to allow modal animation
        setTimeout(() => setSelectedImage(null), 200);
    };

    if (images.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">
                    No images found. Upload your first image!
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {images.map((image) => (
                    <div
                        key={image.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group"
                    >
                        <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700">
                            <Image
                                src={image.public_url}
                                alt={image.character_name || 'Anime image'}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            />
                            {/* Edit button overlay */}
                            <button
                                onClick={() => handleEditClick(image)}
                                className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-lg"
                                title="Edit image details"
                            >
                                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </button>
                        </div>
                        <div className="p-4">
                            {image.character_name && (
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {image.character_name}
                                </h3>
                            )}
                            {image.series_name && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {image.series_name}
                                </p>
                            )}
                            {image.tags && image.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {image.tags.slice(0, 3).map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="text-xs px-2 py-1 bg-gold/10 text-gold rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                    {image.tags.length > 3 && (
                                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                            +{image.tags.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
                            {image.width && image.height && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                    {image.width} × {image.height} px
                                </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {new Date(image.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {selectedImage && (
                <EditImageModal
                    image={selectedImage}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
}
