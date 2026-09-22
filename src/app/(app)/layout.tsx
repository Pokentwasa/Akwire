import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/today", label: "Today" },
  { href: "/discover", label: "Discover" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/companies", label: "Companies" },
  { href: "/leads", label: "Leads" },
  { href: "/compliance", label: "Compliance" },
  { href: "/usage", label: "Usage" },
  { href: "/settings", label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-8">
          <span className="font-display text-lg font-semibold text-ink">Yebo</span>
          <nav className="hidden gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm text-ink-muted hover:bg-surface-raised hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Log out
          </Button>
        </form>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
