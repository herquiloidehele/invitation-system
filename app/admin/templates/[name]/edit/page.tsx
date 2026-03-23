import { notFound } from "next/navigation";
import { getTheme } from "@/lib/themes";
import { themeToFormData } from "@/lib/theme-form-data";
import ThemeForm from "@/components/admin/ThemeForm";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function EditTemplatePage({ params }: PageProps) {
  const { name } = await params;

  const theme = await getTheme(name);
  if (!theme) notFound();

  // Look up the DB id so we can pass it to the form for the PUT request
  const row = await prisma.theme.findUnique({
    where: { name },
    select: { id: true },
  });
  if (!row) notFound();

  return (
    <div className="space-y-4">
      <ThemeForm
        mode="edit"
        themeId={row.id}
        initialData={themeToFormData(theme)}
      />
    </div>
  );
}
