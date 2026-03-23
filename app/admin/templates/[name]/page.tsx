import { notFound } from "next/navigation";
import { getTheme } from "@/lib/themes";
import { MOCK_INVITATION } from "@/lib/mock-invitation";
import ThemeViewClient from "./ThemeViewClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function ThemeViewPage({ params }: PageProps) {
  const { name } = await params;

  const theme = await getTheme(name);
  if (!theme) notFound();

  // Build the mock invitation with the correct template field so that
  // any template-specific behaviour inside InvitationPage is exercised.
  const invitation = {
    ...MOCK_INVITATION,
    themeId: theme.id,
    template: theme.name,
  };

  return <ThemeViewClient invitation={invitation} theme={theme} />;
}
