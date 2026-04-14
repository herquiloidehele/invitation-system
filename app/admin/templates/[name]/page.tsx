import { notFound } from "next/navigation";
import { getModel } from "@/lib/models";
import { MOCK_INVITATION } from "@/lib/mock-invitation";
import { getDefaultStylesForComponent } from "@/components/models";
import ThemeViewClient from "./ThemeViewClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function ThemeViewPage({ params }: PageProps) {
  const { name } = await params;

  const model = await getModel(name);
  if (!model) notFound();

  // Build the mock invitation with the correct model fields so that
  // any model-specific behaviour inside the model component is exercised.
  const invitation = {
    ...MOCK_INVITATION,
    modelId: model.id,
    modelComponent: model.component,
    styles: getDefaultStylesForComponent(model.component),
  };

  return <ThemeViewClient invitation={invitation} model={model} />;
}
