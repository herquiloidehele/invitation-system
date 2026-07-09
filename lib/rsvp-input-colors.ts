export interface RsvpInputColorConfig {
  inputBackgroundColor?: string;
  inputTextColor?: string;
  inputPlaceholderColor?: string;
  inputBorderColor?: string;
}

export interface RsvpInputColors {
  backgroundColor: string;
  textColor: string;
  placeholderColor: string;
  borderColor: string;
}

function pickColor(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export function resolveRsvpInputColors(
  config: RsvpInputColorConfig | null | undefined,
  defaults: RsvpInputColors,
): RsvpInputColors {
  return {
    backgroundColor: pickColor(
      config?.inputBackgroundColor,
      defaults.backgroundColor,
    ),
    textColor: pickColor(config?.inputTextColor, defaults.textColor),
    placeholderColor: pickColor(
      config?.inputPlaceholderColor,
      defaults.placeholderColor,
    ),
    borderColor: pickColor(config?.inputBorderColor, defaults.borderColor),
  };
}
