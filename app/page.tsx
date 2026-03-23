import { getAllInvitations } from "@/lib/invitations";
import { getThemes } from "@/lib/themes";
import GalleryClient from "./GalleryClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [invitations, themes] = await Promise.all([
    getAllInvitations(),
    getThemes(),
  ]);

  // Build a quick lookup by theme name (slug)
  const themeMap = Object.fromEntries(themes.map((t) => [t.name, t]));

  const templates = invitations.map((inv) => {
    const theme = themeMap[inv.template];
    return {
      name: theme?.label ?? inv.template,
      description: theme?.description ?? "",
      slug: inv.slug,
      image: inv.heroImage,
    };
  });

  return <GalleryClient templates={templates} />;
}
