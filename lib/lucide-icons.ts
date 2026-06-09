import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import type { LucideProps } from "lucide-react";

export type LucideIconName = keyof typeof dynamicIconImports;

type LucideIconComponent = ComponentType<LucideProps>;

const LEGACY_ICON_ALIASES: Record<string, string> = {
  "flower-off": "flower",
};

const rawLucideIconNames = Object.keys(dynamicIconImports) as LucideIconName[];

const LUCIDE_ICON_NAMES = [...rawLucideIconNames].sort((a, b) =>
  a.localeCompare(b),
);

export const LUCIDE_ICON_INPUT_OPTIONS = Array.from(
  new Set(LUCIDE_ICON_NAMES.map(formatLucideIconNameForInput)),
).sort((a, b) => a.localeCompare(b));

const DYNAMIC_LUCIDE_ICONS = Object.fromEntries(
  rawLucideIconNames.map((iconName) => [
    iconName,
    dynamic(dynamicIconImports[iconName]),
  ]),
) as Record<LucideIconName, LucideIconComponent>;

export function resolveLucideIconName(
  iconName?: string,
): LucideIconName | undefined {
  if (!iconName) return undefined;

  const normalized = normalizeLucideIconName(iconName);
  if (!normalized) return undefined;

  const aliasedName = LEGACY_ICON_ALIASES[normalized] ?? normalized;

  if (aliasedName in dynamicIconImports) {
    return aliasedName as LucideIconName;
  }

  return undefined;
}

export function getLucideIconComponent(
  iconName?: string,
): LucideIconComponent | undefined {
  const resolvedName = resolveLucideIconName(iconName);
  if (!resolvedName) return undefined;

  return DYNAMIC_LUCIDE_ICONS[resolvedName];
}

function formatLucideIconNameForInput(iconName: string): string {
  return iconName
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function normalizeLucideIconName(iconName: string): string {
  return iconName
    .trim()
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])(\d)/g, "$1-$2")
    .replace(/(\d)([a-zA-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}
