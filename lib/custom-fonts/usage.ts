function stringContainsCssFamily(value: string, cssFamily: string): boolean {
  return value.split(",").some((part) => {
    const family = part
      .trim()
      .replace(/^['"]|['"]$/g, "")
      .trim();
    return family === cssFamily;
  });
}

export function containsCssFamily(
  value: unknown,
  cssFamily: string,
  seen = new WeakSet<object>(),
): boolean {
  if (typeof value === "string") {
    return stringContainsCssFamily(value, cssFamily);
  }
  if (value === null || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.some((item) => containsCssFamily(item, cssFamily, seen));
  }
  return Object.values(value).some((item) =>
    containsCssFamily(item, cssFamily, seen),
  );
}

export interface CustomFontUsage {
  kind: "theme" | "invitation" | "save-the-date-theme" | "save-the-date";
  id: string;
  label: string;
}

export async function findCustomFontUsages(
  cssFamily: string,
): Promise<CustomFontUsage[]> {
  const [themes, invitations, saveTheDateThemes, saveTheDates] =
    await Promise.all([
      prisma.theme.findMany({
        select: {
          id: true,
          name: true,
          displayFont: true,
          bodyFont: true,
          scriptFont: true,
          uiFont: true,
          sectionTitleFont: true,
        },
      }),
      prisma.invitation.findMany({
        select: {
          id: true,
          slug: true,
          textStyles: true,
          heroTextLayer: true,
        },
      }),
      prisma.saveTheDateTheme.findMany({
        select: {
          id: true,
          name: true,
          titleFont: true,
          coupleFont: true,
          dateFont: true,
        },
      }),
      prisma.saveTheDate.findMany({
        select: { id: true, slug: true, textStyles: true },
      }),
    ]);

  const usages: CustomFontUsage[] = [];
  for (const theme of themes) {
    if (
      [
        theme.displayFont,
        theme.bodyFont,
        theme.scriptFont,
        theme.uiFont,
        theme.sectionTitleFont,
      ].some((value) => containsCssFamily(value, cssFamily))
    ) {
      usages.push({ kind: "theme", id: theme.id, label: theme.name });
    }
  }
  for (const invitation of invitations) {
    if (
      containsCssFamily(invitation.textStyles, cssFamily) ||
      containsCssFamily(invitation.heroTextLayer, cssFamily)
    ) {
      usages.push({
        kind: "invitation",
        id: invitation.id,
        label: invitation.slug,
      });
    }
  }
  for (const theme of saveTheDateThemes) {
    if (
      [theme.titleFont, theme.coupleFont, theme.dateFont].some((value) =>
        containsCssFamily(value, cssFamily),
      )
    ) {
      usages.push({
        kind: "save-the-date-theme",
        id: theme.id,
        label: theme.name,
      });
    }
  }
  for (const saveTheDate of saveTheDates) {
    if (containsCssFamily(saveTheDate.textStyles, cssFamily)) {
      usages.push({
        kind: "save-the-date",
        id: saveTheDate.id,
        label: saveTheDate.slug,
      });
    }
  }

  return usages.sort(
    (left, right) =>
      left.kind.localeCompare(right.kind) || left.label.localeCompare(right.label),
  );
}
import { prisma } from "@/lib/db";
