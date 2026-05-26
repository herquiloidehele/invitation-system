import type { LocationInfo } from "./types";

export interface ResolvedLocation {
  name?: string;
  address?: string;
  googleMapsUrl?: string;
  wazeUrl?: string;
  latitude?: number;
  longitude?: number;
}

export function mergeResolvedLocation(
  existing: LocationInfo | undefined,
  resolved: ResolvedLocation,
): LocationInfo {
  return {
    name: resolved.name || existing?.name || "",
    address: resolved.address || existing?.address || "",
    googleMapsUrl: resolved.googleMapsUrl || existing?.googleMapsUrl || "",
    wazeUrl: resolved.wazeUrl || existing?.wazeUrl || "",
    latitude: resolved.latitude ?? existing?.latitude,
    longitude: resolved.longitude ?? existing?.longitude,
    imageUrl: existing?.imageUrl || "",
    mapZoom: existing?.mapZoom ?? 17,
  };
}
