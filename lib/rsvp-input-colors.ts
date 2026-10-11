export interface RsvpInputColorConfig {
  inputBackgroundColor?: string;
  inputTextColor?: string;
  inputPlaceholderColor?: string;
  inputBorderColor?: string;
  inputSwitchLabelColor?: string;
}

export interface RsvpInputBaseColors {
  backgroundColor: string;
  textColor: string;
  placeholderColor: string;
  borderColor: string;
}

export interface RsvpInputColors extends RsvpInputBaseColors {
  /** The Sim/Não text inside a switch field; follows `textColor` until set. */
  switchLabelColor: string;
}

function pickColor(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export function resolveRsvpInputColors(
  config: RsvpInputColorConfig | null | undefined,
  defaults: RsvpInputBaseColors,
): RsvpInputColors {
  const textColor = pickColor(config?.inputTextColor, defaults.textColor);
  return {
    backgroundColor: pickColor(
      config?.inputBackgroundColor,
      defaults.backgroundColor,
    ),
    textColor,
    placeholderColor: pickColor(
      config?.inputPlaceholderColor,
      defaults.placeholderColor,
    ),
    borderColor: pickColor(config?.inputBorderColor, defaults.borderColor),
    switchLabelColor: pickColor(config?.inputSwitchLabelColor, textColor),
  };
}
