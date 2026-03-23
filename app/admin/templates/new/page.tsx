import { getTheme } from "@/lib/themes";
import { themeToFormData } from "@/lib/theme-form-data";
import ThemeForm from "@/components/admin/ThemeForm";
import type { ThemeFormData } from "@/lib/theme-form-data";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ from?: string }>;
}

export default async function NewTemplatePage({ searchParams }: Props) {
  const { from } = await searchParams;

  let initialData: ThemeFormData | undefined;

  if (from) {
    const source = await getTheme(from);
    if (source) {
      const base = themeToFormData(source);
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
