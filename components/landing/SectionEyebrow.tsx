export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-primary">
      <span className="h-px w-8 bg-primary" />
      {children}
    </div>
  );
}
