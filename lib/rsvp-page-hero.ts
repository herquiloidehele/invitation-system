export interface RsvpHeroInputs {
  adminBackgroundOverride?: string;
  cinematicImageUrl?: string;
  videoUrl?: string;
  videoPoster?: string;
}

export function pickRsvpHeroSource(inputs: RsvpHeroInputs): string | null {
  if (inputs.adminBackgroundOverride) return inputs.adminBackgroundOverride;
  if (inputs.cinematicImageUrl) return inputs.cinematicImageUrl;
  if (inputs.videoPoster) return inputs.videoPoster;
  return null;
}
