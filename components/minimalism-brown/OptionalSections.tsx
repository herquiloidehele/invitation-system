"use client";

import type { InvitationData, TemplateTheme } from "@/lib/types";
import { resolveTextStyles } from "@/lib/text-styles";
import { useCustomText } from "@/lib/custom-texts";
import { mbCardStyle, mbStyle, mbTokens } from "@/lib/minimalism-brown";
import { shouldRenderPlaces } from "@/lib/places";
import { EditableText } from "@/components/shared/EditableText";
import PersonalGuestCard from "@/components/shared/PersonalGuestCard";
import PlacesSection from "@/components/shared/PlacesSection";
import GuestGuideSection from "@/components/shared/GuestGuideSection";
import FaqSection from "@/components/shared/FaqSection";
import SectionTitle from "./SectionTitle";
import Countdown from "./Countdown";
import { Reveal } from "./motion";

/**
 * Platform sections the reference template doesn't show, but that a host can
 * still enable on this layout.
 *
 * Each one reuses its existing shared component rather than being rebuilt —
 * they're wrapped in this layout's section rhythm and handed the theme so they
 * read as part of the template instead of falling back to default styling.
 */
export default function OptionalSections({
  invitation,
  theme,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
  /** Reserved for sections that route guests into the RSVP flow. */
  onRsvpClick?: () => void;
}) {
  const t = mbTokens(theme);
  const ts = invitation.textStyles;
  const resolved = resolveTextStyles(theme, ts);
  const ct = useCustomText(invitation.customTexts);
  const gap = { marginTop: t.gap.section };

  // Every shared section below reveals with `once: false`, so it fades back
  // out as soon as the reader scrolls past — content visibly disappearing,
  // which is worse on a page that scrolls itself. Each is wrapped in our own
  // one-time Reveal and told to render its innards outright, which also means
  // they can't strand blank if the observer never fires.

  return (
    <>
      {invitation.guest && (
        <div style={gap}>
          <PersonalGuestCard
            guest={invitation.guest}
            theme={theme}
            textStyles={ts}
            customTexts={invitation.customTexts}
            backgroundImageUrl={invitation.personalGuestCard?.backgroundImageUrl}
            scrimOpacity={invitation.personalGuestCard?.scrimOpacity}
            imageSettings={invitation.imageSettings}
            cardStyle={mbCardStyle(
              invitation.cardStyles,
              theme,
              "personalGuestCard",
              t.card.radius,
            )}
            checkInEnabled={invitation.checkInEnabled}
            qrStyle={invitation.qrCodeStyle}
          />
        </div>
      )}

      {invitation.countdown?.enabled && (
        <Countdown invitation={invitation} theme={theme} />
      )}

      {invitation.ourStory?.enabled && invitation.ourStory.description && (
        <section style={{ ...gap, textAlign: "center" }}>
          <SectionTitle theme={theme} textStyles={ts}>
            {invitation.ourStory.title}
          </SectionTitle>
          <p
            style={mbStyle(
              {
                margin: `${t.gap.block}px 0 0`,
                fontFamily: t.title.font,
                fontSize: 14,
                fontWeight: 300,
                lineHeight: 1.8,
                color: theme.textSecondary,
              },
              ts,
              "mbAnnounce",
            )}
          >
            <EditableText elementKey="mbAnnounce">
              {invitation.ourStory.description}
            </EditableText>
          </p>
        </section>
      )}

      {shouldRenderPlaces(invitation) && (
        <Reveal style={gap}>
          <PlacesSection
            invitation={invitation}
            theme={theme}
            cardStyle={mbCardStyle(
              invitation.cardStyles,
              theme,
              "places",
              t.card.radius,
            )}
            isPreview
          />
        </Reveal>
      )}

      {invitation.guestGuide?.enabled && (
        <Reveal style={gap}>
          <SectionTitle theme={theme} textStyles={ts}>
            {ct("sectionTitle_guestGuide")}
          </SectionTitle>
          <div style={{ marginTop: t.gap.block }}>
            <GuestGuideSection
              guestGuide={invitation.guestGuide}
              theme={theme}
              ts={resolved}
              cardBg={invitation.cardStyles?.guestGuide?.cardBg}
              cardBorder={invitation.cardStyles?.guestGuide?.cardBorder}
              cardBorderRadius={t.card.radius}
              plain={invitation.cardStyles?.guestGuide?.plain === true}
              isPreview
            />
          </div>
        </Reveal>
      )}

      {invitation.faqs && invitation.faqs.length > 0 && (
        <Reveal style={gap} className="mb-faq">
          {/* FaqSection ships its own heading in a different type treatment —
              lighter, wider-tracked, with a word-reveal — which reads as a
              stray from another template next to our section titles. Hide it
              and its underline, and supply the heading ourselves. */}
          <style>{`
            .mb-faq > section > div > span:first-child,
            .mb-faq > section > div > span:first-child + div { display: none; }
          `}</style>
          <SectionTitle theme={theme} textStyles={ts}>
            {ct("sectionTitle_faqs")}
          </SectionTitle>
          <FaqSection
            faqs={invitation.faqs}
            theme={theme}
            textStyles={ts}
            customTexts={invitation.customTexts}
            cardStyle={mbCardStyle(
              invitation.cardStyles,
              theme,
              "faqs",
              t.card.radius,
            )}
            isPreview
          />
        </Reveal>
      )}
    </>
  );
}
