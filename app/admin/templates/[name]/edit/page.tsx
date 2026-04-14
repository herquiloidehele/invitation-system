import { notFound } from "next/navigation";
import { getModel } from "@/lib/models";
import { modelToFormData } from "@/lib/theme-form-data";
import ThemeForm from "@/components/admin/ThemeForm";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function EditTemplatePage({ params }: PageProps) {
  const { name } = await params;

  const model = await getModel(name);
  if (!model) notFound();

  // Look up the DB id so we can pass it to the form for the PUT request
  const row = await prisma.model.findUnique({
    where: { name },
    select: { id: true },
  });
  if (!row) notFound();

  return (
    <div className="space-y-4">
      <ThemeForm
        mode="edit"
        modelId={row.id}
        initialData={modelToFormData(model)}
      />
    </div>
  );
}
