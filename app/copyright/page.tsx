import LegalPage from '@/components/legal/LegalPage';

const SECTIONS = [
    {
        title: 'Our commitment',
        body: `AnimeBoard respects the intellectual property rights of others and expects members to do the same. We respond to clear, well-formed notices of alleged copyright infringement in accordance with the U.S. Digital Millennium Copyright Act (DMCA) and equivalent laws elsewhere.`,
    },
    {
        title: 'Filing a takedown notice',
        body: `If you believe content on AnimeBoard infringes your copyright, use the "Report" button on that case, image, or comment (choose "Copyright infringement"), or send a written notice to our designated agent below that includes:
— A description of the copyrighted work you claim has been infringed.
— The URL (or other specific location) of the material you claim is infringing.
— Your name, address, phone number, and email address.
— A statement that you have a good-faith belief that the use is not authorized by the copyright owner, its agent, or the law.
— A statement, made under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorized to act on their behalf.
— Your physical or electronic signature.`,
    },
    {
        title: 'Designated agent',
        body: `[Agent name / company name]
Email: [dmca-contact-email — add yours here]
Mailing address: [mailing address — add yours here]

Note for the site owner: register this agent with the U.S. Copyright Office's Designated Agent Directory (copyright.gov/dmca-directory) — without a registered agent, this policy alone does not qualify the platform for DMCA safe-harbor protection.`,
    },
    {
        title: 'What happens next',
        body: `On receiving a valid notice, we will remove or disable access to the reported content and notify the member who posted it. Repeat infringers will have their accounts permanently terminated.`,
    },
    {
        title: 'Filing a counter-notice',
        body: `If your content was removed and you believe this was a mistake or misidentification, you may submit a counter-notice to our designated agent that includes:
— Identification of the removed material and where it appeared before removal.
— A statement, under penalty of perjury, that you have a good-faith belief the material was removed as a result of mistake or misidentification.
— Your name, address, phone number, and a statement that you consent to the jurisdiction of the federal court in your district (or, if outside the US, an appropriate judicial district).
— Your physical or electronic signature.

We may reinstate the content after a valid counter-notice unless the original complainant files a court action.`,
    },
    {
        title: 'Repeat infringers',
        body: `Accounts that receive multiple valid infringement notices will be permanently suspended, in accordance with our Terms of Service.`,
    },
];

export default function CopyrightPage() {
    return (
        <LegalPage
            title="Copyright Policy"
            lastUpdated="September 7, 2026"
            sections={SECTIONS}
            crossLinks={[
                { href: '/terms', label: 'Terms of Service' },
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/community-guidelines', label: 'Community Guidelines' },
                { href: '/cookies', label: 'Cookie Policy' },
                { href: '/signup', label: 'Back to sign up' },
            ]}
        />
    );
}
