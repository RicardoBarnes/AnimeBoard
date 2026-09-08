import { getCurrentUser } from '@/lib/supabase/server';
import { searchImages } from '@/app/actions/images';
import Link from 'next/link';
import ImageUploader from '@/components/images/ImageUploader';
import ImageGallery from '@/components/images/ImageGallery';
import ImageSearch from '@/components/images/ImageSearch';

export default async function ImagesPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    const user = await getCurrentUser();
    const params = await searchParams;
    const query = params.q || '';
    const page = Math.max(0, parseInt(params.page || '0', 10) || 0);

    // Fetch user's images with optional search, bounded and paginated
    // instead of fetching the entire library unbounded.
    const { data: images, hasMore } = user
        ? await searchImages(query, page)
        : { data: [], hasMore: false };

    return (
        <div className="space-y-8">
            <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-2">Evidence Locker</p>
                <h1 className="font-display text-3xl font-semibold text-gray-900 dark:text-white">
                    My Images
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Upload and manage the images you submit as evidence.
                </p>
            </div>

            <ImageUploader />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-semibold text-gray-900 dark:text-white">
                        Your Library
                        {images && images.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                (showing {images.length} {images.length === 1 ? 'image' : 'images'})
                            </span>
                        )}
                    </h2>
                </div>

                <ImageSearch />

                {query && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing results for &quot;{query}&quot;
                    </p>
                )}

                <ImageGallery images={images || []} />

                {hasMore && (
                    <div className="text-center">
                        <Link
                            href={`/app/images?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(page + 1) }).toString()}`}
                            className="inline-block px-4 py-2 text-sm font-medium text-gold hover:text-gold-dim"
                        >
                            Load more
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
