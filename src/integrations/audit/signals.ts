/**
 * Lightweight regex-based signal extraction from raw HTML — deliberately not
 * a full DOM parser. Every signal here maps directly to a piece of evidence
 * the Opportunity Engine can use (section 13/9); if a signal can't be
 * determined it's left undefined rather than guessed ("unknown means
 * unknown" — section 13). Swap in a real parser later if these regexes
 * prove too brittle on real-world markup; they're intentionally simple for
 * a first pass.
 */

export type WebsiteSignals = {
  https: boolean;
  hasViewportMeta: boolean;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  hasCta: boolean;
  hasBookingOrOrderLink: boolean;
};

const CTA_KEYWORDS = [
  "book now",
  "book a table",
  "order now",
  "order online",
  "reserve",
  "get in touch",
  "contact us",
  "enquire",
  "inquire",
  "request a quote",
  "sign up",
  "get started",
];

const BOOKING_KEYWORDS = ["book", "reserve", "order", "checkout", "menu", "reservation"];

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

export function parseSignals(html: string, url: string): WebsiteSignals {
  const lowerHtml = html.toLowerCase();

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const metaDescMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
  );
  const viewportMatch = /<meta[^>]+name=["']viewport["']/i.test(html);
  const h1Matches = html.match(/<h1[\s>]/gi) ?? [];

  const bodyText = stripTags(lowerHtml);
  const hasCta = CTA_KEYWORDS.some((kw) => bodyText.includes(kw));

  const linkHrefs = [...html.matchAll(/<a[^>]+href=["']([^"']*)["']/gi)].map((m) =>
    m[1].toLowerCase(),
  );
  const linkText = bodyText;
  const hasBookingOrOrderLink =
    linkHrefs.some((href) => BOOKING_KEYWORDS.some((kw) => href.includes(kw))) ||
    BOOKING_KEYWORDS.some((kw) => linkText.includes(kw));

  return {
    https: url.startsWith("https://"),
    hasViewportMeta: viewportMatch,
    title: titleMatch ? titleMatch[1].trim() || null : null,
    metaDescription: metaDescMatch ? metaDescMatch[1].trim() || null : null,
    h1Count: h1Matches.length,
    hasCta,
    hasBookingOrOrderLink,
  };
}
