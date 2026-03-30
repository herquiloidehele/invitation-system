"use client";

import { useState, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { ExternalLink, Gift } from "lucide-react";

import type {
  CardSectionKey,
  CardStyle,
  GiftCategoryData,
  GiftItemData,
  GiftRegistry,
  TemplateTheme,
} from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
  },
};

const itemFadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

const pillSlide: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: EASE },
  },
};

// ---------------------------------------------------------------------------
// Gift Item Card
// ---------------------------------------------------------------------------

function GiftItemCard({
  item,
  theme,
  ts,
  cs,
  onGiftClick,
}: {
  item: GiftItemData;
  theme: TemplateTheme;
  ts: ResolvedTextStyles;
  cs: (key: CardSectionKey) => CardStyle;
  onGiftClick?: () => void;
}) {
  return (
    <motion.div
      variants={itemFadeIn}
      className="flex flex-col overflow-hidden"
      style={{
        background: cs("giftItems").cardBg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 14,
        border: `1px solid ${cs("giftItems").cardBorder}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.03)",
      }}
    >
      {/* Image area */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          aspectRatio: "1",
          background: `${theme.accent}08`,
        }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <Gift
            size={28}
            strokeWidth={1.2}
            color={theme.accent}
            style={{ opacity: 0.35 }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span style={ts.giftItemName}>{item.name}</span>

        {item.price != null && (
          <span style={ts.giftItemPrice}>
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(item.price)}
          </span>
        )}

        {item.link && (
          <motion.a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onGiftClick}
            className="mt-auto flex items-center justify-center gap-1.5 pt-2 transition-opacity hover:opacity-70"
            style={{
              ...ts.giftLink,
              fontSize: 9,
            }}
            whileHover={{ scale: 1.02 }}
          >
            <ExternalLink size={9} strokeWidth={1.5} />
            Ver
          </motion.a>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Category Filter Pills
// ---------------------------------------------------------------------------

function CategoryPills({
  categories,
  activeId,
  onSelect,
  theme,
  ts,
}: {
  categories: GiftCategoryData[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  theme: TemplateTheme;
  ts: ResolvedTextStyles;
}) {
  const pills = [{ id: null, name: "Todos" }, ...categories];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="flex gap-2 overflow-x-auto pb-1"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {pills.map((pill) => {
        const isActive = pill.id === activeId;
        return (
          <motion.button
            key={pill.id ?? "all"}
            variants={pillSlide}
            onClick={() => onSelect(pill.id)}
            className="shrink-0 cursor-pointer transition-all"
            style={{
              fontFamily: ts.uiFont,
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: isActive ? theme.ctaPrimaryText : ts.textSecondary,
              background: isActive ? theme.accent : `${theme.accent}10`,
              border: `1px solid ${isActive ? theme.accent : `${theme.accent}20`}`,
              borderRadius: 20,
              padding: "6px 14px",
              whiteSpace: "nowrap",
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {pill.name}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Section Component
// ---------------------------------------------------------------------------

interface GiftRegistrySectionProps {
  invitation: {
    giftRegistry: GiftRegistry;
    giftCategories?: GiftCategoryData[];
  };
  theme: TemplateTheme;
  ts: ResolvedTextStyles;
  cs: (key: CardSectionKey) => CardStyle;
  isPreview?: boolean;
  onGiftClick?: () => void;
}

export default function GiftRegistrySection({
  invitation,
  theme,
  ts,
  cs,
  isPreview = false,
  onGiftClick,
}: GiftRegistrySectionProps) {
  const { giftRegistry, giftCategories = [] } = invitation;
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // Flatten all items for filtering
  const allItems = useMemo(
    () => giftCategories.flatMap((cat) => cat.items),
    [giftCategories],
  );

  const filteredItems = useMemo(() => {
    if (!activeCategoryId) return allItems;
    return allItems.filter((item) => item.categoryId === activeCategoryId);
  }, [allItems, activeCategoryId]);

  const hasItems = allItems.length > 0;
  const hasCategories = giftCategories.length > 0;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Section title */}
      <span style={ts.sectionTitles}>
        {giftRegistry.title || "Lista de Presentes"}
      </span>

      {/* Description text */}
      {giftRegistry.text && (
        <p
          className="text-center px-2"
          style={{
            ...ts.bodyText,
            fontSize: 13,
            maxWidth: 320,
          }}
        >
          {giftRegistry.text}
        </p>
      )}

      {/* Legacy single external link (shown when no item catalog) */}
      {!hasItems && giftRegistry.link && (
        <motion.a
          href={giftRegistry.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onGiftClick}
          className="flex items-center justify-center gap-1.5 transition-opacity hover:opacity-70"
          style={ts.giftLink}
          whileHover={{ scale: 1.02 }}
        >
          <ExternalLink size={10} strokeWidth={1.5} />
          Ver lista
        </motion.a>
      )}

      {/* Category filter pills */}
      {hasItems && hasCategories && giftCategories.length > 1 && (
        <CategoryPills
          categories={giftCategories}
          activeId={activeCategoryId}
          onSelect={setActiveCategoryId}
          theme={theme}
          ts={ts}
        />
      )}

      {/* Gift items grid */}
      {hasItems && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          {...(isPreview
            ? { animate: "visible" }
            : {
                whileInView: "visible",
                viewport: { once: true, margin: "-40px" },
              })}
          className="grid w-full grid-cols-2 gap-3"
        >
          {filteredItems.map((item) => (
            <GiftItemCard
              key={item.id}
              item={item}
              theme={theme}
              ts={ts}
              cs={cs}
              onGiftClick={onGiftClick}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
