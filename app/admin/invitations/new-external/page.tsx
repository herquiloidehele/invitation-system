import { getModels } from "@/lib/models";
import ExternalInvitationForm from "../ExternalInvitationForm";

export const dynamic = "force-dynamic";

export default async function NewExternalInvitationPage() {
  const models = await getModels();

  return <ExternalInvitationForm mode="create" models={models} />;
}
