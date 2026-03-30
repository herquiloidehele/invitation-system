import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getThemes } from "@/lib/themes";
import type {
  InvitationData,
  InvitationType,
  ParentsInfo,
  SaveDateStyle,
  SectionImages,
  OurStory,
  TextStyleOverrides,
  CardStyleOverrides,
  GiftCategoryData,
  GiftItemData,
} from "@/lib/types";
import InvitationForm from "../../InvitationForm";
import ExternalInvitationForm from "../../ExternalInvitationForm";

export const dynamic = "force-dynamic";

export default async function EditInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row, themes] = await Promise.all([
    prisma.invitation.findUnique({
      where: { id },
      include: {
        theme: true,
        giftCategories: {
          orderBy: { order: "asc" },
          include: { items: { orderBy: { order: "asc" } } },
        },
      },
    }),
    getThemes(),
  ]);

  if (!row) {
    notFound();
  }

  // Build absolute owner URL
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const ownerUrl = `${proto}://${host}/confirmacoes/${row.ownerToken}`;

  // Convert gift categories from DB rows to serialisable data
  const giftCategories: GiftCategoryData[] = row.giftCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon ?? undefined,
    order: cat.order,
    items: cat.items.map(
      (item): GiftItemData => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        imageUrl: item.imageUrl ?? undefined,
        price: item.price ?? undefined,
        link: item.link ?? undefined,
        order: item.order,
      }),
    ),
  }));

  // Convert Prisma row to InvitationData shape for the form
  const initialData: InvitationData & { id: string } = {
    id: row.id,
    slug: row.slug,
    themeId: row.themeId,
    template: row.theme.name,
    couple: row.couple as unknown as InvitationData["couple"],
    date: row.date as unknown as InvitationData["date"],
    quote: row.quote,
    location: row.location as unknown as InvitationData["location"],
    rsvp: row.rsvp as unknown as InvitationData["rsvp"],
    schedule: row.schedule as unknown as InvitationData["schedule"],
    dressCode: row.dressCode as unknown as InvitationData["dressCode"],
    giftRegistry: row.giftRegistry as unknown as InvitationData["giftRegistry"],
    audio: row.audio as unknown as InvitationData["audio"],
    heroImage: row.heroImage,
    videoUrl: row.videoUrl ?? undefined,
    faqs: (row.faqs as unknown as InvitationData["faqs"]) ?? undefined,
    envelope:
      (row.envelope as unknown as InvitationData["envelope"]) ?? undefined,
    guestGuide:
      (row.guestGuide as unknown as InvitationData["guestGuide"]) ?? undefined,
    saveDateStyle: (row.saveDateStyle as SaveDateStyle | null) ?? "classic",
    cinematicImageUrl: row.cinematicImageUrl ?? undefined,
    sectionImages:
      (row.sectionImages as unknown as SectionImages | null) ?? undefined,
    parents: (row.parents as unknown as ParentsInfo | null) ?? undefined,
    ourStory: (row.ourStory as unknown as OurStory | null) ?? undefined,
    textStyles:
      (row.textStyles as unknown as TextStyleOverrides | null) ?? undefined,
    cardStyles:
      (row.cardStyles as unknown as CardStyleOverrides | null) ?? undefined,
    invitationType: (row.invitationType as InvitationType) ?? "standard",
    externalLink: row.externalLink ?? undefined,
  };

  const isExternal =
    initialData.invitationType === "external_video" ||
    initialData.invitationType === "external_link";

  if (isExternal) {
    return (
      <ExternalInvitationForm
        mode="edit"
        initialData={initialData}
        invitationId={row.id}
        ownerUrl={ownerUrl}
        themes={themes}
      />
    );
  }

  return (
    <InvitationForm
      mode="edit"
      initialData={initialData}
      invitationId={row.id}
      ownerUrl={ownerUrl}
      themes={themes}
      initialGiftCategories={giftCategories}
    />
  );
}
