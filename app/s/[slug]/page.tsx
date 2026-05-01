import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSaveTheDate } from "@/lib/save-the-date";
import SaveTheDateView from "@/components/save-the-date/SaveTheDateView";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  resolveSaveTheDateSocialPreview,
} from "@/lib/social-preview";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSaveTheDate(slug);

  if (!data) {
    return { title: "Save the Date — Not Found" };
  }

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { image, title, description } = resolveSaveTheDateSocialPreview(
    data,
    siteOrigin,
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
      type: "website",
      url: `${siteOrigin}/s/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function SaveTheDatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getSaveTheDate(slug);

  if (!data) {
    notFound();
  }

  return <SaveTheDateView saveTheDate={data} />;
}
