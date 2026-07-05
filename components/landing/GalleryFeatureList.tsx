import { Check } from "lucide-react";

export function GalleryFeatureList({ features }: { features: string[] }) {
  if (features.length === 0) return null;

  return (
    <ul className="mx-auto mt-5 grid w-fit max-w-2xl grid-cols-1 gap-x-5 gap-y-2 text-left text-sm text-muted-foreground min-[420px]:grid-cols-2 sm:flex sm:flex-wrap sm:justify-center">
      {features.map((feature) => (
        <li key={feature} className="flex items-center gap-1.5">
          <Check
            aria-hidden="true"
            strokeWidth={2.25}
            className="size-3.5 shrink-0 text-primary"
          />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}
