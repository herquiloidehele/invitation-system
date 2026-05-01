import { getSaveDateThemes } from "@/lib/save-the-date";
import SaveTheDateForm from "../SaveTheDateForm";
import type { SaveTheDateFormData } from "../SaveTheDateForm";

export const dynamic = "force-dynamic";

export default async function NewSaveTheDatePage() {
  const themes = await getSaveDateThemes();

  const initialData: SaveTheDateFormData = {
    slug: "",
    themeId: themes[0]?.id || "",
    couple: { bride: "", groom: "" },
    date: { iso: "", display: "", day: "", month: "", year: "" },
    customMessage: "",
    rsvp: { enabled: false, showEmail: false },
  };

  return (
    <SaveTheDateForm mode="create" initialData={initialData} themes={themes} />
  );
}
