'use client';

import { useState } from 'react';
import { uploadAvatar, updateProfile } from '@/app/actions/profiles';
import { Upload, Loader2 } from 'lucide-react';

interface ProfileEditorProps {
    initialBio?: string;
    initialAvatarUrl?: string;
}

export default function ProfileEditor({ initialBio, initialAvatarUrl }: ProfileEditorProps) {
    const [bio, setBio] = useState(initialBio || '');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image must be less than 5MB');
                return;
            }

            setSelectedFile(file);
            setError(null);

            // Show preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setError(null);
        setSuccess(null);
        setIsSaving(true);

        try {
            let newAvatarUrl = initialAvatarUrl;

            // Upload avatar if changed
            if (selectedFile) {
                setIsUploading(true);
                const formData = new FormData();
                formData.append('avatar', selectedFile);

                const result = await uploadAvatar(formData);
                setIsUploading(false);

                if (!result.success) {
                    throw new Error(result.error || 'Failed to upload avatar');
                }

                newAvatarUrl = result.url || undefined;
            }

            // Update profile
            const result = await updateProfile({
                bio: bio.trim() || undefined,
                avatarUrl: newAvatarUrl,
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to update profile');
            }

            setSuccess('Profile updated successfully!');
            setSelectedFile(null);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const bioLength = bio.length;
    const bioMaxLength = 160;

    return (
        <div className="space-y-6">
            {/* Avatar Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Profile Picture
                </label>
                <div className="flex items-center gap-6">
                    {/* Avatar Preview */}
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Avatar preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Upload className="w-8 h-8 text-gray-400" />
                        )}
                    </div>

                    {/* Upload Button */}
                    <div>
                        <label
                            htmlFor="avatar-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Choose Image
                        </label>
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isUploading || isSaving}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            JPG, PNG or WebP. Max 5MB.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bio */}
            <div>
                <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                    Bio
                </label>
                <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={bioMaxLength}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Tell us about yourself..."
                    disabled={isSaving}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {bioLength} / {bioMaxLength}
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
                    {success}
                </div>
            )}

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isUploading ? 'Uploading...' : 'Saving...'}
                    </span>
                ) : (
                    'Save Changes'
                )}
            </button>
        </div>
    );
}
