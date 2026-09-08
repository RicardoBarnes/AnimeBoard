import LegalPage from '@/components/legal/LegalPage';

const SECTIONS = [
    {
        title: 'The spirit of the docket',
        body: `AnimeBoard exists for good-faith debate about anime — hot takes, rankings, and arguments over who's the GOAT. Disagreement is the whole point. These guidelines exist so the debate stays about the take, not about tearing each other down.`,
    },
    {
        title: 'Only file cases you have the right to file',
        body: `Only upload images you own, made yourself, or are otherwise licensed to share. Don't upload official art, screenshots, or fan work you don't have permission to redistribute if the rights holder objects. If you're not sure, don't upload it. See our Copyright Policy for what happens when this goes wrong.`,
    },
    {
        title: 'No explicit content',
        body: `AnimeBoard is not a platform for sexually explicit or graphic violent content, regardless of the source material. Fan art and screenshots are welcome; explicit content is not.`,
    },
    {
        title: 'Debate the take, not the person',
        body: `Disagree as hard as you want with someone's opinion. Don't harass, threaten, dox, or target another member personally. "This take is terrible" is fine. Attacking the person who made it isn't.`,
    },
    {
        title: 'No spam',
        body: `Don't flood the docket with repetitive posts, off-topic content, scams, or bot-driven activity. One good case beats ten low-effort ones.`,
    },
    {
        title: 'How enforcement works',
        body: `Any member can report a case, exhibit, or testimony entry using the report button on that content. A registrar (admin) reviews each report and can dismiss it, mark it reviewed, or remove the content. Accounts that repeatedly violate these guidelines can be suspended or permanently removed — see our Terms of Service for details.`,
    },
    {
        title: 'Filing an appeal',
        body: `If your content was removed and you think it was a mistake, contact us using the details below and explain why. We review appeals but removal decisions are ultimately at our discretion.`,
    },
];

export default function CommunityGuidelinesPage() {
    return (
        <LegalPage
            title="Community Guidelines"
            lastUpdated="September 7, 2026"
            intro="These are the plain-language rules of the docket. They work alongside — and don't replace — our Terms of Service, which is the binding legal agreement."
            sections={SECTIONS}
            crossLinks={[
                { href: '/terms', label: 'Terms of Service' },
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/copyright', label: 'Copyright Policy' },
                { href: '/cookies', label: 'Cookie Policy' },
                { href: '/signup', label: 'Back to sign up' },
            ]}
        />
    );
}
