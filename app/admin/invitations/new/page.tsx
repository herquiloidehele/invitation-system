import { getThemes } from "@/lib/themes";
import InvitationForm from "../InvitationForm";
import type { InvitationData } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ template?: string }>;
}

export const dynamic = "force-dynamic";

export default async function NewInvitationPage({ searchParams }: PageProps) {
  const [{ template }, themes] = await Promise.all([searchParams, getThemes()]);

  // If a template name was provided via query param, find the matching theme
  const matchedTheme = template
    ? themes.find((t) => t.name === template)
    : undefined;

  // Pre-build initial data when a specific template was requested
  const initialData: InvitationData | undefined = matchedTheme
    ? {
        slug: "",
        themeId: matchedTheme.id,
        template: matchedTheme.name,
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
        eventType: "wedding",
        location: {
          name: "",
          address: "",
          googleMapsUrl: "",
          wazeUrl: "",
          latitude: undefined,
          longitude: undefined,
          imageUrl: "",
        },
        rsvp: {
          enabled: true,
          deadline: "",
          showEmail: false,
          showDietaryRestrictions: true,
          showCompanion: false,
          inputBackgroundColor: "",
          inputTextColor: "",
          inputPlaceholderColor: "",
          inputBorderColor: "",
        },
        schedule: [],
        dressCode: { enabled: false, text: "" },
        giftRegistry: {
          enabled: false,
          text: "",
          link: "",
          exclusiveSelectionEnabled: false,
        },
        audio: { enabled: false, src: "", artist: "", title: "" },
        heroImage: "",
        videoUrl: "",
        videoPoster: "",
        faqs: [],
        saveDateStyle: "classic",
        cinematicImageUrl: "",
        invitationType: "standard",
        imageSettings: {},
      }
    : undefined;

  return (
    <InvitationForm mode="create" initialData={initialData} themes={themes} />
  );
}
