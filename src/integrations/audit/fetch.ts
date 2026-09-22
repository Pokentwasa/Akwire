import { assertPublicUrl, SsrfBlockedError } from "@/integrations/audit/ssrf";

const MAX_REDIRECTS = 5;
const MAX_BYTES = 3 * 1024 * 1024; // 3MB — plenty for HTML, refuses giant payloads
const TIMEOUT_MS = 10_000;

export type FetchedPage = {
  html: string;
  finalUrl: string;
  status: number;
};

/**
 * Fetches a page for website intelligence (section 13 of the brief) with
 * SSRF guards, a bounded redirect chain (re-validated at every hop), a
 * response-size cap, and a timeout. Never call plain fetch() on a
 * user-supplied URL from server code — go through this.
 */
export async function safeFetchHtml(rawUrl: string): Promise<FetchedPage> {
  let currentUrl = rawUrl;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    const url = await assertPublicUrl(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "Yebo-Audit/1.0 (+https://yebo.example)" },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new SsrfBlockedError(currentUrl, "redirect with no Location header");
      }
      currentUrl = new URL(location, url).toString();
      continue;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return { html: "", finalUrl: url.toString(), status: response.status };
    }

    const reader = response.body?.getReader();
    if (!reader) return { html: "", finalUrl: url.toString(), status: response.status };

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        throw new SsrfBlockedError(currentUrl, "response exceeded the size limit");
      }
      chunks.push(value);
    }

    const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
    return { html, finalUrl: url.toString(), status: response.status };
  }

  throw new SsrfBlockedError(rawUrl, "too many redirects");
}
