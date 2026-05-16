import { prisma } from "@/lib/db";
import { SaveTheDatesClient } from "./SaveTheDatesClient";

export const dynamic = "force-dynamic";

export type SaveTheDateRow = {
  id: string;
  slug: string;
  themeName: string;
  couple: { bride: string; groom: string };
  date: { display: string; iso?: string };
  createdAt: Date | string;
  ownerToken: string;
  rsvpEnabled: boolean;
  isDemo: boolean;
};

export default async function AdminSaveTheDatesPage() {
  const items = await prisma.saveTheDate.findMany({
    orderBy: { createdAt: "desc" },
    include: { theme: { select: { name: true, label: true } } },
  });

  const rows: SaveTheDateRow[] = items.map((item) => {
    const rsvp = item.rsvp as { enabled?: boolean } | null;
    return {
      id: item.id,
      slug: item.slug,
      themeName: item.theme.label,
      couple: item.couple as { bride: string; groom: string },
      date: item.date as { display: string; iso?: string },
      createdAt: item.createdAt,
      ownerToken: item.ownerToken,
      rsvpEnabled: rsvp?.enabled === true,
      isDemo: item.isDemo,
    };
  });

  return <SaveTheDatesClient items={rows} />;
}
