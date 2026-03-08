'use client';

import { logout } from '@/app/actions/auth';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
    return (
        <form action={logout}>
            <button
                type="submit"
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-accent-red/10 hover:text-accent-red transition-all text-sm font-medium"
            >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
            </button>
        </form>
    );
}
