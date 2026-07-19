import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  buildInvitationCreateData,
  type InvitationCreateBody,
} from "@/lib/invitation-create-data";
import {
  INVITATION_SLUG_PATTERN,
  buildDuplicateThemeData,
  buildDuplicateThemeName,
  isSameInvitationCustomer,
} from "@/lib/invitation-duplication";
import {
  buildInvitationDisplayName,
  isWeddingEventType,
  normalizeInvitationEventType,
} from "@/lib/invitation-event-types";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = (await request.json()) as InvitationCreateBody;
    const source = await prisma.invitation.findUnique({
      where: { id },
      select: { couple: true, eventType: true },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    const couple = body.couple;
    const eventType = normalizeInvitationEventType(body.eventType);
    const wedding = isWeddingEventType(eventType);

    if (!couple?.bride?.trim() || (wedding && !couple.groom?.trim())) {
      return NextResponse.json(
        { error: "Customer name is required", field: "couple" },
        { status: 400 },
      );
    }

    if (
      isSameInvitationCustomer(
        {
          eventType: normalizeInvitationEventType(source.eventType),
          couple: source.couple as unknown as InvitationCreateBody["couple"],
        },
        { eventType, couple },
      )
    ) {
      return NextResponse.json(
        {
          error: "Change the customer name before duplicating",
          field: "couple",
        },
        { status: 400 },
      );
    }

    if (!body.slug || !INVITATION_SLUG_PATTERN.test(body.slug)) {
      return NextResponse.json(
        {
          error: "Slug must use lowercase kebab-case",
          field: "slug",
        },
        { status: 400 },
      );
    }

    if (!body.themeId) {
      return NextResponse.json({ error: "Select a theme" }, { status: 400 });
    }

    const [slugTaken, selectedTheme] = await Promise.all([
      prisma.invitation.findUnique({
        where: { slug: body.slug },
        select: { id: true },
      }),
      prisma.theme.findUnique({ where: { id: body.themeId } }),
    ]);

    if (slugTaken) {
      return NextResponse.json(
        {
          error: `Slug "${body.slug}" already exists`,
          field: "slug",
        },
        { status: 409 },
      );
    }

    if (!selectedTheme) {
      return NextResponse.json(
        { error: "Selected theme no longer exists" },
        { status: 400 },
      );
    }

    const customerDisplayName = buildInvitationDisplayName({
      eventType,
      primaryName: body.couple.bride,
      secondaryName: body.couple.groom,
    });

    const invitation = await prisma.$transaction(async (tx) => {
      let suffix = 1;
      let themeName = buildDuplicateThemeName(
        selectedTheme.name,
        body.slug,
        suffix,
      );

      while (
        await tx.theme.findUnique({
          where: { name: themeName },
          select: { id: true },
        })
      ) {
        suffix += 1;
        themeName = buildDuplicateThemeName(
          selectedTheme.name,
          body.slug,
          suffix,
        );
      }

      const copiedTheme = await tx.theme.create({
        data: buildDuplicateThemeData(
          selectedTheme,
          themeName,
          customerDisplayName,
        ),
      });
      const data = buildInvitationCreateData(body, copiedTheme.id);

      Object.assign(data, {
        isDemo: false,
        priceFromCents: null,
        discountPriceFromCents: null,
        currency: "EUR",
        priceOverrides: Prisma.JsonNull,
        landingModelName: null,
        landingImageUrl: null,
        landingDescription: null,
        landingSubtitle: null,
        landingTranslations: Prisma.JsonNull,
        landingCustomizationLevel: "fully_customizable",
      });

      return tx.invitation.create({
        data,
        select: { id: true },
      });
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "Invitation slug already exists", field: "slug" },
        { status: 409 },
      );
    }

    console.error("[Admin API] Error duplicating invitation:", error);
    return NextResponse.json(
      { error: "Failed to duplicate invitation" },
      { status: 500 },
    );
  }
}
