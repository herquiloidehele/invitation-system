"use client";

import { motion, type Variants } from "framer-motion";
import { ExternalLink, Phone } from "lucide-react";

import type {
  CardStyle,
  InvitationData,
  PlaceItem,
  PlaceSection,
  TemplateTheme,
} from "@/lib/types";
import { resolveTextStyles } from "@/lib/text-styles";
import {
  resolvePlaceSections,
  resolvePlacesLayout,
  shouldRenderPlaces,
} from "@/lib/places";
import { useCustomText } from "@/lib/custom-texts";
import { EditableText } from "./EditableText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

interface PlacesSectionProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  /** Resolved card style for the "places" section (cs("places", 16)). */
  cardStyle: CardStyle;
  isPreview?: boolean;
}

export default function PlacesSection({
  invitation,
  theme,
  cardStyle,
  isPreview = false,
}: PlacesSectionProps) {
  const t = useCustomText(invitation.customTexts);
  const ts = resolveTextStyles(theme, invitation.textStyles);

  if (!shouldRenderPlaces(invitation)) return null;

  const sections = resolvePlaceSections(invitation.places);
  const layout = resolvePlacesLayout(invitation.places);

  const cardBg = cardStyle.cardBg || theme.cardBg;
  const cardBorder = cardStyle.cardBorder || theme.cardBorder;
  const cardRadius = cardStyle.borderRadius ?? 16;
  const accent = cardStyle.accentColor || ts.accent;

  return (
    <div className="flex flex-col">
      {sections.map((section) => (
        <PlacesBlock
          key={section.id}
          section={section}
          layout={layout}
          theme={theme}
          ts={ts}
          t={t}
          cardBg={cardBg}
          cardBorder={cardBorder}
          cardRadius={cardRadius}
          accent={accent}
          isPreview={isPreview}
        />
      ))}
    </div>
  );
}

interface BlockProps {
  section: PlaceSection;
  layout: "stacked" | "rows";
  theme: TemplateTheme;
  ts: ReturnType<typeof resolveTextStyles>;
  t: (key: "places_mapLabel" | "places_callLabel") => string;
  cardBg: string;
  cardBorder: string;
  cardRadius: number;
  accent: string;
  isPreview: boolean;
}

function PlacesBlock({
  section,
  layout,
  theme,
  ts,
  t,
  cardBg,
  cardBorder,
  cardRadius,
  accent,
  isPreview,
}: BlockProps) {
  const hasTitle = !!section.title?.trim();

  return (
    <section className="px-4 pb-10">
      {hasTitle && <PlacesBlockHeader title={section.title} theme={theme} ts={ts} accent={accent} isPreview={isPreview} />}

      <motion.div
        className={
          (layout === "rows" ? "flex flex-col gap-3" : "flex flex-col gap-5") +
          " mx-auto max-w-[600px]"
        }
        variants={staggerContainer}
        initial="hidden"
        {...(isPreview
          ? { animate: "visible" }
          : {
              whileInView: "visible",
              viewport: { once: false, margin: "-40px" },
            })}
      >
        {section.items.map((item) => (
          <PlaceCard
            key={item.id}
            item={item}
            layout={layout}
            ts={ts}
            t={t}
            cardBg={cardBg}
            cardBorder={cardBorder}
            cardRadius={cardRadius}
          />
        ))}
      </motion.div>
    </section>
  );
}

interface HeaderProps {
  title: string;
  theme: TemplateTheme;
  ts: ReturnType<typeof resolveTextStyles>;
  accent: string;
  isPreview: boolean;
}

/** Decorative section header: dot divider, centered title, accent underline. */
function PlacesBlockHeader({ title, theme, ts, accent, isPreview }: HeaderProps) {
  return (
    <>
      {/* Dot divider */}
      <div className="flex items-center justify-center gap-3 py-6">
        <motion.span
          initial={{ scaleX: 0 }}
          {...(isPreview
            ? { animate: { scaleX: 1 } }
            : { whileInView: { scaleX: 1 }, viewport: { once: false } })}
          transition={{ duration: 0.8, ease: EASE }}
          style={{
            width: 36,
            height: 1,
            background: theme.decorativeColor,
            transformOrigin: "right center",
          }}
        />
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: accent,
          }}
        />
        <motion.span
          initial={{ scaleX: 0 }}
          {...(isPreview
            ? { animate: { scaleX: 1 } }
            : { whileInView: { scaleX: 1 }, viewport: { once: false } })}
          transition={{ duration: 0.8, ease: EASE }}
          style={{
            width: 36,
            height: 1,
            background: theme.decorativeColor,
            transformOrigin: "left center",
          }}
        />
      </div>

      {/* Title + underline */}
      <div className="flex flex-col items-center">
        <span style={ts.placesSectionTitle}>
          <EditableText elementKey="placesSectionTitle">{title}</EditableText>
        </span>
        <motion.div
          className="mt-3 mb-6"
          initial={{ scaleX: 0 }}
          {...(isPreview
            ? { animate: { scaleX: 1 } }
            : { whileInView: { scaleX: 1 }, viewport: { once: false } })}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
          style={{
            width: 28,
            height: 1,
            background: accent,
            opacity: 0.25,
            transformOrigin: "center",
          }}
        />
      </div>
    </>
  );
}

interface CardProps {
  item: PlaceItem;
  layout: "stacked" | "rows";
  ts: ReturnType<typeof resolveTextStyles>;
  t: (key: "places_mapLabel" | "places_callLabel") => string;
  cardBg: string;
  cardBorder: string;
  cardRadius: number;
}

function PlaceCard({
  item,
  layout,
  ts,
  t,
  cardBg,
  cardBorder,
  cardRadius,
}: CardProps) {
  const links = (
    <div className="mt-2 flex items-center gap-4">
      {item.googleMapsUrl && (
        <a
          href={item.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5"
          style={ts.placeLink}
        >
          <ExternalLink size={13} strokeWidth={1.5} />
          {t("places_mapLabel")}
        </a>
      )}
      {item.phone && (
        <a
          href={`tel:${item.phone.replace(/\s+/g, "")}`}
          className="flex items-center gap-1.5"
          style={ts.placeLink}
        >
          <Phone size={13} strokeWidth={1.5} />
          {t("places_callLabel")}
        </a>
      )}
    </div>
  );

  const text = (
    <div className="flex flex-col">
      <span style={ts.placeTitle}>
        <EditableText elementKey="placeTitle">{item.title}</EditableText>
      </span>
      {item.description && (
        <span style={{ ...ts.placeDescription, marginTop: 4 }}>
          <EditableText elementKey="placeDescription">
            {item.description}
          </EditableText>
        </span>
      )}
      {links}
    </div>
  );

  const cardShell: React.CSSProperties = {
    background: cardBg,
    border: `1px solid ${cardBorder}`,
    borderRadius: cardRadius,
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 6px 24px rgba(0,0,0,0.03)",
  };

  if (layout === "rows") {
    return (
      <motion.div
        variants={fadeInUp}
        whileHover={{ y: -2 }}
        className="flex items-center gap-3 p-3"
        style={cardShell}
      >
        {item.imageUrl && (
          <div
            className="shrink-0"
            style={{
              width: 84,
              height: 84,
              borderRadius: 10,
              backgroundImage: `url(${item.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <div className="min-w-0 flex-1">{text}</div>
      </motion.div>
    );
  }

  // stacked
  return (
    <motion.div variants={fadeInUp} whileHover={{ y: -3 }} style={cardShell}>
      {item.imageUrl && (
        <div
          style={{
            width: "100%",
            height: 160,
            backgroundImage: `url(${item.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      <div className="p-4">{text}</div>
    </motion.div>
  );
}
