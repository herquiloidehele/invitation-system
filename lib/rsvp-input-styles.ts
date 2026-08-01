import type { CSSProperties } from "react";
import type { RsvpInputColors } from "./rsvp-input-colors";

export type RsvpInputStyle = "default" | "minimal" | "soft";
export type RsvpInputRenderer = "modal" | "page";

export interface RsvpInputStyleConfig {
  inputClassName: string;
  inputStyle: CSSProperties;
  focusStyle: CSSProperties;
  choiceClassName: string;
  choiceStyle: (selected: boolean) => CSSProperties;
  switchClassName: string;
  switchStyle: CSSProperties;
}

export interface RsvpSubmitStyleOptions {
  backgroundColor: string;
  textColor: string;
  radius: string;
  accentColor: string;
}

export interface RsvpSubmitStyleConfig {
  className: string;
  style: CSSProperties;
}

const MODAL_DEFAULT_INPUT_CLASS =
  "w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-[border-color,box-shadow] focus:ring-2 focus:ring-offset-1";
const PAGE_DEFAULT_INPUT_CLASS =
  "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-[border-color,box-shadow] focus:ring-2 focus:ring-offset-1";
const MINIMAL_INPUT_CLASS =
  "w-full rounded-none border-0 border-b-1 px-0 py-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-[var(--rsvp-focus-color)] focus:ring-0 focus:ring-offset-0";
const SOFT_INPUT_CLASS =
  "w-full rounded-xl border-0 px-3 py-2.5 text-sm outline-none shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-[background-color,box-shadow] focus:ring-2 focus:ring-offset-1";

const MODAL_DEFAULT_CHOICE_CLASS =
  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-[background-color,border-color,box-shadow] focus-within:ring-2 focus-within:ring-offset-1";
const PAGE_DEFAULT_CHOICE_CLASS =
  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition-[background-color,border-color,box-shadow] focus-within:ring-2 focus-within:ring-offset-1";
const MINIMAL_CHOICE_CLASS =
  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-none border-0 border-b-1 px-4 py-2.5 text-sm transition-[background-color,border-color,box-shadow] focus-within:border-[var(--rsvp-focus-color)]";
const SOFT_CHOICE_CLASS =
  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 px-4 py-2.5 text-sm shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-[background-color,box-shadow] focus-within:ring-2 focus-within:ring-offset-1";
const MODAL_SUBMIT_BASE_CLASS =
  "mt-2 flex w-full items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-[background-color,border-color,box-shadow,opacity] disabled:opacity-60";
const PAGE_SUBMIT_BASE_CLASS =
  "mt-1 flex w-full items-center justify-center gap-2 py-3.5 text-sm font-medium transition-[background-color,border-color,box-shadow,opacity] disabled:opacity-60 hover:opacity-85";

function cssVariables(accentColor: string): CSSProperties {
  return {
    "--rsvp-focus-color": accentColor,
    "--tw-ring-color": `${accentColor}55`,
  } as CSSProperties;
}

function isRsvpInputStyle(value: unknown): value is RsvpInputStyle {
  return value === "default" || value === "minimal" || value === "soft";
}

export function resolveRsvpInputStyle(
  value: unknown,
  colors: RsvpInputColors,
  accentColor: string,
  hasCustomBackground = false,
  renderer: RsvpInputRenderer = "modal",
): RsvpInputStyleConfig {
  const style: RsvpInputStyle = isRsvpInputStyle(value) ? value : "default";
  const focusStyle = cssVariables(accentColor);
  const defaultInputClass =
    renderer === "page" ? PAGE_DEFAULT_INPUT_CLASS : MODAL_DEFAULT_INPUT_CLASS;
  const defaultChoiceClass =
    renderer === "page"
      ? PAGE_DEFAULT_CHOICE_CLASS
      : MODAL_DEFAULT_CHOICE_CLASS;
  const selectedChoiceBackground =
    renderer === "page" ? `${accentColor}18` : `${accentColor}15`;
  const fieldBackground =
    style === "minimal" && !hasCustomBackground
      ? "transparent"
      : colors.backgroundColor;

  const baseInputStyle: CSSProperties = {
    backgroundColor: fieldBackground,
    borderColor: colors.borderColor,
    color: colors.textColor,
    ...focusStyle,
  };

  if (style === "minimal") {
    const choiceStyle = (selected: boolean): CSSProperties => ({
      backgroundColor: selected ? `${accentColor}15` : "transparent",
      borderBottomColor: selected ? accentColor : colors.borderColor,
      color: colors.textColor,
      ...focusStyle,
    });

    return {
      inputClassName: MINIMAL_INPUT_CLASS,
      inputStyle: {
        ...baseInputStyle,
        borderColor: colors.borderColor,
        borderBottomColor: colors.borderColor,
      },
      focusStyle,
      choiceClassName: MINIMAL_CHOICE_CLASS,
      choiceStyle,
      switchClassName:
        "flex items-center justify-between gap-3 border-0 border-b-2 px-0 py-2.5 text-sm transition-[background-color,border-color,box-shadow]",
      switchStyle: {
        ...baseInputStyle,
        borderColor: colors.borderColor,
        borderBottomColor: colors.borderColor,
      },
    };
  }

  if (style === "soft") {
    const choiceStyle = (selected: boolean): CSSProperties => ({
      backgroundColor: selected ? `${accentColor}15` : fieldBackground,
      borderColor: "transparent",
      color: colors.textColor,
      ...focusStyle,
    });

    return {
      inputClassName: SOFT_INPUT_CLASS,
      inputStyle: {
        ...baseInputStyle,
        borderColor: "transparent",
      },
      focusStyle,
      choiceClassName: SOFT_CHOICE_CLASS,
      choiceStyle,
      switchClassName:
        "flex items-center justify-between gap-3 rounded-xl border-0 px-3 py-2.5 text-sm shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-[background-color,box-shadow]",
      switchStyle: {
        ...baseInputStyle,
        borderColor: "transparent",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)",
      },
    };
  }

  const choiceStyle = (selected: boolean): CSSProperties => ({
    backgroundColor: selected ? selectedChoiceBackground : "transparent",
    borderColor: selected ? accentColor : colors.borderColor,
    color: colors.textColor,
    ...focusStyle,
  });

  return {
    inputClassName: defaultInputClass,
    inputStyle: baseInputStyle,
    focusStyle,
    choiceClassName: defaultChoiceClass,
    choiceStyle,
    switchClassName:
      "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition-[background-color,border-color,box-shadow]",
    switchStyle: {
      ...baseInputStyle,
      borderColor: colors.borderColor,
    },
  };
}

export function resolveRsvpSubmitStyle(
  value: unknown,
  options: RsvpSubmitStyleOptions,
  renderer: RsvpInputRenderer = "modal",
): RsvpSubmitStyleConfig {
  const style: RsvpInputStyle = isRsvpInputStyle(value) ? value : "default";
  const baseClassName =
    renderer === "page" ? PAGE_SUBMIT_BASE_CLASS : MODAL_SUBMIT_BASE_CLASS;

  if (style === "minimal") {
    return {
      className: `${baseClassName} px-6`,
      style: {
        background: options.backgroundColor,
        borderRadius: "6px",
        color: options.textColor,
      },
    };
  }

  if (style === "soft") {
    return {
      className: `${baseClassName} shadow-[0_8px_20px_rgba(0,0,0,0.12)]`,
      style: {
        background: options.backgroundColor,
        borderRadius: options.radius,
        color: options.textColor,
      },
    };
  }

  return {
    className: baseClassName,
    style: {
      background: options.backgroundColor,
      borderRadius: options.radius,
      color: options.textColor,
    },
  };
}
