import LegalPage from '@/components/legal/LegalPage';

const SECTIONS = [
    {
        title: 'What cookies are',
        body: `Cookies are small text files a website stores in your browser to remember information between visits.`,
    },
    {
        title: 'Cookies we use',
        body: `AnimeBoard uses one kind of cookie: a session cookie set by our authentication provider (Supabase) that keeps you signed in as you move between pages. It's strictly necessary for the platform to function — without it, you'd have to log in again on every page. We do not use advertising cookies, third-party tracking cookies, or analytics cookies.`,
    },
    {
        title: 'Your choices',
        body: `Because we only use a strictly-necessary session cookie, there's nothing to opt out of beyond your browser's own cookie settings. You can block or delete cookies in your browser, but doing so will sign you out and prevent you from staying logged in.`,
    },
    {
        title: 'Changes to this policy',
        body: `If we ever add analytics or other non-essential cookies, we'll update this page and, where required, ask for your consent first.`,
    },
    {
        title: 'Contact',
        body: `Questions about cookies? Reach us at [contact email — add yours here].`,
    },
];

export default function CookiesPage() {
    return (
        <LegalPage
            title="Cookie Policy"
            lastUpdated="September 7, 2026"
            sections={SECTIONS}
            crossLinks={[
                { href: '/terms', label: 'Terms of Service' },
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/community-guidelines', label: 'Community Guidelines' },
                { href: '/copyright', label: 'Copyright Policy' },
                { href: '/signup', label: 'Back to sign up' },
            ]}
        />
    );
}
