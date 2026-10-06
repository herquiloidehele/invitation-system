"use client";

import { motion } from "framer-motion";
import type {
  InvitationData,
  PublicGuestData,
  TemplateTheme,
} from "@/lib/types";
import { efStyle } from "@/lib/elegant-floral";
import { isTextElementHidden } from "@/lib/text-styles";
import { useCustomText } from "@/lib/custom-texts";
import {
  EditableText,
  useInlineTextEdit,
} from "@/components/shared/EditableText";
import { efItem } from "./motion";

/**
 * Stand-in guest for the admin preview, where there is no personal link. Kept
 * local rather than imported from PersonalGuestCard so the card (and its
 * invite modal + QR) stays out of this layout's bundle.
 */
export const GUEST_LINE_SAMPLE: Pick<PublicGuestData, "name" | "companion"> = {
  name: "Maria",
  companion: "João",
};

interface GuestInviteLineProps {
  /** The name to print — see efGuestLineName. */
  name: string;
  invitation: Pick<InvitationData, "customTexts" | "textStyles">;
  theme: TemplateTheme;
}

/**
 * Caption → the guest's name in script over a thin rule → closing caption.
 * Rendered by Announcement under the couple names, joining its stagger.
 */
export default function GuestInviteLine({
  name,
  invitation,
  theme,
}: GuestInviteLineProps) {
  const ct = useCustomText(invitation.customTexts);
  const editing = useInlineTextEdit() !== null;
  const ts = invitation.textStyles;

  // The editor keeps a hidden text on screen (dashed) so it can be shown
  // again; the live page drops its paragraph so no gap is left behind.
  const shown = (key: "efGuestLead" | "efGuestName" | "efGuestTrail") =>
    editing || !isTextElementHidden(ts, key);

  const captionStyle = (
    key: "efGuestLead" | "efGuestTrail",
    marginTop: string,
  ) =>
    efStyle(
      {
        margin: 0,
        marginTop,
        fontSize: "clamp(0.78rem, 3.2vw, 1rem)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        textWrap: "balance",
      },
      ts,
      key,
    );

  return (
    <div style={{ margin: "0 0 2.5rem" }}>
      {shown("efGuestLead") && (
        <motion.p variants={efItem} style={captionStyle("efGuestLead", "0")}>
          <EditableText elementKey="efGuestLead">
            {ct("efGuestLine_lead")}
          </EditableText>
        </motion.p>
      )}

      {shown("efGuestName") && (
        <motion.div
          variants={efItem}
          style={{
            margin: "0.85rem auto 0",
            maxWidth: "26rem",
            paddingBottom: "0.15rem",
            borderBottom: `1px solid color-mix(in srgb, ${theme.textSecondary} 55%, transparent)`,
          }}
        >
          <p
            style={efStyle(
              {
                margin: 0,
                fontFamily: theme.scriptFont ?? theme.displayFont,
                fontWeight: 400,
                fontSize: "clamp(1.7rem, 7.6vw, 2.5rem)",
                lineHeight: 1.15,
                color: theme.primary,
                textWrap: "balance",
              },
              ts,
              "efGuestName",
            )}
          >
            <EditableText elementKey="efGuestName">{name}</EditableText>
          </p>
        </motion.div>
      )}

      {shown("efGuestTrail") && (
        <motion.p
          variants={efItem}
          style={captionStyle("efGuestTrail", "1.25rem")}
        >
          <EditableText elementKey="efGuestTrail">
            {ct("efGuestLine_trail")}
          </EditableText>
        </motion.p>
      )}
    </div>
  );
}
