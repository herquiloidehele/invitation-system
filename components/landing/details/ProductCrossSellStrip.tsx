"use client";

import Image from "next/image";

export type CrossSellItem = {
  id: string;
  title: string;
  href: string;
  imageUrl: string | null;
  price: { amount: string } | null;
};

export function ProductCrossSellStrip({
  items,
  heading,
}: {
  items: CrossSellItem[];
  heading: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="border-t border-border/70 py-10 lg:py-14">
      <div className="mx-auto max-w-[94rem] px-4 sm:px-8 lg:px-10">
        <h2 className="text-lg font-medium tracking-[-0.02em] text-foreground lg:text-xl">
          {heading}
        </h2>

        <ul className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <li
              key={item.id}
              className="w-44 shrink-0 snap-start sm:w-52 lg:w-60"
            >
              <a
                href={item.href}
                className="group block rounded-[1.25rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="relative aspect-4/5 overflow-hidden rounded-[1.25rem] bg-surface-warm outline outline-1 -outline-offset-1 outline-black/10">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1024px) 240px, 176px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <p className="mt-2.5 text-[13px] font-medium leading-snug text-foreground [text-wrap:balance]">
                  {item.title}
                </p>
                {item.price ? (
                  <p className="mt-1 text-[12px] tabular-nums text-muted-foreground">
                    {item.price.amount}
                  </p>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
