CREATE TABLE "LandingGallerySettings" (
    "id" TEXT NOT NULL,
    "fullyCustomizableFeatures" JSONB NOT NULL,
    "preDesignedFeatures" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingGallerySettings_pkey" PRIMARY KEY ("id")
);
