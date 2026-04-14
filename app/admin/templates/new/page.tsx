import { getModel } from "@/lib/models";
import { modelToFormData } from "@/lib/theme-form-data";
import ThemeForm from "@/components/admin/ThemeForm";
import type { ModelFormData } from "@/lib/theme-form-data";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ from?: string }>;
}

export default async function NewTemplatePage({ searchParams }: Props) {
  const { from } = await searchParams;

  let initialData: ModelFormData | undefined;

  if (from) {
    const source = await getModel(from);
    if (source) {
      const base = modelToFormData(source);
      initialData = {
        ...base,
        name: "",
        label: `${base.label} (Cópia)`,
      };
    }
  }

  return (
    <div className="space-y-4">
      <ThemeForm mode="create" initialData={initialData} />
    </div>
  );
}
