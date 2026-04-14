import { getAllInvitations } from "@/lib/invitations";
import { getModels } from "@/lib/models";
import GalleryClient from "./GalleryClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [invitations, models] = await Promise.all([
    getAllInvitations(),
    getModels(),
  ]);

  // Build a quick lookup by model id
  const modelMap = Object.fromEntries(models.map((m) => [m.id, m]));

  const templates = invitations.map((inv) => {
    const model = modelMap[inv.modelId];
    return {
      name: model?.label ?? inv.modelComponent,
      description: model?.description ?? "",
      slug: inv.slug,
      image: inv.heroImage,
    };
  });

  return <GalleryClient templates={templates} />;
}
