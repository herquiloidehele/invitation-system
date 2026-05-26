import { describe, expect, it } from "vitest";
import { mergeResolvedLocation } from "../lib/location-resolver";

describe("mergeResolvedLocation", () => {
  it("fills resolved fields while preserving image and map zoom", () => {
    const location = mergeResolvedLocation(
      {
        name: "Old venue",
        address: "Old address",
        googleMapsUrl: "https://maps.google.com/old",
        wazeUrl: "https://waze.com/old",
        latitude: 1,
        longitude: 2,
        imageUrl: "https://cdn.example.com/location.jpg",
        mapZoom: 14,
      },
      {
        name: "Resolved venue",
        address: "Resolved address",
        googleMapsUrl: "https://maps.google.com/resolved",
        wazeUrl: "https://waze.com/resolved",
        latitude: 40.1,
        longitude: -8.6,
      },
    );

    expect(location).toEqual({
      name: "Resolved venue",
      address: "Resolved address",
      googleMapsUrl: "https://maps.google.com/resolved",
      wazeUrl: "https://waze.com/resolved",
      latitude: 40.1,
      longitude: -8.6,
      imageUrl: "https://cdn.example.com/location.jpg",
      mapZoom: 14,
    });
  });
});
