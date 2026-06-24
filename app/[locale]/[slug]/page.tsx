import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { resolveBrowserUiColor } from "@/lib/browser-ui-color";
import { getInvitation } from "@/lib/invitations";
import { getPublicGuestByToken } from "@/lib/guests";
import { getTheme } from "@/lib/themes";
import InvitationView from "./InvitationView";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  resolveInvitationSocialPreview,
} from "@/lib/social-preview";
import { resolveLocale } from "@/i18n/locales";
import {
  SITE_URL,
  buildEventJsonLd,
  buildAbsoluteUrl,
  buildLanguageAlternates,
  buildLocalePath,
  createPublicPageRobotsMetadata,
} from "@/lib/seo";

// ---------------------------------------------------------------------------
// Force dynamic rendering (data comes from the database)
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Dynamic metadata per invitation
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const invitation = await getInvitation(slug);

  if (!invitation) {
    const t = await getTranslations("Metadata");
    return { title: t("invitationNotFound") };
  }

  const { image, title, description } = resolveInvitationSocialPreview(
    invitation,
    SITE_URL,
  );
  const path = buildLocalePath(`/${slug}`, locale);
  const canonical = buildAbsoluteUrl(SITE_URL, path);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(SITE_URL, `/${slug}`),
    },
    robots: createPublicPageRobotsMetadata(invitation.isDemo === true),
    openGraph: {
      title,
      description,
      images: [{ url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
      type: "website",
      url: canonical,
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export async function generateViewport({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Viewport> {
  const { slug } = await params;
  const invitation = await getInvitation(slug);

  if (!invitation) {
    return {
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
    };
  }

  const theme = await getTheme(invitation.template);
  const themeColor = resolveBrowserUiColor({
    envelope: invitation.envelope,
    themeEnvelopeBase: theme?.envelope.base,
    pageBackground: theme?.bg,
  });

  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor,
  };
}

function BrowserUiColorStyle({ color }: { color?: string }) {
  if (!color) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `html,body{background-color:${color};}`,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function InvitationSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{
    g?: string;
    n?: string;
    landingPreview?: string;
    lazyExternalIframe?: string;
    section?: string;
  }>;
}) {
  const { slug } = await params;
  const { g: guestToken, landingPreview, lazyExternalIframe, section } =
    await searchParams;

  const invitation = await getInvitation(slug);

  if (!invitation) {
    notFound();
  }

  const theme = await getTheme(invitation.template);

  if (!theme) {
    notFound();
  }

  const browserUiColor = resolveBrowserUiColor({
    envelope: invitation.envelope,
    themeEnvelopeBase: theme.envelope.base,
    pageBackground: theme.bg,
  });
  const { image, title, description } = resolveInvitationSocialPreview(
    invitation,
    SITE_URL,
  );

  // Look up the personal guest if a token was provided. Silently fall back
  // when the token does not exist, belongs to another invitation, or the
  // feature is disabled — the rest of the page still works normally.
  let guest = undefined;
  if (guestToken && invitation.guestManagementEnabled) {
    const found = await getPublicGuestByToken(guestToken);
    if (found && found.invitationSlug === slug) {
      guest = found;
    }
  }

  return (
    <>
      {invitation.isDemo === true && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              buildEventJsonLd({
                name: title,
                description,
                url: buildAbsoluteUrl(SITE_URL, buildLocalePath(`/${slug}`, "pt")),
                startDate: invitation.date.iso,
                locationName: invitation.location.name,
                locationAddress: invitation.location.address,
                image,
              }),
            ),
          }}
        />
      )}
      <BrowserUiColorStyle color={browserUiColor} />
      <InvitationView
        invitation={{ ...invitation, guest }}
        theme={theme}
        isLandingPreview={landingPreview === "1"}
        lazyExternalIframe={lazyExternalIframe === "1"}
        initialSection={section}
      />
    </>
  );
}
