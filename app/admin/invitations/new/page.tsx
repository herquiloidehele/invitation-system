import InvitationForm from "../InvitationForm";
import { themes } from "@/lib/themes";
import type { InvitationData, TemplateName } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ template?: string }>;
}

/** Mirror of InvitationForm's getDefaultFormState so we can pre-fill template. */
function buildDefaultWithTemplate(template: TemplateName): InvitationData {
  return {
    slug: "",
    template,
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
    dressCode: "",
    giftRegistry: { enabled: false, text: "", link: "" },
    audio: { enabled: false, src: "", artist: "", title: "" },
    heroImage: "",
    videoUrl: "",
    faqs: [],
  };
}

export default async function NewInvitationPage({ searchParams }: PageProps) {
  const { template } = await searchParams;

  // Validate that the query param matches a known theme.
  const validTemplate =
    template && themes[template as TemplateName]
      ? (template as TemplateName)
      : null;

  const initialData = validTemplate
    ? buildDefaultWithTemplate(validTemplate)
    : undefined;

  return <InvitationForm mode="create" initialData={initialData} />;
}
