export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-[#3F4E3F]">
      <span className="h-px w-8 bg-[#3F4E3F]" />
      {children}
    </div>
  );
}
