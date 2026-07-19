import type { Metadata, Viewport } from "next";
import ReactDOM from "react-dom";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import {
  isValidCoverVideoItem,
  shouldRenderVideoSequenceCover,
} from "@/lib/cover-videos";
import { shouldUseBackgroundAudio } from "@/lib/invitation-audio";
import { resolveBrowserUiColor } from "@/lib/browser-ui-color";
import { getInvitation } from "@/lib/invitations";
import {
  getInvitationLocaleRedirectPath,
  getInvitationSearchParam,
  type InvitationSearchParams,
} from "@/lib/invitation-language-routing";
import {
  getEffectiveInvitationLocales,
  localizeInvitation,
} from "@/lib/invitation-translations";
import { getPublicGuestByToken } from "@/lib/guests";
import { getTheme } from "@/lib/themes";
import InvitationView from "./InvitationView";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  resolveInvitationSocialPreview,
} from "@/lib/social-preview";
import { resolveLocale, SUPPORTED_LOCALES } from "@/i18n/locales";
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
  const sourceInvitation = await getInvitation(slug);

  if (!sourceInvitation) {
    const t = await getTranslations("Metadata");
    return { title: t("invitationNotFound") };
  }

  const effectiveLocales =
    sourceInvitation.invitationType === "standard"
      ? getEffectiveInvitationLocales(sourceInvitation)
      : SUPPORTED_LOCALES;
  const metadataLocale = effectiveLocales.includes(locale) ? locale : "pt";
  const invitation =
    sourceInvitation.invitationType === "standard"
      ? localizeInvitation(sourceInvitation, metadataLocale)
      : sourceInvitation;
  const { image, title, description } = resolveInvitationSocialPreview(
    invitation,
    SITE_URL,
  );
  const path = buildLocalePath(`/${slug}`, metadataLocale);
  const canonical = buildAbsoluteUrl(SITE_URL, path);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(
        SITE_URL,
        `/${slug}`,
        effectiveLocales,
      ),
    },
    robots: createPublicPageRobotsMetadata(invitation.isDemo === true),
    openGraph: {
      title,
      description,
      images: [{ url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
      type: "website",
      url: canonical,
      locale: metadataLocale,
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
  searchParams: Promise<InvitationSearchParams>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const resolvedSearchParams = await searchParams;
  const guestToken = getInvitationSearchParam(resolvedSearchParams, "g");
  const landingPreview = getInvitationSearchParam(
    resolvedSearchParams,
    "landingPreview",
  );
  const lazyExternalIframe = getInvitationSearchParam(
    resolvedSearchParams,
    "lazyExternalIframe",
  );
  const section = getInvitationSearchParam(resolvedSearchParams, "section");

  const sourceInvitation = await getInvitation(slug);

  if (!sourceInvitation) {
    notFound();
  }

  const pathname = buildLocalePath(`/${slug}`, locale);
  const redirectPath = getInvitationLocaleRedirectPath(
    sourceInvitation,
    locale,
    pathname,
    resolvedSearchParams,
  );
  if (redirectPath) redirect(redirectPath);

  const invitation =
    sourceInvitation.invitationType === "standard"
      ? localizeInvitation(sourceInvitation, locale)
      : sourceInvitation;
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

  // Warm the first cover clip during initial HTML parse — before the (heavy)
  // client bundle hydrates. VideoSequenceCover is a client component, so its
  // <video> element, and therefore the clip download, otherwise can't start
  // until React hydrates; on a mobile network that's several seconds of dead
  // time before the first video even begins loading. A <link rel="preload"> is
  // emitted into <head> immediately and is NOT subject to the media-element
  // preload throttling mobile browsers apply, so the bytes start downloading
  // right away and the tap plays from a warm buffer.
  if (shouldRenderVideoSequenceCover(invitation.coverVideos)) {
    const firstClip = invitation.coverVideos?.items.find(isValidCoverVideoItem);
    if (firstClip) {
      try {
        ReactDOM.preconnect(new URL(firstClip.url).origin);
      } catch {
        /* non-absolute URL — skip preconnect */
      }
      ReactDOM.preload(firstClip.url, { as: "video", fetchPriority: "high" });
      if (firstClip.poster) {
        ReactDOM.preload(firstClip.poster, {
          as: "image",
          fetchPriority: "high",
        });
      }
    }
  }

  // Pre-download the background music during HTML parse too, so it plays the
  // instant the guest opens the invitation instead of only starting to download
  // on the tap. Applies to every invitation with background audio (envelope and
  // video covers alike). Left at the default preload priority so it never
  // outranks the first cover clip on video-cover invitations — the clip is what
  // the guest sees and taps; the music only needs to be ready by the handoff.
  if (shouldUseBackgroundAudio(invitation.invitationType, invitation.audio)) {
    const audioSrc = invitation.audio.src;
    if (audioSrc) {
      try {
        ReactDOM.preconnect(new URL(audioSrc).origin);
      } catch {
        /* non-absolute URL — skip preconnect */
      }
      ReactDOM.preload(audioSrc, { as: "audio" });
    }
  }

  // Look up the personal guest if a token was provided. Silently fall back
  // when the token does not exist, belongs to another invitation, or the
  // feature is disabled — the rest of the page still works normally.
  let guest = undefined;
  if (guestToken && sourceInvitation.guestManagementEnabled) {
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
                url: buildAbsoluteUrl(
                  SITE_URL,
                  buildLocalePath(`/${slug}`, locale),
                ),
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
