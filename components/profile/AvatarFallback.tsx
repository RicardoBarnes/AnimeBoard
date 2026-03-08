interface AvatarFallbackProps {
    username: string;
    avatarUrl?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

// Generate a consistent color based on username
function getAvatarColor(username: string): string {
    const colors = [
        'bg-gradient-to-br from-purple-500 to-pink-500',
        'bg-gradient-to-br from-blue-500 to-cyan-500',
        'bg-gradient-to-br from-green-500 to-emerald-500',
        'bg-gradient-to-br from-orange-500 to-red-500',
        'bg-gradient-to-br from-indigo-500 to-purple-500',
        'bg-gradient-to-br from-pink-500 to-rose-500',
    ];

    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

// Get initials from username
function getInitials(username: string): string {
    return username.slice(0, 2).toUpperCase();
}

export default function AvatarFallback({
    username,
    avatarUrl,
    size = 'md',
    className = '',
}: AvatarFallbackProps) {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-sm',
        lg: 'w-20 h-20 text-xl',
        xl: 'w-32 h-32 text-4xl',
    };

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={`${username}'s avatar`}
                className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
            />
        );
    }

    // Fallback to initials
    const initials = getInitials(username);
    const colorClass = getAvatarColor(username);

    return (
        <div
            className={`${sizeClasses[size]} ${colorClass} rounded-full flex items-center justify-center font-bold text-white ${className}`}
        >
            {initials}
        </div>
    );
}
