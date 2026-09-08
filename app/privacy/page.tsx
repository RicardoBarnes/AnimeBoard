import LegalPage from '@/components/legal/LegalPage';

const SECTIONS = [
    {
        title: 'What we collect',
        body: `Account information: email address, username, and password (stored securely by our authentication provider, Supabase — we never see or store your raw password). Profile information you choose to add: avatar image and bio. Content you submit: post titles, images, comments, and votes. Moderation data: if you report content, we store the reason and explanation you provide, tied to your account, so administrators can review it — and if content you posted is reported, that report and its outcome are stored too. Safety and reliability logs: timestamps of actions like posting or voting (used only to detect spam/abuse), and, if something breaks, a record of the error message and the page you were on — tied to your account where you were logged in, so we can investigate. None of this is sold or used for advertising.`,
    },
    {
        title: 'How we use it',
        body: `To operate your account and let you use the platform (posting, voting, commenting). To enforce our Terms of Service and Community Guidelines, including reviewing content reports and throttling abusive/spammy activity. To understand platform growth and usage in aggregate, and to diagnose bugs (both visible only to administrators, never sold or shared).`,
    },
    {
        title: 'Who we share it with',
        body: `We use Supabase as our database, authentication, and file storage provider — your data is stored on their infrastructure under their security practices. We do not sell your personal information to third parties or use it for advertising.`,
    },
    {
        title: 'Automated processing',
        body: `We do not use AI or automated systems to make decisions about your account or content. Content moderation (reviewing reports, removing content, suspending accounts) is done by a human administrator, not an algorithm. If that ever changes, we'll update this section first.`,
    },
    {
        title: 'Public content',
        body: `Your username, avatar, posts, images, and comments are public by default and visible to anyone who visits the platform, including people who aren't logged in. Your email address is never made public. Your individual votes are private — only aggregate vote counts are shown. Reports you file, and reports filed against your content, are visible only to administrators.`,
    },
    {
        title: 'Cookies',
        body: `We use cookies only to keep you signed in. See our Cookie Policy for details — we don't use third-party advertising or tracking cookies.`,
    },
    {
        title: 'Data retention and deletion',
        body: `Deleting a post (from the post page) permanently deletes that post, its votes, and its comments — not a soft hide, an actual removal. The images used in it stay in your account's image library, since you may reuse them in other posts.

You can delete your entire account at any time from your profile page. This permanently deletes your profile, every case you've filed, your votes, comments, and uploaded images — there's no recovery once confirmed.

Content removed by an administrator for violating our Community Guidelines is hidden from public view rather than immediately deleted, so a removal can be reviewed or reversed if it was a mistake. Safety/reliability logs (spam-prevention and error logs) are kept as long as needed to keep the platform secure and working, and aren't tied to a fixed deletion schedule today.`,
    },
    {
        title: "Children's privacy",
        body: `AnimeBoard is not directed at children under 13, and we don't knowingly collect information from anyone under that age. If you believe a child has created an account, contact us and we'll remove it.`,
    },
    {
        title: 'Changes to this policy',
        body: `We may update this policy as the platform evolves. We'll update the date at the top of this page when we do.`,
    },
    {
        title: 'Contact',
        body: `Questions about this policy, or something not covered by self-service deletion? Reach us at [contact email — add yours here].`,
    },
];

export default function PrivacyPage() {
    return (
        <LegalPage
            title="Privacy Policy"
            lastUpdated="September 7, 2026"
            sections={SECTIONS}
            crossLinks={[
                { href: '/terms', label: 'Terms of Service' },
                { href: '/community-guidelines', label: 'Community Guidelines' },
                { href: '/copyright', label: 'Copyright Policy' },
                { href: '/cookies', label: 'Cookie Policy' },
                { href: '/signup', label: 'Back to sign up' },
            ]}
        />
    );
}
