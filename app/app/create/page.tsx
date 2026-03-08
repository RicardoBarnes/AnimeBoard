import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PostBuilder from '@/components/posts/PostBuilder';

export default async function CreatePostPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch user's images
    const { data: images } = await supabase
        .from('images')
        .select('id, public_url, character_name, series_name')
        .eq('uploader_id', user.id)
        .is('removed_at', null)
        .order('created_at', { ascending: false });

    return (
        <div className="py-8">
            <PostBuilder userImages={images || []} />
        </div>
    );
}
