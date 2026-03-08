import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import ProfileEditor from '@/components/profile/ProfileEditor';
import AvatarFallback from '@/components/profile/AvatarFallback';

export default async function ProfileEditPage() {
    // Check authentication
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch current profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio')
        .eq('id', user.id)
        .single();

    if (!profile) {
        redirect('/login');
    }

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <main className="max-w-2xl mx-auto px-4 py-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Edit Profile
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Update your profile picture and bio
                            </p>
                        </div>

                        <ProfileEditor
                            initialBio={profile.bio || undefined}
                            initialAvatarUrl={profile.avatar_url || undefined}
                        />
                    </div>
                </main>
            </div>
        </>
    );
}
