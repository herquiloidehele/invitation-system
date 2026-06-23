import { NextRequest, NextResponse } from "next/server";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asObj(val: unknown): Record<string, unknown> {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return {};
}

function str(val: unknown, fallback = ""): string {
  return typeof val === "string" ? val : fallback;
}

// ---------------------------------------------------------------------------
// Default PDF theme (Brindel Studio brand colours) used as fallback
// ---------------------------------------------------------------------------

const DEFAULT_PDF_THEME = {
  primary: "#96643a",
  accent: "#b8845c",
  textPrimary: "#1b1b1b",
  textSecondary: "#6b4c30",
  textMuted: "#9e8272",
  cardBg: "#f5ede0",
  bg: "#fffdf9",
  displayFont: "Georgia",
  bodyFont: "Helvetica",
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  // Dynamically import all PDF code — this keeps @react-pdf/renderer bundled
  // by webpack as a single async chunk (avoids ESM/CJS require() conflicts).
  const [
    { renderToBuffer },
    React,
    { RsvpExportDocument, tryRegisterGoogleFont },
  ] = await Promise.all([
    import("@react-pdf/renderer"),
    import("react"),
    import("@/components/pdf/RsvpExportDocument"),
  ]);

  // ── Try Invitation ────────────────────────────────────────────────────────
  const invitation = await prisma.invitation.findUnique({
    where: { ownerToken: token },
    include: {
      rsvpResponses: { orderBy: { submittedAt: "desc" } },
      theme: true,
    },
  });

  if (invitation) {
    const couple = asObj(invitation.couple);
    const coupleNames = `${str(couple.bride, "Noiva")} & ${str(couple.groom, "Noivo")}`;
    const dateDisplay = str(asObj(invitation.date).display);
    const locationName = str(asObj(invitation.location).name);

    const t = invitation.theme;
    const pdfTheme = {
      primary: t?.primary ?? DEFAULT_PDF_THEME.primary,
      accent: t?.accent ?? DEFAULT_PDF_THEME.accent,
      textPrimary: DEFAULT_PDF_THEME.textPrimary,
      textSecondary: t?.textSecondary ?? DEFAULT_PDF_THEME.textSecondary,
      textMuted: t?.textMuted ?? DEFAULT_PDF_THEME.textMuted,
      cardBg: t?.cardBg ?? DEFAULT_PDF_THEME.cardBg,
      bg: t?.bg ?? DEFAULT_PDF_THEME.bg,
      displayFont: t?.displayFont ?? DEFAULT_PDF_THEME.displayFont,
      bodyFont: t?.bodyFont ?? DEFAULT_PDF_THEME.bodyFont,
    };

    await Promise.all([
      tryRegisterGoogleFont(pdfTheme.displayFont),
      tryRegisterGoogleFont(pdfTheme.bodyFont),
    ]);

    const responses = invitation.rsvpResponses.map((r) => ({
      id: r.id,
      guestName: r.guestName,
      email: r.email,
      attending: r.attending,
      dietaryRestrictions: r.dietaryRestrictions,
      companion: r.companion,
      message: r.message,
      customAnswers: r.customAnswers,
      submittedAt: r.submittedAt,
    }));

    const document = React.createElement(RsvpExportDocument, {
      coupleNames,
      dateDisplay,
      locationName,
      slug: invitation.slug,
      responses,
      theme: pdfTheme,
      documentType: "invitation",
    }) as ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(document);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="confirmacoes-${invitation.slug}.pdf"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  }

  // ── Try Save the Date ─────────────────────────────────────────────────────
  const std = await prisma.saveTheDate.findUnique({
    where: { ownerToken: token },
    include: {
      rsvpResponses: { orderBy: { submittedAt: "desc" } },
      theme: true,
    },
  });

  if (std) {
    const couple = asObj(std.couple);
    const coupleNames = `${str(couple.bride, "Noiva")} & ${str(couple.groom, "Noivo")}`;
    const dateDisplay = str(asObj(std.date).display);

    const t = std.theme;
    const pdfTheme = {
      primary: t.heartColor,
      accent: t.heartColor,
      textPrimary: t.textColor,
      textSecondary: t.textColor,
      textMuted: "#888888",
      cardBg: "#f9f9f9",
      bg: t.bgColor,
      displayFont: t.coupleFont,
      bodyFont: t.titleFont,
    };

    await Promise.all([
      tryRegisterGoogleFont(t.coupleFont),
      tryRegisterGoogleFont(t.titleFont),
    ]);

    const responses = std.rsvpResponses.map((r) => ({
      id: r.id,
      guestName: r.guestName,
      email: r.email,
      attending: r.attending,
      dietaryRestrictions: r.dietaryRestrictions,
      companion: r.companion,
      message: r.message,
      customAnswers: r.customAnswers,
      submittedAt: r.submittedAt,
    }));

    const document = React.createElement(RsvpExportDocument, {
      coupleNames,
      dateDisplay,
      slug: std.slug,
      responses,
      theme: pdfTheme,
      documentType: "save-the-date",
    }) as ReactElement<DocumentProps>;
    const buffer = await renderToBuffer(document);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="confirmacoes-std-${std.slug}.pdf"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
