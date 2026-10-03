import type { CSSProperties, ReactNode } from "react";

import type { RsvpPageTokens } from "@/lib/rsvp-page-style";

interface RsvpPageShellProps {
  tokens: RsvpPageTokens;
  eyebrow: string;
  title: string;
  dateDisplay?: string;
  monogram?: string;
  /** Admin preview: fit the pane instead of the viewport. */
  preview?: boolean;
  children: ReactNode;
}

interface HeaderContent {
  eyebrow?: string;
  title: string;
  date?: string;
  monogram?: string;
  imageUrl?: string;
}

function cardStyle(tokens: RsvpPageTokens): CSSProperties {
  return {
    backgroundColor: tokens.colors.cardBg,
    border: tokens.cardBorder ? `1px solid ${tokens.colors.border}` : "none",
    borderRadius: tokens.radius.card,
    boxShadow: tokens.shadow,
  };
}

function BannerImage({
  url,
  className,
  style,
}: {
  url: string;
  className: string;
  style?: CSSProperties;
}) {
  // Host-uploaded S3 image of unknown size; next/image adds nothing here.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={className} style={style} />;
}

function Ornament({ color }: { color: string }) {
  return (
    <div aria-hidden className="my-6 flex items-center justify-center gap-3">
      <span className="h-px w-12" style={{ backgroundColor: color, opacity: 0.6 }} />
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="h-px w-12" style={{ backgroundColor: color, opacity: 0.6 }} />
    </div>
  );
}

function ClassicLayout({
  tokens,
  header,
  children,
}: {
  tokens: RsvpPageTokens;
  header: HeaderContent;
  children: ReactNode;
}) {
  const { colors, fonts } = tokens;
  return (
    <>
      {header.imageUrl && (
        <BannerImage url={header.imageUrl} className="h-52 w-full object-cover sm:h-64" />
      )}
      <header
        className="px-5 py-8 text-center"
        style={{
          backgroundColor: colors.cardBg,
          borderBottom: tokens.cardBorder ? `1px solid ${colors.border}` : "none",
        }}
      >
        {header.monogram && (
          <p
            className="mb-3 text-sm tracking-[0.3em]"
            style={{ color: colors.accent, fontFamily: fonts.title }}
          >
            {header.monogram}
          </p>
        )}
        {header.eyebrow && (
          <p
            className="text-xs tracking-[0.15em] uppercase mb-3"
            style={{ color: colors.muted }}
          >
            {header.eyebrow}
          </p>
        )}
        <h1
          className="text-3xl font-light tracking-tight"
          style={{ color: colors.title, fontFamily: fonts.title }}
        >
          {header.title}
        </h1>
        {header.date && (
          <p className="mt-2 text-sm" style={{ color: colors.text }}>
            {header.date}
          </p>
        )}
      </header>
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md overflow-hidden" style={cardStyle(tokens)}>
          {children}
        </div>
      </main>
    </>
  );
}

function MinimalLayout({
  tokens,
  header,
  children,
}: {
  tokens: RsvpPageTokens;
  header: HeaderContent;
  children: ReactNode;
}) {
  const { colors, fonts } = tokens;
  return (
    <main className="flex-1 px-4 pt-12 pb-16">
      <div className="mx-auto w-full max-w-md">
        {header.imageUrl && (
          <BannerImage
            url={header.imageUrl}
            className="mb-8 aspect-[3/2] w-full object-cover"
            style={{ borderRadius: tokens.radius.card }}
          />
        )}
        <header className="px-6 text-center">
          {header.monogram && (
            <p
              className="mb-4 text-sm tracking-[0.3em]"
              style={{ color: colors.accent, fontFamily: fonts.title }}
            >
              {header.monogram}
            </p>
          )}
          {header.eyebrow && (
            <p
              className="mb-3 text-xs uppercase tracking-[0.15em]"
              style={{ color: colors.muted }}
            >
              {header.eyebrow}
            </p>
          )}
          <h1
            className="text-3xl font-light tracking-tight"
            style={{ color: colors.title, fontFamily: fonts.title }}
          >
            {header.title}
          </h1>
          {header.date && (
            <p className="mt-2 text-sm" style={{ color: colors.text }}>
              {header.date}
            </p>
          )}
        </header>
        <div className="mx-6 mt-8 h-px" style={{ backgroundColor: colors.border }} />
        {children}
      </div>
    </main>
  );
}

function EditorialLayout({
  tokens,
  header,
  children,
}: {
  tokens: RsvpPageTokens;
  header: HeaderContent;
  children: ReactNode;
}) {
  const { colors, fonts } = tokens;
  return (
    <>
      {header.imageUrl && (
        <BannerImage url={header.imageUrl} className="h-56 w-full object-cover sm:h-72" />
      )}
      <header className="px-6 pt-14 pb-10 text-center">
        {header.monogram && (
          <p
            className="mb-6 text-lg tracking-[0.3em]"
            style={{ color: colors.accent, fontFamily: fonts.title }}
          >
            {header.monogram}
          </p>
        )}
        {header.eyebrow && (
          <p
            className="mb-4 text-[11px] uppercase tracking-[0.3em]"
            style={{ color: colors.muted }}
          >
            {header.eyebrow}
          </p>
        )}
        <h1
          className="text-4xl leading-tight sm:text-5xl"
          style={{ color: colors.title, fontFamily: fonts.title }}
        >
          {header.title}
        </h1>
        <Ornament color={colors.accent} />
        {header.date && (
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.text }}>
            {header.date}
          </p>
        )}
      </header>
      <main className="flex-1 flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md overflow-hidden" style={cardStyle(tokens)}>
          {children}
        </div>
      </main>
    </>
  );
}

export default function RsvpPageShell({
  tokens,
  eyebrow,
  title,
  dateDisplay,
  monogram,
  preview = false,
  children,
}: RsvpPageShellProps) {
  const { colors, fonts, backgroundImageUrl } = tokens;
  const header: HeaderContent = {
    eyebrow: tokens.header.showEyebrow ? eyebrow : undefined,
    title,
    date: tokens.header.showDate && dateDisplay ? dateDisplay : undefined,
    monogram:
      tokens.header.showMonogram && monogram?.trim() ? monogram.trim() : undefined,
    imageUrl: tokens.header.imageUrl,
  };
  const Layout =
    tokens.layout === "minimal"
      ? MinimalLayout
      : tokens.layout === "editorial"
        ? EditorialLayout
        : ClassicLayout;

  return (
    <div
      className={`${preview ? "min-h-full" : "min-h-dvh"} flex flex-col`}
      style={{
        backgroundColor: colors.pageBg,
        backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        backgroundSize: backgroundImageUrl ? "cover" : undefined,
        backgroundPosition: backgroundImageUrl ? "center" : undefined,
        backgroundAttachment: backgroundImageUrl && !preview ? "fixed" : undefined,
        fontFamily: fonts.body,
      }}
    >
      <Layout tokens={tokens} header={header}>
        {children}
      </Layout>
    </div>
  );
}
