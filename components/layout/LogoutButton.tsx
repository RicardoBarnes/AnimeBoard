'use client';

import { logout } from '@/app/actions/auth';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
    return (
        <form action={logout}>
            <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
            </button>
        </form>
    );
}
