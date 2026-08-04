-- CreateTable
CREATE TABLE "CustomFontFamily" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "cssFamily" TEXT NOT NULL,
    "fallbackCategory" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFontFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFontVariant" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "style" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFontVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomFontFamily_normalizedName_key" ON "CustomFontFamily"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFontFamily_cssFamily_key" ON "CustomFontFamily"("cssFamily");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFontVariant_objectKey_key" ON "CustomFontVariant"("objectKey");

-- CreateIndex
CREATE INDEX "CustomFontVariant_familyId_idx" ON "CustomFontVariant"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFontVariant_familyId_weight_style_key" ON "CustomFontVariant"("familyId", "weight", "style");

-- AddForeignKey
ALTER TABLE "CustomFontVariant" ADD CONSTRAINT "CustomFontVariant_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "CustomFontFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;
