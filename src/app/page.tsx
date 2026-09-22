import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-accent">
        Your AI business development manager
      </p>
      <h1 className="max-w-2xl font-display text-4xl font-semibold text-ink sm:text-5xl">
        Yebo finds the companies worth pursuing — and tells you why.
      </h1>
      <p className="max-w-xl text-balance text-ink-muted">
        Tell Yebo what you sell and who you want to work with. Yebo finds the
        opportunities, researches them, and helps you turn them into pipeline.
      </p>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/demo">See it in action</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/signup">Get started</Link>
        </Button>
      </div>
      <Link href="/login" className="text-sm text-ink-muted hover:text-ink">
        Already have an account? Log in
      </Link>
    </main>
  );
}
