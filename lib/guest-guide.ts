import type { GuestGuideItem } from "./types";

/**
 * The 12 predefined "Manual do bom convidado" items shown as a
 * checkbox grid in the admin editor and rendered on the invitation page.
 */
export const PREDEFINED_GUIDE_ITEMS: GuestGuideItem[] = [
  {
    id: "confirm-presence",
    label: "Confirme sua presença!",
    iconType: "lucide",
    iconName: "CheckCircle2",
  },
  {
    id: "no-photographer",
    label: "Não atrapalhe o fotógrafo!",
    iconType: "lucide",
    iconName: "Camera",
  },
  {
    id: "white-bride",
    label: "Branco é a cor da noiva!",
    iconType: "lucide",
    iconName: "Sparkles",
  },
  {
    id: "no-decor",
    label: "Não leve a decoração!",
    iconType: "lucide",
    iconName: "Flower",
  },
  {
    id: "no-plus-one",
    label: "Convidado não convida!",
    iconType: "lucide",
    iconName: "UserX",
  },
  {
    id: "wait-sweets",
    label: "Espere liberar a mesa dos doces!",
    iconType: "lucide",
    iconName: "Cake",
  },
  {
    id: "be-punctual",
    label: "Seja pontual!",
    iconType: "lucide",
    iconName: "Clock",
  },
  {
    id: "no-gossip",
    label: "Evite comentários maldosos!",
    iconType: "lucide",
    iconName: "MessageCircleOff",
  },
  {
    id: "attend-ceremony",
    label: "Vá também à cerimônia!",
    iconType: "lucide",
    iconName: "Church",
  },
  {
    id: "have-fun",
    label: "Divirta-se muito!",
    iconType: "lucide",
    iconName: "PartyPopper",
  },
  {
    id: "silent-phone",
    label: "Deixe o celular no silencioso!",
    iconType: "lucide",
    iconName: "BellOff",
  },
  {
    id: "say-goodbye",
    label: "Não saia sem se despedir dos noivos!",
    iconType: "lucide",
    iconName: "HeartHandshake",
  },
];

/** Returns true if the given item id belongs to the predefined set. */
export function isPredefinedItem(id: string): boolean {
  return PREDEFINED_GUIDE_ITEMS.some((p) => p.id === id);
}
