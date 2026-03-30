-- CreateTable
CREATE TABLE "GiftCategory" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftItem" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" DOUBLE PRECISION,
    "link" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GiftCategory_invitationId_idx" ON "GiftCategory"("invitationId");

-- CreateIndex
CREATE INDEX "GiftItem_categoryId_idx" ON "GiftItem"("categoryId");

-- AddForeignKey
ALTER TABLE "GiftCategory" ADD CONSTRAINT "GiftCategory_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftItem" ADD CONSTRAINT "GiftItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GiftCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
