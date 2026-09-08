// Formats a post's id + created_at into a docket-style reference code, e.g.
// "AB-260906-4F2A". Purely cosmetic (not a DB column) — encodes real
// information (creation date, a stable per-post code) rather than decorating.
export function caseNumber(id: string, createdAt: string): string {
    const d = new Date(createdAt);
    const yy = String(d.getUTCFullYear()).slice(2);
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const suffix = id.replace(/-/g, '').slice(0, 4).toUpperCase();
    return `AB-${yy}${mm}${dd}-${suffix}`;
}
