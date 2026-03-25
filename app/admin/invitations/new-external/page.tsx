import { getThemes } from "@/lib/themes";
import ExternalInvitationForm from "../ExternalInvitationForm";

export const dynamic = "force-dynamic";

export default async function NewExternalInvitationPage() {
  const themes = await getThemes();

  return <ExternalInvitationForm mode="create" themes={themes} />;
}
