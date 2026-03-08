'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/home');
}

export async function signup(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;

    // Check for duplicate username (case-insensitive)
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', username)
        .single();

    if (existingUser) {
        return { error: 'Username already taken' };
    }

    // Sign up with username in metadata
    // The database trigger will automatically create the profile
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username,
            },
        },
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/home');
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect('/login');
}

export async function forgotPassword(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get('email') as string;

    if (!email) {
        return { error: 'Email is required' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    });

    // Don't reveal if email exists or not (security)
    // Return success even if error
    return { success: true };
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient();

    const password = formData.get('password') as string;

    if (!password) {
        return { error: 'Password is required' };
    }

    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters' };
    }

    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        return { error: 'Failed to reset password. The link may have expired.' };
    }

    return { success: true };
}
