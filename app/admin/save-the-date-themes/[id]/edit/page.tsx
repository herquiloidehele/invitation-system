import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import SaveTheDateThemeForm from "../../SaveTheDateThemeForm";
import type { STDThemeFormData } from "../../SaveTheDateThemeForm";

export const dynamic = "force-dynamic";

export default async function EditSaveTheDateThemePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const theme = await prisma.saveTheDateTheme.findUnique({
    where: { id },
  });

  if (!theme) notFound();

  const initialData: STDThemeFormData = {
    id: theme.id,
    name: theme.name,
    label: theme.label,
    description: theme.description,
    heartColor: theme.heartColor,
    heartGlitterColors: theme.heartGlitterColors as string[],
    rsvpButtonBgColor: theme.rsvpButtonBgColor,
    heartTextureUrl: theme.heartTextureUrl || "",
    bgColor: theme.bgColor,
    titleFont: theme.titleFont,
    coupleFont: theme.coupleFont,
    dateFont: theme.dateFont,
    textColor: theme.textColor,
    confettiColors: theme.confettiColors as string[],
    envelope: theme.envelope as { base: string; topFlap: string; bottomFlap: string } | null,
  };

  return (
    <SaveTheDateThemeForm mode="edit" initialData={initialData} />
  );
}
