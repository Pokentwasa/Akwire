import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function OnboardingStep({
  step,
  total,
  title,
  description,
  children,
}: {
  step: number;
  total: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Step {step} of {total}
        </p>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children}
      </Card>
    </main>
  );
}
