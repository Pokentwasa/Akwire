import { describe, expect, it } from "vitest";
import { assertPublicUrl, isPrivateAddress, SsrfBlockedError } from "@/integrations/audit/ssrf";

describe("isPrivateAddress", () => {
  it.each([
    ["127.0.0.1", 4],
    ["10.0.0.5", 4],
    ["172.16.4.1", 4],
    ["192.168.1.1", 4],
    ["169.254.169.254", 4], // cloud metadata endpoint
    ["0.0.0.0", 4],
  ] as const)("flags %s as private", (ip, family) => {
    expect(isPrivateAddress(ip, family)).toBe(true);
  });

  it.each([
    ["8.8.8.8", 4],
    ["1.1.1.1", 4],
    ["93.184.216.34", 4],
  ] as const)("does not flag %s as private", (ip, family) => {
    expect(isPrivateAddress(ip, family)).toBe(false);
  });

  it("flags IPv6 loopback and link-local as private", () => {
    expect(isPrivateAddress("::1", 6)).toBe(true);
    expect(isPrivateAddress("fe80::1", 6)).toBe(true);
  });
});

describe("assertPublicUrl", () => {
  it("rejects localhost without a DNS lookup", async () => {
    await expect(assertPublicUrl("http://localhost:3000")).rejects.toThrow(SsrfBlockedError);
  });

  it("rejects a direct private IP literal", async () => {
    await expect(assertPublicUrl("http://127.0.0.1/")).rejects.toThrow(SsrfBlockedError);
    await expect(assertPublicUrl("http://169.254.169.254/latest/meta-data")).rejects.toThrow(
      SsrfBlockedError,
    );
  });

  it("rejects non-http(s) protocols", async () => {
    await expect(assertPublicUrl("file:///etc/passwd")).rejects.toThrow(SsrfBlockedError);
    await expect(assertPublicUrl("ftp://example.com")).rejects.toThrow(SsrfBlockedError);
  });

  it("rejects credentials embedded in the URL", async () => {
    await expect(assertPublicUrl("http://user:pass@127.0.0.1/")).rejects.toThrow(SsrfBlockedError);
  });

  it("rejects an unparseable URL", async () => {
    await expect(assertPublicUrl("not a url")).rejects.toThrow(SsrfBlockedError);
  });
});
