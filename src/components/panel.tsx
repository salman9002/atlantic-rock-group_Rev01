import { type ReactNode } from 'react';

export function Panel({ step, title, children, testId }: { step: string; title: string; children: ReactNode; testId: string }) {
  return (
    <section className="rise rounded-lg border bg-card shadow-sm" data-testid={testId}>
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary font-mono text-xs text-primary-foreground">{step}</span>
        <h2 className="text-[15px] font-bold">{title}</h2>
      </header>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}
