"use client";

interface SocialPreviewCardProps {
  /** Resolved image URL — never empty. */
  image: string;
  /** Resolved title — never empty. */
  title: string;
  /** Resolved description — never empty. */
  description: string;
  /** Optional URL string shown under the card. */
  url?: string;
}

/**
 * Pure presentational card that mimics how a link unfurls on
 * WhatsApp / Facebook / iMessage. No data fetching.
 */
export default function SocialPreviewCard({
  image,
  title,
  description,
  url,
}: SocialPreviewCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden max-w-sm">
      <div className="relative aspect-[1200/630] w-full bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3 space-y-1">
        <div className="text-sm font-medium leading-tight line-clamp-2">
          {title}
        </div>
        <div className="text-xs text-muted-foreground line-clamp-2">
          {description}
        </div>
        {url && (
          <div className="text-[11px] text-muted-foreground/70 truncate pt-1">
            {url}
          </div>
        )}
      </div>
    </div>
  );
}
