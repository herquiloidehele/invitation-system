export type LandingModelCardVariant = "gallery" | "bestSeller";

type LandingModelCardVariantConfig = {
  cardClassName: string;
  bodyClassName: string;
  footerClassName: string;
  titleClassName: string;
  descriptionClassName: string;
  toggleClassName: string;
  priceOriginalClassName: string;
  pricePrefixClassName: string;
  priceAmountClassName: string;
  buyButtonClassName: string;
  badgeClassName: string;
};

const VARIANT_CONFIG: Record<
  LandingModelCardVariant,
  LandingModelCardVariantConfig
> = {
  gallery: {
    cardClassName:
      "border border-border bg-card text-foreground shadow-[0_12px_40px_color-mix(in_srgb,var(--foreground)_4.5%,transparent)] hover:shadow-[0_20px_60px_color-mix(in_srgb,var(--foreground)_8%,transparent)]",
    bodyClassName: "flex flex-1 flex-col p-5 pb-0",
    footerClassName: "p-5 pt-2",
    titleClassName:
      "text-lg font-semibold tracking-[-0.02em] text-foreground",
    descriptionClassName: "mt-2 text-sm leading-5 text-muted-foreground",
    toggleClassName: "text-foreground",
    priceOriginalClassName: "text-subtle-foreground/60",
    pricePrefixClassName: "text-muted-foreground",
    priceAmountClassName: "text-foreground",
    buyButtonClassName: "bg-primary text-primary-foreground hover:bg-primary-hover",
    badgeClassName: "bg-background/95 text-primary",
  },
  bestSeller: {
    cardClassName:
      "border border-border bg-card text-foreground shadow-[0_12px_40px_color-mix(in_srgb,var(--foreground)_5%,transparent)] hover:shadow-[0_20px_60px_color-mix(in_srgb,var(--foreground)_8%,transparent)]",
    bodyClassName: "p-6 pb-0",
    footerClassName: "p-6 pt-3",
    titleClassName: "text-xl font-semibold tracking-[-0.02em]",
    descriptionClassName: "mt-3 text-sm leading-6 text-muted-foreground",
    toggleClassName: "text-foreground",
    priceOriginalClassName: "text-subtle-foreground/60",
    pricePrefixClassName: "text-muted-foreground",
    priceAmountClassName: "text-foreground",
    buyButtonClassName: "bg-primary text-primary-foreground hover:bg-primary-hover",
    badgeClassName: "bg-background/95 text-primary",
  },
};

export function getLandingModelCardVariantConfig(
  variant: LandingModelCardVariant,
) {
  return VARIANT_CONFIG[variant];
}
