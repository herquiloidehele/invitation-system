import { ChevronDown } from "lucide-react";

export function ProductDetailsAccordions({
  items,
}: {
  items: Array<{ title: string; body: string }>;
}) {
  return (
    <div className="mt-8 border-t border-border/80">
      {items.map((item) => (
        <details key={item.title} className="group border-b border-border/80">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
            <span>{item.title}</span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="pb-5 pr-8 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
            {item.body}
          </p>
        </details>
      ))}
    </div>
  );
}
