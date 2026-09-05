import type { InvitationData } from "@/lib/types";

/** Northern-hemisphere season from an ISO date, for palette grounding. */
function season(iso?: string): string {
  if (!iso) return "unknown";
  const m = new Date(iso).getMonth();
  if (Number.isNaN(m)) return "unknown";
  if (m <= 1 || m === 11) return "winter";
  if (m <= 4) return "spring";
  if (m <= 7) return "summer";
  return "autumn";
}

/**
 * A compact, factual brief of the invitation's real configuration, injected
 * into the agent's build prompt (and the directions proposal) so it designs for
 * the correct feature set, grounds the palette in reality, and binds to real
 * content instead of inventing it.
 *
 * Field shapes are deliberate: `ourStory` is an object `{ enabled, ... }`, not
 * an array, and `dressCode.title` is optional over the base `text`.
 */
export function buildInvitationBrief(invitation: InvitationData): string {
  const onOff = (v: unknown) => (v ? "on" : "off");
  const count = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  const couple = invitation.couple;
  const locales = (invitation.enabledLocales ?? ["pt"]).join(", ");
  const iso = invitation.date?.iso;

  return [
    `Invitation config (bind content to props.invitation — do not copy these values into code):`,
    `- couple: ${couple?.bride} & ${couple?.groom} (event: ${invitation.eventType ?? "wedding"})`,
    `- date: ${invitation.date?.display ?? "unknown"} (season: ${season(iso)})`,
    `- venue: ${invitation.location?.name ?? "unknown"}${
      invitation.location?.address ? ` — ${invitation.location.address}` : ""
    }`,
    `- dress code: ${
      invitation.dressCode?.enabled
        ? invitation.dressCode.title || invitation.dressCode.text || "yes"
        : "none"
    }`,
    `- locales: ${locales}`,
    `- rsvp: ${onOff(invitation.rsvp?.enabled)}`,
    `- gifts: ${onOff(invitation.giftRegistry?.enabled)}`,
    `- audio: ${onOff(invitation.audio?.enabled)}`,
    `- has hero image: ${onOff(invitation.heroImage)}`,
    `Content sections with data (build only these):`,
    `- schedule: ${count(invitation.schedule)} items`,
    `- faqs: ${count(invitation.faqs)} items`,
    `- our story: ${onOff(invitation.ourStory?.enabled)}`,
    `- gallery: ${count(invitation.coupleGallery?.images)} images`,
    `Design brief follows below.`,
  ].join("\n");
}
