import { getThemes } from "@/lib/themes";
import InvitationForm from "../InvitationForm";
import type { InvitationData } from "@/lib/types";
import { defaultInvitationDate } from "@/lib/invitation-default-date";

export const dynamic = "force-dynamic";

/**
 * Create an AI invitation. Same form as the standard create (the generated
 * bundle reads all of this content from props), but `variant="ai"` hides the
 * design-only controls and `renderMode: "ai"` is carried through the payload so
 * the row is created in AI mode and the save lands in the builder.
 *
 * The theme picker stays visible here: the create API requires a themeId, and
 * the theme seeds the platform-owned envelope/cover that AI invitations keep.
 */
export default async function NewAiInvitationPage() {
  const themes = await getThemes();

  const initialData = {
    slug: "",
    themeId: themes[0]?.id ?? "",
    template: themes[0]?.name ?? "",
    renderMode: "ai",
    couple: { bride: "", groom: "", monogram: "" },
    date: defaultInvitationDate(),
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
      ctaAction: "rsvp",
      deadline: "",
      showEmail: false,
      showDietaryRestrictions: true,
      showCompanion: false,
      inputBackgroundColor: "",
      inputTextColor: "",
      inputPlaceholderColor: "",
      inputBorderColor: "",
      inputStyle: "default",
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
    heroVideoMuted: true,
    faqs: [],
    saveDateStyle: "classic",
    cinematicImageUrl: "",
    saveTheDateBackgroundImageUrl: "",
    invitationType: "standard",
    imageSettings: {},
  } as unknown as InvitationData;

  return (
    <InvitationForm
      mode="create"
      variant="ai"
      initialData={initialData}
      themes={themes}
    />
  );
}
