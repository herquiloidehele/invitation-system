import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { resolveBrowserUiColor } from "@/lib/browser-ui-color";
import { getSaveTheDate } from "@/lib/save-the-date";
import SaveTheDateView from "@/components/save-the-date/SaveTheDateView";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  resolveSaveTheDateSocialPreview,
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

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const data = await getSaveTheDate(slug);

  if (!data) {
    const t = await getTranslations("Metadata");
    return { title: t("saveTheDateNotFound") };
  }

  const { image, title, description } = resolveSaveTheDateSocialPreview(
    data,
    SITE_URL,
  );
  const path = buildLocalePath(`/s/${slug}`, locale);
  const canonical = buildAbsoluteUrl(SITE_URL, path);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(SITE_URL, `/s/${slug}`),
    },
    robots: createPublicPageRobotsMetadata(data.isDemo === true),
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
  const data = await getSaveTheDate(slug);

  if (!data) {
    return {
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
    };
  }

  const themeColor = resolveBrowserUiColor({
    envelope: data.envelope,
    themeEnvelopeBase: data.theme.envelope?.base,
    pageBackground: data.theme.bgColor,
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

export default async function SaveTheDatePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const data = await getSaveTheDate(slug);

  if (!data) {
    notFound();
  }

  const browserUiColor = resolveBrowserUiColor({
    envelope: data.envelope,
    themeEnvelopeBase: data.theme.envelope?.base,
    pageBackground: data.theme.bgColor,
  });

  return (
    <>
      {data.isDemo === true && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              buildEventJsonLd({
                name: `${data.couple.bride} & ${data.couple.groom} — Save the Date`,
                description: `Save the date: ${data.date.display}`,
                url: buildAbsoluteUrl(SITE_URL, buildLocalePath(`/s/${slug}`, "pt")),
                startDate: data.date.iso,
                image:
                  data.bottomHero?.mediaType === "image"
                    ? data.bottomHero.mediaUrl
                    : undefined,
              }),
            ),
          }}
        />
      )}
      <BrowserUiColorStyle color={browserUiColor} />
      <SaveTheDateView saveTheDate={data} />
    </>
  );
}
