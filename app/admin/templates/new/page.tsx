import ThemeForm from "@/components/admin/ThemeForm";

export const dynamic = "force-dynamic";

export default function NewTemplatePage() {
  return (
    <div className="space-y-4">
      <ThemeForm mode="create" />
    </div>
  );
}
