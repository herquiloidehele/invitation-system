"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildAndroidBrowserIntent,
  buildInstagramIOSBrowserUrl,
  getMobilePlatform,
  isInstagramWebView,
  shouldShowInstagramBrowserDialog,
  type MobilePlatform,
} from "@/lib/instagram-webview";

const subscribeToBrowserEnvironment = () => () => undefined;
const getServerSnapshot = () => false;

function getInstagramBrowserSnapshot() {
  return (
    window.self === window.top &&
    isInstagramWebView(navigator.userAgent || navigator.vendor || "")
  );
}

export function InstagramBrowserRedirect() {
  const t = useTranslations("LandingInstagramBrowserRedirect");
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isInstagramBrowser = useSyncExternalStore(
    subscribeToBrowserEnvironment,
    getInstagramBrowserSnapshot,
    getServerSnapshot,
  );
  const isOpen = shouldShowInstagramBrowserDialog(
    isInstagramBrowser,
    dismissed,
  );
  const platform: MobilePlatform = isInstagramBrowser
    ? getMobilePlatform(navigator.userAgent || navigator.vendor || "")
    : "other";
  const currentUrl = isInstagramBrowser ? window.location.href : "#";
  const externalBrowserUrl =
    platform === "android"
      ? buildAndroidBrowserIntent(currentUrl)
      : platform === "ios"
        ? buildInstagramIOSBrowserUrl(currentUrl)
        : currentUrl;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => undefined}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] gap-5 rounded-2xl p-6 sm:max-w-md"
      >
        <DialogHeader className="items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ExternalLink className="size-6" aria-hidden="true" />
          </span>
          <DialogTitle className="text-xl">{t("title")}</DialogTitle>
          <DialogDescription className="max-w-sm leading-relaxed">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <a
          href={externalBrowserUrl}
          target={platform === "other" ? "_blank" : undefined}
          rel={platform === "other" ? "noopener noreferrer" : undefined}
          onClick={() => setDismissed(true)}
          className={buttonVariants({
            className: "h-12 w-full text-base",
          })}
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          {t("openBrowser")}
        </a>

        <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{t("fallbackTitle")}</p>
          <p className="mt-1 leading-relaxed">
            {t.rich("fallbackDescription", {
              menu: () => <strong>⋯</strong>,
              open: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>

        <Button
          variant="outline"
          className="h-11 w-full"
          onClick={copyLink}
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied ? t("copiedLink") : t("copyLink")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
