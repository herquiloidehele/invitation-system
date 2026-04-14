import { getModels } from "@/lib/models";
import { getDefaultStylesForComponent } from "@/components/models";
import InvitationForm from "../InvitationForm";
import type { InvitationData } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ template?: string }>;
}

export const dynamic = "force-dynamic";

export default async function NewInvitationPage({ searchParams }: PageProps) {
  const [{ template }, models] = await Promise.all([searchParams, getModels()]);

  // If a template name was provided via query param, find the matching model
  const matchedModel = template
    ? models.find((m) => m.name === template)
    : undefined;

  // Pre-build initial data when a specific template was requested
  const initialData: InvitationData | undefined = matchedModel
    ? {
        slug: "",
        modelId: matchedModel.id,
        modelComponent: matchedModel.component,
        styles: getDefaultStylesForComponent(matchedModel.component),
        couple: { bride: "", groom: "", monogram: "" },
        date: {
          iso: "",
          display: "",
          dayOfWeek: "",
          time: "",
          day: "",
          month: "",
          year: "",
        },
        quote: "",
        location: {
          name: "",
          address: "",
          googleMapsUrl: "",
          wazeUrl: "",
          latitude: undefined,
          longitude: undefined,
          imageUrl: "",
        },
        rsvp: { enabled: true, deadline: "" },
        schedule: [],
        dressCode: { enabled: false, text: "" },
        giftRegistry: { enabled: false, text: "", link: "" },
        audio: { enabled: false, src: "", artist: "", title: "" },
        heroImage: "",
        videoUrl: "",
        faqs: [],
        cinematicImageUrl: "",
        invitationType: "standard",
        imageSettings: {},
      }
    : undefined;

  return (
    <InvitationForm mode="create" initialData={initialData} models={models} />
  );
}
