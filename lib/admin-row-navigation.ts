export const getInvitationEditPath = (id: string) =>
  `/admin/invitations/${id}/edit`;

export const getInvitationDuplicatePath = (id: string) =>
  `/admin/invitations/${id}/duplicate`;

export const getSaveTheDateEditPath = (id: string) =>
  `/admin/save-the-dates/${id}/edit`;

export const getInvitationRsvpPath = (slug: string) =>
  `/admin/rsvps?tab=invitations&invitation=${slug}`;

export const getSaveTheDateRsvpPath = (slug: string) =>
  `/admin/rsvps?tab=std&std=${slug}`;
