import LegalPage from '@/components/legal/LegalPage';

const SECTIONS = [
    {
        title: 'Acceptance of these terms',
        body: `By creating an account or using AnimeBoard ("the platform"), you agree to these Terms of Service, our Community Guidelines, and our Copyright Policy. If you don't agree, don't use the platform. You must be at least 13 years old to create an account.`,
    },
    {
        title: 'Your account',
        body: `You're responsible for the security of your account and everything that happens under it. Provide accurate information at signup and keep your password confidential. We may suspend or terminate accounts that violate these terms.`,
    },
    {
        title: 'Content you submit',
        body: `You keep ownership of the images, titles, comments, and other content you upload ("your content"). By posting it, you grant AnimeBoard a non-exclusive, worldwide, royalty-free license to host, store, display, and distribute your content solely for the purpose of operating the platform. You must have the rights to anything you upload — don't post content you don't own or aren't licensed to share.`,
    },
    {
        title: 'Acceptable use',
        body: `Don't use the platform to post content that is illegal, infringes someone else's copyright, is sexually explicit, harasses or threatens others, or is spam. See our Community Guidelines for the full, plain-language rules. Don't attempt to abuse, overload, or reverse-engineer the platform, or automate interactions (bots, scripted voting, scripted account creation) without our written permission.`,
    },
    {
        title: 'Reporting and content removal',
        body: `Any member can report a case, comment, or image they believe violates these terms using the report feature on that content. Reports are reviewed by the platform's moderators, who may remove content or suspend accounts at their discretion. If you believe your content was removed in error, contact us using the details below.`,
    },
    {
        title: 'Copyright',
        body: `We respond to copyright infringement claims under our Copyright Policy, which explains how to file a takedown notice and how to file a counter-notice if your content was removed in error.`,
    },
    {
        title: 'Termination',
        body: `You may delete your own posts, or your entire account, at any time from your profile page — both are permanent and can't be undone. We may also suspend or terminate your account for violating these terms, at our discretion, with or without notice — repeat or serious violations (including repeat copyright infringement) will result in permanent termination.`,
    },
    {
        title: 'Disclaimer and limitation of liability',
        body: `The platform is provided "as is" without warranties of any kind. We do not pre-screen user content and are not responsible for content posted by members. To the fullest extent permitted by law, AnimeBoard is not liable for any indirect, incidental, or consequential damages arising from your use of the platform.`,
    },
    {
        title: 'Changes to these terms',
        body: `We may update these terms as the platform evolves. Continued use of the platform after a change means you accept the updated terms.`,
    },
    {
        title: 'Contact',
        body: `Questions about these terms? Reach us at [contact email — add yours here].`,
    },
];

export default function TermsPage() {
    return (
        <LegalPage
            title="Terms of Service"
            lastUpdated="September 7, 2026"
            sections={SECTIONS}
            crossLinks={[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/community-guidelines', label: 'Community Guidelines' },
                { href: '/copyright', label: 'Copyright Policy' },
                { href: '/cookies', label: 'Cookie Policy' },
                { href: '/signup', label: 'Back to sign up' },
            ]}
        />
    );
}
