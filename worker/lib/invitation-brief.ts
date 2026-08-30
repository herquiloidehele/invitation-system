import type { InvitationData } from "@/lib/types";

/**
 * A compact, factual brief of the invitation's real configuration, injected
 * into the agent's build prompt so it designs for the correct feature set and
 * binds to real content instead of inventing it.
 */
export function buildInvitationBrief(invitation: InvitationData): string {
  const onOff = (v: unknown) => (v ? "on" : "off");
  const couple = invitation.couple;
  const locales = (invitation.enabledLocales ?? ["pt"]).join(", ");

  return [
    `Invitation config (bind content to props.invitation — do not copy these values into code):`,
    `- couple: ${couple?.bride} & ${couple?.groom} (event: ${invitation.eventType ?? "wedding"})`,
    `- locales: ${locales}`,
    `- rsvp: ${onOff(invitation.rsvp?.enabled)}`,
    `- gifts: ${onOff(invitation.giftRegistry?.enabled)}`,
    `- audio: ${onOff(invitation.audio?.enabled)}`,
    `- has hero image: ${onOff(invitation.heroImage)}`,
    `Design brief follows below.`,
  ].join("\n");
}
