// Curated Unsplash photo references for the landing page. All URLs use stable
// photo IDs and request a cropped, web-optimised variant.

function unsplash(id: string, width = 900) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;
}

export const landingImages = {
  saveTheDate: "/images/1.jpg", // sunset couple silhouette
  wedding: "/images/2.jpg", // bride and groom holding hands
  engagement: "/images/3.jpg", // engagement rings macro
  personalisationA: unsplash("1519741497674-611481863552", 400),
  personalisationB: unsplash("1525772764200-be829a350797", 400),
  personalisationC: unsplash("1531058020387-3be344556be6", 400), // wedding stationery
  guestPortraitA: unsplash("1534528741775-53994a69daeb", 240),
  guestPortraitB: unsplash("1507003211169-0a1dd7228f2d", 240),
  guestPortraitC: unsplash("1438761681033-6461ffad8d80", 240),
};
