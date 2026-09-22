import { describe, expect, it } from "vitest";
import { parseSignals } from "@/integrations/audit/signals";

const GOOD_PAGE = `
<!doctype html>
<html>
<head>
  <title>Harbour Table — Waterfront Dining in Cape Town</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Book a table at Harbour Table, Cape Town's waterfront restaurant." />
</head>
<body>
  <h1>Harbour Table</h1>
  <a href="/book">Book a table</a>
  <p>Contact us to reserve your spot.</p>
</body>
</html>`;

const WEAK_PAGE = `
<!doctype html>
<html>
<head></head>
<body>
  <div>Welcome to our restaurant</div>
</body>
</html>`;

describe("parseSignals", () => {
  it("detects strong signals on a well-built page", () => {
    const result = parseSignals(GOOD_PAGE, "https://harbourtable.example");

    expect(result.https).toBe(true);
    expect(result.hasViewportMeta).toBe(true);
    expect(result.title).toContain("Harbour Table");
    expect(result.metaDescription).toContain("Book a table");
    expect(result.h1Count).toBe(1);
    expect(result.hasCta).toBe(true);
    expect(result.hasBookingOrOrderLink).toBe(true);
  });

  it("detects gaps on a weak page without inventing anything not present", () => {
    const result = parseSignals(WEAK_PAGE, "http://example.com");

    expect(result.https).toBe(false);
    expect(result.hasViewportMeta).toBe(false);
    expect(result.title).toBeNull();
    expect(result.metaDescription).toBeNull();
    expect(result.h1Count).toBe(0);
    expect(result.hasCta).toBe(false);
    expect(result.hasBookingOrOrderLink).toBe(false);
  });
});
