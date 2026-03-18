import { notFound } from "next/navigation";
import { themes } from "@/lib/themes";
import { MOCK_INVITATION } from "@/lib/mock-invitation";
import type { TemplateName } from "@/lib/types";
import ThemeViewClient from "./ThemeViewClient";

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function ThemeViewPage({ params }: PageProps) {
  const { name } = await params;

  const theme = themes[name as TemplateName];
  if (!theme) notFound();

  // Build the mock invitation with the correct template field so that
  // any template-specific behaviour inside InvitationPage is exercised.
  const invitation = { ...MOCK_INVITATION, template: theme.name };

  return <ThemeViewClient invitation={invitation} theme={theme} />;
}

// Pre-render all 4 known theme pages at build time
export function generateStaticParams() {
  return Object.keys(themes).map((name) => ({ name }));
}
