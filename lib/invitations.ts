import type { InvitationData } from "./types";

import keziaRuben from "@/data/invitations/kezia-ruben.json";
import anaMiguel from "@/data/invitations/ana-miguel.json";
import sofiaPedro from "@/data/invitations/sofia-pedro.json";
import leonorDiogo from "@/data/invitations/leonor-diogo.json";

const invitations: InvitationData[] = [
  keziaRuben as InvitationData,
  anaMiguel as InvitationData,
  sofiaPedro as InvitationData,
  leonorDiogo as InvitationData,
];

export function getInvitation(slug: string): InvitationData | null {
  return invitations.find((inv) => inv.slug === slug) ?? null;
}

export function getAllInvitations(): InvitationData[] {
  return invitations;
}
