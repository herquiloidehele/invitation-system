"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import logo from "@/design/logo.jpg";
import { LocaleCurrencyMenu } from "@/components/landing/LocaleCurrencyMenu";
import { getLandingProductDetailContentKeys } from "@/lib/landing-product-details";
import type { LandingProductDetails } from "@/lib/landing-product-details-data";
import type { Currency } from "@/lib/currency/config";
import { MobileRequestBar } from "./MobileRequestBar";
import { ProductDetailsPanel } from "./ProductDetailsPanel";
import { ProductMediaGallery } from "./ProductMediaGallery";
import { ProductPreviewDialog } from "./ProductPreviewDialog";

export function LandingProductDetailsPage({
  details,
  currentCurrency,
  modelsHref,
}: {
  details: LandingProductDetails;
  currentCurrency: Currency;
  modelsHref: string;
}) {
  const t = useTranslations("LandingProductDetails");
  const [previewOpen, setPreviewOpen] = useState(false);
  const contentKeys = getLandingProductDetailContentKeys(
    details.kind,
    details.customizationLevel,
  );
  const tags = contentKeys.tagKeys.map((key) => t(key));
  const accordionItems = [
    {
      title: t("includedTitle"),
      body: t(contentKeys.includedBodyKey),
    },
    {
      title: t("customizationTitle"),
      body: t(contentKeys.customizationBodyKey),
    },
    { title: t("orderingTitle"), body: t("orderingBody") },
  ];

  return (
    <main className="min-h-screen bg-background pb-24 font-[var(--font-outfit)] text-foreground lg:pb-0">
      <header className="border-b border-border/70 bg-background/95">
        <nav className="mx-auto flex h-[76px] max-w-[94rem] items-center justify-between px-5 sm:px-8 lg:px-10">
          <a
            href={modelsHref}
            className="group inline-flex min-h-10 items-center gap-2 rounded-full text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{t("backToModels")}</span>
          </a>

          <a
            href={modelsHref.split("#")[0] || "/"}
            aria-label="Brindeal"
            className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
          >
            <Image
              src={logo}
              alt=""
              width={40}
              height={40}
              priority
              className="rounded-full shadow-[0_8px_24px_color-mix(in_srgb,var(--foreground)_8%,transparent)] outline outline-1 -outline-offset-1 outline-black/10"
            />
            <span className="hidden text-lg font-semibold tracking-[-0.04em] sm:inline">
              brindeal
            </span>
          </a>

          <LocaleCurrencyMenu currentCurrency={currentCurrency} />
        </nav>
      </header>

      <div className="mx-auto max-w-[94rem] px-4 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,.65fr)] lg:gap-6 xl:gap-10">
          <ProductMediaGallery
            title={details.title}
            images={details.images}
            selectImageLabel={(position) => t("selectImage", { position })}
          />
          <ProductDetailsPanel
            details={details}
            eyebrow={t(contentKeys.eyebrowKey)}
            tags={tags}
            accordionItems={accordionItems}
            requestLabel={t("requestViaWhatsapp")}
            previewLabel={t("viewLive")}
            onPreview={() => setPreviewOpen(true)}
          />
        </div>
      </div>

      <MobileRequestBar
        whatsappHref={details.whatsappHref}
        label={t("requestViaWhatsapp")}
      />
      <ProductPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={details.title}
        previewHref={details.previewHref}
        previewTitle={t("previewTitle", { title: details.title })}
        closeLabel={t("closePreview")}
        openFullScreenLabel={t("openFullScreen")}
      />
    </main>
  );
}
