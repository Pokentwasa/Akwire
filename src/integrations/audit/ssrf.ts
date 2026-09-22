import { lookup } from "node:dns/promises";

/**
 * Blocks destinations that point at private, loopback, link-local, or
 * otherwise non-public address space — including cloud metadata endpoints
 * (169.254.169.254) which is the classic SSRF-to-credential-theft path.
 * This is a best-effort, pre-connect check (resolve then validate); it does
 * not eliminate DNS-rebinding TOCTOU risk, which would need pinning the
 * resolved IP through the actual TCP connection. Acceptable for the V1
 * prototype scope (section 32/42 of the brief); revisit before this fetches
 * anything an attacker could point at their own DNS.
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return null;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function inRange(int: number, base: string, bits: number): boolean {
  const baseInt = ipv4ToInt(base);
  if (baseInt === null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (int & mask) === (baseInt & mask);
}

const PRIVATE_V4_RANGES: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // link-local, incl. cloud metadata (169.254.169.254)
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4], // multicast
];

function isPrivateIPv4(ip: string): boolean {
  const int = ipv4ToInt(ip);
  if (int === null) return true; // fail closed on anything unparseable
  return PRIVATE_V4_RANGES.some(([base, bits]) => inRange(int, base, bits));
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" || // loopback
    normalized === "::" ||
    normalized.startsWith("fe80:") || // link-local
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") || // unique local
    normalized.startsWith("::ffff:") // IPv4-mapped — validate the embedded v4
  );
}

export function isPrivateAddress(ip: string, family: 4 | 6): boolean {
  if (family === 4) return isPrivateIPv4(ip);
  if (ip.toLowerCase().startsWith("::ffff:")) {
    return isPrivateIPv4(ip.slice(7));
  }
  return isPrivateIPv6(ip);
}

export class SsrfBlockedError extends Error {
  constructor(url: string, reason: string) {
    super(`Refusing to fetch "${url}": ${reason}`);
    this.name = "SsrfBlockedError";
  }
}

export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError(rawUrl, "not a valid URL");
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new SsrfBlockedError(rawUrl, `protocol "${url.protocol}" is not allowed`);
  }

  if (url.username || url.password) {
    throw new SsrfBlockedError(rawUrl, "credentials in the URL are not allowed");
  }

  const hostname = url.hostname;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new SsrfBlockedError(rawUrl, "localhost is not allowed");
  }

  let resolved: { address: string; family: number };
  try {
    resolved = await lookup(hostname);
  } catch {
    throw new SsrfBlockedError(rawUrl, "hostname did not resolve");
  }

  if (isPrivateAddress(resolved.address, resolved.family as 4 | 6)) {
    throw new SsrfBlockedError(rawUrl, "resolves to a private or reserved address");
  }

  return url;
}
