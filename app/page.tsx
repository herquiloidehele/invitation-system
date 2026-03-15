import { getAllInvitations } from "@/lib/invitations";
import { themes } from "@/lib/themes";
import GalleryClient from "./GalleryClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const invitations = await getAllInvitations();

  const templates = invitations.map((inv) => {
    const theme = themes[inv.template];
    return {
      name: theme?.label ?? inv.template,
      description: theme?.description ?? "",
      slug: inv.slug,
      image: inv.heroImage,
    };
  });

  return <GalleryClient templates={templates} />;
}
