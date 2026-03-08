import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function RootPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Redirect based on authentication status
    if (user) {
        redirect('/home');
    } else {
        redirect('/login');
    }
}
