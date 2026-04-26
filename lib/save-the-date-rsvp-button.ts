export function getSaveTheDateRsvpButtonBackground<Theme extends {
  rsvpButtonBgColor: string;
}>(theme: Theme) {
  return theme.rsvpButtonBgColor;
}
