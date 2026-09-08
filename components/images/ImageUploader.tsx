'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const MAX_DIMENSION = 2000;
const RESIZE_QUALITY = 0.85;

// Downscale + re-encode client-side (free, no infra) so large originals
// never hit storage/egress at full resolution. Falls back to the original
// file if resizing isn't needed or the browser can't produce a smaller blob.
async function resizeImageIfNeeded(file: File): Promise<File> {
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        return file;
    }

    const { width, height } = bitmap;

    if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        bitmap.close();
        return file;
    }

    const scale = MAX_DIMENSION / Math.max(width, height);
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        bitmap.close();
        return file;
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, file.type, RESIZE_QUALITY)
    );

    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name, { type: file.type });
}

export default function ImageUploader() {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setUploading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData(e.currentTarget);
        const file = formData.get('file') as File;
        const characterName = (formData.get('character_name') as string) || null;
        const seriesName = (formData.get('series_name') as string) || null;
        const tagsString = formData.get('tags') as string;

        try {
            // Validate file
            if (!file) {
                throw new Error('No file provided');
            }

            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                throw new Error('Invalid file type. Only JPEG, PNG, and WEBP are allowed.');
            }

            const maxSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxSize) {
                throw new Error('File too large. Maximum size is 50MB.');
            }

            // Downscale before upload so storage/egress never carry full-resolution
            // originals for images that don't need them.
            const uploadFile = await resizeImageIfNeeded(file);

            // Extract image dimensions (from the file that will actually be uploaded)
            const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
                const img = new Image();
                const objectUrl = URL.createObjectURL(uploadFile);

                img.onload = () => {
                    URL.revokeObjectURL(objectUrl);
                    resolve({ width: img.width, height: img.height });
                };

                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error('Failed to load image'));
                };

                img.src = objectUrl;
            });

            // Get authenticated user
            const supabase = createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error('Not authenticated');
            }

            // Generate unique filename
            const imageId = crypto.randomUUID();
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${imageId}.${fileExt}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('user-uploads')
                .upload(filePath, uploadFile, {
                    contentType: uploadFile.type,
                    upsert: false,
                });

            if (uploadError) {
                throw new Error(uploadError.message);
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('user-uploads')
                .getPublicUrl(filePath);

            // Parse tags
            const tags = tagsString
                ? tagsString.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
                : [];

            // Insert metadata into database
            const { error: dbError } = await supabase.from('images').insert({
                id: imageId,
                uploader_id: user.id,
                storage_path: filePath,
                public_url: publicUrl,
                character_name: characterName,
                series_name: seriesName,
                tags: tags,
                file_size_bytes: uploadFile.size,
                mime_type: uploadFile.type,
                width: width,
                height: height,
            });

            if (dbError) {
                // Clean up uploaded file if database insert fails
                await supabase.storage.from('user-uploads').remove([filePath]);
                throw new Error(dbError.message);
            }

            // Success!
            setSuccess(true);
            setPreview(null);
            (e.target as HTMLFormElement).reset();

            // Refresh the page to show new image
            router.refresh();

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Upload New Image
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Image File
                    </label>
                    <input
                        type="file"
                        name="file"
                        accept="image/jpeg,image/png,image/webp"
                        required
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gold/10 file:text-gold dark:file:bg-gold/10 dark:file:text-gold hover:file:bg-gold/20 dark:hover:file:bg-gold/20 transition-all"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Max size: 50MB. Formats: JPEG, PNG, WEBP. Large images are automatically resized.
                    </p>
                </div>

                {preview && (
                    <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Character Name
                        </label>
                        <input
                            type="text"
                            name="character_name"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="e.g., Naruto Uzumaki"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Series Name
                        </label>
                        <input
                            type="text"
                            name="series_name"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="e.g., Naruto"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tags
                    </label>
                    <input
                        type="text"
                        name="tags"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        placeholder="action, hero, ninja (comma-separated)"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Separate tags with commas
                    </p>
                </div>

                {error && (
                    <div className="bg-disagree/10 border border-disagree/30 text-disagree px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-gold/10 border border-gold/30 text-gold px-4 py-3 rounded-lg text-sm">
                        Evidence filed successfully.
                    </div>
                )}

                <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-gold text-ink py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-gold/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
            </form>
        </div>
    );
}
