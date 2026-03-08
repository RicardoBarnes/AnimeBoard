'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                throw new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.');
            }

            const maxSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxSize) {
                throw new Error('File too large. Maximum size is 50MB.');
            }

            // Extract image dimensions
            const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
                const img = new Image();
                const objectUrl = URL.createObjectURL(file);

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
                .upload(filePath, file, {
                    contentType: file.type,
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
                file_size_bytes: file.size,
                mime_type: file.type,
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
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        required
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 dark:file:bg-purple-900/20 dark:file:text-purple-400 hover:file:bg-purple-100 dark:hover:file:bg-purple-900/40 transition-all"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Max size: 50MB. Formats: JPEG, PNG, WEBP, GIF
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
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
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
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
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
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        placeholder="action, hero, ninja (comma-separated)"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Separate tags with commas
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
                        Image uploaded successfully!
                    </div>
                )}

                <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
            </form>
        </div>
    );
}
