import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RsvpEntry = {
  id: string;
  guestName: string;
  email: string | null;
  attending: boolean;
  dietaryRestrictions: string | null;
  message: string | null;
  submittedAt: Date | string;
};

/** Subset of theme fields used for PDF styling */
export type PdfTheme = {
  primary: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  bg: string;
  displayFont: string;
  bodyFont: string;
};

export type RsvpExportDocumentProps = {
  coupleNames: string; // "Ana & João"
  dateDisplay: string; // "12 de Outubro de 2026"
  locationName?: string; // "Quinta das Rosas"
  slug: string;
  responses: RsvpEntry[];
  theme: PdfTheme;
  documentType: "invitation" | "save-the-date";
};

// ---------------------------------------------------------------------------
// Font registration helper (best-effort, called before rendering)
// ---------------------------------------------------------------------------

const registeredFonts = new Set<string>();

/**
 * Attempts to register a Google Font family with @react-pdf/renderer.
 * Fetches the CSS from Google Fonts API (desktop UA to get TTF/OTF URLs),
 * parses out the first font file URL, and registers it.
 * Silently fails if the font cannot be loaded.
 */
export async function tryRegisterGoogleFont(
  familyName: string
): Promise<void> {
  if (!familyName || registeredFonts.has(familyName)) return;

  try {
    const encodedFamily = encodeURIComponent(familyName).replace(/%20/g, "+");
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@400;600;700&display=swap`;

    const cssRes = await fetch(cssUrl, {
      headers: {
        // Desktop UA so Google Fonts returns TTF/OTF (not WOFF2)
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!cssRes.ok) return;

    const css = await cssRes.text();

    // Parse font-face blocks and their URLs
    const fontFaceBlocks = css.match(/@font-face\s*\{[^}]+\}/g) ?? [];

    // Extract (weight → url) pairs
    const sources: { src: string; fontWeight: string }[] = [];
    for (const block of fontFaceBlocks) {
      const urlMatch = block.match(/url\(([^)]+)\)/);
      const weightMatch = block.match(/font-weight:\s*(\d+)/);
      if (urlMatch) {
        const url = urlMatch[1].replace(/['"]/g, "");
        const weight = weightMatch ? weightMatch[1] : "400";
        sources.push({ src: url, fontWeight: weight });
      }
    }

    if (sources.length === 0) return;

    Font.register({
      family: familyName,
      fonts: sources.map(({ src, fontWeight }) => ({
        src,
        fontWeight: parseInt(fontWeight, 10) as
          | 100
          | 200
          | 300
          | 400
          | 500
          | 600
          | 700
          | 800
          | 900,
      })),
    });

    registeredFonts.add(familyName);
  } catch {
    // Silently ignore — PDF will fall back to Helvetica
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(str: string | null | undefined, maxLen: number): string {
  if (!str) return "—";
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "…" : str;
}

// ---------------------------------------------------------------------------
// Styles factory (theme-aware)
// ---------------------------------------------------------------------------

function makeStyles(theme: PdfTheme) {
  const display = registeredFonts.has(theme.displayFont)
    ? theme.displayFont
    : "Helvetica";
  const body = registeredFonts.has(theme.bodyFont)
    ? theme.bodyFont
    : "Helvetica";

  return StyleSheet.create({
    page: {
      backgroundColor: "#ffffff",
      fontFamily: body,
      fontSize: 9,
      color: theme.textPrimary,
      paddingTop: 0,
      paddingBottom: 36,
      paddingHorizontal: 36,
    },

    // ── Header ──────────────────────────────────────────────────────────────
    accentBar: {
      backgroundColor: theme.primary,
      height: 5,
      marginHorizontal: -36,
      marginBottom: 20,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    coupleName: {
      fontFamily: display,
      fontSize: 22,
      color: theme.textPrimary,
      fontWeight: 700,
    },
    badgeBox: {
      backgroundColor: theme.accent,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      color: "#ffffff",
      fontSize: 7,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    metaRow: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 20,
    },
    metaText: {
      fontSize: 9,
      color: theme.textSecondary,
    },
    separator: {
      height: 1,
      backgroundColor: theme.primary,
      opacity: 0.2,
      marginBottom: 18,
    },

    // ── Stats ────────────────────────────────────────────────────────────────
    statsRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 22,
    },
    statBox: {
      flex: 1,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.primary,
      borderStyle: "solid",
      padding: 10,
      alignItems: "center",
    },
    statNumber: {
      fontFamily: display,
      fontSize: 20,
      fontWeight: 700,
      color: theme.primary,
    },
    statLabel: {
      fontSize: 7,
      color: theme.textMuted,
      marginTop: 2,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    // ── Table ────────────────────────────────────────────────────────────────
    tableHeader: {
      flexDirection: "row",
      backgroundColor: theme.primary,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 6,
      marginBottom: 2,
    },
    tableHeaderCell: {
      color: "#ffffff",
      fontSize: 7,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: "row",
      paddingHorizontal: 6,
      paddingVertical: 5,
      borderRadius: 3,
    },
    tableRowAlt: {
      backgroundColor: theme.cardBg,
    },
    tableCell: {
      fontSize: 8,
      color: theme.textPrimary,
    },
    tableCellMuted: {
      fontSize: 8,
      color: theme.textMuted,
    },

    // Column widths (must sum to ~100%)
    colNum: { width: "5%" },
    colName: { width: "22%" },
    colResponse: { width: "13%" },
    colEmail: { width: "22%" },
    colRestrictions: { width: "18%" },
    colMessage: { width: "12%" },
    colDate: { width: "8%" },

    attendingBadge: {
      backgroundColor: "#dcfce7",
      borderRadius: 3,
      paddingHorizontal: 4,
      paddingVertical: 1,
      alignSelf: "flex-start",
    },
    attendingText: {
      color: "#166534",
      fontSize: 7,
      fontWeight: 700,
    },
    declinedBadge: {
      backgroundColor: "#fee2e2",
      borderRadius: 3,
      paddingHorizontal: 4,
      paddingVertical: 1,
      alignSelf: "flex-start",
    },
    declinedText: {
      color: "#991b1b",
      fontSize: 7,
      fontWeight: 700,
    },

    // ── Footer ───────────────────────────────────────────────────────────────
    footer: {
      position: "absolute",
      bottom: 16,
      left: 36,
      right: 36,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: theme.primary,
      borderTopStyle: "solid",
      paddingTop: 8,
      opacity: 0.5,
    },
    footerText: {
      fontSize: 7,
      color: theme.textMuted,
    },

    // ── Empty state ──────────────────────────────────────────────────────────
    emptyBox: {
      padding: 24,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 10,
      color: theme.textMuted,
    },
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Header({
  styles,
  coupleNames,
  dateDisplay,
  locationName,
  documentType,
  theme,
}: {
  styles: ReturnType<typeof makeStyles>;
  coupleNames: string;
  dateDisplay: string;
  locationName?: string;
  documentType: "invitation" | "save-the-date";
  theme: PdfTheme;
}) {
  const label =
    documentType === "save-the-date"
      ? "Save the Date — Lista de Confirmações"
      : "Lista de Confirmações";

  return (
    <>
      <View style={styles.accentBar} />
      <View style={styles.headerRow}>
        <Text style={styles.coupleName}>{coupleNames}</Text>
        <View style={styles.badgeBox}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{dateDisplay}</Text>
        {locationName && (
          <Text style={styles.metaText}>· {locationName}</Text>
        )}
      </View>
      <View style={styles.separator} />
    </>
  );
}

function StatsBar({
  styles,
  total,
  attending,
  declined,
}: {
  styles: ReturnType<typeof makeStyles>;
  total: number;
  attending: number;
  declined: number;
}) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statBox}>
        <Text style={styles.statNumber}>{total}</Text>
        <Text style={styles.statLabel}>Total de Respostas</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={{ ...styles.statNumber, color: "#166534" }}>
          {attending}
        </Text>
        <Text style={styles.statLabel}>Confirmados</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={{ ...styles.statNumber, color: "#991b1b" }}>
          {declined}
        </Text>
        <Text style={styles.statLabel}>Não Vão</Text>
      </View>
    </View>
  );
}

function GuestTable({
  styles,
  responses,
}: {
  styles: ReturnType<typeof makeStyles>;
  responses: RsvpEntry[];
}) {
  if (responses.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>Sem respostas registadas.</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, styles.colNum]}>#</Text>
        <Text style={[styles.tableHeaderCell, styles.colName]}>Nome</Text>
        <Text style={[styles.tableHeaderCell, styles.colResponse]}>
          Resposta
        </Text>
        <Text style={[styles.tableHeaderCell, styles.colEmail]}>Email</Text>
        <Text style={[styles.tableHeaderCell, styles.colRestrictions]}>
          Restrições
        </Text>
        <Text style={[styles.tableHeaderCell, styles.colMessage]}>
          Mensagem
        </Text>
        <Text style={[styles.tableHeaderCell, styles.colDate]}>Data</Text>
      </View>

      {/* Rows */}
      {responses.map((r, i) => {
        const isAlt = i % 2 === 1;
        const rowStyle = isAlt
          ? [styles.tableRow, styles.tableRowAlt]
          : [styles.tableRow];

        return (
          <View key={r.id} style={rowStyle} wrap={false}>
            <Text style={[styles.tableCellMuted, styles.colNum]}>{i + 1}</Text>
            <Text style={[styles.tableCell, styles.colName]}>
              {truncate(r.guestName, 28)}
            </Text>
            <View style={styles.colResponse}>
              <View
                style={
                  r.attending ? styles.attendingBadge : styles.declinedBadge
                }
              >
                <Text
                  style={
                    r.attending ? styles.attendingText : styles.declinedText
                  }
                >
                  {r.attending ? "Sim" : "Não"}
                </Text>
              </View>
            </View>
            <Text style={[styles.tableCellMuted, styles.colEmail]}>
              {truncate(r.email, 28)}
            </Text>
            <Text style={[styles.tableCell, styles.colRestrictions]}>
              {truncate(r.dietaryRestrictions, 22)}
            </Text>
            <Text style={[styles.tableCellMuted, styles.colMessage]}>
              {r.message ? "✓" : "—"}
            </Text>
            <Text style={[styles.tableCellMuted, styles.colDate]}>
              {formatDate(r.submittedAt)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Footer({
  styles,
  slug,
}: {
  styles: ReturnType<typeof makeStyles>;
  slug: string;
}) {
  const today = new Date().toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        Brindel Studio · brindelstudio.pt
      </Text>
      <Text style={styles.footerText}>
        {slug} · {today}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main document component
// ---------------------------------------------------------------------------

export function RsvpExportDocument({
  coupleNames,
  dateDisplay,
  locationName,
  slug,
  responses,
  theme,
  documentType,
}: RsvpExportDocumentProps) {
  const styles = makeStyles(theme);
  const attending = responses.filter((r) => r.attending).length;
  const declined = responses.filter((r) => !r.attending).length;

  return (
    <Document
      title={`Confirmações — ${coupleNames}`}
      author="Brindel Studio"
      creator="Brindel Studio"
      producer="brindelstudio.pt"
      language="pt"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header
          styles={styles}
          coupleNames={coupleNames}
          dateDisplay={dateDisplay}
          locationName={locationName}
          documentType={documentType}
          theme={theme}
        />
        <StatsBar
          styles={styles}
          total={responses.length}
          attending={attending}
          declined={declined}
        />
        <GuestTable styles={styles} responses={responses} />
        <Footer styles={styles} slug={slug} />
      </Page>
    </Document>
  );
}
