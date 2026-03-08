import { createClient } from '@/lib/supabase/server';
import ImageUploader from '@/components/images/ImageUploader';
import ImageGallery from '@/components/images/ImageGallery';
import ImageSearch from '@/components/images/ImageSearch';

export default async function ImagesPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const params = await searchParams;
    const query = params.q || '';

    // Fetch user's images with optional search
    let queryBuilder = supabase
        .from('images')
        .select('*')
        .eq('uploader_id', user!.id)
        .is('removed_at', null)
        .order('created_at', { ascending: false });

    if (query) {
        queryBuilder = queryBuilder.or(
            `character_name.ilike.%${query}%,series_name.ilike.%${query}%`
        );
    }

    const { data: images } = await queryBuilder;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    My Images
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Upload and manage your anime image collection
                </p>
            </div>

            <ImageUploader />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Your Library
                        {images && images.length > 0 && (
                            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                ({images.length} {images.length === 1 ? 'image' : 'images'})
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
            </div>
        </div>
    );
}
