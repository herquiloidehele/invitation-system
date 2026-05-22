import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSaveDateThemes } from "@/lib/save-the-date";
import type { SocialPreview, TextStyleOverrides } from "@/lib/types";
import SaveTheDateForm from "../../SaveTheDateForm";
import type { SaveTheDateFormData } from "../../SaveTheDateForm";

export const dynamic = "force-dynamic";

export default async function EditSaveTheDatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const themes = await getSaveDateThemes();

  const item = await prisma.saveTheDate.findUnique({
    where: { id },
    include: { theme: true },
  });

  if (!item) notFound();

  const couple = item.couple as { bride: string; groom: string };
  const date = item.date as {
    iso: string;
    display: string;
    day: string;
    month: string;
    year: string;
  };

  const envelope = item.envelope as {
    base?: string;
    topFlap?: string;
    bottomFlap?: string;
    shimmer?: boolean;
  } | null;

  const textStyles = item.textStyles as TextStyleOverrides | null;
  const rsvp = item.rsvp as { enabled: boolean; deadline?: string } | null;
  const audio = item.audio as {
    enabled: boolean;
    src: string;
    artist: string;
    title: string;
  } | null;

  const bottomHero = item.bottomHero as {
    enabled: boolean;
    mediaUrl: string;
    mediaType: "image" | "video";
    title: string;
    description: string;
  } | null;

  const initialData: SaveTheDateFormData = {
    id: item.id,
    slug: item.slug,
    themeId: item.themeId,
    couple,
    date,
    customMessage: item.customMessage || "",
    envelope: envelope || undefined,
    textStyles: textStyles || undefined,
    rsvp: rsvp || undefined,
    audio: audio || undefined,
    bottomHero: bottomHero || undefined,
    socialPreview:
      (item.socialPreview as SocialPreview | null) ?? undefined,
    isDemo: item.isDemo,
    ownerToken: item.ownerToken,
    priceFromCents: item.priceFromCents,
    currency: item.currency,
    landingModelName: item.landingModelName,
    landingImageUrl: item.landingImageUrl,
    landingDescription: item.landingDescription,
  };

  return (
    <SaveTheDateForm mode="edit" initialData={initialData} themes={themes} />
  );
}
