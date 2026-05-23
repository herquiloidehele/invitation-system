"use client";

import {
  type MutableRefObject,
  type RefObject,
  useCallback,
  useEffect,
  useState,
} from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ChevronDown, ExternalLink, Gift, Heart, Shirt } from "lucide-react";

import type {
  CardSectionKey,
  FAQItem,
  InvitationData,
  TemplateTheme,
} from "@/lib/types";
import { type ResolvedTextStyles, resolveTextStyles } from "@/lib/text-styles";
import { t } from "@/lib/custom-texts";
import ScheduleSection from "./ScheduleSection";
import RSVPModal from "./RSVPModal";
import PersonalGuestCard from "./PersonalGuestCard";
import LocationCard from "./LocationCard";
import GuestGuideSection from "./GuestGuideSection";
import SaveTheDateSection from "./SaveTheDateSection";
import SectionImage from "./SectionImage";
import DynamicFontLoader from "./DynamicFontLoader";
import { EditableText } from "./EditableText";
import { EditableCard } from "./EditableCard";
import InvitationHero, {
  getHeroSectionHeight,
  InvitationHeroNames,
} from "./InvitationHero";
import { useAnalytics } from "@/hooks/useAnalytics";
import { RSVP_SUBMITTED_SLUGS_KEY } from "@/lib/constants";

// Re-export so existing imports from this module keep working.
export { getHeroSectionHeight };

// ---------------------------------------------------------------------------
// Animation variants — each section has its own entrance
// ---------------------------------------------------------------------------

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
};

/** Gentle scale-in for the date card */
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: EASE },
  },
};

/** Slide from left for info card 1 */
const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -36 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

/** Slide from right for info card 2 */
const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 36 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

/** Very slow ambient fade for footer */
const ambientFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.6, ease: "easeOut" },
  },
};

// ---------------------------------------------------------------------------
// Noise grain overlay SVG (inlined as data URI)
// ---------------------------------------------------------------------------

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ---------------------------------------------------------------------------
// Decorative section divider
// ---------------------------------------------------------------------------

function SectionDivider({ theme }: { theme: TemplateTheme }) {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE }}
        style={{
          width: 36,
          height: 1,
          background: theme.decorativeColor,
          transformOrigin: "right center",
        }}
      />
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: theme.accent,
          opacity: 0.35,
        }}
      />
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE }}
        style={{
          width: 36,
          height: 1,
          background: theme.decorativeColor,
          transformOrigin: "left center",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animated section wrappers
// ---------------------------------------------------------------------------

function AnimatedSection({
  children,
  className = "",
  variants: customVariants,
  isPreview = false,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  isPreview?: boolean;
}) {
  return (
    <motion.section
      variants={customVariants ?? fadeInUp}
      initial="hidden"
      {...(isPreview
        ? { animate: "visible" }
        : {
            whileInView: "visible",
            viewport: { once: true, margin: "-60px" },
          })}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// FAQ Accordion Item — redesigned with left accent border
// ---------------------------------------------------------------------------

function FAQAccordionItem({
  faq,
  isOpen,
  onToggle,
  theme,
  ts,
  isLast,
}: {
  faq: FAQItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  theme: TemplateTheme;
  ts: ResolvedTextStyles;
  isLast: boolean;
}) {
  return (
    <div
      style={{
        borderLeft: isOpen ? `2px solid ${ts.accent}` : "2px solid transparent",
        transition: "border-color 0.35s ease",
      }}
    >
      <button
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 text-left transition-colors"
        style={{
          padding: "20px 22px",
          paddingBottom: isOpen ? 4 : 20,
          background: "transparent",
          border: "none",
        }}
      >
        {/* Question text */}
        <span
          className="flex-1"
          style={{
            ...ts.faqQuestion,
            color: isOpen ? ts.textPrimary : ts.textSecondary,
            transition: "color 0.3s ease",
          }}
        >
          <EditableText elementKey="faqQuestion">{faq.question}</EditableText>
        </span>

        {/* Chevron */}
        <motion.span
          className="flex-shrink-0"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <ChevronDown
            size={16}
            color={ts.accent}
            strokeWidth={1.5}
            style={{
              opacity: isOpen ? 1 : 0.4,
              transition: "opacity 0.3s ease",
            }}
          />
        </motion.span>
      </button>

      {/* Answer */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.4, ease: EASE },
              opacity: { duration: 0.3, delay: 0.05 },
            }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "4px 22px 22px" }}>
              <p
                style={{
                  ...ts.faqAnswer,
                  margin: 0,
                }}
              >
                <EditableText elementKey="faqAnswer">{faq.answer}</EditableText>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divider between items */}
      {!isLast && (
        <div
          style={{
            height: 1,
            background: theme.cardBorder,
            margin: "0 22px",
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface InvitationPageProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  audioRef?: MutableRefObject<HTMLAudioElement | null>;
  /** When provided, InvitationPage will adopt this existing <video> element
   *  into the hero section instead of creating a new one, avoiding duplicate
   *  network requests. */
  prefetchedVideoRef?: RefObject<HTMLVideoElement | null>;
  /** Pass true in the admin live preview so all animations are always visible
   *  and respond to React state changes rather than scroll position. */
  isPreview?: boolean;
}

export default function InvitationPage({
  invitation,
  theme,
  audioRef,
  prefetchedVideoRef,
  isPreview = false,
}: InvitationPageProps) {
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const { trackEvent } = useAnalytics(invitation.slug);

  const handleMapsClick = useCallback(
    () => trackEvent("maps_click"),
    [trackEvent],
  );
  const handleGiftClick = useCallback(
    () => trackEvent("gift_click"),
    [trackEvent],
  );
  const handleCalendarClick = useCallback(
    () => trackEvent("calendar_click"),
    [trackEvent],
  );
  const handleAudioPlay = useCallback(
    () => trackEvent("audio_play"),
    [trackEvent],
  );

  // Check localStorage on mount (client-only)
  useEffect(() => {
    try {
      const slugs: string[] = JSON.parse(
        localStorage.getItem(RSVP_SUBMITTED_SLUGS_KEY) ?? "[]",
      );
      setRsvpSubmitted(slugs.includes(invitation.slug));
    } catch {
      // ignore
    }
  }, [invitation.slug]);

  const ts = resolveTextStyles(theme, invitation.textStyles);

  /** Resolve card bg/border/borderRadius for a given section, falling back to theme defaults. */
  const cs = (section: CardSectionKey, defaultRadius: number) => ({
    cardBg: invitation.cardStyles?.[section]?.cardBg || theme.cardBg,
    cardBorder:
      invitation.cardStyles?.[section]?.cardBorder || theme.cardBorder,
    borderRadius:
      invitation.cardStyles?.[section]?.borderRadius ?? defaultRadius,
    accentColor: invitation.cardStyles?.[section]?.accentColor,
  });

  return (
    <div
      style={{
        background: theme.bg,
        color: theme.textPrimary,
        minHeight: "100dvh",
        position: "relative",
      }}
    >
      {/* Load any non-builtin Google Fonts used by this theme */}
      <DynamicFontLoader theme={theme} textStyles={invitation.textStyles} />

      {/* ================================================================= */}
      {/* Atmospheric grain overlay                                         */}
      {/* ================================================================= */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          opacity: 0.018,
          backgroundImage: GRAIN_SVG,
          backgroundSize: "200px 200px",
          animation: "invitation-grain 6s steps(8) infinite",
          zIndex: 1,
        }}
      />

      {/* ================================================================= */}
      {/* Radial gradient wash                                              */}
      {/* ================================================================= */}
      {theme.bgGradient && (
        <div
          className="pointer-events-none fixed inset-0"
          style={{ background: theme.bgGradient }}
        />
      )}

      {/* ================================================================= */}
      {/* 1. Hero — full viewport video or image                            */}
      {/* ================================================================= */}
      <InvitationHero
        invitation={invitation}
        theme={theme}
        audioRef={audioRef}
        prefetchedVideoRef={prefetchedVideoRef}
        onAudioPlay={handleAudioPlay}
      />

      {/* ================================================================= */}
      {/* Personal guest card — shown when ?g=<token> matches a guest       */}
      {/* ================================================================= */}
      {invitation.guest && (
        <PersonalGuestCard guest={invitation.guest} theme={theme} />
      )}

      {/* ================================================================= */}
      {/* 2. Names (no-video fallback)                                      */}
      {/* ================================================================= */}
      <InvitationHeroNames
        invitation={invitation}
        theme={theme}
        isPreview={isPreview}
      />

      {/* ================================================================= */}
      {/* 3. Date Card — Save the Date (style varies per invitation)        */}
      {/* ================================================================= */}
      <AnimatedSection
        className={`px-6 pb-10 ${invitation.videoUrl ? "pt-16" : ""}`}
        variants={scaleIn}
        isPreview={isPreview}
      >
        <EditableCard sectionKey="saveTheDate">
          <SaveTheDateSection
            invitation={invitation}
            theme={theme}
            ts={ts}
            cardBg={cs("saveTheDate", 20).cardBg}
            cardBorder={cs("saveTheDate", 20).cardBorder}
            cardBorderRadius={cs("saveTheDate", 20).borderRadius}
            onCalendarClick={handleCalendarClick}
            isPreview={isPreview}
            imageSettings={invitation.imageSettings}
            customTexts={invitation.customTexts}
          />
        </EditableCard>
      </AnimatedSection>

      {/* ================================================================= */}
      {/* IMAGE 1 — after Save the Date info                                */}
      {/* ================================================================= */}
      {invitation.sectionImages?.image1 && (
        <SectionImage
          src={invitation.sectionImages.image1}
          theme={theme}
          imageSettings={invitation.imageSettings}
          imageKey="sectionImage1"
        />
      )}

      <SectionDivider theme={theme} />

      {/* ================================================================= */}
      {/* 3b. Nossa História — couple's story                               */}
      {/* ================================================================= */}
      {invitation.ourStory?.enabled && invitation.ourStory.description && (
        <>
          <AnimatedSection className="px-6 pb-2" isPreview={isPreview}>
            <div className="flex flex-col items-center">
              <span style={ts.sectionTitles}>
                <EditableText elementKey="sectionTitles">
                  {invitation.ourStory.title ||
                    t(invitation.customTexts, "sectionTitle_ourStory")}
                </EditableText>
              </span>

              <motion.div
                className="mt-3 mb-6"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
                style={{
                  width: 28,
                  height: 1,
                  background: ts.accent,
                  opacity: 0.25,
                }}
              />
            </div>
          </AnimatedSection>

          <AnimatedSection className="px-6 pb-10" isPreview={isPreview}>
            <EditableCard sectionKey="ourStory">
              <div
                style={{
                  background: cs("ourStory", 20).cardBg,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  borderRadius: cs("ourStory", 20).borderRadius,
                  overflow: "hidden",
                  padding: "28px 24px",
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
                  border: `1px solid ${cs("ourStory", 20).cardBorder}`,
                }}
              >
                <div className="flex flex-col items-center gap-4">
                  {/* Decorative heart icon */}
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: `${ts.accent}12` }}
                  >
                    <Heart size={20} color={ts.accent} strokeWidth={1.5} />
                  </div>

                  {/* Story text */}
                  <p
                    style={{
                      ...ts.bodyText,
                      textAlign: "center",
                      margin: 0,
                      whiteSpace: "pre-line",
                    }}
                  >
                    <EditableText elementKey="bodyText">
                      {invitation.ourStory.description}
                    </EditableText>
                  </p>
                </div>
              </div>
            </EditableCard>
          </AnimatedSection>

          <SectionDivider theme={theme} />
        </>
      )}

      {/* ================================================================= */}
      {/* 4. Schedule                                                       */}
      {/* ================================================================= */}
      {invitation.schedule.length > 0 && (
        <ScheduleSection
          schedule={invitation.schedule}
          scheduleStyle={invitation.scheduleStyle}
          theme={theme}
          ts={ts}
          cardStyle={cs("schedule", 20)}
          customTexts={invitation.customTexts}
          isPreview={isPreview}
        />
      )}

      {/* ================================================================= */}
      {/* IMAGE 2 — between schedule and info cards                         */}
      {/* ================================================================= */}
      {invitation.sectionImages?.image2 && (
        <SectionImage
          src={invitation.sectionImages.image2}
          theme={theme}
          imageSettings={invitation.imageSettings}
          imageKey="sectionImage2"
        />
      )}

      <SectionDivider theme={theme} />

      {/* ================================================================= */}
      {/* 5b. Location Card Section                                         */}
      {/* ================================================================= */}
      <AnimatedSection className="px-6 pb-10" isPreview={isPreview}>
        <div className="flex flex-col items-center">
          <span style={ts.sectionTitles}>
            <EditableText elementKey="sectionTitles">
              {t(invitation.customTexts, "sectionTitle_location")}
            </EditableText>
          </span>

          <motion.div
            className="mt-3 mb-6"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            style={{
              width: 28,
              height: 1,
              background: ts.accent,
              opacity: 0.25,
            }}
          />
        </div>

        <EditableCard sectionKey="location">
          <LocationCard
            location={invitation.location}
            theme={theme}
            ts={ts}
            cardBg={cs("location", 16).cardBg}
            cardBorder={cs("location", 16).cardBorder}
            cardBorderRadius={cs("location", 16).borderRadius}
            onMapsClick={handleMapsClick}
            imageSettings={invitation.imageSettings}
            imageKey="locationImage1"
            customTexts={invitation.customTexts}
          />
        </EditableCard>

        {/* Second location card (optional) */}
        {invitation.location2 && (
          <div className="mt-4">
            <EditableCard sectionKey="location">
              <LocationCard
                location={invitation.location2}
                theme={theme}
                ts={ts}
                cardBg={cs("location", 16).cardBg}
                cardBorder={cs("location", 16).cardBorder}
                cardBorderRadius={cs("location", 16).borderRadius}
                onMapsClick={handleMapsClick}
                imageSettings={invitation.imageSettings}
                imageKey="locationImage2"
                customTexts={invitation.customTexts}
              />
            </EditableCard>
          </div>
        )}
      </AnimatedSection>

      {/* ================================================================= */}
      {/* IMAGE 3 — between location and guest guide / FAQs                 */}
      {/* ================================================================= */}
      {invitation.sectionImages?.image3 && (
        <SectionImage
          src={invitation.sectionImages.image3}
          theme={theme}
          imageSettings={invitation.imageSettings}
          imageKey="sectionImage3"
        />
      )}

      {/* ================================================================= */}
      {/* 5. Info Cards — glassmorphism, opposing slide-ins                  */}
      {/* ================================================================= */}
      {(invitation.dressCode.enabled || invitation.giftRegistry.enabled) && (
        <AnimatedSection className="px-6 pb-10" isPreview={isPreview}>
          <SectionDivider theme={theme} />
          <div className={`flex flex-col gap-6`}>
            {/* Dress Code — slides from left */}
            {invitation.dressCode.enabled && (
              <EditableCard sectionKey="dressCode">
                <motion.div
                  variants={slideFromLeft}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  className="flex flex-col items-center gap-3 text-center"
                  style={{
                    background: cs("dressCode", 16).cardBg,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderRadius: cs("dressCode", 16).borderRadius,
                    padding: "24px 14px",
                    boxShadow:
                      "0 1px 2px rgba(0,0,0,0.02), 0 6px 24px rgba(0,0,0,0.03)",
                    border: `1px solid ${cs("dressCode", 16).cardBorder}`,
                  }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      background: `${ts.accent}12`,
                    }}
                  >
                    <Shirt size={20} color={ts.accent} strokeWidth={1.5} />
                  </div>
                  <span style={ts.labels}>
                    <EditableText elementKey="labels">
                      {t(invitation.customTexts, "sectionTitle_dressCode")}
                    </EditableText>
                  </span>
                  <EditableText elementKey="dressCodeText">
                    <span
                      style={{
                        ...ts.dressCodeText,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {invitation.dressCode.text}
                    </span>
                  </EditableText>
                  {(invitation.dressCode.colors?.length ?? 0) > 0 && (
                    <div className="mt-1 flex items-center justify-center gap-2.5">
                      {invitation.dressCode.colors!.map((color, i) => (
                        <span
                          key={i}
                          className="inline-block rounded-full"
                          style={{
                            backgroundColor: color,
                            width: 28,
                            height: 28,
                            border: "1px solid rgba(0,0,0,0.1)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </EditableCard>
            )}

            {/* Gift Registry — slides from right */}
            {invitation.giftRegistry.enabled && (
              <EditableCard sectionKey="giftRegistry">
                <motion.div
                  variants={slideFromRight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  className="flex flex-col items-center gap-3 text-center"
                  style={{
                    background: cs("giftRegistry", 16).cardBg,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderRadius: cs("giftRegistry", 16).borderRadius,
                    padding: "24px 14px",
                    boxShadow:
                      "0 1px 2px rgba(0,0,0,0.02), 0 6px 24px rgba(0,0,0,0.03)",
                    border: `1px solid ${cs("giftRegistry", 16).cardBorder}`,
                  }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      background: `${ts.accent}12`,
                    }}
                  >
                    <Gift size={20} color={ts.accent} strokeWidth={1.5} />
                  </div>
                  <span style={ts.labels}>
                    <EditableText elementKey="labels">
                      {t(invitation.customTexts, "sectionTitle_giftRegistry")}
                    </EditableText>
                  </span>
                  <span
                    style={{
                      ...ts.giftText,
                      whiteSpace: "pre-line",
                    }}
                  >
                    <EditableText elementKey="giftText">
                      {invitation.giftRegistry.text}
                    </EditableText>
                  </span>
                  {invitation.giftRegistry.link && (
                    <motion.a
                      href={invitation.giftRegistry.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleGiftClick}
                      className="flex items-center justify-center gap-1.5 mt-1 transition-opacity hover:opacity-70"
                      style={ts.giftLink}
                      whileHover={{ scale: 1.02 }}
                    >
                      <ExternalLink size={10} strokeWidth={1.5} />
                      <EditableText elementKey="giftLink">
                        {t(invitation.customTexts, "cta_giftLink")}
                      </EditableText>
                    </motion.a>
                  )}
                </motion.div>
              </EditableCard>
            )}
          </div>
        </AnimatedSection>
      )}

      {/* ================================================================= */}
      {/* 6. Manual do Bom Convidado                                        */}
      {/* ================================================================= */}
      {invitation.guestGuide?.enabled &&
        invitation.guestGuide.items.length > 0 && (
          <>
            <SectionDivider theme={theme} />
            <div className="flex flex-col items-center">
              <span style={ts.sectionTitles} className={"text-center"}>
                <EditableText elementKey="sectionTitles">
                  {t(invitation.customTexts, "sectionTitle_guestGuide")
                    .split("\n")
                    .map((line, i, arr) => (
                      <span key={i}>
                        {line}
                        {i < arr.length - 1 && <br />}
                      </span>
                    ))}
                </EditableText>
              </span>

              <motion.div
                className="mt-3 mb-6"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
                style={{
                  width: 28,
                  height: 1,
                  background: ts.accent,
                  opacity: 0.25,
                }}
              />
            </div>

            <AnimatedSection className="px-6 pb-10" isPreview={isPreview}>
              <EditableCard sectionKey="guestGuide">
                <GuestGuideSection
                  guestGuide={invitation.guestGuide}
                  theme={theme}
                  ts={ts}
                  cardBg={cs("guestGuide", 14).cardBg}
                  cardBorder={cs("guestGuide", 14).cardBorder}
                  cardBorderRadius={cs("guestGuide", 14).borderRadius}
                  isPreview={isPreview}
                />
              </EditableCard>
            </AnimatedSection>
          </>
        )}

      {/* ================================================================= */}
      {/* 7. FAQs                                                           */}
      {/* ================================================================= */}
      {invitation.faqs && invitation.faqs.length > 0 && (
        <>
          <SectionDivider theme={theme} />

          <AnimatedSection className="px-6 pb-10" isPreview={isPreview}>
            <div className="flex flex-col items-center">
              <span style={ts.sectionTitles}>
                <EditableText elementKey="sectionTitles">
                  {t(invitation.customTexts, "sectionTitle_faqs")}
                </EditableText>
              </span>

              <motion.div
                className="mt-3 mb-6"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
                style={{
                  width: 28,
                  height: 1,
                  background: ts.accent,
                  opacity: 0.25,
                }}
              />
            </div>

            {/* FAQ card */}
            <EditableCard sectionKey="faqs">
              <div
                style={{
                  background: cs("faqs", 20).cardBg,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  borderRadius: cs("faqs", 20).borderRadius,
                  overflow: "hidden",
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
                  border: `1px solid ${cs("faqs", 20).cardBorder}`,
                }}
              >
                {invitation.faqs.map((faq, i) => (
                  <FAQAccordionItem
                    key={i}
                    faq={faq}
                    index={i}
                    isOpen={openFaqIndex === i}
                    onToggle={() =>
                      setOpenFaqIndex(openFaqIndex === i ? null : i)
                    }
                    theme={theme}
                    ts={ts}
                    isLast={i === (invitation.faqs?.length ?? 0) - 1}
                  />
                ))}
              </div>
            </EditableCard>
          </AnimatedSection>
        </>
      )}

      <SectionDivider theme={theme} />

      {/* ================================================================= */}
      {/* 6. CTA Section                                                    */}
      {/* ================================================================= */}
      <AnimatedSection className="px-6 pb-10" isPreview={isPreview}>
        <div className="flex flex-col items-center">
          <span className="mb-6 text-center" style={ts.ctaLabel}>
            <EditableText elementKey="ctaLabel">
              {t(invitation.customTexts, "cta_confirmLabel")}
            </EditableText>
          </span>
        </div>

        <div className="flex flex-col items-center">
          {/* Confirmar Presença */}
          <motion.button
            onClick={() => setRsvpOpen(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 px-6 py-4 font-medium transition-all"
            style={{
              fontFamily: theme.uiFont,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: 1,
              background: rsvpSubmitted ? "#22c55e" : theme.ctaPrimaryBg,
              color: rsvpSubmitted ? "#fff" : theme.ctaPrimaryText,
              borderRadius: theme.ctaRadius,
              cursor: rsvpSubmitted ? "default" : "pointer",
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <Heart size={17} strokeWidth={1.5} />
            {rsvpSubmitted
              ? t(invitation.customTexts, "cta_confirmedButton")
              : t(invitation.customTexts, "cta_confirmButton")}
          </motion.button>
        </div>
      </AnimatedSection>

      {/* ================================================================= */}
      {/* 8. Footer — monogram with decorative ring                         */}
      {/* ================================================================= */}
      <AnimatedSection variants={ambientFade} isPreview={isPreview}>
        <footer className="flex flex-col items-center pb-12 pt-6">
          {/* Decorative accent line */}
          <motion.div
            className="mb-8"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: EASE }}
            style={{
              width: 48,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
              opacity: 0.2,
            }}
          />

          {/* Monogram with decorative ring */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: 64, height: 64 }}
          >
            {/* Rotating ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: `1px dashed ${theme.decorativeColor}`,
                animation: "slow-rotate 30s linear infinite",
                opacity: 0.5,
              }}
            />
            <span style={ts.footerMonogram}>
              <EditableText elementKey="footerMonogram">
                {invitation.couple.monogram}
              </EditableText>
            </span>
          </div>

          {/* Date */}
          <span className="mt-4" style={ts.footerDate}>
            <EditableText elementKey="footerDate">
              {invitation.date.day} &middot; {invitation.date.month} &middot;{" "}
              {invitation.date.year}
            </EditableText>
          </span>
        </footer>
      </AnimatedSection>

      {/* ================================================================= */}
      {/* IMAGE 4 — bottom of page                                          */}
      {/* ================================================================= */}
      {invitation.sectionImages?.image4 && (
        <SectionImage
          src={invitation.sectionImages.image4}
          theme={theme}
          height={300}
          hiddeBottom
          imageSettings={invitation.imageSettings}
          imageKey="sectionImage4"
        />
      )}

      {/* ================================================================= */}
      {/* RSVP Modal                                                        */}
      {/* ================================================================= */}
      <RSVPModal
        open={rsvpOpen}
        onClose={() => {
          setRsvpOpen(false);
          // Refresh submitted state after modal closes
          try {
            const slugs: string[] = JSON.parse(
              localStorage.getItem(RSVP_SUBMITTED_SLUGS_KEY) ?? "[]",
            );
            setRsvpSubmitted(slugs.includes(invitation.slug));
          } catch {
            // ignore
          }
        }}
        invitation={invitation}
        theme={theme}
        customTexts={invitation.customTexts}
        guest={invitation.guest}
      />
    </div>
  );
}
